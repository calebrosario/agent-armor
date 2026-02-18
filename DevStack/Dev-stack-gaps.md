# Development Stack Gap Analysis

**Version:** 1.2  
**Last Updated:** February 14, 2026  
**Stack:** OpenCode + Oh-My-OpenCode + Skills + Plugins + MCP + Entire + CI/CD Tools

---

## Executive Summary

This document identifies gaps in the agentic development stack after recent additions (act, localstack, gh CLI, PR automation rules). Gaps are categorized by severity and include implementation plans.

**Current Status:**
- ✅ **Recently Addressed:** CI/CD local testing, GitHub integration (partial), PR automation rules
- 🔴 **Critical Gaps:** 2 remaining (Cost tracking, Automated testing enforcement)
- 🟡 **Important Gaps:** 4 remaining (Security, Documentation, Code quality, Performance)
- 🟢 **Enhancement Gaps:** 4 remaining (Knowledge base, Observability, etc.)

**Scope Definitions:**
- **🌍 Global Level:** Applies to all projects, configured in `~/.config/` or user environment
- **📁 Project Level:** Per-repository configuration in `.github/`, project root, or repo-specific settings
- **⚡ Hybrid:** Global tools with project-specific configurations

---

## Scope: Global vs Project Level

### 🌍 Global Level (User Environment)

**Applies To:** All projects, all agent sessions
**Location:** `~/.config/opencode/`, `~/.claude/`, shell profiles
**Managed By:** You (one-time setup)

**Examples:**
- Cost tracking scripts (track all API usage)
- Git configuration (`gh` CLI, git hooks templates)
- Global MCP servers (claude-mem)
- Agent orchestration (oh-my-opencode)
- Skills library (112+ skills)
- Session recovery (Entire)

### 📁 Project Level (Repository-Specific)

**Applies To:** Individual repositories
**Location:** `.github/workflows/`, project root, `.husky/`
**Managed By:** Each project's team/agents

**Examples:**
- GitHub Actions workflows (CI/CD)
- Pre-commit hooks (per repo)
- Linting/formatting configs (eslint, prettier)
- Test configurations
- Security scanning (repo-specific rules)
- Documentation generation (project APIs)

### ⚡ Hybrid Approach

**Global Tools + Project Configs:**
- `act` installed globally → project-specific `.github/workflows/`
- `localstack` installed globally → project-specific AWS resources
- `gh` installed globally → project-specific PR automation
- ESLint installed globally → project-specific `.eslintrc.json`

**Recommended Pattern:**
1. Install tools globally (once per user)
2. Configure per project (each repo decides settings)
3. Template configs for consistency

---

---

## ✅ Recently Addressed Gaps

### 1. CI/CD Local Testing
**Status:** ✅ **RESOLVED**

**Added:**
- `act` (v0.2.70+) for local GitHub Actions testing
- `localstack` for AWS service emulation
- Section 5.4 in Harness.md documenting tools
- Section 16 in AGENTS.md mandating local testing

**Evidence:**
```bash
$ act --version
act version 0.2.70

$ localstack --version
LocalStack version 3.8.0
```

**Usage:**
```bash
# Test workflows locally
act -j test
act pull_request

# Test AWS integrations
localstack start
awslocal s3 mb s3://test-bucket
```

---

### 2. GitHub Integration
**Status:** ⚠️ **PARTIALLY RESOLVED**

**Added:**
- `gh` CLI (v2.65+) installed and configured
- Section 17 in AGENTS.md for PR automation
- PR review rules using `requesting-code-review` skill
- PR checklist templates

**Remaining:**
- GitHub Actions workflow files (need creation)
- Automated PR review triggering (need implementation)
- Pre-commit hooks (need setup)

**Evidence:**
```bash
$ gh --version
gh version 2.65.0
```

---

## 🔴 Critical Gaps (Immediate Action Required)

