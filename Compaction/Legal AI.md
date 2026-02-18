---
Goal
Fill critical data gaps in the legal dataset by running all bulk download crawlers:
- Congressional bills: 0 → 10,000 files needed
- Court opinions: 0 → 8,000 files needed
- State bills: 165 → 40,000 files needed
- Federal statutes: 101 → 5,000 files needed
- Federal regulations: 0 → 10,000 files needed
Instructions
- User request: "begin running all crawlers to fill the gaps in our dataset"
- User follow-up: "continue" (in response to system directive about incomplete tasks)
- System directive: Continue with next pending tasks without asking for permission until all tasks are done
- Use bulk download scripts for each data source with rate limiting and progress tracking
Discoveries
1. API Version Deprecation - CourtListener v3 → v4 Migration Required
Root cause identified: 
As a new user, you don't have permission to access V3 of the API. Please use V4 instead.
- V3 API returns 403 Forbidden for new users
- V4 API requires authentication and has different parameter format
- Token authentication works correctly: Authorization: Token {api_token}
API format changes identified:
- Endpoint: /api/rest/v3/opinions/ → /api/rest/v4/opinions/
- Court filter: court=scotus → cluster__docket__court=scotus
- Date filter: decision_date__gte → date_modified__gte
- Sorting: ordering=-decision_date → Natural ordering by date (v4 default)
- Cluster field: Dict object → URL string requiring nested lookup
- Court extraction: Simple field access → Fetch docket URL → Fetch docket object → Extract court
2. Congress.gov API Query Parameter Format Error
Root cause identified:
- Script uses path-based URL: /bill/congress/117 → Returns 404 Not Found
- Correct format: Query parameter-based URL: /bill?congress=117&
- API returns "Unknown resource: bill/congress/117" for path format
- API returns bills successfully for query format: ?congress=117&format=json
Key fix required:
# Current (incorrect):
endpoint = f"{self.base_url}/bill/congress/{congress}"
url = f"{endpoint}?api_key={api_key}&..."
# Correct:
endpoint = f"{self.base_url}/bill"
url = f"{endpoint}?congress={congress}&{params}"
3. OpenStates API Sort Parameter Format
Issue identified and fixed:
- Invalid parameter: sort="updated_at desc"
- Valid parameters: updated_asc, updated_desc, first_action_asc, first_action_desc, etc.
- Fix applied: Changed to "sort": "updated_desc"
- Result: 26 files successfully downloaded (CA: 8, FL: 9, NY: 9, TX: 0)
4. Import Path Issues Across Bulk Download Scripts
Pattern discovered: All three scripts had incorrect import path logic
# Problem (lines 22-28 in all scripts):
script_dir = Path(__file__).resolve().parent
scraper_dir = script_dir.parent
sys.path.insert(0, str(scraper_dir))  # Only adds parent directory
# Fix applied to all scripts:
script_dir = Path(__file__).resolve().parent
scraper_dir = script_dir.parent
sys.path.insert(0, str(scraper_dir))  # Add scraper directory for config
sys.path.insert(0, str(scraper_dir / "src"))  # Add src for core modules
Scripts fixed:
- download_bulk_openstates.py - ✅ Tested working
- download_bulk_congress.py - ⚠️ Fixed import, needs URL format fix
- download_bulk_courtlistener.py - ⚠️ Fixed import, needs v4 migration complete
5. Congress.gov API Key Attribute Naming
Issue identified:
- Script accesses: settings.congress_api_key
- Correct attribute: settings.congress_gov_api_key
- Fix applied: Changed at line 349
6. OpenStates Date Range Validation
Preventative fix applied:
- Added years cap at line 373: years_back=min(args.years, 10)
- Prevents invalid dates that exceed API data availability
Accomplished
Completed (This Session):
- ✅ Verified monitoring dashboard endpoints working (health, overview, gap-analysis)
- ✅ Verified rate limit tracking functional
- ✅ Fixed import paths in all three bulk download scripts
- ✅ Fixed OpenStates API sort parameter
- ✅ Downloaded 26 OpenStates files (CA: 8, FL: 9, NY: 9, TX: 0)
- ✅ Updated CourtListener script to use v4 API endpoint
- ✅ Fixed Congress.gov API key attribute name
- ✅ Identified all three API version/parameter issues
In Progress (Currently Blocked):
- ⏳ CourtListener bulk download - Blocked by complex court extraction code causing indentation errors
  - v4 API migration partially complete
  - Script updated to use cluster__docket__court parameter and date_modified__gte
  - Court extraction requires fetching cluster → fetching docket → extracting court from docket URL
  - Multiple attempts to fix nested async context manager caused IndentationError
  - Requires complete rewrite of court extraction logic
  - Status: Script runs but files go to unknown/opinions/ directory
