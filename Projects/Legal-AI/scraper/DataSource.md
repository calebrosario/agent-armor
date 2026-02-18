# 📊 COMPREHENSIVE REPORT: Legal Document Download Sources

Based on extensive research, here are all the legal sources where you can legally download legal documents with their rates, authentication, and file types:

---

## 🏛️ FEDERAL CASE LAW / OPINIONS

### **1. CourtListener API (Free Law Project)** ⭐ RECOMMENDED
- **URL**: https://www.courtlistener.com/api/rest/v4/
- **Data Types**:
  - Opinions (9M+ decisions from 2,000+ courts)
  - Dockets (federal case metadata)
  - Oral argument audio
  - Judges (16K+ federal/state judges)
  - Financial disclosures (32K+ documents)
- **Authentication**: Token, Cookie, or HTTP Basic auth
- **Rate Limits**: 5,000 queries/hour (authenticated)
- **Cost**: FREE
- **Data Formats**: JSON (default), XML, HTML, CSV
- **Bulk Download**:
  - CSV files via AWS S3 bucket
  - Monthly updates
  - ~2TB embeddings available (~$200 AWS cost to download)
- **Coverage**: All federal courts + state courts, 1658-2020+
- **Documentation**: https://www.courtlistener.com/help/api/rest/

### **2. Caselaw Access Project** ⚠️ SUNSET
- **Status**: Original API sunset Sept 2024 - all data now via CourtListener
- **Coverage**: 6.7M cases, 40M+ pages, all official state/federal case law
- **Legacy Rate Limit**: 500 calls/day (public)
- **File Formats**: JSON, HTML, PDF, XML
- **Current Access**: Use CourtListener API (above)

---

## 📜 FEDERAL STATUTES / PUBLIC LAWS / REGULATIONS

### **3. GovInfo API (GPO)** ⭐ RECOMMENDED
- **URL**: https://api.govinfo.gov/
- **Data Types**:
  - Federal Register (FR)
  - Code of Federal Regulations (CFR)
  - U.S. Code (USCODE)
  - Statutes at Large (STATUTE)
  - Congressional Bills (BILLS)
  - Public & Private Laws (PLAW)
  - Congressional Record (CREC)
  - Committee Reports (CRPT)
- **Authentication**: API key required (40-char key)
  - Signup: https://www.govinfo.gov/api-signup (FREE)
- **Rate Limits**:
  - Standard key: 1,000 requests/hour
  - DEMO_KEY: 30 requests/hour, 50 requests/day
- **Cost**: FREE API key
- **Data Formats**:
  - PDF (digitally signed, official)
  - XML (machine-readable)
  - HTML
  - MODS/PREMIS metadata
  - ZIP (complete package)
  - EPUB, TEXT, JPG, MP3, XLS (select)
- **Bulk Download**:
  - XML bulk data: 1996-present (CFR, FR, USCODE, BILLS)
  - Bulk JSON available
  - Available via https://www.govinfo.gov/bulkdata
- **Coverage**:
  - Congressional bills: 1993-present (full text), 1973-present (records)
  - Historical bills: 1799-1873 (limited metadata)
  - CFR: 1996-present (bulk), current (electronic)
  - Federal Register: 2000-present (bulk XML)
  - U.S. Code: Annual editions
- **Documentation**: https://api.govinfo.gov/docs

### **4. Congress.gov API** ⭐ RECOMMENDED
- **URL**: https://api.data.gov/congress/v3/
- **Data Types**:
  - Bills & resolutions (1973-present)
  - Amendments (1981-present)
  - Committees
  - Members of Congress
  - Nominations
  - Treaties
  - Committee Reports
- **Authentication**: API key required
  - Signup: https://api.congress.gov/sign-up (FREE)
- **Rate Limits**: 5,000 requests/hour
- **Cost**: FREE
- **Data Formats**: XML, JSON
- **Pagination**: Default 20 results, max 250 results per request
- **Coverage**:
  - Bills: 93rd Congress (1973) to present
  - Full text: 103rd Congress (1993) to present
  - Historical: 1799-1873 (some bills, limited metadata)
  - Current: 119th Congress (2025-2026)
