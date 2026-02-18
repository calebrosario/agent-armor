# Crawler System State Machine Diagram

## Overview

This document describes the state machine for the Legal Data Crawler system, which manages multiple parallel crawlers (OpenStates, CourtListener, Congress.gov, GovInfo, Federal Register, OneCLE, SEC EDGAR).

## States

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CRAWLER SYSTEM STATE MACHINE                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     IDLE       │
                    │  (Initialized)  │
                    └────────┬────────┘
                             │ start()
                             ▼
                   ┌────────────────────┐
                   │    STARTING       │
                   │  (Initializing)   │
                   └────────┬───────────┘
                            │
              ┌───────────┴──────────┐
              │                      │
         success                failure
              │                      │
              ▼                      ▼
    ┌──────────────┐     ┌───────────────┐
    │   RUNNING    │     │    ERROR      │
    │ (Processing) │     │  (Fatal)     │
    └──────┬──────┘     └───────┬───────┘
           │                     │
           │                     │
      ┌────┴────┐          │
      │         │          │
  complete  cancelled   │
      │         │          │
      ▼         ▼          │
┌─────────┐ ┌──────────┐   │
│COMPLETED │ │CANCELLED │   │
│(Success) │ │(User)   │   │
└────┬────┘ └────┬─────┘   │
     │           │         │
     └─────┬─────┘         │
           │               │
           ▼               │
    ┌──────────────┐      │
    │   RESUMING   │      │
    │ (Reload State)│      │
    └──────┬───────┘      │
           │              │
           │              │
           ▼              ▼
    ┌──────────────────────┐
    │      IDLE           │
    │  (Next Cycle)      │
    └──────────────────────┘
```

## State Transitions

### 1. IDLE → STARTING
**Trigger:** `start()` command or cron job execution

**Action:**
- Initialize crawler configuration
- Check database connectivity
- Validate API credentials
- Create output directories

**Conditions:**
- Configuration files exist
- Dependencies installed
- Virtual environment activated

### 2. STARTING → RUNNING
**Trigger:** Initialization successful

**Action:**
- Start async worker tasks
- Initialize rate limiters
- Load resume state (if enabled)
- Begin fetching data

**Conditions:**
- Database connection established
- All imports successful
- Output directories writable

### 2. STARTING → ERROR
**Trigger:** Initialization failure

**Action:**
- Log error details
- Send alert (if configured)
- Exit with error code

**Error Conditions:**
- Database connection failed
- Missing API keys
- Invalid configuration
- Out of disk space

### 3. RUNNING → COMPLETED
**Trigger:** All items processed successfully

**Action:**
- Update state in PostgreSQL
- Clean up resources
- Log completion stats
- Close connections

**Completion Conditions:**
- All items fetched and saved
- No pending retries
- State marked as completed

### 3. RUNNING → CANCELLED
**Trigger:** User interrupt (Ctrl+C) or external stop signal

**Action:**
- Gracefully stop async tasks
- Save current progress to state
- Close connections
- Log cancellation

**Cancellation Conditions:**
- SIGINT received (Ctrl+C)
- SIGTERM received (systemd/timeout)
- Manual stop requested

### 3. RUNNING → ERROR
**Trigger:** Unrecoverable error during execution

**Action:**
- Save last known good state
- Log error with stack trace
- Send alert (if configured)
- Exit with error code

**Error Conditions:**
- API rate limit exceeded (unrecoverable)
- Network timeout after retries
- Database write failure
- Out of memory

### 4. COMPLETED → RESUMING
**Trigger:** Next execution cycle with resume enabled

**Action:**
- Load previous state from PostgreSQL
- Determine last processed item
- Continue from checkpoint

**Resume Conditions:**
- State table has entry for crawler
- Resume flag enabled (default)
- Previous run not completed

### 5. CANCELLED → RESUMING
**Trigger:** Restart after cancellation

**Action:**
- Load incomplete state
- Continue from last checkpoint
- Resume interrupted operation

**Resume Conditions:**
- State table has incomplete entry
- Resume flag enabled
- No manual reset requested

### 6. COMPLETED/CANCELLED → IDLE
**Trigger:** All work done or ready for next cycle

**Action:**
- Reset internal state
- Prepare for next execution
- Wait for next trigger (cron time or manual start)

**Return to Idle Conditions:**
- All resources released
- Next scheduled time reached
- Manual start command

### 7. ERROR → IDLE
**Trigger:** Error resolved and ready for retry

**Action:**
- Reset error state
- Clear any locks
- Prepare for fresh start

**Return to Idle Conditions:**
- Error condition resolved
- Retry limit not exceeded
- Manual reset requested

## Parallel Crawler Execution

### Master Orchestrator State Machine

```
┌─────────────────────────────────────────────────┐
│           MASTER ORCHESTRATOR (run_all_crawlers.py)       │
└─────────────────────┬───────────────────────────────┘
                      │ start()
                      ▼
              ┌───────────────┐
              │   STARTING    │
              └──────┬────────┘
                     │
            ┌─────────┴─────────┐
            │                   │
        success              failure
            │                   │
            ▼                   ▼
    ┌───────────┐      ┌───────────┐
    │  RUNNING   │      │   ERROR    │
    │(All crawlers) │    │(Fatal)    │
    └─────┬─────┘      └─────┬─────┘
          │                     │
   all done                │
          │                     │
          ▼                     ▼
    ┌──────────────┐    ┌──────────────┐
    │  COMPLETED   │    │   FAILED     │
    └─────┬───────┘    └─────┬───────┘
          │                     │
          └─────────┬───────────┘
                    ▼
              ┌──────────────┐
              │    IDLE     │
              └──────────────┘
