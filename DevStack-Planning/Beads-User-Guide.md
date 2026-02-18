# Beads Integration User Guide

**Version:** 1.0
**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Daily Workflow](#daily-workflow)
4. [Feature Development](#feature-development)
5. [Bug Fix Workflow](#bug-fix-workflow)
6. [Multi-Agent Collaboration](#multi-agent-collaboration)
7. [Cross-System Integration](#cross-system-integration)
8. [Advanced Usage](#advanced-usage)
9. [Formulas and Templates](#formulas-and-templates)
10. [Performance Optimization](#performance-optimization)

---

## Getting Started

### Installation

Beads should already be installed via Homebrew. Verify installation:

```bash
bd --version
# Output: beads 0.49.6 (or similar)
```

If not installed:
```bash
brew install yegge/beads/beads
```

---

### Initial Setup

1. **Create a beads project:**

```bash
# Navigate to your project directory
cd ~/work/your-project

# Initialize beads (stealth mode for git integration)
bd init --stealth
```

2. **Configure aliases (optional but recommended):**

Edit `~/.zshrc` and add:
```bash
# Beads aliases
alias bdl='bd list'
alias bdc='bd create'
alias bdu='bd update'
alias bds='bd show'
alias bdr='bd ready'
alias bdclose='bd close'
alias bdsync='bd sync'
alias bdclaim='bd update $(bd ready --json | jq -r '\''[0].id'\'') --claim'
```

Reload shell:
```bash
source ~/.zshrc
```

---

### Verify Setup

```bash
# Create a test task
bd create "Setup test task" -p 3 --type task --notes "Testing beads setup"

# List tasks
bd list

# Check ready tasks
bd ready

# Sync to git
bd sync
```

---

## Core Concepts

### Task Types

| Type | Description | Use Case |
|------|-------------|----------|
| **epic** | Large feature, contains multiple tasks | Major features, projects |
| **task** | Individual work item | Specific implementation tasks |
| **bug** | Bug report | Issues to fix |

### Task Status

| Status | Description |
|--------|-------------|
| **open** | Not started |
| **in_progress** | Currently being worked on |
| **testing** | Testing/QA phase |
| **done** | Complete |
| **closed** | No longer relevant |

### Task Priority

| Priority | Level | Use Case |
|----------|-------|----------|
| **P1** | Critical | Blockers, security issues, urgent bugs |
| **P2** | High | Important features, high-impact bugs |
| **P3** | Medium | Normal features, standard bugs |
| **P4** | Low | Nice-to-haves, minor issues |

### Task Dependencies

- **Parent-child:** Tasks that must be completed in order
- **Related:** Tasks that are connected but not dependent

---

## Daily Workflow

### Starting Your Day

1. **Check ready tasks:**

```bash
# See what's ready to work on
bd ready

# Or in JSON format for scripting
bd ready --json
```

2. **Claim a task:**

```bash
# Get the first ready task
TASK_ID=$(bd ready --json | jq -r '.[0].id')

# Claim it
bd update $TASK_ID --claim

# Show task details
bd show $TASK_ID
```

3. **Track progress:**

```bash
# Update task with progress notes
bd update $TASK_ID --notes "Progress update:
- Completed X
- Working on Y
- Blocker: Z"
```

---

### During Work

**Update task status:**
```bash
# Mark as in progress
bd update $TASK_ID --status in_progress

# Move to testing
bd update $TASK_ID --status testing --notes "Ready for review"
```

**Add notes:**
```bash
# Add notes with --notes flag (NOT --note)
bd update $TASK_ID --notes "Key decision: chose X over Y because Z"
```

**Link to Claude-Mem:**
```bash
# Link task to memory note
beads-mem-bridge $TASK_ID --mem [MEM_NOTE_ID]
```

---

### End of Day

1. **Sync to git:**
```bash
bd sync
```

2. **Update status:**
```bash
# Mark completed tasks as done
bd update $TASK_ID --status done --notes "Completed implementation

Changes:
- Added feature X
- Fixed bug Y

Testing:
- Unit tests pass
- Integration tests pass"
```

3. **Create checkpoint (Entire):**
```bash
# Tag checkpoint with beads IDs
entire checkpoint create "End of day progress" \
  --tags "beads:$TASK_ID,completed,feature:X"
```

---

### Weekly Review

1. **Review completed tasks:**
```bash
bd list --status done --json | jq -r '.[] | "✓ \(.title)"'
```

2. **Check stuck tasks:**
```bash
# Find in_progress tasks not updated in 7 days
bd list --status in_progress --json | jq -r '.[] | select(.updated_at < "'$(date -v-7d -Iseconds)'") | "\(.id): \(.title)"'
```

3. **Clean up:**
```bash
# Close old open tasks
bd list --status open --json | jq -r '.[] | select(.updated_at < "'$(date -v-30d -Iseconds)'") | .id' | \
  xargs -I {} bd update {} --status closed --notes "Auto-closed: stale task"
```

---

## Feature Development

### Using Formula Templates

Formula templates provide pre-built workflows for common development tasks.

#### Feature Development Formula

**Location:** `~/KnowledgeBase/DevStack-Planning/Beads-Feature-Formula-Template.md`

**Quick Start:**

```bash
# 1. Create epic
bd create "Epic: User Authentication" -p 1 --type epic \
  --notes "Implement JWT-based authentication system

Requirements:
- User registration
- Login/logout
- Password reset
- Session management"

EPIC_ID=$(bd create "..." | grep "Created issue:" | sed 's/.*Created issue: //')

# 2. Create design task
bd create "Design: Auth - Architecture" -p 2 --type task \
  --notes "Design authentication system architecture

Cross-System Integration:
- Beads: Link to parent epic ID: $EPIC_ID"

# 3. Create implementation tasks
bd create "Impl: Auth - Core functionality" -p 3 --type task \
  --notes "Implement JWT authentication core

Tasks:
- Install dependencies
- Create JWT utilities
- Add auth middleware
- Update routes

Cross-System Integration:
- Beads: Link to parent epic ID: $EPIC_ID"
```

**See the full template** for detailed breakdowns, cross-system integration, and best practices.

---

### Step-by-Step Feature Workflow

1. **Create epic:**
```bash
bd create "Epic: [FEATURE NAME]" -p 1 --type epic --notes "Epic description"
```

2. **Break down into tasks:**
```bash
# Design task
bd create "Design: [FEATURE] - Architecture" -p 2 --type task

# Implementation tasks
bd create "Impl: [FEATURE] - Component A" -p 3 --type task
bd create "Impl: [FEATURE] - Component B" -p 3 --type task

# Testing task
bd create "Test: [FEATURE] - Comprehensive testing" -p 4 --type task

# Documentation task
bd create "Docs: [FEATURE] - Documentation" -p 4 --type task
```

3. **Work through tasks in priority order:**
```bash
# Always work on ready tasks (lowest priority number)
TASK_ID=$(bd ready --json | jq -r '.[0].id')
bd update $TASK_ID --claim
```

4. **Complete tasks:**
```bash
bd update $TASK_ID --status done --notes "Task completed

Changes:
- What was implemented
- Key decisions

Testing:
- Test results"
```

5. **Close epic:**
```bash
bd update $EPIC_ID --status done --notes "Epic completed

Delivered features:
- Feature A
- Feature B

Lessons learned:
- [Insights]"
```

---

## Bug Fix Workflow

### Bug Fix Formula Template

**Location:** `~/KnowledgeBase/DevStack-Planning/Beads-BugFix-Formula-Template.md`

**Quick Start:**

```bash
# 1. Report bug
bd create "Bug: Login fails on mobile" -p 2 --type bug \
  --notes "Bug Report: Login button not responsive on mobile

## Reproduction Steps
1. Open app on mobile
2. Click login button
3. Nothing happens

## Expected Behavior
Login modal opens

## Actual Behavior
No response

## Environment
- Device: iPhone 12
- Browser: Safari
- App version: 1.2.0"

# 2. Investigate
BUG_ID="..."
bd create "Investigate: Login mobile bug" -p 2 --type task \
  --notes "Investigation for mobile login bug

## Investigation Tasks
- [ ] Reproduce locally
- [ ] Review code
- [ ] Analyze logs

## Cross-System Integration
- Beads: Link to bug ID: $BUG_ID"

# 3. Fix
bd create "Fix: Login mobile button" -p 3 --type task \
  --notes "Fix implementation for mobile login

## Root Cause
Button z-index issue

## Fix Strategy
Adjust CSS z-index

## Testing
- Test on mobile devices
- Verify no regression"
```

---

### Bug Severity Guidelines

**Critical (P1):**
- Data loss or corruption
- Security vulnerability
- Production outage
- **Action:** Immediate hotfix

**High (P2):**
- Major functionality broken
- Performance degradation >50%
- **Action:** Fix today or next release

**Medium (P3):**
- Minor functionality issues
- Workarounds available
- **Action:** Fix within week

**Low (P4):**
- UI/UX improvements
- Edge cases
- **Action:** Fix when convenient

---

## Multi-Agent Collaboration

### Setting Up Multi-Agent Work

1. **Define task boundaries:**

```bash
# Agent A: Backend
bd create "Impl: Auth - Backend (Agent A)" -p 3 --type task \
  --notes "Assigned to: Agent A

Scope:
- JWT implementation
- Auth middleware
- User model

Claim with: bd update [TASK_ID] --claim"

# Agent B: Frontend
bd create "Impl: Auth - Frontend (Agent B)" -p 3 --type task \
  --notes "Assigned to: Agent B

Scope:
- Login form
- Session management UI
- Error handling

Claim with: bd update [TASK_ID] --claim"

# Agent C: Testing
bd create "Test: Auth - Integration tests (Agent C)" -p 4 --type task \
  --notes "Assigned to: Agent C

Scope:
- Integration tests
- E2E tests
- Test automation

Claim with: bd update [TASK_ID] --claim"
```

2. **Avoid conflicts:**
   - Different agents work on different files
   - Clear interfaces defined in design phase
   - Regular status updates in task notes

3. **Coordinate progress:**
```bash
# Agent A claims task
TASK_ID="agent-a-task"
bd update $TASK_ID --claim --notes "Started backend auth

Progress:
- [ ] JWT utilities
- [ ] Auth middleware
- [ ] User model

Status: Working on JWT utilities"
```

4. **Review and merge:**
```bash
# When tasks complete, merge changes
# Verify integration
# Update epic status
```

---

### Multi-Agent Simulation

Test multi-agent coordination:

```bash
# Run simulation script
simulate-multi-agent

# This creates multiple tasks and simulates
# different agents claiming them
```

---

## Cross-System Integration

### Beads + Claude-Mem

**Purpose:** Link tasks to memory notes for rich context preservation

**Usage:**

```bash
# Store development notes in Claude-Mem
# Get the note ID (e.g., mem-abc123)

# Link task to memory note
beads-mem-bridge [TASK_ID] --mem [MEM_NOTE_ID]

# Task notes will include reference to memory
bd update [TASK_ID] --notes "Development decisions stored in Claude-Mem

Note ID: mem-abc123

Key decisions:
- Chose X over Y
- Performance consideration: Z

Link: beads-mem-bridge [TASK_ID] --mem [MEM_NOTE_ID]"
```

**Benefits:**
- Preserves context across sessions
- Captures decision rationale
- Reduces token usage (notes instead of full context)

---

### Beads + Entire

**Purpose:** Tag checkpoints with beads IDs for time-based recovery

**Usage:**

```bash
# Before starting task
entire checkpoint create "Before bug fix" \
  --tags "beads:BUG_ID,before-fix"

# After completing task
entire checkpoint create "After bug fix" \
  --tags "beads:BUG_ID,after-fix,completed"

# Use entire restore with tags
entire restore --tags "beads:BUG_ID,after-fix"
```

**Benefits:**
- Time-travel to specific task states
- Recover before/after task states
- Link entire history to beads workflow

---

### Beads + RTK

**Purpose:** Token-efficient beads commands

**Usage:**

```bash
# RTK provides token savings for beads commands
# Use RTK-wrapped beads commands in scripts

# Instead of:
bd list

# Use (for token efficiency):
# RTK is configured to automatically optimize certain commands
# No manual intervention needed for basic usage
```

---

### Unified Status Check

```bash
# Check all systems
devstack-status

# Output:
# Beads: 5 tasks (2 in_progress, 3 ready)
# Claude-Mem: 127 notes
# Entire: 12 checkpoints
# RTK: Active
```

---

## Advanced Usage

### Custom Queries

```bash
# Find high-priority bugs
bd list --json | jq '.[] | select(.issue_type == "bug" and .priority <= 2) | .id'

# Find tasks updated in last 7 days
bd list --json | jq '.[] | select(.updated_at > "'$(date -v-7d -Iseconds)'") | .title'

# Count tasks by status
bd list --json | jq '.[] | .status' | sort | uniq -c
```

---

### Task Dependencies

```bash
# Create dependent tasks
PARENT_ID=$(bd create "Parent task" -p 1 --type task | grep "Created issue:" | sed 's/.*Created issue: //')

CHILD_ID=$(bd create "Child task" -p 2 --type task | grep "Created issue:" | sed 's/.*Created issue: //')

# Note: Beads automatically handles dependencies via parent-child relationships
# Check dependencies
bd show $CHILD_ID
```

---

### Bulk Operations

```bash
# Close all ready tasks
bd ready --json | jq -r '.[].id' | \
  xargs -I {} bd update {} --status done --notes "Bulk close"

# Reprioritize all P3 tasks to P2
bd list --json | jq -r '.[] | select(.priority == 3) | .id' | \
  xargs -I {} bd update {} --priority 2

# Add notes to all in_progress tasks
bd list --status in_progress --json | jq -r '.[].id' | \
  xargs -I {} bd update {} --notes "Weekly review: progress OK"
```

---

### Integration with plan-to-beads

```bash
# Convert markdown plan to beads tasks
plan-to-beads ~/work/feature-plan.md

# This parses markdown headers and creates
# corresponding tasks in beads
```

---

## Formulas and Templates

### Available Formulas

1. **Feature Development Formula**
   - Location: `Beads-Feature-Formula-Template.md`
   - Use for: Implementing new features
   - Includes: Epic → Design → Impl → Test → Deploy

2. **Bug Fix Formula**
   - Location: `Beads-BugFix-Formula-Template.md`
   - Use for: Fixing bugs
   - Includes: Report → Investigate → Fix → Verify → Deploy

---

### Using Formulas

```bash
# 1. Open the formula template
cat ~/KnowledgeBase/DevStack-Planning/Beads-Feature-Formula-Template.md

# 2. Copy and adapt the relevant section
# 3. Run the commands with your specific details
```

---

### Custom Formula Creation

1. **Identify workflow pattern:**
   - What phases does your work have?
   - What are the standard tasks?

2. **Create template:**
   - Define task structure
   - Include cross-system integration
   - Add workflow commands

3. **Document:**
   - Save as `.md` file
   - Include examples
   - Add usage instructions

---

## Performance Optimization

### For Small Projects (< 50 tasks)

- No optimization needed
- Use any beads commands freely
- Sync frequently

---

### For Medium Projects (50-200 tasks)

- Use ready query for daily workflow
- Cache frequently accessed task IDs
- Optimize sync frequency

---

### For Large Projects (> 200 tasks)

- Use targeted queries (never list all)
- Implement aggressive caching
- Archive completed tasks
- Consider multiple projects

**See:** `Beads-Optimization-Guide.md` for detailed optimization strategies.

---

### Quick Performance Tips

```bash
# Always use ready for daily workflow
TASK_ID=$(bd ready --json | jq -r '.[0].id')

# Cache task IDs for repeated operations
READY_CACHE=$(bd ready --json | jq -r '.[].id')

# Use targeted queries
bd list --type task --status in_progress --json

# Sync only when needed
bd sync  # After significant changes
```

---

## Reference Materials

### Essential Documentation

- **Quick Reference:** `Beads-Quick-Reference.md`
- **Feature Formula:** `Beads-Feature-Formula-Template.md`
- **Bug Fix Formula:** `Beads-BugFix-Formula-Template.md`
- **Optimization Guide:** `Beads-Optimization-Guide.md`
- **Performance Benchmarks:** `Beads-Performance-Benchmarks.md`
- **Cross-System Workflows:** `Cross-System-Integration-Workflows.md`
- **Multi-Agent Config:** `Multi-Agent-Configuration.md`

### Scripts

- `plan-to-beads`: Convert markdown plans to beads tasks
- `beads-mem-bridge`: Link beads to Claude-Mem
- `beads-entire-bridge`: Tag Entire checkpoints with beads IDs
- `devstack-status`: Unified status check
- `simulate-multi-agent`: Test multi-agent coordination

### Skills

- `beads-integration`: Task management skill
- `cross-system-query`: Cross-system querying

---

## Troubleshooting

### Common Issues

**Task not appearing in ready list:**
```bash
# Check task status
bd show [TASK_ID]

# Verify priority ordering
bd list --json | jq '.[] | {id, title, priority}'
```

**Sync failing:**
```bash
# Check git status
cd ~/work/your-project
git status

# Fix git issues, then sync again
bd sync
```

**BEADS_DIR not found:**
```bash
# Export BEADS_DIR explicitly
export BEADS_DIR=~/work/your-project/.beads
bd list
```

**See:** `Beads-Troubleshooting.md` for detailed troubleshooting guide.

---

## Support and Resources

### Getting Help

```bash
# Beads help
bd --help

# Command help
bd create --help
bd update --help
```

### Documentation

All documentation is in:
```
~/KnowledgeBase/DevStack-Planning/
```

### Feedback and Issues

Report issues or request features via your team's workflow.

---

**End of User Guide**

**Version:** 1.0
**Last Updated:** 2026-02-17
