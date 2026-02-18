# Feature Development Formula Template

**Purpose:** Reusable task breakdown template for implementing new features with beads integration

**Usage:** Copy this structure and adapt for specific feature requirements

---

## Formula: Feature Development

### Metadata
```yaml
name: feature-development
type: formula
description: Complete workflow for implementing new features with proper tracking
estimated_duration: 2-4 hours
requires_beads: true
```

### Task Breakdown

#### Phase 1: Planning & Analysis (Epic)

```bash
# Create epic task
bd create "Epic: [FEATURE NAME]" \
  -p 1 \
  --type epic \
  --notes "Epic for implementing [FEATURE DESCRIPTION]

## Requirements
- User story: As a [role], I want [feature], so that [benefit]
- Acceptance criteria:
  1. [Criteria 1]
  2. [Criteria 2]
  3. [Criteria 3]

## Dependencies
- [System 1]
- [System 2]

## Constraints
- Performance: [requirements]
- Compatibility: [requirements]
- Security: [requirements]"
```

#### Phase 2: Design & Architecture (Task)

```bash
# Create design task
PARENT_EPIC_ID="[EPIC_ID_FROM_PHASE_1]"

bd create "Design: [FEATURE NAME] - Architecture" \
  -p 2 \
  --type task \
  --notes "Design phase for [FEATURE NAME]

## Tasks
- [ ] Review existing patterns in codebase
- [ ] Create design document
- [ ] Define data structures
- [ ] Plan API endpoints/interfaces
- [ ] Identify edge cases

## Deliverables
- Design document in ~/knowledgebase/DevStack-Planning/
- Architecture diagram (optional)
- Task breakdown for implementation

## Cross-System Integration
- Claude-Mem: Design decisions and rationale
- Beads: Link to parent epic ID: $PARENT_EPIC_ID"
```

#### Phase 3: Implementation Tasks (Tasks)

```bash
# Create implementation tasks (adapt count as needed)

PARENT_EPIC_ID="[EPIC_ID_FROM_PHASE_1]"

# Task 3.1: Core implementation
bd create "Impl: [FEATURE NAME] - Core functionality" \
  -p 3 \
  --type task \
  --notes "Implement core [FEATURE] functionality

## Implementation Plan
1. Set up project structure
2. Implement [component A]
3. Implement [component B]
4. Add error handling
5. Add logging

## Testing
- Unit tests for each component
- Integration tests for workflows
- Edge case coverage

## Cross-System Integration
- Claude-Mem: Implementation notes
- Beads: Link to parent epic ID: $PARENT_EPIC_ID"

# Task 3.2: Integration with existing systems
bd create "Impl: [FEATURE NAME] - Integration" \
  -p 3 \
  --type task \
  --notes "Integrate [FEATURE] with existing systems

## Integration Points
- [System 1]: [integration details]
- [System 2]: [integration details]
- [System 3]: [integration details]

## Tasks
- [ ] Update configuration files
- [ ] Add required dependencies
- [ ] Update documentation
- [ ] Test integrations

## Cross-System Integration
- Claude-Mem: Integration patterns
- Beads: Link to parent epic ID: $PARENT_EPIC_ID"

# Task 3.3: Testing & validation
bd create "Test: [FEATURE NAME] - Comprehensive testing" \
  -p 3 \
  --type task \
  --notes "Comprehensive testing for [FEATURE]

## Test Coverage
- Unit tests: [target coverage %]
- Integration tests: [key scenarios]
- E2E tests: [critical paths]
- Performance tests: [if applicable]

## Test Scenarios
1. Happy path: [description]
2. Error conditions: [description]
3. Edge cases: [description]
4. Performance: [requirements]

## Cross-System Integration
- Claude-Mem: Test results and issues
- Beads: Link to parent epic ID: $PARENT_EPIC_ID"
```

#### Phase 4: Documentation (Task)

```bash
PARENT_EPIC_ID="[EPIC_ID_FROM_PHASE_1]"

bd create "Docs: [FEATURE NAME] - Complete documentation" \
  -p 4 \
  --type task \
  --notes "Create comprehensive documentation for [FEATURE]

## Documentation Tasks
- [ ] Update README.md with feature overview
- [ ] Create API documentation (if applicable)
- [ ] Add usage examples
- [ ] Update troubleshooting guides
- [ ] Document configuration options

## Cross-System Integration
- Claude-Mem: Documentation sources
- Beads: Link to parent epic ID: $PARENT_EPIC_ID

## Deliverables
- Documentation files in project root or docs/
- Code comments and docstrings
- Updated AGENTS.md (if relevant)"
```

