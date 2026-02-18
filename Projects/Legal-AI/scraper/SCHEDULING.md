# Scheduling Legal AI Crawlers

This document explains how to set up automated, scheduled execution of data crawlers.

## Overview

The crawlers can be scheduled to run automatically using one of several methods:

1. **Cron Jobs** - Simple, works on all Unix-like systems
2. **Systemd Timers** - Native Linux scheduling, more robust than cron
3. **Docker Cron** - Ideal for containerized deployments
4. **GitHub Actions** - Serverless, managed scheduling

All methods use the same underlying script: `scripts/run_nightly_crawlers.sh`

## Prerequisites

- Python 3.11+ installed
- Virtual environment set up (optional but recommended)
- Database access configured in `.env` file
- API keys configured in environment variables or `.env`

## Option 1: Cron Jobs (Simplest)

### Setup

1. Copy the cron example:
```bash
cp scraper/cron-example.txt ~/my-cron-entry.txt
```

2. Edit the cron entry to match your needs:
```bash
nano ~/my-cron-entry.txt
```

3. Install to your crontab:
```bash
crontab ~/my-cron-entry.txt
```

Or add directly:
```bash
crontab -e
```

Add this line:
```
0 2 * * * /Users/calebrosario/Documents/sandbox/legal-ai/scraper/scripts/run_nightly_crawlers.sh
```

### Verify

Check your crontab:
```bash
crontab -l
```

Test with dry-run:
```bash
./scraper/scripts/run_nightly_crawlers.sh --dry-run
```

### Cron Schedule Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Daily at 2 AM | `0 2 * * *` | Once per day |
| 4 times daily | `0 */6 * * *` | Every 6 hours |
| Weekdays at 2 AM | `0 2 * * 1-5` | Mon-Fri only |
| Weekends at 2 AM | `0 2 * * 6,7` | Sat-Sun only |
| Monthly 1st at 2 AM | `0 2 1 * *` | First day of month |

### Logs

Logs are stored in: `scraper/logs/crawlers/nightly_YYYYMMDD_HHMMSS.log`

Old logs are automatically cleaned up (kept for 30 days).

## Option 2: Systemd Timers (Linux Only)

### Setup

1. Copy service and timer files:
```bash
sudo cp scraper/scripts/legal-ai-crawlers.service /etc/systemd/system/
sudo cp scraper/scripts/legal-ai-crawlers.timer /etc/systemd/system/
```

2. Edit the timer file to customize schedule:
```bash
sudo nano /etc/systemd/system/legal-ai-crawlers.timer
```

3. Reload systemd:
```bash
sudo systemctl daemon-reload
```

4. Enable the timer:
```bash
sudo systemctl enable legal-ai-crawlers.timer
```

5. Start the timer:
```bash
sudo systemctl start legal-ai-crawlers.timer
```

### Verify

Check timer status:
```bash
systemctl status legal-ai-crawlers.timer
systemctl list-timers
```

Check next scheduled run:
```bash
systemctl show legal-ai-crawlers.timer | grep Next
```

View logs:
```bash
journalctl -u legal-ai-crawlers.service -f
```

### Systemd Schedule Format

Edit the `OnCalendar=` line in `legal-ai-crawlers.timer`:

| Schedule | Format | Description |
|----------|---------|-------------|
| Daily at 2 AM | `OnCalendar=*-*-* 02:00:00` | Once per day |
| Every 6 hours | `OnCalendar=*-*-* 00,06,12,18:00:00` | 4 times daily |
| Weekdays at 2 AM | `OnCalendar=Mon,Tue,Wed,Thu,Fri *-*-* 02:00:00` | Mon-Fri only |
| Weekends at 2 AM | `OnCalendar=Sat,Sun *-*-* 02:00:00` | Sat-Sun only |

## Option 3: Docker Cron (Containerized)

### Setup

1. Build and start the cron service:
```bash
cd scraper
docker-compose -f docker-compose.cron.yml up -d crawlers-cron
```

2. View logs:
```bash
docker-compose -f docker-compose.cron.yml logs -f crawlers-cron
```

### Customization

Edit `docker-compose.cron.yml`:

1. Change the timezone:
```yaml
environment:
  - TZ=America/Los_Angeles  # Your timezone
```

