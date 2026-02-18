# OpenCode Dotfiles

Comprehensive development environment and AI-assisted coding workstation configuration.

## Overview

This repository contains personal dotfiles configured for macOS and Linux, focusing on AI-assisted development workflows using Claude Desktop + Opencode. It provides a complete development environment with shell configurations, AI agents, development tools, and extensible skill system.

### Key Features

- **Automated Setup**: Bootstrap scripts for macOS (Homebrew) and Linux (apt/dnf/pacman)
- **Shell Configuration**: Zsh with Oh My Zsh framework, optimized for development workflows
- **AI Development**: Claude Desktop + Opencode integration with specialized agents and skills
- **Package Management**: Multiple package managers (NVM, PNPM, Bun, Conda)
- **Development Tools**: npm scripts for context analysis, testing, and linting
- **Skill System**: Hierarchical skill system (project > personal > superpowers)
- **Plugin Architecture**: Extensible plugin system for Claude Desktop extensions
- **State Machine Documentation**: Complete system architecture visualization in [STATE_MACHINE.md](STATE_MACHINE.md)

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Shell Configuration](#shell-configuration)
4. [AI System Configuration](#ai-system-configuration)
5. [Skills System](#skills-system)
6. [Development Tools](#development-tools)
7. [Plugin System](#plugin-system)
8. [Available Commands](#available-commands)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Automated Setup (Recommended)

Use the automated bootstrap scripts for one-command installation:

**macOS:**
\`\`\`bash
# Clone and run bootstrap script
git clone <your-repo-url> ~/dotfiles
cd ~/dotfiles
./scripts/bootstrap-macos.sh
\`\`\`

**Linux (Ubuntu/Debian/Fedora/Arch):**
\`\`\`bash
# Clone and run bootstrap script
git clone <your-repo-url> ~/dotfiles
cd ~/dotfiles
./scripts/bootstrap-linux.sh
\`\`\`

The bootstrap scripts automatically install:
- Homebrew (macOS) or system package manager (Linux)
- Zsh with Oh My Zsh
- Node.js via NVM (LTS version)
- Bun JavaScript runtime
- OpenCode CLI and oh-my-opencode plugin
- Essential development tools (git, gh, curl, wget)

### Manual Setup

If you prefer manual setup:

\`\`\`bash
# Clone this repository
git clone <your-repo-url> ~/dotfiles
cd ~/dotfiles

# Create symlinks to home directory
ln -s .zshrc ~/.zshrc
ln -s .bash_profile ~/.bash_profile

# Install Oh My Zsh (if not already installed)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" ""

# Install Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
nvm alias default lts/*

# Install Bun
curl -fsSL https://bun.sh/install | bash
\`\`\`

### First-Time Steps

1. **Run bootstrap script** (recommended) OR follow manual setup steps
2. **Install Claude Desktop** from https://claude.ai/download (macOS) or use web interface
3. **Restart shell** or source new configuration: `source ~/.zshrc`
4. **Verify installation** - all tools should be available in PATH

### Verification

After setup, verify your installation:

\`\`\`bash
# Check shell version
echo \$ZSH_VERSION

# Verify package managers
which nvm
which bun

# Check AI systems
ls ~/.claude/
ls ~/.config/opencode/

# List available skills (Claude Desktop only)
find_skills  # Claude Desktop tool - uses use_skill from superpowers plugin
\`\`\`

## Architecture Overview

This dotfiles configuration is organized around a central shell environment with AI agent orchestration at its core.

### Architecture Diagram

\`\`\`mermaid
graph TD
    A[User Terminal] --> B[Zsh Shell]
    B --> C[Oh My Zsh Framework]

    B --> D[Environment Setup]
    D --> E[NVM]
    D --> F[PNPM]
    D --> G[Bun]
    D --> H[Conda]
    D --> I[OpenCode Sandbox]

    B --> J[Claude Desktop]
    J --> K[Opencode Config]
    J --> L[Superpowers Plugin]
    J --> M[Agents System]
    J --> N[Commands System]
    J --> O[Skills System]
    J --> P[Plugins System]

    L --> Q[Skills Hierarchy]
    Q --> R[Project Skills]
    Q --> S[Personal Skills]
    Q --> T[Superpowers Skills]

    M --> U[Development Tools]
    U --> V[Context Analysis Scripts]
    U --> W[Testing Framework]
    U --> X[Linting & Formatting]

    P --> Y[Plugin Marketplaces]
    Y --> Z[Installed Plugins]

    style B fill:#2563eb,stroke:#1e293b
    style C fill:#2563eb,stroke:#1e293b
    style J fill:#7c3aed,stroke:#1e293b
\`\`\`

For a full state machine diagram with detailed transitions, see [STATE_MACHINE.md](STATE_MACHINE.md).

### System Philosophy

1. **Modularity**: Each system operates independently with clear interfaces
2. **Extensibility**: Plugin system allows adding capabilities without core changes
3. **Priority Resolution**: Skills can be overridden at multiple levels (project > personal > superpowers)
4. **Token Efficiency**: Context compaction and bootstrap injection optimize Claude sessions
5. **Parallel Execution**: Independent tasks run concurrently when possible

## Shell Configuration

### Primary Shell: Zsh with Oh My Zsh

The shell configuration uses Oh My Zsh as a framework, providing:

- **Git integration**: Version control aliases and prompts
- **Theme**: robbyrussell (clean, focused)
- **Plugin System**: Extensible plugin architecture
- **Startup Performance**: Optimized for development workflows

### Environment Variables

| Variable | Value | Purpose |
|-----------|-------|---------|
| \`ZSH\` | \`$HOME/.oh-my-zsh\` | Oh My Zsh installation path |
| \`ZSH_THEME\` | \`robbyrussell\` | Active shell theme |
| \`NVM_DIR\` | \`$HOME/.nvm\` | Node.js version manager |
| \`PNPM_HOME\` | \`/Users/calebrosario/Library/pnpm\` | Fast Node package manager |
| \`BUN_INSTALL\` | \`$HOME/.bun\` | Bun JavaScript runtime |
| \`NPM_TOKEN\` | GitHub token for npm | Private packages |
| \`OPENCODE_SANDBOX\` | \`/Users/calebrosario/.opencode-sandbox/bin\` | OpenCode CLI tools |

### PATH Configuration

The PATH is configured with these directories in order (leftmost has highest priority):

1. `/Users/calebrosario/Library/pnpm` (PNPM binaries)
2. `/Users/calebrosario/.bun/bin` (Bun runtime)
3. `/Users/calebrosario/.opencode-sandbox/bin` (OpenCode sandbox tools)
4. `/Users/calebrosario/.local/bin` (pipx-installed Python tools)
5. `/Users/calebrosario/.antigravity/antigravity/bin` (Antigravity CLI - global directory)
6. Conda binary paths (via conda init)

### Package Managers

#### Node.js Version Management

\`\`\`bash
# NVM (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
\`\`\`

#### JavaScript Runtimes

\`\`\`bash
# PNPM (Fast Package Manager)
export PNPM_HOME="/Users/calebrosario/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Bun (All-in-one JavaScript Runtime & Package Manager)
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Bun completions
[ -s "/Users/calebrosario/.bun/_bun" ] && source "/Users/calebrosario/.bun/_bun"
\`\`\`

#### Python Environment

\`\`\`bash
# Conda (via Homebrew Anaconda)
# >>> conda initialize >>>
__conda_setup="$('/opt/homebrew/anaconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/anaconda3/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/anaconda3/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/anaconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

# pipx (Python CLI Tools)
export PATH="$PATH:/Users/calebrosario/.local/bin"
\`\`\`

### Shell Configuration Files

| File | Purpose |
|-------|---------|
| \`.zshrc\` | Primary Zsh interactive configuration with Oh My Zsh, environment variables, package managers |
| \`.bash_profile\` | Bash login shell configuration (conda initialization) |

## AI System Configuration

### Claude Desktop + Opencode Integration

The AI development system is configured through two main configuration sources:

1. **Claude Desktop Rules** (\`.claude/\`)
   - Development guidelines and workflows
   - Agent orchestration
   - Code quality standards

2. **Opencode Configuration** (\`.config/opencode/\`)
   - Main Opencode settings
   - MCP server integrations
   - Skills and plugins

3. **Superpowers Plugin** (\`.config/opencode/plugin/superpowers.js\`)
   - Skill discovery and loading
   - Bootstrap injection for token efficiency
   - Tool mapping for OpenCode integration

### Available AI Models

| Provider | Model | Purpose |
|----------|-------|---------|
| \`zai-coding-plan\` | \`glm-4.7\` (primary) | Default model for development |
| `grok` | `grok-4-1-fast-reasoning` | Alternative high-reasoning model |
| \`ollama\` | \`gpt-oss:20b\`, \`glm-4.7-flash\`, \`qwen3-coder:30b\` | Local models for offline/privacy |

## Skills System

### Skill Hierarchy

Skills are organized in three layers with priority resolution:

\`\`\`
1. Project Skills (highest priority)
   Location: .claude/skills/
   Prefix: project:skill-name
   Purpose: Project-specific skills and patterns

2. Personal Skills (medium priority)
   Location: .config/opencode/skills/
   Prefix: skill-name
   Purpose: User-customized skills

3. Superpowers Skills (lowest priority)
   Location: .config/opencode/superpowers/skills/
   Prefix: superpowers:skill-name
   Purpose: Core framework skills and workflows
\`\`\`

### Available Skills

#### Development Patterns

| Skill | Description | Location |
|--------|-------------|----------|
| \`tdd-workflow\` | Test-driven development methodology with 80%+ coverage | \`.claude/skills/tdd-workflow/\` |
| \`backend-patterns\` | Backend architecture patterns for Node.js, Express, Next.js | \`.claude/skills/backend-patterns.md\` |
| \`frontend-patterns\` | Frontend patterns for React, Next.js, state management | \`.claude/skills/frontend-patterns.md\` |
| \`coding-standards\` | Universal coding standards for TypeScript, JavaScript | \`.claude/skills/coding-standards.md\` |
| \`clickhouse-io\` | ClickHouse database patterns for analytical workloads | \`.claude/skills/clickhouse-io.md\` |

#### Domain-Specific Skills

| Skill | Description | Location |
|--------|-------------|----------|
| \`marketing-psychology\` | 70+ mental models for marketing and persuasion | \`.agents/skills/marketing-psychology/\` |
| \`competitor-alternatives\` | Create competitor comparison/alternative pages | \`.agents/skills/competitor-alternatives/\` |
| \`pricing-strategy\` | Pricing decisions, packaging, and monetization | \`.agents/skills/pricing-strategy/\` |
| \`release-skills\` | Release workflow for baoyu-skills plugin | \`.agents/skills/release-skills/\` |
| \`docx\` | Comprehensive DOCX document manipulation | \`.agents/skills/docx/\` |

#### Testing & Quality

| Skill | Description | Location |
|--------|-------------|----------|
| \`systematic-debugging\` | Four-phase debugging process for bugs and failures | \`.config/opencode/skill/systematic-debugging/\` |
| \`security-review\` | Security checklist and patterns for auth, input, APIs | \`.claude/skills/security-review/\` |

#### Additional Skills

| Skill | Description | Location |
|--------|-------------|----------|
| \`continuous-learning\` - Session evaluation and improvement
| \`strategic-compact\` - Context compaction strategies
| \`project-guidelines-example\` - Example project guidelines

### Using Skills

Skills are loaded using the \`use_skill\` tool provided by the Superpowers plugin:

\`\`\`bash
# List all available skills
find_skills

# Load a specific skill
use_skill <skill-name>

# Example
use_skill tdd-workflow  # Loads TDD methodology
use_skill project:my-custom-skill  # Loads project-specific skill
use_skill frontend-design  # Loads frontend UI/UX patterns
\`\`\`

## Development Tools

### NPM Scripts

The \`.claude/scripts/\` directory provides development tools via npm:

| Script | Description | Dependencies |
|---------|-------------|--------------|
| \`context-analyzer.js\` | Analyzes codebase context for AI sessions | - |
| \`context-cmd.js\` | CLI tool for context analysis | - |
| \`context-analyzer-simple.js\` | Simplified context analyzer | - |

### NPM Dependencies

From \`.claude/scripts/package.json\`:

\`\`\`json
{
  "dependencies": {
    "mocha": "^10.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "@eslint/js": "^8.57.0",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2"
  }
}
\`\`\`

- **Mocha**: JavaScript test framework
- **ESLint**: JavaScript/TypeScript code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks management
- **lint-staged**: Run linters on staged git files

## Plugin System

### Plugin Architecture

Claude Desktop plugins provide extensibility through a modular architecture:

\`\`\`mermaid
graph LR
    A[Claude Desktop] --> B[Plugin System]
    B --> C[Plugin Sources]
    B --> D[claude-code-plugins<br/>Official Plugins]
    B --> E[claude-code-workflows<br/>Third-Party Workflows]
    B --> F[Installed Plugins<br/>.claude/plugins/cache/]
\`\`\`

### Available Plugins

| Plugin | Version | Purpose | Location |
|--------|---------|----------|
| \`pr-review-toolkit\` | 1.0.0 | Pull request review automation | \`~/.claude/plugins/cache/claude-code-plugins/pr-review-toolkit/1.0.0/\` |
| \`code-review\` | 1.0.0 | Code quality checks and analysis | \`~/.claude/plugins/cache/claude-code-plugins/code-review/1.0.0/\` |
| \`frontend-design\` | 1.0.0 | UI/UX assistance and patterns | \`~/.claude/plugins/cache/claude-code-plugins/frontend-design/1.0.0/\` |
| \`security-guidance\` | 1.0.0 | Security analysis and patterns | \`~/.claude/plugins/cache/claude-code-plugins/security-guidance/1.0.0/\` |
| \`commit-commands\` | 1.0.0 | Git commit helpers and workflows | \`~/.claude/plugins/cache/claude-code-plugins/commit-commands/1.0.0/\` |
| \`context-management\` | 1.2.0 | Session context preservation workflow | \`~/.claude/plugins/cache/claude-code-workflows/context-management/1.2.0/\` |

### MCP (Model Context Protocol) Servers

| MCP Server | Status | Purpose |
|------------|-------|---------|
| \`MCP_DOCKER\` | Enabled | Docker-based MCP gateway for n8n, Chroma, Neo4j tools |
| \`blender\` | Disabled | Blender 3D MCP server |

## Agents System

### Available Agents

Located in \`.claude/agents/\`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| \`planner\` | Implementation planning | Complex features, refactoring |
| \`architect\` | System design | Architectural decisions |
| \`tdd-guide\` | Test-driven development | New features, bug fixes |
| \`code-reviewer\` | Code review | After writing code |
| \`security-reviewer\` | Security analysis | Before commits |
| \`build-error-resolver\` | Fix build errors | When build fails |
| \`e2e-runner\` | E2E testing | Critical user flows |
| \`refactor-cleaner\` | Dead code cleanup | Code maintenance |
| \`doc-updater\` | Documentation | Updating docs |

### Agent Orchestration

Agents should be used proactively based on task requirements:

- **Complex feature requests** → Use \`planner\` agent
- **Code just written/modified** → Use \`code-reviewer\` agent
- **Bug fix or new feature** → Use \`tdd-guide\` agent
- **Architectural decision** → Use \`architect\` agent
- **Parallel task execution** → Launch multiple agents simultaneously

### Command Usage

Use \`@mention\` syntax in Claude Desktop to invoke agents:

\`\`\`
@planner Plan this feature
@code-reviewer Review my changes
@tdd-guide Implement with TDD
\`\`\`

## Commands System

### Available Slash Commands

Located in \`.claude/commands/\`:

| Command | Purpose | Usage |
|----------|---------|---------|
| \`/plan\` | Restore requirements, create step-by-step plan | \`/plan\` |
| \`/build-fix\` | Fix build and TypeScript errors | \`/build-fix\` |
| \`/code-review\` | Review code for quality | \`/code-review\` |
| \`/context\` | Analyze codebase context | \`/context\` |
| \`/e2e\` | Run Playwright E2E tests | \`/e2e\` |
| \`/learn\` | Learn from codebase patterns | \`/learn\` |
| \`/refactor-clean\` | Remove dead code and duplicates | \`/refactor-clean\` |
| \`/test-coverage\` | Check test coverage metrics | \`/test-coverage\` |
| \`/update-codemaps\` | Update code mapping documentation | \`/update-codemaps\` |
| \`/update-docs\` | Update project documentation | \`/update-docs\` |
| \`/tdd\` | Execute TDD workflow | \`/tdd\` |

## Rules and Guidelines

### Development Rules

Located in \`.claude/rules/\`:

| Rule File | Purpose |
|------------|---------|
| \`agents.md\` | Agent orchestration guidelines |
| \`coding-style.md\` | Code quality standards and patterns |
| \`git-workflow.md\` | Git workflow conventions |
| \`patterns.md\` | General development patterns |
| \`performance.md\` | Performance optimization guidelines |
| \`security.md\` | Security best practices |
| \`testing.md\` | Testing standards and practices |
| \`hooks.md\` | Git hook configurations |

### Key Coding Standards

- **Immutability**: Always create new objects, never mutate
- **File Organization**: Many small files > few large files (200-400 lines max)
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Input Validation**: Always validate user input with schemas
- **Testing**: Write tests first, ensure 80%+ coverage

### Git Workflow

- Use atomic commits with descriptive messages
- Create feature branches before working on features
- Follow naming convention: \`<model-role>_<model-name>/<task>\`
- Commit after each todo item completion with acceptance criteria
- Always pull latest from master before creating new branches
- Use git worktrees for parallel development

## State Machine Diagram

For a detailed state machine diagram showing system initialization, interconnections, and session lifecycle, see:

**[STATE_MACHINE.md](STATE_MACHINE.md)**

This document provides a comprehensive visualization of:
- Shell configuration and initialization flow
- Package manager setup
- AI agent system components
- Skills hierarchy and loading
- Plugin system architecture
- Development tools integration
- Session lifecycle management

## Available Commands

### Shell Commands

\`\`\`bash
# Update Oh My Zsh
omz update

# Switch Node versions
nvm install <version>
nvm use <version>

# Install npm packages
pnpm install <package>
bun install <package>

# Update Conda
conda update conda

# Run context analysis
cd ~/.claude/scripts
node context-analyzer.js

# Run linting
pnpm lint
prettier --write .

# Run tests
pnpm test
\`\`\`

### Claude Desktop Commands

Use slash commands:

\`\`\`
/plan - Create implementation plan
/code-review - Review code changes
/tdd - Execute TDD workflow
/context - Analyze codebase
/build-fix - Fix build errors
\`\`\`

## Troubleshooting

### Common Issues

**Shell not loading Oh My Zsh**

\`\`\`bash
# Verify Oh My Zsh installation
ls ~/.oh-my-zsh

# If missing, reinstall Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" ""
\`\`\`

**NVM not working**

\`\`\`bash
# Verify NVM installation
which nvm

# Source manually if not loaded
source ~/.nvm/nvm.sh
\`\`\`

**Python Conda issues**

\`\`\`bash
# Reset Conda environment
conda deactivate
conda init zsh

# Or create new environment
conda create -n <env_name>
\`\`\`

**Claude skills not loading**

\`\`\`bash
# Check Superpowers plugin status
ls ~/.config/opencode/plugin/superpowers.js

# Manually load skills using use_skill
use_skill <skill-name>
\`\`\`

### Getting Help

For issues with this dotfiles configuration:

1. **Check state machine diagram** - [STATE_MACHINE.md](STATE_MACHINE.md)
2. **Review architecture overview** - [Architecture Overview](#architecture-overview)
3. **Consult relevant skills** - Use \`use_skill\` or \`find_skills\`
4. **Check Claude rules** - \`.claude/rules/\`
5. **Review Git workflow** - \`.claude/rules/git-workflow.md\`

## Contributing

This is a personal dotfiles repository tailored for AI-assisted development. When making changes:

1. Test modifications in a shell session before committing
2. Update documentation for any architectural changes
3. Maintain consistency with existing patterns
4. Update state machine diagram if systems change

## License

Personal configuration files - use as needed for your own development environment.

## Resources

### Documentation

- [Oh My Zsh Documentation](https://github.com/ohmyzsh/ohmyzsh/wiki)
- [Claude Desktop Documentation](https://docs.anthropic.com)
- [OpenCode Documentation](https://opencode.ai/docs)

### Related Projects

- [Claude Code Plugins](https://github.com/anthropics/claude-code)
- [Claude Code Workflows](https://github.com/wshobson/agents)

---
