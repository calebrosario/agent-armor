# OpenCode + oh-my-opencode Integration Implementation Plan

> **Project**: Integrate OpenCode + oh-my-opencode as unified provider for Agentic Kanban Board
> **Status**: 🟡 Planning
> **Start Date**: TBD
> **Target Date**: TBD (2-3 weeks)
> **Primary Contact**: TBD

---

## Quick Reference

| Metric | Value |
|--------|-------|
| **Total Estimated Time** | 2-3 weeks (1-2 developers) |
| **Total Hours Estimated** | 155-190 hours (reduced - OpenCode/oh-my-opencode pre-installed) |
| **Critical Path** | Phase 1 → Phase 2.1 → 2.2 (CLI mode) → Phase 3 Frontend |
| **Parallel Work Available** | Phase 2.2, 2.3, 2.4, 2.5 can run parallel after 2.1 |
| **Risk Level** | Medium |
| **Integration Scope** | OpenCode + oh-my-opencode as ONE unified system |

---

## Progress Summary

### Overall Progress: 0%

| Phase | Status | Progress | Assigned To | Start Date | End Date |
|-------|--------|----------|--------------|------------|-----------|
| Phase 1: Foundation & Verification | ⬜ Not Started | 0% | TBD | TBD |
| Phase 2: Backend Provider Implementation | ⬜ Not Started | 0% | TBD | TBD |
| Phase 3: Frontend UI Updates | ⬜ Not Started | 0% | TBD | TBD |
| Phase 4: Integration & Testing | ⬜ Not Started | 0% | TBD | TBD |
| Phase 5: Documentation & Polish | ⬜ Not Started | 0% | TBD | TBD |

### Task Completion

- [ ] Phase 1: Foundation (0/3 tasks)
- [ ] Phase 2: Backend - OpenCode+oh-my-opencode (0/5 tasks)
- [ ] Phase 3: Frontend (0/4 tasks)
- [ ] Phase 4: Integration (0/3 tasks)
- [ ] Phase 5: Documentation (0/2 tasks)

---

## Phase 1: Foundation & Verification (Week 1, Days 1-2)

**Status**: ⬜ Not Started
**Blocking**: YES - Must complete before any other phase
**Estimated Time**: 11-14 hours (reduced - installation already done)

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

**Estimated Time**: 3-4 hours | **Priority**: P0 (Critical)

**CRITICAL: OpenCode + oh-my-opencode Configuration**

- [ ] Add `OPENCODE_EXECUTABLE` to `.env.example` (default: `opencode`)
- [ ] Add `OPENCODE_CONFIG_DIR` to `.env.example` (default: `~/.config/opencode/`)
- [ ] Add `OPENCODE_CONFIG` to `.env.example` (path to `opencode.json`)
- [ ] Add `OPENCODE_MODEL` to `.env.example` (default model)
- [ ] Add `OH_MY_OPENCODE_ENABLED` to `.env.example` (default: `true`)
- [ ] Add `OH_MY_OPENCODE_CONFIG_DIR` to `.env.example` (default: `~/.config/opencode/`)
- [ ] Update `backend/src/config/env.config.ts` to parse OpenCode & oh-my-opencode env vars
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
> oh-my-opencode config: `~/.config/opencode/oh-my-opencode.json`

### 1.3 Verify oh-my-opencode Installation

**Estimated Time**: 0.5-1 hour | **Priority**: P0 (Critical)

**NOTE: OpenCode and oh-my-opencode ALREADY INSTALLED**

- [x] ✅ OpenCode installed - verify version (`opencode --version`)
- [x] ✅ oh-my-opencode installed - verify plugin is loaded
- [ ] Verify OpenCode version >= 1.1.37 (for native AGENTS.md injection)
- [ ] Verify oh-my-opencode configuration exists: `~/.config/opencode/oh-my-opencode.json`
- [ ] Verify OpenCode agents directory exists: `~/.config/opencode/agents/`
- [ ] Test oh-my-opencode agents are available: `opencode --help` or test session
- [ ] Document installed oh-my-opencode version in project README

**Files to check:**
- `~/.config/opencode/oh-my-opencode.json`
- `~/.config/opencode/agents/`
- `~/.local/share/opencode/storage/`

