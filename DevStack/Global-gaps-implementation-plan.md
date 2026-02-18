# Global Gaps Implementation Plan

**Scope:** 🌍 Global Level Only  
**Target:** Infrastructure and tools that apply to ALL projects  
**Timeline:** 2 weeks for critical + foundation  
**Prerequisites:** act, localstack, gh already installed

---

## Executive Summary

This plan addresses **only global-level gaps** - infrastructure, tools, and configurations that apply across all projects. Project-level implementations are explicitly out of scope for this phase.

**Global Gaps to Address:**

| Priority | Gap | Scope | Status |
|----------|-----|-------|--------|
| 🔴 P0 | Cost Tracking | 🌍 Pure Global | Not Started |
| 🔴 P0 | Testing Infrastructure | ⚡ Hybrid (Global part) | Partial (act installed) |
| 🟡 P1 | Security Tools | ⚡ Hybrid (Global part) | Not Started |
| 🟡 P1 | Code Quality Tools | ⚡ Hybrid (Global part) | Not Started |
| 🟢 P2 | Knowledge Base | 🌍 Pure Global | Not Started |
| 🟢 P2 | Observability | 🌍 Pure Global | Not Started |

**What's In Scope (Global):**
- CLI tool installations
- Global configuration files
- Template creation
- Infrastructure setup
- Environment variables
- Shell aliases/functions

**What's Out of Scope (Project):**
- `.github/workflows/` files
- Project-specific configs
- Pre-commit hooks (per repo)
- Repository initialization

---

## Phase 1: Critical Global Infrastructure (Week 1)

### Day 1: Cost Tracking System (🌍 Global)
**Goal:** Track API usage and costs across ALL projects
**Location:** `~/.opencode/`, shell profile
**Impact:** Financial visibility, budget control

#### 1.1 Create Directory Structure
```bash
# Create global tracking infrastructure
mkdir -p ~/.opencode/{logs,analytics,templates}
mkdir -p ~/.local/bin
touch ~/.opencode/.gitignore  # Don't commit logs
```

#### 1.2 Cost Tracking Script
```bash
# File: ~/.local/bin/opencode-track
cat > ~/.local/bin/opencode-track << 'SCRIPT'
#!/bin/bash
# OpenCode API Usage Tracker
# Usage: opencode-track <model> <tokens_in> <tokens_out>

LOG_DIR="${OPENCODE_LOG_DIR:-$HOME/.opencode/logs}"
mkdir -p "$LOG_DIR"

MODEL="$1"
TOKENS_IN="${2:-0}"
TOKENS_OUT="${3:-0}"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

# Cost calculation (approximate rates)
calculate_cost() {
    local model=$1
    local tokens_in=$2
    local tokens_out=$3
    
    case "$model" in
        "claude-opus"*)
            echo "scale=6; ($tokens_in * 0.000015) + ($tokens_out * 0.000075)" | bc
            ;;
        "claude-sonnet"*)
            echo "scale=6; ($tokens_in * 0.000003) + ($tokens_out * 0.000015)" | bc
            ;;
        "gpt-4"*)
            echo "scale=6; ($tokens_in * 0.00003) + ($tokens_out * 0.00006)" | bc
            ;;
        *)
            echo "0.0001"  # Default fallback
            ;;
    esac
}

COST=$(calculate_cost "$MODEL" "$TOKENS_IN" "$TOKENS_OUT")

# Log entry
LOG_ENTRY="${TIMESTAMP}|${MODEL}|${TOKENS_IN}|${TOKENS_OUT}|${COST}"
echo "$LOG_ENTRY" >> "$LOG_DIR/usage-${DATE}.log"

# Daily summary
DAILY_LOG="$LOG_DIR/daily-${DATE}.log"
if [ ! -f "$DAILY_LOG" ]; then
    echo "date|model|total_calls|total_in|total_out|total_cost" > "$DAILY_LOG"
fi

# Update daily summary (simplified - append and aggregate later)
echo "$LOG_ENTRY" >> "$DAILY_LOG"
SCRIPT
chmod +x ~/.local/bin/opencode-track
```

