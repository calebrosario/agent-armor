Based on my research, here's a comprehensive analysis of bulk data options available to fill gaps in your dataset:
Current Schema Analysis
Your database has:
- ✅ Bills (basic info)
- ✅ Opinions (court decisions)
- ✅ Dockets (case metadata)
- ✅ Statutes (federal/state laws)
- ✅ PublicLaws (enacted federal laws)
- ✅ Judges, Courts, Jurisdictions
- ✅ Users (OAuth)
Missing Data - Bulk API Options
1. Congressional Voting Records 🇺🇸
Congress.gov API / Roll Call Votes
- Source: https://www.congress.gov/roll-call-votes
- Data: House roll call votes (2023-present, 118th-119th Congress)
- Format: JSON/CSV via API, bulk downloads available
- Coverage: All House votes with member-level breakdown
- Fields: Vote type, date, question, result, party breakdown, individual member votes
- Gap Fill: ❌ NO voting records in your schema
GovInfo Bulk Data
- Congressional Record (floor proceedings, debates, votes)
- Format: XML with USLM markup
- Coverage: Historical back to 1993
LegiScan (You have this!)
- State legislative roll calls
- Federal congressional roll calls
- Already available via get_roll_call() method
2. Bill Amendments & Versions 📝
GovInfo Bulk Data
- Bill Amendments XML: All amendments per bill
- Coverage: All federal bills (93rd-119th Congress)
- Format: XML with amendment text, sponsors, status
- Gap Fill: ❌ NO amendment tracking in your Bill model
LegiScan
- get_amendment_list(bill_id) - Amendment list per bill
- Already implemented in your scraper
Congress.gov API
- Amendment data for House/Senate bills
- Full text of amendments
- Adoption/rejection status
3. Legislative Members & Committees 👥
Congress.gov API / Member Data
- Source: https://www.congress.gov/members
- Data: 
  - Biographical profiles
  - Committee assignments (House/Senate)
  - Leadership positions
  - Voting history (if available)
  - Contact information
- Format: JSON API
- Gap Fill: ❌ NO members/committees tables in schema
GovInfo Bulk Data
- Committee Reports (full text)
- Congressional Directory (members)
- Format: XML
GovTrack.us
- Alternative Source: https://www.govtrack.us/about-our-data
- Data: Members, committees, votes, bills (community-curated)
- Format: CSV/JSON
- Advantage: Cleaned, normalized, includes historical data
4. Bill History & Actions 📊
GovInfo Bulk Data - Bill Status XML
- Source: https://www.govinfo.gov/bulkdata/BILLSTATUS
- Data: Detailed legislative steps for each bill
- Coverage: 113th-114th Congress (extending to 115th+)
- Format: XML
- Fields: 
  - Introduction dates
  - Committee referrals
  - Floor actions
  - Passage votes
  - Conference reports
  - Presidential actions
  - Enactment details
- Gap Fill: ❌ NO bill_actions/history table
LegiScan
- get_bill_history(bill_id, action_type) - Already implemented
- Returns chronological actions/events
Congress.gov API
- Bill actions timeline
- Committee report references
- Amendment history
5. Federal Regulations 📋
Federal Register Bulk Data
- Source: https://www.federalregister.gov/reader-aids/developer-resources/bulk-data
- Format: XML
- Coverage: Daily federal regulations, proposed rules, notices
- Size: ~50MB+ daily files
- Fields:
  - Agency name
  - Regulation type
  - Effective date
  - Public comment period
  - Full regulation text
- Gap Fill: ❌ NO regulations table in schema
  (Only have statutes - enacted laws, not pending regulations)
6. State Executive Orders 🏛️
No Federal Bulk Source (scattered)
- Federal Register has presidential proclamations/executive orders (mixed with regulations)
- No dedicated bulk source
LegiScan
- State executive actions (where available)
- Veto records
- Governor messages
7. Court-Related Data ⚖️
CourtListener Bulk Data (You use this!)
- Source: https://www.courtlistener.com/help/api/bulk-data/
- Available Bulk Downloads:
  - Case law (all opinions)
  - Dockets (case metadata)
  - Judges (biographies)
  - Oral arguments (audio/transcripts)
  - Financial disclosures
  - RECAP/PACER data