**Notes:**
> **OpenCode and oh-my-opencode are pre-installed on system**
> No installation needed - just verify everything works
> oh-my-opencode is loaded as a PLUGIN to OpenCode automatically
> See: https://github.com/code-yeongyu/oh-my-opencode

### 1.4 Provider Registration Setup

**Estimated Time**: 2-3 hours | **Priority**: P1 (High)

- [ ] Update `backend/src/providers/index.ts` to register OpenCode provider
- [ ] Add placeholder `OpenCodeProvider` export
- [ ] Update `ProviderFactory.register()` calls in app startup
- [ ] Add provider availability check at startup (verify OpenCode executable exists)

**Files to modify:**
- `backend/src/providers/index.ts`
- `backend/src/app.ts`

**Notes:**
> This is just scaffolding - actual implementation comes in Phase 2.

---

## Phase 2: Backend Provider Implementation (Week 1-2)

**Status**: ⬜ Not Started
**Dependencies**: Phase 1 complete
**Estimated Time**: 48-64 hours

### 2.1 OpenCodeProvider Core (CLI Mode + oh-my-opencode Integration)

**Estimated Time**: 16-20 hours | **Priority**: P0 (Critical)
**Dependencies**: Phase 1 complete

**CRITICAL DECISION: CLI Spawn Mode (Like Claude Code)**

**Approach: Use OpenCode's native CLI with oh-my-opencode plugin**

**Implementation:**
```typescript
// Spawn: opencode --format json --dir <workingDir>
const process = spawn('opencode', ['--format', 'json', '--dir', options.workingDirectory]);
process.stdout.on('data', (chunk) => {
  // Parse JSONL events (oh-my-opencode adds agent orchestration events)
});
```

**Key Design Decisions:**
- ✅ Each session spawns its own process (like Claude Code)
- ✅ Sessions stored in OpenCode's local database (`~/.local/share/opencode/storage/`)
- ✅ Track session IDs from output (CLI: `sessionID` field, format: `ses_` + 22 chars)
- ✅ Use `opencode --continue` for resume
- ✅ No external API keys needed
- ✅ oh-my-opencode provides agent orchestration (Sisyphus calls Prometheus, Oracle, etc.)
- ✅ isLocal: true (CLI tool, not remote API)

**Capabilities (with oh-my-opencode):**
```typescript
capabilities: {
  supportsAgents: true,  // oh-my-opencode provides 11 specialized agents
  supportsResume: true,
  supportsContinue: true,
  realTimeStreaming: true,
  supportedTools: [
    // File operations
    'file:read', 'file:write', 'edit', 'multiedit',
    // Search
    'grep', 'glob', 'ast-grep-search', 'ast-grep-replace',
    // Bash
    'bash',
    // LSP/AST tools (oh-my-opencode additions)
    'lsp-goto-definition', 'lsp-find-references', 'lsp-symbols',
    'ast-grep-search', 'ast-grep-replace',
    // MCP tools
    'websearch', 'context7', 'grep-app',
    // Task management
    'todowrite', 'todoread'
  ],
  maxContextTokens: 200000,
  requiresNetwork: true,
  isLocal: true  // CLI tool, not remote API
}
```

**oh-my-opencode Agents Available:**
- **Sisyphus** - Main orchestrator (default)
- **Prometheus** - Strategic planning agent
- **Oracle** - Debugging/architecture consultation
- **Librarian** - Codebase research/docs search
- **Explore** - Fast codebase grep
- **Metis** - Pre-planning analysis
- **Momus** - Plan validation
- **Hephaestus** - Autonomous deep worker
- **Multimodal Looker** - PDF/image analysis
- **Comment Checker** - Code quality
- **Sisyphus-Junior** - Category-spawned executor

**Tasks:**
- [ ] Create `backend/src/providers/OpenCodeProvider.ts`
- [ ] Implement `IToolProvider` interface
- [ ] Define OpenCode capabilities (see above)
- [ ] Implement `initialize(config)` - store executable path, model config, oh-my-openable enabled
- [ ] Implement `createSession(options)` - spawn `opencode --format json --dir <path>`
- [ ] Track process PID and handle output parsing
- [ ] Add error handling for process failures
- [ ] Parse JSONL output and emit StreamEvent objects
- [ ] Handle oh-my-opencode agent events (agent delegation, background tasks)