#### 1.3 Shell Aliases & Functions
```bash
# Add to ~/.zshrc or ~/.bashrc

cat >> ~/.zshrc << 'ALIASES'

# ============================================
# OpenCode Global Configuration
# ============================================
export OPENCODE_LOG_DIR="$HOME/.opencode/logs"
export OPENCODE_ANALYTICS_DIR="$HOME/.opencode/analytics"
export OPENCODE_TEMPLATES_DIR="$HOME/.config/opencode/templates"

# Cost tracking aliases
alias opencode-logs="tail -f $OPENCODE_LOG_DIR/usage-$(date +%Y-%m-%d).log"
alias opencode-today="cat $OPENCODE_LOG_DIR/usage-$(date +%Y-%m-%d).log 2>/dev/null || echo 'No usage today'"
alias opencode-cost='function _opencode_cost() {
    local date="${1:-$(date +%Y-%m-%d)}"
    local logfile="$OPENCODE_LOG_DIR/usage-${date}.log"
    if [ -f "$logfile" ]; then
        echo "Usage for $date:"
        awk -F"|" "{in_t+=\$3; out_t+=\$4; cost+=\$5} END {printf \"Input: %d tokens\\nOutput: %d tokens\\nTotal: %d tokens\\nCost: $%.4f\\n\", in_t, out_t, in_t+out_t, cost}" "$logfile"
    else
        echo "No usage data for $date"
    fi
}; _opencode_cost'

alias opencode-month='function _opencode_month() {
    local month="${1:-$(date +%Y-%m)}"
    echo "Usage for month: $month"
    for f in $OPENCODE_LOG_DIR/usage-${month}-*.log; do
        [ -f "$f" ] || continue
        awk -F"|" "{in_t+=\$3; out_t+=\$4; cost+=\$5} END {printf \"%s: %d tokens, $%.4f\\n\", FILENAME, in_t+out_t, cost}" "$f"
    done | awk "{t+=\$3; c+=\$5} END {printf \"\\nTotal: %d tokens, $%.4f\\n\", t, c}"
}; _opencode_month'

# Quick navigation
alias opencode-dir="cd ~/.opencode"
alias opencode-templates="cd $OPENCODE_TEMPLATES_DIR"

ALIASES
```

#### 1.4 Weekly Cleanup Script
```bash
# File: ~/.local/bin/opencode-cleanup
cat > ~/.local/bin/opencode-cleanup << 'CLEANUP'
#!/bin/bash
# Cleanup old logs (keep 90 days)

LOG_DIR="${OPENCODE_LOG_DIR:-$HOME/.opencode/logs}"
find "$LOG_DIR" -name "usage-*.log" -mtime +90 -delete
find "$LOG_DIR" -name "daily-*.log" -mtime +90 -delete

echo "Cleaned up logs older than 90 days"
CLEANUP
chmod +x ~/.local/bin/opencode-cleanup

# Add to crontab for weekly cleanup
(crontab -l 2>/dev/null; echo "0 0 * * 0 ~/.local/bin/opencode-cleanup") | crontab -
```

#### Acceptance Criteria
- [ ] `opencode-track` command works
- [ ] Daily logs created in `~/.opencode/logs/`
- [ ] `opencode-today` shows today's usage
- [ ] `opencode-cost 2026-02-14` shows specific date
- [ ] Costs calculated automatically
- [ ] Weekly cleanup scheduled

---

### Day 2: Global CLI Tool Verification (🌍 Global)
**Goal:** Ensure all required CLIs installed globally
**Location:** System PATH
**Impact:** Foundation for hybrid gaps

#### 2.1 Verify Existing Tools
```bash
# Check current installations
echo "=== Global CLI Tools Audit ==="
echo ""

echo "✅ act (GitHub Actions local runner):"
act --version || echo "❌ NOT INSTALLED"

echo ""
echo "✅ localstack (AWS local emulation):"
localstack --version || echo "❌ NOT INSTALLED"

echo ""
echo "✅ gh (GitHub CLI):"
gh --version || echo "❌ NOT INSTALLED"

echo ""
echo "=== Tools Needed for Hybrid Gaps ==="
echo ""

echo "🔄 gitleaks (secrets detection):"
gitleaks --version || echo "❌ NOT INSTALLED - Install with: brew install gitleaks"

echo ""
echo "🔄 eslint (JavaScript/TypeScript linting):"
eslint --version || echo "❌ NOT INSTALLED - Install with: npm install -g eslint"

echo ""
echo "🔄 prettier (code formatting):"
prettier --version || echo "❌ NOT INSTALLED - Install with: npm install -g prettier"
```