2. Change the cron schedule (inside command):
```yaml
command: >
  sh -c "
    echo '0 2 * * * cd /app/scraper && ./scripts/run_nightly_crawlers.sh' > /etc/cron.d/legal-ai-crawlers
  "
```

3. Adjust concurrent crawlers:
```yaml
command: >
  sh -c "
    echo '0 2 * * * cd /app/scraper && ./scripts/run_nightly_crawlers.sh --concurrent 6' > /etc/cron.d/legal-ai-crawlers
  "
```

### Run Once (Manual)

```bash
docker-compose -f docker-compose.cron.yml --profile manual up crawlers-once
```

## Option 4: GitHub Actions (Serverless)

### Setup

1. Go to GitHub repository settings
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `OPENSTATES_API_KEY` | OpenStates API key | `your_api_key` |
| `COURTLISTENER_API_KEY` | CourtListener API key | `your_api_key` |
| `CONGRESS_GOV_API_KEY` | Congress.gov API key | `your_api_key` |
| `GOVINFO_API_KEY` | GovInfo API key | `your_api_key` |

4. Commit the workflow file:
```bash
git add .github/workflows/nightly-crawlers.yml
git commit -m "Add nightly crawler workflow"
git push
```

### Customization

Edit `.github/workflows/nightly-crawlers.yml`:

1. Change schedule:
```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
  - cron: '0 */6 * * *'  # Every 6 hours
```

2. Change concurrent crawlers (default is 4):
```yaml
- name: Run crawlers (scheduled)
  run: |
    python3 scripts/run_all_crawlers.py --concurrent 6
```

### Manual Trigger

Go to **Actions** > **Nightly Data Crawlers** > **Run workflow**

Or use GitHub CLI:
```bash
gh workflow run nightly-crawlers.yml
```

### Monitor Execution

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. View logs for each step
4. Download log artifacts

## Monitoring and Troubleshooting

### Check Logs

**Cron/Systemd:**
```bash
# Recent logs
ls -lt scraper/logs/crawlers/ | head -10

# View specific log
cat scraper/logs/crawlers/nightly_20260202_020001.log

# Tail log (if still running)
tail -f scraper/logs/crawlers/nightly_$(date +%Y%m%d)*.log
```

**Docker:**
```bash
docker-compose -f docker-compose.cron.yml logs -f crawlers-cron
```

**GitHub Actions:**
View in Actions tab > Workflow run > Steps

### Check Crawler Status

Check what's been crawled:
```bash
cd scraper
python3 -m src.cli status
```

### Common Issues

**Issue: Crawler not running**
- Verify crontab: `crontab -l`
- Check file permissions: `ls -la scripts/run_nightly_crawlers.sh`
- Test manually: `./scripts/run_nightly_crawlers.sh`

**Issue: Database connection errors**
- Check `.env` file exists and has correct values
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check firewall rules

**Issue: API rate limits**
- Crawlers automatically handle rate limits
- Logs will show rate limit wait times
- Adjust schedule frequency if hitting limits

**Issue: Out of disk space**
- Monitor disk usage: `df -h`
- Check data directory size: `du -sh data/raw/`
- Configure log cleanup (already keeps 30 days by default)

## Performance Optimization

### Adjust Concurrent Crawlers

Default: 4 crawlers running in parallel

For faster execution (more concurrent crawlers):
```bash
# Cron: add --concurrent flag
0 2 * * * /path/to/run_nightly_crawlers.sh --concurrent 6

# Systemd: edit service ExecStart
ExecStart=/path/to/run_nightly_crawlers.sh --concurrent 6

# Docker: edit command
--concurrent 6

# GitHub Actions: edit workflow step
python3 scripts/run_all_crawlers.py --concurrent 6
```

**Note:** More concurrent crawlers = faster execution but higher API usage.

### Fresh Start vs Resume

Default: Resume from previous state (avoids re-downloading data)

For fresh start every run:
```bash
./scripts/run_nightly_crawlers.sh --no-resume
```

Use when you want to:
- Re-download all data (e.g., fixing bugs)
- Ensure latest data is captured
- Start from scratch

## Security Considerations

1. **Environment Variables**
   - Store API keys in `.env` file (already in `.gitignore`)
   - For GitHub Actions, use repository secrets
   - Never commit API keys to git