**OpenCode CLI Commands (with oh-my-opencode):**
```bash
# Create new session (starts TUI with oh-my-opencode agents)
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

# Use specific agent (oh-my-opencode agents)
opencode --agent sisyphus
opencode --agent prometheus
opencode --agent oracle

# Use specific model
opencode --model <provider/model>
```

**oh-my-opencode Background Agent System:**
- oh-my-opencode can spawn multiple background agents in parallel
- Agents communicate via task() system (like our background tasks)
- Sisyphus orchestrates: fires explore + librarian in parallel, collects results
- Need to handle background agent completion events from JSONL stream

**Notes:**
> Use `--format json` flag when spawning opencode
> oh-my-opencode adds agent orchestration events to JSONL output
> Compatible with our StreamEvent interface after parsing
> See: https://opencode.ai/docs/cli and https://github.com/code-yeongyu/oh-my-opencode

### 2.2 Session Management (CLI Mode)

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
- [ ] Handle oh-my-opencode agent delegation events
- [ ] Track background agent tasks spawned by oh-my-opencode

**Notes:**
> CLI Mode: Each session spawns its own process, similar to Claude Code
> Session ID format: `ses_` + 22 alphanumeric characters (same as Claude)
> Input: Write to stdin (no IPC in CLI mode)
> Interrupt: SIGINT (Ctrl+C equivalent)
> oh-my-opencode may spawn background agents - track via JSONL events
> See: https://github.com/code-yeongyu/oh-my-opencode/blob/dev/AGENTS.md

### 2.3 Stream Processing (CAN PARALLEL with 2.2)

**Estimated Time**: 10-14 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

- [ ] Create `backend/src/parsers/OpenCodeStreamParser.ts`
- [ ] Implement OpenCode-specific JSONL event format parsing
- [ ] Convert OpenCode events to standardized `StreamEvent` format
- [ ] Handle OpenCode tool call events
- [ ] Handle oh-my-opencode agent orchestration events:
  - `agent_start` - Agent invocation started
  - `agent_complete` - Agent finished
  - `background_task_start` - Background agent spawned
  - `background_task_complete` - Background agent finished
  - `todo_update` - Todo list changes
- [ ] Parse thinking/reasoning events if available
- [ ] Implement buffer management for incomplete JSON lines
- [ ] Add error recovery for malformed events
- [ ] Emit events for agent switching (Sisyphus → Prometheus, etc.)

**OpenCode + oh-my-opencode JSONL Format:**
```json
{"type":"step_start","timestamp":1767036059338,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK"}
{"type":"agent_start","timestamp":1767036064268,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","agent":"prometheus"}
{"type":"text","timestamp":1767036065423,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","content":"AI response here"}
{"type":"tool_use","timestamp":1767036078123,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","part":{...}}
{"type":"background_task_start","timestamp":1767036082345,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","task_id":"bg_xyz","agent":"explore"}
{"type":"background_task_complete","timestamp":1767036093456,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","task_id":"bg_xyz"}
{"type":"step_finish","timestamp":1767036104567,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","part":{...}}
{"type":"error","timestamp":1767036115678,"sessionID":"ses_494719016ffe85dkDMj0FPRbHK","error":{...}}
```

**Event Types (OpenCode + oh-my-opencode):**
- `step_start` - Processing step beginning
- `text` - Model output
- `tool_use` - Tool invocation (has `part` field with tool details)
- `agent_start` - oh-my-opencode agent invocation
- `agent_complete` - oh-my-opencode agent finished
- `background_task_start` - Background agent spawned
- `background_task_complete` - Background agent finished
- `todo_update` - Todo list changes (oh-my-opencode todo enforcement)
- `step_finish` - Processing step end
- `error` - Error event

**Notes:**
> Need to parse both OpenCode base events AND oh-my-opencode agent events
> oh-my-opencode adds metadata about which agent is active
> Background agent tasks need special tracking (task_id, agent, status)

### 2.4 Agent Loading (SEQUENTIAL - Depends on 2.1)

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

