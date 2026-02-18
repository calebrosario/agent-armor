# Beads Monitoring System - Setup and Usage Guide

**Version:** 1.0
**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Components](#components)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Cron Setup](#cron-setup)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The Beads Monitoring System provides comprehensive monitoring, alerting, and health checking for your beads task management workflow.

### Components

1. **Beads Dashboard** (`beads-dashboard`) - Real-time monitoring dashboard
2. **Automated Alerts** (`beads-alerts`) - Threshold-based alerting system
3. **Health Check** (`beads-health-check`) - Health checks with historical tracking
4. **Configuration** (`.beads-monitoring-config.json`) - Centralized configuration

### Features

- Real-time task metrics visualization
- Automated alerting on threshold violations
- Historical trend analysis
- Health scoring system
- Configurable thresholds and alerts
- Multiple alert delivery methods
- Automated scheduling options

---

## Installation

### Prerequisites

- Beads CLI installed and configured
- `jq` for JSON processing
- `git` for sync tracking
- Terminal with color support (optional)

### Install Scripts

All monitoring scripts should be in `~/.local/bin/` and executable:

```bash
# Check scripts exist
ls -la ~/.local/bin/beads-dashboard
ls -la ~/.local/bin/beads-alerts
ls -la ~/.local/bin/beads-health-check

# If missing, ensure they were created during installation
# All scripts should be executable (chmod +x)
```

### Verify Installation

```bash
# Test each script
beads-dashboard --help
beads-alerts --help
beads-health-check --help

# Check configuration file
cat ~/.beads-monitoring-config.json
```

---

## Quick Start

### 1. Run Dashboard

```bash
# Start monitoring dashboard (60s refresh)
beads-dashboard

# Start with custom refresh (30s)
beads-dashboard 30
```

The dashboard shows:
- Task summary (total, ready, in-progress, stuck)
- Status breakdown (open, testing, done, closed)
- Performance metrics (list time, ready time)
- Active alerts
- 7-day trends
- Quick action buttons

### 2. Run Health Check

```bash
# Run comprehensive health check
beads-health-check

# View health history
beads-health-check history 20

# Export health data
beads-health-check export backup.json
```

### 3. Test Alerts

```bash
# Run alert checks
beads-alerts run

# View recent alerts
beads-alerts view 50

# Send test alert
beads-alerts test
```

---

## Components

### Beads Dashboard

**Purpose:** Real-time visualization of beads metrics

**Usage:**
```bash
beads-dashboard [refresh-interval]
```

**Features:**
- Task counts by status
- Ready tasks waiting for work
- Stuck tasks detection
- Performance metrics
- Active alerts display
- Historical trends
- Interactive actions

**Refresh Intervals:**
- `5` - Testing (frequent refreshes)
- `30` - Active development
- `60` - Normal usage (default)
- `300` - Background monitoring

**Dashboard Controls:**
- `[r]` - Refresh now
- `[q]` - Quit dashboard
- `[1]` - View ready tasks
- `[2]` - View in-progress tasks
- `[3]` - View stuck tasks
- `[4]` - Run full health check
- `[5]` - View historical trends

---

### Automated Alerts

**Purpose:** Monitor beads and send alerts on threshold violations

**Usage:**
```bash
beads-alerts [command] [options]
```

**Commands:**
- `run` - Run alert checks (default)
- `view [n]` - View recent alerts (default: 20)
- `clear` - Clear alert suppression
- `test` - Test alert system
- `config` - View configuration

**Alert Types:**

| Alert Type | Trigger | Severity | Message |
|------------|----------|----------|---------|
| Stuck Tasks | Tasks in-progress >7 days | High | Stuck tasks detected |
| Too Many In Progress | >5 concurrent tasks | Medium | Too many concurrent tasks |
| Empty Backlog | 0 ready tasks | Low | Backlog empty |
| Large Backlog | >20 ready tasks | Medium | Large backlog |
| Slow Performance | List/ready >200ms | Medium | Slow performance |
| Stale Sync | Sync >168 hours | High | Stale git sync |

**Alert Suppression:**
- **Cooldown:** 60 minutes per alert type
- **Rate Limit:** Max 10 alerts per hour
- **Deduplication:** 5 minute window

**Configuration:**

Edit `~/.beads-alerts.json` (created on first run):

```json
{
  "thresholds": {
    "max_in_progress": 5,
    "max_stuck_days": 7,
    "min_ready_tasks": 1,
    "max_ready_tasks": 20,
    "max_list_time_ms": 200,
    "max_ready_time_ms": 200,
    "max_sync_age_hours": 168
  },
  "alert_methods": {
    "log": true,
    "terminal": true,
    "notification": false,
    "webhook": {
      "enabled": false,
      "url": ""
    }
  },
  "enabled_alerts": {
    "stuck_tasks": true,
    "too_many_in_progress": true,
    "empty_backlog": true,
    "large_backlog": true,
    "slow_performance": true,
    "stale_sync": true
  }
}
```

---

### Health Check

**Purpose:** Comprehensive health check with historical tracking

**Usage:**
```bash
beads-health-check [command] [options]
```

**Commands:**
- `check` - Run health check (default)
- `history [n]` - View history (default: 10)
- `export [file]` - Export history to file

**Health Score Calculation:**

| Factor | Penalty |
|--------|----------|
| Stuck tasks | -10 per task |
| In-progress >5 | -5 per task over limit |
| Empty backlog | -10 |
| Slow performance | -10 |
| Stale sync (>168h) | -20 |

**Score Ranges:**
- 80-100: Excellent ✓
- 60-79: Good ⚠
- 40-59: Fair ⚠
- 0-39: Poor ⚠

**Metrics Tracked:**
- Task counts by status
- Stuck tasks
- Performance metrics (list/ready time)
- Sync age
- Beads daemon status
- Git availability

**Historical Analysis:**
- Last 30 health checks stored
- Trend analysis for key metrics
- Average calculations over 10-check windows
- Export capability for external analysis

---

## Configuration

### Main Configuration File

**Location:** `~/.beads-monitoring-config.json`

**Sections:**

#### Monitoring
```json
{
  "monitoring": {
    "enabled": true,
    "data_dir": "$HOME/.local/share/beads-monitoring",
    "log_dir": "$HOME/.local/share/beads-monitoring/logs",
    "retention_days": 90
  }
}
```

#### Dashboard
```json
{
  "dashboard": {
    "enabled": true,
    "refresh_interval_seconds": 60,
    "max_history_points": 100,
    "show_performance": true,
    "show_trends": true
  }
}
```

#### Health Check
```json
{
  "health_check": {
    "enabled": true,
    "schedule": "0 9 * * 1-5",
    "history_retention_checks": 30,
    "export_on_completion": false
  }
}
```

#### Alerts
```json
{
  "alerts": {
    "enabled": true,
    "thresholds": { ... },
    "alert_types": { ... },
    "suppression": { ... },
    "delivery": { ... }
  }
}
```

### Environment Variables

Override configuration with environment variables:

```bash
# Alert configuration
export BEADS_ALERTS_CONFIG=/path/to/config.json
export BEADS_MONITOR_LOG_DIR=/path/to/logs

# Monitor directory
export BEADS_MONITOR_DIR=/path/to/monitor
```

---

## Usage

### Daily Workflow

**Morning:**
```bash
# Run health check
beads-health-check

# Check alerts
beads-alerts view

# Start dashboard
beads-dashboard
```

**During Work:**
```bash
# Dashboard refreshes automatically
# Or press [r] to refresh manually
# View ready tasks with [1]
# View stuck tasks with [3]
```

**End of Day:**
```bash
# Run health check
beads-health-check

# Check for new alerts
beads-alerts view

# Sync beads
bd sync
```

---

### Weekly Workflow

**Monday:**
```bash
# Review weekly trends
beads-health-check history

# Check alert frequency
beads-alerts view 100

# Adjust thresholds if needed
# Edit ~/.beads-alerts.json
```

---

### Monitoring Different Projects

**Method 1: BEADS_DIR**
```bash
export BEADS_DIR=~/work/project-a/.beads
beads-health-check
```

**Method 2: Change Directory**
```bash
cd ~/work/project-a
beads-dashboard
```

**Method 3: Multiple Terminals**
```bash
# Terminal 1: Project A
cd ~/work/project-a && beads-dashboard

# Terminal 2: Project B
cd ~/work/project-b && beads-dashboard
```

---

## Cron Setup

### Automated Health Checks

Add to crontab:

```bash
# Edit crontab
crontab -e
```

**Daily Health Check (9am weekdays):**
```
0 9 * * 1-5 /usr/local/bin/beads-health-check >> ~/.local/share/beads-monitoring/logs/cron.log 2>&1
```

**Hourly Alert Check:**
```
0 * * * * /usr/local/bin/beads-alerts run >> ~/.local/share/beads-monitoring/logs/cron.log 2>&1
```

**Weekly Report (Monday 9am):**
```
0 9 * * 1 /usr/local/bin/beads-health-check export ~/beads-weekly-$(date +\%Y\%m\%d).json >> ~/.local/share/beads-monitoring/logs/cron.log 2>&1
```

### Verify Cron Jobs

```bash
# List cron jobs
crontab -l

# Check cron log
tail -f ~/.local/share/beads-monitoring/logs/cron.log
```

---

## Troubleshooting

### Dashboard Issues

**Dashboard won't start:**
```bash
# Check script permissions
ls -la ~/.local/bin/beads-dashboard

# Check beads is installed
which bd
bd --version

# Check jq is installed
which jq
```

**Dashboard shows no data:**
```bash
# Check if beads is initialized
cd ~/work/your-project
ls -la .beads/

# Try beads list directly
bd list
```

**Dashboard refresh issues:**
```bash
# Reduce refresh interval
beads-dashboard 120

# Or disable auto-refresh and use manual [r]
```

---

### Alert Issues

**Alerts not triggering:**
```bash
# Check alerts enabled
beads-alerts config

# View recent alerts
beads-alerts view

# Check suppression
beads-alerts clear

# Test alert system
beads-alerts test
```

**Too many alerts:**
```bash
# Edit configuration
vi ~/.beads-alerts.json

# Increase cooldown
"cooldown_minutes": 120

# Or disable specific alerts
"stuck_tasks": false
```

---

### Health Check Issues

**Health score stuck at 0:**
```bash
# Check metrics collection
beads-health-check check

# View detailed metrics
beads-health-check check | jq .

# Check for errors
tail ~/.local/share/beads-monitoring/logs/health.log
```

**History not saving:**
```bash
# Check directory permissions
ls -la ~/.local/share/beads-monitoring/

# Ensure directory exists
mkdir -p ~/.local/share/beads-monitoring/data
```

---

### Configuration Issues

**Configuration not loading:**
```bash
# Check file exists
ls -la ~/.beads-monitoring-config.json

# Validate JSON
jq . ~/.beads-monitoring-config.json

# Reset to defaults
rm ~/.beads-monitoring-config.json
# Will recreate on next run
```

---

## Best Practices

### 1. Dashboard Usage

- **Start daily** - Keep dashboard open during work
- **Monitor trends** - Watch for patterns over time
- **Act on alerts** - Don't ignore dashboard warnings
- **Use quick actions** - Dashboard buttons provide shortcuts

### 2. Alert Configuration

- **Set appropriate thresholds** - Adjust for your workflow
- **Review regularly** - Tune based on experience
- **Don't over-alert** - Use suppression wisely
- **Test changes** - Use test command before production

### 3. Health Check

- **Run weekly** - Track health over time
- **Export periodically** - Keep external backups
- **Review trends** - Identify issues early
- **Act on low scores** - Address root causes

### 4. Data Management

- **Monitor disk usage** - Logs can grow over time
- **Archive old data** - Use export for long-term storage
- **Clean up regularly** - Remove old logs and data
- **Backup configuration** - Keep custom settings safe

### 5. Performance

- **Optimize refresh rate** - Balance responsiveness with overhead
- **Use targeted queries** - Dashboard already optimized
- **Monitor performance** - Watch for degradation
- **Adjust for scale** - More tasks = different thresholds

---

## Advanced Usage

### Custom Alert Rules

Edit `~/.beads-alerts.json`:

```json
{
  "custom_alerts": {
    "enabled": true,
    "rules": [
      {
        "name": "high_priority_stuck",
        "condition": "jq '.tasks.by_status.in_progress > 3 and .tasks.stuck > 0'",
        "severity": "critical",
        "message": "Critical: Multiple stuck tasks"
      }
    ]
  }
}
```

### Webhook Integration

Edit `~/.beads-alerts.json`:

```json
{
  "alert_methods": {
    "webhook": {
      "enabled": true,
      "url": "https://your-webhook-url.com/alerts",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

### Multi-Project Monitoring

Create wrapper script:

```bash
#!/bin/bash
# monitor-all-projects.sh

for project in ~/work/*/; do
  cd "$project"
  echo "Checking: $project"
  beads-health-check check | jq '.health_score'
done
```

---

## Support and Resources

### Getting Help

```bash
# Dashboard help
beads-dashboard --help

# Alerts help
beads-alerts --help

# Health check help
beads-health-check --help
```

### Logs

All monitoring logs stored in:
```
~/.local/share/beads-monitoring/logs/
```

### Data Files

- Health history: `~/.local/share/beads-monitoring/data/health-history.json`
- Metrics data: `~/.local/share/beads-monitoring/data/metrics.csv`
- Alert log: `~/.local/share/beads-monitoring/logs/alerts.log`
- Health log: `~/.local/share/beads-monitoring/logs/health.log`

---

## Summary

The Beads Monitoring System provides:

- ✅ Real-time dashboard visualization
- ✅ Automated threshold-based alerting
- ✅ Comprehensive health checks
- ✅ Historical trend analysis
- ✅ Configurable thresholds and alerts
- ✅ Multiple alert delivery methods
- ✅ Automated scheduling support

**Next Steps:**
1. Install and verify all scripts
2. Configure thresholds for your workflow
3. Set up automated cron jobs
4. Monitor for 1 week
5. Adjust based on experience

---

**End of Monitoring Setup Guide**

**Version:** 1.0
**Last Updated:** 2026-02-17
