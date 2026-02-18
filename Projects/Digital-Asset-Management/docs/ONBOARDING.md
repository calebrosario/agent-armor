# New Team Member Onboarding Guide

Welcome to the Digital Asset Management Platform team! This guide will help you get up and running quickly.

## Table of Contents

- [Before Your First Day](#before-your-first-day)
- [Week 1: Setup & Familiarization](#week-1-setup--familiarization)
- [Week 2: First Contribution](#week-2-first-contribution)
- [Week 3: Integration & Deep Dive](#week-3-integration--deep-dive)
- [Resources](#resources)
- [Questions & Support](#questions--support)

---

## Before Your First Day

### Account Setup

#### GitHub Access

1. **Accept invitation** to GitHub organization
2. **Enable 2FA** on your GitHub account (required)
3. **Join relevant teams**:
   - `@digital-asset-team` - Full access
   - `@frontend-team` - Frontend access
   - `@backend-team` - Backend access
   - `@blockchain-team` - Smart contracts access

#### Development Environment Setup

**Required Tools:**

- **VS Code** (or your preferred IDE)
- **Git** with your GitHub account configured
- **Docker Desktop** (for local development)
- **PostgreSQL Client** (DBeaver, pgAdmin)
- **Browser Wallet** (MetaMask) - for testing
- **Node.js** v20 LTS

**VS Code Extensions (Recommended):**

```json
{
  "recommendations": [
    "dbaeumer.vscode-json",
    "esbenp.prettier-vscode",
    "dsznajd.es7-react-js-snippets",
    "bradlc.vscode-tailwindcss",
    "eamodio.gitlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

#### Communication Channels

- **Slack**: [Join workspace](https://company.slack.com/) - Primary communication
- **GitHub Discussions**: For async technical discussions
- **GitHub Issues**: For bug reports and feature requests
- **Zoom**: For weekly standups (check calendar)

### Knowledge Assessment

Before onboarding, we recommend reviewing:

1. **[README.md](../README.md)** - Project overview and architecture
2. **[docs/CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
3. **[docs/DEVELOPMENT.md](DEVELOPMENT.md)** - Local development setup
4. **[docs/BLOCKCHAIN.md](BLOCKCHAIN.md)** - Smart contract architecture
5. **[docs/API.md](API.md)** - Backend API documentation

**Estimated Time**: 2-3 hours

---

## Week 1: Setup & Familiarization

### Day 1: Environment Setup

**Goals**: Get your local development environment running

#### Tasks

- [ ] Clone repository to your machine
- [ ] Install Node.js 20 LTS
- [ ] Install Docker and Docker Compose
- [ ] Set up VS Code with recommended extensions
- [ ] Configure Git with your name and email
- [ ] Join all communication channels (Slack, GitHub teams)

**Resources**:
- [docs/02-setup-and-installation.md](02-setup-and-installation.md)
- Repository README

**Success Criteria**: You can run `docker-compose up -d` without errors

#### Getting Help

If you encounter issues:

- Post in `#new-dev` Slack channel
- Create a GitHub Discussion with "setup" label
- Ask your mentor or onboarding buddy

---

### Day 2: Codebase Exploration

**Goals**: Understand the project structure and key files

#### Tasks

- [ ] Read [README.md](../README.md) thoroughly
- [ ] Explore directory structure:
  - `api/` - Backend API
  - `frontend/` - Web frontend
  - `blockchain/` - Smart contracts
  - `infra/` - Infrastructure
  - `.github/workflows/` - CI/CD
- [ ] Identify key files in each subproject
- [ ] Understand the development workflow:
  - Git Flow branching (main/develop/feature)
  - Conventional commits
  - Pull request process

**Resources**:
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [DEVELOPMENT.md](DEVELOPMENT.md)

**Success Criteria**: You can explain the project architecture to someone else

#### Codebase Tour (with Mentor)

Schedule a 1-hour code walk with your mentor:

**Tour Topics:**
1. Frontend: React/Next.js structure
2. Backend: NestJS architecture
3. Blockchain: Smart contract organization
4. CI/CD: GitHub Actions workflows
5. Infrastructure: Terraform and Docker setup

**Estimated Time**: 60 minutes

---

### Day 3: First Local Build

**Goals**: Get all services running locally

#### Tasks

- [ ] Copy environment example files:
  ```bash
  cp api/.env.example api/.env
  cp frontend/.env.example frontend/.env
  cp blockchain/.env.example blockchain/.env
  ```
- [ ] Install all dependencies:
  ```bash
  cd frontend && npm install
  cd ../api && npm install
  cd ../blockchain && npm install
  ```
- [ ] Start Docker containers:
  ```bash
  docker-compose up -d
  ```
- [ ] Verify all services:
  - [ ] Frontend: http://localhost:3000
  - [ ] Backend: http://localhost:3001
  - [ ] Database: Connect via PostgreSQL client
  - [ ] Redis: Check via Redis client

**Resources**:
- [docs/GITHUB_SECRETS.md](GITHUB_SECRETS.md) - Required secrets
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local setup guide

**Success Criteria**: All services running and accessible

#### Getting Help

If services won't start:

- Check Docker logs: `docker-compose logs <service>`
- Verify environment variables
- Check port conflicts with `lsof -i :<port>`

---

### Day 4-5: Documentation Deep Dive

**Goals**: Understand development patterns and standards

#### Tasks

- [ ] Read [CONTRIBUTING.md](CONTRIBUTING.md) - Code standards
- [ ] Review commit message format (Conventional Commits)
- [ ] Understand testing requirements:
  - Backend: Jest, 80% coverage
  - Frontend: Jest/RTL, 80% coverage
  - Blockchain: Foundry, 90% coverage
- [ ] Review PR checklist before submitting

**Resources**:
- [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of Conduct

**Success Criteria**: You can explain contribution workflow to someone else

---

## Week 2: First Contribution

### Choose Your First Task

#### Options for First Contribution

**1. Good First Issue (Beginner)**

Look for issues labeled:
- `good first issue`
- `beginner`
- `documentation`

**2. Bug Fix (Easy)**

Look for issues labeled:
- `bug`
- `priority: low`
- `priority: medium`

**3. Small Feature (Beginner-Intermediate)**

Look for issues labeled:
- `enhancement`
- `feature request`
- `help wanted`

**Recommended Path**: Start with documentation or small UI improvements to learn the codebase.

#### Creating Your Feature Branch

```bash
# Sync with develop branch first
git checkout develop
git pull upstream develop

# Create your feature branch
git checkout -b feature/123-add-user-profile-field
```

#### Making Your Changes

1. **Read existing code** for the file you're modifying
2. **Follow code standards** in [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Write tests** for your changes (before writing code)
4. **Implement the feature**
5. **Run tests** locally:
   ```bash
   # Frontend
   cd frontend && npm test

   # Backend
   cd ../api && npm test

   # Blockchain
   cd ../blockchain && npm run test:forge
   ```
6. **Fix any failing tests**
7. **Run linter**:
   ```bash
   npm run lint
   ```
8. **Commit frequently** with conventional messages
9. **Push to your fork**
10. **Create Pull Request** targeting `develop` branch

### Code Review Process

#### Before Submitting PR

- [ ] All tests pass
- [ ] Linting passes
- [ ] Code follows style guide
- [ ] PR description is clear
- [ ] Screenshots for UI changes (if applicable)

#### During Review

- **Respond to comments** within 24-48 hours
- **Be open to feedback** - code review is how we all improve
- **Ask questions** if you don't understand a comment
- **Make changes** as requested, push to same branch

#### After Merge

- **Delete your feature branch** locally and on your fork
- **Sync with develop**:
  ```bash
  git checkout develop
  git pull upstream develop
  ```

---

## Week 3: Integration & Deep Dive

### Explore Deeper Areas

#### Week 3 Goals

Choose 1-2 areas to explore deeply:

**Frontend Focus Areas:**
- React hooks and state management
- Tailwind CSS styling patterns
- Next.js routing and data fetching
- Web3/wallet integration (wagmi, Web3Auth)

**Backend Focus Areas:**
- NestJS modules and dependency injection
- Authentication and authorization flow
- Database entities and TypeORM
- API endpoint design and DTOs

**Blockchain Focus Areas:**
- Solidity smart contract patterns
- OpenZeppelin library usage
- Foundry testing patterns
- Deployment scripts and Hardhat configuration

#### Pair Programming

Schedule 1-2 pair programming sessions with team members:

**Benefits:**
- Learn different coding styles
- Share knowledge
- Get immediate feedback
- Build relationships

**How to Request:**
- Post in `#pair-programming` Slack channel
- Mention specific topic you want to work on

---

## Resources

### Documentation

- [Project README](../README.md) - High-level overview
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Development Guide](DEVELOPMENT.md) - Local development setup
- [Architecture Overview](docs/03-architecture-overview.md) - System design
- [API Reference](docs/04-api-reference.md) - Backend API docs
- [Smart Contracts](docs/05-smart-contracts.md) - Blockchain docs
- [Troubleshooting](docs/11-troubleshooting.md) - Common issues

### Internal Tools

- **GitHub** - Code hosting and collaboration
- **GitHub Actions** - CI/CD and automation
- **Slack** - Team communication
- **Zoom/Google Meet** - Video meetings

### External Resources

#### Frontend

- [Next.js Documentation](https://nextjs.org/docs) - Official docs
- [React Documentation](https://react.dev) - React fundamentals
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling
- [Wagmi](https://wagmi.sh) - React hooks for Ethereum
- [Web3Auth](https://web3auth.io/docs) - Wallet-less auth

#### Backend

- [NestJS Documentation](https://docs.nestjs.com) - Official docs
- [TypeScript](https://www.typescriptlang.org/docs) - Type system
- [TypeORM](https://typeorm.io) - ORM documentation

#### Blockchain

- [Solidity by Example](https://solidity-by-example.org) - Learn Solidity
- [OpenZeppelin](https://docs.openzeppelin.com/contracts) - Contract library
- [Foundry Book](https://book.getfoundry.sh/) - Testing framework
- [Hardhat](https://hardhat.org/docs) - Development framework

### Developer Tools

- [VS Code](https://code.visualstudio.com/) - Recommended IDE
- [DBeaver](https://dbeaver.io/) - PostgreSQL client
- [RedisInsight](https://redisinsight.com/) - Redis client
- [MetaMask](https://metamask.io/) - Browser wallet
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity editor

---

## Questions & Support

### Getting Help

#### Where to Ask Questions

**For Technical Questions:**
- **Slack `#help-dev`** - Quick questions, team input
- **GitHub Discussions** - Deeper technical discussions, searchable

**For Process/Administrative Questions:**
- **Slack `#team`** - General team questions
- **Email**: support@team.com - Private questions

#### Before Asking

1. **Search existing resources**:
   - Documentation (README, CONTRIBUTING, DEVELOPMENT)
   - GitHub Issues (use search)
   - GitHub Discussions (use search)
2. **Include context**:
   - What you're trying to do
   - What you've tried
   - Error messages or logs
   - Your environment (OS, Node version, etc.)
3. **Use code blocks** for code snippets
4. **Be specific** about what you need help with

#### Response Time Expectations

- **Slack**: 1-4 hours during work hours
- **GitHub Discussions**: 24-48 hours
- **GitHub Issues**: Depends on priority and complexity

### Mentorship Program

Each new team member is assigned a mentor for their first 4 weeks.

#### Your Mentor

- Will schedule weekly 1:1 meetings
- Available for code reviews (async or synchronous)
- Can answer questions via Slack
- Will help you navigate the codebase

#### How to Get the Most Out of Mentorship

- Come prepared with specific questions
- Share your progress regularly
- Be proactive in asking for help
- Take feedback constructively
- Pay it forward - help others when you can

---

## Checkpoints

### Week 1 Checkpoint

- [ ] Local development environment running
- [ ] Can explain project architecture
- [ ] Understand contribution workflow
- [ ] Have completed first documentation deep dive

**Celebrate!** You've completed your first week successfully! 🎉

### Week 2 Checkpoint

- [ ] First PR created and submitted
- [ ] Code review received and addressed
- [ ] First contribution merged

**Celebrate!** You've made your first contribution! 🚀

### Week 3 Checkpoint

- [ ] Explored at least one deep area
- [ ] Participated in pair programming
- [ ] Increasing independence in coding tasks

**Celebrate!** You're becoming a valuable team member! ⭐

---

## Next Steps After Onboarding

### Continuous Learning

- **Review merged PRs** - See how others solve problems
- **Read code you review** - Learn from patterns
- **Attend tech talks** - Share knowledge
- **Contribute to documentation** - Help future team members

### Advanced Topics

After onboarding, consider exploring:
- Performance optimization
- Security best practices
- Scalability patterns
- DevOps and deployment
- Smart contract auditing

---

## Welcome Again!

We're excited to have you on the team! Digital Asset Management Platform is building innovative solutions for real estate tokenization, and your contributions will make a real impact.

Remember: **No question is too simple, and everyone starts somewhere.** We're all learning together!

Good luck and happy coding! 🎯
