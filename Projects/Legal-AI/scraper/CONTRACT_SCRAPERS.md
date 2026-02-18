# Contract Scrapers

Overview of contract data scraping infrastructure for legal document collection.

## Table of Contents

- [Purpose](#purpose)
- [Architecture](#architecture)
- [Data Sources](#data-sources)
- [Installation](#installation)
- [Usage](#usage)
- [CLI Commands](#cli-commands)
- [Database Schema](#database-schema)
- [Validation](#validation)
- [Expected Output](#expected-output)

## Purpose

Collect contract and legal form data for LLM training. Target: **50,000+ contracts** (~1B tokens)

### Training Target Breakdown
- **Contracts/Forms**: 10% of total training data
- **Current Collection**: 0% (Phase 1 complete)
- **Goal**: ~50,000 contracts from 8 sources

## Architecture

```
scraper/
├── src/
│   ├── scrapers/
│   │   └── contract/
│   │       ├── __init__.py
│   │       ├── base_contract.py          # Base scraper with contract extraction
│   │       ├── sec_edgar.py              # SEC EDGAR scraper (WIP)
│   │       └── onecle.py                # OneCLE scraper
│   └── crawlers/
│       └── contract/
│           ├── __init__.py
│           ├── client.py                  # SEC EDGAR async client
│           ├── crawler.py                 # SEC EDGAR crawler
│           └── onecle_crawler.py          # OneCLE crawler
├── src/core/
│   ├── config.py                        # Settings classes
│   │   ├── SecEdgarSettings
│   │   ├── ContractSettings (base)
│   │   └── OneCLESettings
│   ├── rate_limiter.py                  # Rate limiting
│   └── rate_limit_tracker.py             # Tracker with SERVICE_CONFIGS
├── src/database/
│   ├── schema.py                         # ImportedContract model
│   └── migrations/
│       └── 002_add_imported_contracts.sql  # Database migration
└── scripts/
    └── validate_contracts.py             # Data validation script
```

### Key Components

1. **BaseContractScraper**: Base class for all contract scrapers
   - Contract text extraction (HTML, JSON, plain text)
   - Contract type classification (8 types)
   - Party/date/clause extraction
   - Normalization to standard format

2. **BaseCrawler**: Async crawler framework
   - State management (resume support)
   - Storage abstraction (filesystem)
   - Rate limiting
   - Progress tracking

3. **Rate Limiting**:
   - SEC EDGAR: 36,000 req/hour (10 req/sec)
   - OneCLE: 300 req/hour (respectful scraping)

## Data Sources

### Implemented

| Source | Priority | Status | Expected Output | Rate Limit |
|---------|----------|--------|-----------------|-------------|
| SEC EDGAR | CRITICAL | Complete | 20,000 | 10 req/sec |
| OneCLE | HIGH | Complete | 2,000 | 5 req/sec |

### Planned

| Source | Priority | Expected Output | Notes |
|---------|----------|-----------------|-------|
| US Legal Forms | CRITICAL | 5,000 | airSlate API required |
| Justia | HIGH | 1,000 | Public content only |
| Rocket Lawyer | HIGH | 2,000 | OAuth 2.0 API |
| LegalZoom | HIGH | 2,000 | Limited public API |
| LawDepot | HIGH | 5,000 | White label program |

## Installation

```bash
# Install dependencies
cd scraper
pip install -r requirements.txt

# Update .env with required keys
# SEC EDGAR: No API key required (User-Agent header)
# OneCLE: No API key required (public content)
```

### Environment Variables

```bash
# SEC EDGAR
SEC_EDGAR_CONTACT_EMAIL=your@email.com
SEC_EDGAR_USER_AGENT="LegalContractScraper/1.0"

# OneCLE (optional)
ONECLE_CATEGORIES="nda,service_agreements,licensing"
ONECLE_MAX_FORMS_PER_CATEGORY=100
```

## Usage

### CLI Commands

```bash
# Run SEC EDGAR scraper
python -m src.cli sec-edgar \
  --ciks "320193,789019" \
  --form-types "10-K,10-Q" \
  --years-back 5 \
  --max-filings 10 \
  --max-concurrent 10

# Run OneCLE scraper
python -m src.cli onecle \
  --categories "nda,service_agreements" \
  --max-forms 100 \
  --max-concurrent 5

# Run all crawlers in parallel
python scraper/scripts/run_all_crawlers.py \
  --concurrent 4 \
  --no-resume
```

### CLI Options

**SEC EDGAR**:
- `--ciks`: Comma-separated CIKs (or default Russell 3000)
- `--form-types`: SEC form types (default: 10-K,10-Q)
- `--years-back`: Years back to scrape (default: 5)
- `--max-filings`: Max filings per company
- `--max-concurrent`: Concurrent requests (default: 10)
- `--no-resume`: Don't resume from previous state

**OneCLE**:
- `--categories`: Comma-separated categories or "all"
- `--max-forms`: Max forms per category
- `--max-concurrent`: Concurrent requests (default: 10)
- `--no-resume`: Don't resume from previous state

## Database Schema

```sql
CREATE TABLE imported_contracts (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,              -- Source name (sec_edgar, onecle, etc.)
    external_id VARCHAR(255) NOT NULL UNIQUE, -- Source-specific ID
    contract_type VARCHAR(100),              -- Contract type classification
    title TEXT,                               -- Contract title
    text TEXT,                                -- Full contract text
    date DATE,                                -- Contract date
    parties JSONB,                             -- Extracted party names
    clauses JSONB,                             -- Extracted clauses
    raw_data JSONB NOT NULL,                   -- Original source data
    imported_at TIMESTAMP DEFAULT NOW(),       -- Import timestamp
    updated_at TIMESTAMP DEFAULT NOW()         -- Update timestamp
);

-- Indexes
CREATE INDEX idx_contracts_source ON imported_contracts(source);
CREATE INDEX idx_contracts_contract_type ON imported_contracts(contract_type);
CREATE INDEX idx_contracts_date ON imported_contracts(date);
CREATE UNIQUE INDEX idx_contracts_source_external ON imported_contracts(source, external_id);
```

### Contract Types

- `employment`: Employment agreements, offer letters, severance
- `service`: Service agreements, MSAs, consulting
- `license`: Licensing agreements, software licenses
- `lease`: Lease agreements, rental contracts
- `purchase`: Purchase agreements, M&A documents
- `nda`: Non-disclosure agreements, confidentiality
- `loan`: Loan agreements, credit agreements, promissory notes
- `partnership`: Partnership agreements
- `consulting`: Consulting agreements
- `merger`: Merger agreements
- `acquisition`: Acquisition agreements
- `severance`: Severance agreements
- `licensing`: Licensing agreements
- `supply`: Supply agreements
- `distribution`: Distribution agreements
- `other`: Uncategorized

## Validation

Run validation on scraped contracts:

```bash
# Validate all contracts
python scraper/scripts/validate_contracts.py

# Validate specific source
python scraper/scripts/validate_contracts.py --source sec_edgar --limit 1000

# Validate with custom quality threshold
python scraper/scripts/validate_contracts.py --min-quality 70.0
```

### Validation Criteria

- **Text Quality**:
  - Minimum length: 500 characters
  - Maximum length: 500,000 characters
  - Readability score (sentences, paragraphs)

- **Metadata**:
  - Required fields: text, title, source, external_id
  - Valid contract type
  - Valid date format (YYYY-MM-DD)

- **Duplicates**:
  - MD5 hash of normalized text
  - Detect duplicates across all sources

- **Quality Score** (0-100):
  - Text completeness (40 points)
  - Title quality (20 points)
  - Metadata completeness (20 points)
  - Readability (20 points)

### Quality Thresholds

| Score Range | Grade | Acceptable |
|-------------|-------|------------|
| 90-100 | Excellent | Yes |
| 70-89 | Good | Yes |
| 50-69 | Acceptable | Yes |
| 0-49 | Poor | No |

### Output

```
Validation Summary
Total Contracts: 1000
Passed: 950 (95.0%)
Failed: 50 (5.0%)
Duplicates: 15 (1.5%)
Average Quality: 78.5%

Contract Validation Results
ID   Source    Title    Text Len Quality  Dup  Issues
1    sec_edgar  Employment 12,345  85%     No   -
2    onecle     NDA       8,901  92%     No   -

Results exported to: validation_results.json
```

## Expected Output

### SEC EDGAR
- **Companies**: Russell 3000 (subset for testing: 15 tech companies)
- **Filings per Company**: ~7 (10-K + 10-Q over 5 years)
- **Total Contracts**: 20,000+
- **Data Fields**: CIK, form type, filing date, accession number

### OneCLE
- **Categories**: 13 categories
- **Contracts per Category**: ~150-200
- **Total Contracts**: 2,000+
- **Contract Types**: NDA, service agreements, licensing, employment, etc.

### Combined
- **Total Documents**: 22,000+ contracts
- **Estimated Tokens**: ~440M (20K avg × 22K chars/token)
- **File Format**: JSONL (one contract per line)
- **Storage**: ~2-3 GB raw JSON

## Rate Limiting

### SEC EDGAR
- **Official Limit**: 10 requests/second
- **Daily Cap**: 200,000 requests
- **Configuration**: `rate_limit_requests: int = 36000`

### OneCLE
- **Respectful Limit**: 5 requests/second (300 req/hour)
- **Delay**: 1 second between requests
- **Configuration**: `rate_limit_requests: int = 300`

## Resume Support

All crawlers support resume from previous runs:
- Checkpoint per: company (SEC) or category (OneCLE)
- State stored in PostgreSQL
- Skip already crawled items
- Progress tracking via CLI

Run with `--no-resume` to restart from scratch.

## Troubleshooting

### Import Errors
```bash
# Error: ModuleNotFoundError: No module named 'bs4'
# Solution: pip install beautifulsoup4
pip install beautifulsoup4>=4.12.0
```

### Rate Limit Errors
```bash
# Error: HTTP 429 Too Many Requests
# Solution: Increase request delay or reduce concurrency
# SEC EDGAR: Max 10 req/sec
# OneCLE: Wait longer between requests
```

### Database Connection
```bash
# Error: Cannot connect to state manager
# Solution: Check DATABASE_URL in .env
# Falls back to MemoryStateManager (offline mode)
```

## Next Steps

1. **Phase 2 (Week 3-4)**: Implement US Legal Forms and Justia scrapers
2. **Phase 3 (Week 4-5)**: Implement API-based scrapers (Rocket Lawyer, LegalZoom, LawDepot)
3. **Phase 4 (Week 5)**: Complete integration testing
4. **Phase 5 (Week 6)**: Full production run to collect 50K contracts

## References

- [SEC EDGAR API Documentation](https://www.sec.gov/edgar/search-filings)
- [SEC EDGAR Rate Limits](https://www.sec.gov/privacy.shtml#security_notice)
- [Base Scraper Documentation](scraper/src/scrapers/base.py)
- [Base Crawler Documentation](scraper/src/core/base_crawler.py)
- [Rate Limiter Documentation](scraper/src/core/rate_limiter.py)

## Credits

Implementation based on existing scraper architecture:
- BaseScraper: Synchronous API scrapers
- BaseCrawler: Async batch crawlers
- BaseClient: HTTP client with rate limiting
- State Manager: PostgreSQL-based state tracking
- Storage Manager: Filesystem storage abstraction
