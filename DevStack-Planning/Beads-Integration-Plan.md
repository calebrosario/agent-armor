# Beads Integration Implementation Plan

**Document Version:** 1.0  
**Created:** February 15, 2026  
**Status:** Planning Phase  
**Owner:** Development Stack Architecture  
**Related Documents:** 
- `~/.config/opencode/MemoryManagement.md`
- `~/.config/opencode/AGENTS.md`
- `~/Documents/sandbox/opencode-auto-entire/`

---

## Executive Summary

This document outlines a phased approach to integrate **Beads** (Steve Yegge's git-backed graph issue tracker) into the existing memory management and development stack. The integration is designed to be **complementary**—filling gaps in task dependency management while leveraging existing context preservation systems (Claude-Mem, Entire CLI, RTK).

### Key Integration Points

1. **Session Start Hook**: Auto-check beads status alongside Entire Check Plugin
2. **Task Creation Automation**: Auto-create beads issues from agent planning
3. **Dependency-Aware Workflows**: Use `bd ready` to guide agent work selection
4. **Cross-System Sync**: Link beads tasks to Entire checkpoints and Claude-Mem observations
5. **Unified Reporting**: Single command to view full stack status

---

## Current State Analysis

### Existing Stack Components

| Component | Purpose | Status | Integration Point |
|-----------|---------|--------|-------------------|
| **Claude-Mem** | Cross-session semantic memory | ✅ Active | Link observations to beads tasks |
| **Entire CLI** | Session checkpoint/recovery | ⚠️ Partial | Associate checkpoints with beads issues |
| **RTK** | Token optimization | ✅ Active | Use in beads CLI operations |
| **Entire Check Plugin** | Session start health checks | ✅ Active | Add beads status check |
| **Filesystem-Context** | Context offloading | ✅ Available | Store beads metadata |
| **Superpowers** | Workflow patterns | ✅ Active | Add beads-aware skills |

### Gaps Beads Will Fill

1. ❌ **No formal task tracking** - Currently using ad-hoc TODOs
2. ❌ **No dependency management** - Can't track blocked/blocked-by relationships
3. ❌ **No multi-agent coordination** - Single-agent sessions only
4. ❌ **No work prioritization** - No P0/P1/P2 system
5. ❌ **No work audit trail** - Hard to track what was attempted/failed

---

## Integration Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Integrated Development Stack                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Session Start                                                          │
│       │                                                                 │
│       ├──► Entire Check Plugin                                          │
│       │       ├──► Check Entire CLI ──► Prompt if needed                │
│       │       ├──► Check Claude-Mem ──► Warn if missing                 │
│       │       ├──► Check RTK ──► Note status                            │
│       │       └──► NEW: Check Beads ──► Initialize if needed            │
│       │                     │                                           │
│       │                     ▼                                           │
│       │            ┌─────────────────┐                                  │
│       │            │  beads init     │  (if not initialized)            │
│       │            │  --stealth      │                                  │
│       │            └────────┬────────┘                                  │
│       │                     │                                           │
│       ▼                     ▼                                           │
│  ┌─────────────────────────────────────┐                                │
│  │         Work Selection              │                                │
│  │  bd ready --json ──► Show unblocked │                                │
│  │         tasks                       │                                │
│  └───────────────┬─────────────────────┘                                │
│                  │                                                      │
│                  ▼                                                      │
│  ┌─────────────────────────────────────┐                                │
│  │         Task Execution              │                                │
│  │  bd update <id> --claim             │                                │
│  │       │                             │                                │
│  │       ├──► Do work                  │                                │
│  │       │       ├──► Claude-Mem       │                                │
│  │       │       │     captures        │                                │
│  │       │       ├──► Entire           │                                │
│  │       │       │     checkpoints     │                                │
│  │       │       └──► RTK              │                                │
│  │       │             optimizes       │                                │
│  │       │                             │                                │
│  │       └──► bd close <id>            │                                │
│  │                     │               │                                │
│  │                     ▼               │                                │
│  │            ┌──────────────┐         │                                │
│  │            │  beads sync  │         │                                │
│  │            └──────────────┘         │                                │
│  └─────────────────────────────────────┘                                │
│                                                                         │
│  Context Compaction Event (at 70% or manual)                            │
│       │                                                                 │
│       ├──► Compaction Hook ──► Sync beads FIRST                         │
│       │       ├──► Get active tasks                                     │
│       │       ├──► Update tasks with compaction note                    │
│       │       └──► bd sync                                              │
│       │                                                                 │
│       └──► Continue with compaction                                     │
│               └──► Context reduced                                      │
│                    └──► Task state preserved in beads                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interactions

```
Beads ◄───────┐
    │         │
    │    ┌────▼──────────┐
    │    │  Session Hook │
    │    └────┬──────────┘
    │         │
    │    ┌────▼──────────┐
    │    │ Compaction    │
    │    │ Hook (sync)   │
    │    └────┬──────────┘
    │         │
    ▼         ▼
┌──────────────────────────────────┐
│         Agent Session            │
│  ┌───────────────────────────┐   │
│  │  Claude-Mem (Observations)│   │
│  └───────────┬───────────────┘   │
│              │                   │
│  ┌───────────▼──────────┐        │
│  │  Entire (Checkpoints)│        │
│  └───────────┬──────────┘        │
│              │                   │
│  ┌───────────▼──────────┐        │
│  │  RTK (Optimization)  │        │
│  └──────────────────────┘        │
└──────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Install and configure beads in stealth mode

#### Tasks
- [ ] Install beads CLI
  ```bash
  curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
  ```
- [ ] Initialize beads in test project (stealth mode)
  ```bash
  cd ~/Documents/sandbox/test-project
  bd init --stealth
  ```
- [ ] Verify installation
  ```bash
  bd --version
  bd list
  ```
- [ ] Document configuration options
- [ ] Create beads configuration template

#### Deliverables
- [ ] Beads installed and functional
- [ ] Test project initialized
- [ ] Configuration guide created

#### Integration with Existing Stack
```bash
# Update Entire Check Plugin to include beads check
# Location: ~/.config/opencode/plugins/entire-check/src/plugin.ts

# Add beads status check function
function checkBeadsStatus(workingDir: string): boolean {
  return existsSync(join(workingDir, ".beads", "config.json")) ||
         existsSync(join(workingDir, ".beads"))
}

# Update promptUser to include beads status
const beadsEnabled = checkBeadsStatus(workingDir)
```

---

### Phase 2: Hook Integration (Week 2)
**Goal:** Automate beads checks and task creation

#### Tasks
- [ ] Extend Entire Check Plugin
  - Add beads initialization check
  - Add beads status to session start report
  - Create auto-init mode for beads
  
- [ ] Create beads session hook
  ```bash
  # ~/.config/opencode/hooks/beads-session-start.sh
  #!/bin/bash
  
  if [ -d ".beads" ] || [ -d ".git" ]; then
    echo "Beads Status:"
    bd ready 2>/dev/null | head -5 || echo "  Not initialized"
  fi
  ```

- [ ] Add beads-aware AGENTS.md rules
  ```markdown
  ## Beads Task Management
  
  Before starting work:
  1. Check `bd ready` for unblocked tasks
  2. Claim task with `bd update <id> --claim`
  3. If creating new work, use `bd create "Title" -p 1`
  
  After completing work:
  1. Update status: `bd close <id>`
  2. Sync: `bd sync`
  ```

- [ ] Create beads initialization automation
  - Detect when beads is not initialized
  - Prompt user to run `bd init --stealth`
  - Option to auto-initialize (like Entire)

- [ ] **CRITICAL: Create compaction hook for beads sync**
  
  When OpenCode compacts context (at ~70% usage or manual), sync beads progress FIRST:
  
  ```typescript
  // Add to Entire Check Plugin or create separate compaction handler
  
  interface CompactionEvent {
    type: "session.compacted"
    properties: {
      sessionID: string
      reason: "threshold" | "manual" | "auto"
      contextSizeBefore: number
      contextSizeAfter: number
    }
  }
  
  async function handleCompaction(event: CompactionEvent) {
    // 1. Sync beads BEFORE compaction completes
    console.log("[beads] Context compaction detected, syncing task progress...")
    
    try {
      // Get current beads status
      const activeTasks = await execSync("bd list --status in_progress --json", {
        encoding: "utf-8",
        timeout: 5000
      })
      
      const tasks = JSON.parse(activeTasks)
      
      if (tasks.length > 0) {
        // Update each active task with compaction note
        for (const task of tasks) {
          await execSync(
            `bd update ${task.id} --note "Context compacted at ${new Date().toISOString()}. Task state preserved."`,
            { timeout: 3000 }
          )
        }
        
        console.log(`[beads] Updated ${tasks.length} active tasks with compaction marker`)
      }
      
      // Sync beads to ensure all changes persisted
      await execSync("bd sync", { timeout: 10000 })
      console.log("[beads] Sync completed successfully")
      
    } catch (error) {
      console.error("[beads] Failed to sync during compaction:", error)
      // Non-blocking: continue with compaction even if beads sync fails
    }
  }
  
  // Register hook
  return {
    event: async ({ event }) => {
      if (event.type === "session.compacted") {
        await handleCompaction(event as CompactionEvent)
      }
      // ... rest of event handling
    }
  }
  ```
  
  **Why this matters:**
  - Context compaction removes conversation history
  - Beads task state might be mentioned in conversation
  - Syncing BEFORE compaction ensures task progress isn't lost
  - Creates audit trail of compaction events in task history
  
  **Alternative bash hook approach:**
  ```bash
  # ~/.config/opencode/hooks/beads-compaction-hook.sh
  #!/bin/bash
  # This runs before/during compaction
  
  echo "[beads] Syncing task state before context compaction..."
  
  # Sync beads
  if command -v bd &> /dev/null && [ -d ".beads" ]; then
    bd sync
    
    # Mark active tasks with compaction note
    bd list --status in_progress --json 2>/dev/null | jq -r '.[].id' | while read task_id; do
      bd update "$task_id" --note "Context compacted $(date -Iseconds)" 2>/dev/null
    done
    
    echo "[beads] Sync complete"
  fi
  ```

#### Deliverables
- [ ] Updated Entire Check Plugin with beads support
- [ ] Session start hook showing beads status
- [ ] **Compaction hook that syncs beads BEFORE context compaction**
- [ ] AGENTS.md updated with beads workflows
- [ ] Auto-initialization support

---

### Phase 3: Task Automation (Week 3)
**Goal:** Automate task creation from agent planning

#### Tasks
- [ ] Create beads integration skill
  ```markdown
  ---
  name: beads-integration
  description: Use when creating implementation plans or tracking multi-step work
  ---
  
  ## Task Creation from Plans
  
  When creating an implementation plan:
  1. Convert plan steps to beads issues
  2. Set up dependencies between tasks
  3. Prioritize tasks (P0 = critical, P1 = important, P2 = nice-to-have)
  
  ### Example Workflow
  
  ```bash
  # Create epic
  bd create "Refactor authentication" -p 0 --type epic
  
  # Create child tasks with dependencies
  bd create "Audit current auth" -p 0 --parent bd-abc123
  bd create "Design new flow" -p 0 --parent bd-abc123 --deps blocks:bd-xyz789
  bd create "Implement changes" -p 1 --parent bd-abc123 --deps blocks:bd-abc124
  ```
  ```

- [ ] Create plan-to-beads converter script
  ```bash
  #!/bin/bash
  # scripts/plan-to-beads.sh
  # Converts implementation plans to beads issues
  
  PLAN_FILE=$1
  
  # Parse plan and create beads issues
  # Auto-detect dependencies from plan structure
  ```

- [ ] Integrate with existing planning workflow
  - When using `writing-plans` skill, auto-create beads issues
  - Link beads issues to plan documents
  - Track plan execution via beads status

#### Deliverables
- [ ] beads-integration skill created
- [ ] Plan-to-beads converter script
- [ ] Automated task creation from plans

---

### Phase 4: Cross-System Integration (Week 4)
**Goal:** Link beads with Claude-Mem and Entire

#### Tasks
- [ ] Create beads-Claude-Mem bridge
  ```typescript
  // Link beads tasks to Claude-Mem observations
  async function linkBeadsToMem(beadsId: string, observationId: string) {
    // Store relationship in beads metadata
    bd update ${beadsId} --metadata claude-mem:${observationId}
  }
  ```

- [ ] Create beads-Entire association
  ```bash
  # When Entire creates checkpoint, tag with beads issue
  entire checkpoint --tag "beads:${CURRENT_BEADS_TASK}"
  ```

- [ ] Create unified status command
  ```bash
  # ~/.local/bin/devstack-status
  #!/bin/bash
  echo "=== Development Stack Status ==="
  echo ""
  echo "Memory Stack:"
  rtk gain 2>/dev/null | grep -E "(Tokens saved|Efficiency)" || echo "  RTK: Not tracked"
  
  echo ""
  echo "Session Persistence:"
  if [ -d ".entire" ]; then
    echo "  Entire: Enabled"
    entire status 2>/dev/null | head -3
  else
    echo "  Entire: Not initialized"
  fi
  
  echo ""
  echo "Task Management:"
  if [ -d ".beads" ]; then
    echo "  Beads: Enabled"
    echo "  Ready tasks: $(bd ready --json 2>/dev/null | jq length 2>/dev/null || echo '0')"
  else
    echo "  Beads: Not initialized"
  fi
  ```

- [ ] Create cross-system query skill
  ```markdown
  ## Cross-System Query
  
  To find all context about a task:
  1. Get beads issue: `bd show <id>`
  2. Check Entire: `entire explain <checkpoint>`
  3. Query Claude-Mem: "What did we do about <task>?"
  4. View RTK savings: `rtk gain`
  ```

#### Deliverables
- [ ] Cross-system linking functionality
- [ ] Unified status command
- [ ] Cross-system query skill

---

### Phase 5: Advanced Features (Week 5-6)
**Goal:** Multi-agent coordination and workflow optimization

#### Tasks
- [ ] Multi-agent support
  - Configure beads for multi-agent scenarios
  - Set up task claiming protocols
  - Create agent routing rules

- [ ] Formula system integration
  ```toml
  # .beads/formulas/feature-development.toml
  [formula]
  name = "Feature Development"
  
  [[phases]]
  name = "Design"
  tasks = ["Research", "Design Doc", "Review"]
  
  [[phases]]
  name = "Implementation"
  tasks = ["Setup", "Core Logic", "Tests"]
  dependencies = ["Design"]
  ```

- [ ] Performance optimization
  - Benchmark beads operations
  - Optimize for large task graphs
  - Cache frequently accessed data

- [ ] Create comprehensive documentation
  - User guide
  - Troubleshooting
  - Best practices

#### Deliverables
- [ ] Multi-agent configuration
- [ ] Formula templates
- [ ] Performance benchmarks
- [ ] Complete documentation

---

## Technical Implementation Details

### 1. Extended Entire Check Plugin

**File:** `~/.config/opencode/plugins/entire-check/src/plugin.ts`

Add beads checking functionality:

```typescript
interface BeadsCheckConfig {
  enabled: boolean
  mode: "prompt" | "auto-init" | "silent"
}

function checkBeadsStatus(workingDir: string): boolean {
  return existsSync(join(workingDir, ".beads")) ||
         existsSync(join(workingDir, ".beads-hooks"))
}

async function initializeBeads(workingDir: string): Promise<void> {
  execSync("bd init --stealth", {
    cwd: workingDir,
    stdio: "pipe",
    timeout: 10000
  })
}

// Update promptUser to include beads
const beadsStatus = beadsEnabled ? "Enabled" : "Not initialized"
const beadsFix = !beadsEnabled ? "Run: `bd init --stealth`" : ""

const message = `Memory Management Check

Entire CLI: ${entireStatus}
${entireFix}

Claude-Mem: ${claudeMemStatus}

RTK: ${rtkIndicator}

Beads: ${beadsStatus}
${beadsFix}

Why this matters:
• Entire = Session checkpoint/recovery
• Claude-Mem = Cross-session memory
• RTK = Token optimization
• Beads = Task dependency management
...`
```

### 2. AGENTS.md Updates

Add to `~/.config/opencode/AGENTS.md`:

```markdown
## 7. Task Management with Beads

### 7.1 When to Use Beads

Use beads when:
- Planning multi-step work (>3 tasks)
- Coordinating across multiple sessions
- Tracking dependencies (blocked/blocked-by)
- Working with priorities (P0/P1/P2)
- Need audit trail of attempts/failures

Don't use beads when:
- Single-session, single-task work
- Ad-hoc exploration
- Quick fixes (< 30 minutes)

### 7.2 Beads Workflow

```bash
# 1. Check ready work
bd ready

# 2. Claim a task
bd update bd-a1b2 --claim

# 3. Do the work
# (Use your normal workflow - Claude-Mem, Entire, etc.)

# 4. Update progress
bd update bd-a1b2 --status in_progress --note "50% done"

# 5. Complete
bd close bd-a1b2

# 6. Sync
bd sync
```

### 7.3 Integration with Existing Stack

- Link beads tasks to Entire checkpoints: `entire checkpoint --tag beads:${ID}`
- Reference Claude-Mem observations in beads notes
- Use RTK for all beads CLI commands: `rtk bd ready`
```

### 3. Shell Aliases

Add to `~/.zshrc`:

```bash
# Beads aliases
alias bdr='bd ready'                    # Show ready tasks
alias bdc='bd create'                   # Create task
alias bdu='bd update'                   # Update task
alias bds='bd show'                     # Show task details
alias bdl='bd list'                     # List all tasks
alias bdsync='bd sync'                  # Sync beads
alias bdst='bd status'                  # Beads status
alias bdclaim='bd update --claim'       # Claim task
alias bdclose='bd close'                # Close task

# Integrated stack aliases
alias dstatus='devstack-status'         # Full stack status
```

### 4. Configuration Templates

**Beads Config:** `~/.beads/config.json`

```json
{
  "auto_sync": true,
  "compaction": {
    "enabled": true,
    "age_days": 30
  },
  "ui": {
    "default_output": "json"
  },
  "integrations": {
    "claude_mem": {
      "enabled": true,
      "link_observations": true
    },
    "entire": {
      "enabled": true,
      "tag_checkpoints": true
    }
  }
}
```

---

## Testing Plan

### Phase 1 Testing
- [ ] Verify beads installation
- [ ] Test stealth mode initialization
- [ ] Create sample tasks
- [ ] Verify JSON output

### Phase 2 Testing
- [ ] Test session start hook
- [ ] Verify beads status appears in Entire Check Plugin
- [ ] Test auto-initialization
- [ ] Verify AGENTS.md rules work

### Phase 3 Testing
- [ ] Create plan and convert to beads
- [ ] Verify task dependencies
- [ ] Test automated task creation
- [ ] Verify skill integration

### Phase 4 Testing
- [ ] Test beads-Claude-Mem linking
- [ ] Verify Entire checkpoint tagging
- [ ] Test unified status command
- [ ] Cross-system query validation

### Phase 5 Testing
- [ ] Multi-agent simulation
- [ ] Large task graph performance
- [ ] Formula template execution
- [ ] End-to-end workflow validation

---

## Rollback Plan

If integration causes issues:

1. **Disable beads checks:**
   ```bash
   # Edit Entire Check Plugin config
   echo '{"checkBeads": false}' > ~/.config/opencode/entire-check.json
   ```

2. **Remove beads from AGENTS.md:**
   - Delete Section 7 (Beads)
   - Keep existing workflows

3. **Uninstall beads (if needed):**
   ```bash
   rm -rf ~/.beads
   rm /usr/local/bin/bd  # or wherever it's installed
   ```

4. **Revert to TODO-based planning:**
   - Use existing .sisyphus/ directory
   - Continue with markdown plans

---

## Success Metrics

Track these metrics to validate integration:

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Tasks tracked in beads | 0 | >50/month | `bd list --json \| jq length` |
| Dependency clarity | N/A | 80% tasks have deps | Manual audit |
| Session context loss | Occasional | <5% | User feedback |
| Multi-session work completion | 60% | 85% | Beads close rate |
| Agent coordination conflicts | N/A | <2/month | Incident tracking |

---

## Next Steps

### Immediate (This Week)
1. [ ] Review and approve this plan
2. [ ] Install beads in test project
3. [ ] Begin Phase 1 implementation

### Short-term (Next 2 Weeks)
1. [ ] Complete Phase 1 & 2
2. [ ] Test integration in daily workflow
3. [ ] Document initial findings

### Long-term (Next Month)
1. [ ] Complete all phases
2. [ ] Train team on beads workflow
3. [ ] Measure success metrics

---

## Resources

- **Beads Repository:** https://github.com/steveyegge/beads
- **Beads Documentation:** https://steveyegge.github.io/beads/
- **Steve Yegge's Article:** https://steve-yegge.medium.com/the-beads-revolution
- **Current Stack Docs:** `~/.config/opencode/MemoryManagement.md`

---

**Document Status:** Ready for review  
**Next Review Date:** After Phase 1 completion  
**Approval Required:** Yes - before Phase 2 begins
