# OpenCode Integration Implementation Plan (FINAL)

> **Project**: Add OpenCode support to Agentic Kanban Board
> **Status**: 🟡 Planning
> **Start Date**: TBD
> **Target Date**: TBD (2-3 weeks)
> **Primary Contact**: TBD

---

## Quick Reference

| Metric | Value |
|--------|-------|
| **Total Estimated Time** | 2-3 weeks (1-2 developers) |
| **Total Hours Estimated** | 150-180 hours |
| **Critical Path** | Phase 1 → Phase 2.1 → 2.2 (CLI mode) → Phase 3 Frontend (tool selector + agent paths) |
| **Parallel Work Available** | Phase 2.2, 2.3, 2.4, 2.5 can all run parallel after 2.1 |
| **Risk Level** | Medium |

---

## Progress Summary

### Overall Progress: 0%

| Phase | Status | Progress | Assigned To | Start Date | End Date |
|-------|--------|----------|--------------|------------|-----------|
| Phase 1: Foundation & Database Migration | ⬜ Not Started | 0% | TBD | TBD |
| Phase 2: Backend Provider Implementation (CLI Mode Only) | ⬜ Not Started | 0% | TBD | TBD |
| Phase 3: Frontend UI Updates | ⬜ Not Started | 0% | TBD | TBD |
| Phase 4: Integration & Testing | ⬜ Not Started | 0% | TBD | TBD |
| Phase 5: Documentation & Polish | ⬜ Not Started | 0% | TBD | TBD |

### Task Completion

- [ ] Phase 1: Foundation (3 tasks)
- [ ] Phase 2: Backend - CLI Mode (3 tasks)
- [ ] Phase 3: Frontend (3 tasks)
- [ ] Phase 4: Integration (2 tasks)
- [ ] Phase 5: Documentation (2 tasks)

---

## Phase 1: Foundation & Database Migration (Week 1, Days 1-2)

**Status**: ⬜ Not Started
**Blocking**: YES - Must complete before any other phase
**Estimated Time**: 9 hours

### 1.1 Database Schema Migration

**Estimated Time**: 4-6 hours | **Priority**: P0 (Critical)

- [ ] Review migration `001_add_provider_support.ts` and verify SQL statements
- [ ] Create backup of existing database (`backend/data/claude-sessions.db`)
- [ ] Apply migration to add `tool_type` column with DEFAULT 'claude'
- [ ] Rename `claude_session_id` → `tool_session_id`
- [ ] Update all database queries referencing `claude_session_id`
- [ ] Backfill existing sessions with `tool_type = 'claude'`
- [ ] Test migration rollback procedure
- [ ] Verify data integrity after migration

**Files to modify:**
- `backend/src/repositories/SessionRepository.ts`
- `backend/src/database/database.ts`
- `backend/src/types/session.types.ts`

**Notes:**
> Be extremely careful with this migration. Create multiple backups before running.

### 1.2 Environment Configuration

**Estimated Time**: 2-3 hours | **Priority**: P0 (Critical)

- [ ] Add `OPENCODE_EXECUTABLE` to `.env.example` (default: `opencode`)
- [ ] Add `OPENCODE_CONFIG_DIR` to `.env.example` (default: `~/.config/opencode/`)
- [ ] Add `OPENCODE_CONFIG` to `.env.example` (path to `opencode.json`)
- [ ] Add `OPENCODE_MODEL` to `.env.example` (default model)
- [ ] Update `backend/src/config/env.config.ts` to parse OpenCode env vars
- [ ] Create config validation for OpenCode executable path
- [ ] Add provider selection logic to `ProviderConfigManager`

**Files to modify:**
- `backend/.env.example`
- `frontend/.env.example`
- `backend/src/config/env.config.ts`
- `backend/src/config/ProviderConfigManager.ts`

**Notes:**
> **CRITICAL: OpenCode is a LOCAL CLI tool, NOT an external API service**
> It uses provider/model format (e.g., `anthropic/claude-sonnet-4-20250514`)
> Configuration stored in `opencode.json` and `~/.config/opencode/`
> See: https://opencode.ai/docs/cli/#environment-variables

### 1.3 Provider Registration Setup

**Estimated Time**: 1-2 hours | **Priority**: P1 (High)

- [ ] Update `backend/src/providers/index.ts` to register OpenCode provider
- [ ] Add placeholder `OpenCodeProvider` export
- [ ] Update `ProviderFactory.register()` calls in app startup
- [ ] Add provider availability check at startup

**Files to modify:**
- `backend/src/providers/index.ts`
- `backend/src/app.ts`

**Notes:**
> This is just scaffolding - actual implementation comes in Phase 2.

---

## Phase 2: Backend Provider Implementation (Week 1-2)

**Status**: ⬜ Not Started
**Dependencies**: Phase 1 complete
**Estimated Time**: 36-50 hours

