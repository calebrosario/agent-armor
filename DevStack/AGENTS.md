# AGENT RULES

## 1. Language & Communication
- Always communicate in English
- Enforce English-only thinking and output

## 2. Package Management
- Use `uv` for Python package management
- Use `bun` for JavaScript/TypeScript package management
- Never use `npm` or `pip` for package installation

## 3. CLI Commands & RTK Token Optimization

### 3.1 RTK (Return Token Kit)

**RTK is installed and should be used for all applicable CLI commands to reduce token consumption by 60-90%.**

**Binary location:** `~/.local/bin/rtk`

### 3.2 Available RTK Commands

When executing CLI commands, prefer RTK-wrapped versions:

| Standard Command | RTK Equivalent | Purpose | Token Savings |
|------------------|----------------|---------|---------------|
| `git diff` | `rtk git diff` | Show changes | ~70% |
| `git log` | `rtk git log --oneline -20` | Commit history | ~65% |
| `git status` | `rtk git status` | Working tree status | ~50% |
| `ls -la` | `rtk ls -la` | List files | ~70% |
| `tree -L 3` | `rtk tree -L 3` | Directory structure | ~75% |
| `find . -name` | `rtk find . -name` | Search files | ~80% |
| `npm test` | `rtk test` | Run tests | ~85% |
| `pytest` | `rtk pytest` | Python tests | ~85% |
| `tsc` | `rtk tsc` | TypeScript compiler | ~75% |
| `eslint` | `rtk lint` | Linting | ~70% |

### 3.3 Agent Usage Guidelines

**MUST use RTK for:**
- All `git` operations (diff, log, status, show)
- File listing commands (`ls`, `tree`, `find`)
- Test runners (`npm test`, `pytest`, `vitest`)
- Build tools (`tsc`, `eslint`, `next`)
- Package manager output (`npm`, `pnpm`, `bun`, `pip`)

**Example:**
```bash
# CORRECT: Use RTK for token-efficient output
rtk git diff HEAD~5
rtk ls -la src/
rtk test --coverage

# AVOID: Standard commands (higher token usage)
git diff HEAD~5
ls -la src/
npm test --coverage
```

### 3.4 Shell Aliases (For Reference)

The following aliases are configured in `~/.zshrc` and `~/.bashrc`:

**Git & GitHub:**
- `gd` → `rtk git diff`
- `gds` → `rtk git diff --staged`
- `gl` → `rtk git log --oneline -20`
- `gs` → `rtk git status`
- `gsh` → `rtk git show`
- `rgh` → `rtk gh` (GitHub CLI)

**File Operations:**
- `lt` → `rtk tree -L 3`
- `lf` → `rtk ls -la`
- `rf` → `rtk read`
- `fd` → `rtk find`
- `rg` → `rtk grep`

**Testing:**
- `rt` → `rtk test`
- `rp` → `rtk pytest`
- `rv` → `rtk vitest`
- `rpw` → `rtk playwright`

**Build & Development:**
- `rts` → `rtk tsc`
- `rl` → `rtk lint`
- `rfmt` → `rtk format`
- `rnext` → `rtk next`
- `rerr` → `rtk err` (errors only)

**Package Managers:**
- `rnpm` → `rtk npm`
- `rpnpm` → `rtk pnpm`
- `rbun` → `rtk bun`
- `rpip` / `ruv` → `rtk pip`

**Databases & Tools:**
- `rprisma` → `rtk prisma`
- `rdock` → `rtk docker`
- `rk` → `rtk kubectl`
- `rruff` → `rtk ruff`

**Utilities:**
- `rjson` → `rtk json`
- `rlog` → `rtk log`
- `rcurl` → `rtk curl`
- `rwget` → `rtk wget`
- `renv` → `rtk env`
- `rd` → `rtk deps`
- `rsm` → `rtk smart`
- `rgain` → `rtk gain` (view savings)
- `recon` → `rtk cc-economics`

