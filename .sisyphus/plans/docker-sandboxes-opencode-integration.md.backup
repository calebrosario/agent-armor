# Docker Sandboxes & Git Branching Strategy for OpenCode + oh-my-opencode (Task-Based Containers)

## Executive Summary

This plan implements Docker Sandboxes for OpenCode agent safety with enforced git branching strategy, integrated into the OpenCode + oh-my-opencode ecosystem. The system provides **task-based container lifecycle** with multi-layer persistence, allowing containers to persist across multiple agent sessions. Each task gets a dedicated container that preserves exact filesystem state, enabling agents to resume work exactly where previous sessions left off.

## Key Innovation: Task-Based vs Agent-Based Containers

**Traditional Agent-Based Approach** (OLD):
- One container per agent session
- Container destroyed after agent completes
- No persistence between sessions
- Each agent starts with clean slate

**New Task-Based Approach** (NEW):
- One container per task (persists across multiple agent sessions)
- Container preserved until task completion
- Multi-layer memory persistence
- Agents can resume exactly where previous left off
- Supports session interruption and continuation

## Context

Based on:
- Docker's experimental Sandbox API (Docker Desktop 4.50+)
- OpenCode MCP system for tool integration
- oh-my-opencode hooks system for workflow customization
- Sisyphus Orchestrator for multi-agent coordination

### Key Features

✅ **Task-based container lifecycle**: One container per task, persists across sessions
✅ **Multi-layer memory persistence**: 4-layer system (state, logs, decisions, checkpoints)
✅ **Session persistence**: Resume any task with exact filesystem state
✅ **Agent flexibility**: Switch agents mid-task without losing progress
✅ **Checkpointing**: Roll back to any point with full filesystem snapshots
✅ **Enforced git branching**: `<agent-name>-<model-used>/<work-description>`
✅ **Automated Plan.md**: Creation at submodule root with iteration tracking
✅ **Submodule management**: Auto-created with descriptive names
✅ **Parallel ultrawork mode**: Parent task coordinates persistent subtask containers
✅ **Configurable locking**: Exclusive or collaborative task modes
✅ **Safety mechanisms**: Through hooks and MCP
✅ **Seamless integration**: With OpenCode + oh-my-opencode


## Architecture Overview

### System Components (Updated)

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode + oh-my-opencode                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Sisyphus Orchestrator                         │
│  │  (Main Planner - Claude Opus 4.5 High)                     │
│  │  Coordinates: Parent Task + Subtasks in Parallel           │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ├─ Specialized Agents (Background)   │
│                              │  - Planner-Sisyphus (Parent)   │
│                              │  - Oracle                         │
│                              │  - Librarian                       │
│                              │  - Explore                        │
│                              │  - Frontend Engineer              │
│                              └─ Docker Sandbox Agent (NEW)      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Hooks System                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Task Lifecycle Hooks (NEW)                       │  │ │
│  │  │ - task-lifecycle-manager                           │  │ │
│  │  │ - checkpoint-creator                               │  │ │
│  │  │ - task-resumer                                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Git Branching Hooks (NEW)                            │  │ │
│  │  │ - pre-task-branch-creator                            │  │ │
│  │  │ - branch-name-validator                              │  │ │
│  │  │ - submodule-creator                                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Plan.md Management Hooks (UPDATED)                     │  │ │
│  │  │ - plan-file-creator                                  │  │ │
│  │  │ - plan-updater (persistes to .task-memory)       │  │ │
│  │  │ - plan-finalizer                                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Safety Hooks (NEW)                                   │  │ │
│  │  │ - container-safety-enforcer                           │  │ │
│  │  │ - resource-limit-monitor                             │  │ │
│  │  │ - isolation-checker                                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   MCP System                               │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Docker Sandbox MCP Server (UPDATED)                  │  │ │
│  │  │ - create_task_sandbox()                            │  │ │
│  │  │ - attach_agent_to_task()                          │  │ │
│  │  │ - detach_agent_from_task()                         │  │ │
│  │  │ - execute_in_task()                                │  │ │
│  │  │ - list_active_tasks()                              │  │ │
│  │  │ - create_task_checkpoint()                          │  │ │
│  │  │ - restore_task_checkpoint()                         │  │ │
│  │  │ - complete_task()                                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │  Docker Desktop    │
                    │  (4.50+)           │
                    └────────────────────┘
```

### Task Registry (SQLite on Host)

```
OpenCode Host:
└── ~/.opencode/task-registry/
    ├── tasks.db              # SQLite database
    │   ├── tasks table      # Task records
    │   ├── agent_sessions  # Agent sessions
    │   └── checkpoints     # Checkpoint metadata
    └── logs/              # Task operation logs
```

**Task Record Schema:**
```sql
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  submodule TEXT NOT NULL,
  workspace_path TEXT NOT NULL,
  container_id TEXT UNIQUE,
  status TEXT NOT NULL,
  lock_mode TEXT NOT NULL DEFAULT 'exclusive',
  locked_by TEXT,
  parent_task_id TEXT,
  task_type TEXT DEFAULT 'main',
  dependencies TEXT,
  integration_target TEXT,
  created_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP NOT NULL,
  metadata JSON
);

CREATE INDEX idx_parent_task ON tasks(parent_task_id);
CREATE INDEX idx_status ON tasks(status);
```

### Integration Points

1. **MCP Server**: Task-based Docker Sandbox operations
2. **Hooks**: Task lifecycle, git branching, Plan.md management, safety
3. **Custom Agent**: Docker Sandbox Agent for orchestration
4. **Sisyphus Integration**: Parent-child task coordination in ultrawork mode
5. **User Commands**: 15 commands for task management and inspection
6. **Task Registry**: SQLite database tracking all tasks and containers

## Multi-Layer Persistence Strategy

### Container Filesystem Structure

```
/var/task-workspace/                    # Task workspace (bind mounted)
├── .task-memory/                    # Persistence layer (git-tracked)
│   ├── state.json                    # Layer 1: Fast state load
│   ├── conversations.jsonl            # Layer 2: Conversation log
│   ├── executions.jsonl               # Layer 2: Execution log
│   ├── decisions.md                  # Layer 3: Decisions
│   └── checkpoints/                 # Layer 4: Restore points
│       ├── checkpoint-001/
│       │   ├── metadata.json
│       │   ├── state.json
│       │   └── filesystem-snapshot.tar.gz
│       └── checkpoint-002/
├── Plan.md                          # Task plan (git-tracked)
├── README.md                         # Task description (git-tracked)
└── [task source code]              # Actual work (git-tracked)
```

### Layer 1: state.json (Fast Restore)

```json
{
  "task_id": "task-add-oauth-12345",
  "created_at": "2026-01-17T10:00:00Z",
  "branch": "planner-sisyphus-claude-opus-4.5/add-oauth",
  "submodule": "feature-oauth",
  "status": "active",
  "current_agent": {
    "name": "planner-sisyphus",
    "model": "claude-opus-4.5",
    "session_id": "ses_abc123",
    "attached_at": "2026-01-17T11:30:00Z"
  },
  "lock_mode": "exclusive",
  "todos": [
    {"id": 1, "text": "Setup OAuth flow", "status": "completed"},
    {"id": 2, "text": "Implement token refresh", "status": "in_progress", "progress": 45}
  ],
  "metrics": {
    "total_sessions": 3,
    "total_iterations": 28,
    "total_tool_calls": 156,
    "agents_used": ["planner-sisyphus", "oracle", "librarian"],
    "checkpoints_created": 3
  },
  "current_checkpoint": null
}
```

**Purpose**: Fast load for new agents (under 100ms)

---

### Layer 2: JSONL Logs (Append-Only History)

```jsonl
// conversations.jsonl
{"timestamp":"2026-01-17T10:00:00Z","session_id":"ses_abc123","role":"user","message":"Create OAuth flow"}
{"timestamp":"2026-01-17T10:05:00Z","session_id":"ses_abc123","role":"assistant","message":"I'll create OAuth flow"}
{"timestamp":"2026-01-17T11:30:00Z","session_id":"ses_def456","role":"user","message":"Resume task"}

