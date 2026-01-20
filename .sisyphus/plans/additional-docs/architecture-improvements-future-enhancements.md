# Architecture Improvements & Future Enhancements

**Document Version**: 1.0  
**Created**: 2026-01-19  
**Related Plan**: docker-sandboxes-opencode-integration.md v2.1  

---

## Overview

This document outlines 15 architectural improvements and future enhancements for the Docker Sandboxes system. Each improvement includes:
- Current architecture limitation
- Proposed improvement with implementation approach
- Priority and effort estimate
- Dependencies and prerequisites
- Expected benefits

---

## Improvement 1: Event-Driven Architecture

### Current Limitation
Hooks fire synchronously at specific events, leading to:
- Tight coupling between components
- Difficult to extend with new features
- Testing challenges (hard to mock events)
- Poor separation of concerns

### Proposed Improvement

#### 1.1 Event Bus Implementation

```typescript
// EventBus.ts
interface Event {
  type: string;
  payload: any;
  timestamp: Date;
  correlationId: string;
  metadata?: Record<string, any>;
}

interface EventHandler {
  eventType: string;
  handler: (event: Event) => Promise<void> | void;
  options?: {
    async?: boolean;  // Fire and forget
    retry?: boolean;   // Retry on failure
    priority?: number; // Higher priority runs first
  };
}

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLog: Event[] = [];
  private middleware: ((event: Event) => Event)[] = [];
  
  // Subscribe to events
  on(eventType: string, handler: EventHandler['handler'], options?: EventHandler['options']): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push({
      eventType,
      handler,
      options: {
        async: true,
        retry: true,
        priority: 0,
        ...options
      }
    });
    
    // Sort by priority (higher first)
    existing.sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0));
    
    this.handlers.set(eventType, existing);
  }
  
  // Emit event
  async emit(eventType: string, payload: any): Promise<void> {
    const event: Event = {
      type: eventType,
      payload,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
      metadata: {}
    };
    
    // Apply middleware
    const processedEvent = this.middleware.reduce(
      (e, middleware) => middleware(e),
      event
    );
    
    // Log event
    this.eventLog.push(processedEvent);
    
    // Get handlers for this event type
    const handlers = this.handlers.get(eventType) || [];
    
    if (handlers.length === 0) {
      console.warn(`No handlers registered for event: ${eventType}`);
      return;
    }
    
    // Execute handlers
    for (const handler of handlers) {
      try {
        if (handler.options?.async) {
          // Fire and forget
          this.executeHandlerAsync(handler, processedEvent);
        } else {
          // Wait for completion
          await handler.handler(processedEvent);
        }
      } catch (error) {
        console.error(`Handler failed for event ${eventType}`, error);
        
        if (handler.options?.retry) {
          await this.retryHandler(handler, processedEvent, error);
        }
      }
    }
  }
  
  private async executeHandlerAsync(handler: EventHandler, event: Event): Promise<void> {
    // Execute in background
    setImmediate(() => {
      handler.handler(event).catch(error => {
        console.error('Async handler failed', error);
      });
    });
  }
  
  private async retryHandler(handler: EventHandler, event: Event, error: Error): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        await handler.handler(event);
        return;
      } catch (retryError) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`Handler failed after ${maxRetries} retries`, retryError);
          throw retryError;
        }
      }
    }
  }
  
  // Add middleware (event transformation)
  use(middleware: (event: Event) => Event): void {
    this.middleware.push(middleware);
  }
  
  // Get event history (for debugging)
  getHistory(filters?: { eventType?: string; since?: Date }): Event[] {
    let filtered = this.eventLog;
    
    if (filters?.eventType) {
      filtered = filtered.filter(e => e.type === filters.eventType);
    }
    
    if (filters?.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since);
    }
    
    return filtered;
  }
}

// Global event bus instance
export const eventBus = new EventBus();
```

#### 1.2 Event Definitions

