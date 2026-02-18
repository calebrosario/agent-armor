# Bug Fix Formula Template

**Purpose:** Reusable task breakdown template for debugging and fixing bugs with beads integration

**Usage:** Copy this structure and adapt for specific bug reports

---

## Formula: Bug Fix

### Metadata
```yaml
name: bug-fix
type: formula
description: Complete workflow for debugging and fixing bugs with proper tracking
estimated_duration: 1-3 hours
requires_beads: true
urgency_levels: [critical, high, medium, low]
```

### Bug Classification

Before creating tasks, classify the bug:

```bash
# Determine bug type:
# 1. Reproduction issue - cannot reproduce
# 2. Regression - worked before, broken now
# 3. Logic error - code doesn't match requirements
# 4. Edge case - unusual input/situation
# 5. Performance issue - too slow
# 6. Security issue - vulnerability
# 7. UI/UX issue - user experience problem
# 8. Integration issue - system interaction problem
```

---

## Task Breakdown

#### Phase 1: Bug Report & Reproduction (Bug Task)

```bash
# Create bug task
BUG_TYPE="[TYPE]"  # critical, high, medium, low
PRIORITY=1  # Critical bugs get priority 1

bd create "Bug: [BUG TITLE]" \
  -p $PRIORITY \
  --type bug \
  --notes "Bug Report: [BUG TITLE]

## Bug Type
Type: $BUG_TYPE
Severity: [critical/high/medium/low]

## Description
[Detailed description of the bug]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [details]
- Version: [details]
- Configuration: [details]

## Error Messages (if any)
\`\`\`
[paste error message]
\`\`\`

## Screenshots/Logs
[Attach relevant files]

## Cross-System Integration
- Claude-Mem: Reproduction notes and initial analysis
- Beads: Bug tracking with parent bug ID"
```

#### Phase 2: Investigation & Root Cause (Task)

```bash
# Create investigation task
BUG_ID="[BUG_ID_FROM_PHASE_1]"

bd create "Investigate: [BUG TITLE] - Root cause analysis" \
  -p 2 \
  --type task \
  --notes "Investigation for [BUG TITLE]

## Investigation Tasks
- [ ] Reproduce the bug locally
- [ ] Review git history for recent changes
- [ ] Check logs and error traces
- [ ] Analyze code paths involved
- [ ] Test with different inputs/scenarios

## Root Cause Hypotheses
1. [Hypothesis 1]
2. [Hypothesis 2]
3. [Hypothesis 3]

## Investigation Tools
- Git bisect for regression bugs
- Debug logging
- Unit tests for specific scenarios
- Stack trace analysis

## Cross-System Integration
- Claude-Mem: Investigation notes and findings
- Beads: Link to bug ID: $BUG_ID

## Deliverables
- Root cause identification
- Minimal reproduction case
- Affected components list
- Risk assessment for fix"
```

#### Phase 3: Fix Implementation (Task)

```bash
# Create fix implementation task
BUG_ID="[BUG_ID_FROM_PHASE_1]"

bd create "Fix: [BUG TITLE] - Implementation" \
  -p 3 \
  --type task \
  --notes "Fix implementation for [BUG TITLE]

## Root Cause
[Identified root cause]

## Fix Strategy
- [ ] Approach: [strategy description]
- [ ] Files to modify: [file list]
- [ ] Tests to add: [test list]
- [ ] Breaking changes: [yes/no + description]

## Implementation Tasks
1. [ ] Prepare test case that reproduces bug
2. [ ] Implement fix in [component/file]
3. [ ] Add/update unit tests
4. [ ] Update integration tests (if needed)
5. [ ] Add regression test (if needed)

## Risk Assessment
- Risk level: [high/medium/low]
- Potential side effects: [description]
- Rollback plan: [description]

## Cross-System Integration
- Claude-Mem: Fix implementation notes
- Beads: Link to bug ID: $BUG_ID

## Testing Plan
- Unit tests: [specific tests]
- Integration tests: [specific scenarios]
- Regression tests: [prevent future occurrences]
- Manual testing: [if needed]"
```

#### Phase 4: Verification & Testing (Task)

