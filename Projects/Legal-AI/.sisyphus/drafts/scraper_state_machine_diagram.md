# Scraper System State Machine Diagram

**Project**: Legal-AI Scraper
**Created**: 2026-02-03
**Purpose**: Document major system states for crawler operations and lifecycle management

---

## Overview

The Legal-AI scraper system operates on a state machine pattern with the following major components:

1. **Crawler Workers** - Async background processes that fetch, process, and save data
2. **PostgresStateManager** - Tracks crawler state in PostgreSQL database
3. **RateLimiter** - Enforces API rate limits across all crawlers
4. **CLI Controller** - Click-based command line interface

---

## State Transitions

### Global Crawler States

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Start crawler
    Idle --> Running: Execute crawl
    Running --> Fetching: Start API requests
    Fetching --> Processing: Parse and validate data
    Processing --> Saving: Store to database
    Saving --> Fetching: Continue pagination
    Saving --> Idle: No more data
    Fetching --> Error: Request failed
    Processing --> Error: Invalid data
    Saving --> Error: Database error
    Error --> Resuming: On retry
    Error --> Paused: On user stop
    Resuming --> Fetching: Resume from checkpoint
    Paused --> [*]: Crawler stopped
    Running --> Completed: Success finish
\`\`\`

---

## Detailed State Descriptions

### 1. Idle State

**Description**: Crawler initialized but not actively running.

**Entry Conditions**:
- CLI command executed with `--no-resume` flag
- Fresh start with no previous state

**Exit Conditions**:
- Transition to `Running` when crawl starts

**Attributes**:
- `status = "idle"`
- `last_run_time = None`
- `total_items_processed = 0`

**Monitoring**:
```python
# PostgresStateManager.get_state() returns
{
  "status": "idle",
  "crawler_id": "govinfo|openstates|congress|courtlistener|federalregister",
  "last_run": null,
  "items_processed": 0,
  "error_count": 0
}
\`\`\`

---

### 2. Running State

**Description**: Crawler actively executing fetch-process-save cycle.

**Entry Conditions**:
- Transition from `Idle` or `Resuming`
- CLI command executed without `--no-resume` flag

**Exit Conditions**:
- Transition to `Completed` when all data fetched
- Transition to `Error` on critical failure
- Transition to `Paused` on user interruption

**Sub-States**:
- `Fetching` - Making API requests
- `Processing` - Parsing and validating responses
- `Saving` - Storing to PostgreSQL

**Rate Limiting**:
```python
# RateLimiter.check() enforces limits
if rate_limiter.is_allowed():
    await crawler.fetch_next_page()
else:
    await asyncio.sleep(rate_limiter.wait_time())