- Format: CSV/JSON
- Gap Fill: ⚠️ You have opinions/dockets, but missing:
  - Oral arguments
  - Financial disclosures (judges, attorneys)
  - Case clusters (related cases)
  - Opinion embeddings (for ML)
8. Historical Congressional Data 📜
GovInfo Bulk Data
- Statutes at Large (1789-1870+)
  - Declaration of Independence
  - Articles of Confederation
  - Constitution amendments
  - Historical treaties
- Coverage: Volumes 1-64
- Format: XML/PDF
- Gap Fill: ⚠️ PublicLaws table only goes back to 93rd Congress (1973)
Recommended Implementation Priority
High Priority (Immediate Impact)
1. Add Congressional Votes Table
      CREATE TABLE congressional_votes (
       id SERIAL PRIMARY KEY,
       bill_id VARCHAR(255) REFERENCES bills(id),
       chamber VARCHAR(10),  -- 'house' or 'senate'
       vote_date DATE,
       vote_number INTEGER,
       vote_question TEXT,
       vote_result VARCHAR(50),
       yeas INTEGER,
       nays INTEGER,
       not_voting INTEGER,
       present INTEGER,
       created_at TIMESTAMP
   );
   
   CREATE TABLE member_votes (
       id SERIAL PRIMARY KEY,
       vote_id INTEGER REFERENCES congressional_votes(id),
       member_id VARCHAR(50),
       vote VARCHAR(10),  -- 'yea', 'nay', 'present', 'not_voting'
       party VARCHAR(10),
       state VARCHAR(2),
       district INTEGER
   );
      Source: Congress.gov API (House 2023+), LegiScan (state/federal)
2. Add Bill Amendments Table
      CREATE TABLE bill_amendments (
       id SERIAL PRIMARY KEY,
       bill_id VARCHAR(255) REFERENCES bills(id),
       amendment_number VARCHAR(50),
       amendment_type VARCHAR(50),
       sponsor TEXT,
       chamber VARCHAR(20),
       date_offered DATE,
       status VARCHAR(50),
       description TEXT,
       text TEXT,
       created_at TIMESTAMP
   );
      Source: Congress.gov API, GovInfo bulk XML
3. Add Legislative Members Table
      CREATE TABLE members (
       id VARCHAR(50) PRIMARY KEY,
       name VARCHAR(255),
       chamber VARCHAR(20),  -- 'house', 'senate', 'state'
       party VARCHAR(50),
       state VARCHAR(2),
       district INTEGER,
       bio_guide_id VARCHAR(50),
       terms TEXT,  -- JSON array of service terms
       committees TEXT,  -- JSON array of committee assignments
       photo_url VARCHAR(512),
       active BOOLEAN DEFAULT TRUE
   );
   
   CREATE TABLE committee_assignments (
       id SERIAL PRIMARY KEY,
       member_id VARCHAR(50) REFERENCES members(id),
       committee_name VARCHAR(255),
       chamber VARCHAR(20),
       role VARCHAR(50),  -- 'chair', 'ranking_member', 'member'
       congress INTEGER,
       session INTEGER
   );
      Source: Congress.gov API, GovTrack.us data
Medium Priority (Enhanced Analytics)
4. Add Bill Actions/History Table
      CREATE TABLE bill_actions (
       id SERIAL PRIMARY KEY,
       bill_id VARCHAR(255) REFERENCES bills(id),
       action_date DATE,
       chamber VARCHAR(20),
       action_type VARCHAR(100),
       description TEXT,
       actor VARCHAR(255),  -- committee, chamber floor, president, etc.
       reference TEXT,  -- bill number, amendment number, etc.
       created_at TIMESTAMP
   );
      Source: GovInfo Bill Status XML, LegiScan API
5. Add Federal Regulations Table
      CREATE TABLE regulations (
       id VARCHAR(255) PRIMARY KEY,
       agency VARCHAR(255),
       regulation_number VARCHAR(100),
       title TEXT,
       type VARCHAR(50),  -- 'proposed_rule', 'final_rule', 'notice'
       publication_date DATE,
       effective_date DATE,
       comment_deadline DATE,
       docket_number VARCHAR(100),
       full_text TEXT,
       pdf_url VARCHAR(512)
   );
      Source: Federal Register bulk XML
