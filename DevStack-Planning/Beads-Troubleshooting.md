# Beads Troubleshooting Guide

**Version:** 1.0
**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Initialization Issues](#initialization-issues)
3. [Task Creation Issues](#task-creation-issues)
4. [Task Query Issues](#task-query-issues)
5. [Task Update Issues](#task-update-issues)
6. [Git Sync Issues](#git-sync-issues)
7. [Performance Issues](#performance-issues)
8. [Cross-System Integration Issues](#cross-system-integration-issues)
9. [Multi-Agent Issues](#multi-agent-issues)
10. [Data Recovery](#data-recovery)

---

## Installation Issues

### Issue: beads command not found

**Symptom:**
```bash
$ bd --version
zsh: command not found: bd
```

**Cause:** Beads not installed or not in PATH

**Solution:**
```bash
# Check if beads is installed
which beads

# If not found, install via Homebrew
brew install yegge/beads/beads

# Verify installation
bd --version
```

---

### Issue: beads version mismatch

**Symptom:**
```bash
$ bd --version
beads 0.49.6

# Documentation references different features
```

**Cause:** Outdated beads version

**Solution:**
```bash
# Update beads
brew upgrade beads

# Verify new version
bd --version
```

---

### Issue: Permission denied on bd command

**Symptom:**
```bash
$ bd list
zsh: permission denied: bd
```

**Cause:** Incorrect file permissions

**Solution:**
```bash
# Fix permissions
chmod +x $(which bd)

# Verify
bd list
```

---

## Initialization Issues

### Issue: beads database not found

**Symptom:**
```bash
$ bd list
Error: no beads database found
Hint: run 'bd init' to create a database in the current directory
      or use 'bd --no-db' to work with JSONL only (no SQLite)
      or set BEADS_DIR to point to your .beads directory
```

**Cause:** Beads not initialized in current directory

**Solution:**
```bash
# Initialize beads in current directory
bd init --stealth

# Or set BEADS_DIR explicitly
export BEADS_DIR=/path/to/project/.beads
bd list
```

---

### Issue: git init conflicts

**Symptom:**
```bash
$ bd init
Error: git repository already exists
```

**Cause:** Project already has a git repository

**Solution:**
```bash
# Use --stealth flag to avoid git conflicts
bd init --stealth

# Or initialize in subdirectory
mkdir .beads
cd .beads
bd init
```

---

### Issue: beads.role not configured

**Symptom:**
```bash
$ bd create "Task"
warning: beads.role not configured. Run 'bd init' to set.
✓ Created issue: beads-test-abc
```

**Cause:** Beads not fully initialized

**Solution:**
```bash
# Reinitialize beads
bd init --stealth

# Or manually configure role
# (Not typically needed for stealth mode)
```

---

## Task Creation Issues

### Issue: Task creation fails with empty title

**Symptom:**
```bash
$ bd create "" -p 3
Error: title cannot be empty
```

**Cause:** Empty task title

**Solution:**
```bash
# Always provide a title
bd create "Valid task title" -p 3 --type task
```

---

### Issue: Task notes not saving

**Symptom:**
```bash
$ bd update $TASK_ID --note "Note"
Error: unknown flag: --note
```

**Cause:** Incorrect flag name (should be --notes, not --note)

**Solution:**
```bash
# Use --notes (plural), not --note (singular)
bd update $TASK_ID --notes "Update notes"
```

---

### Issue: Task ID extraction fails

**Symptom:**
```bash
$ TASK_ID=$(bd create "Task" | grep "Created issue:" | sed 's/.*Created issue: //')
echo $TASK_ID
# Output is empty or incorrect
```

**Cause:** Incorrect extraction pattern

**Solution:**
```bash
# Correct extraction pattern
TASK_ID=$(bd create "Task" 2>&1 | grep "Created issue:" | sed 's/.*Created issue: //')

# Alternative: Use awk
TASK_ID=$(bd create "Task" | awk -F': ' '{print $2}')
```

---

### Issue: Batch task creation slow

**Symptom:**
```bash
# Creating 100 tasks takes > 10 seconds
for i in {1..100}; do bd create "Task $i"; done
```

**Cause:** Beads creates tasks sequentially (~130ms each)

**Solution:**
```bash
# Acceptable for small batches (< 50 tasks)
# For larger batches, consider:
# 1. Creating in parallel (not recommended - may cause conflicts)
# 2. Using initialization scripts
# 3. Creating from markdown plan (plan-to-beads)
```

---

## Task Query Issues

### Issue: Tasks not appearing in ready list

**Symptom:**
```bash
$ bd ready
# No output, but tasks exist
```

**Cause:** Tasks have wrong priority or status

**Solution:**
```bash
# Check task details
bd list --json | jq '.[] | {id, title, priority, status}'

# Verify priority ordering (1 = highest)
# Ready shows lowest priority number among ready tasks
```

---

### Issue: Filtering returns empty results

**Symptom:**
```bash
$ bd list --status in_progress --json
[]
```

**Cause:** No tasks matching filter

**Solution:**
```bash
# Check actual status values
bd list --json | jq -r '.[].status' | sort | uniq

# Use correct status values: open, in_progress, testing, done, closed
```

---

### Issue: jq filter syntax errors

**Symptom:**
```bash
$ bd list --json | jq '.[] | select(.status == "in_progress")'
jq: error: syntax error, unexpected INVALID_CHARACTER
```

**Cause:** Incorrect jq syntax or shell quoting

**Solution:**
```bash
# Use single quotes around jq filter
bd list --json | jq '.[] | select(.status == "in_progress")'

# Escape quotes when needed
FILTER='.[] | select(.title | contains("test"))'
bd list --json | jq "$FILTER"
```

---

### Issue: List command slow with many tasks

**Symptom:**
```bash
$ bd list
# Takes > 5 seconds with 500+ tasks
```

**Cause:** Listing all tasks without filters

**Solution:**
```bash
# Use targeted queries
bd list --status in_progress
bd list --type task
bd ready

# Or implement caching
CACHE_FILE="$HOME/.beads-cache.json"
bd list --json > "$CACHE_FILE"
jq '.[] | select(.priority <= 2)' "$CACHE_FILE"
```

---

## Task Update Issues

### Issue: Update fails with invalid task ID

**Symptom:**
```bash
$ bd update invalid-id --status done
Error: issue not found: invalid-id
```

**Cause:** Invalid task ID

**Solution:**
```bash
# Verify task exists
bd show $TASK_ID

# Or list tasks to find correct ID
bd list --json | jq -r '.[].id'
```

---

### Issue: Status not updating

**Symptom:**
```bash
$ bd update $TASK_ID --status in_progress
# Output: ✓ Updated issue
$ bd show $TASK_ID | grep Status
# Status: open (unchanged)
```

**Cause:** Invalid status value or conflicting updates

**Solution:**
```bash
# Use valid status values: open, in_progress, testing, done, closed
bd update $TASK_ID --status in_progress

# Verify update
bd show $TASK_ID --json | jq '.status'
```

---

### Issue: Claim fails

**Symptom:**
```bash
$ bd update $TASK_ID --claim
Error: cannot claim task
```

**Cause:** Task already claimed or not ready

**Solution:**
```bash
# Check task status
bd show $TASK_ID

# Find ready tasks
bd ready

# Claim first ready task
TASK_ID=$(bd ready --json | jq -r '.[0].id')
bd update $TASK_ID --claim
```

---

### Issue: Notes not persisting

**Symptom:**
```bash
$ bd update $TASK_ID --notes "New notes"
# Output: ✓ Updated issue
$ bd show $TASK_ID | grep Notes
# Notes: (empty or old notes)
```

**Cause:** Notes being overwritten or not syncing

**Solution:**
```bash
# Check if notes are there
bd show $TASK_ID --json | jq -r '.notes'

# If not present, try again
bd update $TASK_ID --notes "New notes"

# Sync to git
bd sync
```

---

## Git Sync Issues

### Issue: Sync fails with git error

**Symptom:**
```bash
$ bd sync
Error: git error: not a git repository
```

**Cause:** Not in a git repository or git issues

**Solution:**
```bash
# Check git status
git status

# If not a git repo, initialize
git init

# Fix git issues first
# Then sync
bd sync
```

---

### Issue: Sync conflicts

**Symptom:**
```bash
$ bd sync
Error: merge conflict in .beads/tasks.jsonl
```

**Cause:** Concurrent modifications to beads data

**Solution:**
```bash
# Resolve git conflicts
git status

# Edit conflicted file
# Keep correct version
git add .beads/tasks.jsonl
git commit

# Sync again
bd sync
```

---

### Issue: Sync takes too long

**Symptom:**
```bash
$ bd sync
# Takes > 10 seconds
```

**Cause:** Large git history or slow git operations

**Solution:**
```bash
# Sync less frequently
# Only sync after significant changes

# Or use background sync
bd sync &
```

---

## Performance Issues

### Issue: Beads commands slow

**Symptom:**
```bash
$ time bd list
# real 0m5.123s
```

**Cause:** Many tasks or inefficient queries

**Solution:**
```bash
# Check task count
TASK_COUNT=$(bd list --json | jq '. | length')
echo "Task count: $TASK_COUNT"

# If > 200 tasks, see Optimization Guide
# Use targeted queries
bd ready
bd list --status in_progress
```

---

### Issue: Memory usage high

**Symptom:**
```bash
# System memory increases when running beads commands
```

**Cause:** Loading all tasks into memory

**Solution:**
```bash
# Use targeted queries instead of full list
# Avoid piping all tasks through jq

# Bad:
bd list --json | jq '.[] | select(.priority == 1)'

# Good:
bd list --json | jq '[.[] | select(.priority == 1)]'
```

---

### Issue: JSON output large

**Symptom:**
```bash
$ bd list --json > tasks.json
# tasks.json is > 10MB
```

**Cause:** Many tasks with large notes

**Solution:**
```bash
# Filter to reduce output
bd list --status in_progress --json > active-tasks.json

# Or use specific fields
bd list --json | jq '.[] | {id, title, status, priority}' > minimal-tasks.json
```

---

## Cross-System Integration Issues

### Issue: beads-mem-bridge not found

**Symptom:**
```bash
$ beads-mem-bridge $TASK_ID --mem $MEM_ID
zsh: command not found: beads-mem-bridge
```

**Cause:** Script not installed or not in PATH

**Solution:**
```bash
# Check if script exists
ls -la ~/.local/bin/beads-mem-bridge

# If missing, reinstall from integration plan
# Script location: ~/.local/bin/beads-mem-bridge

# Verify PATH
echo $PATH | grep ~/.local/bin
```

---

### Issue: Entire checkpoint tag fails

**Symptom:**
```bash
$ entire checkpoint create "Progress" --tags "beads:$TASK_ID"
Error: invalid tag format
```

**Cause:** Invalid tag format or syntax

**Solution:**
```bash
# Use correct tag format
# Tags should be: key:value
entire checkpoint create "Progress" --tags "beads:$TASK_ID,completed"

# Or without special characters
entire checkpoint create "Progress" --tags "beads-TASK-ID"
```

---

### Issue: Cross-system links broken

**Symptom:**
```bash
# Task has beads ID link, but linked resource not found
```

**Cause:** Linked resource was deleted or moved

**Solution:**
```bash
# Relink with correct resource ID
beads-mem-bridge $TASK_ID --mem $CORRECT_MEM_ID

# Or update task notes to remove broken link
bd update $TASK_ID --notes "Removed broken link"
```

---

### Issue: devstack-status not working

**Symptom:**
```bash
$ devstack-status
zsh: command not found: devstack-status
```

**Cause:** Script not installed

**Solution:**
```bash
# Check if script exists
ls -la ~/.local/bin/devstack-status

# If missing, reinstall from integration plan
# Script location: ~/.local/bin/devstack-status
```

---

## Multi-Agent Issues

### Issue: Multiple agents claim same task

**Symptom:**
```bash
# Agent A claims task
bd update $TASK_ID --claim

# Agent B tries to claim same task
bd update $TASK_ID --claim
# Error: already claimed
```

**Cause:** Concurrent access without coordination

**Solution:**
```bash
# Check claimed tasks before claiming
CLAIMED_TASKS=$(bd list --claimed --json | jq -r '.[].id')

if [[ ! " ${CLAIMED_TASKS[@]} " =~ " ${TASK_ID} " ]]; then
  bd update $TASK_ID --claim
fi
```

---

### Issue: Conflicting edits to same task

**Symptom:**
```bash
# Agent A updates task
bd update $TASK_ID --status in_progress

# Agent B updates same task
bd update $TASK_ID --status testing
# Agent A's changes lost
```

**Cause:** No coordination protocol

**Solution:**
```bash
# See Multi-Agent Configuration Guide
# Use coordination strategies:
# 1. Different agents work on different tasks
# 2. Clear ownership boundaries
# 3. Regular status updates in task notes
```

---

### Issue: simulate-multi-agent fails

**Symptom:**
```bash
$ simulate-multi-agent
Error: script not found
```

**Cause:** Script not installed

**Solution:**
```bash
# Check if script exists
ls -la ~/.local/bin/simulate-multi-agent

# If missing, reinstall from integration plan
# Script location: ~/.local/bin/simulate-multi-agent
```

---

## Data Recovery

### Issue: Accidentally deleted tasks

**Symptom:**
```bash
# Tasks were deleted and need to be recovered
```

**Cause:** Accidental deletion or data loss

**Solution:**
```bash
# Check git history
cd ~/work/your-project
git log --all --full-history -- .beads/

# Restore from git
git checkout HEAD~1 -- .beads/tasks.jsonl

# Verify and sync
bd list
bd sync
```

---

### Issue: Database corruption

**Symptom:**
```bash
$ bd list
Error: database corrupted
```

**Cause:** Disk failure or software bug

**Solution:**
```bash
# Restore from git
cd ~/work/your-project
git checkout HEAD -- .beads/

# If that fails, initialize fresh
rm -rf .beads/
bd init --stealth

# Restore tasks from backup if available
# Or recreate tasks from git history
```

---

### Issue: Lost task IDs

**Symptom:**
```bash
# Task was referenced by ID, but ID lost
```

**Cause:** Task ID not saved or lost

**Solution:**
```bash
# Search by title
bd list --json | jq '.[] | select(.title | contains("keyword")) | {id, title}'

# Search by notes
bd list --json | jq '.[] | select(.notes | contains("keyword")) | {id, title, notes}'

# Or use Entire checkpoints
entire checkpoint list | grep "keyword"
```

---

## Common Error Messages

### "no beads database found"
**Cause:** Not in beads project
**Solution:** `bd init --stealth` or `export BEADS_DIR=/path/to/.beads`

### "unknown flag: --note"
**Cause:** Using singular flag
**Solution:** Use `--notes` (plural)

### "issue not found"
**Cause:** Invalid task ID
**Solution:** Verify task exists with `bd show $TASK_ID`

### "cannot claim task"
**Cause:** Task already claimed or not ready
**Solution:** Claim from ready list: `bd ready | bd update $(...) --claim`

### "git error"
**Cause:** Git repository issues
**Solution:** Fix git issues first, then `bd sync`

---

## Getting Help

### Check logs

```bash
# Beads logs (if available)
ls -la ~/.local/share/beads/logs/

# Or check entire logs
entire log list
```

---

### Enable verbose mode

```bash
# Add verbose flag to see what's happening
bd --verbose list
bd --verbose create "Task"
```

---

### Verify installation

```bash
# Check beads version
bd --version

# Check installation path
which bd

# Check database
ls -la .beads/
```

---

### Reinitialize

**Last resort: Reinitialize beads**

```bash
# Backup current data
cp -r .beads .beads.backup

# Reinitialize
rm -rf .beads/
bd init --stealth

# Restore from backup if needed
cp .beads.backup/* .beads/
```

---

## Contact and Support

### Report Issues

When reporting issues, include:
1. beads version (`bd --version`)
2. OS version
3. Exact error message
4. Steps to reproduce
5. Expected vs actual behavior

### Documentation

All documentation is in:
```
~/KnowledgeBase/DevStack-Planning/
```

---

**End of Troubleshooting Guide**

**Version:** 1.0
**Last Updated:** 2026-02-17

**Related Docs:**
- Beads User Guide
- Beads Quick Reference
- Beads Optimization Guide