#### 2.2 Install Missing Global Tools
```bash
# Install gitleaks (security scanning)
brew install gitleaks

# Install global linting/formatting tools
npm install -g eslint prettier

# Optional: Install additional global tools
npm install -g @anthropic-ai/claude-cli  # If using Claude CLI standalone
```

#### 2.3 Create Global Config Templates
```bash
# Create global ESLint config template
mkdir -p ~/.config/opencode/templates
cat > ~/.config/opencode/templates/.eslintrc.json << 'ESLINT'
{
  "root": true,
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "env": {
    "node": true,
    "es2022": true
  }
}
ESLINT

# Create global Prettier config template
cat > ~/.config/opencode/templates/.prettierrc << 'PRETTIER'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
PRETTIER

# Create global .gitignore template
cat > ~/.config/opencode/templates/.gitignore-global << 'GITIGNORE'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.log

# Production
build/
dist/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# OpenCode
.opencode/logs/
.opencode/analytics/
*.session
GITIGNORE
```

#### Acceptance Criteria
- [ ] All CLIs in PATH
- [ ] `gitleaks --version` works
- [ ] `eslint --version` works
- [ ] `prettier --version` works
- [ ] Templates created in `~/.config/opencode/templates/`

---

### Day 3: Workflow Templates (⚡ Hybrid - Global Part)
**Goal:** Create reusable workflow templates
**Location:** `~/.config/opencode/templates/`
**Impact:** Consistency across all projects

#### 3.1 CI Workflow Template
```bash
# File: ~/.config/opencode/templates/ci-workflow.yml
cat > ~/.config/opencode/templates/ci-workflow.yml << 'WORKFLOW'
name: CI

on:
  push:
    branches: [main, master, dev]
  pull_request:
    branches: [main, master, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linter
        run: bun run lint
      
      - name: Run type checker
        run: bun run type-check || echo "No type-check script"
      
      - name: Run tests
        run: bun test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
WORKFLOW
```

#### 3.2 Security Workflow Template
```bash
# File: ~/.config/opencode/templates/security-workflow.yml
cat > ~/.config/opencode/templates/security-workflow.yml << 'SECURITY'
name: Security Scan

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript
      - uses: github/codeql-action/analyze@v3

  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2

  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun audit
SECURITY
```

#### 3.3 PR Review Workflow Template
```bash
# File: ~/.config/opencode/templates/pr-review-workflow.yml
cat > ~/.config/opencode/templates/pr-review-workflow.yml << 'PRREVIEW'
name: PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate PR Review
        run: |
          echo "## Automated PR Review" > review.md
          echo "" >> review.md
          echo "### Summary" >> review.md
          echo "- Files changed: $(git diff --name-only main...HEAD | wc -l)" >> review.md
          echo "- Lines added: $(git diff --stat main...HEAD | tail -1 | awk '{print $4}')" >> review.md
          echo "- Lines removed: $(git diff --stat main...HEAD | tail -1 | awk '{print $6}')" >> review.md
          
      - name: Post Review Comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
PRREVIEW
```

