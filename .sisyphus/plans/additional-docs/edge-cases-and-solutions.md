# Edge Cases & Solutions

**Document Version**: 1.0  
**Created**: 2026-01-19  
**Related Plan**: docker-sandboxes-opencode-integration.md v2.1  

---

## Overview

This document comprehensively analyzes edge cases that may arise during implementation of task-based Docker containers for OpenCode. For each edge case, we provide:
- Problem description
- Impact assessment
- Detailed solution with code examples
- Implementation guidance
- Testing strategies

---

## Edge Case 1: Concurrency & Locking Conflicts

### Problem
Multiple agents attempt to attach to the same task simultaneously, leading to:
- Race conditions in state updates
- Conflicting git operations
- Checkpoint corruption
- Data loss

### Impact
- **Severity**: HIGH
- **Likelihood**: MEDIUM
- **Scope**: Task registry, state.json, git operations

### Solution

#### 1.1 Optimistic Locking Implementation

```typescript
// TaskRegistry.ts
class TaskRegistry {
  private locks: Map<string, Lock> = new Map();
  
  async attachAgent(taskId: string, agentSession: AgentSession): Promise<AttachResult> {
    const task = await this.getTask(taskId);
    
    // Check lock mode
    if (task.lock_mode === 'exclusive' && task.locked_by) {
      return {
        success: false,
        error: `Task ${taskId} is locked by ${task.locked_by}. Current agent: ${agentSession.agentName}`
      };
    }
    
    // Acquire lock with timeout
    const lock = await this.acquireLock(taskId, {
      agentId: agentSession.sessionId,
      mode: task.lock_mode,
      timeout: 30000  // 30 second timeout
    });
    
    if (!lock.acquired) {
      return {
        success: false,
        error: `Failed to acquire lock for task ${taskId}. Try again later.`
      };
    }
    
    // Update task with optimistic concurrency control
    const currentVersion = task.version;
    const updateResult = await this.updateTask(taskId, {
      current_agent: agentSession,
      locked_by: agentSession.sessionId,
      locked_at: new Date().toISOString(),
      version: currentVersion + 1
    }, {
      expectedVersion: currentVersion  // Optimistic lock
    });
    
    if (!updateResult.success) {
      await this.releaseLock(taskId);
      return {
        success: false,
        error: `Concurrent modification detected. Please retry.`
      };
    }
    
    return {
      success: true,
      task: updateResult.task
    };
  }
  
  private async acquireLock(taskId: string, options: LockOptions): Promise<Lock> {
    const lockKey = `task:${taskId}:lock`;
    const lock = {
      taskId,
      agentId: options.agentId,
      mode: options.mode,
      acquiredAt: Date.now(),
      timeout: options.timeout
    };
    
    // Try to acquire lock atomically
    const existing = this.locks.get(lockKey);
    if (existing) {
      // Check if existing lock is stale (timeout)
      const elapsed = Date.now() - existing.acquiredAt;
      if (elapsed > existing.timeout) {
        this.locks.set(lockKey, lock);
        return { ...lock, acquired: true };
      }
      
      return { ...lock, acquired: false };
    }
    
    this.locks.set(lockKey, lock);
    return { ...lock, acquired: true };
  }
  
  async releaseLock(taskId: string, agentId?: string): Promise<void> {
    const lockKey = `task:${taskId}:lock`;
    const lock = this.locks.get(lockKey);
    
    if (!lock) return;
    
    // Only release if caller owns the lock
    if (agentId && lock.agentId !== agentId) {
      throw new Error(`Cannot release lock: owned by ${lock.agentId}, caller is ${agentId}`);
    }
    
    this.locks.delete(lockKey);
  }
}
```

#### 1.2 Lock Mode Configuration

```yaml
# .opencode/task-config.yaml
locking:
  default_mode: exclusive  # exclusive | collaborative
  
  modes:
    exclusive:
      description: "Only one agent can attach at a time"
      max_agents: 1
      conflict_resolution: "reject"
      
    collaborative:
      description: "Multiple agents can work together with conflict detection"
      max_agents: 5
      conflict_resolution: "merge"  # merge | reject | last-write-wins
      
  timeout:
    acquire: 30000  # 30 seconds
    renew: 60000    # 1 minute
    stale: 300000   # 5 minutes
```

