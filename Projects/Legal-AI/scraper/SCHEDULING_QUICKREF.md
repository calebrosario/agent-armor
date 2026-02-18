# Quick Reference: Crawler Scheduling

## Choose Your Method

```
Quick & Simple          Production Linux        Containerized           Cloud/CI
  │                         │                      │                      │
  ▼                         ▼                      ▼                      ▼
Cron Jobs           Systemd Timers        Docker Cron        GitHub Actions
```

## Installation Commands

### Cron (Any Unix)
```bash
# Quick setup
echo "0 2 * * * $(pwd)/scripts/run_nightly_crawlers.sh" | crontab -

# View
crontab -l

# Edit
crontab -e
```

### Systemd (Linux)
```bash
# Install service and timer
sudo cp scripts/legal-ai-crawlers.service /etc/systemd/system/
sudo cp scripts/legal-ai-crawlers.timer /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable legal-ai-crawlers.timer
sudo systemctl start legal-ai-crawlers.timer

# Check status
systemctl status legal-ai-crawlers.timer
```

### Docker (Any)
```bash
# Start cron service
docker-compose -f docker-compose.cron.yml up -d crawlers-cron

# View logs
docker-compose -f docker-compose.cron.yml logs -f crawlers-cron

# Run once (manual)
docker-compose -f docker-compose.cron.yml --profile manual up crawlers-once
```

### GitHub Actions
```bash
# 1. Add secrets in GitHub UI
#    Settings > Secrets > Actions
# 2. Commit workflow file (already there)
git add .github/workflows/nightly-crawlers.yml
git push

# 3. Trigger manually
gh workflow run nightly-crawlers.yml

# 4. View in browser
open https://github.com/calebrosario/legal-ai/actions
```

## Schedule Examples

| When | Cron | Systemd | GitHub Actions |
|------|-------|----------|---------------|
| Daily 2 AM | `0 2 * * *` | `OnCalendar=*-*-* 02:00:00` | `cron: '0 2 * * *'` |
| Every 6 hrs | `0 */6 * * *` | `OnCalendar=*-*-* 00,06,12,18:00:00` | `cron: '0 */6 * * *'` |
| Weekdays 2 AM | `0 2 * * 1-5` | `OnCalendar=Mon,Tue,Wed,Thu,Fri *-*-* 02:00:00` | `cron: '0 2 * * 1-5'` |
| Weekends 2 AM | `0 2 * * 6,7` | `OnCalendar=Sat,Sun *-*-* 02:00:00` | `cron: '0 2 * * 6,7'` |

## Common Options

```bash
# Default (4 concurrent, resume enabled)
./scripts/run_nightly_crawlers.sh

# More concurrent (6 crawlers)
./scripts/run_nightly_crawlers.sh --concurrent 6

# Fresh start (no resume)
./scripts/run_nightly_crawlers.sh --no-resume

# Test without running
./scripts/run_nightly_crawlers.sh --dry-run
```

## Log Locations

| Method | Log Path |
|--------|-----------|
| Cron | `logs/crawlers/nightly_YYYYMMDD_HHMMSS.log` |
| Systemd | `logs/crawlers/systemd.log` (or `journalctl -u legal-ai-crawlers`) |
| Docker | View with `docker-compose logs -f` |
| GitHub Actions | Download artifacts from Actions tab |

## Troubleshooting

### Not running?
```bash
# Check file is executable
ls -la scripts/run_nightly_crawlers.sh

# Test manually
./scripts/run_nightly_crawlers.sh

# Check cron/systemd status
crontab -l  # or
systemctl list-timers
```

### Database errors?
```bash
# Check .env file
cat .env | grep DATABASE

# Test connection
pg_isready -h localhost

# Check PostgreSQL is running
brew services list postgres  # macOS
systemctl status postgresql  # Linux
```

### API rate limits?
- Crawlers automatically wait for rate limit resets
- Check logs for "rate limit" messages
- Adjust schedule frequency if hitting limits

## Comparison

| Method | Pros | Cons | Best For |
|--------|-------|-------|----------|
| Cron | Simple, universal | Limited error handling | Quick setups |
| Systemd | Robust, auto-restart | Linux only | Production servers |
| Docker Cron | Portable, isolated | Requires Docker | Containerized apps |
| GitHub Actions | Web UI, serverless | Requires GitHub secrets | Cloud/CI/CD |

## Next Steps

1. Read full guide: [SCHEDULING.md](./SCHEDULING.md)
2. Choose your scheduling method (above table)
3. Test with `--dry-run` first
4. Schedule and verify it runs
5. Monitor logs regularly

## Support

- Full docs: [SCHEDULING.md](./SCHEDULING.md)
- Main README: [README.md](./README.md)
- Check status: `python3 -m src.cli status`
- Issues: GitHub repository