**Note:** Agents execute commands via non-interactive shells, so shell aliases are not automatically available. **Always use the full `rtk <command>` syntax.**

### 3.5 Mandatory RTK Usage Rule

**ALL agents MUST use RTK for the following command categories:**

1. **File System Operations** - Any `ls`, `tree`, `find`, `cat` commands
2. **Git Operations** - All `git` commands (diff, log, status, show)
3. **Testing** - All test runners (pytest, vitest, playwright, npm test)
4. **Build Tools** - tsc, eslint, next, prisma
5. **Package Managers** - npm, pnpm, bun, pip install/output
6. **Docker/K8s** - docker, kubectl commands
7. **GitHub CLI** - All `gh` commands
8. **Error Checking** - When checking for errors only, use `rtk err`
9. **JSON Output** - Any command outputting JSON, use `rtk json`
10. **Log Viewing** - All log tailing/grepping, use `rtk log`

**Prohibited:** Never use standard commands when RTK equivalent exists.

**Examples of violations:**
```bash
# WRONG - High token usage
git log --oneline -20
ls -la src/
pytest tests/
npm install
gh pr list

# CORRECT - Token optimized
rtk git log --oneline -20
rtk ls -la src/
rtk pytest tests/
rtk npm install
rtk gh pr list
```

### 3.6 Tracking Token Savings

View RTK effectiveness:
```bash
rtk gain              # Show global savings summary
rtk cc-economics      # Compare vs Claude Code spending
```

## 4. Git Workflow & Isolation
- Always use git worktrees for multi-agent isolation
- Start all work from master/main branch
- Keep worktrees one level deep (no nesting)
- Never commit directly to master/main branch
- Always create feature branches within worktrees
- Follow strict isolation approach: checkout master → create worktree → create feature branch → push → create PR
- Use git worktrees to prevent conflicts between agent sessions

## 5. Task Planning & Execution
- Read .sisyphus/ and .research/ directories for previous session context
- Brainstorm with team agents before starting any task
- Create phased approach with edge case analysis
- Provide 3+ approaches per task with pros/cons and recommendations
- Pull latest from master before starting work
- Create new branch for each task
- Use naming convention: <model-role>_<model-name>/<task>
- Example: sisyphus_GLM-4.7/create-oauth-integration

## 6. Version Control & Documentation
- Commit after each completed todo item with acceptance criteria
- Create state machine diagrams for major systems post-research
- Monitor token usage: at 65%, warn and prepare for handoff
- At 70% context usage, stop and provide handoff summary
- Create handoff documents with project summary, architecture decisions, and next steps

## 7. Error Handling & Verification
> **MOVED TO:** `~/.claude/skills/coding-standards.md`
> **Refer to:** Error handling section in coding standards skill

## 8. Security & Safety
> **MOVED TO:** `~/.claude/skills/security-review/SKILL.md`
> **Refer to:** Security checklist in security-review skill

## 9. Quality Assurance & Testing
> **MOVED TO:** `~/.config/opencode/superpowers/skills/test-driven-development/SKILL.md`
> **Refer to:** TDD workflow in test-driven-development skill

## 10. Communication Protocols
- MUST communicate in English only.
- MUST separate **Facts** (observed) from **Assumptions** (inferred) and ask when assumptions affect behavior.
- MUST provide a short plan for any task with 2+ steps and keep status updates tight.
- MUST state exactly what changed and why (user impact), not just what files were touched.
- NEVER claim success without evidence (commands run, outputs, screenshots, or reproduction results).

Example (response skeleton):
```txt
Plan:
Changes:
Evidence:
Risks/Tradeoffs:
Next:
```

