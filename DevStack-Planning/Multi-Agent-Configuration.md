# Multi-Agent Configuration Guide

## Overview

This guide covers configuring beads for multi-agent scenarios where multiple AI agents work on the same project. This includes task claiming protocols, coordination rules, and conflict prevention.

## When to Use Multi-Agent Mode

**Use multi-agent mode when:**
- Multiple agents work on different parts of the same codebase
- Tasks need to be distributed across agent sessions
- Agents need to coordinate to avoid conflicts
- Work happens in parallel on related tasks

**Don't use multi-agent mode when:**
- Single agent handles all work
- Tasks are completely independent
- Simple sequential workflow is sufficient

## Configuration

### 1. Set Up Agent Identification

Each agent should have a unique identifier:

```bash
# In each agent's environment
export BD_ACTOR="agent-alpha"
export BD_ACTOR="agent-beta"
export BD_ACTOR="agent-gamma"
```

### 2. Configure Auto-Sync

Enable auto-sync to ensure all agents see updates:

```yaml
# .beads/config.yaml
auto_sync: true
flush_debounce: "5s"
```

### 3. Enable Daemon Mode

For concurrent access, use daemon mode:

```bash
# Start daemon
bd daemon start

# Or auto-start in config
# .beads/config.yaml
auto-start-daemon: true
```

## Task Claiming Protocol

### Protocol Overview

The claiming protocol ensures only one agent works on a task at a time:

```
1. Check for unclaimed ready tasks
2. Attempt to claim task (atomic operation)
3. If claim succeeds, proceed with work
4. If claim fails, task is already taken, find another
5. Mark task complete when done
6. Sync to share status with other agents
```

### Claiming a Task

```bash
# Claim task atomically
bd update <task-id> --claim

# Check if claim succeeded
bd show <task-id> | grep "Owner"
```

**What happens:**
- Sets `owner` field to claiming agent
- Sets `status` to `in_progress`
- Fails if task is already claimed

### Finding Available Work

```bash
# Show unclaimed ready tasks
bd ready --json | jq -r '.[] | select(.owner == null) | .id'

# Show tasks claimed by specific agent
bd list --json | jq -r '.[] | select(.owner == "agent-alpha") | .id'

# Show all claimed tasks
bd list --json | jq -r '.[] | select(.owner != null) | "\(.owner): \(.id) - \(.title)"'
```

### Releasing a Task

If an agent cannot complete work:

```bash
# Release claim (keep in_progress)
bd update <task-id> --assignee ""

# Or mark as blocked
bd update <task-id> --status blocked --notes "Blocked by X"
```

## Agent Coordination Rules

### Rule 1: Claim Before Working

**Never start work without claiming.**

```bash
# WRONG - Race condition possible
bd ready  # See task
# Start working...  # Another agent might claim it!

# RIGHT - Atomic claim
TASK=$(bd ready --json | jq -r '.[0].id')
bd update "$TASK" --claim  # Atomically claim
# Now safe to work
```

### Rule 2: Check Dependencies

**Don't claim blocked tasks:**

```bash
# Check if task has blockers
bd show <task-id> | grep -A10 "DEPENDENCIES"

# Or programmatically
bd list --json | jq -r '.[] | select(.dependency_count > 0) | "\(.id): \(.dependency_count) blockers"'
```

### Rule 3: Regular Sync

**Sync frequently to share progress:**

```bash
# After major updates
bd sync

# Or use auto-sync (recommended)
# .beads/config.yaml
auto_sync: true
```

### Rule 4: Handle Conflicts Gracefully

**If claim fails, move on:**

```bash
claim_task() {
  local task_id=$1
  local agent=$2
  
  if bd update "$task_id" --claim 2>/dev/null; then
    echo "Claimed $task_id"
    return 0
  else
    echo "Task $task_id already claimed"
    return 1
  fi
}

# Try to claim next available task
for task in $(bd ready --json | jq -r '.[].id'); do
  if claim_task "$task" "$BD_ACTOR"; then
    WORK_TASK="$task"
    break
  fi
done
```

### Rule 5: Document Progress

**Add notes so other agents understand state:**

```bash
# Good - Clear status
bd update <task-id> --notes "50% complete - finished auth module, working on UI"

# Bad - No context
bd update <task-id> --status in_progress
```

## Multi-Agent Workflow

### Setup Phase

```bash
# 1. Each agent sets identity
export BD_ACTOR="agent-alpha"

# 2. Start daemon for concurrent access
bd daemon start

# 3. Verify setup
devstack-status
```

### Work Distribution Phase

