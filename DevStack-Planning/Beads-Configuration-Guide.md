# Beads Configuration Guide

## Overview

This document provides a comprehensive guide to configuring **Beads** (git-backed issue tracker) for integration with the OpenCode development stack.

## Installation Summary

- **Beads CLI Version:** 0.49.6 (Homebrew)
- **Installed at:** `/opt/homebrew/bin/bd`
- **Test Project:** `~/Documents/sandbox/beads-test`

---

## Configuration Files

### 1. `.beads/config.yaml` (Repository-Level)

Located in each project's `.beads/` directory, this configures behavior for all `bd` commands in that repository.

**Location:** `~/Documents/sandbox/beads-test/.beads/config.yaml`

**Key Settings:**

```yaml
# Issue prefix for this repository
# Format: <prefix>-<hash>
# Example: "beads-test-a3f2dd"
# issue-prefix: ""

# Enable JSON output by default (useful for scripting)
# json: false

# Use no-db mode: load from JSONL only, skip SQLite
# no-db: false

# Disable daemon for RPC (forces direct database access)
# no-daemon: false

# Disable auto-flush to JSONL after mutations
# no-auto-flush: false

# Disable auto-import from JSONL when newer than DB
# no-auto-import: false

# Git branch for beads commits (bd sync will commit to this)
# IMPORTANT: Set for team projects
# sync-branch: "beads-sync"

# Multi-repo configuration (experimental)
# repos:
#   primary: "."
#   additional:
#     - ~/planning-repo
#     - ~/work-repo

# Enable event export to .beads/events.jsonl
# events-export: false
```

**Environment Variable Overrides:**

All config.yaml settings can be overridden with environment variables:

| Config Key | Environment Variable | Example |
|------------|---------------------|----------|
| `issue-prefix` | `BD_ISSUE_PREFIX` | `export BD_ISSUE_PREFIX="myproj"` |
| `json` | `BD_JSON` | `export BD_JSON=true` |
| `db` | `BEADS_DB` | `export BEADS_DB=/path/to/db` |
| `no-db` | `BD_NO_DB` | `export BD_NO_DB=true` |
| `no-daemon` | `BD_NO_DAEMON` | `export BD_NO_DAEMON=true` |
| `actor` | `BD_ACTOR` | `export BD_ACTOR="John Doe"` |
| `sync-branch` | `BD_SYNC_BRANCH` | `export BD_SYNC_BRANCH="beads-sync"` |

---

## Integration-Specific Configuration

### For Compaction Hook Integration

To ensure the compaction hook works correctly, these settings are recommended:

```yaml
# Enable JSON output for scripting
json: true

# Ensure auto-flush is enabled (default)
# This ensures compaction markers are persisted
no-auto-flush: false

# Enable events export for audit trail
events-export: true
```

### For Multi-Agent Coordination

For multi-agent scenarios, configure with these settings:

```yaml
# Ensure daemon is enabled for concurrent access
no-daemon: false

# Set actor name explicitly for audit trails
# Use: export BD_ACTOR="Agent-Name" per session
```

### For Cross-Project Integration

When using beads across multiple projects (Entire, Claude-Mem, RTK):

```yaml
# Multi-repo setup for cross-project visibility
repos:
  primary: "."
  additional:
    - ~/KnowledgeBase  # For planning documents
    - ~/Documents/sandbox  # For test projects

# Enable shared sync branch for consistency
sync-branch: "beads-sync"
```

---

## Stealth Mode Configuration

Beads was initialized in **stealth mode** to hide beads-related files from collaborators:

**What it does:**
- Adds `.beads/` to `.git/info/exclude` (local only)
- Configures Claude settings with `bd onboard` instruction
- Makes beads invisible to other repo collaborators

**Stealth mode is enabled when:**
- Repository has `.git/info/exclude` containing `.beads`
- Configured via: `bd init --stealth`

**Why use stealth mode:**
- Hide task tracking from team members
- Personal task management within shared repos
- No need to persuade team to adopt beads

---

## Shell Aliases (Recommended)

Add to `~/.zshrc`:

```bash
# Beads daily workflow
alias bdr='bd ready'                    # Show ready tasks
alias bdc='bd create'                   # Create task
alias bdu='bd update'                   # Update task
alias bds='bd show'                     # Show task details
alias bdl='bd list'                     # List all tasks
alias bdsync='bd sync'                  # Sync beads
alias bdst='bd status'                 # Beads status
alias bdclaim='bd update --claim'        # Claim task
alias bdclose='bd close'                # Close task

# RTK integration (token-optimized)
alias rbd='rtk bd'                     # RTK-wrapped beads commands
alias rbdr='rtk bd ready'              # RTK + bd ready

# Cross-system integration
alias dstatus='devstack-status'          # Full stack status (Phase 4)
```

---

## Issue Types

Beads supports multiple issue types (use with `-t` or `--type` flag):