```bash
# Create verification task
BUG_ID="[BUG_ID_FROM_PHASE_1]"

bd create "Verify: [BUG TITLE] - Comprehensive testing" \
  -p 4 \
  --type task \
  --notes "Verification for [BUG TITLE] fix

## Verification Tasks
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Run regression tests
- [ ] Test edge cases
- [ ] Test with real data (if possible)
- [ ] Verify no new bugs introduced

## Test Scenarios
1. Original bug scenario - MUST PASS
2. Related functionality - MUST NOT BREAK
3. Edge cases related to fix
4. Performance impact (if applicable)
5. Security impact (if applicable)

## Cross-System Integration
- Claude-Mem: Test results and issues
- Beads: Link to bug ID: $BUG_ID

## Acceptance Criteria
- [ ] Original bug is fixed
- [ ] All existing tests pass
- [ ] No regressions introduced
- [ ] Code review completed
- [ ] Documentation updated (if needed)"
```

#### Phase 5: Deployment & Monitoring (Task)

```bash
# Create deployment task
BUG_ID="[BUG_ID_FROM_PHASE_1]"

bd create "Deploy: [BUG TITLE] - Fix deployment" \
  -p 5 \
  --type task \
  --notes "Deployment for [BUG TITLE] fix

## Pre-Deployment Checklist
- [ ] Fix code reviewed
- [ ] All tests passing
- [ ] Changelog updated
- [ ] Release notes prepared
- [ ] Stakeholders notified (if critical)

## Deployment Steps
1. [ ] Create hotfix branch
2. [ ] Tag release version
3. [ ] Deploy to staging
4. [ ] Verify in staging
5. [ ] Deploy to production

## Post-Deployment Monitoring
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Watch for user reports
- [ ] Validate fix effectiveness

## Cross-System Integration
- Entire: Create checkpoint with fix details
- Claude-Mem: Deployment notes and outcomes
- Beads: Link to bug ID: $BUG_ID

## Rollback Plan
If issues occur:
1. [Rollback steps]
2. [Notification steps]
3. [Investigation steps]"
```

---

## Workflow Commands

### Quick Bug Report (Simple Bugs)

```bash
# For simple, obvious bugs, create condensed task
bd create "Bug: [QUICK_BUG_TITLE]" \
  -p 3 \
  --type bug \
  --notes "Quick bug fix needed

## Issue
[Quick description]

## Location
File: [file.py]
Line: [line number]

## Fix
[Description of simple fix]

## Cross-System Integration
- Beads: Quick fix tracking"
```

### Claim Bug Investigation

```bash
# Claim next bug to investigate
NEXT_BUG=$(bd ready --type bug --json | jq -r '.[0].id')
bd update $NEXT_BUG --claim
echo "Investigating bug: $NEXT_BUG"
bd show $NEXT_BUG
```

### Track Fix Progress

```bash
# Update bug with fix progress
BUG_ID="[BUG_ID]"

# Start fixing
bd update $BUG_ID --status in_progress \
  --notes "Fix in progress

Progress:
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests written
- [ ] Testing in progress"

# Mark as tested
bd update $BUG_ID --status testing \
  --notes "Fix implemented, testing in progress

Tests run:
- Unit: [pass/fail]
- Integration: [pass/fail]
- Regression: [pass/fail]"

# Mark as done
bd update $BUG_ID --status done \
  --notes "Bug fix completed

Fix summary:
- Root cause: [description]
- Fix: [description]
- Tests added: [count]
- Regressions: [none/any issues found]

Deployment: [pending/complete]"
```

### Bulk Status Update

```bash
# Update all related bug tasks
PARENT_BUG_ID="[BUG_ID]"

# Mark investigation complete
bd list --bug $PARENT_BUG_ID --status in_progress --json | \
  jq -r '.[].id' | \
  xargs -I {} bd update {} --status done

# Move to next phase
```

---

## Debugging Techniques

### Git Bisect for Regression Bugs

```bash
# When bug is a regression (worked before, broken now)
BUG_ID="[BUG_ID]"

# Start bisect
git bisect start
git bisect bad [CURRENT_COMMIT]  # Bug present here
git bisect good [LAST_GOOD_COMMIT]  # Last working commit

# Beads will track bisect progress
bd update $BUG_ID --notes "Git bisect in progress

Testing commit: \$(git rev-parse HEAD)

Current state: [PASS/FAIL]"
```

### Add Debug Logging