Low Priority (Historical/Academic)
6. Add Historical Public Laws
   - Pre-93rd Congress data (1789-1972)
   - Source: GovInfo Statutes at Large bulk XML
   - Enriches existing public_laws table
7. Add Oral Arguments
      CREATE TABLE oral_arguments (
       id INTEGER PRIMARY KEY,
       opinion_id INTEGER REFERENCES opinions(id),
       docket_number VARCHAR(100),
       court_id VARCHAR(50),
       argument_date DATE,
       audio_url VARCHAR(512),
       transcript_url VARCHAR(512),
       duration_minutes INTEGER
   );
      Source: CourtListener bulk CSV
8. Add Case Clusters
   - Related cases graph
   - Precedent tracking
   - Source: CourtListener API
Bulk Data Download Summary
| Source | Data Type | Format | Size | Update Frequency | API Endpoint |
|---------|-----------|---------|-------|-----------------|---------------|
| GovInfo | Bills (all Congress) | XML | Per Congress | /bulkdata/BILLS |
| GovInfo | Bill Status | XML | Per Congress | /bulkdata/BILLSTATUS |
| GovInfo | Statutes at Large | XML | Historical | /bulkdata/STATUTE |
| GovInfo | Federal Register | XML | Daily | /bulkdata/FR |
| Congress.gov | House Roll Call Votes | JSON | Daily (beta) | /roll-call-votes |
| Congress.gov | Members | JSON | Real-time | /members |
| Congress.gov | Committees | JSON | Real-time | /committees |
| CourtListener | Opinions | CSV | Snapshots | /api/bulk-data/ |
| CourtListener | Dockets | CSV | Snapshots | /api/bulk-data/ |
| CourtListener | Judges | CSV | Snapshots | /api/bulk-data/ |
| LegiScan | State Bills (all) | JSON/CSV | Weekly | /CA/datasets |
| LegiScan | Congressional Bills | JSON/CSV | Weekly | /US/datasets |
| GovTrack.us | Member Bios | CSV | Periodic | GitHub repos |
Implementation Recommendations
Strategy 1: API Integration (Recommended for recent data)
Pros:
- Real-time updates
- Efficient incremental updates
- Full API filtering capabilities
- Lower initial setup
Cons:
- Rate limits apply
- More complex implementation
- Dependency on third-party uptime
Use For:
- Congressional votes (Congress.gov API)
- Member data (Congress.gov API)
- Recent bills/actions (LegiScan API)
- Search functionality
Strategy 2: Bulk Data Imports (Recommended for historical data)
Pros:
- Complete historical coverage
- No rate limiting
- One-time setup
- Faster initial data load
- Better for ML training data
Cons:
- Large storage requirements (hundreds of GB)
- Processing time (XML parsing)
- Update frequency depends on source
Use For:
- GovInfo bulk imports (Bills, Status, Statutes, FR)
- CourtListener bulk imports (opinions, dockets, judges)
- Historical congressional data (pre-93rd Congress)
- LegiScan bulk datasets (state sessions)
Strategy 3: Hybrid Approach (Optimal)
Phase 1: Bulk import historical data (all sources)
Phase 2: Set up API integration for incremental updates
Phase 3: Schedule weekly/monthly bulk refreshes
Benefits:
- Complete historical coverage
- Efficient ongoing updates
- Redundancy (API + bulk)
- Backup capabilities
Next Steps
1. Database Schema Expansion
   - Add 8 new tables (votes, amendments, members, committees, actions, regulations, oral_args, etc.)
   - Update Bill model to include amendment_count, action_count fields
2. Bulk Data Integration Scripts
   - Create scripts/bulk_import_govinfo.py
   - Create scripts/bulk_import_courtlistener.py
   - Create scripts/bulk_import_legiscan.py
3. API Update Integrators
   - Create scripts/update_congress_votes.py
   - Create scripts/update_member_data.py
   - Create scripts/update_federal_register.py
4. Data Processing Pipeline
   - XML → JSON transformation utilities
   - Bulk validation scripts
   - Duplicate detection
   - Incremental update logic
Estimated Storage Requirements:
- GovInfo Bills (last 10 Congresses): ~20 GB
- CourtListener Opinions (all courts): ~50 GB
- Federal Register (5 years): ~50 GB
- LegiScan (50 states × 10 years): ~30 GB
- Total Initial Load: ~150 GB