#### 1.3 Conflict Detection for Collaborative Mode

```typescript
class ConflictDetector {
  async detectConflicts(taskId: string, operations: Operation[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const taskState = await this.loadTaskState(taskId);
    
    for (const op1 of operations) {
      for (const op2 of operations) {
        if (op1 === op2) continue;
        
        // Check for conflicting file operations
        if (this.conflicts(op1, op2, taskState)) {
          conflicts.push({
            operation1: op1,
            operation2: op2,
            type: 'file_conflict',
            resolution: this.suggestResolution(op1, op2)
          });
        }
      }
    }
    
    return conflicts;
  }
  
  private conflicts(op1: Operation, op2: Operation, state: TaskState): boolean {
    // Both writing to same file
    if (op1.type === 'write' && op2.type === 'write' && 
        op1.path === op2.path) {
      return true;
    }
    
    // One deleting what other is modifying
    if ((op1.type === 'delete' && op2.type === 'write') ||
        (op2.type === 'delete' && op1.type === 'write') &&
        op1.path.startsWith(op2.path)) {
      return true;
    }
    
    // Git operation conflicts
    if (op1.type === 'git' && op2.type === 'git' &&
        this.isConflictingGitOp(op1.command, op2.command)) {
      return true;
    }
    
    return false;
  }
}
```

### Testing Strategy

```typescript
describe('Concurrency Locking', () => {
  it('should reject concurrent exclusive lock attempts', async () => {
    const taskId = 'test-task-1';
    
    // First agent acquires lock
    const result1 = await registry.attachAgent(taskId, agent1);
    expect(result1.success).toBe(true);
    
    // Second agent should be rejected
    const result2 = await registry.attachAgent(taskId, agent2);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('locked by');
  });
  
  it('should allow collaborative mode with conflict detection', async () => {
    const taskId = 'test-task-2';
    const task = await registry.getTask(taskId);
    task.lock_mode = 'collaborative';
    
    // Both agents attach successfully
    const result1 = await registry.attachAgent(taskId, agent1);
    const result2 = await registry.attachAgent(taskId, agent2);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
  
  it('should handle lock timeout and recovery', async () => {
    const taskId = 'test-task-3';
    
    // Acquire lock with short timeout
    const lock = await registry.acquireLock(taskId, { timeout: 1000 });
    expect(lock.acquired).toBe(true);
    
    // Wait for timeout
    await sleep(1100);
    
    // Should be able to acquire lock now
    const newLock = await registry.acquireLock(taskId, { timeout: 10000 });
    expect(newLock.acquired).toBe(true);
  });
});
```

### Implementation Checklist
- [ ] Implement optimistic locking in TaskRegistry
- [ ] Add lock mode configuration (exclusive/collaborative)
- [ ] Implement lock acquisition with timeout
- [ ] Implement conflict detection for collaborative mode
- [ ] Add lock timeout handling
- [ ] Implement conflict resolution strategies
- [ ] Add tests for concurrent lock attempts
- [ ] Add tests for collaborative mode conflicts
- [ ] Add tests for lock timeout scenarios

---

## Edge Case 2: Container Resource Exhaustion

### Problem
Task container exceeds CPU/memory limits, causing:
- Container crashes
- OOM (Out of Memory) killer termination
- Performance degradation
- Host system instability

### Impact
- **Severity**: HIGH
- **Likelihood**: MEDIUM
- **Scope**: Docker container management

### Solution

#### 2.1 Adaptive Resource Limits