```bash
# Agent Alpha
#!/bin/bash
# agent-alpha-work.sh

echo "Agent Alpha looking for work..."

# Find and claim ready task
for task in $(bd ready --json | jq -r '.[].id'); do
  if bd update "$task" --claim 2>/dev/null; then
    echo "Claimed: $task"
    
    # Do work...
    bd update "$task" --notes "Working on implementation"
    
    # Complete
    bd close "$task"
    bd sync
    break
  fi
done
```

```bash
# Agent Beta (runs concurrently)
#!/bin/bash
# agent-beta-work.sh

echo "Agent Beta looking for work..."

# Same pattern, will get different task
for task in $(bd ready --json | jq -r '.[].id'); do
  if bd update "$task" --claim 2>/dev/null; then
    echo "Claimed: $task"
    
    # Do work...
    
    bd close "$task"
    bd sync
    break
  fi
done
```

### Coordination Phase

```bash
# Check what other agents are doing
echo "Current assignments:"
bd list --json | jq -r '.[] | select(.owner != null) | "\(.owner): \(.id)"'

echo ""
echo "Recent activity:"
bd list --json | jq -r '.[] | select(.updated_at > "'$(date -v-1H +%Y-%m-%dT%H:%M)'") | "\(.updated_at): \(.id) - \(.status)"' | sort
```

## Conflict Prevention

### Slot System

Use slots to reserve agent capacity:

```bash
# Create slots for each agent
bd create "Agent Alpha Slot" -p 0 --type slot
bd create "Agent Beta Slot" -p 0 --type slot

# Agents claim slots when starting
bd update <alpha-slot-id> --claim

# Other agents see slots are taken
bd list --type slot
```

### Gate System

Use gates for coordination points:

```bash
# Create gate for milestone
bd create "API Design Review Gate" -p 0 --type gate

# Block tasks until gate opens
bd create "Implement API" -p 1 --deps "blocked-by:<gate-id>" --type task

# When ready, open gate
bd update <gate-id> --status closed
```

## Scripts for Multi-Agent

### Script 1: Agent Work Selector

```bash
#!/bin/bash
# agent-selector.sh - Select work for an agent

AGENT_NAME="${BD_ACTOR:-unknown}"

echo "=== Agent: $AGENT_NAME ==="
echo ""

# Check if already claimed work
CURRENT=$(bd list --json | jq -r --arg agent "$AGENT_NAME" '.[] | select(.owner == $agent and .status == "in_progress") | .id')

if [ -n "$CURRENT" ]; then
  echo "Resuming work on: $CURRENT"
  bd show "$CURRENT"
  exit 0
fi

# Find new work
echo "Looking for available work..."

for task in $(bd ready --json | jq -r '.[].id'); do
  if bd update "$task" --claim 2>/dev/null; then
    echo ""
    echo "✓ Claimed: $task"
    bd show "$task"
    exit 0
  fi
done

echo "No available work found"
echo "Ready tasks: $(bd ready --json | jq length)"
```

### Script 2: Agent Status Monitor

```bash
#!/bin/bash
# agent-monitor.sh - Monitor all agent activity

echo "=== Multi-Agent Status ==="
echo ""

echo "Active Agents:"
bd list --json | jq -r '.[] | select(.owner != null) | "\(.owner)"' | sort | uniq -c | sort -rn
echo ""

echo "Current Assignments:"
bd list --json | jq -r '.[] | select(.owner != null) | "  \(.owner): \(.id) - \(.title) [\(.status)]"'
echo ""

echo "Unclaimed Ready Tasks:"
bd ready --json | jq -r '.[] | select(.owner == null) | "  \(.id): \(.title)"'
echo ""

echo "Recently Updated:"
bd list --json | jq -r '.[] | select(.updated_at > "'$(date -v-30M +%Y-%m-%dT%H:%M)'") | "  \(.updated_at) \(.id) [\(.status)]"' | sort | tail -10
```

### Script 3: Conflict Detector

```bash
#!/bin/bash
# conflict-detector.sh - Detect potential conflicts

echo "=== Conflict Detection ==="
echo ""

# Find tasks claimed but not updated recently (stale claims)
echo "Potentially Stale Claims (>1 hour no update):"
bd list --json | jq -r '.[] | select(.owner != null and .status == "in_progress" and .updated_at < "'$(date -v-1H +%Y-%m-%dT%H:%M)'") | "  ⚠️  \(.owner): \(.id) - last update: \(.updated_at)"'
echo ""

# Find tasks with same parent (potential overlap)
echo "Active Tasks by Epic:"
bd list --json | jq -r '.[] | select(.status == "in_progress") | "\(.parent // "no-parent"): \(.id)"' | sort | uniq -c | sort -rn | head -10
echo ""

# Check for blocked tasks with open dependencies
echo "Blocked Tasks with Open Dependencies:"
bd blocked
```