### Gap 1: Cost Tracking & Budget Management
**Severity:** 🔴 **CRITICAL** | **Scope:** 🌍 **GLOBAL**  
**Financial Risk:** High  
**Effort:** Low (1-2 hours)  
**Location:** `~/.opencode/logs/`, shell profile

**Problem:**
No visibility into API costs, no budget alerts, no spend tracking per project or agent.

**Current State:**
```bash
$ opencode-cost
# → command not found

$ cat ~/.opencode/usage.log
# → No such file or directory
```

**Impact:**
- Runaway API costs possible
- No accountability per project
- Cannot optimize for cost-efficiency
- No budget planning capability

**Solution Options:**

**Option A: Simple Logging (Quick Win)**
```bash
# Add to ~/.zshrc or ~/.bashrc
export OPENCODE_LOG_DIR="$HOME/.opencode/logs"
mkdir -p $OPENCODE_LOG_DIR

# Create wrapper function
opencode-track() {
  tail -f $OPENCODE_LOG_DIR/*.log | grep -E "(tokens|cost|api_call)"
}

# Daily cost summary
opencode-daily-cost() {
  cat $OPENCODE_LOG_DIR/$(date +%Y-%m-%d).log | \
    jq -s '{total_tokens: map(.tokens) | add, total_cost: map(.cost) | add}'
}
```

**Option B: MCP Server (Better)**
- Create custom MCP server for cost tracking
- Integrate with OpenAI/Anthropic usage APIs
- Store in SQLite for querying
- Provide cost estimation before running tasks

**Option C: Full Dashboard (Best)**
- Grafana dashboard for visualization
- Monthly/quarterly reports
- Per-agent cost attribution
- Budget alerts (email/Slack)

**Recommended:** Start with Option A (today), migrate to Option B (this week)

**Acceptance Criteria:**
- [ ] Can view daily API spend
- [ ] Can see per-agent cost breakdown
- [ ] Budget alerts at $50/day, $500/month
- [ ] Cost estimation before large tasks

---

### Gap 2: Automated Testing Enforcement
**Severity:** 🔴 **CRITICAL** | **Scope:** ⚡ **HYBRID**  
**Quality Risk:** High  
**Effort:** Medium (4-6 hours)  
**Locations:** 
- Global: `act` CLI installed
- Project: `.github/workflows/ci.yml`, `.husky/pre-commit`

**Problem:**
Tests exist but no automated enforcement in CI/CD pipeline.

**Current State:**
- ✅ TDD skill mandates tests
- ✅ Local testing with `act`
- ❌ No CI/CD workflow file
- ❌ No automated test running on PR
- ❌ No pre-commit hooks

**Impact:**
- Tests may not be run consistently
- Regressions can slip through
- No quality gates
- Manual enforcement only

**Solution:**

**Step 1: Create GitHub Actions Workflow**
```yaml
# .github/workflows/ci.yml
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
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'bun'
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linter
        run: bun run lint
      
      - name: Run type checker
        run: bun run type-check
      
      - name: Run tests
        run: bun test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

**Step 2: Create PR Review Workflow**
```yaml
# .github/workflows/pr-review.yml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  automated-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run PR Review
        run: |
          # Trigger requesting-code-review skill
          # Post results as PR comment
          echo "Running automated PR review..."
```

**Step 3: Pre-commit Hooks**
```bash
# Install
bun add -D husky lint-staged

# Configure .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

bun run lint-staged