#### 3.4 Project Setup Script
```bash
# File: ~/.config/opencode/templates/setup-project.sh
cat > ~/.config/opencode/templates/setup-project.sh << 'SETUP'
#!/bin/bash
# Initialize new project with standard tooling
# Usage: setup-project.sh <project-name> [project-type]

set -e

PROJECT_NAME="$1"
PROJECT_TYPE="${2:-typescript}"  # typescript, python, or generic

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: setup-project.sh <project-name> [project-type]"
    echo "Types: typescript, python, generic"
    exit 1
fi

if [ -d "$PROJECT_NAME" ]; then
    echo "Error: Directory $PROJECT_NAME already exists"
    exit 1
fi

TEMPLATE_DIR="${OPENCODE_TEMPLATES_DIR:-$HOME/.config/opencode/templates}"

echo "🚀 Creating project: $PROJECT_NAME (type: $PROJECT_TYPE)"

# Create directory structure
mkdir -p "$PROJECT_NAME/.github/workflows"
mkdir -p "$PROJECT_NAME/.husky"
mkdir -p "$PROJECT_NAME/docs"

# Copy workflow templates
cp "$TEMPLATE_DIR/ci-workflow.yml" "$PROJECT_NAME/.github/workflows/ci.yml"
cp "$TEMPLATE_DIR/security-workflow.yml" "$PROJECT_NAME/.github/workflows/security.yml"
cp "$TEMPLATE_DIR/pr-review-workflow.yml" "$PROJECT_NAME/.github/workflows/pr-review.yml"

# Copy config templates
cp "$TEMPLATE_DIR/.gitignore-global" "$PROJECT_NAME/.gitignore"

# Initialize based on type
cd "$PROJECT_NAME"

case "$PROJECT_TYPE" in
    typescript)
        echo "📦 Initializing TypeScript project..."
        bun init
        bun add -D husky lint-staged eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
        cp "$TEMPLATE_DIR/.eslintrc.json" .eslintrc.json
        cp "$TEMPLATE_DIR/.prettierrc" .prettierrc
        
        # Add scripts to package.json
        node -e "
            const pkg = JSON.parse(require('fs').readFileSync('package.json'));
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.lint = 'eslint . --ext .ts,.tsx';
            pkg.scripts['lint:fix'] = 'eslint . --ext .ts,.tsx --fix';
            pkg.scripts.format = 'prettier --write .';
            pkg.scripts['format:check'] = 'prettier --check .';
            pkg.scripts['type-check'] = 'tsc --noEmit';
            pkg.scripts.test = 'bun test';
            require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        ;;
    python)
        echo "🐍 Initializing Python project..."
        uv init
        # Add Python-specific setup
        ;;
    generic)
        echo "📁 Initializing generic project..."
        git init
        ;;
esac

# Initialize husky
npx husky init 2>/dev/null || echo "Husky init skipped"

# Create README
cat > README.md << EOF
# $PROJECT_NAME

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Run tests
bun test

# Run linter
bun run lint
\`\`\`

## Development

This project uses:
- Bun for package management
- ESLint for linting
- Prettier for formatting
- Husky for git hooks
EOF

echo ""
echo "✅ Project '$PROJECT_NAME' created successfully!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  git add ."
echo "  git commit -m 'Initial commit'"
echo "  gh repo create $PROJECT_NAME --public --source=. --push"
SETUP
chmod +x ~/.config/opencode/templates/setup-project.sh
```

#### Acceptance Criteria
- [ ] All templates in `~/.config/opencode/templates/`
- [ ] `setup-project.sh` executable
- [ ] Can run: `setup-project.sh test-project typescript`
- [ ] Creates project with workflows and configs

---

### Day 4: Global Git Configuration (🌍 Global)
**Goal:** Standardize git behavior across all projects
**Location:** `~/.gitconfig`
**Impact:** Consistency, productivity

#### 4.1 Global Git Config
```bash
# Add to ~/.gitconfig

git config --global user.name "Caleb Rosario"
git config --global user.email "rosario.caleb@gmail.com"

# Useful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.last "log -1 HEAD"
git config --global alias.unstage "reset HEAD --"
git config --global alias.visual "!gitk"

# Better diffs
git config --global core.pager "delta"
git config --global interactive.diffFilter "delta --color-only"

# Safety
git config --global init.defaultBranch main
git config --global push.default simple
git config --global pull.rebase true

# Large file handling
git config --global core.excludesfile ~/.gitignore_global
```

#### 4.2 Global .gitignore
```bash
# Create ~/.gitignore_global
cat > ~/.gitignore_global << 'GITIGNORE'
# OS
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
*.temp
.cache/

# OpenCode specific
.opencode/logs/
.opencode/analytics/
*.session
*.checkpoint
GITIGNORE

git config --global core.excludesfile ~/.gitignore_global
```

#### Acceptance Criteria
- [ ] Git aliases work (`git st`, `git lg`)
- [ ] Global .gitignore active
- [ ] Default branch is `main`
- [ ] User info configured

---

## Phase 2: Foundation Gaps (Week 2)

### Day 5-6: Knowledge Base Infrastructure (🌍 Global)
**Goal:** Centralized knowledge management
**Location:** Notion/Confluence or local Obsidian
**Impact:** Team knowledge sharing