### 2.1 OpenCodeProvider Core (CLI Mode Only)

**Estimated Time**: 16-20 hours | **Priority**: P0 (Critical)
**Dependencies**: Phase 1 complete

**CRITICAL DECISION: CLI Spawn Mode (Like Claude Code)**

**Approach: Use OpenCode's native CLI (not HTTP server)**

**Implementation:**
```typescript
// Spawn: opencode --format json --dir <workingDir>
const process = spawn('opencode', ['--format', 'json', '--dir', options.workingDirectory]);
process.stdout.on('data', (chunk) => {
  // Parse JSONL events
});

// Track session IDs from JSONL output or API response
const sessions = new Map<string, ChildProcess>();
```

**Key Design Decisions:**
- ✅ Each session spawns its own process (like Claude Code)
- ✅ Sessions stored in OpenCode's local database (`~/.local/share/opencode/storage/`)
- ✅ Track session IDs from output (CLI: `sessionID` field)
- ✅ Use `opencode --continue` for resume
- ✅ No external API keys needed
- ✅ Simpler than server mode
- ✅ Is local: true (CLI tool, not remote API)

**Capabilities:**
```typescript
capabilities: {
  supportsAgents: true,
  supportsResume: true,
  supportsContinue: true,
  realTimeStreaming: true,
  supportedTools: ['file:read', 'file:write', 'edit', 'bash', 'grep', 'glob'],
  maxContextTokens: 200000,
  requiresNetwork: true,
  isLocal: true  // CLI tool, not remote API
}
```

**Tasks:**
- [ ] Create `backend/src/providers/OpenCodeProvider.ts`
- [ ] Implement `IToolProvider` interface
- [ ] Define OpenCode capabilities (see above)
- [ ] Implement `initialize(config)` - store executable path and model config
- [ ] Implement `createSession(options)` - spawn `opencode --format json --dir <path>`
- [ ] Track process PID and handle output parsing
- [ ] Add error handling for process failures
- [ ] Parse JSONL output and emit StreamEvent objects

**OpenCode CLI Commands:**
```
# Create new session (starts TUI)
opencode /path/to/project

# Create with prompt (headless)
opencode run "Your prompt here"

# Continue last session
opencode --continue  # or -c

# Resume specific session
opencode --session <session-id>  # or -s <session-id>

# Continue with input
echo "Your input" | opencode --session <session-id>

# Get JSONL streaming output
opencode --format json /path/to/project

# Use specific agent
opencode --agent <name>

# Use specific model
opencode --model <provider/model>
```

**Notes:**
> Use `--format json` flag when spawning opencode
> Compatible with our StreamEvent interface after parsing
> See: https://opencode.ai/docs/cli

### 2.2 Session Management (CLI Mode Only)

**Estimated Time**: 12-16 hours | **Priority**: P0 (Critical)
**Dependencies**: 2.1 complete

**Tasks:**
- [ ] Implement `createSession(options)` - spawn `opencode --format json --dir <path>`
- [ ] Implement `resumeSession(context)` - use `--continue` or `--session <id>` flag
- [ ] Implement `continueSession(sessionId, input)` - write to stdin
- [ ] Implement `sendInput(sessionId, input)` - Write to stdin
- [ ] Implement `interrupt(sessionId)` - Send SIGINT (Ctrl+C equivalent)
- [ ] Implement `closeSession(sessionId)` - Kill process, cleanup
- [ ] Implement `getSessionStatus(sessionId)` - Check if process is alive
- [ ] Implement `getSessionMetrics(sessionId)` - Return null (no metrics in CLI mode)
- [ ] Add process lifecycle management (spawn, stop, cleanup)

**Notes:**
> CLI Mode: Each session spawns its own process, similar to Claude Code
> Session ID format: `ses_` + 22 alphanumeric characters (same as Claude)
> Input: Write to stdin (no IPC in CLI mode)
> Interrupt: SIGINT (Ctrl+C equivalent)
> See: https://opencode.ai/docs/cli

### 2.3 Stream Processing (CAN PARALLEL with 2.2)

**Estimated Time**: 10-14 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

- [ ] Create `backend/src/parsers/OpenCodeStreamParser.ts`
- [ ] Implement OpenCode-specific JSONL event format parsing
- [ ] Convert OpenCode events to standardized `StreamEvent` format
- [ ] Handle OpenCode tool call events
- [ ] Parse thinking/reasoning events if available
- [ ] Implement buffer management for incomplete JSON lines
- [ ] Add error recovery for malformed events

**OpenCode JSONL Format:**
```json
{"type":"step_start","timestamp":1767036059338,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK"}
{"type":"text","timestamp":1767036064268,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","content":"AI response here"}
{"type":"tool_use","timestamp":1767036065423,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","part":{...}}
{"type":"step_finish","timestamp":1767036078123,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","part":{...}}
{"type":"error","timestamp":1767036082345,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","error":{...}}
```