## 11. Performance Optimization
- MUST measure before and after optimizing (timings, memory, query counts); NEVER guess performance wins.
- MUST avoid accidental O(n^2) patterns in hot paths (nested loops over large lists, repeated scans).
- SHOULD parallelize independent work safely (e.g., Promise.all) and batch network/DB calls.
- MUST add limits/timeouts for expensive operations (pagination, max sizes, request timeouts).
- NEVER add caching without a clear invalidation strategy and correctness verification.

Example (safe parallelization):
```ts
const [a, b] = await Promise.all([loadA(), loadB()])
```

## 12. Learning & Improvement
- MUST capture reusable lessons as guardrails: add tests, lint rules, utilities, or AGENTS.md updates when patterns repeat.
- MUST document non-obvious decisions (constraints, tradeoffs) close to the code or in project docs.
- SHOULD keep a short "What I learned / What to watch" note for tricky fixes.
- NEVER repeat the same class of incident without adding prevention (test/validation/monitoring).

## 13. Collaboration Guidelines
- MUST keep changes atomic and reviewable (small, cohesive diffs; avoid mixed refactors + features).
- MUST avoid overlapping edits to the same files without coordination; state "I'm editing X/Y" when needed.
- MUST prefer clear ownership boundaries (one person/agent per subsystem at a time).
- SHOULD request review for non-trivial changes (security, auth, payments, migrations, broad refactors).
- NEVER bypass agreed workflows (hooks, CI steps, review gates) unless explicitly instructed.

## 14. Stop Conditions & Escalation
- MUST stop and ask for clarification if requirements conflict, are ambiguous, or would change user-facing behavior.
- MUST stop and escalate if a change risks data loss, security exposure, or irreversible actions.
- MUST stop if verification fails and the cause is unclear; provide a minimal reproduction + suspected root causes.
- NEVER proceed when missing access/credentials/permissions; ask the user for the needed inputs or alternatives.

Example (escalation format):
```txt
Blocked by: <what>
Need from you: <decision/permission/input>
Options: A) ... B) ... C) ...
```

## 15. Tool Usage Guidelines
- MUST use the best-fit tool for the job (search vs read vs edit vs execute) and avoid "bash-ing everything."
- MUST prefer dedicated search/read/edit tools over shell `grep/cat/sed/awk` when available.
- MUST run independent commands in parallel when safe; run dependent commands sequentially.
- MUST quote paths with spaces and verify target paths before creating/deleting files.
- NEVER use interactive commands/flags that require TTY input in automated environments.
- NEVER use `npm` or `pip` for installs; MUST use `bun` (JS/TS) and `uv` (Python).

Example (good command hygiene):
```txt
Before mkdir: verify parent exists (list it)
Before rm: confirm exact path + user approval
```

## 16. Verification Evidence
- MUST include verification evidence with completion claims:
  - commands run (exact)
  - pass/fail results (summarize + key output)
  - what behavior was verified (repro steps or test names)
  - files changed (paths) and what risk they carry (low/med/high)
- MUST provide "before vs after" for bugfixes (what was broken, what is now correct).
- SHOULD include screenshots/recordings for UI changes and perf numbers for optimization work.
- NEVER say "fixed" / "works" / "passes" without referencing the evidence above.

Example (evidence block):
```txt
Evidence:
- bun test (pass)
- bun run build (pass)
- Repro: <steps> now returns <expected>
- Changed: src/foo.ts (error handling), src/foo.test.ts (regression)
```

## 17. CI/CD & Local Testing
- MUST use `act` for local GitHub Actions development and testing before pushing workflow changes.
- MUST use `localstack` for local AWS development and testing when working with AWS services.
- MUST test GitHub Actions workflows locally with `act` to validate syntax and behavior before committing.
- MUST test AWS integrations locally with `localstack` to avoid unnecessary cloud costs and speed up development.
- SHOULD create Makefile targets or scripts for common `act` and `localstack` commands to ensure consistency.

Example (act usage):
```bash
# Test entire workflow
act

# Test specific job
act -j test

# Test with specific event
act pull_request

# Test with secrets
act --secret-file .secrets
```