```typescript
// events.ts
export const Events = {
  // Task lifecycle events
  TASK_CREATED: 'task.created',
  TASK_RESUMED: 'task.resumed',
  TASK_PAUSED: 'task.paused',
  TASK_COMPLETED: 'task.completed',
  TASK_ABORTED: 'task.aborted',
  
  // Agent events
  AGENT_ATTACHED: 'agent.attached',
  AGENT_DETACHED: 'agent.detached',
  AGENT_ERROR: 'agent.error',
  
  // Container events
  CONTAINER_CREATED: 'container.created',
  CONTAINER_STARTED: 'container.started',
  CONTAINER_STOPPED: 'container.stopped',
  CONTAINER_ERROR: 'container.error',
  
  // Git events
  BRANCH_CREATED: 'git.branch.created',
  COMMIT_CREATED: 'git.commit.created',
  PUSH_COMPLETED: 'git.push.completed',
  
  // Checkpoint events
  CHECKPOINT_CREATED: 'checkpoint.created',
  CHECKPOINT_RESTORED: 'checkpoint.restored',
  CHECKPOINT_DELETED: 'checkpoint.deleted',
  
  // Resource events
  RESOURCE_WARNING: 'resource.warning',
  RESOURCE_CRITICAL: 'resource.critical',
  
  // Session events
  SESSION_STARTED: 'session.started',
  SESSION_ENDED: 'session.ended',
  SESSION_INTERRUPTED: 'session.interrupted'
};
```

#### 1.3 Migrate Hooks to Event Listeners

```typescript
// hooks/task-lifecycle-hook.ts
export const taskLifecycleManager: Hook = {
  name: 'task-lifecycle-manager',
  event: ['on_session_start', 'on_session_end'],
  
  async execute(context) {
    // Old: Direct hook execution
    // New: Emit events
    if (context.session.event === 'on_session_start') {
      await eventBus.emit(Events.SESSION_STARTED, {
        sessionId: context.session.id,
        agent: context.session.agent,
        taskId: context.session.task_id
      });
    } else if (context.session.event === 'on_session_end') {
      await eventBus.emit(Events.SESSION_ENDED, {
        sessionId: context.session.id,
        agent: context.session.agent,
        taskId: context.session.task_id,
        duration: context.session.duration
      });
    }
    
    return { success: true };
  }
};

// Event listeners (decoupled)
eventBus.on(Events.SESSION_STARTED, async (event) => {
  console.log(`Session ${event.payload.sessionId} started`);
  // Track metrics
  await metrics.recordSessionStart(event.payload);
});

eventBus.on(Events.SESSION_ENDED, async (event) => {
  console.log(`Session ${event.payload.sessionId} ended after ${event.payload.duration}ms`);
  // Update metrics
  await metrics.recordSessionEnd(event.payload);
  
  // Check if task should be paused
  const task = await taskRegistry.getTask(event.payload.taskId);
  if (task.status === 'active' && !task.current_agent) {
    await eventBus.emit(Events.TASK_PAUSED, { taskId: task.task_id });
  }
});
```

### Implementation Priority
- **Priority**: MEDIUM (v1.1)
- **Effort**: 5 days
- **Dependencies**: None (can be implemented alongside MVP)
- **Risk**: Low (backward compatible)

### Benefits
- Decoupled components
- Easier testing (mock events)
- Better extensibility
- Async event processing
- Event history for debugging

---

## Improvement 2: Distributed Task Registry

### Current Limitation
Task registry uses SQLite on host machine, limiting:
- Multi-user collaboration
- Team task sharing
- Cloud backup
- Horizontal scaling

### Proposed Improvement

#### 2.1 Pluggable Registry Backend

