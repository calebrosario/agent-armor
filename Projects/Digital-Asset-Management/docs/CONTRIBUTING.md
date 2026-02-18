# Contributing to Digital Asset Management Platform

Thank you for your interest in contributing to the Digital Asset Management Platform! This document will guide you through the contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this standard. Please report unacceptable behavior to project maintainers.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v20 LTS or higher)
- **npm** or **yarn** package manager
- **Git** (v2.0 or higher)
- **Docker** and **Docker Compose** (for local development)
- **A code editor** (VS Code recommended with extensions)

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/digital-asset-management.git
   cd digital-asset-management
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/calebrosario/digital-asset-management.git
   ```

4. **Install dependencies** for all subprojects:

   ```bash
   # Frontend
   cd frontend && npm install

   # Backend API
   cd ../api && npm install

   # Blockchain contracts
   cd ../blockchain && npm install
   ```

5. **Start local development environment**:

   ```bash
   # From project root
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database (port 5432)
   - Redis cache (port 6379)
   - Backend API (port 3001)
   - Frontend (port 3000)

6. **Verify setup**:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health

### Environment Configuration

Copy example environment files and configure them:

```bash
# Backend
cp api/.env.example api/.env

# Frontend
cp frontend/.env.example frontend/.env

# Blockchain
cp blockchain/.env.example blockchain/.env
```

See [docs/02-setup-and-installation.md](docs/02-setup-and-installation.md) for detailed environment setup instructions.

---

## Development Workflow

### Branching Strategy

This project uses **Git Flow** simplified:

```
main           ← Production-ready code
  |
  ├─ develop    ← Integration branch for features
  |
  └─ feature/* ← Your feature branches
```

#### Branch Types

- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for completed features
- **`feature/<ticket-id>-short-description`**: New features (e.g., `feature/123-asset-metadata`)
- **`fix/<ticket-id>-short-description`**: Bug fixes (e.g., `fix/456-auth-error`)
- **`hotfix/<ticket-id>-short-description`**: Critical production fixes

### Workflow Steps

1. **Sync with upstream**:

   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create feature branch**:

   ```bash
   git checkout -b feature/123-add-asset-metadata
   ```