Example (localstack usage):
```bash
# Start localstack
localstack start

# Create AWS resources locally
awslocal s3 mb s3://my-bucket
awslocal dynamodb create-table --table-name my-table --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST

# Test against local endpoints
AWS_ENDPOINT_URL=http://localhost:4566 aws s3 ls
```

## 18. PR Automation & Review
- MUST run automated PR review immediately after creating a pull request.
- MUST use the `requesting-code-review` skill to generate comprehensive PR reviews.
- MUST check the following in automated PR reviews:
  - Code quality and adherence to coding standards
  - Test coverage for new/changed code
  - Security implications (secrets, injection risks, auth)
  - Performance impact of changes
  - Documentation updates (README, API docs, comments)
  - Breaking changes and migration notes
- SHOULD add PR labels automatically based on change scope (size, type, risk level).
- MUST update PR description with summary of changes if not provided by author.
- MUST link related issues in PR description using "Fixes #123" or "Relates to #456".

Example (PR review workflow):
```bash
# After creating PR via gh CLI or GitHub UI
# 1. Run automated review
gh pr create --title "feat: add user authentication" --body "..."

# 2. Immediately trigger PR review skill
# (This should be automated via GitHub Actions or pre-commit hook)

# 3. Review output should include:
#    - Summary of changes
#    - Potential issues
#    - Recommendations
#    - Approval status
```

Example (PR review checklist):
```txt
Automated PR Review Results:
✅ Code Quality: Pass (follows coding standards)
✅ Test Coverage: 85% (new code covered)
⚠️  Security: Warning (potential XSS risk in user input)
✅ Performance: Pass (no N+1 queries detected)
⚠️  Documentation: Missing (README not updated)
❌ Breaking Changes: None detected

Recommendations:
- Add input sanitization for userName field
- Update README.md with new auth endpoints

Status: Changes Requested
```

## 19. Task Management with Beads

### 19.1 When to Use Beads

**Use beads when:**
- Planning multi-step work (>3 tasks)
- Coordinating across multiple sessions
- Tracking dependencies (blocked/blocked-by)
- Working with priorities (P0/P1/P2)
- Need audit trail of attempts/failures

**Don't use beads when:**
- Single-session, single-task work
- Ad-hoc exploration
- Quick fixes (< 30 minutes)

### 19.2 Beads Workflow

```bash
# 1. Check ready work
bd ready

# 2. Claim a task
bd update bd-a1b2 --claim

# 3. Do the work
# (Use your normal workflow - Claude-Mem, Entire, etc.)

# 4. Update progress
bd update bd-a1b2 --status in_progress --notes "50% done"

# 5. Complete
bd close bd-a1b2

# 6. Sync
bd sync
```

### 19.3 Integration with Existing Stack

- **Link to Entire checkpoints:** `entire checkpoint --tag beads:${ID}`
- **Reference Claude-Mem observations:** Mention beads ID in context
- **Use RTK for beads commands:** `rtk bd ready`

### 19.4 Compaction Hook

The Entire Check Plugin includes automatic beads sync when context compacts:
- Active tasks are marked with compaction timestamp
- Beads database is synced to git
- Task progress is preserved across compaction

### 19.5 Essential Commands

| Command | Description |
|---------|-------------|
| `bd ready` | Show ready-to-work tasks |
| `bd create "Title" -p 1` | Create task with priority |
| `bd update <id> --claim` | Claim task |
| `bd show <id>` | Show task details |
| `bd close <id>` | Close task |
| `bd sync` | Sync to git |

### 19.6 Aliases (Add to ~/.zshrc)

```bash
# Beads aliases
alias bdr='bd ready'
alias bdc='bd create'
alias bdu='bd update'
alias bds='bd show'
alias bdl='bd list'
alias bdsync='bd sync'
alias bdclaim='bd update --claim'
alias bdclose='bd close'
```
