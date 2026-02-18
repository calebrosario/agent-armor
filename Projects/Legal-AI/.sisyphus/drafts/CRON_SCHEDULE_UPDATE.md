# Cron Job Configuration Update

## Schedule Changed: Every 2 Hours

**Previous Schedule:** Daily at 2:00 AM (`0 2 * * *`)
**New Schedule:** Every 2 hours (`0 */2 * * *`)

## Execution Times

The crawler will now run at:
- 12:00 AM (midnight)
- 2:00 AM
- 4:00 AM
- 6:00 AM
- 8:00 AM
- 10:00 AM
- 12:00 PM (noon)
- 2:00 PM
- 4:00 PM
- 6:00 PM
- 8:00 PM
- 10:00 PM

## Current Crontab Entry

```cron
0 */2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

## Manual Update Required

Due to system permissions, the crontab could not be updated automatically. Please run the following command:

```bash
crontab -e
```

Then replace the line:
```
0 2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

With:
```
0 */2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

Save and exit the editor.

## Alternative: Single Command Update

If you prefer, you can update with a single command:

```bash
(crontab -l 2>/dev/null | grep -v "run_nightly_crawlers"; echo "0 */2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh") | crontab -
```

## Verification

After updating, verify the crontab:

```bash
crontab -l
```

Expected output:
```
0 */2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

## Schedule Rationale

**Why Every 2 Hours?**

1. **Data Freshness**: More frequent runs keep data up to date
2. **Rate Limit Distribution**: Spreads requests throughout the day
3. **Smaller Batches**: Each run processes fewer items, faster completion
4. **Error Recovery**: Faster detection and recovery from issues
5. **Incremental Collection**: Continuous data collection instead of large daily batches

## Scheduled Crawlers (7 total)

| Crawler | Rate Limit | Expected Duration |
|----------|-------------|-------------------|
| OpenStates | 6,000 req/hr | 30-60 min |
| CourtListener | 1,000 req/day | 20-40 min |
| Congress.gov | 4,000 req/hr | 30-60 min |
| GovInfo | 1,000 req/hr | 20-30 min |
| Federal Register | 300 req/hr | 5-10 min |
| OneCLE | No limit | 10-15 min |
| SEC EDGAR | 10 req/second | 15-20 min |

## Monitoring

### Check Log Files

```bash
# List recent crawler logs
ls -la /Users/calebrosario/Documents/sandbox/legal-ai/scraper/logs/crawlers/ | tail -10

# View most recent log
tail -100 /Users/calebrosario/Documents/sandbox/legal-ai/scraper/logs/crawlers/nightly_*.log

# Monitor in real-time
tail -f /Users/calebrosario/Documents/sandbox/legal-ai/scraper/logs/crawlers/nightly_*.log
```

### Check Cron Execution

```bash
# View cron system logs
log show --predicate 'process == "cron"' --last 1h

# Check next scheduled run
crontab -l | grep run_nightly
```

### Check Database State

```bash
cd /Users/calebrosario/Documents/sandbox/legal-ai/scraper
source venv/bin/activate

# Check crawler status in PostgreSQL
python -c "
import asyncio
from src.core.state.postgres import PostgresStateManager

async def check_status():
    sm = PostgresStateManager()
    await sm.initialize()
    
    # Get all crawler stats
    stats = await sm.get_all_crawler_stats()
    for stat in stats:
        print(f'{stat[\"crawler_name\"]}: {stat[\"status\"]} ({stat[\"items_completed\"]} items)')
    
    await sm.close()

asyncio.run(check_status())
"
```

## Adjustments

### To Change Back to Daily

Edit crontab and use:
```cron
0 2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

### To Change to Hourly

Edit crontab and use:
```cron
0 * * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

### To Change to Every 6 Hours

Edit crontab and use:
```cron
0 */6 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

### To Disable Temporarily

Comment out the line in crontab:
```cron
# 0 */2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

## Data Growth Estimates

Assuming successful 2-hour runs:

| Time Frame | Runs | Documents per Run | Total Documents |
|-----------|-------|-------------------|-----------------|
| 1 Day | 12 | ~500-1,000 | ~6,000-12,000 |
| 1 Week | 84 | ~500-1,000 | ~42,000-84,000 |
| 1 Month | ~364 | ~500-1,000 | ~182,000-364,000 |

*Note: Actual document count depends on rate limits and API responses.*

## Troubleshooting

### If Crawlers Don't Run

1. **Check crontab**: `crontab -l`
2. **Check cron service**: `sudo launchctl list | grep cron`
3. **Check logs**: `ls -la scraper/logs/crawlers/`
4. **Test manually**: `cd scraper && ./scripts/run_nightly_crawlers.sh`

### If Crawlers Run but No Data

1. **Check API keys**: `cat scraper/.env`
2. **Check database**: `pg_isready -h localhost -p 5432`
3. **Check virtual environment**: `ls -la scraper/venv/bin/activate`
4. **Check permissions**: `ls -la scraper/data/raw/`

### If Rate Limits Hit

Rate limits are normal. Crawlers will:
- Wait for reset automatically
- Resume from last checkpoint
- Complete in next scheduled run

---
**Created:** 2026-02-06
**Status:** Manual update required due to system permissions