- **Documentation**: https://api.congress.gov/

### **5. Federal Register API**
- **URL**: https://www.federalregister.gov/developers/documentation/api/v1
- **Data Types**: Federal Register documents (2000-present)
- **Authentication**: NO API KEY REQUIRED
- **Rate Limits**: No explicit limits stated
- **Cost**: FREE
- **Data Formats**: JSON, CSV
- **Content**: Rules, proposed rules, notices, presidential documents

---

## ⚖️ DOCKET DATA (FEDERAL)

### **6. CourtListener RECAP Archive**
- **Source**: Largest open collection of federal court data
- **Data Types**:
  - Hundreds of millions of docket entries
  - Nearly every federal case
  - Millions of documents
- **Authentication**: Token (Free)
- **Rate Limits**: 5,000 queries/hour
- **Cost**: FREE
- **Data Formats**: JSON, CSV
- **API Endpoints**:
  - /api/rest/v4/dockets/ - Docket metadata
  - /api/rest/v4/docket-entries/ - Entries
  - /api/rest/v4/recap-documents/ - Documents with plain text
  - /api/rest/v4/recap-fetch/ - Fetch from PACER using your credentials
- **Coverage**: All federal courts
- **Documentation**: https://www.courtlistener.com/help/api/rest/pacer/

### **7. PACER (Official)**
- **URL**: https://pacer.uscourts.gov/
- **Data Types**: Federal court dockets, documents, case info
- **Authentication**: PACER account required
- **Cost**: $0.10/page, capped at $3/document
- **Rate Limits**: Account can be suspended for congestion
- **Fee Waiver**: Free if ≤$30/quarter accrued
- **Free Access**: Judicial opinions always free
- **Documentation**: https://pacer.uscourts.gov/help/

---

## 🏘️ STATE LAWS / REGULATIONS

### **8. Open States API** ⭐ RECOMMENDED
- **Coverage**: All 50 states + DC + Puerto Rico
- **URL**: https://docs.openstates.org/api-v3/
- **Data Types**:
  - State bills & resolutions
  - Legislators & votes
  - Committees & events
- **Authentication**: API key (free registration)
- **Rate Limits**: Tiered (~10 requests/second default)
- **Cost**: FREE tier available
- **Data Formats**:
  - JSON (API v3, GraphQL)
  - CSV (bulk)
  - YAML, PostgreSQL dumps
- **Bulk Download**:
  - CSV files per session
  - JSON archives with full text
  - Monthly PostgreSQL database dumps
  - Geographic boundary data (JSON)
- **Source**: https://open.pluralpolicy.com/data/

### **9. OpenLaws API**
- **Coverage**: 50 states + federal (FED), DC, Puerto Rico
- **Data Types**:
  - Statutes (suffix: -STAT)
  - Regulations (suffix: -RR)
  - Constitutions
  - Case Law (published opinions only)
  - 4.3M+ sections of law
- **Authentication**: API key required (Bearer token)
- **Rate Limits**: Not publicly documented - requires contact
- **Cost**: Contact for pricing (enterprise options available)
- **Data Formats**:
  - Markdown (CommonMark specification)
  - JSONL (for bulk data)
  - HTML (renderable)
  - Plaintext (for case law opinions only)
- **Features**:
  - Bluebook citation queries
  - Keyword search (BM25)
  - Hierarchical queries
  - 50-state surveys
  - Unified data model across 53 jurisdictions
- **Documentation**: https://openlaws.apidocumentation.com/
- **Coverage**: 6.86 million statutes/regulations, 10.3 million opinions, 98% overall

### **10. LegiScan API**
- **Coverage**: All 50 states + US Congress
- **URL**: https://legiscan.com/legiscan
- **Data Types**: State and federal legislation
- **Authentication**: API key (free registration)
- **Rate Limits**:
  - Public API: 30,000 queries/month
  - Pull API (subscription): 100,000-250,000 queries/month
  - Push API: Enterprise (real-time replication)