#### 6.1 Local Knowledge Base (Obsidian)
```bash
# Create knowledge base directory
mkdir -p ~/KnowledgeBase/{Projects,Runbooks,Architecture,Decisions,Playbooks}

# Create templates
cat > ~/KnowledgeBase/Templates/ADR.md << 'ADR'
# ADR-XXX: [Title]

## Status
- Proposed / Accepted / Deprecated / Superseded by [ADR-YYY]

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing or have agreed to implement?]

## Consequences
[What becomes easier or more difficult to do and any risks introduced?]

## Related
- [Links to related ADRs, issues, PRs]
ADR

cat > ~/KnowledgeBase/Templates/Runbook.md << 'RUNBOOK'
# Runbook: [Title]

## Purpose
[What is this runbook for?]

## Prerequisites
- [List of requirements]

## Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Troubleshooting
| Issue | Solution |
|-------|----------|
| [Problem] | [Solution] |

## References
- [Links to docs, code, etc.]
RUNBOOK

cat > ~/KnowledgeBase/Templates/Project-Setup.md << 'PROJECT'
# Project: [Name]

## Overview
[Brief description]

## Tech Stack
- Language: 
- Framework:
- Database:
- Hosting:

## Development
\`\`\`bash
# Install

# Run

# Test
\`\`\`

## Architecture
[Diagrams, key components]

## ADRs
- [Link to decision records]

## Team
- Owner:
- Contributors:
PROJECT
```

#### 6.2 Knowledge Base Index
```bash
cat > ~/KnowledgeBase/README.md << 'INDEX'
# Knowledge Base

Centralized documentation for development workflows, decisions, and runbooks.

## Structure

- **Projects/** - Per-project documentation and setup guides
- **Runbooks/** - Operational procedures and troubleshooting
- **Architecture/** - System design and patterns
- **Decisions/** - Architecture Decision Records (ADRs)
- **Playbooks/** - Standard operating procedures

## Templates

Available in `Templates/` directory:
- `ADR.md` - Architecture Decision Record
- `Runbook.md` - Operational runbook
- `Project-Setup.md` - Project documentation

## Quick Links

- [Development Workflow](./Playbooks/Development-Workflow.md)
- [Emergency Procedures](./Runbooks/Emergency-Procedures.md)
- [Common Issues](./Runbooks/Common-Issues.md)
INDEX
```

#### Acceptance Criteria
- [ ] Knowledge base directory created
- [ ] Templates available
- [ ] README with structure
- [ ] Can create new docs from templates

---

### Day 7-8: Observability Infrastructure (🌍 Global)
**Goal:** Track agent effectiveness and usage patterns
**Location:** `~/.opencode/analytics/`
**Impact:** Data-driven improvements

#### 8.1 Analytics Directory Structure
```bash
mkdir -p ~/.opencode/analytics/{daily,weekly,agents,projects}

# Create analytics tracking script
cat > ~/.local/bin/opencode-analytics << 'ANALYTICS'
#!/bin/bash
# Aggregate usage analytics

LOG_DIR="${OPENCODE_LOG_DIR:-$HOME/.opencode/logs}"
ANALYTICS_DIR="${OPENCODE_ANALYTICS_DIR:-$HOME/.opencode/analytics}"
DATE=$(date +%Y-%m-%d)

# Daily aggregation
aggregate_daily() {
    local date=$1
    local logfile="$LOG_DIR/usage-${date}.log"
    local output="$ANALYTICS_DIR/daily/${date}.json"
    
    if [ ! -f "$logfile" ]; then
        echo "No data for $date"
        return
    fi
    
    # Aggregate with awk, output JSON
    awk -F"|" -v date="$date" '
    BEGIN {
        print "{"
        print "  \"date\": \"" date "\","
        print "  \"models\": {"
    }
    {
        models[$2]++
        tokens_in[$2] += $3
        tokens_out[$2] += $4
        cost[$2] += $5
    }
    END {
        first = 1
        for (model in models) {
            if (!first) print ","
            first = 0
            printf "    \"%s\": {\n", model
            printf "      \"calls\": %d,\n", models[model]
            printf "      \"tokens_in\": %d,\n", tokens_in[model]
            printf "      \"tokens_out\": %d,\n", tokens_out[model]
            printf "      \"cost\": %.4f\n", cost[model]
            printf "    }"
        }
        print ""
        print "  }"
        print "}"
    }
    ' "$logfile" > "$output"
    
    echo "Aggregated: $output"
}

# Weekly report
generate_weekly() {
    local week=$1
    echo "Generating weekly report for week $week..."
    # Implementation for weekly aggregation
}

# Main
case "${1:-daily}" in
    daily)
        aggregate_daily "${2:-$DATE}"
        ;;
    weekly)
        generate_weekly "${2:-$(date +%Y-W%U)}"
        ;;
    *)
        echo "Usage: opencode-analytics [daily|weekly] [date]"
        ;;
esac
ANALYTICS
chmod +x ~/.local/bin/opencode-analytics
```