**Tasks:**
- [ ] Implement `loadAgents(agentsPath: string)` method
- [ ] Read OpenCode built-in agents (Build, Plan, General, Explore)
- [ ] Read oh-my-opencode agents from `~/.config/opencode/agents/` (SKILL.md files)
- [ ] Return standardized `Agent[]` array with:
  - Built-in agents: Build, Plan, General, Explore
  - oh-my-opencode agents: Sisyphus, Prometheus, Oracle, Librarian, Explore, Metis, Momus, Hephaestus, Multimodal Looker, Comment Checker
- [ ] Add agent metadata extraction (name, description, system prompt, model, temperature)
- [ ] Handle built-in vs custom agent distinction
- [ ] Handle skill directory not found gracefully
- [ ] Return agent capabilities (which agents can use which tools)

**OpenCode Built-in Agents:**
- **Primary**: Build (full access), Plan (restricted - asks for edits/bash)
- **Subagents**: General (full access), Explore (read-only)

**oh-my-opencode Agents:**
- **Sisyphus** - Main orchestrator (default)
- **Prometheus** - Strategic planning
- **Oracle** - Debugging/architecture
- **Librarian** - Codebase research
- **Explore** - Fast grep
- **Metis** - Pre-planning
- **Momus** - Plan validation
- **Hephaestus** - Autonomous worker
- **Multimodal Looker** - PDF/image
- **Comment Checker** - Code quality

**Notes:**
> oh-my-opencode SKILL.md files in `~/.config/opencode/agents/`
> Each SKILL.md has YAML frontmatter with agent metadata
> Example from oh-my-opencode AGENTS.md:
> ```yaml
> ---
> name: sisyphus
> description: Main orchestrator
> mode: primary
> model: anthropic/claude-sonnet-4-20250514
> temperature: 0.1
> ---
> ```

### 2.5 Session Operations (CLI Mode)

**Estimated Time**: 6-10 hours | **Priority**: P1 (High)
**Dependencies**: 2.1 complete

**CLI Mode Tasks:**
- [ ] Implement `sendInput(sessionId, input)` - Write to stdin
- [ ] Implement `interrupt(sessionId)` - Send SIGINT (Ctrl+C equivalent)
- [ ] Implement `closeSession(sessionId)` - Kill process, cleanup resources
- [ ] Implement `getSessionStatus(sessionId)` - Check if process is alive
- [ ] Implement `getSessionMetrics(sessionId)` - Return null (no metrics in CLI mode)
- [ ] Add process lifecycle tracking (spawn, stop, cleanup)
- [ ] Handle oh-my-opencode background task cancellation
- [ ] Emit events for agent status changes

**Notes:**
> CLI Mode: Each session spawns its own process, similar to Claude Code
> Server mode NOT needed for this implementation
> Session ID format: `ses_` + 22 alphanumeric characters (same as Claude)
> Input to running session: Write to stdin (no IPC in CLI mode)
> Interrupt: SIGINT (Ctrl+C equivalent)
> oh-my-opencode may have background tasks - cancel them on interrupt

---

## Phase 3: Frontend UI Updates (Week 1-2)

**Status**: ⬜ Not Started
**Dependencies**: Phase 2 complete
**Estimated Time**: 32-40 hours

### 3.1 Tool Selection UI

**Estimated Time**: 8-10 hours | **Priority**: P0 (Critical)

- [ ] Add tool type dropdown to "Create Session" modal
- [ ] Options: "Claude Code", "OpenCode (with oh-my-opencode)"
- [ ] Show tool-specific config fields
- [ ] Add oh-my-opencode agent selector (Sisyphus, Prometheus, Oracle, etc.)
- [ ] Update i18n locale files:
  - `en/common.json`: Add tool names, agent names
  - `es/common.json`: Add Spanish translations
  - `zh-CN/common.json`: Add Chinese translations
  - `zh-TW/common.json`: Add Traditional Chinese translations
  - `ja/common.json`: Add Japanese translations
  - `pt/common.json`: Add Portuguese translations

### 3.2 Agent Path Configuration

**Estimated Time**: 4-6 hours | **Priority**: P1 (High)

- [ ] Claude: `~/.claude/agents/`
- [ ] OpenCode: `~/.config/opencode/agents/` ✅ CORRECT PATH
- [ ] Update AgentPromptsPage to use correct paths
- [ ] Add oh-my-opencode agent selection dropdown
- [ ] Show built-in vs custom agents