```typescript
class ResourceMonitor {
  private metrics: Map<string, ResourceMetrics> = new Map();
  
  async monitorContainer(containerId: string): Promise<void> {
    const stats = await docker.stats(containerId, { stream: false });
    
    const metrics = this.parseStats(stats);
    this.metrics.set(containerId, metrics);
    
    // Check if limits exceeded
    const task = await this.getTaskByContainerId(containerId);
    const limits = task.resource_limits;
    
    if (metrics.memoryPercent > 90) {
      await this.handleMemoryPressure(containerId, metrics, limits);
    }
    
    if (metrics.cpuPercent > 90) {
      await this.handleCpuPressure(containerId, metrics, limits);
    }
    
    // Auto-extend if configured and approved
    if (metrics.memoryPercent > 85 && limits.auto_extend) {
      await this.autoExtendLimits(containerId, 'memory');
    }
  }
  
  private async handleMemoryPressure(
    containerId: string, 
    metrics: ResourceMetrics, 
    limits: ResourceLimits
  ): Promise<void> {
    const taskId = await this.getTaskId(containerId);
    
    // Create emergency checkpoint before potential crash
    await mcpTools.create_task_checkpoint({
      task_id: taskId,
      checkpoint_name: `emergency-memory-pressure-${Date.now()}`,
      description: `Auto-checkpoint due to memory pressure: ${metrics.memoryPercent}%`,
      include_filesystem_snapshot: true
    });
    
    // Notify user
    await notifyUser({
      type: 'resource_warning',
      taskId,
      message: `Memory usage critical: ${metrics.memoryPercent}%. Creating checkpoint.`,
      action: 'adjust_limits'
    });
    
    // Auto-adjust if configured
    if (limits.auto_adjust) {
      const newLimit = limits.memory * 1.5;
      await this.adjustContainerMemory(containerId, newLimit);
      await this.updateTaskLimits(taskId, { memory: newLimit });
    }
  }
  
  private async autoExtendLimits(
    containerId: string, 
    resourceType: 'memory' | 'cpu'
  ): Promise<void> {
    const taskId = await this.getTaskId(containerId);
    const task = await this.getTask(taskId);
    
    // Check if extension is within bounds
    const maxMemory = task.resource_limits.max_memory || '16GB';
    const currentMemory = task.resource_limits.memory;
    
    if (currentMemory < this.parseMemory(maxMemory)) {
      // Request approval
      const approved = await this.requestUserApproval({
        taskId,
        message: `Extend ${resourceType} limit?`,
        current: currentMemory,
        proposed: currentMemory * 1.5,
        maximum: maxMemory
      });
      
      if (approved) {
        const newLimit = currentMemory * 1.5;
        await this.adjustContainerMemory(containerId, newLimit);
        await this.updateTaskLimits(taskId, { memory: newLimit });
        
        await notifyUser({
          type: 'limit_extended',
          taskId,
          resourceType,
          newLimit
        });
      }
    }
  }
}
```

#### 2.2 Resource Configuration

```yaml
# .opencode/resource-config.yaml
resource_limits:
  defaults:
    memory: 4GB
    cpu: 2.0
    disk: 10GB
    
  max_limits:
    memory: 32GB
    cpu: 8.0
    disk: 100GB
    
  auto_adjust:
    enabled: true
    require_approval: true
    approval_timeout: 60000  # 1 minute
    
  monitoring:
    interval: 5000  # 5 seconds
    thresholds:
      warning: 70
      critical: 85
      emergency: 95
      
  actions:
    on_warning:
      - notify_user
      - log_event
      
    on_critical:
      - create_checkpoint
      - notify_user
      - request_approval
      
    on_emergency:
      - create_emergency_checkpoint
      - pause_container
      - notify_user
```

#### 2.3 Docker Resource Limits

```typescript
class ContainerManager {
  async createContainer(task: Task, image: string): Promise<string> {
    const limits = task.resource_limits;
    
    const container = await docker.createContainer({
      Image: image,
      HostConfig: {
        Memory: this.parseMemory(limits.memory),
        CpuQuota: limits.cpu * 100000,  // Convert to microseconds
        CpuPeriod: 100000,
        DiskQuota: this.parseDisk(limits.disk),
        MemoryReservation: this.parseMemory(limits.memory) * 0.8,
        MemorySwap: this.parseMemory(limits.memory) * 2,  // Allow swap
        OomKillDisable: false,
        OomScoreAdj: -500  # Prefer to kill other processes
      },
      Labels: {
        'opencode.task.id': task.task_id,
        'opencode.resource.limits': JSON.stringify(limits)
      }
    });
    
    return container.id;
  }
  
  private parseMemory(memoryStr: string): number {
    // Parse "4GB" to bytes
    const match = memoryStr.match(/^(\d+(?:\.\d+)?)(GB|MB|KB|GB)$/i);
    if (!match) throw new Error(`Invalid memory format: ${memoryStr}`);
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers = {
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };
    
    return value * multipliers[unit];
  }
}
```

