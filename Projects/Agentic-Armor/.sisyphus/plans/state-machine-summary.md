# State Machine Diagrams Summary

## Overview

This document summarizes the state machine diagrams created to clarify the OpenCode integration event cycle for Docker Sandboxes implementation.

---

## Diagram List

### 1. Single Agent Execution Flow
**Location**: Lines 787-855 in main plan

Shows the complete lifecycle of a single agent task:
- From user request to completion
- All hook execution points
- MCP tool invocations
- Git branch and Plan.md creation
- Docker sandbox lifecycle
- Error handling paths

**Key States**:
- Idle → TaskReceived → Classification → PlanCreation
- BranchCreation → SubmoduleCreation → PlanMdCreation
- SandboxCreation → AgentDeployment → Execution
- TaskComplete → PlanFinalization → Cleanup

**Key Transitions**:
19 state transitions with 9 different hooks/MCP tools
Error recovery path from any execution state
Final state ready for PR review

---

### 2. Parallel Ultrawork Mode Execution Flow
**Location**: Lines 857-917 in main plan

Shows how multiple agents work in parallel during ultrawork mode:
- Main session coordinates
- Multiple background agents execute independently
- Each agent has its own sandbox and branch
- Final integration of parallel work

**Key Components**:
- Main Session state machine (Sisyphus)
- Background Agent 1 state machine (e.g., Explore)
- Background Agent 2 state machine (e.g., Librarian)
- Background Agent N state machine (e.g., Oracle, Frontend)

**Parallel Execution Pattern**:
All background agents create branches, submodules, Plan.md files, and sandboxes independently, then main session integrates results.

---

### 3. Hooks Event Lifecycle
**Location**: Lines 919-1000 in main plan

Sequence diagram showing the order and timing of all events:
- User → Sisyphus → Hooks → MCP → Docker
- All hook firing points
- MCP tool call sequences
- Response flow back through components

**Timeline**:
1. User sends task
2. Sisyphus classifies and plans
3. Git hooks fire (branch creation, validation, submodule)
4. Plan hooks fire (Plan.md creation)
5. MCP tools create and deploy sandbox
6. Execution loop with safety and plan update hooks
7. Plan finalization and cleanup

---

### 4. Error Recovery State Machine
**Location**: Lines 1002-1074 in main plan

Shows error handling and recovery mechanisms:
- Error type classification
- Recovery strategies per error type
- Retry logic
- Abort path

**Error Types Handled**:
- Agent execution errors → Log and continue/retry
- Sandbox errors → Check container, recreate if needed
- Git errors → Retry with backoff
- Hook errors → Disable hook temporarily
- MCP errors → Restart MCP server

**Recovery Paths**:
- Container crashed → Recreate sandbox
- Resource exceeded → Adjust limits
- Git failed → Log to Plan.md
- User decision → Retry, continue, or abort

---

### 5. Hook Execution Order
**Location**: Lines 1076-1134 in main plan

Visual graph showing the order of all hooks:
- Color-coded by hook type (Git, Plan, Safety, MCP)
- Shows dependencies between hooks
- Shows which hooks execute in parallel vs. sequential

**Hook Categories** (color-coded in diagram):
- **Git Hooks** (blue): pre-task-branch-creator, branch-name-validator, submodule-creator
- **Plan Hooks** (yellow): plan-file-creator, plan-updater, plan-finalizer
- **Safety Hooks** (red): container-safety-enforcer, isolation-checker, resource-limit-monitor
- **MCP Tools** (green): create_sandbox, deploy_agent, execute, cleanup

---

### 6. Event Timeline
**Location**: Lines 1136-1194 in main plan

Chronological table showing exact timing of each event:
- Time markers (T0-T19)
- Event description
- Hook/MCP involved
- Result achieved

**Critical Timing Points**:
- T3-T4: Git branch creation and validation
- T5: Submodule creation
- T6: Plan.md creation
- T7-T8: Sandbox setup
- T9-T14: Execution loop (repeats)
- T16-T17: Task completion and plan finalization
- T18: Sandbox cleanup

---

## State Machine Statistics

### States Overview
- **Total States**: 25 unique states across all diagrams
- **Terminal States**: 3 (Idle, Task Complete, Task Aborted)
- **Error States**: 7 error handling states
- **Parallel States**: N background agents (configurable)