**Files to modify:**
- `frontend/src/pages/AgentPromptsPage.tsx`
- `frontend/src/types/config.types.ts`

### 3.3 Session List Badges & Agent Status

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)

- [ ] Add tool type badge to session cards
- [ ] Color coding: Claude (green), OpenCode (blue)
- [ ] Add current agent indicator (Sisyphus, Prometheus, Oracle, etc.)
- [ ] Show background agent tasks (parallel agents running)
- [ ] Show todo enforcement status (if oh-my-opencode todos active)
- [ ] Filter sessions by tool type
- [ ] Update session detail header

### 3.4 Tool-Specific Settings

**Estimated Time**: 10-12 hours | **Priority**: P1 (High)

- [ ] Add OpenCode configuration section
- [ ] Executable path input
- [ ] Model selection (provider/model format)
- [ ] oh-my-opencode enabled toggle
- [ ] Agent configuration (temperature, model per agent)
- [ ] No API keys needed
- [ ] Test connection button
- [ ] Show oh-my-opencode version

**Files to modify:**
- `frontend/src/pages/Settings.tsx`
- `frontend/src/services/api.ts`

### 3.5 Message Type Handling

**Estimated Time**: 6-8 hours | **Priority**: P2 (Medium)

- [ ] Update MessageFilter for OpenCode events
- [ ] Ensure tool calls render correctly
- [ ] Add OpenCode-specific icon
- [ ] Add agent switching visualization (when Sisyphus calls Prometheus)
- [ ] Add background agent task indicators
- [ ] Handle oh-my-opencode todo events

**Files to modify:**
- `frontend/src/components/Session/MessageFilter.tsx`
- `frontend/src/components/Session/MessageItem.tsx`

---

## Phase 4: Integration & Testing (Week 2-3)

**Status**: ⬜ Not Started
**Dependencies**: Phase 2 & 3 complete
**Estimated Time**: 48-64 hours

### 4.1 Backend Integration

**Estimated Time**: 16-20 hours | **Priority**: P0 (Critical)

- [ ] Register `OpenCodeProvider` in `ProviderFactory`
- [ ] Update `SessionService` to route requests to correct provider
- [ ] Replace hardcoded Claude CLI calls in `ProcessManager` with provider calls
- [ ] Add provider switching logic for session creation
- [ ] Test session creation with both tools
- [ ] Test session resume with both tools
- [ ] Test oh-my-opencode agent orchestration (Sisyphus calling Prometheus)

### 4.2 Frontend Integration

**Estimated Time**: 12-16 hours | **Priority**: P0 (Critical)

- [ ] Connect tool selection dropdown to backend API
- [ ] Pass `tool_type` in session creation requests
- [ ] Update WebSocket message handling for OpenCode events
- [ ] Test real-time streaming with OpenCode
- [ ] Test agent switching visualization
- [ ] Test background agent indicators

### 4.3 End-to-End Testing

**Estimated Time**: 20-24 hours | **Priority**: P0 (Critical)

- [ ] Test complete flow: Create OpenCode session → Send message → Receive response
- [ ] Test oh-my-opencode agent loading and selection
- [ ] Test agent orchestration (Sisyphus → Prometheus → Oracle)
- [ ] Test background agent spawning (explore + librarian parallel)
- [ ] Test workflow stages with OpenCode agents
- [ ] Test session resume/continue with OpenCode
- [ ] Test multi-session scenarios (Claude + OpenCode simultaneously)
- [ ] Test error handling (CLI failures, timeouts)
- [ ] Test session interruption and cleanup
- [ ] Cross-browser testing (Chrome, Firefox, Edge, Safari)
- [ ] Performance testing (concurrent sessions, long messages)

---

## Phase 5: Documentation & Polish (Week 3)

**Status**: ⬜ Not Started
**Dependencies**: Phase 4 in progress
**Estimated Time**: 20-28 hours

### 5.1 Documentation

**Estimated Time**: 8-10 hours | **Priority**: P1 (High)