// executions.jsonl
{"timestamp":"2026-01-17T10:10:00Z","session_id":"ses_abc123","tool":"bash","command":"npm install","success":true}
{"timestamp":"2026-01-17T10:15:00Z","session_id":"ses_abc123","tool":"write","path":"src/auth.ts","success":true}
```

**Purpose**: Complete history, append-only, git-friendly, merge-safe

---

### Layer 3: decisions.md (Human Reviewable)

```markdown
# Decisions Log

## 2026-01-17 10:30:00Z
**Agent**: planner-sisyphus
**Context**: Choosing OAuth library

**Decision**: Use `next-auth` instead of custom OAuth

**Rationale**:
- Built-in session management
- Better security handling
- Less code to maintain

**Alternatives Considered**:
- Custom OAuth: Too much boilerplate
- Auth0: Vendor lock-in, cost
```

**Purpose**: Human-readable, reviewable, git-tracked

---

### Layer 4: checkpoints/ (Restore Points)

**Checkpoint Structure**:
```
checkpoint-001/
├── metadata.json          # Description, agent info, timestamp
├── state.json            # Snapshot of task state
└── filesystem-snapshot.tar.gz  # Full filesystem state
```

**Purpose**: Named restore points, full rollback capability

---

## Implementation Plan

### Phase 1: Task Registry Setup

#### 1.1 SQLite Database Implementation
- [ ] Create task registry database schema:
  ```sql
  CREATE TABLE tasks (...);
  CREATE TABLE agent_sessions (...);
  CREATE TABLE checkpoints (...);
  ```
- [ ] Implement database operations:
  - Create task record
  - Update task status
  - Register agent session
  - Query tasks by filters
- [ ] Add indexes for performance
- [ ] Implement backup/restore for registry

#### 1.2 Task Registry Service
- [ ] Create TaskRegistry class:
  ```typescript
  class TaskRegistry {
    - createTask(task: TaskRecord)
    - getTask(taskId: string)
    - listTasks(filters: TaskFilters)
    - updateTaskStatus(taskId: string, status: string)
    - registerAgentSession(session: AgentSession)
    - registerCheckpoint(checkpoint: CheckpointRecord)
  }
  ```
- [ ] Implement orphaned task detection (background job)
- [ ] Add task cleanup scheduling


### Phase 2: Docker Sandbox MCP Server (Updated)

#### 2.1 MCP Server Architecture
- [ ] Create MCP server structure:
  ```
  mcp-docker-sandbox/
  ├── src/
  │   ├── server.ts              # MCP server implementation
  │   ├── task-registry.ts      # SQLite operations
  │   ├── docker-manager.ts      # Docker operations
  │   ├── persistence.ts        # Multi-layer persistence
  │   └── tools/                 # MCP tool definitions
  │       ├── create-task-sandbox.ts
  │       ├── attach-agent-to-task.ts
  │       ├── detach-agent-from-task.ts
  │       ├── execute-in-task.ts
  │       ├── list-active-tasks.ts
  │       ├── create-task-checkpoint.ts
  │       ├── restore-task-checkpoint.ts
  │       └── complete-task.ts
  ├── package.json
  ├── tsconfig.json
  └── README.md
  ```

#### 2.2 MCP Tool Definitions

- [ ] **create_task_sandbox**:
  ```typescript
  create_task_sandbox({
    task_id: string,              // Unique task identifier
    task_description: string,       // For git branch/submodule
    workspace_path: string,        // Host path to mount
    resource_limits?: {
      memory?: string,
      cpu?: number
    },
    lock_mode?: 'exclusive' | 'collaborative',  // Configurable
    resume_if_exists?: boolean     // Auto-resume if task_id exists
  }): Promise<{
    container_id: string,
    task_id: string,
    status: 'created' | 'resumed',
    existing_container?: boolean
  }>
  ```

- [ ] **attach_agent_to_task**:
  ```typescript
  attach_agent_to_task({
    task_id: string,
    agent_name: string,
    agent_model: string,
    session_id: string
  }): Promise<{
    success: boolean,
    container_id: string,
    restored_state?: {
      todos: Todo[],
      conversations: Conversation[],
      executions: ExecutionLog[]
    },
    error?: string
  }>
  ```

- [ ] **detach_agent_from_task**:
  ```typescript
  detach_agent_from_task({
    task_id: string,
    session_id: string,
    save_checkpoint?: boolean,
    checkpoint_name?: string
  }): Promise<{
    success: boolean,
    checkpoint_id?: string,
    error?: string
  }>
  ```

- [ ] **execute_in_task**:
  ```typescript
  execute_in_task({
    task_id: string,
    command: string,
    workdir?: string,
    log_execution?: boolean
  }): Promise<{
    stdout: string,
    stderr: string,
    exit_code: number
  }>
  ```

- [ ] **list_active_tasks**:
  ```typescript
  list_active_tasks(): Promise<Array<{
    task_id: string,
    branch: string,
    submodule: string,
    status: 'active' | 'paused' | 'completed',
    container_id: string,
    current_agent?: string,
    created_at: string,
    last_active: string
  }>>
  ```

- [ ] **create_task_checkpoint**:
  ```typescript
  create_task_checkpoint({
    task_id: string,
    checkpoint_name: string,
    description?: string,
    include_filesystem_snapshot?: boolean
  }): Promise<{
    checkpoint_id: string,
    path: string
  }>
  ```

- [ ] **restore_task_checkpoint**:
  ```typescript
  restore_task_checkpoint({
    task_id: string,
    checkpoint_id: string
  }): Promise<{
    success: boolean,
    restored_from: string,
    error?: string
  }>
  ```

- [ ] **complete_task**:
  ```typescript
  complete_task({
    task_id: string,
    cleanup_after?: number,  // Hours to preserve
    create_final_checkpoint?: boolean
  }): Promise<{
    success: boolean,
    container_removed: boolean,
    final_checkpoint_id?: string
  }>
  ```

#### 2.3 Docker Integration
- [ ] Implement Docker API integration using Dockerode
- [ ] Create base Docker images:
  - `opencode-sandbox-base`: Ubuntu 22.04 + common tools (git, node, python)
  - `opencode-sandbox-developer`: Base + dev tools (npm, pip, cargo)
- [ ] Implement volume management:
  - Bind mount workspace to container
  - Persistent `.task-memory/` directory
  - Automatic cleanup on session end (optional delay)
- [ ] Implement network isolation:
  - Isolated bridge networks per task
  - Whitelist-based network access
  - DNS configuration for internal services

#### 2.4 Multi-Layer Persistence Implementation
- [ ] Implement persistence layer:
  ```typescript
  class TaskPersistence {
    - loadState(taskId: string): Promise<TaskState>
    - saveState(taskId: string, state: TaskState): Promise<void>
    - appendConversation(taskId: string, msg: Conversation): Promise<void>
    - appendExecution(taskId: string, exec: Execution): Promise<void>
    - logDecision(taskId: string, decision: Decision): Promise<void>
    - createCheckpoint(taskId: string, name: string): Promise<Checkpoint>
    - restoreCheckpoint(taskId: string, checkpointId: string): Promise<void>
    - recoverFromLogs(taskId: string): Promise<TaskState>
  }
  ```
- [ ] Implement state.json fast load (target <100ms)
- [ ] Implement JSONL append-only logs (merge-safe)
- [ ] Implement checkpoint snapshots with tar.gz
- [ ] Implement state corruption recovery

#### 2.5 MCP Server Registration
- [ ] Create OpenCode MCP configuration:
  ```json
  {
    "mcp": {
      "docker-sandbox": {
        "type": "local",
        "command": ["node", "/path/to/mcp-docker-sandbox/dist/server.js"],
        "enabled": true
      }
    }
  }
  ```


### Phase 3: Hooks System (Updated)

#### 3.1 Task Lifecycle Hooks (NEW)

- [ ] **task-lifecycle-manager** hook:
  ```typescript
  export const taskLifecycleManager: Hook = {
    name: 'task-lifecycle-manager',
    event: ['on_session_start', 'on_session_end'],
    async execute(context) {
      const session = context.session;
      
      if (session.event === 'on_session_start') {
        // Check if resuming existing task
        const taskId = extractTaskId(context.message);
        
        if (taskId) {
          // Resume existing task
          await mcp_docker_sandbox.attach_agent_to_task({
            task_id: taskId,
            agent_name: session.agent.name,
            agent_model: session.agent.model,
            session_id: session.id
          });
          
          // Load task context into session
          const state = await loadTaskState(taskId);
          context.session.task = state;
        } else {
          // Start new task
          const taskId = generateTaskId();
          await mcp_docker_sandbox.create_task_sandbox({
            task_id: taskId,
            task_description: context.message.content,
            workspace_path: context.workspace,
            lock_mode: 'exclusive',  // Default
            resume_if_exists: false
          });
          
          context.session.task_id = taskId;
        }
      } else if (session.event === 'on_session_end') {
        // Detach agent from task
        if (context.session.task_id) {
          await mcp_docker_sandbox.detach_agent_from_task({
            task_id: context.session.task_id,
            session_id: session.id,
            save_checkpoint: false
          });
        }
      }
      
      return { success: true };
    }
  };
  ```

#### 3.2 Git Branching Hooks (UPDATED)

- [ ] **pre-task-branch-creator** hook (updated for task-based):
  ```typescript
  export const preTaskBranchCreator: Hook = {
    name: 'pre-task-branch-creator',
    event: ['on_task_start'],  // Triggered after task container created
    async execute(context) {
      const task = context.task;
      const branchName = createBranchName(
        task.current_agent.name,
        task.current_agent.model,
        task.task_description
      );
      
      // Create git branch in task workspace
      await createGitBranch(task.workspace, branchName);
      
      return { success: true, branch_name: branchName };
    }
  };
  ```

- [ ] **branch-name-validator** hook (unchanged):
  ```typescript
  export const branchNameValidator: Hook = {
    name: 'branch-name-validator',
    event: ['pre_tool_call'],
    filter: { tool: 'git' },
    async execute(context) {
      const toolCall = context.toolCall;
      if (toolCall.name === 'checkout' || toolCall.name === 'branch') {
        const branchName = toolCall.arguments?.name;
        if (!isValidBranchName(branchName)) {
          return {
            error: `Invalid branch name. Format: <agent>-<model>/<description>`
          };
        }
      }
      return { success: true };
    }
  };
  ```

- [ ] **submodule-creator** hook (unchanged):
  ```typescript
  export const submoduleCreator: Hook = {
    name: 'submodule-creator',
    event: ['on_task_start'],
    async execute(context) {
      const task = context.task;
      const branchName = context.git.branch;
      
      // Extract feature description
      const description = extractFeatureDescription(task.task_description);
      const submodulePath = `feature-${sanitizePath(description)}`;
      
      // Create submodule directory
      await createDirectory(submodulePath);
      
      // Initialize git within submodule
      await executeInSubmodule(submodulePath, 'git init');
      
      return { success: true, submodule_path: submodulePath };
    }
  };
  ```

#### 3.3 Plan.md Management Hooks (UPDATED)

- [ ] **plan-file-creator** hook (updated for task-based):
  ```typescript
  export const planFileCreator: Hook = {
    name: 'plan-file-creator',
    event: ['on_task_start'],
    async execute(context) {
      const task = context.task;
      const planContent = generatePlanTemplate(task);
      
      // Create Plan.md in task workspace (git-tracked)
      await writeFile(`${task.workspace}/Plan.md`, planContent);
      
      // Initialize .task-memory/ structure
      await initializeTaskMemory(task.workspace);
      
      return { success: true };
    }
  };
  ```

- [ ] **plan-updater** hook (updated for task persistence):
  ```typescript
  export const planUpdater: Hook = {
    name: 'plan-updater',
    event: ['on_tool_complete'],
    filter: { tool: ['write', 'edit', 'bash'] },
    async execute(context) {
      const task = context.task;
      const toolResult = context.toolResult;
      
      // Update iteration log in Plan.md
      await appendToPlan(task.workspace, '## Iteration Log', {
        timestamp: new Date().toISOString(),
        tool: toolResult.tool,
        action: summarizeAction(toolResult),
        status: toolResult.success ? 'success' : 'failed',
        agent: task.current_agent.name
      });
      
      // Also log to .task-memory/executions.jsonl
      await appendToExecutionLog(task.workspace, {
        timestamp: new Date().toISOString(),
        session_id: task.current_agent.session_id,
        tool: toolResult.tool,
        command: toolResult.arguments,
        result: toolResult.success,
        output: truncateOutput(toolResult.output)
      });
      
      // Update todos in state.json
      if (toolResult.affected_todos) {
        await updateTaskState(task.workspace, {
          todos: toolResult.affected_todos
        });
      }
      
      return { success: true };
    }
  };
  ```

- [ ] **plan-finalizer** hook (updated for task-based):
  ```typescript
  export const planFinalizer: Hook = {
    name: 'plan-finalizer',
    event: ['on_task_complete'],
    async execute(context) {
      const task = context.task;
      
      // Update Plan.md with final summary
      const summary = {
        completed_at: new Date().toISOString(),
        total_sessions: task.metrics.total_sessions,
        total_iterations: task.metrics.total_iterations,
        agents_used: task.metrics.agents_used,
        checkpoints_created: task.metrics.checkpoints_created,
        success: task.status === 'completed'
      };
      
      await appendToPlan(task.workspace, '## Final Summary', summary);
      
      // Complete task
      await mcp_docker_sandbox.complete_task({
        task_id: task.task_id,
        cleanup_after: 24,
        create_final_checkpoint: true
      });
      
      // Commit to git
      await commitTaskToGit(task.workspace, {
        message: `Complete task: ${task.task_id}`,
        include_task_memory: true
      });
      
      return { success: true };
    }
  };
  ```

#### 3.4 Checkpoint Hooks (NEW)

- [ ] **checkpoint-creator** hook:
  ```typescript
  export const checkpointCreator: Hook = {
    name: 'checkpoint-creator',
    event: ['on_user_command'],  // Triggered by user: /checkpoint
    async execute(context) {
      const task = context.task;
      const checkpointName = extractCheckpointName(context.message);
      
      const result = await mcp_docker_sandbox.create_task_checkpoint({
        task_id: task.task_id,
        checkpoint_name: checkpointName,
        description: context.message.content,
        include_filesystem_snapshot: true
      });
      
      // Log to decisions.md
      await logDecision(task.workspace, {
        type: 'checkpoint',
        checkpoint_id: result.checkpoint_id,
        created_by: task.current_agent.name
      });
      
      return { 
        success: true, 
        message: `Checkpoint ${checkpointName} created` 
      };
    }
  };
  ```

- [ ] **task-resumer** hook:
  ```typescript
  export const taskResumer: Hook = {
    name: 'task-resumer',
    event: ['on_user_command'],  // Triggered by user: /resume <task_id>
    async execute(context) {
      const taskId = extractTaskId(context.message);
      
      // Validate task exists
      const taskInfo = await mcp_docker_sandbox.list_active_tasks();
      const task = taskInfo.find(t => t.task_id === taskId);
      
      if (!task) {
        return {
          error: `Task ${taskId} not found. Use /list-tasks to see active tasks.`
        };
      }
      
      if (task.status === 'completed') {
        return {
          error: `Task ${taskId} is completed. Cannot resume.`
        };
      }
      
      // Attach new session to task
      const result = await mcp_docker_sandbox.attach_agent_to_task({
        task_id: taskId,
        agent_name: context.session.agent.name,
        agent_model: context.session.agent.model,
        session_id: context.session.id
      });
      
      // Load context
      context.session.task = result.restored_state;
      context.session.task_id = taskId;
      
      return { 
        success: true, 
        message: `Resumed task ${taskId}\nTodos: ${formatTodos(result.restored_state.todos)}` 
      };
    }
  };
  ```


#### 3.4.1 Auto-Checkpoint Hooks (NEW)

**Strategy**: Hybrid Manual + Auto + Risk-Based Safety

- **Auto**: Checkpoint when major todo completes
- **Risk-Based**: Checkpoint before dangerous operations
- **Manual**: `/checkpoint` command always available

**Todo Structure Update**:
```typescript
interface Todo {
  id: number;
  text: string;
  status: 'pending' | 'in_progress' | 'completed';
  major: boolean;  // User or auto-marked as major
  weight?: 'minor' | 'major' | 'critical';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}