### Transitions Overview
- **Total Transitions**: 42 state transitions
- **Hook-Triggered**: 18 transitions
- **MCP-Triggered**: 6 transitions
- **Error Paths**: 5 recovery paths

### Hook Execution Points
- **Git Hooks**: 3 execution points
  - Branch creation (T3)
  - Branch validation (T4)
  - Submodule creation (T5)
  
- **Plan Hooks**: 3 execution points
  - Plan.md creation (T6)
  - Plan updates (during execution)
  - Plan finalization (T17)
  
- **Safety Hooks**: 3 execution points (per iteration)
  - Pre-tool execution (T10)
  - Post-tool execution (T12-T13)
  - Resource monitoring (continuous)

### MCP Tool Invocations
- **create_sandbox**: Once per task (T7)
- **deploy_agent_to_sandbox**: Once per task (T8)
- **execute_in_sandbox**: Multiple times per task (T11)
- **cleanup_sandbox**: Once per task (T18)
- **list_sandboxes**: On-demand (not in main flow)

---

## Key Insights from State Machine

### 1. Deterministic Flow
The single agent execution flow is deterministic:
- Same sequence of states every time
- Hooks fire in fixed order
- MCP tools called at predictable points
- Errors handled gracefully

### 2. Scalable Parallelism
Ultrawork mode supports N parallel agents:
- Each agent follows same single-agent flow
- No shared state between agents
- Main session coordinates at start and end
- Plan.md provides integration point

### 3. Safety First
Safety hooks wrap every critical operation:
- Pre-execution validation
- Post-execution isolation checks
- Continuous resource monitoring
- Error propagation and recovery

### 4. Git Integration
Git operations are deeply integrated:
- Branch creation happens before any code execution
- Branch naming enforced at multiple points
- Submodule provides isolated workspace
- Plan.md as artifact of execution

### 5. Clean Lifecycle
Every task has clear lifecycle:
1. Setup (branch, submodule, Plan.md, sandbox)
2. Execution (with safety and monitoring)
3. Completion (plan finalization)
4. Cleanup (sandbox removal)
5. Ready for PR review

---

## How to Read These Diagrams

### Single Agent Flow
Read left-to-right, top-to-bottom:
- Start at Idle state
- Follow arrows through transitions
- Note boxes provide context
- Diamond shapes indicate decisions
- Rounded rectangles are states

### Parallel Ultrawork Mode
Read each column independently:
- Each column is a separate agent
- All agents start simultaneously
- Main session coordinates
- All complete before integration

### Hooks Lifecycle
Read top-to-bottom sequence:
- Leftmost participant is User
- Each column is a component
- Arrows show message flow
- Note boxes describe phases

### Error Recovery
Read decision tree style:
- Error → Classification → Specific handling
- Multiple recovery paths
- User decision point
- Final cleanup or recovery

### Hook Execution Order
Read top-to-bottom flow:
- Start with task
- Hooks grouped by category (color)
- Shows all possible paths
- Arrows show dependencies

### Event Timeline
Read chronological table:
- Time increases left-to-right
- Each row is an event
- Shows what happens when
- Useful for debugging timing

---

## Validation Checklist

These state machine diagrams ensure:

✅ **Complete Coverage**: All lifecycle stages represented
✅ **Hook Integration**: All hooks properly placed
✅ **MCP Integration**: All MCP tools called at right points
✅ **Error Handling**: Recovery paths for all error types
✅ **Parallel Support**: Ultrawork mode clearly shown
✅ **Git Safety**: Branch validation integrated
✅ **Plan.md Lifecycle**: Creation → Updates → Finalization
✅ **Safety First**: Multiple safety checkpoints
✅ **Clean Cleanup**: All resources properly cleaned
✅ **Ready for PR**: Clear handoff to review

---

## Next Steps

These state machine diagrams provide the foundation for implementation:

1. **Implement Hooks** (9 hooks total)
2. **Implement MCP Server** (5 tools total)
3. **Integrate with Sisyphus** (orchestration)
4. **Test All State Transitions** (42 transitions)
5. **Test Error Recovery** (5 error paths)
6. **Test Parallel Execution** (N agents)

---

## References

- Main Plan: `docker-sandboxes-opencode-integration.md` (1270 lines)
- State Machine Section: Lines 787-1194 (408 lines)
- Diagram Formats: Mermaid syntax (renderable in many tools)