**Event Types:**
- `step_start` - Processing step beginning
- `text` - Model output
- `tool_use` - Tool invocation (has `part` field with tool details)
- `step_finish` - Processing step end
- `error` - Error event

**Notes:**
> Need OpenCode's streaming response format documentation.

### 2.4 Agent Loading (SEQUENTIAL - Depends on 2.1)

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

- [ ] Implement `loadAgents(agentsPath: string)` method
- [ ] Read OpenCode skills from `~/.config/opencode/agents/` (built-in and custom SKILL.md files)
- [ ] Parse skill files (`.md` or OpenCode-specific format)
- [ ] Return standardized `Agent[]` array
- [ ] Add skill metadata extraction (name, description, system prompt)
- [ ] Handle built-in agents (Build, Plan, General, Explore) separately from custom agents
- [ ] Handle skill directory not found gracefully

**OpenCode Skills Directory:** `~/.config/opencode/agents/` (verified)

**Built-in Agents:**
- **Primary**: Build (full access), Plan (restricted - asks for edits/bash)
- **Subagents**: General (full access), Explore (read-only)

**Skill File Format (SKILL.md):**
```markdown
---
name: my-skill
description: A brief description
mode: primary  # or subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: true
  edit: true
  bash: true
permission:
  edit: allow  # allow, ask, deny
  bash: allow
---

# Skill Content

Instructions for AI agent...
```

**Notes:**
> No oh-my-opencode integration needed for this phase
> Use OpenCode's native `--agent` flag for custom agents

### 2.5 Session Operations (CLI Mode Only)

**Estimated Time**: 6-10 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

**CLI Mode Tasks:**
- [ ] Implement `sendInput(sessionId, input)` - Write to stdin
- [ ] Implement `interrupt(sessionId)` - Send SIGINT (Ctrl+C equivalent)
- [ ] Implement `closeSession(sessionId)` - Kill process, cleanup resources
- [ ] Implement `getSessionStatus(sessionId)` - Check if process is alive
- [ ] Implement `getSessionMetrics(sessionId)` - Return null (no metrics in CLI mode)
- [ ] Add process lifecycle tracking (spawn, stop, cleanup)

**Notes:**
> CLI Mode: Each session spawns its own process, similar to Claude Code
> Server mode NOT needed for this implementation
> Session ID format: `ses_` + 22 alphanumeric characters (same as Claude)
> Input to running session: Write to stdin (no IPC in CLI mode)
> Interrupt: SIGINT (Ctrl+C equivalent)
> See: https://opencode.ai/docs/cli

---

## Phase 3: Frontend UI Updates (Week 1-2)

**Status**: ⬜ Not Started
**Dependencies**: Phase 2 complete
**Estimated Time**: 26-32 hours

### 3.1 Tool Selection UI

**Estimated Time**: 8-10 hours | **Priority**: P0 (Critical)

- [ ] Add tool type dropdown to "Create Session" modal
- [ ] Options: "Claude Code", "OpenCode" (others disabled initially)
- [ ] Show tool-specific config fields
- [ ] Update i18n locale files
  - `en/common.json`
  - `es/common.json`
  - `zh-CN/common.json`
  - `zh-TW/common.json`
  - `ja/common.json`
  - `pt/common.json`

### 3.2 Agent Path Configuration

**Estimated Time**: 4-6 hours | **Priority**: P1 (High)

- [ ] Claude: `~/.claude/agents/`
- [ ] OpenCode: `~/.config/opencode/agents/` ✅ CORRECT PATH
- [ ] Update AgentPromptsPage to use correct paths
- [ ] Remove other tools (not in scope for this phase)

**Files to modify:**
- `frontend/src/pages/AgentPromptsPage.tsx`
- `frontend/src/types/config.types.ts`

### 3.3 Session List Badges

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)

- [ ] Add tool type badge to session cards
- [ ] Color coding: Claude (green), OpenCode (blue)
- [ ] Show tool icon
- [ ] Filter sessions by tool type
- [ ] Update session detail header

### 3.4 Tool-Specific Settings

**Estimated Time**: 10-12 hours | **Priority**: P1 (High)

- [ ] Add OpenCode configuration section
- [ ] Executable path input
- [ ] Model selection (provider/model format)
- [ ] No API keys needed
- [ ] Test connection button

**Files to modify:**
- `frontend/src/pages/Settings.tsx`
- `frontend/src/services/api.ts`

### 3.5 Message Type Handling

**Estimated Time**: 6-8 hours | **Priority**: P2 (Medium)

- [ ] Update MessageFilter for OpenCode events
- [ ] Ensure tool calls render correctly
- [ ] Add OpenCode-specific icon
- [ ] Test message rendering