```bash
# Create debug task
BUG_ID="[BUG_ID]"

bd create "Debug: [BUG TITLE] - Add logging" \
  -p 2 \
  --type task \
  --notes "Add debug logging to [BUG TITLE]

## Logging Points
- [File:line] - [what to log]
- [File:line] - [what to log]
- [File:line] - [what to log]

## Log Format
\`\`\`javascript
console.log('[BUG_ID]', { data })
\`\`\`

## Output Analysis
- Run with debug logging
- Capture output to file
- Analyze patterns

## Cross-System Integration
- Claude-Mem: Debug output analysis
- Beads: Link to bug ID: $BUG_ID"
```

### Create Minimal Reproduction

```bash
# Create reproduction case task
BUG_ID="[BUG_ID]"

bd create "Repro: [BUG TITLE] - Minimal reproduction" \
  -p 2 \
  --type task \
  --notes "Create minimal reproduction for [BUG TITLE]

## Reproduction Checklist
- [ ] Identify minimal inputs
- [ ] Simplify environment
- [ ] Isolate component
- [ ] Create test case
- [ ] Verify reproducibility

## Test Case Template
\`\`\`javascript
// Reproduction test case
describe('Bug [ID]', () => {
  it('should reproduce the bug', () => {
    // Setup
    const input = [minimal_input]

    // Action
    const result = function_under_test(input)

    // Assertion - this should fail with bug
    expect(result).toEqual(expected_output)
  })
})
\`\`\`

## Cross-System Integration
- Claude-Mem: Reproduction case details
- Beads: Link to bug ID: $BUG_ID"
```

---

## Cross-System Integration

### Link Bug to Claude-Mem

```bash
BUG_ID="[BUG_ID]"

# Link investigation notes
bd update $BUG_ID --notes "Investigation notes stored in Claude-Mem:

Note ID: [MEM_ID]
- Root cause analysis
- Affected components
- Risk assessment

Link: beads-mem-bridge $BUG_ID --mem [MEM_ID]"
```

### Tag Entire Checkpoint with Bug ID

```bash
BUG_ID="[BUG_ID]"
FIX_VERSION="[VERSION]"

# Create checkpoint before fix
entire checkpoint create "Before fix for bug $BUG_ID" \
  --tags "beads:$BUG_ID,before-fix,bug:$BUG_ID"

# Create checkpoint after fix
entire checkpoint create "After fix for bug $BUG_ID" \
  --tags "beads:$BUG_ID,after-fix,bug:$BUG_ID,version:$FIX_VERSION"
```

### Monitor Bug Fix Impact

```bash
# Check if related bugs exist
BUG_TITLE="[KEYWORD]"

bd list --bug --json | jq -r '.[] | select(.title | contains("$BUG_TITLE")) | .id'
```

---

## Bug Severity Guidelines

### Critical (Priority 1)
- Data loss or corruption
- Security vulnerability
- Production outage
- Complete feature failure

**Response Time:** Immediate (within hours)
**Escalation:** Required to team leads
**Deployment:** Hotfix to production ASAP

### High (Priority 2)
- Major functionality broken
- Performance degradation >50%
- Frequent user impact
- Workarounds exist but painful

**Response Time:** Same day
**Escalation:** Team aware
**Deployment:** Next release or hotfix

### Medium (Priority 3)
- Minor functionality issues
- Workarounds available
- Low user impact
- Affects non-critical paths

**Response Time:** Within week
**Escalation:** Track in backlog
**Deployment:** Next release

### Low (Priority 4)
- UI/UX improvements
- Edge cases
- Nice-to-have fixes
- Future enhancements

**Response Time:** When convenient
**Escalation:** Backlog
**Deployment:** Future releases

---

## Multi-Bug Coordination

### Related Bugs Grouping

```bash
# Group related bugs under a parent
PARENT_BUG="bug-parent-name"

bd create "Bug: [GROUP TITLE]" -p 1 --type epic \
  --notes "Parent bug tracking group of related issues

Related bugs:
- [Bug 1 ID]
- [Bug 2 ID]
- [Bug 3 ID]

Common cause: [description]"
```

### Bulk Bug Updates