```

---

#### Auto-Checkpoint Configuration

```yaml
# .opencode/auto-checkpoint-config.yaml
auto_checkpoint_triggers:
  # Primary: Major todo completion (Hybrid)
  on_major_todo:
    enabled: true
    default_markers:
      - weight: 'major'
      - priority: 'critical'
      - estimated_hours: 2
  
  # Secondary: Risk-based safety
  on_risky_operation:
    enabled: true
    risky_operations:
      git: [push, merge, reset, rebase]
      bash: [/rm -rf/i, /mv.*/i]
      npm: [uninstall, publish, prune]
      maven: [clean, deploy]
      yarn: [global:remove]
  
  # Manual checkpoint always available
  manual_checkpoint_always_available: true
  
  # Checkpoint management
  checkpoint_management:
    max_checkpoints_per_task: 100
    auto_compress_old_checkpoints: true
    keep_days: 7  # Keep 7 days of history
    min_snapshot_size: '50MB'  # Only snapshot if workspace <50MB
```

---

#### 3.4.2 Major Todo Auto-Checkpoint Hook

- [ ] **auto-checkpoint-on-todo-complete** hook:
  ```typescript
  export const autoCheckpointOnTodoComplete: Hook = {
    name: 'auto-checkpoint-on-todo-complete',
    event: ['on_todo_complete'],
    async execute(context) {
      const todo = context.todo;
      const config = loadAutoCheckpointConfig();
      
      // Check if auto-checkpoint on major todo is enabled
      if (!config.on_major_todo.enabled) {
        return { success: true };
      }
      
      // Check if todo is marked as major
      const isMajor = todo.major || 
                    isMajorTodo(todo, config.on_major_todo.default_markers);
      
      if (isMajor) {
        // Create auto-checkpoint
        const result = await mcp_docker_sandbox.create_task_checkpoint({
          task_id: context.task_id,
          checkpoint_name: `auto-${sanitizeTodoName(todo.text)}`,
          description: `Auto-checkpoint after completing major todo: ${todo.text}`,
          include_filesystem_snapshot: true
        });
        
        // Log to decisions.md
        await logDecision(task.workspace, {
          type: 'auto-checkpoint',
          checkpoint_id: result.checkpoint_id,
          todo_id: todo.id,
          todo_text: todo.text,
          created_by: task.current_agent.name,
          trigger: 'major_todo_complete'
        });
        
        // Update Plan.md iteration log
        await appendToPlan(task.workspace, '## Iteration Log', {
          timestamp: new Date().toISOString(),
          event: 'auto-checkpoint',
          reason: `Completed major todo: ${todo.text}`,
          checkpoint_id: result.checkpoint_id
        });
        
        return {
          success: true,
          message: `Auto-checkpoint created after major todo ${todo.text}`
        };
      }
      
      return { success: true };
    }
  };
  ```

---

#### 3.4.3 Risk-Based Auto-Checkpoint Hook

- [ ] **risk-based-auto-checkpoint** hook:
  ```typescript
  export const riskBasedAutoCheckpoint: Hook = {
    name: 'risk-based-auto-checkpoint',
    event: ['pre_tool_call'],
    async execute(context) {
      const toolCall = context.toolCall;
      const config = loadAutoCheckpointConfig();
      
      // Check if risk-based checkpoint is enabled
      if (!config.on_risky_operation.enabled) {
        return { success: true };
      }
      
      // Define risky operations
      const isRisky = isRiskyOperation(toolCall, config.on_risky_operation.risky_operations);
      
      if (isRisky) {
        // Create checkpoint before risky operation
        const result = await mcp_docker_sandbox.create_task_checkpoint({
          task_id: context.task_id,
          checkpoint_name: `before-risky-${toolCall.name}`,
          description: `Auto-checkpoint before risky operation: ${toolCall.name}`,
          include_filesystem_snapshot: true
        });
        
        // Log to decisions.md
        await logDecision(task.workspace, {
          type: 'risk-based-checkpoint',
          checkpoint_id: result.checkpoint_id,
          risky_operation: toolCall.name,
          operation_details: toolCall.arguments,
          created_by: task.current_agent.name,
          trigger: 'pre_risky_operation'
        });
        
        // Update Plan.md
        await appendToPlan(task.workspace, '## Iteration Log', {
          timestamp: new Date().toISOString(),
          event: 'auto-checkpoint',
          reason: `Before risky operation: ${toolCall.name}`,
          checkpoint_id: result.checkpoint_id,
          warning: 'Proceeding with risky operation'
        });
        
        return {
          success: true,
          message: `Auto-checkpoint created before risky ${toolCall.name}`
        };
      }
      
      return { success: true };
    }
  };
  
  // Helper function to check if operation is risky
  function isRiskyOperation(toolCall: ToolCall, riskyOps: RiskyOperations): boolean {
    if (toolCall.name === 'git') {
      const command = toolCall.arguments?.command;
      return riskyOps.git.some(cmd => command?.includes(cmd));
    }
    
    if (toolCall.name === 'bash') {
      const command = toolCall.arguments?.command;
      return riskyOps.bash.some(cmd => command?.match(cmd));
    }
    
    // Add other tools as needed
    if (toolCall.name === 'npm') {
      const command = toolCall.arguments?.command;
      return riskyOps.npm.some(cmd => command?.includes(cmd));
    }
    
    return false;
  }
  ```

---

#### 3.4.4 Checkpoint Management Hook

- [ ] **checkpoint-management** hook:
  ```typescript
  export const checkpointManagement: Hook = {
    name: 'checkpoint-management',
    event: ['on_tick'],  // Runs every minute
    async execute(context) {
      const config = loadAutoCheckpointConfig();
      const task = context.task;
      
      // Check if auto-cleanup is enabled
      if (!config.checkpoint_management.auto_compress_old_checkpoints) {
        return { success: true };
      }
      
      // Get all checkpoints for task
      const checkpoints = await listCheckpoints(task.task_id);
      const now = Date.now();
      
      // Compress old checkpoints (>7 days)
      for (const checkpoint of checkpoints) {
        const age = now - new Date(checkpoint.timestamp).getTime();
        const ageDays = age / (1000 * 60 * 60 * 24);
        
        if (ageDays > config.checkpoint_management.keep_days) {
          if (!checkpoint.compressed) {
            await compressCheckpoint(checkpoint.path);
            checkpoint.compressed = true;
          }
        }
      }
      
      // Delete old checkpoints if over limit
      if (checkpoints.length > config.checkpoint_management.max_checkpoints_per_task) {
        const excess = checkpoints.slice(config.checkpoint_management.max_checkpoints_per_task);
        for (const oldCheckpoint of excess) {
          await deleteCheckpoint(oldCheckpoint.path);
        }
      }
      
      return { success: true };
    }
  };
  
  async function compressCheckpoint(path: string): Promise<void> {
    const tarGz = await createTarGz(path);
    await fs.unlink(path);  // Delete original uncompressed checkpoint
    await fs.rename(tarGz, path + '.tar.gz');
  }
  ```

---

#### Auto-Checkpoint Behavior Examples

**Example 1: Major Todo Auto-Checkpoint**
```
Agent: planner-sisyphus
Task: Build OAuth feature