- **Cost**: Subscription-based by number of states
- **Data Formats**: JSON (API), CSV (bulk)
- **Bulk Download**: Weekly datasets per state/session (CSV + JSON)
- **Example**: California 2023-2024 session available
- **Documentation**: https://legiscan.com/legiscan

### **11. New York Open Legislation**
- **Coverage**: NY Senate & Assembly
- **URL**: https://legislation.nysenate.gov/
- **Data Types**: Bills, resolutions, laws, transcripts since 1993
- **Authentication**: API key (free)
- **Rate Limits**: Not specified
- **Cost**: FREE
- **Data Formats**: JSON, XML, RSS, ATOM
- **Bulk Options**: Full session data via API
- **Documentation**: https://legislation.nysenate.gov/static/docs/html/index.html

### **12. QuantGov (State RegData)**
- **Coverage**: State regulations & statutes
- **URL**: https://www.quantgov.org/csv-download
- **Data Types**: Regulatory counts, restriction metrics
- **Authentication**: None for downloads
- **Cost**: FREE
- **License**: CC BY 4.0 (Creative Commons)
- **Data Formats**: CSV
- **Available**:
  - State RegData 2023 (regulations)
  - State RegData 2023 (statutes)
  - Older versions: 2021-2022

### **13. State Decoded**
- **Platform**: Open-source platform for legal codes
- **URL**: https://docs.statedecoded.com/
- **Data Types**: State/municipal codes, regulations
- **Authentication**: API key
- **Data Formats**: XML, JSON, bulk downloads
- **Features**: Generates website + API + bulk downloads from source data
- **Note**: Requires ongoing source of government machine-readable data

---

## 🗂️ STATE COURT DOCUMENTS

### **14. UniCourt Enterprise API**
- **Coverage**: 3,000+ state/federal courts, 40+ states
- **URL**: https://unicourt.com/solutions/enterprise-api
- **Data Types**: Dockets, cases, documents, rulings
- **Authentication**: Contact sales (Enterprise only)
- **Pricing**:
  - Personal: $49/mo (50 searches)
  - Professional: $149/mo (200 searches)
  - Premium: $299/mo (unlimited)
  - Enterprise: Custom
- **Data Formats**: JSON (AI-normalized)
- **Features**: PACER API, judge analytics, smart search, alerts

### **15. Trellis API**
- **Coverage**: State trial courts + federal courts
- **URL**: https://trellis.law/
- **Data Types**: Case info, documents, dockets, alerts
- **Authentication**: Token (contact sales)
- **Cost**: Enterprise pricing (free trial available)
- **Data Formats**: JSON (AI-enhanced)
- **Features**: Judge analytics, docket refresh, law firm insights

### **16. Docket Alarm API**
- **Coverage**: Federal + many state courts (CA, TX, FL, NY, etc.)
- **URL**: https://www.docketalarm.com/api
- **Data Types**: Dockets, documents, alerts
- **Authentication**: API key
- **Pricing**:
  - Flat-Fee: $99/mo (unlimited search + docs)
  - Pay-As-You-Go: $39.99/mo + $4/doc + $3/docket update
- **Features**: Bulk docket pull, PACER API, case alerts

### **17. Michigan MiCOURT API**
- **Coverage**: Michigan state courts (JIS system)
- **URL**: https://developer.micourt.courts.michigan.gov/docs
- **Authentication**: OAuth2 + Subscription Key
- **Data Formats**: JSON
- **Features**: Case search, calendar/hearings lookup, eFile

### **18. North Carolina RPA**
- **Coverage**: All 100 NC counties
- **URL**: https://www.nccourts.gov/services/remote-public-access-program
- **Authentication**: License required
- **Pricing**: $4/minute, $500 minimum balance
- **Data Formats**: Real-time & bulk access
- **Systems**: ACIS (criminal), VCAP (civil), FACTS (family)

---

## 📊 SUMMARY TABLE