#### Phase 5: Review & Deployment (Task)

```bash
PARENT_EPIC_ID="[EPIC_ID_FROM_PHASE_1]"

bd create "Review: [FEATURE NAME] - Code review & deployment" \
  -p 5 \
  --type task \
  --notes "Final review and deployment of [FEATURE]

## Review Checklist
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance benchmarks met
- [ ] Security review passed (if needed)

## Deployment Tasks
- [ ] Create feature branch
- [ ] Update CHANGELOG
- [ ] Tag release version
- [ ] Deploy to staging
- [ ] Verify in staging
- [ ] Deploy to production

## Cross-System Integration
- Entire: Create checkpoint with release notes
- Claude-Mem: Deployment notes and lessons learned
- Beads: Link to parent epic ID: $PARENT_EPIC_ID

## Post-Deployment
- Monitor logs and metrics
- Gather user feedback
- Update based on feedback"
```

---

## Workflow Commands

### Claim Next Task
```bash
# Get next ready task in current phase
NEXT_TASK=$(bd ready --json | jq -r '.[0].id')
bd update $NEXT_TASK --claim
echo "Claimed task: $NEXT_TASK"
bd show $NEXT_TASK
```

### Mark Task Complete
```bash
# Update task status and add completion notes
TASK_ID="[TASK_ID]"
bd update $TASK_ID \
  --status done \
  --notes "Completed implementation details:

- [What was done]
- [Key decisions made]
- [Known limitations]
- [Related issues]"

# Sync to git repository
bd sync
```

### Bulk Status Update
```bash
# Update all tasks in a phase
EPIC_ID="[EPIC_ID]"

# Mark design phase complete
bd list --epic $EPIC_ID --status in_progress --json | \
  jq -r '.[].id' | \
  xargs -I {} bd update {} --status done

# Move to next phase
# (Manually claim next ready task)
```

### Check Progress
```bash
# Show epic progress
EPIC_ID="[EPIC_ID]"
echo "Epic $EPIC_ID Progress:"
bd list --epic $EPIC_ID --json | jq '[
  {status: .[] | .status} | group_by(.) | 
  map({status: .[0], count: length}) | sort_by(.status)
] | .[]'
```

---

## Cross-System Integration Commands

### Link to Claude-Mem During Development
```bash
TASK_ID="[TASK_ID]"
NOTE_ID="[CLAUDE-MEM_NOTE_ID]"

bd update $TASK_ID \
  --notes "Related to Claude-Mem note: $NOTE_ID

Notes captured during development:
- [Key insight 1]
- [Key insight 2]

Cross-system link: beads-entire-bridge $TASK_ID"
```

### Create Entire Checkpoint on Milestone
```bash
MILESTONE="[FEATURE NAME] Phase Complete]"
TASK_IDS="[TASK_ID,TASK_ID,TASK_ID]"

# Tag checkpoint with task IDs
entire checkpoint create "$MILESTONE" \
  --tags "beads:$TASK_IDS,feature:[FEATURE_NAME]"
```

### Unified Status Check
```bash
# Check all systems for current feature
FEATURE="[FEATURE_NAME]"
devstack-status --filter "$FEATURE"
```

---

## Multi-Agent Coordination

### Parallel Implementation Tasks

When working with multiple agents:

1. **Assign specific sub-tasks** to each agent
2. **Use clear task boundaries** to avoid conflicts
3. **Set parent epic** for tracking

```bash
# Agent 1: Core implementation
bd create "Impl: [FEATURE] - Core (Agent A)" \
  -p 3 \
  --type task \
  --notes "Assigned to: Agent A

Scope:
- Component A
- Component B

Claim with: bd update [TASK_ID] --claim
Owner notes: bd update [TASK_ID] --notes 'Progress: ...'"

# Agent 2: Integration
bd create "Impl: [FEATURE] - Integration (Agent B)" \
  -p 3 \
  --type task \
  --notes "Assigned to: Agent B

Scope:
- System X integration
- System Y integration

Claim with: bd update [TASK_ID] --claim
Owner notes: bd update [TASK_ID] --notes 'Progress: ...'"
```

