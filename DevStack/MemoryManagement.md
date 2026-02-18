# Memory Management in Your Development Stack

**Version:** 1.2  
**Last Updated:** February 15, 2026  
**Scope:** Comprehensive analysis of memory/context management tools, skills, and patterns across the OpenCode + Oh-My-OpenCode + Claude ecosystem

**Changelog:**
- v1.2: Added Section 9 - Future Beads Integration, complete implementation planning documents
- v1.1: Added Entire Check Plugin documentation (4.4), updated integration patterns, added automation workflow
- v1.0: Initial comprehensive memory management documentation

---

## Executive Summary

Your development stack employs a **multi-layered memory management architecture** spanning four distinct tiers:

| Tier | Purpose | Technologies |
|------|---------|--------------|
| **Tier 1: Cross-Session Memory** | Persistent memory across agent sessions | Claude-Mem (MCP Server) |
| **Tier 2: Session Persistence** | Full session checkpoint/recovery | Entire CLI (optional) |
| **Tier 3: Context Optimization** | Token-efficient context management | RTK, Filesystem-Context Skill |
| **Tier 4: Runtime Context** | In-session skill/tool loading | Superpowers, AGENTS.md |

**Current Status:**
- ✅ **Claude-Mem**: Installed and active (MCP Server configured)
- ⚠️ **Entire CLI**: Not initialized (installation recommended) - **Now monitored by Entire Check Plugin**
- ✅ **RTK**: Installed with 91.7% token savings efficiency
- ✅ **Filesystem-Context**: Available as skill
- ✅ **Context-Management Plugin**: Enabled in Claude settings
- ✅ **Entire Check Plugin**: Installed and active (monitors memory stack on session start)

---

## Table of Contents