#### 8.2 Weekly Report Script
```bash
cat > ~/.local/bin/opencode-weekly-report << 'WEEKLY'
#!/bin/bash
# Generate weekly usage report

ANALYTICS_DIR="${OPENCODE_ANALYTICS_DIR:-$HOME/.opencode/analytics}"
WEEK=$(date +%Y-W%U)
REPORT_FILE="$ANALYTICS_DIR/weekly/${WEEK}.md"

mkdir -p "$ANALYTICS_DIR/weekly"

cat > "$REPORT_FILE" << EOF
# Weekly Report: $WEEK

Generated: $(date)

## Summary

| Metric | Value |
|--------|-------|
| Total API Calls | [TBD] |
| Total Tokens | [TBD] |
| Total Cost | [TBD] |
| Active Projects | [TBD] |

## Usage by Model

[TBD - aggregate from daily]

## Top Projects

[TBD - if project tracking enabled]

## Insights

- [TBD]

## Recommendations

- [TBD]
EOF

echo "Weekly report: $REPORT_FILE"
WEEKLY
chmod +x ~/.local/bin/opencode-weekly-report

# Schedule weekly report
(crontab -l 2>/dev/null; echo "0 9 * * 1 ~/.local/bin/opencode-weekly-report") | crontab -
```

#### Acceptance Criteria
- [ ] Analytics directory structure
- [ ] `opencode-analytics` command works
- [ ] Daily aggregation functional
- [ ] Weekly report generated
- [ ] Scheduled in crontab

---

## Summary: Global Implementation Checklist

### Phase 1: Critical (Week 1)
- [ ] **Day 1:** Cost tracking system
  - [ ] `~/.opencode/logs/` directory
  - [ ] `opencode-track` script
  - [ ] Shell aliases configured
  - [ ] Cleanup scheduled
- [ ] **Day 2:** CLI tool verification
  - [ ] gitleaks installed
  - [ ] eslint installed globally
  - [ ] prettier installed globally
  - [ ] Config templates created
- [ ] **Day 3:** Workflow templates
  - [ ] CI workflow template
  - [ ] Security workflow template
  - [ ] PR review workflow template
  - [ ] `setup-project.sh` script
- [ ] **Day 4:** Git configuration
  - [ ] Global .gitconfig
  - [ ] Git aliases working
  - [ ] Global .gitignore
  - [ ] Default branch set

### Phase 2: Foundation (Week 2)
- [ ] **Days 5-6:** Knowledge base
  - [ ] `~/KnowledgeBase/` structure
  - [ ] Templates created
  - [ ] README with index
- [ ] **Days 7-8:** Observability
  - [ ] `~/.opencode/analytics/` structure
  - [ ] Analytics scripts
  - [ ] Weekly reports scheduled

---

## Post-Implementation: Ready for Project Rollout

After completing global setup, you'll have:

✅ **Global Infrastructure:**
- Cost tracking across all projects
- CLI tools installed and ready
- Reusable templates
- Analytics pipeline

✅ **For Each New Project:**
```bash
# One command setup
~/.config/opencode/templates/setup-project.sh my-project typescript

# Or manual copy
cp ~/.config/opencode/templates/ci-workflow.yml .github/workflows/
```

✅ **Daily Usage:**
```bash
opencode-today          # See today's usage
opencode-cost 2026-02-14 # See specific date
opencode-analytics daily  # Generate daily report
```

---

*Plan Version:* 1.0  
*Scope:* Global Only  
*Estimated Time:* 10-14 days  
*Prerequisites Met:* act, localstack, gh installed