### Testing Strategy

```typescript
describe('Resource Exhaustion', () => {
  it('should detect memory pressure and create checkpoint', async () => {
    const taskId = 'test-resource-task';
    const container = await createContainer(taskId);
    
    // Simulate memory pressure
    await simulateMemoryPressure(container.id, 90);
    
    // Should create checkpoint
    const checkpoints = await listCheckpoints(taskId);
    expect(checkpoints.some(cp => 
      cp.name.includes('memory-pressure')
    )).toBe(true);
  });
  
  it('should auto-extend limits with approval', async () => {
    const taskId = 'test-extend-task';
    await approveUserRequest(taskId, true);
    
    await triggerMemoryPressure(taskId, 85);
    
    const task = await getTask(taskId);
    expect(task.resource_limits.memory).toBeGreaterThan(4 * 1024 * 1024 * 1024);
  });
});
```

### Implementation Checklist
- [ ] Implement resource monitoring service
- [ ] Add adaptive resource limits
- [ ] Implement auto-extension with approval
- [ ] Add emergency checkpoint on critical pressure
- [ ] Configure Docker resource limits
- [ ] Add user notification system
- [ ] Implement resource pressure handling
- [ ] Add tests for memory exhaustion
- [ ] Add tests for CPU exhaustion
- [ ] Add tests for auto-extension

---

[Continue with remaining 13 edge cases...]


---

## Edge Case 3: State Corruption (state.json)

### Problem
The `state.json` file becomes corrupted or out of sync, preventing agents from:
- Loading task state
- Resuming sessions
- Tracking progress
- Restoring from corrupted state

### Impact
- **Severity**: HIGH
- **Likelihood**: LOW
- **Scope**: Multi-layer persistence system

### Solution

#### 3.1 State Validation on Load