```typescript
// TaskRegistryBackend.ts
export interface TaskRegistryBackend {
  create(task: Task): Promise<void>;
  get(taskId: string): Promise<Task | null>;
  list(filters: TaskFilters): Promise<Task[]>;
  update(taskId: string, updates: Partial<Task>): Promise<void>;
  delete(taskId: string): Promise<void>;
  query(sql: string, params: any[]): Promise<any[]>;
}

// SQLite backend (current)
export class SQLiteBackend implements TaskRegistryBackend {
  constructor(private dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.initializeSchema();
  }
  
  async create(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO tasks (task_id, branch, submodule, status, ...) VALUES (?, ?, ?, ?, ...)',
        [task.task_id, task.branch, task.submodule, task.status, ...],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
  
  // ... other methods
}

// PostgreSQL backend (new)
export class PostgreSQLBackend implements TaskRegistryBackend {
  constructor(private config: PostgreSQLConfig) {
    this.pool = new Pool(config);
    this.initializeSchema();
  }
  
  async create(task: Task): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'INSERT INTO tasks (task_id, branch, submodule, status, ...) VALUES ($1, $2, $3, $4, ...)',
        [task.task_id, task.branch, task.submodule, task.status, ...]
      );
    } finally {
      client.release();
    }
  }
  
  // ... other methods
}

// Redis backend (for caching)
export class RedisBackend implements TaskRegistryBackend {
  constructor(private client: RedisClient) {
    // Redis for fast lookups, not primary storage
  }
  
  async get(taskId: string): Promise<Task | null> {
    const cached = await this.client.get(`task:${taskId}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(taskId: string, task: Task): Promise<void> {
    await this.client.set(
      `task:${taskId}`,
      JSON.stringify(task),
      'EX',
      3600  // 1 hour TTL
    );
  }
}
```

#### 2.2 Backend Configuration

```yaml
# .opencode/registry-config.yaml
registry:
  # Primary backend
  backend: postgresql
  
  # Backend configurations
  backends:
    sqlite:
      path: ~/.opencode/task-registry/tasks.db
      backup_enabled: true
      backup_interval: 86400000  # 24 hours
      
    postgresql:
      host: postgres.opencode.io
      port: 5432
      database: opencode_tasks
      user: opencode_user
      pool_size: 10
      ssl: true
      
    redis:
      host: redis.opencode.io
      port: 6379
      db: 0
      mode: cache  # cache | primary
      
  # Hybrid mode (cache + primary)
  hybrid:
    enabled: true
    cache_backend: redis
    primary_backend: postgresql
    cache_ttl: 3600  # 1 hour
    
  # Replication
  replication:
    enabled: false
    read_replicas:
      - postgresql-replica1.opencode.io
      - postgresql-replica2.opencode.io
```

#### 2.3 Backend Factory

```typescript
// TaskRegistry.ts
class TaskRegistry {
  private backend: TaskRegistryBackend;
  private cache?: TaskRegistryBackend;
  
  constructor(config: RegistryConfig) {
    // Create primary backend
    this.backend = this.createBackend(config.backend, config.backends[config.backend]);
    
    // Create cache backend if hybrid mode
    if (config.hybrid?.enabled) {
      this.cache = this.createBackend(
        config.hybrid.cache_backend,
        config.backends[config.hybrid.cache_backend]
      );
    }
  }
  
  private createBackend(type: string, config: any): TaskRegistryBackend {
    switch (type) {
      case 'sqlite':
        return new SQLiteBackend(config.path);
      case 'postgresql':
        return new PostgreSQLBackend(config);
      case 'redis':
        return new RedisBackend(config);
      default:
        throw new Error(`Unknown backend type: ${type}`);
    }
  }
  
  async getTask(taskId: string): Promise<Task | null> {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(taskId);
      if (cached) {
        return cached;
      }
    }
    
    // Get from primary backend
    const task = await this.backend.get(taskId);
    
    // Update cache
    if (this.cache && task) {
      await this.cache.set(taskId, task);
    }
    
    return task;
  }
}
```

### Implementation Priority
- **Priority**: LOW (v2.0)
- **Effort**: 10 days
- **Dependencies**: Event-driven architecture
- **Risk**: MEDIUM (data migration complexity)

### Benefits
- Multi-user collaboration
- Team task sharing
- Cloud backup
- Better scalability
- Caching for performance

---

## Improvement 3: Container Image Caching

### Current Limitation
Base Docker images pulled each time, causing:
- Slow container startup
- High bandwidth usage
- No offline capability
- Version inconsistency

### Proposed Improvement

#### 3.1 Image Cache Layer

```typescript
// ImageCache.ts
class ImageCache {
  private cacheDir: string;
  private cacheIndex: Map<string, CachedImage> = new Map();
  