# Configure lint-staged
# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["bun run lint", "bun run type-check"],
    "*.{js,jsx}": ["bun run lint"],
    "*.py": ["uv run ruff check"]
  }
}
```

**Acceptance Criteria:**
- [ ] CI workflow runs on every PR
- [ ] Tests must pass before merge
- [ ] Coverage report generated
- [ ] Pre-commit hooks prevent bad commits
- [ ] PR review automation triggered

---

## 🟡 Important Gaps (Address This Month)

### Gap 3: Security Scanning Integration
**Severity:** 🟡 **IMPORTANT** | **Scope:** ⚡ **HYBRID**  
**Security Risk:** Medium  
**Effort:** Low (2-3 hours)  
**Locations:**
- Global: `gitleaks` CLI installed
- Project: `.github/workflows/security.yml`, GitHub settings

**Problem:**
No automated security scanning in CI/CD pipeline.

**Current State:**
- ✅ `security-review` skill (manual)
- ✅ `security-guidance` plugin (disabled)
- ❌ No automated SAST
- ❌ No dependency scanning
- ❌ No secrets detection

**Solution:**

**Enable GitHub Advanced Security (Free for public repos):**
```yaml
# .github/workflows/security.yml
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
          languages: javascript, typescript, python
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

  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: bun install
      - run: bun audit
```

**Additional Tools:**
- Enable Dependabot: `.github/dependabot.yml`
- Install gitleaks locally: `brew install gitleaks`
- Use Snyk for advanced scanning (optional)

**Acceptance Criteria:**
- [ ] CodeQL analysis on every PR
- [ ] Secret detection in commits
- [ ] Dependency vulnerability alerts
- [ ] Security policy documented

---

### Gap 4: Code Quality Automation
**Severity:** 🟡 **IMPORTANT** | **Scope:** ⚡ **HYBRID**  
**Technical Debt Risk:** Medium  
**Effort:** Low (2-3 hours)  
**Locations:**
- Global: `eslint`, `prettier` CLIs installed
- Project: `.eslintrc.json`, `.prettierrc`, `.husky/pre-commit`

**Problem:**
No automated enforcement of code quality standards.

**Current State:**
- ✅ `coding-standards` skill (guidelines)
- ✅ Manual verification rules
- ❌ No automated linting
- ❌ No formatting enforcement
- ❌ No complexity metrics

**Solution:**

**Step 1: Configure ESLint/Prettier**
```bash
# Install
bun add -D eslint prettier eslint-config-prettier

# Configure .eslintrc.json
{
  "extends": ["eslint:recommended", "@typescript-eslint/recommended", "prettier"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}

# Configure .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100
}
```

**Step 2: Add to CI Workflow**
```yaml
- name: Run ESLint
  run: bun run lint

- name: Check formatting
  run: bun run format:check
```

**Step 3: Pre-commit Integration**
Already covered in Gap 2

**Acceptance Criteria:**
- [ ] ESLint runs on every PR
- [ ] Prettier formatting enforced
- [ ] No console.log warnings
- [ ] Complexity metrics tracked

---

### Gap 5: Documentation Generation Pipeline
**Severity:** 🟡 **IMPORTANT** | **Scope:** 📁 **PROJECT LEVEL**  
**Knowledge Management Risk:** Medium  
**Effort:** Medium (4-6 hours)  
**Location:** `docs/`, `.github/workflows/docs.yml`, `typedoc.json`

**Problem:**
No systematic documentation generation or maintenance.

**Current State:**
- ✅ `mermaid` skill (diagrams)
- ✅ `docx` skill (documents)
- ✅ `document-writer` agent
- ❌ No auto-generated API docs
- ❌ No changelog automation
- ❌ No ADR tracking

**Solution:**

**Option A: TypeDoc for API Documentation**
```bash
# Install
bun add -D typedoc

# Generate docs
bun typedoc --out docs/api src/index.ts

# Add to CI
- name: Generate API docs
  run: bun run docs:generate
```

**Option B: Changelog Automation**
```bash
# Use conventional commits + auto-changelog
bun add -D auto-changelog

# Add to package.json
{
  "scripts": {
    "changelog": "auto-changelog --template keepachangelog"
  }
}
```

**Option C: ADR (Architecture Decision Records)**
```bash
# Create ADR directory
mkdir -p docs/adr