Plan:
- [x] 1. Setup OAuth flow (major)
- [ ] 2. Implement token refresh (major)
- [ ] 3. Add login UI

When todo 1 completes:
→ Auto-checkpoint created: "auto-setup-oauth-flow"
→ state.json updated
→ Plan.md iteration log updated
→ decisions.md logged
→ Filesystem snapshot saved
```

**Example 2: Risk-Based Auto-Checkpoint**
```
Agent: planner-sisyphus
Task: Build OAuth feature

Action: User requests git push
→ Pre-tool-call hook fires
→ git push detected as risky
→ Auto-checkpoint created: "before-risky-git-push"
→ decisions.md logged with operation details
→ Plan.md warning added
→ Proceeds with git push

If push fails:
→ User can restore checkpoint: /restore-checkpoint before-risky-git-push
→ Exact state before push is restored
```

**Example 3: Manual Checkpoint Always Available**
```
Agent: oracle
Task: Design OAuth architecture

User: /checkpoint after-design-review
→ Manual checkpoint created: "after-design-review"
→ Not marked as "auto" in logs
→ User has full control
→ Works alongside auto-checkpoints
```

---

---

### How Operations Are Classified as "Risky"

**Risk Assessment Framework**:

An operation is considered "risky" if it meets ANY of these criteria:

1. **Irreversible Data Loss**: Operation cannot be easily undone
   - Deleting large sets of files
   - Overwriting important files
   - Removing directories recursively
   - Moving all files in a directory

2. **Git Repository State Changes**: Operations that affect git history
   - Pushing to remote (overwrites remote state)
   - Merging branches (creates merge commits)
   - Resetting to different commit (loses history)
   - Rebasing (rewrites history)
   - Force pushing (--force)

3. **Production/Deployment Impact**: Changes that go to production systems
   - Publishing packages to npm/PyPI
   - Deploying applications
   - Running deployment scripts
   - Publishing containers to registries
   - Database migrations (cannot be easily rolled back)

4. **Destructive File Operations**: Operations that permanently modify or delete
   - Recursive file deletion (rm -rf)
   - Moving entire directories (mv *)
   - Bulk renaming
   - Changing file permissions recursively
   - Changing ownership

5. **Package/System Management**: Operations that affect installed packages
   - Uninstalling packages (removes dependencies)
   - Pruning dependencies (can break applications)
   - Global package removals
   - Lock file updates (can lock projects)

**Risk Levels**:
- **HIGH**: Irreversible + production impact
- **MEDIUM**: Irreversible OR production impact
- **LOW**: Reversible but could cause issues

---

### Risk Detection Algorithm

```typescript
/**
 * Risk Assessment Engine
 * Determines if an operation should trigger auto-checkpoint
 */