- [ ] Update README.md with OpenCode + oh-my-opencode support
- [ ] Add oh-my-opencode installation section
- [ ] Create "Multi-Tool Usage" guide
- [ ] Add "oh-my-opencode Agents" section (describe each agent)
- [ ] Update API documentation with provider endpoints
- [ ] Add OpenCode troubleshooting section
- [ ] Create migration guide for existing users
- [ ] Update wiki pages with tool-specific info

### 5.2 Migration Script

**Estimated Time**: 6-8 hours | **Priority**: P0 (Critical)

- [ ] Create automated migration script
- [ ] Handle edge cases
- [ ] Add rollback capability
- [ ] Test migration

### 5.3 Polish & Bug Fixes

**Estimated Time**: 10-12 hours | **Priority**: P2 (Medium)

- [ ] Fix UI/UX issues found during testing
- [ ] Performance optimization
- [ ] Add loading states for agent switching
- [ ] Improve error messages
- [ ] Accessibility improvements

---

## Critical Architecture Decisions

### OpenCode + oh-my-opencode Integration Approach

**DECISION: Treat as ONE unified provider**

**Rationale:**
- oh-my-opencode is a PLUGIN for OpenCode, not a separate tool
- Once installed, OpenCode CLI automatically loads oh-my-opencode agents
- User interacts with `opencode` command only
- oh-my-opencode adds agent orchestration, LSP/AST tools, MCP integrations

**Architecture:**
```
Agentic Kanban Board
  ↓
OpenCodeProvider (single provider)
  ↓
opencode CLI (spawns process)
  ↓
OpenCode loads oh-my-opencode plugin (automatic)
  ↓
oh-my-opencode agents orchestration (Sisyphus calls other agents)
  ↓
JSONL streaming output (includes agent events)
  ↓
UnifiedStreamProcessor (parses and standardizes)
  ↓
Frontend (displays with agent switching indicators)
```

### oh-my-opencode Agent Orchestration

**How it works:**
1. **Sisyphus** (main orchestrator) receives user request
2. Analyzes task → decides which agents to delegate
3. Fires **background agents in parallel** (explore, librarian, etc.)
4. Collects results from background agents
5. Synthesizes response → delegates to appropriate agent (Prometheus for planning, Oracle for debugging)
6. Background agents complete → results integrated
7. Todo enforcement ensures task 100% complete before stopping

**Key Features:**
- **Parallel agent execution**: Multiple agents work simultaneously
- **Agent switching**: Visible in UI (Sisyphus → Prometheus → Oracle)
- **Background tasks**: Explore + librarian run in parallel
- **Todo enforcement**: Agent cannot stop until all todos complete
- **Session continuation**: Full context preserved across agent switches

### Stream Event Mapping

**OpenCode + oh-my-opencode → StreamEvent:**

| oh-my-opencode Event | StreamEvent Type | Frontend Display |
|---------------------|------------------|------------------|
| `text` | MESSAGE | Assistant message |
| `tool_use` | TOOL_CALL | Tool call with name/params |
| `agent_start` | STATUS | "Agent: [Name] started" |
| `agent_complete` | STATUS | "Agent: [Name] completed" |
| `background_task_start` | STATUS | "Background: [Agent] on task" |
| `background_task_complete` | STATUS | "Background: [Agent] finished" |
| `todo_update` | STATUS | Todo list changes |
| `step_finish` | STATUS | Processing step complete |
| `error` | ERROR | Error display |

---

## Change Log

| Date | Phase | Change | Author |
|-------|--------|----------|--------|
| 2026-02-15 | Initial | Created final implementation plan with oh-my-opencode integration | Sisyphus |

---

## Questions for Stakeholders

### Architecture
- [ ] Should we enable oh-my-opencode by default or make it optional?
- [ ] Should we expose all 11 oh-my-opencode agents or just subset (Sisyphus, Prometheus, Oracle)?
- [ ] How to handle background agent tasks in UI (parallel task visualization)?

### Configuration
- [ ] Default model for OpenCode sessions?
- [ ] Per-agent model configuration (allow user to override oh-my-opencode defaults)?

### Testing
- [ ] Priority order: basic OpenCode flow → agent orchestration → parallel agents?
- [ ] Test with real projects or mock data?

---

**Last Updated**: 2026-02-15
**Next Review**: TBD
**Document Version**: 3.0 - FINAL (oh-my-opencode integrated)