```

### Individual Crawler States (Running in Parallel)

Each crawler (OpenStates, CourtListener, Congress.gov, GovInfo, Federal Register, OneCLE, SEC EDGAR) follows this sub-state machine:

```
┌─────────────────────────────────────────────────┐
│        INDIVIDUAL CRAWLER (e.g., OpenStates)       │
└───────────────────┬───────────────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │   IDLE        │
          │  (Waiting)     │
          └────────┬────────┘
                   │ start()
                   ▼
         ┌────────────────────┐
         │    STARTING       │
         │ (Config Loading)  │
         └────────┬───────────┘
                  │
         success      failure
                  │
                  ▼
          ┌─────────────────┐
          │    ERROR        │
          └─────────────────┘

                  │ success
                  ▼
    ┌──────────────────────────┐
    │     RUNNING            │
    │  (Fetching & Saving)  │
    └──────┬───────────────┘
           │
    ┌──────┴─────────┐
    │                │
success        failure
    │                │
    ▼                ▼
┌──────────┐    ┌──────────┐
│COMPLETED │    │  ERROR   │
│(Done)   │    │(Retry)   │
└────┬─────┘    └─────┬────┘
     │                │
     └───────┬──────┘
             │
             ▼
       ┌──────────────┐
       │    IDLE      │
       └──────────────┘
```

## State Persistence

### PostgreSQL State Table

| Column | Description |
|---------|-------------|
| crawler_name | Crawler identifier (e.g., "Federal Register") |
| status | Current state (IDLE, RUNNING, COMPLETED, ERROR, CANCELLED) |
| items_completed | Number of items successfully processed |
| items_failed | Number of items that failed |
| last_item_id | ID of last processed item (for resume) |
| started_at | Timestamp when crawler started |
| finished_at | Timestamp when crawler finished |
| error_message | Error details if in ERROR state |

### Resume Flow

1. **Check state table** for existing entry
2. **Load last_item_id** from previous run
3. **Continue fetching** from `last_item_id + 1`
4. **Update state** after each batch
5. **Mark COMPLETED** when all items processed

## Error Handling

### Retry Logic

```
RUNNING → ERROR (retryable)
  │
  ├─→ Retry 1 → RUNNING
  │         │
  │         ├─ Success → COMPLETED
  │         └─ Error → Retry 2
  │
  ├─→ Retry 2 → RUNNING
  │         │
  │         ├─ Success → COMPLETED
  │         └─ Error → Retry 3
  │
  └─→ Retry 3 → ERROR (final)