class RiskAssessmentEngine {
  /**
   * Assess operation risk level
   * Returns: 'high' | 'medium' | 'low' | 'none'
   */
  assessRiskLevel(
    tool: string,
    operation: string,
    args: any
  ): RiskLevel {
    const riskScore = this.calculateRiskScore(tool, operation, args);
    
    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'medium';
    if (riskScore >= 2) return 'low';
    return 'none';
  }
  
  /**
   * Calculate risk score (0-10 scale)
   */
  private calculateRiskScore(
    tool: string,
    operation: string,
    args: any
  ): number {
    let score = 0;
    
    // Criterion 1: Irreversible Data Loss
    if (this.isIrreversibleDataLoss(operation, args)) {
      score += 4;  // High impact
    }
    
    // Criterion 2: Git Repository Changes
    if (this.isGitStateChange(operation)) {
      score += 3;  // Medium impact
    }
    
    // Criterion 3: Production/Deployment
    if (this.isProductionImpact(operation)) {
      score += 3;  // Medium impact
    }
    
    // Criterion 4: Destructive File Ops
    if (this.isDestructiveFileOp(operation, args)) {
      score += 2;  // Low-Medium impact
    }
    
    // Criterion 5: Package Management
    if (this.isPackageManagement(operation)) {
      score += 2;  // Low-Medium impact
    }
    
    return Math.min(score, 10);
  }
  
  /**
   * Check if operation causes irreversible data loss
   */
  private isIrreversibleDataLoss(operation: string, args: any): boolean {
    const destructivePatterns = [
      /rm -rf/i,              // Recursive delete
      /rm -r/i,               // Recursive remove
      /mv .*\s+\s*?\s*/i,     // Move all files
      /> .*?\/dev\/null/i,       // Write to /dev/null
      /\.tar.gz\s+rm/i,        // Archive then delete
      /truncate/i,             // Truncate files
      /overwrite/i              // Overwrite flags
    ];
    
    const command = args?.command || args;
    return destructivePatterns.some(pattern => 
      pattern.test(command)
    );
  }
  