| Source | Opinions | Statutes | Dockets | Public Laws | Regulations | Cost | Rate Limit |
|---------|-----------|-----------|----------|-------------|--------------|-------|------------|
| **CourtListener** | ✅ 9M+ | ❌ | ✅ Federal | ❌ | ❌ | FREE | 5K/hr |
| **GovInfo** | ❌ | ✅ USCODE | ❌ | ✅ PLAW | ✅ FR, CFR | FREE | 1K/hr |
| **Congress.gov** | ❌ | ✅ Bills | ❌ | ✅ Via bills | ❌ | FREE | 5K/hr |
| **Open States** | ❌ | ✅ Bills | ❌ | ❌ | ❌ | FREE tier | ~10/sec |
| **OpenLaws** | ✅ Case Law | ✅ 50 states | ❌ | ❌ | ✅ | Enterprise | ? |
| **LegiScan** | ❌ | ✅ 50 states | ❌ | ❌ | ❌ | Subscription | 30K/mo |
| **UniCourt** | ❌ | ❌ | ✅ 40+ states | ❌ | ❌ | $49-299/mo | Plan-based |
| **Trellis** | ❌ | ❌ | ✅ State/Fed | ❌ | ❌ | Enterprise | Custom |
| **Docket Alarm** | ❌ | ❌ | ✅ Fed+State | ❌ | ❌ | $39.99-99/mo | Plan-based |
| **QuantGov** | ❌ | ✅ Stats | ❌ | ❌ | ✅ State/Fed | FREE | None |
| **CAP** | ✅ 6.7M | ❌ | ❌ | ❌ | ❌ | FREE | 500/day* |

\* CAP API sunset - use CourtListener

---

## 🎯 RECOMMENDATIONS BY USE CASE

### **For Case Law / Opinions:**
1. **CourtListener API** (FREE, 9M+ opinions, all courts)
2. **UniCourt** (Enterprise, normalized data, AI-enhanced)

### **For Federal Statutes / Public Laws:**
1. **GovInfo API** (Official source, XML bulk downloads, FR, CFR, USCODE, PLAW)
2. **Congress.gov API** (Legislative data, bills, committees)

### **For State Laws / Regulations:**
1. **Open States** (FREE, covers all 50 states, bulk CSV/JSON)
2. **OpenLaws** (4.3M+ sections, statutes + regulations, 50 states)
3. **LegiScan** (Comprehensive, commercial, weekly datasets)
4. **QuantGov** (Regulatory metrics, CSV, CC BY 4.0)

### **For Docket Data:**
1. **CourtListener RECAP Archive** (FREE, federal, millions of dockets/docs)
2. **UniCourt** (Enterprise, 40+ states, AI-normalized)
3. **Docket Alarm** (Federal + state courts, bulk pull available)

### **Best Free Options:**
- **CourtListener** (case law, dockets, RECAP data)
- **GovInfo** (federal statutes, public laws, regulations)
- **Congress.gov** (legislative data)
- **Open States** (state legislature data)
- **QuantGov** (regulatory metrics)

### **For Enterprise/Commercial Needs:**
- **UniCourt** (most comprehensive court data)
- **LegiScan** (comprehensive legislature tracking)
- **Trellis** (AI-enhanced insights)

---

## 📁 FILE FORMAT AVAILABILITY SUMMARY

| Format | Sources Supporting It |
|---------|---------------------|
| **JSON** | CourtListener, GovInfo, Congress.gov, Open States, OpenLaws, LegiScan, UniCourt, Trellis, Federal Register |
| **XML** | GovInfo, Congress.gov, CourtListener, NY Open Legislation, State Decoded |
| **CSV** | CourtListener (bulk), Open States (bulk), LegiScan (bulk), QuantGov, Federal Register |
| **PDF** | GovInfo (official), CAP (via CourtListener), PACER, UniCourt |
| **HTML** | GovInfo, CourtListener, CAP, Federal Register |
| **TEXT/Plain** | CourtListener, GovInfo |
| **PostgreSQL** | Open States (monthly dumps) |
| **ZIP** | GovInfo (complete packages), CAP (volume downloads) |

---

## 🔑 API KEY REQUIREMENTS