```typescript
class TaskPersistence {
  async loadState(taskId: string): Promise<TaskState> {
    const statePath = path.join(this.getWorkspace(taskId), '.task-memory', 'state.json');
    
    try {
      // Check if file exists
      if (!await fs.pathExists(statePath)) {
        return this.createInitialState(taskId);
      }
      
      // Read and validate state
      const rawState = await fs.readFile(statePath, 'utf-8');
      let state: TaskState;
      
      try {
        state = JSON.parse(rawState);
      } catch (parseError) {
        console.error(`Failed to parse state.json for task ${taskId}`, parseError);
        throw new StateCorruptionError('state.json contains invalid JSON');
      }
      
      // Validate schema
      const validation = this.validateStateSchema(state);
      if (!validation.valid) {
        console.error(`State validation failed for task ${taskId}`, validation.errors);
        throw new StateCorruptionError(`Invalid state schema: ${validation.errors.join(', ')}`);
      }
      
      // Verify checksum if present
      if (state.checksum) {
        const computedChecksum = this.computeChecksum(rawState);
        if (computedChecksum !== state.checksum) {
          console.error(`Checksum mismatch for task ${taskId}`);
          throw new StateCorruptionError('state.json checksum mismatch - file corrupted');
        }
      }
      
      return state;
      
    } catch (error) {
      if (error instanceof StateCorruptionError) {
        // Attempt recovery from logs
        console.log(`Attempting recovery from logs for task ${taskId}`);
        return await this.recoverFromLogs(taskId);
      }
      throw error;
    }
  }
  
  private validateStateSchema(state: any): ValidationResult {
    const errors: string[] = [];
    
    if (!state.task_id || typeof state.task_id !== 'string') {
      errors.push('Missing or invalid task_id');
    }
    
    if (!state.status || !['active', 'paused', 'completed'].includes(state.status)) {
      errors.push('Invalid or missing status');
    }
    
    if (!Array.isArray(state.todos)) {
      errors.push('Missing or invalid todos array');
    }
    
    if (!state.current_agent || typeof state.current_agent !== 'object') {
      errors.push('Missing or invalid current_agent');
    }
    
    if (!state.created_at || !isValidISODate(state.created_at)) {
      errors.push('Missing or invalid created_at timestamp');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  async recoverFromLogs(taskId: string): Promise<TaskState> {
    console.log(`Reconstructing state for task ${taskId} from logs`);
    
    const workspace = this.getWorkspace(taskId);
    const conversationsPath = path.join(workspace, '.task-memory', 'conversations.jsonl');
    const executionsPath = path.join(workspace, '.task-memory', 'executions.jsonl');
    
    // Read conversation log
    const conversations = await this.readJsonl(conversationsPath);
    
    // Read execution log
    const executions = await this.readJsonl(executionsPath);
    
    // Reconstruct state
    const reconstructed: TaskState = {
      task_id: taskId,
      status: 'active',
      todos: this.reconstructTodos(executions),
      conversations,
      executions,
      metrics: this.reconstructMetrics(executions, conversations),
      current_agent: this.getCurrentAgent(conversations),
      created_at: this.getFirstTimestamp(conversations) || new Date().toISOString(),
      last_active: this.getLastTimestamp(conversations) || new Date().toISOString()
    };
    
    // Backup corrupted state
    await this.backupCorruptedState(taskId);
    
    // Save reconstructed state
    await this.saveState(taskId, reconstructed);
    
    console.log(`Successfully reconstructed state for task ${taskId}`);
    return reconstructed;
  }
  
  private reconstructTodos(executions: any[]): Todo[] {
    const todos: Map<number, Todo> = new Map();
    
    for (const exec of executions) {
      if (exec.affected_todos) {
        for (const todo of exec.affected_todos) {
          todos.set(todo.id, todo);
        }
      }
    }
    
    return Array.from(todos.values());
  }
  
  private reconstructMetrics(executions: any[], conversations: any[]): TaskMetrics {
    return {
      total_sessions: new Set(conversations.map(c => c.session_id)).size,
      total_iterations: executions.length,
      total_tool_calls: executions.filter(e => e.tool).length,
      agents_used: [...new Set(conversations.map(c => c.agent))],
      checkpoints_created: 0  // Can't reconstruct from logs
    };
  }
  
  private async backupCorruptedState(taskId: string): Promise<void> {
    const statePath = path.join(this.getWorkspace(taskId), '.task-memory', 'state.json');
    const backupPath = `${statePath}.corrupted.${Date.now()}`;
    
    try {
      await fs.copy(statePath, backupPath);
      console.log(`Backed up corrupted state to ${backupPath}`);
    } catch (error) {
      console.error(`Failed to backup corrupted state for task ${taskId}`, error);
    }
  }
}
```

#### 3.2 Checksum Verification

```typescript
class TaskPersistence {
  async saveState(taskId: string, state: TaskState): Promise<void> {
    const statePath = path.join(this.getWorkspace(taskId), '.task-memory', 'state.json');
    
    // Serialize state
    const stateStr = JSON.stringify(state, null, 2);
    
    // Add checksum
    const stateWithChecksum = {
      ...state,
      checksum: this.computeChecksum(stateStr),
      checksum_algorithm: 'sha256',
      checksummed_at: new Date().toISOString()
    };
    
    const stateStrWithChecksum = JSON.stringify(stateWithChecksum, null, 2);
    
    // Atomic write
    const tempPath = `${statePath}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, stateStrWithChecksum, 'utf-8');
    await fs.rename(tempPath, statePath);
  }
  
  private computeChecksum(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}
