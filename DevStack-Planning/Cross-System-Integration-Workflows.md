# Cross-System Integration Workflows

## Overview

This document describes workflows for integrating beads with other systems in the development stack: Entire CLI (session persistence), Claude-Mem (cross-session memory), and RTK (token optimization).

## Integration Points

### 1. Beads ↔ Entire CLI

**Purpose:** Link beads tasks to session checkpoints

**Script:** `beads-entire-bridge`

**Location:** `~/.local/bin/beads-entire-bridge`

**Usage:**
```bash
# Create checkpoint for task
beads-entire-bridge <task-id> "Checkpoint message"

# List checkpoints for task
beads-entire-bridge <task-id> --list

# Find all beads-tagged checkpoints
beads-entire-bridge <task-id> --find
```

**Example:**
```bash
beads-entire-bridge beads-test-abc "Completed authentication module"
```

**Result:**
- Creates Entire checkpoint tagged with `beads:<task-id>`
- Adds checkpoint reference to beads task notes
- Enables correlation between task progress and session state

---

### 2. Beads ↔ Claude-Mem

**Purpose:** Link beads tasks to semantic memory observations

**Script:** `beads-mem-bridge`

**Location:** `~/.local/bin/beads-mem-bridge`

**Usage:**
```bash
# Link observation to task
beads-mem-bridge <task-id> "Observation or insight"

# Query Claude-Mem about task
beads-mem-bridge <task-id> --query "What did we implement?"
```

**Example:**
```bash
beads-mem-bridge beads-test-abc "Discovered race condition in auth flow"
```

**Result:**
- Adds observation to beads task notes with `[Claude-Mem]` prefix
- Creates searchable link between task and semantic memory
- Preserves context across sessions

---

### 3. Beads ↔ RTK

**Purpose:** Use token-optimized commands for beads operations

**Usage:**
```bash
# Standard beads commands
rtk bd ready
rtk bd list
rtk bd status

# Aliases (in ~/.zshrc)
alias rbdr='rtk bd ready'
alias rbdl='rtk bd list'
alias rbds='rtk bd status'
```

**Benefits:**
- 60-90% token savings on beads CLI output
- Consistent with other RTK-optimized commands
- No functional difference, just more efficient

---

## Unified Status Command

**Command:** `devstack-status`

**Location:** `~/.local/bin/devstack-status`

**Purpose:** Show status of all integrated systems

**Usage:**
```bash
devstack-status          # Normal output
devstack-status --json   # JSON output
devstack-status --compact # One-line output
devstack-status --verbose # Detailed with recommendations
```

**Example Output:**
```
╔════════════════════════════════════════════════════════╗
║        Development Stack Status                      ║
╚════════════════════════════════════════════════════════╝

Memory & Persistence:
  Entire CLI:   Not initialized
  Claude-Mem:   Active (192K)

Optimization:
  RTK:          Active (saved: tokens saved)

Task Management:
  Beads:        Enabled (7 ready, 7 total)

Quick Actions:
  → Enable Entire:    entire enable --strategy auto-commit
```

---

## Common Workflows

### Workflow 1: Start Work Session

```bash
# 1. Check stack status
devstack-status

# 2. See ready work
bd ready

# 3. Claim task
bd update <task-id> --claim

# 4. Create Entire checkpoint (if enabled)
beads-entire-bridge <task-id> "Starting work session"

# 5. Do work...

# 6. Update progress
bd update <task-id> --notes "50% complete - finished X"

# 7. Create checkpoint
beads-entire-bridge <task-id> "Milestone: X complete"

# 8. Link insight to Claude-Mem
beads-mem-bridge <task-id> "Key insight: Y"

# 9. Complete or pause
bd close <task-id>  # or keep in_progress

# 10. Sync everything
bd sync
```

### Workflow 2: Resume Work

```bash
# 1. Check current state
devstack-status

# 2. Find active tasks
bd list --status in_progress

# 3. Get full context
echo "=== Task Details ==="
bd show <task-id>

echo "=== Checkpoints ==="
beads-entire-bridge <task-id> --list 2>/dev/null || echo "No checkpoints"

echo "=== Claude-Mem Context ==="
# Ask: "What was I doing with <task-id>?"

# 4. Continue work
bd update <task-id> --notes "Resumed work - reviewed context"
```

### Workflow 3: Cross-System Query

```bash
# 1. Find task
bd search "keyword"

# 2. Get beads info
bd show <task-id>

# 3. Check Entire checkpoints
beads-entire-bridge <task-id> --list

# 4. Query Claude-Mem
# Ask: "What did we decide about <task-id>?"

# 5. View related tasks
bd graph | grep -A5 -B5 <task-id>
```

### Workflow 4: End of Day Sync

```bash
#!/bin/bash
# end-of-day-sync.sh

echo "=== End of Day Sync ==="
echo ""

# Sync beads
echo "📋 Syncing beads..."
bd sync
echo "✓ Done"
echo ""

# Show status
echo "📊 Current Status:"
devstack-status --compact
echo ""

# Show today's work
echo "✅ Today's Activity:"
bd list --json | jq -r '.[] | select(.updated_at > "'$(date +%Y-%m-%d)'T00:00:00") | "  \(.id): \(.title) [\(.status)]"'
echo ""

# Show ready for tomorrow
echo "🎯 Ready for Tomorrow:"
bd ready | head -5
echo ""

echo "Sync complete. See you tomorrow!"
```

---

## Integration Checklist

When working with beads in the integrated stack:

- [ ] Created beads tasks for multi-step work
- [ ] Claimed task with `--claim` before starting
- [ ] Created Entire checkpoint at milestones (if enabled)
- [ ] Linked key insights to Claude-Mem via beads-mem-bridge
- [ ] Updated task notes with progress
- [ ] Used RTK for beads commands (`rtk bd ready`)
- [ ] Checked devstack-status regularly
- [ ] Synced beads before ending session (`bd sync`)

---

## Troubleshooting

### Entire checkpoint not created
- Check if Entire is enabled: `entire status`
- Enable if needed: `entire enable --strategy auto-commit`

### Claude-Mem link not working
- Ensure beads task ID is correct
- Check that observation was added to notes: `bd show <task-id>`

### devstack-status shows wrong info
- Run from within project directory
- Check if `.beads/` or `.entire/` directories exist

### Commands not found
- Ensure `~/.local/bin` is in PATH
- Check if scripts are executable: `chmod +x ~/.local/bin/*`

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `beads-mem-bridge` | Link to Claude-Mem | `beads-mem-bridge <id> "note"` |
| `beads-entire-bridge` | Tag Entire checkpoints | `beads-entire-bridge <id> "msg"` |
| `devstack-status` | Show all systems | `devstack-status [--json]` |
| `plan-to-beads` | Convert plans to tasks | `plan-to-beads <plan.md>` |

---

## Related Documentation

- Beads Integration Plan: `~/knowledgebase/DevStack-Planning/Beads-Integration-Plan.md`
- Beads Quick Reference: `~/knowledgebase/DevStack-Planning/Beads-Quick-Reference.md`
- Beads Configuration: `~/knowledgebase/DevStack-Planning/Beads-Configuration-Guide.md`
- AGENTS.md Section 7: Task Management with Beads
- cross-system-query skill: `~/.agents/skills/cross-system-query/SKILL.md`

---

**Document Version:** 1.0
**Last Updated:** 2026-02-16