1. [Cross-Session Memory Layer](#1-cross-session-memory-layer)
2. [Session Persistence Layer](#2-session-persistence-layer)
3. [Context Optimization Layer](#3-context-optimization-layer)
4. [Runtime Context Layer](#4-runtime-context-layer)
   - [4.4 Entire Check Plugin (NEW)](#44-entire-check-plugin-new---session-start-automation)
5. [Integration Patterns](#5-integration-patterns)
6. [Recommendations](#6-recommendations)
7. [Gaps & Tradeoffs](#7-gaps--tradeoffs)
8. [Sources & References](#8-sources--references)
9. [Future Integration: Beads](#9-future-integration-beads)
   - [9.6 Context Compaction Hook](#96-context-compaction-hook-critical-integration)

---

## 1. Cross-Session Memory Layer

### 1.1 Claude-Mem (Primary Memory System)

**Location:** `~/claude-mem-install/`  
**Type:** MCP (Model Context Protocol) Server  
**Status:** ✅ Active and configured  
**GitHub:** [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) ⭐ 27k

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Claude-Mem Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Claude Code ──┬──► SessionStart Hook                               │
│       │        ├──► UserPromptSubmit Hook                           │
│       │        ├──► PostToolUse Hook ──► Tool Observation Capture   │
│       │        ├──► Summary Hook ──────► Compression/Summarization  │
│       │        └──► SessionEnd Hook                                 │
│       │                     │                                       │
│       │                     ▼                                       │
│       │            ┌─────────────────┐                              │
│       │            │  Worker Service │                              │
│       │            │  Port 37777     │                              │
│       │            └────────┬────────┘                              │
│       │                     │                                       │
│       ▼                     ▼                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  │  SQLite DB  │    │  Chroma      │    │  Web UI      │            │
│  │  ~/.claude- │    │  Vector      │    │  localhost:  │            │
│  │  mem/claude │    │  Embeddings  │    │  37777       │            │
│  │  -mem.db    │    │  Semantic    │    │              │            │
│  └─────────────┘    │  Search      │    └──────────────┘            │
│                     └──────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Configuration

**File:** `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "claude-mem": {
      "type": "stdio",
      "command": "bun",
      "args": [
        "/Users/calebrosario/.claude-mem-install/plugin/scripts/worker-service.cjs",
        "start"
      ],
      "cwd": "/Users/calebrosario/.claude-mem-install"
    }
  }
}
```

#### How It Works

1. **Lifecycle Hooks** (5 total):
   - **SessionStart**: Initialize context injection
   - **UserPromptSubmit**: Pre-process user input
   - **PostToolUse**: Capture tool observations automatically
   - **Summary**: Compress observations using Claude Agent SDK
   - **SessionEnd**: Finalize storage

2. **Data Flow**:
   - Tool usage is automatically captured
   - Observations are compressed via LLM
   - Stored in SQLite database + Chroma vector store
   - Relevant context injected into future sessions via semantic search

3. **Privacy Controls**:
   - `<private>content</private>` tags exclude content from storage
   - Tag stripping happens at hook layer (edge processing)

#### Automatic Features

- ✅ **Zero manual intervention** - Works automatically once installed
- ✅ **Semantic search** - Natural language queries of past work
- ✅ **Progressive disclosure** - Layered memory retrieval with token cost visibility
- ✅ **Web viewer UI** - Real-time memory stream at http://localhost:37777
- ✅ **Citations** - Reference past observations with IDs

#### Manual Interactions

```bash
# View web UI
open http://localhost:37777

# Query specific observation
http://localhost:37777/api/observation/{id}
```

#### Storage Locations

```
~/.claude-mem/
├── claude-mem.db          # SQLite database (188KB)
├── claude-mem.db-shm      # Shared memory file
├── claude-mem.db-wal      # Write-ahead log
├── settings.json          # Configuration
├── worker.pid             # Worker process ID
└── logs/                  # Log files
```

---

## 2. Session Persistence Layer

### 2.1 Entire CLI (Optional but Recommended)

**Location:** System-wide (install via Homebrew)  
**Type:** Git-integrated session persistence  
**Status:** ⚠️ Not initialized  
**GitHub:** [entireio/cli](https://github.com/entireio/cli) ⭐ 2.2k

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Entire CLI Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Git Repository                                                     │
│       │                                                             │
│       ├──► main branch (clean commits)                              │
│       │                                                             │
│       └──► entire/checkpoints/v1 branch (session metadata)          │
│                    │                                                │
│                    ├──► Session transcripts (JSONL)                 │
│                    ├──► Token usage stats                           │
│                    ├──► Prompt/response pairs                       │
│                    └──► File change tracking                        │
│                                                                     │
│  Commands:                                                          │
│    entire enable      # Initialize in repo                          │
│    entire status      # Show checkpoint status                      │
│    entire rewind      # Rollback to checkpoint                      │
│    entire resume      # Resume previous session                     │
│    entire explain     # Review session history                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Installation

```bash
# Install
brew tap entireio/tap
brew install entireio/tap/entire

# Enable in project
cd your-project
entire enable --strategy auto-commit  # Recommended
```

#### Strategies

| Strategy | When Checkpoints Created | Use Case |
|----------|-------------------------|----------|
| **manual-commit** (default) | On git commits | Controlled, manual checkpoints |
| **auto-commit** | After each agent response | Maximum recovery granularity |

#### Automatic Features

- ✅ **Git hook integration** - Automatically captures sessions on push
- ✅ **Separate branch** - Session metadata isolated from code commits
- ✅ **Checkpoint rewind** - `entire rewind` to restore code + context
- ✅ **Session resume** - Continue work after crashes/timeouts

#### Manual Interactions

```bash
# Check status
entire status

# Create checkpoint manually
entire checkpoint

# Rewind to previous checkpoint
entire rewind

# Resume specific session
entire resume feature/oauth

# Explain what happened in a commit
entire explain a1b2c3d

# List all checkpoints
entire explain --list
```

#### Why You Should Enable This

Your current gaps:
- ⚠️ No session recovery if OpenCode crashes
- ⚠️ Lost work context between sessions
- ⚠️ No audit trail of agent decisions

**Recommendation:** Enable Entire in all active projects.

---

## 3. Context Optimization Layer

### 3.1 RTK (Return Token Kit)

**Location:** `~/.local/bin/rtk`  
**Type:** CLI proxy/interceptor  
**Status:** ✅ Active (91.7% efficiency)  
**GitHub:** [rtk-ai/rtk](https://github.com/rtk-ai/rtk)

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RTK Architecture                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Terminal Command ──► RTK Proxy ──► Command Analyzer                │
│       │                    │              │                         │
│       │                    │              ▼                         │
│       │                    │       ┌─────────────┐                  │
│       │                    │       │ Semantic    │                  │
│       │                    │       │ Analysis    │                  │
│       │                    │       └──────┬──────┘                  │
│       │                    │              │                         │
│       │                    ▼              ▼                         │
│       │            ┌─────────────────────────┐                      │
│       │            │   Output Optimizer      │                      │
│       │            │   • Smart filtering     │                      │
│       │            │   • Compression         │                      │
│       │            │   • Deduplication       │                      │
│       │            └───────────┬─────────────┘                      │
│       │                        │                                    │
│       ▼                        ▼                                    │
│  AI Assistant ◄─── Compressed Output (60-90% smaller)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Your Current Savings

```
RTK Token Savings (Global Scope)
════════════════════════════════════════════════════════════

Total commands:    17
Input tokens:      5.4K
Output tokens:     474
Tokens saved:      5.0K (91.7%)
Total exec time:   8.3s (avg 486ms)
Efficiency meter: ██████████████████████░░ 91.7%
```

#### Available Commands

```bash
# File operations
rtk ls              # List files (70% savings)
rtk tree            # Directory tree (75% savings)
rtk find            # Find files (80% savings)
rtk read            # Read files (filtered)
rtk grep            # Compact grep

# Git operations
rtk git diff        # Compact diffs (70% savings)
rtk git log         # Condensed log (65% savings)
rtk git status      # Minimal status (50% savings)
rtk git show        # Commit details

# GitHub CLI
rtk gh              # GitHub commands (70% savings)

# Test/build operations
rtk test            # Test failures only (85% savings)
rtk pytest          # Python tests (85% savings)
rtk vitest          # Vitest output (75% savings)
rtk playwright      # E2E tests (85% savings)
rtk tsc             # TypeScript compiler (75% savings)
rtk lint            # ESLint (70% savings)
rtk next            # Next.js build (75% savings)
rtk err             # Errors only (90% savings)

# Package managers
rtk npm             # NPM commands (70% savings)
rtk pnpm            # PNPM commands (70% savings)
rtk bun             # Bun commands (70% savings)
rtk pip             # Pip/UV commands (70% savings)

# Databases & Tools
rtk prisma          # Prisma commands (80% savings)
rtk docker          # Container output
rtk kubectl         # K8s output
rtk ruff            # Ruff linter

# Utilities
rtk json            # JSON structure only
rtk log             # Log filtering
rtk curl            # Curl with auto-JSON
rtk wget            # Downloads without progress
rtk env             # Environment variables (filtered)
rtk deps            # Dependencies summary
rtk smart           # Smart summary

# Analytics
rtk gain            # View savings summary
rtk cc-economics    # Compare vs Claude Code spending
rtk discover        # Find missed RTK opportunities
```

#### Shell Aliases (Configured in ~/.zshrc)

**Git & GitHub:**
```bash
gd='rtk git diff'                     # Git diff
gds='rtk git diff --staged'           # Staged diff
gl='rtk git log --oneline -20'        # Git log
gs='rtk git status'                   # Git status
gsh='rtk git show'                    # Git show
rgh='rtk gh'                          # GitHub CLI
```

**File Operations:**
```bash
lt='rtk tree -L 3'                    # Directory tree
lf='rtk ls -la'                       # List files
rf='rtk read'                         # Read file
fd='rtk find'                         # Find files
rg='rtk grep'                         # Compact grep
```

**Testing:**
```bash
rt='rtk test'                         # Run tests
rp='rtk pytest'                       # Python tests
rv='rtk vitest'                       # Vitest
rpw='rtk playwright'                  # Playwright E2E
```

**Build & Development:**
```bash
rts='rtk tsc'                         # TypeScript compiler
rl='rtk lint'                         # ESLint
rfmt='rtk format'                     # Format checker
rnext='rtk next'                      # Next.js build
rerr='rtk err'                        # Errors only
```

**Package Managers:**
```bash
rnpm='rtk npm'                        # NPM
rpnpm='rtk pnpm'                      # PNPM
rbun='rtk bun'                        # Bun
rpip='rtk pip'                        # Pip
ruv='rtk pip'                         # UV (via pip)
```

**Databases & Tools:**
```bash
rprisma='rtk prisma'                  # Prisma
rdock='rtk docker'                    # Docker
rk='rtk kubectl'                      # Kubernetes
rruff='rtk ruff'                      # Ruff linter
rgolint='rtk golangci-lint'           # Go linting
rcargo='rtk cargo'                    # Cargo
rgo='rtk go'                          # Go commands
```

**Utilities:**
```bash
rjson='rtk json'                      # JSON structure
rlog='rtk log'                        # Log filtering
rcurl='rtk curl'                      # Curl with JSON
rwget='rtk wget'                      # Downloads
renv='rtk env'                        # Environment variables
rd='rtk deps'                         # Dependencies
rsm='rtk smart'                       # Smart summary
rtku='rtk -u'                         # Ultra-compact mode
```

**Analytics:**
```bash
rgain='rtk gain'                      # View savings
recon='rtk cc-economics'              # Claude Code economics
```

**Note:** Agents execute via non-interactive shells, so aliases aren't available. Always use full `rtk <command>` syntax in agent contexts.

#### Automatic vs Manual

| Aspect | Behavior |
|--------|----------|
| **Automatic** | AGENTS.md mandates RTK for all applicable CLI commands |
| **Manual** | User must remember to use aliases in interactive shells |
| **Override** | Can bypass with native commands if needed |

---

### 3.2 Filesystem-Context Skill

**Location:** `~/.config/opencode/skill/filesystem-context/`  
**Type:** Agent skill for context offloading  
**Status:** ✅ Available  
**Manual invocation:** `use_skill` when filesystem context needed

#### Core Patterns

**Pattern 1: Tool Output Offloading**
```python
# Before: 8000 tokens in context
# After: ~100 tokens in context, 8000 accessible on demand

def handle_tool_output(output: str, threshold: int = 2000):
    if len(output) < threshold:
        return output
    
    file_path = f"scratch/{tool_name}_{timestamp}.txt"
    write_file(file_path, output)
    
    summary = extract_summary(output, max_tokens=200)
    return f"[Output written to {file_path}. Summary: {summary}]"
```

**Pattern 2: Dynamic Skill Loading**
```
# Static context includes only pointers
Available skills:
- database-optimization: Query tuning strategies
- api-design: REST/GraphQL patterns

# Agent loads full skill only when relevant
read_file("skills/database-optimization/SKILL.md")
```

**Pattern 3: Sub-Agent Communication**
```
workspace/
  agents/
    research_agent/
      findings.md        # Research writes here
    code_agent/
      changes.md         # Code agent writes here
  coordinator/
    synthesis.md         # Coordinator reads all
```

#### When to Use

**Use when:**
- Tool outputs exceed 2000 tokens
- Tasks span multiple conversation turns
- Multiple agents need to share state
- Context window pressure is high

**Avoid when:**
- Tasks complete in single turns
- Context fits comfortably
- Latency is critical

#### Manual Activation

```bash
# User request triggers skill
use_skill: filesystem-context

# Then follow skill patterns for:
# - Writing tool outputs to files
# - Dynamic skill loading
# - Terminal/log persistence
```

---

## 4. Runtime Context Layer

### 4.1 Superpowers Skills System

**Location:** `~/.config/opencode/superpowers/skills/`  
**Type:** Workflow pattern library  
**Status:** ✅ Active (auto-injected on session start)

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Superpowers Context Injection                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Session Start                                                      │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────┐                                               │
│  │ using-superpowers│  (Always injected)                            │
│  │ SKILL.md content │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                               │
│  │ Available Skills │  (Names + descriptions only)                  │
│  │ List             │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  Context Compaction Event                                           │
│       │                                                             │
│       ▼                                                             │
│  Auto-re-inject core bootstrap                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Memory-Related Skills

| Skill | Purpose | Invocation |
|-------|---------|------------|
| **using-superpowers** | Skill invocation bootstrap | Auto-injected |
| **test-driven-development** | TDD workflow enforcement | `use_skill` |
| **systematic-debugging** | Root cause analysis | `use_skill` |
| **subagent-driven-development** | Fresh subagent per task | `use_skill` |
| **writing-plans** | Comprehensive planning | `use_skill` |
| **executing-plans** | Batch execution | `use_skill` |
| **using-git-worktrees** | Session isolation | `use_skill` |

#### Context Persistence Across Compaction

```
Regular Message ──► Context Compaction ──► Message Summarized
                                              │
Skills Content ◄──────────────────────────────┘
(Re-injected automatically)
```

**Key insight:** Skills persist even when conversation is compacted because they are re-injected as user messages with `noReply: true` after compaction events.

---

### 4.2 AGENTS.md Universal Rules

**Location:** `~/.config/opencode/AGENTS.md`  
**Lines:** 135 (after cleanup)  
**Purpose:** Universal workflow rules for all agents

#### Memory-Related Rules

1. **Context Thresholds:**
   - At **65%** context usage: Warn and prepare for handoff
   - At **70%** context usage: Stop and provide handoff summary

2. **Handoff Requirements:**
   ```
   - Completed work summary
   - Current state
   - Next steps
   - File references (not full content)
   - Link to .sisyphus/ or Entire checkpoint
   ```

3. **Session Continuation:**
   - Read `.sisyphus/` directory for previous context
   - Read `.research/` directory for research history
   - Use handoff documents for new sessions

#### Automatic Injection

- Loaded at every session start
- Cannot be disabled
- All agents must follow

---

### 4.3 Claude Projects Directory

**Location:** `~/.claude/projects/`  
**Purpose:** Per-project session storage

#### Structure

```
~/.claude/projects/
├── -Users-calebrosario-Documents-sandbox-general-contractor-business/
│   └── [session-transcript].jsonl
├── -Users-calebrosario-Documents-sandbox-legal-ai/
│   └── [session-transcript].jsonl
└── ...
```

#### Contents

Each project directory contains:
- Session transcripts (`.jsonl` files)
- Token usage statistics
- Subagent session links
- Tool call history

**Access:** Use for debugging, token analysis, session recovery

---

### 4.4 Entire Check Plugin (NEW - Session Start Automation)

**Location:** `~/.config/opencode/plugins/entire-check/`  
**Type:** OpenCode Plugin  
**Status:** ✅ Installed and active  
**Hook:** `session.created` event

#### Purpose

Automatically monitors memory stack health at the start of every OpenCode session, ensuring critical memory management tools are properly configured before work begins.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Entire Check Plugin Flow                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Session Created Event                                              │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │ Check if git    │────No────► Skip (not a git repo)               │
│  │ repository      │                                                │
│  └────────┬────────┘                                                │
│           │ Yes                                                     │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ Check Entire    │────Yes───► Check other tools (optional)        │
│  │ enabled?        │       └──► Show status message                 │
│  └────────┬────────┘                                                │
│           │ No                                                      │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ Check Claude-   │                                                │
│  │ Mem + RTK       │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ Prompt User     │  Based on mode:                                │
│  │ Based on Mode   │  • prompt: Show reminder with fix instructions │
│  │                 │  • auto-init: Auto-enable Entire               │
│  │                 │  • silent: Log only                            │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### What It Checks

On every session start in a git repository:

| Check | Method | Status Indicator |
|-------|--------|------------------|
| **Entire CLI** | `.entire/settings.json` exists | ✅ Enabled / ⚠️ Not initialized |
| **Claude-Mem** | `~/.claude-mem/claude-mem.db` exists | ✅ Active / ❌ Not installed |
| **RTK** | `rtk gain` command | ✅ Active (X% efficiency) / ❌ Not installed |

#### Configuration

**File:** `~/.config/opencode/entire-check.json` (optional)

```json
{
  "enabled": true,
  "mode": "prompt",
  "checkGitRepo": true,
  "showStatus": true
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the plugin |
| `mode` | `"prompt"` \| `"auto-init"` \| `"silent"` | `"prompt"` | Behavior when Entire not enabled |
| `checkGitRepo` | boolean | `true` | Only check in git repositories |
| `showStatus` | boolean | `true` | Show status even when Entire is enabled |

#### Modes

**1. prompt (default)**
Shows a friendly reminder with instructions:

```
Memory Management Check

Entire CLI: Not initialized
Run: `entire enable --strategy auto-commit`

Claude-Mem: Active
RTK: Active (91.7% efficiency)

Why this matters:
• Entire = Session checkpoint/recovery (crash protection)
• Claude-Mem = Cross-session memory (context persistence)
• RTK = Token optimization (60-90% savings)

Enable Entire to prevent context loss on crashes.
```

**2. auto-init**
Automatically runs `entire enable --strategy auto-commit` without user intervention.

⚠️ **Use with caution** - modifies repositories without explicit confirmation!

**3. silent**
Only logs to console (`[entire-check] Entire not enabled in /path/to/repo`), no UI notification.

#### Plugin Configuration

**File:** `~/.config/opencode/opencode.json`

```json
{
  "plugin": [
    "oh-my-opencode",
    "opencode-rate-limit-fallback",
    "file:///Users/calebrosario/.config/opencode/plugins/entire-check/src/plugin.ts"
  ]
}
```

#### Benefits

- ✅ **Proactive monitoring** - Catches missing Entire before you start working
- ✅ **Full stack visibility** - See status of all memory tools at a glance
- ✅ **Actionable guidance** - Clear instructions for fixing gaps
- ✅ **Configurable** - Three modes to match your workflow preference
- ✅ **Zero overhead** - Only runs on session start, negligible performance impact

#### When It Runs

- **Trigger:** Every `session.created` event
- **Condition:** Only in git repositories (when `checkGitRepo: true`)
- **Frequency:** Once per session start
- **Skip conditions:** 
  - Not a git repo (if configured)
  - Entire enabled + `showStatus: false`

---

## 5. Integration Patterns

### 5.1 Recommended Memory Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Recommended Integration                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Cross-Session                            │   │
│  │  Claude-Mem (MCP) ──► Persistent memory across sessions    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼─────────────────────────────────┐   │
│  │                    Session Persistence                       │   │
│  │  Entire CLI ──► Full checkpoint/recovery                    │   │
│  │  Entire Check ──► Auto-monitors & prompts to enable         │   │
│  └───────────────────────────┼─────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼─────────────────────────────────┐   │
│  │                    Context Optimization                      │   │
│  │  RTK ──► Token-efficient CLI commands                       │   │
│  │  Filesystem-Context ──► Dynamic context loading             │   │
│  └───────────────────────────┼─────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼─────────────────────────────────┐   │
│  │                    Runtime Context                           │   │
│  │  Superpowers ──► Workflow patterns                          │   │
│  │  AGENTS.md ──► Universal rules                              │   │
│  │  Entire Check ──► Session start health checks               │   │
│  └───────────────────────────┼─────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Context Lifecycle

```
New Session
    │
    ├──► Entire Check Plugin ──► Verify memory stack health
    │       │
    │       ├──► Entire enabled? ──► ✅ Continue / ⚠️ Prompt user
    │       ├──► Claude-Mem active? ──► ✅ Continue / ❌ Warn
    │       └──► RTK installed? ──► ✅ Continue / ❌ Note
    │
    ├──► Load Claude-Mem context ──► Injected into system prompt
    │
    ├──► Load AGENTS.md rules ──► Universal constraints
    │
    ├──► Load Superpowers bootstrap ──► Skill invocation framework
    │
    └──► User begins work
              │
              ├──► Use RTK for CLI ──► 60-90% token savings
              │
              ├──► Use Skills via use_skill ──► Domain expertise
              │
              ├──► Context grows ──► Monitor threshold
              │         │
              │         ├──► 65% ──► Warn, prepare handoff
              │         └──► 70% ──► Stop, create handoff
              │
              ├──► Use Filesystem-Context ──► Offload to files
              │
              └──► Session ends ──► Claude-Mem captures everything
                                          │
                                          ▼
                                    Next Session
                                          │
                                          ├──► Entire Check Plugin
                                          │       └──► Verify stack health
                                          │
                                          └──► Claude-Mem injects
                                               relevant context
```

### 5.3 Token Budgeting

**Typical 200K context window allocation:**

| Component | Tokens | % of Window | Source |
|-----------|--------|-------------|--------|
| System instructions | ~2K | 1% | AGENTS.md, Superpowers |
| Skills (loaded) | ~3-10K | 2-5% | On-demand via use_skill |
| Claude-Mem context | ~5-15K | 3-8% | Auto-injected |
| Codebase context | ~20-50K | 10-25% | Tool outputs, file reads |
| Conversation history | ~50-100K | 25-50% | User/agent messages |
| Available for work | ~100-120K | 50-60% | Working space |

**Optimization strategies:**
- Use RTK: Save 60-90% on CLI output
- Use Filesystem-Context: Offload >2K outputs
- Use subagents: Fresh context per task
- Compact early: At 65%, not 90%

---

## 6. Recommendations

### 6.1 Immediate Actions (Priority: High)

#### 1. Enable Entire CLI

```bash
# Install
brew tap entireio/tap
brew install entireio/tap/entire

# Enable in all active projects
cd ~/KnowledgeBase && entire enable --strategy auto-commit
cd ~/your-other-project && entire enable --strategy auto-commit

# Verify
entire status
```

**Why:** You currently have no session recovery. If OpenCode crashes, you lose all context.

**Automation:** The Entire Check Plugin (4.4) now automatically monitors this and prompts you on every session start until fixed.

#### 2. Verify Entire Check Plugin Installation

✅ **COMPLETED** - Plugin is installed and configured.

**What it does:**
- Checks Entire status on every session start
- Monitors Claude-Mem and RTK health
- Prompts you with actionable fix instructions

**Configuration:**
```bash
# Plugin location
ls ~/.config/opencode/plugins/entire-check/

# Config (optional - uses defaults if not present)
cat ~/.config/opencode/entire-check.json
```

**To customize behavior, create:**
```json
{
  "enabled": true,
  "mode": "prompt",      // Options: "prompt", "auto-init", "silent"
  "checkGitRepo": true,  // Only check in git repos
  "showStatus": true     // Show status even when Entire enabled
}
```

**Modes explained:**
- `prompt` (default): Shows friendly reminder with fix instructions
- `auto-init`: Automatically runs `entire enable` ⚠️ Use with caution
- `silent`: Logs to console only, no UI notification

#### 3. Create .sisyphus Directory

```bash
mkdir -p ~/.config/opencode/.sisyphus
```

**Why:** AGENTS.md specifies reading `.sisyphus/` for previous session context. Without it, handoffs are incomplete.

#### 3. Configure Claude-Mem Settings

```bash
# Review and adjust settings
cat ~/.claude-mem/settings.json

# Key settings to verify:
# - context_injection_enabled: true
# - compression_level: "balanced"
# - max_tokens_per_session: 50000
```

### 6.2 Workflow Improvements (Priority: Medium)

#### 1. Create Handoff Template

Create `~/.config/opencode/templates/handoff.md`:

```markdown
# Session Handoff

## Completed
- [ ] Task 1
- [ ] Task 2

## Current State
- Working on: 
- Blocked by: 
- Files touched: 

## Next Steps
1. 
2. 

## Context
- Checkpoint: 
- Claude-Mem query: 
- .sisyphus ref: 

## Notes
```

#### 2. Use RTK Consistently

Update your shell profile to use RTK aliases:

```bash
# Already configured in ~/.zshrc
gd  # rtk git diff
gl  # rtk git log --oneline -20
gs  # rtk git status
lt  # rtk tree -L 3
rt  # rtk test
```

#### 3. Respond to Entire Check Plugin Prompts

When the plugin notifies you that Entire is not enabled:

```bash
# Quick fix (in the project directory)
cd your-project
entire enable --strategy auto-commit

# Or install Entire first if needed
brew tap entireio/tap
brew install entireio/tap/entire
entire enable --strategy auto-commit

# Verify
entire status
```

**Why:** The plugin catches the gap before you start working. Fixing it immediately ensures session persistence for that project.

#### 4. Implement Context Checkpoints

At 65% context usage, run:

```bash
# Create checkpoint (if Entire enabled)
entire checkpoint

# Or create manual handoff
cat > .sisyphus/handoff-$(date +%Y%m%d).md << 'EOF'
# Handoff $(date)
## Summary
[Completed work]

## State
[Current files, tests status]

## Next
[Next 3 tasks]
EOF
```

### 6.3 Best Practices Summary

| Practice | Tool | Frequency |
|----------|------|-----------|
| Use RTK for all CLI | RTK | Every command |
| Offload large outputs | Filesystem-Context | >2K tokens |
| Capture checkpoints | Entire CLI | After major milestones |
| Query past work | Claude-Mem | When needing context |
| Create handoffs | Manual | At 65% context |
| Use fresh subagents | subagent-driven-development | Per independent task |
| Compact context | OpenCode native | At 70% threshold |
| Monitor memory stack | Entire Check Plugin | Every session start |
| Fix Entire gaps | Manual/Auto | When plugin prompts |

---

## 7. Gaps & Tradeoffs

### 7.1 Current Gaps

| Gap | Impact | Mitigation | Status |
|-----|--------|------------|--------|
| **Entire not enabled** | No session recovery | Enable immediately | ✅ Monitored by Entire Check Plugin |
| **No .sisyphus directory** | Incomplete handoffs | Create directory | ⚠️ Manual action needed |
| **Filesystem-Context underused** | Context bloat | Activate skill proactively | ⚠️ Manual action needed |
| **No context budget tracking** | Unaware of usage | Monitor with `rtk gain` | ✅ RTK installed |
| **No automated compaction** | Manual threshold management | Set reminders at 65% | ⚠️ AGENTS.md rules only |

**Legend:**
- ✅ Gap is actively monitored or automated
- ⚠️ Requires manual intervention
- ❌ No mitigation in place

### 7.2 Tradeoff Analysis

#### Claude-Mem vs Entire

| Aspect | Claude-Mem | Entire CLI |
|--------|------------|------------|
| **Scope** | Cross-session memory | Session checkpoint/recovery |
| **Granularity** | Tool observations, summaries | Full session transcript |
| **Storage** | SQLite + Chroma (local) | Git branch (versioned) |
| **Query** | Semantic search | Linear history |
| **Recovery** | Context injection | Full rewind/resume |
| **Use for** | Remembering past work | Recovering from crashes |
| **Tradeoff** | Lossy compression | Complete but large |

**Recommendation:** Use both. Claude-Mem for "what did we do?", Entire for "take me back to that moment."

#### RTK vs Native Commands

| Aspect | RTK | Native |
|--------|-----|--------|
| **Token cost** | 60-90% lower | Full output |
| **Completeness** | Summarized/filtered | Everything |
| **Speed** | +10-50ms overhead | Fastest |
| **Context** | Preserved meaning | Exact bytes |
| **Use for** | AI context | Debugging, exact data |
| **Tradeoff** | Less detail | More tokens |

**Recommendation:** Default to RTK. Use native only when you need exact output.

#### Dynamic vs Static Context

| Aspect | Dynamic (Filesystem) | Static (In-Context) |
|--------|---------------------|---------------------|
| **Token efficiency** | High (load on demand) | Low (always present) |
| **Latency** | Higher (file I/O) | Lower (immediate) |
| **Reliability** | Model-dependent | Guaranteed |
| **Best for** | Large, rarely-needed data | Critical, always-needed data |
| **Tradeoff** | Might forget to load | Always there, always costing |

**Recommendation:** Static for critical rules, dynamic for skills/tool outputs.

### 7.3 Potential Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude-Mem data loss | Low | High | Regular backups of `~/.claude-mem/` |
| Context pollution | Medium | Medium | Fresh subagents per task |
| Token exhaustion | Medium | High | Monitor, compact at 65% |
| Entire branch conflicts | Low | Medium | Don't manually edit checkpoint branch |
| Privacy leak in Claude-Mem | Low | High | Use `<private>` tags |

---

## 8. Sources & References

### 8.1 Primary Sources

| Source | Location | Type |
|--------|----------|------|
| AGENTS.md | `~/.config/opencode/AGENTS.md` | Universal rules |
| Harness.md | `~/.config/opencode/Harness.md` | Stack documentation |
| Claude-Mem README | `~/claude-mem-install/README.md` | MCP documentation |
| Claude-Mem CLAUDE.md | `~/claude-mem-install/CLAUDE.md` | Dev instructions |
| RTK Help | `rtk --help` | CLI reference |
| Superpowers | `~/.config/opencode/superpowers/skills/` | Workflow patterns |
| Filesystem-Context | `~/.config/opencode/skill/filesystem-context/SKILL.md` | Context offloading |
| Token Optimization | `~/.config/opencode/Token-Optimization-Deep-Dive.md` | Deep analysis |
| **Entire Check Plugin** | `~/.config/opencode/plugins/entire-check/` | Session monitoring |

### 8.2 External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Claude-Mem | https://github.com/thedotmack/claude-mem | MCP memory system |
| Entire CLI | https://github.com/entireio/cli | Session persistence |
| RTK | https://github.com/rtk-ai/rtk | Token optimization |
| Superpowers | https://github.com/obra/superpowers | Skill framework |
| Claude Code | https://github.com/anthropics/claude-code | Base platform |
| OpenCode | https://github.com/sst/opencode | Agent platform |
| Oh-My-OpenCode | https://github.com/code-yeongyu/oh-my-opencode | Orchestration |
| Entire Blog | https://www.mager.co/blog/2026-02-10-entire-cli/ | Entire overview |

### 8.3 Configuration Files Reference

```
~/.config/opencode/
├── AGENTS.md                    # Universal rules
├── Harness.md                   # Stack documentation
├── opencode.json               # Model providers, MCP, plugins
├── oh-my-opencode.json         # Agent definitions
├── **entire-check.json**       # Plugin configuration (optional)
├── superpowers/skills/         # Workflow patterns
└── **plugins/entire-check/**   # Session monitoring plugin
    ├── src/plugin.ts
    ├── README.md
    └── package.json

~/.claude/
├── settings.json               # Plugin config, MCP servers
├── skills/                     # Domain expertise
└── projects/                   # Session transcripts

~/.claude-mem/
├── claude-mem.db              # Memory database
├── settings.json              # Memory configuration
└── logs/                      # Operation logs

~/.local/bin/
└── rtk                        # Token optimization

Project directories:
├── .entire/                   # Entire CLI config (when enabled)
│   └── settings.json
├── .sisyphus/                 # Session context (recommended)
└── CLAUDE.md                  # Project-specific instructions
```

---

## Appendix A: Quick Reference Card

### Memory Management Cheat Sheet

```bash
# Check token savings
rtk gain

# View Claude-Mem UI
open http://localhost:37777

# Enable Entire in project (do this when plugin prompts)
cd your-project && entire enable --strategy auto-commit

# Check Entire status
entire status

# Create checkpoint
entire checkpoint

# Rewind to previous state
entire rewind

# Query Claude-Mem (via natural language in session)
"What did we do about authentication last week?"

# Offload large output to file
echo "$large_output" > scratch/output.txt
# Then reference in context: "See scratch/output.txt for full details"

# Check context usage
# (Shown in OpenCode UI or via token tracking)

# Create handoff at 65%
cat > .sisyphus/handoff.md << 'EOF'
# Handoff $(date)
## Completed
## State
## Next
EOF

# Configure Entire Check Plugin
cat > ~/.config/opencode/entire-check.json << 'EOF'
{
  "enabled": true,
  "mode": "prompt",
  "checkGitRepo": true,
  "showStatus": true
}
EOF
```

### RTK Aliases Quick Reference

**Essential aliases (use in interactive shells):**
```bash
gd          # rtk git diff
gl          # rtk git log --oneline -20
gs          # rtk git status
lt          # rtk tree -L 3
rt          # rtk test
rerr        # rtk err (errors only)
rnext       # rtk next
rpw         # rtk playwright
rp          # rtk pytest
rgain       # rtk gain (view savings)
```

**Full list: 30+ aliases configured in ~/.zshrc**

### Decision Tree

```
Starting new session?
    └── Entire Check Plugin ──► Automatically monitors memory stack
        ├── Entire not enabled? ──► Prompts with fix instructions
        └── All systems go ──► Shows status, continue working

Need to remember something across sessions?
    ├── Yes, specific facts/work ──► Claude-Mem (automatic)
    └── Yes, full session state ──► Entire CLI (enable it!)

Context window getting full?
    ├── CLI output ──► Use RTK
    ├── Tool output >2K ──► Filesystem-Context
    ├── At 65% ──► Prepare handoff
    └── At 70% ──► Stop, compact, restart

Need domain expertise?
    ├── Check available skills ──► use_skill
    └── Not available ──► Use AGENTS.md patterns

Session crashed?
    ├── Entire enabled ──► entire resume
    └── No Entire ──► Start fresh, check Claude-Mem

Planning multi-step work?
    ├── Yes, >3 tasks with dependencies ──► Beads (see Section 9)
    └── No, simple/single-task ──► Use existing workflow
```

---

## 9. Future Integration: Beads

### 9.1 Overview

**Beads** (by Steve Yegge) is a git-backed graph issue tracker designed specifically for AI agents. While not yet integrated, it has been evaluated as a **complementary addition** to the existing stack.

**GitHub:** https://github.com/steveyegge/beads ⭐ 16.4k  
**Documentation:** https://steveyegge.github.io/beads/

### 9.2 What Beads Adds

Beads fills gaps in the current stack:

| Gap | Current State | Beads Solution |
|-----|--------------|----------------|
| **Task Tracking** | Ad-hoc TODOs in markdown | Structured graph database with dependencies |
| **Dependency Management** | None | Native support (blocks/blocked-by/relates) |
| **Multi-Agent Coordination** | Manual subagent dispatch | Atomic task claiming, routing, gates |
| **Work Prioritization** | No formal system | P0/P1/P2 priority system |
| **Audit Trail** | Relies on Claude-Mem | Explicit task history, status changes |

### 9.3 Integration Status

**Current Phase:** Planning  
**Implementation Documents:**
- Master Plan: `~/knowledgebase/DevStack-Planning/Beads-Integration-Plan.md`
- Quick Reference: `~/knowledgebase/DevStack-Planning/Beads-Quick-Reference.md`
- Checklist: `~/knowledgebase/DevStack-Planning/Beads-Implementation-Checklist.md`

**Planned Integration Points:**
1. **Session Start Hook** - Extend Entire Check Plugin to include beads status
2. **Task Automation** - Auto-create beads issues from implementation plans
3. **Cross-System Linking** - Connect beads tasks to Claude-Mem observations and Entire checkpoints
4. **Unified Reporting** - Single command to view full stack status

### 9.4 Proposed Architecture

```
Beads Layer (New - Task Management)
    │
    ├──► Task Dependency Graph
    ├──► Multi-Agent Coordination
    ├──► Work Prioritization
    └──► Audit Trail

Existing Stack (Unchanged)
    │
    ├──► Claude-Mem (Cross-Session Memory) ──┐
    ├──► Entire CLI (Session Recovery) ──────┼──► Integrated Workflow
    ├──► RTK (Token Optimization) ───────────┤
    └──► Entire Check Plugin (Health) ───────┘
```

### 9.5 Example Workflow (Future)

```bash
# 1. Start session (Entire Check Plugin shows all systems)
opencode
# → "Entire ✓ Claude-Mem ✓ RTK ✓ Beads ✓"

# 2. Check ready work (Beads)
bd ready
# → Shows unblocked tasks with priorities

# 3. Claim task (Beads)
bd update bd-a1b2 --claim

# 4. Do work (Existing stack)
# - Claude-Mem captures observations
# - Entire creates checkpoints
# - RTK optimizes CLI output

# 5. Context compaction (automatic at 70% or manual)
# → Compaction hook triggers FIRST
# → Syncs beads: bd sync
# → Updates active tasks with compaction marker
# → Then context is compacted

# 6. Complete (Beads)
bd close bd-a1b2
bd sync
```

### 9.6 Context Compaction Hook (Critical Integration)

**Problem:** When OpenCode compacts context (at 70% threshold or manually), task progress mentioned in conversation may be lost.

**Solution:** A compaction hook that syncs beads **BEFORE** compaction completes:

```typescript
// Triggered on session.compacted event
async function handleCompaction(event) {
  // 1. Get all active tasks
  const active = await bd('list --status in_progress --json')
  
  // 2. Update each with compaction marker
  for (const task of active) {
    await bd(`update ${task.id} --note "Context compacted ${timestamp}"`)
  }
  
  // 3. Sync beads to persist changes
  await bd('sync')
}
```

**Benefits:**
- Task state preserved even if conversation history is lost
- Creates audit trail of compaction events
- Non-blocking (compaction continues even if sync fails)
- Works with both automatic (70%) and manual compaction

**Location in Stack:** Part of Phase 2 (Hook Integration)

### 9.7 When to Use Beads

**Use beads when:**
- Planning multi-step work (>3 tasks)
- Tasks have dependencies (blocked/blocked-by)
- Coordinating across multiple sessions
- Need priority management (P0/P1/P2)
- Want audit trail of attempts/failures

**Don't use beads when:**
- Single-session, single-task work
- Quick fixes (<30 minutes)
- Ad-hoc exploration
- One-off experiments

### 9.8 Relationship to Existing Tools

| Tool | Beads Relationship |
|------|-------------------|
| **Claude-Mem** | Complementary - Claude-Mem preserves context, Beads tracks work items |
| **Entire CLI** | Complementary - Entire recovers sessions, Beads tracks task state |
| **RTK** | Compatible - Use RTK for all beads CLI commands |
| **Entire Check Plugin** | Extension Point - Add beads status check |
| **Filesystem-Context** | Compatible - Store beads metadata if needed |

### 9.9 Next Steps

1. **Review Integration Plan** - See `~/knowledgebase/DevStack-Planning/Beads-Integration-Plan.md`
2. **Phase 1: Foundation** - Install beads in test project
3. **Phase 2: Hook Integration** - Extend Entire Check Plugin
4. **Phase 3-5** - Task automation, cross-system linking, advanced features

**Decision Required:** Approve Phase 1 implementation to begin testing

---

*Document created: February 15, 2026*  
*Version: 1.2*  
*Last updated: February 15, 2026 (Added Beads Integration planning - Section 9)*  
*Next review: When adding new memory tools, modifying Entire Check Plugin, starting Beads integration, or when context management issues arise*