```bash
# Update all critical bugs
bd list --bug --json | jq -r '.[] | select(.priority == 1) | .id' | \
  xargs -I {} bd update {} --status in_progress \
    --notes "Critical bug being addressed"

# Close all fixed bugs
bd list --bug --status testing --json | jq -r '.[].id' | \
  xargs -I {} bd update {} --status done \
    --notes "Bug verified and closed"
```

---

## Examples

### Example 1: Simple Bug Fix

```bash
# Bug report
bd create "Bug: Login button not responsive on mobile" \
  -p 3 \
  --type bug \
  --notes "Login button doesn't respond on mobile devices

## Reproduction
1. Open app on mobile
2. Click login button
3. Nothing happens

## Expected
Login modal opens

## Actual
No response

## Environment
- Device: iPhone 12
- Browser: Safari
- App version: 1.2.0

## Fix
Button z-index needs adjustment"
```

### Example 2: Regression Bug with Bisect

```bash
# Bug report
bd create "Bug: User search returns wrong results" \
  -p 2 \
  --type bug \
  --notes "User search broken after recent update

## Regression
Last known good: v2.1.0 (commit abc123)
Broken in: v2.2.0 (commit def456)

## Investigation
Using git bisect to identify commit
bd update $BUG_ID --notes 'Bisect progress: testing commit xyz789'

## Cross-System Integration
- Claude-Mem: Bisect results and offending commit
- Beads: Full regression tracking"
```

### Example 3: Critical Security Bug

```bash
# Bug report
bd create "CRITICAL: SQL injection vulnerability in search" \
  -p 1 \
  --type bug \
  --notes "Security vulnerability requiring immediate fix

## Vulnerability
SQL injection in user search parameter

## Severity
CRITICAL - Allows arbitrary SQL execution

## Impact
- Data breach risk
- Unauthorized access
- System compromise

## Fix Required
1. Sanitize input parameters
2. Use parameterized queries
3. Add security tests
4. Audit similar code

## Timeline
- Response: IMMEDIATE
- Fix: < 24 hours
- Deploy: ASAP

## Escalation
Notify: security-team, tech-lead, cto

## Cross-System Integration
- Entire: Create security checkpoint
- Claude-Mem: Security analysis and fix details"
```

---

## Best Practices

1. **Reproduce bugs locally** before attempting fix
2. **Write failing test** that demonstrates bug before fixing
3. **Fix root cause**, not just symptoms
4. **Add regression tests** to prevent recurrence
5. **Document the bug** in code comments if complex
6. **Update CHANGELOG** with bug fix details
7. **Monitor after deployment** for any issues
8. **Learn from bugs** - update documentation if systemic

---

## Troubleshooting Bug Fixes

### Bug Cannot Be Reproduced

```bash
# Create investigation task
BUG_ID="[BUG_ID]"

bd update $BUG_ID --notes "Cannot reproduce bug locally

Next steps:
- Request more details from reporter
- Ask for screenshots/logs
- Try different environments
- Check for race conditions

Status: Awaiting more information"
```

### Fix Introduces New Bug

```bash
# Rollback and investigate
NEW_BUG_ID="[NEW_BUG_ID]"
ORIGINAL_BUG_ID="[ORIGINAL_BUG_ID]"

bd create "Bug: Regression from fix $ORIGINAL_BUG_ID" \
  -p 1 \
  --type bug \
  --notes "New bug introduced while fixing $ORIGINAL_BUG_ID

## Related Bugs
Original: $ORIGINAL_BUG_ID
New: $NEW_BUG_ID

## Action
Rollback original fix
Investigate both bugs together
Consider different fix approach"
```

### Tests Don't Cover Bug Scenario

```bash
# Create test writing task
BUG_ID="[BUG_ID]"

bd create "Test: Write tests for $BUG_ID" \
  -p 2 \
  --type task \
  --notes "Create comprehensive tests for bug scenario

## Test Scenarios
- [Original bug case]
- [Related edge cases]
- [Potential regressions]

## Test Types
- Unit tests
- Integration tests
- E2E tests (if UI bug)

## Cross-System Integration
- Claude-Mem: Test strategies
- Beads: Link to bug ID: $BUG_ID"
```

---

**Template Version:** 1.0
**Last Updated:** 2026-02-17
**Related Docs:**
- Beads Integration Plan
- Beads Quick Reference
- Cross-System Integration Workflows
- Feature Development Formula Template
