# State Machine Diagram

## Overview

This document visualizes the major systems in this dotfiles configuration and their interactions.

## State Machine Diagram

\`\```mermaid
stateDiagram-v2
    [*] --> ShellInit

    %% Shell Configuration
    ShellInit --> ZshConfig: Primary shell
    ShellInit --> BashConfig: Fallback for login

    %% Zsh Configuration Flow
    ZshConfig --> OhMyZshLoad: Load Oh My Zsh
    OhMyZshLoad --> GitPlugin: Enable git plugin
    GitPlugin --> ShellEnvironment: Environment setup

    %% Environment Setup
    ShellEnvironment --> NVMLoad: Node version manager
    ShellEnvironment --> PNPMConfig: Fast package manager
    ShellEnvironment --> BunConfig: JavaScript runtime
    ShellEnvironment --> CondaInit: Python environment
    ShellEnvironment --> OpenCodeSandbox: Development tools
    ShellEnvironment --> PipxConfig: Python tools
    ShellEnvironment --> Antigravity: Custom tools

    %% AI Agent System
    OpenCodeConfig --> ClaudeDesktop: Load Claude rules
    ClaudeDesktop --> SuperpowersPlugin: Load plugin
    SuperpowersPlugin --> SkillBootstrap: Inject bootstrap
    SkillBootstrap --> SkillsAvailable: Ready for use

    %% Skills Hierarchy
    SkillsAvailable --> ProjectSkills: Project-specific skills
    SkillsAvailable --> PersonalSkills: User personal skills
    SkillsAvailable --> SuperpowersSkills: Core framework skills

    %% Development Tools
    ProjectSkills --> DevTools: npm scripts available
    DevTools --> CodeAnalysis: Context analysis
    DevTools --> Testing: Mocha test runner
    DevTools --> Linting: ESLint/Prettier
    DevTools --> GitHooks: Husky pre-commit

    %% Plugin System
    ClaudeDesktop --> PluginMarketplaces: Available plugins
    PluginMarketplaces --> PluginCache: Installed plugins
    PluginCache --> CodeReviewPlugin: pr-review-toolkit
    PluginCache --> SecurityPlugin: security-guidance
    PluginCache --> FrontendPlugin: frontend-design
    PluginCache --> CommitPlugin: commit-commands
    PluginCache --> ContextPlugin: context-management workflow

    %% Ready State
    ProjectSkills --> Ready: All systems initialized
    PersonalSkills --> Ready: All systems initialized
    SuperpowersSkills --> Ready: All systems initialized

    %% Session Flow
    Ready --> SessionStart: User begins session
    SessionStart --> AgentSelection: Choose agent/skill
    AgentSelection --> TaskExecution: Execute task
    TaskExecution --> SessionEnd: Complete or handoff
    SessionEnd --> [*]
```

## System Descriptions

### 1. Shell Configuration System

**Purpose**: Configure shell environment with tools, aliases, and environment variables

