# OpenStates Crawler Extension Design

**Purpose**: Extend OpenStates crawler to cover all 50 US states + DC + Puerto Rico
**Current Status**: 4 states covered (CA, FL, NY, TX) = 8%
**Target**: 52 jurisdictions = 100%

---

## OpenStates API Capabilities

### API Coverage
- **Total Jurisdictions**: 52 (50 states + DC + Puerto Rico)
- **Base URL**: https://v3.openstates.org
- **Authentication**: API Key via `X-API-KEY` header or `?apikey` parameter
- **Rate Limit**: 6000 requests/hour
- **License**: Public domain (attribution appreciated)

### Available Endpoints
| Endpoint | Method | Purpose | Rate Limit |
|-----------|--------|---------|-------------|
| `/jurisdictions` | GET | List all jurisdictions | 1/hr |
| `/jurisdictions/{id}` | GET | Get jurisdiction metadata | 60/hr |
| `/bills` | GET | Search bills | 6000/hr |
| `/bills/{bill_id}` | GET | Get bill detail | 6000/hr |
| `/people` | GET | Search legislators | 6000/hr |
| `/votes` | GET | Get vote records | 6000/hr |

### Query Parameters (Bills)
- `jurisdiction`: State ID (e.g., "il", "pa")
- `updated_since`: ISO 8601 date for incremental updates
- `session`: Session identifier (e.g., "2023-2024 Regular Session")
- `page`: Page number (for pagination)
- `per_page`: Results per page (max 50)
- `sort`: Sort order (e.g., "updated_desc", "created_desc")

---

## Current OpenStates Crawler Analysis

### ✅ Strengths
1. **Async Architecture**: Uses `asyncio` for concurrent requests
2. **Rate Limiting**: `RateLimiter` with configurable requests/hour
3. **Resume Capability**: `BaseStateManager` tracks crawled items
4. **Batch Processing**: `process_batch()` for concurrent downloads
5. **Error Handling**: Retry logic with `max_retries`

### ⚠️ Limitations
1. **Hardcoded Jurisdictions**: Only supports CA, FL, NY, TX
2. **No Dynamic Discovery**: Can't fetch all jurisdictions from API
3. **No Session Detection**: Uses static session names in config
4. **No Metadata Caching**: Re-fetches jurisdiction metadata each run
5. **No Progress Estimation**: Unknown total bills per state

---

## Extension Design

### Phase 1: Dynamic Jurisdiction Discovery

#### 1.1 Add Jurisdiction Metadata Crawler
[Implementation details in original document...]

---

## Key Design Decisions

### Priority Tiers (8 tiers, 6-7 states each)
- **Tier 1**: CA, FL, NY, TX, IL, PA (35% population) - 🔴 CRITICAL
- **Tier 2**: OH, MI, GA, NC, NJ, VA (18% population) - 🔴 CRITICAL
- **Tier 3-8**: Remaining states (47% population) - 🟡 MEDIUM to 🟢 LOW

### Rollout Strategy
- **Week 1-2**: Tiers 1-2 (12 states, 53% population)
- **Week 3-4**: Tiers 3-5 (18 states, 29% population)
- **Week 5-6**: Tiers 6-8 (22 states, 18% population)

---

**Last Updated**: 2026-01-25
**Status**: Design Complete, Ready for Implementation