# Template: docs/adr/0001-use-postgresql.md
# Date: 2026-02-14
# Status: Accepted
# Context: [why]
# Decision: [what]
# Consequences: [tradeoffs]
```

**Acceptance Criteria:**
- [ ] API documentation auto-generated
- [ ] Changelog maintained automatically
- [ ] ADRs created for major decisions
- [ ] Documentation updated in CI

---

### Gap 6: Performance Monitoring
**Severity:** 🟢 **ENHANCEMENT** | **Scope:** 📁 **PROJECT LEVEL**  
**Performance Risk:** Low  
**Effort:** Medium (4-8 hours)  
**Location:** `benchmarks/`, `.github/workflows/performance.yml`, `performance-budget.json`

**Problem:**
No performance tracking or regression detection.

**Current State:**
- ❌ No benchmark tracking
- ❌ No performance regression detection
- ❌ No load testing
- ❌ No performance budgets

**Solution:**

**Step 1: Add Benchmarking**
```typescript
// benchmarks/performance.test.ts
import { bench, describe } from 'vitest';

describe('API Performance', () => {
  bench('fetch users', async () => {
    await fetchUsers();
  }, { time: 1000 });
});
```

**Step 2: Track in CI**
```yaml
- name: Run benchmarks
  run: bun run benchmark
  
- name: Compare with main
  run: bun run benchmark:compare
```

**Step 3: Performance Budgets**
```json
// performance-budget.json
{
  "bundleSize": {
    "max": "100kb",
    "warn": "80kb"
  },
  "apiResponse": {
    "p95": "200ms"
  }
}
```

**Acceptance Criteria:**
- [ ] Benchmarks run in CI
- [ ] Performance regression alerts
- [ ] Bundle size tracking
- [ ] Performance budgets enforced

---

## 🟢 Enhancement Gaps (Address This Quarter)

### Gap 7: Team Knowledge Base
**Severity:** 🟢 **ENHANCEMENT** | **Scope:** 🌍 **GLOBAL** (with project links)  
**Effort:** Medium (1-2 weeks)  
**Location:** Notion/Confluence (global), `docs/adr/` (per project)

**Current State:**
- ✅ `claude-mem` (personal memory)
- ✅ `.sisyphus/` directory
- ✅ Skills (encoded expertise)
- ❌ No team-wide knowledge base

**Solution:**
- Set up Notion/Confluence for team docs
- Create pattern library
- Troubleshooting runbooks
- Architecture decision log

---

### Gap 8: Observability & Analytics
**Severity:** 🟢 **ENHANCEMENT** | **Scope:** 🌍 **GLOBAL**  
**Effort:** High (2-4 weeks)  
**Location:** Grafana dashboard, analytics pipeline, `~/.opencode/analytics/`

**Current State:**
- ❌ No task completion metrics
- ❌ No time-to-completion tracking
- ❌ No agent effectiveness analytics

**Solution:**
- Custom analytics pipeline
- Grafana dashboard
- PostHog/Amplitude integration
- Agent performance comparison

---

## 📊 Implementation Priority Matrix

| Priority | Gap | Effort | Impact | Timeline |
|----------|-----|--------|--------|----------|
| 🔴 P0 | Cost Tracking | Low | Critical | Today |
| 🔴 P0 | Testing Enforcement | Medium | Critical | This Week |
| 🟡 P1 | Security Scanning | Low | High | This Week |
| 🟡 P1 | Code Quality | Low | High | This Week |
| 🟡 P1 | Documentation | Medium | Medium | This Month |
| 🟡 P1 | Performance | Medium | Low | This Month |
| 🟢 P2 | Knowledge Base | Medium | Medium | This Quarter |
| 🟢 P2 | Observability | High | Low | This Quarter |

---

## 🚀 Implementation Plan

### Implementation Scope Legend
- 🌍 **GLOBAL:** One-time setup, applies to all projects
- 📁 **PROJECT:** Per-repository setup, create templates for reuse
- ⚡ **HYBRID:** Global tools + project-specific configs

---

### Phase 1: Critical Foundations (Week 1)

**Scope Distribution:**
- 🌍 Global: 60% (cost tracking, git hooks template)
- 📁 Project: 40% (CI workflows, pre-commit setup)

**Day 1: Cost Tracking** 🌍 GLOBAL
```bash
# 1. Create logging infrastructure (ONE TIME)
mkdir -p ~/.opencode/logs