| Source | API Key Required? | Signup Process |
|---------|-------------------|----------------|
| CourtListener | Yes (production) | Free account on site |
| GovInfo | Yes | https://www.govinfo.gov/api-signup (FREE) |
| Congress.gov | Yes | https://api.congress.gov/sign-up (FREE) |
| Open States | Yes | Free registration |
| OpenLaws | Yes | Contact for 25-min onboarding session |
| LegiScan | Yes | Free registration |
| UniCourt | Yes | Contact sales |
| Trellis | Yes | Contact sales |
| Docket Alarm | Yes | Subscribe |
| Federal Register | **NO** | HTTP client only |

---

## 📚 DATA COUNTS BY SOURCE

| Source | Opinions | Statutes | Dockets | Documents | Regulations |
|---------|-----------|-----------|----------|------------|-------------|
| **CourtListener** | 9M+ | - | Federal only | Millions | - |
| **GovInfo** | - | USCODE Annual | - | All federal | FR + CFR |
| **Congress.gov** | - | Bills 1973+ | - | - | - |
| **Open States** | - | Bills 50 states | - | - | - |
| **OpenLaws** | 10.3M | 6.86M | - | - | Yes |
| **CAP** | 6.7M | - | - | 40M pages | - |
| **UniCourt** | - | - | 40+ states | - | - |

---

## 🔍 DETAILED BREAKDOWN BY DOCUMENT TYPE

### **Case Law / Opinions**
- **CourtListener**: 9M+ opinions, 2,000+ courts, 1658-2020+, JSON/XML/HTML/CSV
- **OpenLaws**: 10.3M opinions, 6,000+ courts, GraphQL API
- **CAP**: 6.7M cases, 40M pages (now via CourtListener)

### **Federal Statutes / Public Laws**
- **GovInfo**: U.S. Code (annual), Statutes at Large, Public/Private Laws, XML/PDF
- **Congress.gov**: Bills 1973-present, full text 1993-present, XML/JSON

### **Federal Regulations**
- **GovInfo**: Code of Federal Regulations (CFR), Federal Register (FR), XML bulk 1996-present

### **State Laws / Regulations**
- **OpenLaws**: 6.86M statutes/regulations across 50 states, Markdown/JSONL
- **Open States**: Bills, legislators, votes for 50 states, JSON/CSV bulk
- **LegiScan**: All 50 states legislation, JSON/CSV weekly datasets
- **QuantGov**: Regulatory metrics, CSV downloads, CC BY 4.0

### **Dockets**
- **CourtListener**: Federal dockets, millions of entries/documents, JSON/CSV
- **UniCourt**: 40+ states, AI-normalized, JSON
- **Docket Alarm**: Federal + state courts, bulk pull available
- **PACER**: All federal courts, $0.10/page, capped $3/doc

---

## 💡 IMPLEMENTATION TIPS

1. **Start with free sources**: CourtListener, GovInfo, Congress.gov, Open States
2. **Use bulk downloads for large datasets**: CourtListener S3, GovInfo bulk, Open States CSV
3. **Monitor rate limits**: Use headers like `X-RateLimit-Remaining` (GovInfo)
4. **Handle pagination**: Most APIs use cursor-based pagination (CourtListener v4) or offset/limit
5. **Cache responses**: Respect rate limits and avoid redundant queries
6. **Use field selection**: Reduce bandwidth by requesting only needed fields (CourtListener: `?fields=id,name`)
7. **Implement retry logic**: Handle 429 responses with exponential backoff
8. **Check for bulk data first**: Often cheaper than API for complete datasets

---

## 📞 SUPPORT RESOURCES

### **Official Documentation**
- CourtListener: https://www.courtlistener.com/help/api/rest/
- GovInfo: https://api.govinfo.gov/docs
- Congress.gov: https://api.congress.gov/
- Open States: https://docs.openstates.org/
- OpenLaws: https://openlaws.apidocumentation.com/
- LegiScan: https://legiscan.com/legiscan
- Federal Register: https://www.federalregister.gov/developers/

### **Community & Support**
- GitHub repos for most projects
- API support contact pages
- Discussion forums (CourtListener GitHub Discussions)

---

This comprehensive research gives you all the legal sources you need for downloading statutes, opinions, dockets, public laws, regulations, and state laws. All recommendations include authentication requirements, rate limits, costs, and file types available.

**Last Updated**: January 15, 2026