2. **File Permissions**
   - Set executable: `chmod +x scripts/run_nightly_crawlers.sh`
   - Restrict access: `chmod 700 scraper/logs/`
   - Systemd runs as defined user in service file

3. **Network Security**
   - Consider running behind VPN if scraping sensitive sources
   - Use HTTPS for all API connections
   - Monitor for unusual crawler activity

## Best Practices

1. **Test Before Scheduling**
   ```bash
   ./scripts/run_nightly_crawlers.sh --dry-run
   ./scripts/run_nightly_crawlers.sh --no-resume
   ```

2. **Choose Off-Peak Times**
   - Schedule for 2-4 AM your local time
   - Avoid business hours (9 AM - 6 PM)
   - Consider API rate limit reset times

3. **Monitor Regularly**
   - Check logs weekly
   - Verify data is being collected
   - Watch for error patterns

4. **Keep Backups**
   - Back up database regularly
   - Export data periodically
   - Store logs securely

5. **Document Changes**
   - Note any schedule changes in project docs
   - Update team on configuration changes
   - Track performance over time

## Option E: Federal Register Crawler

Run Federal Register crawler for agency rules and notices:

```bash
# Get help
python3 -m src.cli federalregister --help

# Sample crawl - RULE documents from last 5 years
python3 -m src.cli federalregister --document-types RULE --years-back 5 --max-pages 10

# Full crawl with all document types
python3 -m src.cli federalregister --document-types RULE,PRORULE,NOTICE,PRESDOCU --years-back 25 --include-full-text

# Filter by specific agency
python3 -m src.cli federalregister --agency SEC --years-back 10

# Filter by topic
python3 -m src.cli federalregister --topic environment --document-types RULE,NOTICE

# Date range
python3 -m src.cli federalregister --start-date 2020-01-01 --end-date 2023-12-31
```

Common document types:
- **RULE**: Final rules
- **PRORULE**: Proposed rules  
- **NOTICE**: General notices
- **PRESDOCU**: Presidential documents

**Rate Limiting**:
- Self-imposed limit: 300 requests/hour (1 request every 12 seconds)
- Public API - no official rate limits documented
- Adjust `rate_limit_requests` in config if needed

**Notes**:
- Federal Register data available from ~2000-present
- Use `--include-full-text` to download complete document text
- Use `--max-pages` to limit initial crawl for testing
- Resume supported via Postgres state manager

## Advanced Configuration

### Selective Crawlers

If you don't want to run all crawlers, create custom scripts:

```bash
#!/bin/bash
# scripts/run_contract_crawlers_only.sh
cd "$(dirname "$0")/.."

# Only run contract crawlers
python3 -m src.cli onecle --max-forms 100
python3 -m src.cli sec-edgar --years-back 1
python3 -m src.cli justia --max-forms 50
```

Schedule this script instead of the full run_all_crawlers.

### Conditional Scheduling

Skip runs on certain conditions:

```bash
#!/bin/bash
# scripts/run_weekday_only.sh
# Skip weekends

DAY_OF_WEEK=$(date +%u)  # 1=Mon, 7=Sun

if [ $DAY_OF_WEEK -ge 6 ]; then
    echo "Skipping weekend run"
    exit 0
fi

./scripts/run_nightly_crawlers.sh
```

### Health Checks

Add health check after crawler run:

```bash
#!/bin/bash
# scripts/run_and_check.sh
./scripts/run_nightly_crawlers.sh

# Check if data was collected
if [ $(find data/raw -type f -mtime -1 | wc -l) -eq 0 ]; then
    echo "WARNING: No new data collected"
    # Send alert or log
fi

# Check database
python3 -m src.cli status
```

## Support

For issues or questions:

1. Check logs: `scraper/logs/crawlers/`
2. Review documentation: `scraper/README.md`
3. Check crawler status: `python3 -m src.cli status`
4. Open GitHub issue with relevant logs

## Summary

| Method | Complexity | Platform | Maintenance | Best For |
|--------|-----------|----------|-------------|-----------|
| Cron | Low | Unix/Mac/Linux | Manual file editing | Simple setups |
| Systemd | Medium | Linux | System service | Production servers |
| Docker Cron | Medium | Docker | Container updates | Containerized apps |
| GitHub Actions | Low | Any | Web UI | Cloud/CI/CD |

Choose the method that best fits your deployment environment and operational preferences.
