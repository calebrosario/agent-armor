# Digital Asset Management Platform - Documentation

Complete guide to understanding, developing, and deploying the Digital Asset Management Platform.

---

## 📚 Documentation Structure

This directory contains comprehensive documentation for the Digital Asset Management Platform. Each document is numbered for easy navigation.

| File | Description |
|-------|-------------|
| [01-getting-started.md](01-getting-started.md) | Quick start and installation guide |
| [02-setup-and-installation.md](02-setup-and-installation.md) | Environment setup and configuration |
| [03-architecture-overview.md](03-architecture-overview.md) | System architecture and component diagram |
| [04-api-reference.md](04-api-reference.md) | Backend API documentation |
| [05-smart-contracts.md](05-smart-contracts.md) | Smart contract documentation |
| [06-infrastructure.md](06-infrastructure.md) | Infrastructure and Terraform |
| [07-ci-cd.md](07-ci-cd.md) | CI/CD pipelines and workflows |
| [08-deployment.md](08-deployment.md) | Production deployment guide |
| [09-secrets-management.md](09-secrets-management.md) | GitHub secrets and configuration |
| [10-development-workflow.md](10-development-workflow.md) | Local development workflow |
| [11-troubleshooting.md](11-troubleshooting.md) | Common issues and solutions |
| [12-state-machine-diagram.md](12-state-machine-diagram.md) | System state machine diagram |

---

## 🚀 Quick Links

**New to the platform?** Start with [Getting Started](01-getting-started.md)
**Setting up your environment?** See [Setup and Installation](02-setup-and-installation.md)
**Understanding how it works?** Read the [Architecture Overview](03-architecture-overview.md)
**Building features?** Check the [API Reference](04-api-reference.md) and [Smart Contracts](05-smart-contracts.md)
**Deploying to production?** Follow the [CI/CD](07-ci-cd.md) and [Deployment](08-deployment.md) guides
**Managing secrets?** See [Secrets Management](09-secrets-management.md)
**Running into issues?** Check [Troubleshooting](11-troubleshooting.md)

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind + Web3Auth
- **Backend**: NestJS 10 + TypeScript + TypeORM + PostgreSQL
- **Blockchain**: Solidity 0.8.20 + OpenZeppelin 5.0 + Polygon zkEVM
- **Infrastructure**: Terraform + AWS (VPC, RDS, Redis, Cloudflare DNS)
- **CI/CD**: GitHub Actions + LocalStack + Docker
- **Storage**: IPFS + AWS S3

---

## 📊 Key Metrics

- **Test Coverage**: 80% minimum across all services
- **Response Time**: API endpoints < 200ms
- **Uptime**: 99.9% target
- **Gas Optimization**: Average transaction < 100k gas on Polygon zkEVM

---

## 🤝 Contributing

See the root [README.md](../README.md) for contribution guidelines and development workflow.

---

**Last Updated**: 2026-02-09