# 2. Add to shell profile (~/.zshrc or ~/.bashrc)
cat >> ~/.zshrc << 'EOF'
# OpenCode Cost Tracking
export OPENCODE_LOG_DIR="$HOME/.opencode/logs"
alias opencode-cost="tail -f $OPENCODE_LOG_DIR/*.log | grep -E '(tokens|cost)'"
alias opencode-daily="cat $OPENCODE_LOG_DIR/\$(date +%Y-%m-%d).log 2>/dev/null | jq -s 'map(.cost) | add'"
EOF

# 3. Create simple tracker script
mkdir -p ~/.local/bin
cat > ~/.local/bin/opencode-track << 'EOF'
#!/bin/bash
# Track OpenCode API usage
echo "$(date): $1" >> ~/.opencode/logs/tracking.log
EOF
chmod +x ~/.local/bin/opencode-track
```

**Result:** Cost tracking now works across ALL projects automatically

**Day 2-3: CI/CD Workflows** 📁 PROJECT (Create Template)
```bash
# 1. Create workflow directory (IN EACH PROJECT)
mkdir -p .github/workflows

# 2. Create CI workflow template
# Save as: ~/.config/opencode/templates/ci-workflow.yml
# Then copy to each project: cp ~/.config/opencode/templates/ci-workflow.yml .github/workflows/ci.yml

# 3. Create PR review workflow
# Template: ~/.config/opencode/templates/pr-review.yml

# 4. Test with act locally
act -j test
```

**Recommended:** Create reusable templates in `~/.config/opencode/templates/`

**Day 4-5: Pre-commit Hooks** 📁 PROJECT (Per Repository)
```bash
# Run IN EACH PROJECT:

# 1. Install (project-level)
bun add -D husky lint-staged

# 2. Configure
npx husky init

# 3. Add pre-commit hook
echo 'bun run lint-staged' > .husky/pre-commit

# 4. Configure lint-staged
# Add to package.json
```

**Tip:** Add husky/lint-staged setup to project onboarding checklist

**Deliverables:**
- [ ] 🌍 Cost tracking script operational (global)
- [ ] 📁 CI workflow template created (reusable)
- [ ] 📁 Pre-commit hooks active (per project)
- [ ] 📁 PR review workflow template created

---

### Phase 2: Quality & Security (Week 2)

**Scope Distribution:**
- 🌍 Global: 30% (gitleaks CLI, eslint/prettier CLIs)
- 📁 Project: 70% (workflows, configs per repo)

**Day 6-7: Security Scanning** ⚡ HYBRID
```bash
# GLOBAL (one time):
# 1. Install gitleaks CLI
brew install gitleaks

# PROJECT (per repo):
# 2. Enable GitHub Advanced Security
# Settings → Security & analysis → Enable all

# 3. Create security workflow
# Template: ~/.config/opencode/templates/security-workflow.yml
# Copy to: .github/workflows/security.yml
```

**Day 8-9: Code Quality** ⚡ HYBRID
```bash
# GLOBAL (CLIs already installed or install once):
npm install -g eslint prettier

# PROJECT (per repo):
# 1. Install linting tools (project-level for consistency)
bun add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 2. Create configs
# .eslintrc.json, .prettierrc

# 3. Add npm scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

**Day 10: Integration Testing**
```bash
# 1. Test all workflows locally
act

# 2. Create test PR
# 3. Verify all checks run
```

**Deliverables:**
- [ ] Security scanning enabled
- [ ] Code quality gates active
- [ ] All workflows tested
- [ ] Documentation updated

---

### Phase 3: Documentation & Performance (Weeks 3-4)

**Scope Distribution:**
- 📁 Project: 100% (all project-specific)

