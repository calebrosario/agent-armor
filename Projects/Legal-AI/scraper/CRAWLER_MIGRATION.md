# ARCHIVED: Standalone Crawler Directories

The following directories contained standalone crawler implementations that have been consolidated into the unified `scraper/` project as part of the crawler migration (branch: `sisyphus/crawler-migration`).

## Archived Projects

| Directory | Status | New Location |
|-----------|--------|--------------|
| `openstates/` | Archived | `scraper/src/crawlers/openstates/` |
| `CourtListener/` | Archived | `scraper/src/crawlers/courtlistener/` |
| `congress.gov/` | Archived | `scraper/src/crawlers/congress_gov/` |
| `govinfo-crawler/` | Archived | `scraper/src/crawlers/govinfo/` |

## Migration Summary

All crawlers have been refactored to use shared infrastructure:

- **BaseClient**: Async HTTP with retry/backoff
- **BaseCrawler**: Common crawling patterns
- **RateLimiter**: Token bucket rate limiting
- **StateManager**: PostgreSQL-backed state tracking
- **StorageManager**: Async JSON file storage

## Using the Unified Crawler

```bash
cd scraper

# OpenStates
python -m src.cli openstates --api-key YOUR_KEY --jurisdictions ca,fl,ny

# CourtListener
python -m src.cli courtlistener --api-token YOUR_TOKEN --courts scotus,ca9

# Congress.gov
python -m src.cli congress --api-key YOUR_KEY --congress-start 117

# GovInfo
python -m src.cli govinfo --collections BILLS,FR --min-year 2020

# Check status
python -m src.cli status
```

## Data Migration

Existing data from standalone crawlers can be imported using:

```bash
python scripts/batch_import.py --data-dir /path/to/old/data
```

## Deprecation Notice

These standalone directories should NOT be used for new crawling operations. They are retained only for reference and to preserve any data that was previously downloaded.

To remove after data migration:
```bash
rm -rf openstates/ CourtListener/ congress.gov/ govinfo-crawler/
```