\`\`\`

**Monitoring**:
\`\`\`python
# Real-time status updates
logger.info(f"Running: {items_processed}/{total_estimated}")
logger.info(f"Progress: {progress_percent}%")
\`\`\`

---

### 3. Fetching State

**Description**: Actively making HTTP requests to API endpoints.

**Entry Conditions**:
- Transition from `Running` state

**Exit Conditions**:
- Success: Transition to `Processing` with API response
- Failure: Transition to `Error` on HTTP/network errors
- Rate Limit: Wait in `Fetching` until limit resets

**Rate Limit Handling**:
\`\`\`mermaid
stateDiagram-v2
    [*] --> Fetching: Start request
    Fetching --> RateLimitWait: Too many requests
    RateLimitWait --> Fetching: Limit reset
    Fetching --> Processing: Success response
\`\`\`

**Error Recovery**:
```python
# BaseClient automatic retries with exponential backoff
async def get_with_retry(url, params, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = await httpx_client.get(url, params)
            return response
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:  # Rate limited
                wait_time = 2 ** attempt  # Exponential backoff
                await asyncio.sleep(wait_time)
            else:
                raise
\`\`\`

---

### 4. Processing State

**Description**: Parsing API responses and validating data quality.

**Entry Conditions**:
- Transition from `Fetching` with successful API response

**Exit Conditions**:
- Success: Transition to `Saving` with validated data
- Failure: Transition to `Error` on parsing/validation errors

**Validation Checks**:
\`\`\`python
# BaseCrawler.process_item() validation
def process_item(self, item: dict) -> Optional[dict]:
    # Required fields check
    required_fields = ["id", "title", "date"]
    if not all(field in item for field in required_fields):
        logger.warning(f"Missing fields: {item}")
        return None
    
    # Data quality checks
    if item.get("title") == "":
        logger.warning(f"Empty title: {item.get('id')}")
        return None
    
    return self.normalize_item(item)
\`\`\`

---

### 5. Saving State

**Description**: Writing processed data to PostgreSQL database.

**Entry Conditions**:
- Transition from `Processing` with validated data

**Exit Conditions**:
- Success: Transition back to `Fetching` (pagination) or `Idle` (complete)
- Failure: Transition to `Error` on database errors

**Database Operations**:
\`\`\`python
# StorageManager.save_batch()
async def save_batch(self, items: list[dict]) -> int:
    saved_count = 0
    try:
        async with self.db.begin():
            for item in items:
                await self.db.execute(insert_statement, item.values)
                saved_count += 1
            await self.db.commit()
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        await self.db.rollback()
        raise
\`\`\`

---

### 6. Resuming State

**Description**: Recovering from previous checkpoint after interruption.

**Entry Conditions**:
- Transition from `Error` after non-critical failure
- CLI command executed without `--no-resume` flag with existing state

**Exit Conditions**:
- Transition to `Fetching` with recovered state

**Checkpoint Recovery**:
\`\`\`python
# PostgresStateManager.get_checkpoint()
async def get_checkpoint(self, crawler_id: str) -> dict:
    result = await self.db.fetch_one(
        "SELECT checkpoint_data, last_position FROM crawler_state WHERE crawler_id = ?",
        crawler_id
    )
    return {
        "checkpoint_data": json.loads(result["checkpoint_data"]),
        "last_position": result["last_position"]
    }
\`\`\`

**Resume Workflow**:
1. Load checkpoint from database
2. Deserialize crawler state
3. Update `last_position` to saved position
4. Resume fetching from `last_position`
5. Log resume with "Resuming from position X"

---

### 7. Error State

**Description**: Error occurred requiring handling.

**Entry Conditions**:
- Transition from any state on failure

**Exit Conditions**:
- Transition to `Resuming` if retry possible (non-critical)
- Transition to `Paused` on user stop (Ctrl+C)
- Transition to `Completed` if unrecoverable

**Error Classification**:

| Error Type | Severity | Retry? | Example |
|------------|----------|--------|---------|
| HTTP 429 (Rate Limit) | Medium | Yes | Too many API requests |
| HTTP 500 (Server Error) | High | Yes | Temporary API failure |
| HTTP 404 (Not Found) | Low | No | Invalid URL endpoint |
| Network Timeout | High | Yes | Connection dropped |
| Database Error | High | No | PostgreSQL connection failed |
| Parse Error | Low | No | Invalid JSON response |

**Error Handling**:
\`\`\`python
# BaseCrawler.handle_error()
async def handle_error(self, error: Exception) -> None:
    error_type = classify_error(error)
    
    if error_type == "rate_limit":
        logger.warning(f"Rate limited, waiting {wait_time}s")
        await self.transition_to_state("resuming")
    elif error_type == "network_error":
        logger.error(f"Network error: {error}")
        if self.retry_count < self.max_retries:
            await self.transition_to_state("resuming")
        else:
            await self.transition_to_state("paused")
    else:
        logger.error(f"Critical error: {error}")
        await self.transition_to_state("completed")
\`\`\`

---

### 8. Paused State

**Description**: Crawler temporarily stopped (user-initiated or admin-initiated).

**Entry Conditions**:
- Transition from `Error` on user interrupt (Ctrl+C)
- CLI command with stop signal

**Exit Conditions**:
- Transition to `[*]` when fully stopped
- Transition to `Running` if resumed

**Pause Handling**:
\`\`\`python
# KeyboardInterrupt handler
try:
    await crawler.run()
except KeyboardInterrupt:
    logger.info("Pausing crawler...")
    await state_manager.save_state("paused", last_position=current_position)
    logger.info("Crawler paused. Resume with --resume flag")
    sys.exit(0)
\`\`\`

---

### 9. Completed State

**Description**: Crawler finished successfully (all data fetched).

**Entry Conditions**:
- Transition from `Running` after all pages processed
- Transition from `Error` if unrecoverable critical error

**Exit Conditions**:
- Transition to `[*]` (terminal state)

**Completion Conditions**:
\`\`\`python
# BaseCrawler.is_complete()
def is_complete(self) -> bool:
    # All pages fetched
    if self.current_page >= self.max_pages:
        return True
    
    # No more results
    if not self.has_more_results():
        return True
    
    return False
\`\`\`

**Final Actions**:
- Update state to "completed" in PostgreSQL
- Log final statistics (total items, errors, duration)
- Generate completion report
- Close database connection

---

## Crawler-Specific States

### GovInfo Crawler

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Initialize GovInfo
    Idle --> Fetching: Start bulk download
    Fetching --> Extracting: Parse ZIP/TAR archives
    Extracting --> Processing: Transform to JSON
    Processing --> Saving: Store in PostgreSQL
    Saving --> Fetching: Next archive
    Fetching --> Error: Download failed
    Saving --> Idle: All archives processed
\`\`\`

**Unique States**:
- `Extracting` - ZIP/TAR archive extraction (GovInfo bulk data format)
- `Processing` - XML to JSON transformation

### OpenStates Crawler

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Select jurisdictions
    Idle --> FetchingMetadata: Get jurisdiction list
    FetchingMetadata --> FetchingBills: Start bill requests
    FetchingBills --> Processing: Parse responses
    Processing --> Saving: Store bills
    Saving --> FetchingBills: Next jurisdiction/bill
    FetchingBills --> Error: API failure
    Saving --> Idle: All jurisdictions done
\`\`\`

**Unique States**:
- `FetchingMetadata` - Jurisdiction discovery (52 jurisdictions)
- `FetchingBills` - Concurrent bill fetching per jurisdiction

### Congress.gov Crawler

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Select congress/session
    Idle --> FetchingBills: Start API requests
    FetchingBills --> FetchingAmendments: Get amendments
    FetchingAmendments --> Processing: Parse responses
    Processing --> Saving: Store in PostgreSQL
    Saving --> FetchingBills: Next page/congress
    FetchingBills --> Error: API failure
    Saving --> Idle: All sessions processed
\`\`\`

**Unique States**:
- `FetchingAmendments` - Amendment data fetching (Congress.gov specific)

### CourtListener Crawler

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Select courts/dates
    Idle --> FetchingOpinions: Start API requests
    FetchingOpinions --> Processing: Parse responses
    Processing --> Saving: Store opinions
    Saving --> FetchingOpinions: Next page/court
    FetchingOpinions --> Error: API failure
    Saving --> Idle: All courts processed
\`\`\`

**Unique States**:
- `FetchingOpinions` - Opinion/docket fetching (CourtListener specific)

### Federal Register Crawler (NEW)

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle: Configure filters
    Idle --> FetchingDocuments: Start API requests
    FetchingDocuments --> FetchingDetails: Get full document text
    FetchingDetails --> Processing: Parse responses
    Processing --> Saving: Store in PostgreSQL
    Saving --> FetchingDocuments: Next page
    FetchingDocuments --> Error: API failure
    Saving --> Idle: All pages processed
\`\`\`

**Unique States**:
- `FetchingDetails` - Full document text fetching (FR specific)
- `Configure filters` - Document type, agency, topic selection

---

## Rate Limiter Integration

### Global Rate Limit Enforcement

\`\`\`mermaid
stateDiagram-v2
    [*] --> Checking: Check rate limits
    Checking --> Allowed: Within limits
    Checking --> Blocked: Rate exceeded
    Allowed --> Request: Allow API call
    Blocked --> Waiting: Wait for reset
    Waiting --> Checking: Re-check after wait
    Request --> Checking: Update counters
\`\`\`

**Service-Specific Limits**:

| Service | Rate Limit | Reset Period | Tracking |
|----------|-------------|--------------|----------|
| GovInfo | 1000 req/hour | Hourly | ✅ |
| OpenStates | 6000 req/hour | Hourly | ✅ |
| Congress.gov | 4000 req/hour | Hourly | ✅ |
| CourtListener | 1000 req/day | Daily | ✅ |
| Federal Register | 300 req/hour | Hourly | ❌ None (service_name=None) |

**Rate Limiter State Machine**:
\`\`\`python
# RateLimiter state management
class RateLimiter:
    def __init__(self, services: dict):
        self.services = {
            "govinfo": {"limit": 1000, "reset": "hourly"},
            "openstates": {"limit": 6000, "reset": "hourly"},
            "congress": {"limit": 4000, "reset": "hourly"},
            "courtlistener": {"limit": 1000, "reset": "daily"},
            # Federal Register: no tracking (service_name=None)
        }
\`\`\`

---

## CLI Controller State Machine

\`\`\`mermaid
stateDiagram-v2
    [*] --> ParseArgs: Click argument parsing
    ParseArgs --> ValidateConfig: Load settings
    ValidateConfig --> InitializeCrawler: Create crawler instance
    InitializeCrawler --> LoadState: Get from PostgresStateManager
    LoadState --> RunCrawler: Execute crawler.run()
    RunCrawler --> Complete: Success
    RunCrawler --> Error: Exception raised
    Complete --> [*]: Exit cleanly
    Error --> [*]: Exit with error code
\`\`\`

**CLI Flow**:

| Step | Action | Result |
|-------|--------|--------|
| ParseArgs | Click parses `--options` and arguments |
| ValidateConfig | Load settings from config.py or .env |
| InitializeCrawler | Instantiate GovInfo/OpenStates/Congress/etc. crawler |
| LoadState | Call PostgresStateManager.get_state() |
| RunCrawler | Execute `await crawler.run()` with async loop |
| Complete | Log summary, exit 0 |
| Error | Log error, exit 1 |

---

## Concurrent Execution Model

### Parallel Crawler Execution

\`\`\`mermaid
stateDiagram-v2
    [*] --> Spawning: Start multiple crawlers
    Spawning --> Running: All crawlers active
    Running --> Monitoring: Watch progress
    Monitoring --> Completion: All done
    Running --> Error: One failed
\`\`\`

**Execution Models**:

1. **Sequential** (default):
   - Run one crawler at a time
   - Lower resource usage
   - Longer total time

2. **Parallel** (nightly crawlers):
   - Run all crawlers simultaneously
   - Higher throughput
   - Requires `--max-concurrent` flag

3. **Background** (systemd/cron):
   - Run as daemon services
   - Automatic restart on failure
   - Persist across reboots

---

## Monitoring and Observability

### State Persistence

\`\`\`python
# PostgresStateManager schema
CREATE TABLE crawler_state (
    crawler_id VARCHAR PRIMARY KEY,
    status VARCHAR NOT NULL,  -- idle/running/paused/error/completed
    last_run TIMESTAMP,
    last_position TEXT,  -- Pagination cursor / checkpoint
    items_processed INT DEFAULT 0,
    error_count INT DEFAULT 0,
    checkpoint_data JSONB,  -- Arbitrary state data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Real-time Status

\`\`\`bash
# CLI status command
python -m src.cli status

# Output:
# Active Crawlers (5)
# ┌─────────────────┬─────────────────┬─────────────────┐
# │ Crawler        │ Status      │ Last Run      │
# ├─────────────────┼─────────────────┼─────────────────┤
# │ GovInfo        │ Running     │ 2026-02-03    │
# │ OpenStates      │ Idle        │ 2026-02-02    │
# │ Congress.gov    │ Error        │ 2026-02-03    │
# │ CourtListener    │ Paused      │ 2026-02-02    │
# │ Federal Register │ Idle        │ Never         │
# └─────────────────┴─────────────────┴─────────────────┘
\`\`\`

---

## Error Recovery Strategies

### Retry Logic

\`\`\`mermaid
stateDiagram-v2
    [*] --> Attempt1: First try
    Attempt1 --> Failure: Error occurred
    Failure --> Wait1: Exponential backoff 2^1 = 2s
    Wait1 --> Attempt2: Second try
    Attempt2 --> Failure: Still failed
    Failure --> Wait2: Exponential backoff 2^2 = 4s
    Wait2 --> Attempt3: Third try
    Attempt3 --> Success: Request succeeded
    Success --> [*]: Continue
    Attempt3 --> Failure: Max retries exceeded
    Failure --> [*]: Abort
\`\`\`

### Backoff Strategy

```python
# BaseClient exponential backoff
RETRY_DELAYS = [2, 4, 8, 16]  # Seconds
MAX_RETRIES = 3

async def get_with_retry(url, params):
    for attempt in range(MAX_RETRIES):
        try:
            return await self.http_client.get(url, params)
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAYS[attempt]
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Max retries exceeded for {url}")
                raise
```

---

## State Machine Summary

### Core Transitions

| From | To | Condition | Action |
|-------|-----|-----------|--------|
| Idle | Running | CLI start | Initialize crawler |
| Running | Fetching | Start cycle | Begin API requests |
| Fetching | Processing | API success | Parse response |
| Processing | Saving | Data valid | Write to DB |
| Saving | Fetching | More data | Continue pagination |
| Saving | Idle | Complete | All done |
| Any | Error | Failure | Log and classify |
| Error | Resuming | Retry possible | Recover checkpoint |
| Error | Paused | User stop | Save state |
| Paused | Running | Resume | Load checkpoint |
| Error | Completed | Critical | Stop cleanly |

### Termination Conditions

| Condition | State | Action |
|-----------|-------|--------|
| All pages fetched | Running → Completed | Finish |
| API rate limit | Fetching → Wait → Fetching | Back off |
| Critical error | Any → Completed | Stop |
| Max retries | Error → Completed | Abort |
| User interrupt | Any → Paused | Save |
| Resume with --no-resume | Idle → Running | Fresh start |

---

## Integration Points

### PostgresStateManager

- Stores state: `status`, `last_position`, `items_processed`, `error_count`, `checkpoint_data`
- Provides: `get_state()`, `save_state()`, `reset_state()`, `delete_state()`
- Used by: All crawlers for resume capability

### RateLimiter

- Stores: `service_limits`, `request_counts`, `reset_times`
- Provides: `check()`, `wait_time()`, `reset()`
- Used by: BaseClient for API rate limiting

### StorageManager

- Stores: Raw JSON files, processed data
- Provides: `save_raw()`, `save_processed()`, `get_stats()`
- Used by: Crawlers for file-based storage

---

## Nightly Workflow State Machine

\`\`\`mermaid
stateDiagram-v2
    [*] --> Scheduled: Cron trigger
    Scheduled --> Startup: Load environment
    Startup --> Fetching: Start all crawlers
    Fetching --> Monitoring: Watch progress
    Monitoring --> Completion: All crawlers done
    Monitoring --> Error: Crawler failed
    Completion --> Cleanup: Close connections
    Error --> Report: Send notification
    Cleanup --> [*]: Wait for next run
\`\`\`

**Workflow Steps**:

1. **Scheduled** (cron: 0 2 * * *)
   - Triggered by systemd timer or cron job
   - Runs `scripts/run_nightly_crawlers.sh`

2. **Startup**:
   - Source `.env` configuration
   - Initialize logging
   - Create database connection pool

3. **Fetching** (parallel):
   - Start GovInfo, OpenStates, Congress, CourtListener simultaneously
   - Each crawler in `Running` state
   - Progress logged to console

4. **Monitoring**:
   - Watch for rate limit compliance
   - Track errors and warnings
   - Update PostgreSQL state every 60 seconds

5. **Completion**:
   - All crawlers transition to `Idle` or `Completed`
   - Generate completion summary
   - Close database connections

6. **Cleanup**:
   - Release database connection pool
   - Flush logs
   - Update last_run timestamp

---

## Key Insights

### State Machine Benefits

1. **Reliability**: Clear state transitions prevent race conditions
2. **Resume Capability**: Checkpoint storage enables interruption recovery
3. **Observability**: State persistence enables monitoring and debugging
4. **Error Recovery**: Explicit error states enable proper handling
5. **Rate Limiting**: Centralized limiter prevents API throttling
6. **Concurrent Safety**: State locks prevent concurrent crawler conflicts

### Anti-Patterns

| Pattern | Problem | Solution |
|----------|---------|----------|
| No state tracking | Can't resume | PostgresStateManager |
| Direct execution | No monitoring | CLI status command |
| Infinite retry loops | Resource waste | Max retries + exponential backoff |
| Silent failures | No observability | Structured logging |
| Race conditions | Data corruption | State machine transitions |

---

**Diagram Complete**

**Version**: 1.0
**Date**: 2026-02-03
**Author**: Sisyphus (Phase 3 Session)