3. **Make changes** and commit frequently:

   ```bash
   git add .
   git commit -m "feat: add asset metadata extraction from PDF"
   ```

   See [Commit Guidelines](#commit-guidelines) for commit message format.

4. **Push to your fork**:

   ```bash
   git push origin feature/123-add-asset-metadata
   ```

5. **Create Pull Request**:
   - Go to GitHub and click "New Pull Request"
   - Target: `develop` branch
   - Source: Your feature branch
   - Fill PR template with description
   - Link related issues/tickets

6. **Address review feedback**:
   - Respond to review comments
   - Make requested changes
   - Push updates to same branch (PR will auto-update)

7. **Merge** (after approval):
   - Squash and merge to `develop`
   - Delete feature branch

---

## Project Structure

```
digital-asset-management/
├── api/                    # Backend API (NestJS)
│   ├── src/
│   │   ├── auth/          # Authentication & authorization
│   │   ├── assets/         # Asset management endpoints
│   │   ├── escrows/        # Escrow logic
│   │   ├── users/          # User CRUD operations
│   │   └── main.ts         # Application entry point
│   ├── scripts/              # Utility scripts (OAuth setup)
│   ├── test/               # Backend tests
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Web frontend (Next.js)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and clients
│   │   └── types/          # TypeScript type definitions
│   ├── public/              # Static assets
│   ├── Dockerfile
│   └── package.json
├── blockchain/              # Smart contracts (Solidity)
│   ├── contracts/            # Solidity contract files
│   ├── scripts/              # Deployment scripts
│   ├── test/               # Foundry/Hardhat tests
│   └── package.json
├── infra/                  # Infrastructure as Code
│   ├── terraform/            # Terraform modules
│   └── docker/              # Docker configurations
├── .github/
│   └── workflows/            # CI/CD workflows
├── docs/                   # Documentation
├── .sisyphus/              # Planning and handoff docs
└── README.md
```

---

## Making Changes

### Code Standards

#### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- **Type safety**: Avoid `any`, use proper types
- **Interfaces** for object shapes
- **Type inference** over explicit typing when clear

#### Frontend (React/Next.js)

- **Functional components** with hooks
- **PropTypes** not required (TypeScript provides typing)
- **Tailwind CSS** for all styling
- **Component structure**:

  ```tsx
  // ✅ Good
  interface Props {
    title: string;
    onSubmit: () => void;
  }

  export function Component({ title, onSubmit }: Props) {
    return <button onClick={onSubmit}>{title}</button>;
  }

  // ❌ Bad
  export default function Component(props) {
    return <button>{props.title}</button>;
  }
  ```

#### Backend (NestJS)

- **Dependency Injection** for services
- **DTOs** for request/response validation
- **Decorators** for routes, guards, interceptors
- **Structure**:

  ```typescript
  @Controller('assets')
  @UseGuards(JwtAuthGuard)
  export class AssetsController {
    constructor(private assetsService: AssetsService) {}

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll() {
      return this.assetsService.findAll();
    }
  }
  ```

#### Smart Contracts (Solidity)

- **OpenZeppelin** contracts for security
- **NatSpec** comments for documentation
- **Events** for state changes
- **Structure**:

  ```solidity
  // ✅ Good
  /// @notice Mints a new asset token
  /// @param to The recipient address
  /// @param amount Number of tokens to mint
  function mint(address to, uint256 amount)
      external
      onlyRole(MINTER_ROLE)
      returns (uint256)
  ```

### Linting and Formatting

#### Frontend

```bash
# Run linter
cd frontend && npm run lint

# Auto-fix issues
npm run lint:fix
```

#### Backend

```bash
# Run linter
cd api && npm run lint

# Auto-fix issues
npm run lint:fix
```

#### Smart Contracts

```bash
# Run Solidity linter
cd blockchain && npm run lint

# Auto-fix issues
npm run lint:fix
```

---

## Testing Requirements

### Backend Tests

- **Framework**: Jest
- **Coverage**: Minimum 80%
- **Test files**: Co-located with source (e.g., `auth/auth.spec.ts`)

```bash
# Run all tests
cd api && npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Frontend Tests

- **Framework**: React Testing Library + Jest
- **Coverage**: Minimum 80%
- **Test files**: Co-located with source (e.g., `components/Button.test.tsx`)

```bash
# Run all tests
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

### Smart Contract Tests

- **Framework**: Foundry (primary), Hardhat (secondary)
- **Coverage**: Minimum 90%
- **Fuzz testing**: Critical functions

```bash
# Run Foundry tests
cd blockchain && npm run test:forge

# Run Hardhat tests
npm test

# Gas report
forge test --gas-report
```

### E2E Tests

- **Framework**: Playwright
- **Coverage**: All critical user flows

```bash
# Run E2E tests
npm run test:e2e
```

**Never merge without passing tests.** CI will block merges if tests fail.

---

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style/formatting (no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

```bash
# Feature with scope
git commit -m "feat(assets): add IPFS CID to asset metadata"

# Bug fix
git commit -m "fix(auth): resolve token refresh on page reload"

# Breaking change
git commit -m "feat(api)!: remove deprecated /v1 endpoint"

# Documentation
git commit -m "docs: update CONTRIBUTING.md with new workflow"
```

### Commit Messages

- **Present tense**: "Add feature" not "Added feature"
- **Imperative mood**: "Fix bug" not "Fixed bug"
- **Body**: Explain WHAT and WHY (not HOW)
- **Footer**: Link issues, BREAKING CHANGE notices

---

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, verify:

- [ ] Tests pass locally (`npm test` in all subprojects)
- [ ] Linting passes (`npm run lint` in all subprojects)
- [ ] Code follows style guide
- [ ] Commit messages follow conventional commits
- [ ] PR description is clear and includes screenshots (for UI changes)
- [ ] CI/CD checks pass (green checkmarks)
- [ ] Documentation is updated (if needed)
- [ ] Breaking changes are documented

### PR Template

```markdown
## Description
Briefly describe what this PR does and why it's needed.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #123

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
![Screenshot 1]()
![Screenshot 2]()
```

---

## Documentation

### Updating Documentation

- Keep documentation in sync with code changes
- Update relevant `.md` files in `/docs`
- Add code comments for complex logic
- Update README.md for user-facing changes

### Adding New Features

When adding new features:

1. Update [API.md](docs/API.md) with new endpoints
2. Update [BLOCKCHAIN.md](docs/BLOCKCHAIN.md) for contract changes
3. Update [02-setup-and-installation.md](docs/02-setup-and-installation.md) for new env vars
4. Create ADR for significant decisions (see below)

---

## Architecture Decision Records (ADRs)

For significant architectural changes, create an ADR:

1. Create file in `.sisyphus/adr/` directory
2. Use naming: `ADR-001-title.md`
3. Follow template:

```markdown
# ADR-001: [Title]

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

## Alternatives
What other approaches did we consider and what are the trade-offs?
```

---

## Getting Help

### Questions

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Open an issue for bugs or feature requests
- **Slack**: Join our community Slack (link in README)

### Review Process

- **Response time**: Maintainers aim to review PRs within 48 hours
- **Feedback style**: Constructive, specific, actionable
- **Revision count**: Expect 2-3 rounds of feedback

---

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md (auto-generated)
- Release notes
- Annual contributor highlights

Thank you for contributing! 🚀