### Conflict Prevention

- **Different files** for parallel work
- **Clear interfaces** defined in design phase
- **Regular syncs** via beads status updates

---

## Customization Guide

### Adapt for Different Feature Types

**Small Feature (1-2 tasks):**
- Combine phases into 2-3 tasks
- Simplify acceptance criteria
- Skip separate design task

**Large Feature (10+ tasks):**
- Split implementation into multiple phases
- Add separate testing phases per component
- Create sub-epics for major components

**Critical Feature (security/performance):**
- Add security review task
- Add performance benchmarking task
- Add audit task

### Modify Priority Scheme

```bash
# Modify priority levels as needed
# Default: 1=planning, 2=design, 3=implement, 4=test, 5=deploy

# Custom priority scheme:
# 1=critical path, 2=high priority, 3=normal, 4=low, 5=optional
bd create "Task" -p 1 --notes "Critical path item"
```

---

## Examples

### Example 1: Small Feature - Add Authentication

```bash
# Epic
bd create "Epic: User Authentication" -p 1 --type epic \
  --notes "Implement JWT-based authentication system"

# Combined design + impl
bd create "Auth: Implement JWT authentication" -p 2 --type task \
  --notes "Design and implement JWT auth

Tasks:
- Install dependencies
- Create JWT utility functions
- Add auth middleware
- Update routes

Testing:
- Unit tests for JWT functions
- Integration tests for protected routes"

# Testing
bd create "Test: Authentication system" -p 3 --type task \
  --notes "Test JWT authentication

Scenarios:
- Valid token access
- Invalid token rejection
- Token expiration handling
- Refresh token flow"
```

### Example 2: Large Feature - Payment Processing

```bash
# Epic
bd create "Epic: Payment Processing System" -p 1 --type epic \
  --notes "Complete payment processing with multiple providers"

# Sub-epics
bd create "Sub-epic: Stripe Integration" -p 2 --type epic \
  --notes "Stripe payment provider integration"

bd create "Sub-epic: PayPal Integration" -p 2 --type epic \
  --notes "PayPal payment provider integration"

# Implementation tasks (per sub-epic)
bd create "Impl: Stripe - Core payments" -p 3 --type task \
  --notes "Stripe payment processing core logic"

bd create "Impl: Stripe - Webhooks" -p 3 --type task \
  --notes "Stripe webhook handling"

bd create "Test: Stripe integration tests" -p 4 --type task \
  --notes "Comprehensive Stripe testing"

# System-level tasks
bd create "Impl: Payment provider abstraction" -p 3 --type task \
  --notes "Abstract payment provider interface"

bd create "Docs: Payment API documentation" -p 4 --type task \
  --notes "Complete payment API docs"
```

---

## Best Practices

1. **Break down tasks** until each is completable in 2-4 hours
2. **Use clear descriptions** with concrete acceptance criteria
3. **Link cross-system** for better context preservation
4. **Update task status** daily or after major progress
5. **Sync regularly** with `bd sync` to push to git
6. **Use notes** to capture decisions and progress
7. **Review epic progress** before starting new tasks
8. **Close completed tasks** to keep backlog clean

---

## Troubleshooting

### Tasks not appearing in ready list
```bash
# Check if epic is properly set
bd show [TASK_ID]

# Verify priority ordering
bd list --epic [EPIC_ID] --json | jq '.[] | {id, title, priority}'
```

### Cross-system links broken
```bash
# Re-establish links
beads-mem-bridge [TASK_ID] --relink
beads-entire-bridge [TASK_ID] --retag
```

### Multi-agent conflicts
```bash
# Check claimed tasks
bd list --claimed --json

# Release conflicting task
bd update [TASK_ID] --unclaim

# Reclaim with proper notes
bd update [TASK_ID] --claim --notes "Taking over from [AGENT]"
```

---

**Template Version:** 1.0
**Last Updated:** 2026-02-17
**Related Docs:**
- Beads Integration Plan
- Beads Quick Reference
- Cross-System Integration Workflows