## Best Practices

### 1. Small, Independent Tasks

Break work into tasks that can be completed independently:

```bash
# Good - Independent tasks
bd create "Add login form UI" -p 1 --type task
bd create "Add login API endpoint" -p 1 --type task
bd create "Add login tests" -p 2 --type task

# Bad - Monolithic task
bd create "Implement authentication system" -p 1 --type task
```

### 2. Clear Task Descriptions

Help other agents understand the work:

```bash
# Good - Clear scope
bd create "Add email validation to signup form" -p 1 --type task

# Bad - Vague scope
bd create "Fix signup" -p 1 --type task
```

### 3. Communication via Notes

Use notes to communicate state:

```bash
# Good - Informative
bd update <task-id> --notes "Blocked: waiting for API spec from @agent-beta"

# Good - Progress update
bd update <task-id> --notes "50% done - component structure complete, styling in progress"
```

### 4. Graceful Degradation

If claim fails, have fallback:

```bash
claim_and_work() {
  local task=$1
  
  if bd update "$task" --claim 2>/dev/null; then
    do_work "$task"
  else
    echo "Task $task taken, trying next..."
    return 1
  fi
}

# Try multiple tasks
for task in $(bd ready --json | jq -r '.[].id'); do
  claim_and_work "$task" && break
done
```

## Testing Multi-Agent

### Simulation Script

```bash
#!/bin/bash
# simulate-multi-agent.sh

echo "=== Multi-Agent Simulation ==="
echo ""

# Create test tasks
EPIC=$(bd create "Simulation Epic" -p 0 --type epic | grep "Created issue:" | sed 's/.*Created issue: //')

for i in 1 2 3; do
  bd create "Test task $i" -p 1 --parent "$EPIC" --type task > /dev/null
done

echo "Created 3 test tasks"
echo ""

# Simulate Agent Alpha
(
  export BD_ACTOR="agent-alpha"
  TASK=$(bd ready --json | jq -r '.[0].id')
  if bd update "$TASK" --claim 2>/dev/null; then
    echo "✓ Alpha claimed: $TASK"
    sleep 1
    bd update "$TASK" --notes "Alpha working..."
    sleep 1
    bd close "$TASK"
    echo "✓ Alpha completed: $TASK"
  else
    echo "✗ Alpha failed to claim: $TASK"
  fi
) &

# Simulate Agent Beta
(
  export BD_ACTOR="agent-beta"
  sleep 0.5  # Slight delay
  TASK=$(bd ready --json | jq -r '.[0].id')
  if bd update "$TASK" --claim 2>/dev/null; then
    echo "✓ Beta claimed: $TASK"
    sleep 1
    bd update "$TASK" --notes "Beta working..."
    sleep 1
    bd close "$TASK"
    echo "✓ Beta completed: $TASK"
  else
    echo "✗ Beta failed to claim: $TASK (expected if taken)"
  fi
) &

wait
echo ""
echo "Simulation complete"
bd sync
```

## Troubleshooting

### "Task already claimed"

Another agent beat you to it. Find another:

```bash
bd ready
```

### "Stale claim" - Agent not updating

Check if agent is still active:

```bash
bd show <task-id>
# If >1 hour since update, consider releasing
```

### Concurrent updates failing

Enable daemon mode:

```bash
bd daemon start
```

### Sync conflicts

```bash
# Force sync
bd sync

# If conflicts exist, check git
cd .beads && git status
```

## Performance Considerations

### For Large Projects

1. **Use daemon mode** - Reduces lock contention
2. **Enable auto-sync** - Batch updates
3. **Filter queries** - Don't list all tasks

```bash
# Good - Filtered query
bd list --status open --json | jq length

# Bad - Full list
bd list --json | jq length
```

### For High-Frequency Coordination

1. **Use slots/gates** - Reduce claim attempts
2. **Batch updates** - Don't sync after every change
3. **Cache ready list** - Don't requery constantly

## Related Resources

- Beads Integration Plan: `~/knowledgebase/DevStack-Planning/Beads-Integration-Plan.md`
- Cross-System Integration: `~/knowledgebase/DevStack-Planning/Cross-System-Integration-Workflows.md`
- Beads Documentation: https://steveyegge.github.io/beads/

---

**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Compatible with:** beads CLI 0.49+