  /**
   * Check if operation changes git repository state
   */
  private isGitStateChange(operation: string): boolean {
    const gitStateChangeOps = [
      'push', 'push --force',
      'merge', 'merge --no-ff',
      'reset', 'reset --hard', 'revert',
      'rebase', 'rebase --force',
      'cherry-pick', 'cherry-pick --abort',
      'amend', 'amend --no-edit'
    ];
    
    return gitStateChangeOps.includes(operation.toLowerCase());
  }
  
  /**
   * Check if operation impacts production
   */
  private isProductionImpact(operation: string): boolean {
    const productionOps = [
      'deploy', 'deploy:*',
      'publish', 'npm publish', 'yarn publish', 'pypi upload',
      'migrate', 'migration:run', 'migrate:fresh',
      'rollback', 'rollback:undo'
    ];
    
    return productionOps.some(op => 
      operation.toLowerCase().includes(op.toLowerCase())
    );
  }
  
  /**
   * Check if operation is destructive file operation
   */
  private isDestructiveFileOp(operation: string, args: any): boolean {
    if (operation !== 'bash' && operation !== 'execute') {
      return false;
    }
    
    const command = args?.command || '';
    const dangerousPatterns = [
      /rm\s+-r?\s+f/i,           // Recursive delete
      /rm\s+-.*?\s*\.?\*\/i,         // Delete multiple files
      /mv\s+\.?\*/i,                 // Move multiple files
      /chmod\s+-R/i,                // Recursive permission change
      /chown\s+-R/i,                // Recursive owner change
      /truncate/i                    // Truncate files
    ];
    
    return dangerousPatterns.some(pattern => 
      pattern.test(command)
    );
  }
  
  /**
   * Check if operation affects package management
   */
  private isPackageManagement(operation: string): boolean {
    const packageOps = [
      'uninstall', 'npm uninstall', 'pip uninstall',
      'prune', 'npm prune', 'yarn remove',
      'global:remove', 'npm global remove',
      'dedupe', 'npm dedupe', 'yarn dedupe'
    ];
    
    return packageOps.includes(operation.toLowerCase());
  }
}
```

---

### Adding User-Defined Risky Operations

**Configuration File**: `.opencode/auto-checkpoint-config.yaml`

```yaml
# .opencode/auto-checkpoint-config.yaml
auto_checkpoint_triggers:
  # ... other config ...
  
  # Secondary: Risk-based safety
  on_risky_operation:
    enabled: true
    
    # Built-in risky operations (can be overridden)
    risky_operations:
      # Git operations
      git: [push, merge, reset, rebase, amend]
      bash: [/rm -rf/i, /mv.*/i, /chmod -R/i]
      npm: [uninstall, publish, prune]
      maven: [clean, deploy]
      yarn: [global:remove, dedupe]
      python: [pip uninstall]
      
      # User-defined risky operations (ADDED BY USER)
      # Syntax: tool_name: [operation_patterns]
      custom:
        # Example 1: Custom file operations
        bash:
          - /delete.*database/i      # Any command with "delete database"
          - /drop.*table/i          # Any command with "drop table"
          - /clear.*cache/i           # Any command clearing cache
        
        # Example 2: Custom API calls (if you had API tools)
        http_client:
          - DELETE:/api/i             # DELETE requests to /api/*
          - PUT:/users/i              # PUT requests to /users/*
        
        # Example 3: Custom database operations
        database:
          - delete.*schema/i          # Schema deletion
          - truncate.*table/i         # Table truncation
          - drop.*collection/i         # Collection dropping
}
```

**How It Works**:

1. **Built-in Operations**: Default set of risky operations
2. **Custom Patterns**: User can add regex patterns
3. **Tool-Specific**: Define patterns per tool (bash, npm, maven, etc.)
4. **Overrides**: Custom patterns can add to or override built-ins

---

### Configuration Override Examples

**Example 1: Add Custom File Operations**

```yaml
# .opencode/auto-checkpoint-config.yaml
on_risky_operation:
  enabled: true
  risky_operations:
    bash:
      # Built-in (can be kept or overridden)
      - /rm -rf/i
      - /mv.*/i
      
      # Custom additions
      - /rm.*?\/.*\/(src|lib|dist)/i  # Delete from src/lib/dist
      - /mv.*?\/.*\/(src|build)/i        # Move from src/build
      - /overwrite/i                    # Any overwrite operation
```

**Behavior**: Any bash command matching these patterns triggers checkpoint.

---

**Example 2: Restrict to Only Specific Operations**

```yaml
# .opencode/auto-checkpoint-config.yaml
on_risky_operation:
  enabled: true
  risky_operations:
    git:
      # Only check pushes, ignore other git operations
      - push
      # Remove merge, reset, rebase from built-ins
      - merge
      - reset
      - rebase
      
    bash:
      # Only check recursive delete
      - /rm -rf/i
      # Remove other bash patterns
```

**Behavior**: Only git push and recursive delete trigger checkpoints.

---

**Example 3: Team-Specific Configuration**

```yaml
# .opencode/auto-checkpoint-config.yaml
on_risky_operation:
  enabled: true
  risky_operations:
    # Production deployment rules
    production_ops:
      - deploy:/production/i      # Deploy to production env
      - publish:production/i         # Publish to production
      
    # Database operations (if using databases)
    database:
      - drop:schema/i              # Drop entire schema
      - truncate:table/i            # Truncate large tables
      - delete.*data/i             # Delete data files
```

**Behavior**: Production-related operations trigger checkpoints.

---

**Example 4: Risk Scoring Threshold**

```yaml
# .opencode/auto-checkpoint-config.yaml
on_risky_operation:
  enabled: true
  
  # Configure risk assessment thresholds
  risk_thresholds:
    # Only trigger checkpoint for high-risk operations (score >= 8)
    high_only: false
    
    # If high_only: true, medium (4-7) and low (2-3) don't trigger
    # Default: all risk levels (low, medium, high) trigger
```

**Behavior**: Adjust sensitivity of auto-checkpointing.

---

**Example 5: Add Custom Tool Risk Patterns**

```yaml
# .opencode/auto-checkpoint-config.yaml
on_risky_operation:
  enabled: true
  risky_operations:
    # Add custom tool type
    custom_tool: docker_compose
      
    docker_compose:
      # Risky operations in docker-compose
      - /docker-compose down/i     # Stop and remove containers
      - /docker-compose rm/i        # Remove containers
      - /volume\s+rm/i             # Remove volumes
      - /network\s+rm/i            # Remove networks
```

**Behavior**: Custom tools can define their own risky patterns.

---

### User Interface for Managing Risky Operations

**Command**: `/configure-risky-operations`

**Usage**:
```
/configure-risky-operations [options]

Options:
  --list              List current risky operation patterns
  --add               Add new pattern (tool:pattern)
  --remove            Remove pattern (tool:pattern)
  --test <tool> <cmd> Test if operation triggers checkpoint
  --reload            Reload configuration from file
  --reset             Reset to built-in defaults
```

**Examples**:
```
# List all risky operations
/configure-risky-operations --list

Output:
Git Operations:
  - push
  - merge
  - reset
  - rebase

Bash Operations:
  - /rm -rf/i
  - /mv.*/i

NPM Operations:
  - uninstall
  - publish
  - prune

---

# Add custom bash pattern
/configure-risky-operations --add bash:/drop.*database/i

Added: bash:/drop.*database/i
Reason: Any bash command matching "drop database" triggers checkpoint