```

#### 3.3 State Backup Strategy

```yaml
# .opencode/persistence-config.yaml
state_management:
  checksum:
    enabled: true
    algorithm: sha256
    auto_repair: true
    
  backup:
    enabled: true
    max_backups: 5
    backup_on_corruption: true
    backup_interval: 3600000  # 1 hour
    
  recovery:
    fallback_to_logs: true
    fallback_to_checkpoints: true
    notify_on_recovery: true
    
  validation:
    validate_on_load: true
    validate_on_save: true
    schema_version: "1.0"
```

### Testing Strategy

```typescript
describe('State Corruption Recovery', () => {
  it('should detect and recover from corrupted state.json', async () => {
    const taskId = 'test-corruption-task';
    
    // Create initial state
    await saveState(taskId, { task_id: taskId, todos: [] });
    
    // Corrupt state.json
    const statePath = getWorkspace(taskId) + '/.task-memory/state.json';
    await fs.writeFile(statePath, '{ invalid json', 'utf-8');
    
    // Should recover from logs
    const recovered = await loadState(taskId);
    expect(recovered.task_id).toBe(taskId);
    expect(recovered.todos).toBeDefined();
    
    // Check backup was created
    const backups = await listBackups(taskId);
    expect(backups.some(b => b.includes('corrupted'))).toBe(true);
  });
  
  it('should verify checksum and reject tampered state', async () => {
    const taskId = 'test-checksum-task';
    
    // Save state with checksum
    const state = { task_id: taskId, todos: [] };
    await saveState(taskId, state);
    
    // Tamper with state
    const statePath = getWorkspace(taskId) + '/.task-memory/state.json';
    const raw = await fs.readFile(statePath, 'utf-8');
    const tampered = raw.replace('todos', 'hacked_todos');
    await fs.writeFile(statePath, tampered, 'utf-8');
    
    // Should reject tampered state
    await expect(loadState(taskId)).rejects.toThrow('checksum mismatch');
  });
});
```

### Implementation Checklist
- [ ] Implement state schema validation
- [ ] Add checksum computation and verification
- [ ] Implement corrupted state backup
- [ ] Implement recovery from JSONL logs
- [ ] Implement atomic state writes
- [ ] Add state validation on load/save
- [ ] Configure backup strategy
- [ ] Add tests for corruption detection
- [ ] Add tests for log recovery
- [ ] Add tests for checksum verification

---

## Edge Case 4: Git Branch Naming Conflicts

### Problem
Multiple agents create branches with same name, leading to:
- Git branch creation failures
- Conflicting workspaces
- Lost work
- Confusion about which branch is current

### Impact
- **Severity**: MEDIUM
- **Likelihood**: MEDIUM
- **Scope**: Git integration

### Solution

#### 4.1 Unique Branch Naming

```typescript
class GitBranchManager {
  async createTaskBranch(task: Task): Promise<BranchResult> {
    const workspace = task.workspace;
    const baseName = this.generateBaseBranchName(task);
    
    // Try to create branch with base name
    let branchName = baseName;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        // Check if branch exists
        const exists = await this.branchExists(workspace, branchName);
        
        if (!exists) {
          // Create branch
          await this.executeGit(workspace, ['checkout', '-b', branchName]);
          
          return {
            success: true,
            branch_name: branchName,
            attempts: attempts + 1
          };
        }
        
        // Branch exists, generate unique name
        const uniqueSuffix = this.generateUniqueSuffix(attempts);
        branchName = `${baseName}-${uniqueSuffix}`;
        attempts++;
        
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw new Error(
            `Failed to create unique branch after ${maxAttempts} attempts. Base: ${baseName}`
          );
        }
        attempts++;
      }
    }
    
    throw new Error('Should not reach here');
  }
  
  private generateBaseBranchName(task: Task): string {
    const agent = task.current_agent?.name || 'unknown-agent';
    const model = task.current_agent?.model || 'unknown-model';
    const description = task.task_description || 'task';
    
    // Format: <agent>-<model>/<sanitized-description>
    const sanitizedDesc = this.sanitizeDescription(description);
    return `${this.sanitizeAgentName(agent)}-${this.sanitizeModelName(model)}/${sanitizedDesc}`;
  }
  
  private sanitizeDescription(description: string): string {
    // Convert to lowercase, replace spaces with hyphens, remove special chars
    return description
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);  // Limit to 50 chars
  }
  
  private sanitizeAgentName(agent: string): string {
    return agent.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }
  
  private sanitizeModelName(model: string): string {
    // "claude-opus-4.5" -> "claude-opus-4.5"
    return model.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  }
  
  private generateUniqueSuffix(attempt: number): string {
    // Mix of timestamp and random for uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }
  
  private async branchExists(workspace: string, branchName: string): Promise<boolean> {
    try {
      await this.executeGit(workspace, ['rev-parse', '--verify', branchName]);
      return true;
    } catch (error) {
      if (error.message.includes('unknown name')) {
        return false;
      }
      throw error;
    }
  }
}
```

#### 4.2 Atomic Branch Creation

```typescript
class GitBranchManager {
  async createTaskBranchAtomic(task: Task): Promise<BranchResult> {
    const workspace = task.workspace;
    const branchName = this.generateBaseBranchName(task);
    
    // Use git's atomic operations
    const lockFile = path.join(workspace, '.git', 'branch-creation.lock');
    
    try {
      // Acquire lock
      await this.acquireLock(lockFile, 30000);  // 30 second timeout
      
      // Check if branch exists
      const exists = await this.branchExists(workspace, branchName);
      
      if (exists) {
        // Branch already exists, generate unique name
        const uniqueName = `${branchName}-${Date.now()}`;
        await this.executeGit(workspace, ['checkout', '-b', uniqueName]);
        
        return {
          success: true,
          branch_name: uniqueName,
          note: 'Branch with base name already existed, created unique branch'
        };
      }
      
      // Create new branch
      await this.executeGit(workspace, ['checkout', '-b', branchName]);
      
      return {
        success: true,
        branch_name: branchName
      };
      
    } finally {
      // Release lock
      await this.releaseLock(lockFile);
    }
  }
  