```

**Max Retries:** 3 (configurable)
**Retry Delay:** 5 seconds (configurable)

### Rate Limit Handling

```
RUNNING → RATE_LIMITED
  │
  └─→ Wait for reset
     │
     └─→ Resume crawling (RUNNING)
```

**Rate Limit Sources:**
- OpenStates: 6,000 req/hour
- CourtListener: 1,000 req/day
- Congress.gov: 4,000 req/hour
- GovInfo: 1,000 req/hour
- Federal Register: 300 req/hour
- OneCLE: No limit
- SEC EDGAR: 10 req/second

## Monitoring

### Live Dashboard (Rich Console)

```
┌─────────────────────────────────────────────────────────────────┐
│           Legal Data Crawlers                                │
│                  2m 30s elapsed                            │
├─────────────────────────────────────────────────────────────────┤
│ Crawler        │ Status  │ Progress  │ Duration │ Errors  │
├─────────────────────────────────────────────────────────────────┤
│ OpenStates     │ RUNNING │ 1234/5000 │ 2m 15s  │          │
│ CourtListener │ RUNNING │ 567/1000  │ 1m 45s  │ 2       │
│ Congress.gov  │ RUNNING │ 234/2000  │ 1m 20s  │          │
│ GovInfo       │ PENDING │ -         │ -         │ -       │
│ Federal Reg   │ PENDING │ -         │ -         │ -       │
│ OneCLE       │ PENDING │ -         │ -         │ -       │
│ SEC EDGAR     │ PENDING │ -         │ -         │ -       │
└─────────────────────────────────────────────────────────────────┘
```

### Logging

- **INFO:** Normal operations, progress updates
- **WARN:** Rate limit warnings, missing dependencies
- **ERROR:** Fatal errors, connection failures
- **DEBUG:** Detailed request/response logs (configurable)

## Scheduled Execution (Cron)

```
┌─────────────────────────────────────┐
│         CRON TRIGGER (Daily @ 2 AM)     │
└───────────────┬─────────────────┘
                │
                ▼
        ┌───────────────┐
        │   IDLE →     │
        │  STARTING    │
        └──────┬────────┘
               │
        success     failure
               │
               ▼
        ┌───────────────┐
        │    ERROR      │
        └───────────────┘

               │ success
               ▼
        ┌───────────────┐
        │   RUNNING     │
        └──────┬────────┘
               │
      all done
               │
               ▼
        ┌───────────────┐
        │  COMPLETED    │
        └──────┬────────┘
               │
               ▼
        ┌───────────────┐
        │    IDLE       │
        └───────────────┘
```

## Summary

- **7 Crawlers** managed in parallel
- **6 States** per crawler (IDLE, STARTING, RUNNING, COMPLETED, ERROR, CANCELLED)
- **Resume Support** via PostgreSQL state persistence
- **Rate Limiting** per crawler with automatic reset detection
- **Graceful Cancellation** on user interrupt
- **Error Handling** with retry logic (max 3 retries)
- **Live Monitoring** via Rich console dashboard
- **Scheduled Execution** via cron (daily @ 2 AM)

## Files

- **State Machine:** This document (SCRAPER_STATE_MACHINE_DIAGRAM.md)
- **Orchestrator:** `scraper/scripts/run_all_crawlers.py`
- **Wrapper Script:** `scraper/scripts/run_nightly_crawlers.sh`
- **Base Crawler:** `scraper/src/core/base_crawler.py`
- **State Manager:** `scraper/src/core/state/postgres.py`
- **Rate Limiter:** `scraper/src/core/rate_limiter.py`

---
**Created:** 2026-02-06
**Purpose:** Document crawler system state transitions for maintenance and debugging
