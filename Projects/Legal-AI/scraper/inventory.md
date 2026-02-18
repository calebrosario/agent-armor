# Legal Documents Inventory

Last Updated: 2026-01-16 17:00

## OpenStates Crawler Status - ✅ PARTIAL SUCCESS

### Fixes Applied
- **API Key:** Updated to correct format `b6cd3366-323f-4f44-a0d3-efd9cdafc42d` (added 'b' prefix)
- **Header:** Changed from `X-API-KEY` to `x-api-key` (lowercase, required by API)
- **Endpoints:** Removed trailing slashes (`/jurisdictions/` → `/jurisdictions`)
- **Sort Parameter:** Changed from `updated_at desc` to `updated_desc` (valid enum value)
- **Page Size:** Reduced from 50 to 20 (API limit: max 20)
- **Organizations Crawl:** Commented out (404 Not Found - endpoint doesn't exist)
- **Votes Crawl:** Attempted but 404 Not Found (endpoint doesn't exist)

### Crawl Attempts
- **Date:** 2026-01-15 to 2026-01-16
- **Jurisdictions:** CA, FL, NY, TX (attempted)
- **Crawlers Run:** 3 parallel crawlers (bills, people, votes)
- **Rate Limits:** API enforces strict limits with 1-4 second delays
- **Status:** ⚠️ PARTIAL SUCCESS (organizations and votes endpoints unavailable)

### Documents Downloaded
- **Jurisdictions:** 52 files
- **Bills:** 33 files (CA: 19, FL: 5, TX: 9, NY: 0 - rate limited)
- **People:** 0 files (organizations endpoint failed immediately)
- **Organizations:** 0 files (404 Not Found - endpoint unavailable)
- **Votes:** 0 files (404 Not Found - endpoint unavailable)
- **Total OpenStates:** 85 files

### Known API Issues
- **Organizations Endpoint:** 404 Not Found (endpoint may not exist in v3 API)
- **Votes Endpoint:** 404 Not Found (endpoint may not exist in v3 API)
- **People Endpoint:** Likely same issue as organizations (tested via bills/people crawl flow)

### Rate Limiting Impact
- **Observed Delays:** 1-4 seconds between requests
- **Impact:** Significantly slowed download speed despite 10 concurrent workers
- **Result:** Limited to 33 bills (out of 82,269 total available for CA alone)

## CourtListener Crawler Status - ✅ SUCCESS

### Multiple Crawler Runs
- **Date:** 2026-01-15 to 2026-01-16
- **Focus:** Opinions and Dockets
- **Courts Targeted:** SCOTUS, CA circuits (1-12), Federal courts
- **Crawlers Run:** 30+ parallel crawlers
- **Max Pages:** 3-60 pages per court
- **Concurrent:** 5-10 workers per crawler
- **Rate Limits:** 1,000 req/day enforced
- **Status:** ✅ SUCCESS - 1,285 new files downloaded

### CourtListener Documents
**Total: 1,357 files (+1,285 from initial 72)**

**Opinions Breakdown (Top 15):**
- **scotus:** 162 files (+90 from initial 72)
- **fed:** 108 files (NEW!)
- **ca9:** 102 files (+82 from initial 20)
- **ca8:** 81 files (+62 from initial 19)
- **ca6:** 90 files (NEW!)
- **ca7:** 70 files (NEW!)
- **ca11:** 84 files (NEW!)
- **ca3:** 67 files
- **ca5:** 81 files (+66 from initial 15)
- **ca10:** 71 files (NEW!)
- **ca1:** 67 files (NEW!)
- **Total Opinions:** 1,085 files (+1,013)

**Dockets Breakdown (Top 15):**
- **ca8:** 28 files (NEW!)
- **ca5:** 27 files (NEW!)
- **ca3:** 26 files (NEW!)
- **ca10:** 24 files (NEW!)
- **ca7:** 23 files (NEW!)
- **ca11:** 21 files (NEW!)
- **ca1:** 21 files (NEW!)
- **scotus:** 20 files (NEW!)
- **ca9:** 20 files
- **ca2:** 20 files
- **ca6:** 21 files (NEW!)
- **ca4:** 21 files (NEW!)
- **Total Dockets:** 272 files (NEW!)

**Note:** Some crawlers used `--no-resume` to avoid duplicate downloads
**Note:** Many crawlers hit 502/504/502 errors but continued with retries

## Other Crawlers Status
- **GovInfo:** ✅ Active (2,158 files)
- **Congress.gov:** ✅ Functional

## Summary

### Total Legal Documents in System
**3,600 files** (+1,285 from previous 2,315 inventory)

### Breakdown by Source
- **CourtListener:** 1,357 files (+1,285)
  - Opinions: 1,085 files (+1,013)
  - Dockets: 272 files (NEW!)
  - Courts covered: SCOTUS, CA circuits (1-12), Federal courts
- **OpenStates:** 85 files (NEW!)
  - Jurisdictions: 52 files
  - Bills: 33 files
  - People: 0 files
  - Organizations: 0 files (unavailable)
  - Votes: 0 files (unavailable)
- **GovInfo:** 2,158 files

### Actions Taken
1. ✅ Tested OpenStates API with curl command (successful)
2. ✅ Fixed OpenStates client header format
3. ✅ Fixed OpenStates client parameter names
4. ✅ Updated .env with correct API key
5. ✅ Commented out organizations crawl (404 error)
6. ✅ Ran 3 parallel OpenStates crawlers for CA, FL, NY, TX
7. ✅ Downloaded 85 OpenStates files (52 jurisdictions + 33 bills)
8. ✅ Ran 30+ parallel CourtListener crawlers for multiple courts
9. ✅ Downloaded 1,085 CourtListener opinions files
10. ✅ Downloaded 272 CourtListener dockets files
11. ✅ Updated inventory with all downloads

### Known Issues
- **OpenStates Organizations Endpoint:** 404 Not Found (endpoint may not exist or require different path)
- **OpenStates Votes Endpoint:** 404 Not Found (endpoint may not exist or require different path)
- **OpenStates People Endpoint:** Likely unavailable (organizations endpoint failure)
- **OpenStates Rate Limits:** API enforces strict rate limits (1-4 second delays)
- **CourtListener Rate Limits:** 1,000 req/day enforced
- **CourtListener 502 Errors:** Some 502/504/502 errors encountered (retried successfully)
- **Python Cache:** Had to clear __pycache__ for changes to take effect

### Recommendations
1. 🔄 Review OpenStates v3 API documentation for available endpoints
2. 🔄 Implement retry logic with exponential backoff for rate limits
3. 🔄 Consider implementing session management for long-running crawlers
4. 🔄 Test people and votes endpoints directly via curl before integration
5. 🔄 Continue OpenStates bills crawler for more documents (only 33 of 82K+ downloaded)
6. 🔄 Try adding delay between state crawlers to avoid triggering rate limits
7. 🔄 Continue CourtListener crawler for more opinions from various courts
8. 🔄 Continue CourtListener crawler for more dockets from various courts
9. 🔄 Consider running overnight jobs for large-scale downloads
10. 🔄 Monitor disk space for large-scale downloads