  private async acquireLock(lockFile: string, timeout: number): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const fd = await fs.open(lockFile, 'wx');  // Exclusive create
        await fd.close();
        return;
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
        // Lock exists, wait and retry
        await sleep(100);
      }
    }
    
    throw new Error(`Failed to acquire lock after ${timeout}ms`);
  }
  
  private async releaseLock(lockFile: string): Promise<void> {
    try {
      await fs.unlink(lockFile);
    } catch (error) {
      // Ignore if lock doesn't exist
      if (error.code !== 'ENOENT') {
        console.error('Failed to release lock', error);
      }
    }
  }
}
```

### Testing Strategy

```typescript
describe('Git Branch Naming', () => {
  it('should create unique branch names on conflict', async () => {
    const task1 = createTestTask({ description: 'add-oauth' });
    const task2 = createTestTask({ description: 'add-oauth' });
    
    const result1 = await createTaskBranch(task1);
    const result2 = await createTaskBranch(task2);
    
    expect(result1.branch_name).not.toBe(result2.branch_name);
    expect(result1.branch_name).toMatch(/add-oauth/);
    expect(result2.branch_name).toMatch(/add-oauth/);
  });
  
  it('should handle special characters in description', async () => {
    const task = createTestTask({ 
      description: 'Add OAUTH! API @#$% with special chars' 
    });
    
    const result = await createTaskBranch(task);
    
    expect(result.branch_name).toMatch(/^[\w-]+\/[\w-]+$/);
    expect(result.branch_name).not.toContain('!');
    expect(result.branch_name).not.toContain('@');
    expect(result.branch_name).not.toContain('#');
  });
});
```

### Implementation Checklist
- [ ] Implement unique branch naming
- [ ] Add conflict detection and retry
- [ ] Implement atomic branch creation with locks
- [ ] Add branch name sanitization
- [ ] Add unique suffix generation
- [ ] Implement branch existence checking
- [ ] Add tests for branch conflicts
- [ ] Add tests for name sanitization
- [ ] Add tests for atomic operations

---

[Summary: Remaining 11 edge cases would follow similar structure...]

