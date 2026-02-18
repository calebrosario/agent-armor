# Beads Integration - Quick Reference

## One-Page Cheat Sheet

### Installation
```bash
# Install beads
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Initialize in project (stealth mode)
cd your-project
bd init --stealth

# Verify
bd --version
bd ready
```

### Daily Workflow

#### Morning - Start Session
```bash
# 1. Check full stack status (includes beads)
opencode
# → Entire Check Plugin shows: Entire ✓ Claude-Mem ✓ RTK ✓ Beads ✓

# 2. See what work is ready
bd ready

# 3. Claim a task
bd update bd-a1b2 --claim
```

#### During Work
```bash
# Update progress
bd update bd-a1b2 --note "Completed auth module"

# Create subtask if needed
bd create "Fix edge case" --parent bd-a1b2 -p 1

# Check dependencies
bd show bd-a1b2
```

#### End of Session
```bash
# 1. Update status
bd close bd-a1b2 --resolution fixed

# 2. Sync
bd sync

# 3. Entire auto-checkpoints
# (Handled automatically)
```

### Essential Commands

| Task | Command |
|------|---------|
| **Install** | `curl -fsSL .../install.sh \| bash` |
| **Init project** | `bd init --stealth` |
| **List ready work** | `bd ready` |
| **Create task** | `bd create "Title" -p 1` |
| **Claim task** | `bd update <id> --claim` |
| **Show details** | `bd show <id>` |
| **Close task** | `bd close <id>` |
| **Sync** | `bd sync` |
| **List all** | `bd list` |

### Aliases (Add to ~/.zshrc)
```bash
alias bdr='bd ready'
alias bdc='bd create'
alias bdu='bd update'
alias bds='bd show'
alias bdl='bd list'
alias bdsync='bd sync'
alias bdclaim='bd update --claim'
alias bdclose='bd close'
```

### Integration Points

#### With Entire CLI
```bash
# Tag Entire checkpoint with beads task
entire checkpoint --tag "beads:bd-a1b2"

# Later: Find checkpoint for task
entire explain --tag beads:bd-a1b2
```

#### With Claude-Mem
```bash
# Query about beads task
"What did we do for beads task bd-a1b2?"

# Claude-Mem links automatically if beads ID mentioned
```

#### With RTK
```bash
# All beads commands should use RTK
rtk bd ready
rtk bd list
# etc.
```

### When to Use Beads

✅ **Use beads for:**
- Multi-step features (>3 tasks)
- Cross-session work
- Dependencies (blocked/blocked-by)
- Priority management (P0/P1/P2)
- Audit trail needed

❌ **Don't use beads for:**
- Quick fixes (<30 min)
- Single-session exploration
- Ad-hoc debugging
- One-off experiments

### Troubleshooting

**Problem:** `bd: command not found`
**Solution:** 
```bash
# Check if in PATH
which bd

# If not, reinstall
curl -fsSL https://.../install.sh | bash
```

**Problem:** "Not a beads repository"
**Solution:**
```bash
# Initialize
bd init --stealth
```

**Problem:** Entire Check Plugin doesn't show beads status
**Solution:**
```bash
# Check plugin version
ls -la ~/.config/opencode/plugins/entire-check/

# Update plugin (see integration plan Phase 2)
```

**Problem:** Task progress lost after context compaction
**Solution:**
```bash
# This should happen automatically via compaction hook
# If not working, check:

# 1. Verify hook is installed
grep -r "session.compacted" ~/.config/opencode/plugins/

# 2. Check logs for compaction sync
# Look for "[beads] Syncing task state before context compaction"

# 3. Manual sync if needed
bd sync

# 4. Check task history
bd show <task-id>  # Should show compaction markers
```

### Getting Help

1. **Beads help:** `bd --help`
2. **Docs:** https://steveyegge.github.io/beads/
3. **GitHub:** https://github.com/steveyegge/beads
4. **Integration plan:** `~/knowledgebase/DevStack-Planning/Beads-Integration-Plan.md`

---

**Print this and keep it handy!**