---

# Test an operation
/configure-risky-operations --test bash "rm -rf /tmp/test"

Result: ✓ Pattern /rm -rf/i matches
       ✓ Risk level: HIGH (score: 9)
       ✓ Auto-checkpoint would be triggered

---

# Remove a pattern
/configure-risky-operations --remove bash:/mv.*/i

Removed: bash:/mv.*/i
```

---

### Risk Assessment Best Practices

**For Users**:

1. **Start Conservative**: Use built-in patterns first
2. **Add Gradually**: Add custom patterns as needed
3. **Test Patterns**: Use `/configure-risky-operations --test` before committing
4. **Review Checkpoints**: Check `decisions.md` for auto-checkpoint logs
5. **False Positives**: If too many checkpoints, adjust patterns

**For Teams**:

1. **Document Team Rules**: Create team-specific config files
2. **Share Patterns**: Document custom patterns for team members
3. **Regular Reviews**: Quarterly review of risky operation patterns
4. **Use `high_only`** in production: Reduce false positives
5. **Per-Project Configs**: Different rules for different project types

---



#### 3.5 Safety Hooks (UNCHANGED)

- [ ] **container-safety-enforcer** hook:
  ```typescript
  export const containerSafetyEnforcer: Hook = {
    name: 'container-safety-enforcer',
    event: ['pre_tool_call'],
    filter: { tool: ['bash', 'execute'] },
    async execute(context) {
      const toolCall = context.toolCall;
      
      // Check if command is running in sandbox
      const inSandbox = isRunningInSandbox(context);
      
      if (!inSandbox) {
        return {
          error: 'Commands must run in Docker sandbox. Use docker_sandbox MCP tool.'
        };
      }
      
      // Validate command safety
      const command = toolCall.arguments?.command;
      if (isDangerousCommand(command)) {
        return {
          error: 'Dangerous command detected. This may compromise safety.'
        };
      }
      
      return { success: true };
    }
  };
  ```

- [ ] **resource-limit-monitor** hook:
  ```typescript
  export const resourceLimitMonitor: Hook = {
    name: 'resource-limit-monitor',
    event: ['on_tick'],
    async execute(context) {
      const sandboxId = context.sandbox.id;
      
      // Get resource usage
      const usage = await getDockerSandboxStats(sandboxId);
      
      // Check limits
      if (usage.memory > context.sandbox.limits.memory) {
        await notifyUser(`Memory limit exceeded: ${usage.memory}`);
      }
      
      if (usage.cpu > context.sandbox.limits.cpu * 100) {
        await notifyUser(`CPU limit exceeded: ${usage.cpu}%`);
      }
      
      return { success: true };
    }
  };
  ```

- [ ] **isolation-checker** hook:
  ```typescript
  export const isolationChecker: Hook = {
    name: 'isolation-checker',
    event: ['post_tool_call'],
    filter: { tool: ['bash', 'execute', 'write', 'read'] },
    async execute(context) {
      // Check for filesystem boundary violations
      const accessedPath = context.toolCall.arguments?.path;
      
      if (isOutsideWorkspace(accessedPath, context.workspace)) {
        await notifyUser('Access outside workspace detected!');
        await logSecurityEvent('isolation_violation', {
          path: accessedPath,
          workspace: context.workspace
        });
      }
      
      return { success: true };
    }
  };
  ```


### Phase 4: Ultrawork Mode with Task-Based Containers

#### 4.1 Parent-Child Task Model
- [ ] Extend task schema for hierarchical tasks:
  ```sql
  ALTER TABLE tasks ADD COLUMN parent_task_id TEXT;
  ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT '"main"';
  ALTER TABLE tasks ADD COLUMN dependencies TEXT;
  ALTER TABLE tasks ADD COLUMN integration_target TEXT;
  
  CREATE INDEX idx_parent_task ON tasks(parent_task_id);
  CREATE INDEX idx_dependencies ON tasks(dependencies);
  ```

#### 4.2 Task Decomposition
- [ ] Implement task decomposer:
  ```typescript
  async function decomposeTask(taskDescription: string, options: {
    max_subtasks: number,
    require_independent: boolean
  }): Promise<Subtask[]>
  ```
- [ ] Create parent task for coordination
- [ ] Create subtask containers in parallel
- [ ] Assign agents to subtasks based on category
- [ ] Establish parent-child relationships in registry

#### 4.3 Parallel Subtask Execution
- [ ] Implement subtask monitor:
  ```typescript
  async function monitorSubtasks(parentTaskId: string) {
    const subtasks = await getChildTasks(parentTaskId);
    
    // Launch agents for each subtask
    const sessions = subtasks.map(async (subtask) => {
      return await launchAgentSession({
        task_id: subtask.task_id,
        agent: subtask.assigned_agent,
        model: getAgentModel(subtask.assigned_agent)
      });
    });
    
    // Monitor subtask progress
    const monitor = setInterval(async () => {
      const statuses = await Promise.all(
        subtasks.map(t => getTaskStatus(t.task_id))
      );
      
      // Update parent Plan.md
      await updateParentPlanStatus(parentTaskId, statuses);
      
      // Check if all complete
      if (statuses.every(s => s.status === '"completed"')) {
        clearInterval(monitor);
        await integrateSubtasks(parentTaskId, subtasks);
      }
    }, 5000);
  }
  ```
- [ ] Handle subtask dependencies (topological sort)

#### 4.4 Subtask Integration
- [ ] Implement subtask result merging:
  ```typescript
  async function integrateSubtasks(parentTaskId: string, subtasks: Subtask[]) {
    const parentWorkspace = await getWorkspace(parentTaskId);
    
    for (const subtask of subtasks) {
      const subtaskWorkspace = await getWorkspace(subtask.task_id);
      
      // Copy outputs to parent
      if (subtask.integration_target) {
        await copyDirectory(
          subtaskWorkspace + subtask.output_path,
          parentWorkspace + subtask.integration_target
        );
      }
      
      // Merge git history
      await executeGitCommand(parentWorkspace, {
        command: '"git merge',
        args: ['--allow-unrelated-histories', subtask.branch]
      });
      
      // Update subtask status
      await updateTaskRecord(subtask.task_id, {
        status: '"completed"',
        merged_at: new Date().toISOString()
      });
    }
    
    // Update parent Plan.md
    await appendToPlan(parentWorkspace, '"## Integration Complete"', {
      subtasks_integrated: subtasks.length,
      integration_timestamp: new Date().toISOString()
    });
  }
  ```
- [ ] Update main Plan.md with subtask coordination table
- [ ] Handle merge conflicts from subtasks

### Phase 5: User Commands (NEW)

#### 5.1 Task Management Commands

- [ ] **/create-task**: Create new task with options
- [ ] **/resume-task**: Resume existing task
- [ ] **/list-tasks**: List all active tasks with status
- [ ] **/detach**: Detach current agent with optional checkpoint
- [ ] **/complete-task**: Mark task complete with preservation options
- [ ] **/cleanup-task**: Remove task container immediately

#### 5.2 Checkpoint Commands

- [ ] **/checkpoint**: Create manual checkpoint
- [ ] **/restore-checkpoint**: Restore from checkpoint

#### 5.3 Ultrawork Mode Commands

- [ ] **/ultrawork**: Execute task in parallel mode
- [ ] **/subtask-status**: Check subtask progress for parent task

#### 5.4 Task Memory Inspection Commands

- [ ] **/task-history**: View task conversation history
- [ ] **/task-executions**: View execution log
- [ ] **/task-decisions**: View decision log
- [ ] **/find-task**: Find task by metadata
- [ ] **/task-stats**: Get task statistics

### Phase 6: State Machine Diagrams (UPDATED)

All state machine diagrams have been updated to reflect task-based container lifecycle:

1. **Single Agent Execution Flow**: Now shows task-based lifecycle (Create → Resume → Complete)
2. **Parallel Ultrawork Mode Flow**: Shows parent-child task hierarchy
3. **Hooks Event Lifecycle**: Updated with new task lifecycle hooks
4. **Error Recovery State Machine**: Task-based error handling
5. **Hook Execution Order**: Updated with new hooks
6. **Event Timeline**: Updated timeline for task-based workflow

### Phase 7: Testing Strategy (UPDATED)

#### 7.1 Unit Tests

- [ ] Task lifecycle tests (Create, Resume, Complete)
- [ ] Persistence layer tests (state.json, JSONL, checkpoints)
- [ ] Multi-layer persistence tests (Fast restore, Log recovery)
- [ ] Task registry tests (CRUD operations)
- [ ] Parent-child task relationship tests

#### 7.2 Integration Tests

- [ ] Full task workflow test (Create → Resume → Complete)
- [ ] Ultrawork mode tests (Parent + subtasks)
- [ ] Checkpoint create/restore tests
- [ ] Subtask integration tests

#### 7.3 End-to-End Tests

- [ ] Complete ultrawork scenario test
- [ ] Session persistence across restarts test
- [ ] Multiple agent sessions per task test

#### 7.4 Error Recovery Tests

- [ ] Container not found recovery
- [ ] Lock conflict handling
- [ ] Memory corruption recovery
- [ ] Checkpoint restore failure
- [ ] Concurrent write conflicts
- [ ] Resource exhaustion handling
- [ ] Task orphan detection


## Technical Requirements

### Dependencies
- **OpenCode**: Latest version with MCP support
- **oh-my-opencode**: v2.9.0+ (for hooks and Sisyphus)
- **Docker Desktop**: 4.50+ (for Docker Sandboxes)
- **Node.js**: 20+ (for MCP server)
- **TypeScript**: 5+ (for type safety)
- **Dockerode**: 4+ (for Docker API)
- **SQLite3**: Latest (for task registry)

### Environment Variables

```bash
# OpenCode
OPENCODE_CONFIG_PATH=/path/to/.opencode