**Week 3: Documentation Pipeline** 📁 PROJECT LEVEL
```bash
# Run IN EACH PROJECT that needs API docs:

# 1. Set up TypeDoc (project-level for version consistency)
bun add -D typedoc

# 2. Configure
# typedoc.json (project-specific settings)

# 3. Add to CI
# .github/workflows/docs.yml (per project)
# Generate docs on main branch

# 4. Set up changelog (project-level)
bun add -D auto-changelog
# Configure in project package.json
```

**Note:** Not all projects need TypeDoc (only libraries with public APIs)

**Week 4: Performance Monitoring** 📁 PROJECT LEVEL
```bash
# Run IN EACH PROJECT with performance requirements:

# 1. Add benchmarking
bun add -D vitest

# 2. Create benchmark tests
# benchmarks/*.test.ts (project-specific benchmarks)

# 3. Track in CI
# .github/workflows/performance.yml (per project)
# Compare with main branch

# 4. Set budgets
# performance-budget.json (project-specific thresholds)
```

**Deliverables:**
- [ ] 📁 API docs auto-generated (per project)
- [ ] 📁 Changelog automated (per project)
- [ ] 📁 Benchmarks running (per project)
- [ ] Performance budgets set

---

### Phase 4: Enhancements (Ongoing)

**Scope Distribution:**
- 🌍 Global: 60% (knowledge base, observability)
- 📁 Project: 40% (project links, project-specific dashboards)

**Month 2: Knowledge Base** 🌍 GLOBAL (with project links)
```
GLOBAL:
- Set up Notion/Confluence workspace
- Create global templates (ADR, runbooks)
- Define taxonomy and organization

PROJECT (per repo):
- Create docs/adr/ directory
- Link to global knowledge base
- Add project-specific runbooks
```

**Month 3: Observability** 🌍 GLOBAL
```
GLOBAL:
- Analytics pipeline (track all agent usage)
- Grafana dashboard (global view)
- ~/.opencode/analytics/ storage

PROJECT (optional):
- Project-specific metrics
- Custom dashboards per team
```

---

## 📈 Success Metrics

**Phase 1 Success:**
- Cost visibility: Can view daily spend within 24 hours
- CI/CD: All PRs trigger automated tests
- Quality: Zero commits bypass pre-commit hooks

**Phase 2 Success:**
- Security: All PRs pass security scans
- Quality: Linting passes on 100% of commits
- Coverage: Test coverage maintained or improved

**Phase 3 Success:**
- Docs: API documentation always up-to-date
- Performance: No performance regressions in CI
- Automation: <5% manual intervention needed

---

## 📝 Notes

**Dependencies:**
- GitHub Actions available (public repo or GitHub Pro)
- Bun/Node.js installed
- AWS CLI configured (for localstack)

**Assumptions:**
- Repository is public (for free GitHub Advanced Security)
- Team uses GitHub (not GitLab/Bitbucket)
- Terminal workflow preferred

**Risks:**
- Cost tracking may require API keys from providers
- Security scanning may find existing vulnerabilities
- Performance budgets may require baseline establishment

---

## 📊 Scope Summary & Recommendations

### Global vs Project Distribution

| Phase | 🌍 Global | 📁 Project | ⚡ Hybrid | Focus |
|-------|-----------|------------|----------|-------|
| **Phase 1** | 60% | 40% | 0% | Cost tracking (G), CI templates (P) |
| **Phase 2** | 30% | 70% | 0% | Security (H), Quality (H) |
| **Phase 3** | 0% | 100% | 0% | Docs (P), Performance (P) |
| **Phase 4** | 60% | 40% | 0% | Knowledge base (G+P) |

### Setup Strategy

**🌍 Global Setup (One Time):**
1. Cost tracking infrastructure
2. CLI tools (act, localstack, gh, gitleaks, eslint)
3. Template directory (`~/.config/opencode/templates/`)
4. Analytics pipeline (future)
5. Knowledge base workspace (future)

**📁 Project Setup (Per Repository):**
1. Copy workflow templates from global
2. Configure project-specific settings
3. Install project-level dependencies
4. Set up pre-commit hooks
5. Customize for project needs