**Components**:
- **Zsh**: Primary interactive shell (\`.zshrc\`)
- **Bash**: Login shell fallback (\`.bash_profile\`)
- **Oh My Zsh**: Shell framework providing themes and plugins
- **Git Plugin**: Version control integration

**Environment Variables**:
- \`ZSH\` \`$HOME/.oh-my-zsh\` | Oh My Zsh installation path |
- \`ZSH_THEME\` \`robbyrussell\` | Active shell theme |
- \`NVM_DIR\` \`$HOME/.nvm\` | Node.js version manager |
- \`PNPM_HOME\` \`/Users/calebrosario/Library/pnpm\` | Fast Node package manager |
- \`BUN_INSTALL\` \`$HOME/.bun\` | Bun JavaScript runtime |
- \`NPM_TOKEN\` | GitHub token for npm | Private packages |
- \`OPENCODE_SANDBOX\` \`/Users/calebrosario/.opencode-sandbox/bin\` | OpenCode CLI tools |

**PATH Modifications** (in order):
1. \`/Users/calebrosario/Library/pnpm\` (PNPM binaries)
2. \`/Users/calebrosario/.bun/bin\` (Bun runtime)
3. \`/Users/calebrosario/.opencode-sandbox/bin\` (OpenCode sandbox tools)
4. \`/Users/calebrosario/.local/bin\` (pipx-installed Python tools)
5. \`/Users/calebrosario/.antigravity/antigravity/bin\` (Antigravity CLI)
6. Conda binary paths (via conda init)

### 2. Package Manager System

**Purpose**: Manage development tool versions and dependencies

**Package Managers**:
- **NVM**: Node.js version switching
- **PNPM**: Fast, disk-efficient Node package manager
- **Bun**: All-in-one JavaScript runtime and package manager
- **Homebrew**: macOS system package manager (Conda via Homebrew)
- **Conda**: Python environment and package management
- **pipx**: Isolated Python CLI tool installation

### 3. AI Agent System

**Purpose**: Provide AI-assisted development through Claude Desktop + Opencode

**Components**:
- **Claude Desktop**: AI coding assistant with local rules
- **Superpowers Plugin**: Enhances Claude with skill management
- **Opencode Config**: Main configuration (\`opencode.json\`)
- **Plugin System**: Extensible plugin architecture

**Config Files**:
- \`.claude/rules/*\`: Development guidelines and rules
- \`.claude/agents/*\`: Specialized AI agents
- \`.claude/commands/*\`: Slash commands
- \`.claude/skills/*\`: Development patterns
- \`.config/opencode/\`: Opencode-specific skills

### 4. Skills System

**Purpose**: Provide reusable workflows and patterns organized by expertise domain

**Hierarchy** (priority order):
1. **Project Skills** (\`.opencode/skills/\`): Project-specific, highest priority
2. **Personal Skills** (\`.config/opencode/skills/\`): User custom skills
3. **Superpowers Skills** (\`.config/opencode/superpowers/skills/\`): Core framework skills

**Available Skills**:
- **Development**: TDD workflow, frontend patterns, backend patterns, coding standards
- **Domain-Specific**: Marketing psychology, competitor alternatives, pricing strategy, DOCX manipulation
- **Testing**: Systematic debugging, security review
- **Quality**: Code review, E2E testing, refactor cleanup

### 5. Development Tools System

**Purpose**: Provide context analysis and code quality automation

**Components**:
- **Context Analysis**: JavaScript scripts for analyzing codebase context
- **Testing**: Mocha test framework
- **Linting**: ESLint, Prettier code formatting
- **Git Hooks**: Husky pre-commit automation (lint-staged)

**Dependencies** (from \`.claude/scripts/package.json\`):
- mocha, eslint, prettier, @eslint/js
- husky, lint-staged

### 6. Plugin System

**Purpose**: Extend Claude Desktop with additional capabilities

**Plugin Sources**:
- **claude-code-plugins**: Official Claude plugins
- **claude-code-workflows**: Third-party workflow plugins

**Installed Plugins**:
- pr-review-toolkit: Pull request review automation
- code-review: Code quality checks
- frontend-design: UI/UX assistance
- security-guidance: Security analysis
- commit-commands: Git commit helpers
- context-management: Session context preservation workflow

### 7. Session Lifecycle

**Purpose**: Manage AI agent sessions from start to completion

**Flow**:
1. **Bootstrap Injection**: Superpowers plugin injects using-superpowers skill at session start
2. **Context Compaction**: Re-injects bootstrap after context compaction to save tokens
3. **Skill Loading**: User invokes skills which inject patterns and workflows
4. **Agent Execution**: Agents perform tasks using available tools
5. **Completion/Handoff**: Session ends when complete or at 65% context usage

**Session Compaction**:
- Triggers when context reaches token threshold
- Re-injects bootstrap to preserve skill availability
- Saves token usage for longer sessions

## Integration Points

### Shell → AI System
- PATH modifications enable Claude Desktop and opencode-sandbox tools
- Environment variables configure AI provider endpoints and tokens

### AI System → Skills
- Superpowers plugin provides \`use_skill\` tool to load skills
- Skills are loaded from three sources with priority resolution

### Skills → Development Tools
- Dev skills provide patterns that use npm scripts
- Testing skills use Mocha framework
- Code review skills use ESLint/Prettier

### Development Tools → Git Hooks
- Husky runs lint-staged before commits
- Pre-commit checks ensure code quality

## Key Configuration Files

| File | Purpose | Key Settings |
|-------|---------|--------------|
| \`.zshrc\` | Primary shell config | Oh My Zsh, NVM, PNPM, Bun, Conda, PATH |
| \`.bash_profile\` | Bash login config | Conda initialization |
| \`.config/opencode/opencode.json\` | Opencode config | Plugins, MCP servers, permissions, model |
| \`.config/opencode/plugin/superpowers.js\` | Superpowers plugin | Skill discovery, bootstrap injection, tool mapping |
| \`.claude/rules/*\` | Development rules | Coding style, agents, git workflow, security |
| \`.claude/scripts/package.json\` | NPM dev tools | mocha, eslint, prettier, husky, lint-staged |
| \`.claude/plugins/installed_plugins.json\` | Plugin registry | Installed Claude plugins with versions |

## External Services Integration

### MCP (Model Context Protocol) Servers
- **MCP_DOCKER**: Docker-based MCP gateway (enabled)
- **blender**: Blender 3D MCP server (disabled)

### AI Model Providers
- **zai-coding-plan**: \`glm-4.7\` (primary) | Default model for development |
- \`grok\`: \`grok-4-1-fast-reasoning\` | Alternative high-reasoning model |
- \`ollama\`: \`gpt-oss:20b\`, \`glm-4.7-flash\`, \`qwen3-coder:30b\` | Local models for offline/privacy |

## Notes

- This state machine diagram shows the initialization flow and interconnections between systems
- The shell configuration is the entry point that enables all other systems
- AI agents and skills are independent systems that can be invoked as needed
- Plugin system provides extensibility for Claude Desktop
- Session lifecycle management ensures efficient token usage and context preservation

---

*Last updated: February 4, 2026*