# Docker Sandbox MCP
DOCKER_SANDBOX_WORKSPACE_BASE=/var/task-workspace
DOCKER_SANDBOX_DEFAULT_IMAGE=opencode-sandbox-developer:latest
DOCKER_SANDBOX_RESOURCE_MEMORY=4GB
DOCKER_SANDBOX_RESOURCE_CPU=2

# Task Registry
TASK_REGISTRY_PATH=/path/to/.opencode/task-registry/tasks.db

# Git
GIT_REPO_PATH=/path/to/repo
GIT_DEFAULT_BRANCH=main

# OpenCode Hooks
OPENCODE_HOOKS_ENABLED=[task-lifecycle-manager,pre-task-branch-creator,submodule-creator,plan-file-creator,plan-updater,plan-finalizer,checkpoint-creator,task-resumer,container-safety-enforcer,resource-limit-monitor,isolation-checker]
```

## Success Criteria

1. ✅ Task-based container lifecycle (one container per task, persists across sessions)
2. ✅ Multi-layer memory persistence (state.json, JSONL logs, decisions.md, checkpoints)
3. ✅ Session persistence (resume any task with exact filesystem state)
4. ✅ Agent flexibility (switch agents mid-task without losing progress)
5. ✅ Checkpointing (rollback to any point with full filesystem snapshots)
6. ✅ Git branches automatically created with `<agent>-<model>/<description>` pattern
7. ✅ Plan.md files created at submodule root with iteration tracking
8. ✅ Submodules auto-created with descriptive names
9. ✅ All task memory git-tracked (`.task-memory/` directory)
10. ✅ Safety mechanisms enforced through hooks (no workspace escapes)
11. ✅ Ultrawork mode with parent-child task hierarchy
12. ✅ Parallel subtask execution with independent persistent containers
13. ✅ Subtask integration to parent task
14. ✅ Configurable locking (exclusive or collaborative modes)
15. ✅ 15 user commands for task management
16. ✅ Task registry with SQLite on host
17. ✅ Error recovery strategies for all error types
18. ✅ Test coverage >80%
19. ✅ Comprehensive documentation
20. ✅ State machine diagrams updated for task-based workflow

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Docker API changes (experimental feature) | High | Build abstraction layer, track Docker updates, MCP tool versioning |
| Task registry database corruption | Medium | SQLite backup/restore, recovery from container metadata |
| Multiple agents write conflicts | Medium | Atomic writes, retry with backoff, append-only logs |
| Memory corruption (state.json) | Medium | Reconstruct from JSONL logs, backup corrupted files |
| Checkpoint restore failures | Low | Multiple recovery options (another checkpoint, git restore, new checkpoint) |
| Container orphan detection | Medium | Background detection job, user notifications |
| Parent-child task synchronization | Medium | Event-based coordination, status polling, retry logic |
| Resource exhaustion from parallel tasks | Medium | Per-task limits, monitoring, auto-pause on limit |
| Ultrawork decomposition errors | Medium | Validation before creation, fallback to sequential |
| Hook execution order dependencies | Low | Clear event sequencing, dependency validation in hooks |

## Next Steps

After plan approval:
1. Set up task registry (SQLite schema and service)
2. Create MCP server project structure
3. Implement multi-layer persistence (4 layers)
4. Implement 8 MCP tools for task-based containers
5. Create 9 hooks (3 new, 6 updated)
6. Implement Docker Sandbox Agent
7. Implement ultrawork mode with parent-child tasks
8. Add 15 user commands
9. Update state machine diagrams
10. Write comprehensive tests (unit, integration, E2E)
11. Create documentation (README, API docs, user guide)
12. End-to-end testing with real tasks
13. Error recovery testing
14. Ultrawork mode testing
15. Performance optimization

## Notes

- **Task-Based Architecture**: Core innovation shifting from agent-based to task-based containers
- **Multi-Layer Persistence**: 4 layers provide fast restore, complete history, human review, rollback capability
- **Session Persistence**: Resume any task exactly where previous session left off (including uncommitted changes)
- **Agent Flexibility**: Switch agents mid-task, attach to existing container, preserve all progress
- **Checkpoints**: Named restore points with full filesystem snapshots
- **Ultrawork Mode**: Parent-child task hierarchy, parallel subtask execution, independent persistence
- **Configurable Locking**: Exclusive (one agent at a time) or collaborative (multiple agents) modes
- **Safety Layers**: Container isolation + git safety + monitoring + hooks
- **Extensibility**: Easy to add new hooks, MCP tools, or persistence layers
- **Backward Compatibility**: Hooks and MCP can be disabled if needed
- **Git Integration**: All task memory git-tracked, version history of all progress

---

**Plan Version**: 2.0 (Task-Based Containers)
**Updated**: 2026-01-17
**Major Changes**: Complete architecture shift from agent-based to task-based containers with multi-layer persistence