### Template Strategy

**Create Once (Global), Use Everywhere (Projects):**

```bash
# Create global templates directory
mkdir -p ~/.config/opencode/templates/

# Create reusable workflow templates
touch ~/.config/opencode/templates/ci-workflow.yml
touch ~/.config/opencode/templates/security-workflow.yml
touch ~/.config/opencode/templates/pr-review-workflow.yml
touch ~/.config/opencode/templates/docs-workflow.yml

# Create project setup script
cat > ~/.config/opencode/templates/setup-project.sh << 'EOF'
#!/bin/bash
# Initialize new project with standard tooling
# Usage: setup-project.sh <project-name>

PROJECT_NAME=$1
mkdir -p $PROJECT_NAME/.github/workflows
mkdir -p $PROJECT_NAME/.husky

# Copy templates
cp ~/.config/opencode/templates/ci-workflow.yml $PROJECT_NAME/.github/workflows/ci.yml
cp ~/.config/opencode/templates/security-workflow.yml $PROJECT_NAME/.github/workflows/security.yml

# Initialize project
cd $PROJECT_NAME
git init
bun init
bun add -D husky lint-staged eslint prettier
npx husky init

echo "Project $PROJECT_NAME initialized with standard tooling"
EOF
chmod +x ~/.config/opencode/templates/setup-project.sh
```

### Recommendation: Hybrid Approach

**For New Projects:**
```bash
# One command setup
~/.config/opencode/templates/setup-project.sh my-new-project
cd my-new-project
# Customize as needed
```

**For Existing Projects:**
```bash
# Copy only needed workflows
cp ~/.config/opencode/templates/ci-workflow.yml .github/workflows/ci.yml

# Install project-level tools
bun add -D husky lint-staged
```

### Maintenance Strategy

**🌍 Global Updates:**
- Update templates centrally
- Version control templates
- Announce template changes to teams

**📁 Project Updates:**
- Each project manages own configs
- Can override global templates
- Independent upgrade cycles

---

## 🎯 Next Steps

### Immediate (Today) - 🌍 Global
1. ✅ Implement cost tracking script (`~/.opencode/logs/`)
2. ✅ Create template directory structure
3. ✅ Test with `act` (already installed)

### This Week - 📁 Project
4. ⬜ Create first project CI workflow (use template)
5. ⬜ Enable security scanning (GitHub settings + workflow)
6. ⬜ Configure linting/formatting (per project)
7. ⬜ Set up pre-commit hooks (per project)

### This Month - 📁 Project + 🌍 Global
8. ⬜ Documentation pipeline (projects that need it)
9. ⬜ Performance monitoring (performance-critical projects)
10. ⬜ Set up global knowledge base (Notion/Confluence)

### Ongoing - 🌍 Global
11. ⬜ Observability dashboard (track all usage)

### Review Cadence
- **Daily:** Check cost tracking (first week)
- **Weekly:** Review CI/CD adoption across projects
- **Monthly:** Assess gap closure progress
- **Quarterly:** Full stack review and planning

---

## 🎓 Decision Guide

**Should I implement this globally or per-project?**

| Question | If Yes | If No |
|----------|--------|-------|
| Does it track usage/costs? | 🌍 Global | 📁 Project |
| Is it a CLI tool? | 🌍 Global | N/A |
| Does every project need it? | 🌍 Global or ⚡ Hybrid | 📁 Project |
| Is it project-specific config? | 📁 Project | N/A |
| Can it be templated? | ⚡ Hybrid (template global, config project) | 🌍 Global |

**Examples:**
- Cost tracking → 🌍 Global (track everything)
- ESLint CLI → 🌍 Global (installed once)
- ESLint config → 📁 Project (per project rules)
- CI workflow → ⚡ Hybrid (global template, project file)
- API docs → 📁 Project (only some projects need it)

---

*Last Updated: February 14, 2026*  
*Next Review: March 14, 2026*