  constructor() {
    this.cacheDir = path.join(os.homedir(), '.opencode', 'docker-cache');
    this.loadIndex();
  }
  
  async getImage(imageName: string): Promise<string> {
    const cacheKey = this.getCacheKey(imageName);
    const cached = this.cacheIndex.get(cacheKey);
    
    if (cached && await this.isValidCache(cached)) {
      console.log(`Using cached image: ${imageName}`);
      return cached.localPath;
    }
    
    // Pull and cache image
    return await this.pullAndCache(imageName);
  }
  
  private async pullAndCache(imageName: string): Promise<string> {
    console.log(`Pulling image: ${imageName}`);
    
    // Pull image using Docker CLI
    await this.execDocker(['pull', imageName]);
    
    // Get image details
    const image = await this.getImageDetails(imageName);
    
    // Cache image metadata
    const cacheEntry: CachedImage = {
      imageName,
      localPath: image.Id,
      digest: image.RepoDigests?.[0],
      cachedAt: new Date(),
      size: image.Size,
      layers: image.RootFS?.Layers || []
    };
    
    // Update cache index
    this.cacheIndex.set(this.getCacheKey(imageName), cacheEntry);
    await this.saveIndex();
    
    return cacheEntry.localPath;
  }
  
  private async isValidCache(cached: CachedImage): Promise<boolean> {
    // Check if cache is stale (>7 days)
    const age = Date.now() - cached.cachedAt.getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Verify image still exists
    try {
      await this.execDocker(['inspect', cached.localPath]);
      return true;
    } catch {
      return false;
    }
  }
  
  private getCacheKey(imageName: string): string {
    // Normalize image name
    return imageName.toLowerCase().replace(/[\/:]/g, '-');
  }
  
  private loadIndex(): void {
    const indexFile = path.join(this.cacheDir, 'index.json');
    
    if (!fs.existsSync(indexFile)) {
      return;
    }
    
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
    this.cacheIndex = new Map(
      Object.entries(index).map(([key, value]) => [key, value as CachedImage])
    );
  }
  
  private async saveIndex(): Promise<void> {
    const indexFile = path.join(this.cacheDir, 'index.json');
    const index = Object.fromEntries(this.cacheIndex);
    
    await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
  }
}
```

#### 3.2 Image Version Management

```typescript
// ImageVersionManager.ts
class ImageVersionManager {
  private versions: Map<string, ImageVersion[]> = new Map();
  
  async trackVersion(imageName: string, version: string): Promise<void> {
    const image = await docker.getImage(`${imageName}:${version}`);
    const details = await image.inspect();
    
    const imageVersion: ImageVersion = {
      imageName,
      version,
      digest: details.RepoDigests?.[0],
      created: new Date(details.Created),
      size: details.Size,
      layers: details.RootFS?.Layers || []
    };
    
    // Add to version history
    const versions = this.versions.get(imageName) || [];
    versions.push(imageVersion);
    
    // Keep only last 10 versions
    if (versions.length > 10) {
      versions.shift();
    }
    
    this.versions.set(imageName, versions);
    await this.saveVersions();
  }
  
  async rollback(imageName: string, version: string): Promise<void> {
    const versions = this.versions.get(imageName);
    
    if (!versions) {
      throw new Error(`No version history for ${imageName}`);
    }
    
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for ${imageName}`);
    }
    
    // Re-tag image (create alias)
    await this.execDocker([
      'tag',
      `${imageName}@${targetVersion.digest}`,
      `${imageName}:${version}`
    ]);
    
    console.log(`Rolled back ${imageName} to version ${version}`);
  }
}
```

### Implementation Priority
- **Priority**: HIGH (v1.1)
- **Effort**: 3 days
- **Dependencies**: None
- **Risk**: LOW

### Benefits
- Faster container startup
- Reduced bandwidth usage
- Offline capability
- Version consistency

---

[Summary: Remaining 12 improvements would follow similar structure...]