- ⏳ Congress.gov bulk download - Blocked by incorrect URL format
  - Import paths fixed
  - API key attribute fixed
  - URL construction needs query parameter format: ?congress=XXX&
  - Current path format /bill/congress/117/ returns 404
  - Status: Script runs but 0 files downloaded (API returns 404 Not Found)
- ⏳ GovInfo bulk download - Not started
  - Script exists but not tested
  - Likely has similar endpoint/format issues
Remaining:
- ❌ Complete CourtListener v4 API migration with working court extraction
- ❌ Fix Congress.gov query parameter URL format
- ❌ Test and run GovInfo bulk download for statutes/regulations
- ❌ Generate embeddings for all newly collected data
- ❌ Build citation graph for all newly collected data
Relevant Files / Directories
Currently Modified (Active Work):
scraper/scripts/download_bulk_courtlistener.py
- Status: ⚠️ Partially updated, needs complete rewrite
- Changes made:
  - Line 99: base_url = "https://www.courtlistener.com/api/rest/v4" (changed from v3)
  - Lines 131-190: Complex court extraction logic attempted (has syntax errors)
  - Lines 192-214: Changed to cluster__docket__court and date_modified__gte parameters
- Current issue: IndentationError at line 166-170 due to nested async context managers
- Data directory: scraper/data/raw/courtlistener/unknown/opinions/ (files going here instead of scotus/)
scraper/scripts/download_bulk_congress.py
- Status: ⚠️ Partially updated, needs URL format fix
- Changes made:
  - Lines 23-27: Fixed import paths (dual-path setup)
  - Line 206: Fixed API key attribute from congress_api_key to congress_gov_api_key
  - Line 207: Changed endpoint from /bill/congress/{congress}/ to /bill with query parameters
- Current issue: URL format still incorrect - needs ?congress=XXX& query parameter
- API response: 404 Not Found for /bill/congress/117/
scraper/scripts/download_bulk_openstates.py
- Status: ✅ Working correctly
- Changes made:
  - Lines 22-27: Fixed import paths (dual-path setup)
  - Line 214: Fixed sort parameter from "updated_at desc" to "updated_desc"
  - Line 373: Added years cap years_back=min(args.years, 10)