| Type | Use Case |
|------|----------|
| `task` | General tasks (default) |
| `bug` | Bug reports |
| `feature` | Feature requests |
| `epic` | Large features split into subtasks |
| `chore` | Maintenance tasks |
| `gate` | Async coordination points |
| `molecule` | Work templates |
| `agent` | Agent-specific tasks |
| `slot` | Agent reservation slots |

**Example:**
```bash
bd create "Fix login bug" -p 0 --type bug
bd create "Add user auth" -p 1 --type feature
```

---

## Priority Levels

Beads uses P0-P4 priority system (0 = highest, 4 = lowest):

| Priority | Use Case |
|----------|----------|
| `P0` | Critical, blocks release or other work |
| `P1` | High priority, important but not blocking |
| `P2` | Normal priority, standard work |
| `P3` | Low priority, nice-to-have |
| `P4` | Backlog, may never do |

**Examples:**
```bash
bd create "Security fix" -p 0      # P0 (critical)
bd create "UI polish" -p 3         # P3 (nice-to-have)
bd create "Documentation" -p 4       # P4 (backlog)
```

---

## Status Values

Beads supports these status values:

| Status | Meaning | Use `bd ready`? |
|--------|----------|-----------------|
| `open` | Created but not started | Yes |
| `in_progress` | Currently being worked on | No |
| `closed` | Completed | No |
| `tombstone` | Deleted/archived | No |

**Status transitions:**
```bash
bd update beads-test-abc --status in_progress
bd close beads-test-abc  # Sets status to closed
```

---

## JSON Output for Scripting

All beads commands support `--json` flag for scripting:

```bash
# List all issues
bd list --json

# Filter with jq
bd list --json | jq '.[] | select(.status == "in_progress")'

# Get ready work
bd ready --json | jq -r '.[].id'

# Show issue details
bd show beads-test-abc --json
```

**Important:** Use `--json` for compaction hook integration to parse task data.

---

## Sync & Git Integration

### Sync Command
```bash
bd sync
```
- Exports SQLite DB to JSONL
- Commits to git (if `sync-branch` configured)
- Ensures remote persistence

### Git Hooks
Beads can install git hooks for auto-sync:

```bash
bd hooks install
```

**Available hooks:**
- `pre-commit`: Auto-sync before commits
- `post-merge`: Sync after pulling changes

---

## Database Location

Beads stores data in:

```
~/Documents/sandbox/beads-test/.beads/
├── beads.db           # SQLite database
├── issues.jsonl       # JSONL export (synced to git)
├── config.yaml        # Configuration
├── metadata.json      # Repository metadata
├── interactions.jsonl # Audit trail
└── README.md         # Beads readme
```

**Override database location:**
```bash
export BEADS_DB=/path/to/database.db
bd list
```

---

## Common Workflows

### Create and Track a Task
```bash
# 1. Create task
bd create "Implement feature X" -p 1 --type feature

# 2. Show ready work
bd ready

# 3. Claim task (optional)
TASK_ID=$(bd ready --json | jq -r '.[0].id')
bd update "$TASK_ID" --claim

# 4. Update progress
bd update "$TASK_ID" --status in_progress --notes "50% done"

# 5. Complete
bd close "$TASK_ID"

# 6. Sync
bd sync
```

### Dependency Management
```bash
# Create tasks with dependencies
bd create "Design API" -p 0
bd create "Implement API" -p 1 --deps "blocks:beads-test-abc"
bd create "Write tests" -p 1 --deps "blocks:beads-test-def"

# Show blocked tasks
bd blocked

# Show dependency graph
bd graph
```

### Cross-System Integration
```bash
# Tag Entire checkpoint with beads task
entire checkpoint --tag "beads:beads-test-abc"

# Query Claude-Mem about task
"What did we do about beads-test-abc?"

# Use RTK for all commands
rtk bd list
rtk bd ready
```

---

## Troubleshooting

### "no beads database found"
**Solution:** Run `bd init` in the current directory

### "Not a beads repository"
**Solution:** Ensure you're in a directory with `.beads/` folder

### Permission errors on `.beads/`
**Solution:**
```bash
chmod 700 .beads/
chmod 600 .beads/beads.db
```

### JSON output not working
**Solution:** Check for jq installation
```bash
which jq
brew install jq  # If not installed
```

### Compaction hook not syncing
**Solution:** Ensure auto-flush is enabled:
```yaml
# In .beads/config.yaml
no-auto-flush: false
```

---

## Next Steps

1. **Phase 2:** Integrate with Entire Check Plugin
2. **Phase 2:** Implement compaction hook
3. **Phase 3:** Create beads-integration skill
4. **Phase 4:** Link with Claude-Mem and Entire CLI
5. **Phase 5:** Multi-agent coordination

---

**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Related:** `Beads-Integration-Plan.md`, `Beads-Quick-Reference.md`