**Files to modify:**
- `frontend/src/components/Session/MessageFilter.tsx`
- `frontend/src/components/Session/MessageItem.tsx`

---

## Phase 4: Integration & Testing (Week 2-3)

**Status**: ⬜ Not Started
**Dependencies**: Phase 2 & 3 complete
**Estimated Time**: 72-96 hours

### 4.1 Backend Integration

**Estimated Time**: 16-20 hours | **Priority**: P0 (Critical)

- [ ] Register `OpenCodeProvider` in `ProviderFactory`
- [ ] Update `SessionService` to route requests to provider
- [ ] Replace hardcoded Claude CLI calls in `ProcessManager`
- [ ] Add provider switching logic for session creation
- [ ] Test session creation with both tools

### 4.2 Frontend Integration

**Estimated Time**: 12-16 hours | **Priority**: P0 (Critical)

- [ ] Connect tool selection dropdown to backend API
- [ ] Pass `tool_type` in session creation requests
- [ ] Update WebSocket message handling for OpenCode events
- [ ] Test real-time streaming
- [ ] Test tool call visualization

### 4.3 End-to-End Testing

**Estimated Time**: 16-20 hours | **Priority**: P0 (Critical)

- [ ] Test complete flow: Create OpenCode session → Send message → Receive response
- [ ] Test OpenCode agent loading
- [ ] Test workflow stages with OpenCode agents
- [ ] Test session resume/continue
- [ ] Test multi-session (Claude + OpenCode)
- [ ] Cross-browser testing

### 4.4 Backend Unit Tests

**Estimated Time**: 20-24 hours | **Priority**: P1 (High)

- [ ] Write `OpenCodeProvider` unit tests
- [ ] Write `OpenCodeStreamParser` unit tests
- [ ] Mock OpenCode CLI output
- [ ] Achieve 80%+ coverage

### 4.5 Frontend Unit Tests

**Estimated Time**: 12-16 hours | **Priority**: P1 (High)

- [ ] Write tests for tool selection
- [ ] Write tests for session rendering
- [ ] Write tests for settings page
- [ ] Mock backend API responses

---

## Phase 5: Documentation & Polish (Week 3)

**Status**: ⬜ Not Started
**Dependencies**: Phase 4 in progress
**Estimated Time**: 24-32 hours

### 5.1 Documentation

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)

- [ ] Update README.md with OpenCode support
- [ ] Add OpenCode installation section
- [ ] Create "Multi-Tool Usage" guide
- [ ] Update wiki pages
- [ ] Update troubleshooting

### 5.2 Migration Script

**Estimated Time**: 8-12 hours | **Priority**: P0 (Critical)

- [ ] Create automated migration script
- [ ] Handle edge cases
- [ ] Add rollback capability
- [ ] Test migration

### 5.3 Polish & Bug Fixes

**Estimated Time**: 12-16 hours | **Priority**: P2 (Medium)

- [ ] Fix UI/UX issues
- [ ] Performance optimization
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Accessibility improvements

---

## Critical Questions for Review

### Architecture (Phase 2.1)

**Q1: CLI Mode vs Server Mode?**
- CLI Mode: Simpler, matches Claude Code approach, each session = separate process
- Server Mode: More complex, requires `opencode serve` running, shares sessions
- **Recommendation**: Start with CLI Mode
- **Your Decision:** APPROVED - CLI Spawn Mode is the recommended approach

**Q2: Multi-tool session sharing?**
- CLI Mode: Each tool spawns separate processes, no sharing
- Server Mode: Single server instance, can share sessions across tools
- **Answer:** YES - But for our use case (sessions tool-isolated, separate databases), CLI Mode is sufficient
- **Architecture:** Database-level `tool_type` column enables unified session storage
- **Note:** Cross-tool session continuation is NOT supported (different execution backends)

**Q3: How to handle OpenCode's built-in agents?**
- OpenCode has: Build, Plan, General, Explore
- Custom SKILL.md agents are separate
- Should we expose built-in agents in UI?
- **Answer:** NO - Use OpenCode's native Tab switching (or just rely on automatic agent invocation)
- Should they be auto-invoked by model?
- **Answer:** Let model decide based on task (OpenCode does this intelligently)

### Configuration (Phase 1)

**Q6: OpenCode executable path?**
- Default: `opencode` (if in PATH)
- **Answer:** Allow custom path

**Q7: Model selection in UI?**
- OpenCode uses `provider/model` format
- **Answer:** Yes - Should settings expose model dropdown

---

## Change Log

| Date | Phase | Change | Author |
|-------|--------|----------|--------|
| 2025-02-14 | Initial | Created initial plan | Sisyphus |
| 2025-02-14 | Final | Cleaned up implementation plan | Sisyphus |

**Last Updated**: 2025-02-14

---

**Document Version**: 2.0