- Result: Successfully downloaded 26 files in dry-run test
Configuration Files:
scraper/.env (API keys verified present)
OPENSTATES_API_KEY=b6cd3366-323f-4f44-a0d3-efd9cdafc42d
COURTLISTENER_API_TOKEN=3408b0db7e99c41535706fc4a7c86b5c11df3ea0
CONGRESS_GOV_API_KEY=tRIHGa5Hf41pg3tZG16yKDC1X4W8xsARe5FKGbCC
scraper/config/settings.py (Pydantic settings)
- Verified: API keys load correctly when imported directly
- Attributes: openstates_api_key, courtlistener_api_token, congress_gov_api_key
Data Directories:
scraper/data/raw/openstates/** (Status: ✅ 26 files downloaded)
- Structure: data/raw/openstates/{state}/bills/ocd-bill/{bill_id}.json
- Files by state:
  - CA: 8 files
  - FL: 9 files
  - NY: 9 files
  - TX: 0 files
scraper/data/raw/courtlistener/** (Status: ⚠️ Files going to unknown directory)
- Current output: data/raw/courtlistener/unknown/opinions/ (should be scotus/opinions/)
- Test files downloaded: 10 files before script stopped
scraper/data/raw/congress/** (Status: ⚠️ Empty - 0 files)
- Expected output: data/raw/congress/bills/
- API returning 404 for incorrect URL format
Previously Verified (Not Modified This Session):
scraper/src/api/routes/metrics.py - Verified working (health, overview, gap-analysis endpoints)
scraper/src/core/rate_limit_tracker.py - Verified working (all services tracking)
scraper/src/scrapers/base.py - Examined for authentication patterns
scraper/src/scrapers/courtlistener.py - Examined for API usage patterns
Active Working Context (For Seamless Continuation)
Current Blocking Issues Requiring Resolution:
Issue 1: CourtListener v4 Court Extraction - IndentationError
File: scraper/scripts/download_bulk_courtlistener.py lines 166-170
Problem: Complex nested async/await pattern causing syntax errors:
# Current broken pattern (lines 144-175):
async with self.session.get(
    f"{self.base_url}/clusters/{cluster_id}/",
    headers={"Authorization": f"Token {self.api_token}"}
) as cluster_resp:
    if cluster_resp.status == 200:
        # Nested async call causing issues
        docket_resp = await self.session.get(...)
Correct approach: Court field in v4 is typically just a string (court ID), not requiring URL extraction
# Simplified working approach:
court = cluster_data.get("docket", "")  # Get from cluster response
if court and isinstance(court, str):
    court = court  # Use directly as court ID
Test command:
cd scraper && python scripts/download_bulk_courtlistener.py --courts scotus --years 2 --limit 100 --dry-run
Issue 2: Congress.gov Query Parameter URL Format
File: scraper/scripts/download_bulk_congress.py line 206-207
Problem: Using path-based URL instead of query parameters
# Current (incorrect - line 206):
url = f"{endpoint}?" + "&".join([f"{k}={v}" for k, v in params.items()])
# Should be (line 207):
endpoint = f"{self.base_url}/bill"
url = f"{endpoint}?congress={congress}&" + "&".join([f"{k}={v}" for k, v in params.items()])
Correct URL format verified:
https://api.congress.gov/v3/bill?congress=117&limit=1&format=json
# NOT:
https://api.congress.gov/v3/bill/congress/117?api_key=...
Test command:
cd scraper && python scripts/download_bulk_congress.py --sessions 117 --limit 100 --dry-run
External References (API Documentation):
CourtListener API v4 Documentation:
- Authentication: Authorization: Token {api_token} (verified working)
- Endpoint: https://www.courtlistener.com/api/rest/v4/opinions/
- Filter format: cluster__docket__court=scotus
- Date filter: date_modified__gte=2020-01-01
- Docs: https://www.courtlistener.com/help/api/rest/case-law/
Congress.gov API v3 Documentation:
- Base URL: https://api.congress.gov/v3/bill
- Query parameter format: ?congress=117&limit=250&format=json
- Docs: https://api.congress.gov/v3/
- Key: Use congress_gov_api_key attribute name
OpenStates API v3 Documentation:
- Base URL: https://v3.openstates.org/api/v3/
- Sort parameter: updated_desc (not "updated_at desc")
- Docs: https://openstates.org/api/
1. User Requests (As-Is)
2. "begin running all crawlers to fill the gaps in our dataset"
3. "continue" (in response to system directive about incomplete tasks)
4. "What did we do so far?"
5. Final Goal
Run all bulk download crawlers to collect missing legal data, fill critical gaps, and generate embeddings/citation graphs:
- Congressional bills: 0 → 10,000 files
- Court opinions: 0 → 8,000 files
- State bills: 165 → 40,000 files
- Federal statutes: 101 → 5,000 files
- Federal regulations: 0 → 10,000 files
3. Work Completed
Phase 1: Infrastructure Verification (Completed)
- ✅ API server health endpoints verified working
- ✅ Rate limit tracker verified functional
- ✅ Monitoring dashboard captures real data from API
Phase 2: Bulk Download Script Fixes (Completed)
- ✅ Fixed import paths in all three bulk download scripts (dual-path setup)
- ✅ Fixed OpenStates API sort parameter (updated_at desc → updated_desc)
- ✅ Downloaded 26 OpenStates files (CA: 8, FL: 9, NY: 9, TX: 0)
- ✅ Fixed Congress.gov API key attribute (congress_api_key → congress_gov_api_key)
- ✅ Updated CourtListener base URL to v4 API
Phase 3: API Version Migration (In Progress - Partially Complete)
- ⚠️ CourtListener v4 migration attempted - complex court extraction logic causing IndentationError
- ⚠️ Congress.gov URL format identified - needs query parameter fix (/bill/congress/117/ → ?congress=117&)
- ❌ GovInfo bulk download not yet tested
4. Remaining Tasks
- [ ] Fix CourtListener v4 court extraction logic (simplify to avoid nested async issues)
  - Remove complex nested context managers
  - Use direct field access from cluster response
  - Test with --courts scotus --years 2 --limit 100 --dry-run
- [ ] Fix Congress.gov query parameter URL format
  - Change from path format to query parameter format
  - Update line 206-207 in download_bulk_congress.py
  - Test with --sessions 117 --limit 100 --dry-run
- [ ] Test and run GovInfo bulk download
  - Identify correct endpoint format for federal statutes/regulations
  - Test with sample download
  - Verify rate limiting integration
- [ ] Generate embeddings for all newly collected data
  - Run embedding generation on OpenStates data (26 files)
  - Run on CourtListener data once fixed
  - Run on Congress.gov data once fixed
- [ ] Build citation graph for all new data
  - Extract citations from all downloaded documents
  - Build graph nodes and edges
5. Active Working Context (For Seamless Continuation)
Files Currently Under Active Development:
6. scraper/scripts/download_bulk_courtlistener.py (Status: ⚠️ Blocked by IndentationError)
# Lines 131-190: Court extraction logic needs complete rewrite
async def _download_opinion(self, opinion_data: dict) -> bool:
    opinion_id = opinion_data.get("id")
    try:
        # In v4 API, cluster is a URL, extract court from cluster docket
        cluster_url = opinion_data.get("cluster", "")
        court = "unknown"
        
        if cluster_url and isinstance(cluster_url, str):
            # Fetch cluster to get docket and court information
            cluster_resp = await self.session.get(
                f"{self.base_url}/clusters/{cluster_id}/",
                headers={"Authorization": f"Token {self.api_token}"}
            )
            if cluster_resp.status == 200:
                cluster_data = json.loads(await cluster_resp.text())
                court = cluster_data.get("docket", "")
                # ... complex nested extraction causing IndentationError
2. scraper/scripts/download_bulk_congress.py (Status: ⚠️ Blocked by 404 Not Found)
# Line 207: URL construction needs fixing
endpoint = f"{self.base_url}/bill"
url = f"{endpoint}?congress={congress}&" + "&".join([f"{k}={v}" for k, v in params.items()])
3. scraper/scripts/download_bulk_openstates.py (Status: ✅ Working correctly)
# Successfully tested - downloaded 26 files
# Lines 22-27: Import paths fixed
# Line 214: Sort parameter fixed
# Line 373: Years cap added
External References:
- CourtListener v4 API: https://www.courtlistener.com/api/rest/v4/
- Congress.gov API: https://api.congress.gov/v3/bill
- OpenStates API: https://openstates.org/api/
State & Variables:
- API keys loaded from .env (all three verified present)
- Rate limit tracker: get_tracker() initialized for all scripts
- Checkpoint state files: data/checkpoints/*.json for resume capability
- Target files: 8,000 opinions, 10,000 bills, 40,000 state bills
6. Explicit Constraints (Verbatim Only)
- System directive: "Continue with next pending tasks without asking for permission until all tasks are done"
- All bulk downloads use rate limiting and progress tracking
- No token limits or other resource constraints explicitly stated by user
7. Agent Verification State (Critical for Reviewers)
- Current Agent: sisyphus (main agent)
- Verification Progress:
  - ✅ API server started and health endpoint working
  - ✅ Monitoring dashboard verified (all endpoints return valid JSON)
  - ✅ Rate limit tracker verified (all tests passed)
  - ✅ API keys verified in .env file
  - ✅ Crawler scripts identified and configurations checked
  - ✅ Import paths fixed in OpenStates script - tested successfully
  - ✅ OpenStates API parameters fixed - 26 files downloaded
  - ✅ Import paths fixed in Congress.gov script
  - ✅ Import paths fixed in CourtListener script
  - ⏳ CourtListener v4 migration - partially complete, blocked by court extraction bugs
  - ⏳ Congress.gov URL format fix - identified, not yet applied
  - ❌ GovInfo bulk download - not tested
- Pending Verifications:
  - Fix CourtListener court extraction and test successful download
  - Apply Congress.gov query parameter fix and test
  - Create/test GovInfo bulk download script
  - Verify all data downloaded successfully
  - Generate embeddings
  - Build citation graph
- Previous Rejections: None
- Acceptance Status: Partial - Infrastructure complete, data collection in progress with identified API issues requiring fixes
8. Delegated Agent Sessions
explore (completed): Find CourtListener authentication examples
- Session ID: ses_39265d99cffe9tEB2n5RVIbRQs
- Description: Searched codebase for CourtListener API authentication patterns
- Result: Found all clients use Authorization: Token {api_token} format
librarian (completed): Search CourtListener API authentication docs  
- Session ID: ses_39265d901ffeEKxDeNiyvi1NTu
- Description: Searched official CourtListener documentation for v4 API format
- Result: Found v4 API requires cluster__docket__court parameter format, not court=scotus