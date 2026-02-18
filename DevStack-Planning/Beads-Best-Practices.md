# Beads Best Practices Guide

**Version:** 1.0
**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Task Management](#task-management)
2. [Workflow Organization](#workflow-organization)
3. [Cross-System Integration](#cross-system-integration)
4. [Multi-Agent Collaboration](#multi-agent-collaboration)
5. [Performance Optimization](#performance-optimization)
6. [Documentation and Notes](#documentation-and-notes)
7. [Git Integration](#git-integration)
8. [Team Coordination](#team-coordination)
9. [Code Quality](#code-quality)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Task Management

### 1. Use Descriptive Task Titles

**❌ Bad:**
```bash
bd create "Fix it" -p 3
bd create "Work on thing" -p 3
```

**✅ Good:**
```bash
bd create "Fix: Login button not responding on mobile Safari" -p 3
bd create "Impl: Add JWT authentication middleware" -p 3
```

**Why:** Clear titles make tasks searchable and self-documenting

---

### 2. Use Proper Task Types

**Guidelines:**
- **epic**: Large features with multiple tasks (1-10 per project)
- **task**: Individual work items (most tasks)
- **bug**: Issues requiring fixes

**Example:**
```bash
# Epic for large feature
bd create "Epic: User Authentication System" -p 1 --type epic

# Tasks under epic
bd create "Impl: JWT token generation" -p 3 --type task
bd create "Impl: Auth middleware" -p 3 --type task

# Bugs
bd create "Bug: Login timeout after 30 seconds" -p 2 --type bug
```

---

### 3. Use Priority Numbers Correctly

**Guidelines:**
- **P1 (1)**: Critical - blockers, security issues, production outages
- **P2 (2)**: High - important features, high-impact bugs
- **P3 (3)**: Medium - normal work, standard bugs
- **P4 (4)**: Low - nice-to-haves, minor issues

**Example:**
```bash
# Critical
bd create "CRITICAL: Database connection leak" -p 1 --type bug

# High
bd create "Impl: User dashboard performance" -p 2 --type task

# Medium
bd create "Refactor: Improve code readability" -p 3 --type task

# Low
bd create "Docs: Update README with new examples" -p 4 --type task
```

---

### 4. Keep Tasks Focused

**❌ Bad:**
```bash
bd create "Implement entire authentication system with login, logout, password reset, and 2FA" -p 3
```

**✅ Good:**
```bash
bd create "Impl: Login functionality" -p 3 --type task
bd create "Impl: Logout functionality" -p 3 --type task
bd create "Impl: Password reset flow" -p 3 --type task
bd create "Impl: Two-factor authentication" -p 3 --type task
```

**Why:** Smaller tasks are easier to estimate, track, and complete

---

### 5. Break Down Large Tasks

**When to break down:**
- Task takes > 4 hours to complete
- Task involves multiple components
- Task has clear sub-phases

**Example:**
```bash
# Original (too large)
bd create "Fix slow API performance" -p 2

# Break down
bd create "Analyze: API performance bottlenecks" -p 2 --type task
bd create "Impl: Optimize database queries" -p 3 --type task
bd create "Impl: Add response caching" -p 3 --type task
bd create "Test: Performance regression tests" -p 4 --type task
```

---

## Workflow Organization

### 1. Always Work from Ready List

**❌ Bad:**
```bash
# Manually scanning all tasks
bd list
# Manually picking task
bd update random-task-id --claim
```

**✅ Good:**
```bash
# Always work on ready tasks
TASK_ID=$(bd ready --json | jq -r '.[0].id')
bd update $TASK_ID --claim
```

**Why:** Ready list ensures you're working on highest priority tasks

---

### 2. Use Consistent Status Updates

**Workflow:**
1. **open** → Task created, not started
2. **in_progress** → Currently working on task
3. **testing** → Implementation done, testing
4. **done** → Complete and verified
5. **closed** → No longer relevant

**Example:**
```bash
# Start task
bd update $TASK_ID --status in_progress --notes "Started implementation"

# Move to testing
bd update $TASK_ID --status testing --notes "Ready for review"

# Complete
bd update $TASK_ID --status done --notes "Completed successfully"
```

---

### 3. Update Task Notes Regularly

**When to update:**
- Start working on task
- Make progress
- Hit blockers
- Make key decisions
- Complete task

**Example:**
```bash
# Start
bd update $TASK_ID --notes "Started working on JWT implementation

Plan:
- [ ] Install dependencies
- [ ] Create JWT utility functions
- [ ] Add auth middleware"

# Progress
bd update $TASK_ID --notes "Progress update:
- [x] Install dependencies
- [x] Create JWT utility functions
- [ ] Add auth middleware

Blocker: Need clarification on token expiration"

# Key decision
bd update $TASK_ID --notes "Key decision: Chose 1-hour token expiration

Reasoning:
- Security vs UX balance
- Refresh token flow handles expiry
- Industry standard"

# Complete
bd update $TASK_ID --status done --notes "Completed JWT implementation

Changes:
- Added JWT utilities
- Created auth middleware
- Updated routes to use auth

Testing:
- Unit tests pass
- Integration tests pass
- Manual testing complete"
```

---

### 4. Close Completed Tasks

**❌ Bad:**
```bash
# Leaving done tasks in backlog
bd list | grep done
# Hundreds of completed tasks cluttering view
```

**✅ Good:**
```bash
# Close done tasks regularly
bd list --status done --json | jq -r '.[].id' | \
  xargs -I {} bd update {} --status closed --notes "Auto-closed: completed task"

# Or close specific tasks after milestone
bd update $TASK_ID --status done
# After verification
bd update $TASK_ID --status closed --notes "Closed after successful deployment"
```

---

### 5. Use Epics for Large Features

**When to use epics:**
- Feature has 5+ related tasks
- Tasks span multiple phases (design, impl, test)
- Feature has clear start and end

**Example:**
```bash
# Create epic
EPIC_ID=$(bd create "Epic: User Authentication System" -p 1 --type epic | \
  grep "Created issue:" | sed 's/.*Created issue: //')

# Create related tasks under epic
bd create "Design: Auth system architecture" -p 2 --type task \
  --notes "Design authentication system

Cross-System Integration:
- Beads: Link to parent epic ID: $EPIC_ID"

bd create "Impl: JWT authentication" -p 3 --type task \
  --notes "Implement JWT auth

Cross-System Integration:
- Beads: Link to parent epic ID: $EPIC_ID"

# Track epic progress
bd list --json | jq '.[] | select(.id == "$EPIC_ID")'
```

---

## Cross-System Integration

### 1. Link Beads to Claude-Mem

**When to link:**
- Making complex decisions
- Researching solutions
- Capturing rationale
- Storing technical context

**Example:**
```bash
# Store decision in Claude-Mem
# Get note ID (e.g., mem-abc123)

# Link task to memory note
beads-mem-bridge $TASK_ID --mem mem-abc123

# Update task notes with reference
bd update $TASK_ID --notes "Decision stored in Claude-Mem

Note ID: mem-abc123

Decision: Chose library X over Y
Reason:
- Better API design
- More active maintenance
- Smaller bundle size"
```

---

### 2. Use Entire for Time-Based Recovery

**When to create checkpoints:**
- Before major changes
- After completing tasks
- At project milestones
- Before risky operations

**Example:**
```bash
# Before starting work
entire checkpoint create "Before auth implementation" \
  --tags "beads:$TASK_ID,before-start"

# After completing task
entire checkpoint create "After auth implementation" \
  --tags "beads:$TASK_ID,completed,feature:auth"

# At milestone
entire checkpoint create "Q1 Feature Complete" \
  --tags "milestone,q1,beads:$EPIC_ID"

# Recovery
entire restore --tags "beads:$TASK_ID,before-start"
```

---

### 3. Use Unified Status Checks

**Daily routine:**
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

### 4. Use plan-to-beads for Planning

**When to use:**
- Starting new feature
- Creating task breakdowns
- Converting markdown plans

**Example:**
```bash
# Create markdown plan
cat > feature-plan.md << EOF
# Feature: User Dashboard

## Design
- Research dashboard solutions
- Design component structure

## Implementation
- Create dashboard component
- Add data fetching
- Implement charts

## Testing
- Write unit tests
- Add E2E tests
EOF

# Convert to beads tasks
plan-to-beads feature-plan.md
```

---

## Multi-Agent Collaboration

### 1. Define Clear Task Boundaries

**Before assigning:**
- Identify distinct work areas
- Define interfaces clearly
- Set ownership expectations

**Example:**
```bash
# Agent A: Backend
bd create "Impl: Auth API endpoints (Agent A)" -p 3 --type task \
  --notes "Assigned to: Agent A

Scope:
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

Claim with: bd update [TASK_ID] --claim
Notes: Add progress to task notes"

# Agent B: Frontend
bd create "Impl: Auth UI components (Agent B)" -p 3 --type task \
  --notes "Assigned to: Agent B

Scope:
- Login form
- Logout button
- Token management

Claim with: bd update [TASK_ID] --claim
Notes: Add progress to task notes"
```

---

### 2. Avoid File-Level Conflicts

**Strategy:**
- Different agents work on different files
- Use clear API boundaries
- Coordinate through design phase

**Example:**
```bash
# Agent A: Backend files
# - /api/auth.js
# - /middleware/auth.js

# Agent B: Frontend files
# - /components/auth/LoginForm.js
# - /components/auth/LogoutButton.js

# No file conflicts possible
```

---

### 3. Communicate via Task Notes

**Update notes regularly:**
```bash
# Agent A updates task notes
bd update $TASK_ID --notes "Progress update:
- [x] Implemented POST /api/auth/login
- [ ] Implement POST /api/auth/logout
- [ ] Implement POST /api/auth/refresh

API endpoint ready: POST /api/auth/login
Frontend can start integrating"
```

**Agent B reads notes:**
```bash
# Agent B checks Agent A's progress
bd show $TASK_ID --json | jq -r '.notes'
```

---

### 4. Test Integration Together

**When agents complete tasks:**
1. Each agent tests their own work
2. Agents coordinate integration testing
3. Identify and fix integration issues
4. Update epic status

**Example:**
```bash
# Create integration testing task
bd create "Test: Auth integration (Agents A+B+C)" -p 4 --type task \
  --notes "Integration testing

Agents:
- Agent A: Backend
- Agent B: Frontend
- Agent C: Testing

Tasks:
- [ ] Frontend calls backend API
- [ ] End-to-end authentication flow
- [ ] Error handling
- [ ] Token refresh flow"

# Agents coordinate in task notes
bd update $TEST_TASK_ID --notes "Integration test results:
- [x] Frontend-backend communication
- [x] End-to-end flow
- [ ] Error handling
- [ ] Token refresh

Issue found: Token refresh not working on 401
Agent B: Fix needed on frontend"
```

---

## Performance Optimization

### 1. Use Targeted Queries

**❌ Bad:**
```bash
# Get all tasks, then filter
bd list --json | jq '.[] | select(.status == "in_progress")'
```

**✅ Good:**
```bash
# Get only matching tasks
bd list --status in_progress --json
```

---

### 2. Cache Frequently Accessed Data

**When to cache:**
- Same tasks accessed multiple times
- Complex jq queries
- Long-running sessions

**Example:**
```bash
# Cache ready tasks
READY_CACHE=$(bd ready --json | jq -r '.[].id')

# Use cache throughout session
for task_id in $READY_CACHE; do
  bd show $task_id
done

# Invalidate when tasks change
invalidate_cache() {
  READY_CACHE=$(bd ready --json | jq -r '.[].id')
}
```

---

### 3. Sync Only When Needed

**❌ Bad:**
```bash
# Sync after every operation
bd update $TASK_ID --status in_progress
bd sync

bd update $TASK_ID --notes "Progress"
bd sync
```

**✅ Good:**
```bash
# Sync only after significant changes
bd update $TASK_ID --status in_progress
# ... more work ...
bd update $TASK_ID --status done
bd sync
```

---

### 4. Archive Old Tasks

**When to archive:**
- Tasks > 30 days old and done
- Completed features
- Historical data

**Example:**
```bash
# Archive old completed tasks
bd list --status done --json | \
  jq ".[] | select(.updated_at < \"$(date -v-30d -Iseconds)\") | .id" | \
  while read task_id; do
    bd show $task_id --json >> ~/archive/beads-$(date +%Y%m%d).json
    bd update $task_id --status closed --notes "Archived: > 30 days old"
  done
```

---

## Documentation and Notes

### 1. Write Self-Documenting Task Titles

**Include:**
- Action verb (Create, Fix, Implement)
- What is being done
- Relevant context

**Example:**
```bash
# Clear
bd create "Fix: Login button unresponsive on iOS Safari" -p 2 --type bug

# Also clear
bd create "Impl: Add JWT refresh token flow" -p 3 --type task

# Also clear
bd create "Docs: Update API documentation for v2.0" -p 4 --type task
```

---

### 2. Capture Decision Rationale in Notes

**When to capture:**
- Choosing between alternatives
- Making architectural decisions
- Rejecting approaches
- Performance trade-offs

**Example:**
```bash
bd update $TASK_ID --notes "Decision: Chose SQLite over PostgreSQL

Reasoning:
- Simpler deployment
- Sufficient for current scale
- Easier backups
- No external dependencies

Trade-offs:
- Not suitable for > 1M rows
- Single-machine only
- Limited query complexity

Future: Can migrate to PostgreSQL if needed"
```

---

### 3. Link to External Resources

**In task notes:**
```bash
bd update $TASK_ID --notes "Research findings:

- JWT library comparison: https://example.com/jwt-comparison
- Best practices: https://example.com/auth-best-practices
- Security considerations: https://example.com/jwt-security

Selected library: jsonwebtoken
Reasons:
- Most popular (2M+ weekly downloads)
- Active maintenance
- Good documentation"
```

---

### 4. Use Structured Notes

**Template:**
```bash
bd update $TASK_ID --notes "Task: [Title]

## Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Progress
- [x] Step 1 completed
- [ ] Step 2 in progress
- [ ] Step 3 pending

## Blockers
- None

## Decisions
- Decision 1: Chose X over Y
  - Reason: ...

## Next Steps
- Complete Step 2
- Start Step 3
- Testing"
```

---

## Git Integration

### 1. Sync Regularly but Not Excessively

**Best practice:**
```bash
# Sync at key points
# 1. Before starting major work
bd sync

# 2. After completing tasks
bd update $TASK_ID --status done
bd sync

# 3. At project milestones
entire checkpoint create "Milestone" --tags "milestone"
```

---

### 2. Include Task IDs in Commit Messages

**Example:**
```bash
# Work on task
TASK_ID=$(bd ready --json | jq -r '.[0].id')
bd update $TASK_ID --claim

# Make changes
# ...

# Commit with task ID
git commit -m "Implement JWT authentication (#$TASK_ID)"
```

---

### 3. Use Compaction Hook

**The compaction hook automatically:**
- Queries active tasks before compaction
- Updates tasks with compaction timestamp
- Syncs beads database

**No manual action needed** - just ensure entire-check plugin is installed.

---

## Team Coordination

### 1. Define Team Workflow

**Establish:**
- Who works on what types of tasks
- When to sync
- How to coordinate
- Code review process

**Example:**
```bash
# Team structure
# - Frontend team: UI tasks
# - Backend team: API tasks
# - DevOps team: Infrastructure tasks
# - QA team: Testing tasks

# Daily standup
# Each person: Check ready tasks for their specialty
```

---

### 2. Use Consistent Naming Conventions

**Example:**
```bash
# Frontend tasks
bd create "UI: Login form redesign" -p 3 --type task
bd create "UI: Dashboard layout" -p 3 --type task

# Backend tasks
bd create "API: Add user endpoint" -p 3 --type task
bd create "DB: Optimize query performance" -p 3 --type task

# DevOps tasks
bd create "Infra: Set up CI/CD pipeline" -p 3 --type task
```

---

### 3. Review and Close Tasks Together

**Process:**
1. Developer completes task
2. Moves to testing status
3. QA reviews
4. Moves to done status
5. Team member closes task

**Example:**
```bash
# Developer
bd update $TASK_ID --status testing --notes "Ready for review"

# QA
bd update $TASK_ID --notes "Review comments:
- [x] Functionality correct
- [ ] Need more tests
- [ ] Documentation missing"

# Developer (fixes)
bd update $TASK_ID --status testing --notes "Review feedback addressed"

# Team lead (closes)
bd update $TASK_ID --status closed --notes "Approved and deployed"
```

---

## Code Quality

### 1. Add Testing Tasks

**For every implementation task:**
```bash
# Implementation task
bd create "Impl: Add user dashboard" -p 3 --type task

# Testing task
bd create "Test: User dashboard tests" -p 4 --type task \
  --notes "Testing for user dashboard

Unit tests:
- [ ] Component tests
- [ ] Hook tests
- [ ] Utility tests

Integration tests:
- [ ] API integration
- [ ] Data flow

E2E tests:
- [ ] User journey
- [ ] Error scenarios"
```

---

### 2. Add Documentation Tasks

**For new features:**
```bash
# Implementation task
bd create "Impl: Add user authentication" -p 3 --type task

# Documentation task
bd create "Docs: Authentication documentation" -p 4 --type task \
  --notes "Documentation for authentication

Tasks:
- [ ] Update README
- [ ] Add API documentation
- [ ] Create usage examples
- [ ] Add troubleshooting section"
```

---

### 3. Include Review Tasks

**Before deployment:**
```bash
# Code review task
bd create "Review: Authentication code review" -p 4 --type task \
  --notes "Code review for authentication

Checklist:
- [ ] Code follows patterns
- [ ] Security review passed
- [ ] Tests added
- [ ] Documentation updated
- [ ] No breaking changes"
```

---

## Anti-Patterns to Avoid

### 1. Don't Create Vague Tasks

**❌ Bad:**
```bash
bd create "Do the thing" -p 3
bd create "Fix stuff" -p 3
```

**✅ Good:**
```bash
bd create "Fix: Login button z-index issue on mobile" -p 2 --type bug
```

---

### 2. Don't Ignore Task Notes

**❌ Bad:**
```bash
# Task with no notes
bd create "Task" -p 3 --type task

# Update without notes
bd update $TASK_ID --status in_progress
```

**✅ Good:**
```bash
# Create with notes
bd create "Task" -p 3 --type task --notes "Implementation plan:
- Step 1
- Step 2"

# Update with notes
bd update $TASK_ID --status in_progress --notes "Started implementation"
```

---

### 3. Don't Mix Concerns

**❌ Bad:**
```bash
# One task for design, implementation, testing, docs
bd create "Complete feature X" -p 3 --type task
```

**✅ Good:**
```bash
# Separate tasks
bd create "Design: Feature X architecture" -p 2 --type task
bd create "Impl: Feature X core" -p 3 --type task
bd create "Test: Feature X tests" -p 4 --type task
bd create "Docs: Feature X documentation" -p 4 --type task
```

---

### 4. Don't Ignore Priorities

**❌ Bad:**
```bash
# All tasks P3
bd create "Critical bug" -p 3 --type bug
bd create "Nice to have feature" -p 3 --type task
bd create "Docs update" -p 3 --type task
```

**✅ Good:**
```bash
# Correct priorities
bd create "CRITICAL: Database crash" -p 1 --type bug
bd create "Nice to have feature" -p 4 --type task
bd create "Docs update" -p 4 --type task
```

---

### 5. Don't Leave Tasks Stuck

**❌ Bad:**
```bash
# Task stuck for weeks
bd list --status in_progress
# Shows tasks from 30 days ago
```

**✅ Good:**
```bash
# Review weekly
# Move stuck tasks or update notes
bd list --status in_progress --json | \
  jq ".[] | select(.updated_at < \"$(date -v-7d -Iseconds)\")

# Update or close stuck tasks
bd update $STUCK_TASK_ID --status testing --notes "Unstuck: Moved to testing"
```

---

## Summary Checklist

### Daily Workflow
- [ ] Check ready tasks
- [ ] Claim appropriate task
- [ ] Update task notes with progress
- [ ] Complete tasks and mark done
- [ ] Sync to git
- [ ] Create entire checkpoint if milestone

### Weekly Workflow
- [ ] Review completed tasks
- [ ] Close old done tasks
- [ ] Check for stuck tasks
- [ ] Archive completed features
- [ ] Review and update priorities

### Team Workflow
- [ ] Define clear task boundaries
- [ ] Use consistent naming conventions
- [ ] Coordinate through task notes
- [ ] Review and close tasks together
- [ ] Share learning and best practices

---

**End of Best Practices Guide**

**Version:** 1.0
**Last Updated:** 2026-02-17

**Related Docs:**
- Beads User Guide
- Beads Quick Reference
- Beads Optimization Guide
- Beads Troubleshooting Guide
