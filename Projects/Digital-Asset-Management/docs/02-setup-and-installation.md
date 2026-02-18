# Setup and Installation Guide

Complete guide to setting up your development environment for Digital Asset Management Platform.

---

## 📋 Prerequisites Verification

Before starting installation, ensure you have:

- **Node.js v20+** (required for frontend and backend)
- **PostgreSQL v13+** (for local development or use Docker)
- **Git** (for cloning repository)
- **npm or yarn** (package manager)

Check installations:
```bash
node --version  # Should be 20.x or higher
psql --version  # Should be 13 or higher
docker --version  # Should be 24.0 or higher (optional)
git --version
```

---

## 🏗️ Project Structure

```
digital-asset-management/
├── api/                    # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication (JWT, OAuth)
│   │   ├── users/          # User management
│   │   ├── assets/         # Asset management
│   │   ├── escrows/         # Escrow contracts
│   │   ├── ethers/          # Smart contract interactions
│   │   ├── config/          # Configuration
│   │   └── main.ts         # Application entry point
│   ├── test/                 # Backend tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local.example
├── blockchain/              # Smart contracts
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/             # Contract tests
│   ├── hardhat.config.js
│   └── .env.example
├── infra/                   # Terraform infrastructure
│   ├── provider.tf
│   ├── variables.tf
│   ├── main.tf
│   └── outputs.tf
├── .github/                 # GitHub Actions workflows
│   └── workflows/
├── docs/                    # Documentation (this directory)
└── README.md
```

---

## 🔧 Option 1: Local Development with Docker Compose (Recommended)

### Why This Approach?

**Pros:**
- Fast setup (single command)
- All services run in containers
- Isolated environment
- Easy to start/stop/rebuild
- No need to install Node.js, PostgreSQL, Redis locally

**Cons:**
- Requires Docker (or Docker Desktop)
- Higher resource usage than native installation
- Slower performance compared to native installation

---

## 📦 Step-by-Step Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/digital-asset-management.git
cd digital-asset-management

# Or if you already have access:
git pull origin main
```

### Step 2: Install Backend Dependencies

```bash
cd api
npm install
```

This installs all dependencies from `package.json` including NestJS modules, TypeORM, PostgreSQL client, JWT, bcrypt, ethers, etc.

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs all dependencies from `package.json` including Next.js, React, Web3Auth, wagmi, viem.

### Step 4: Install Redis (Optional - Docker Compose includes it)

**If you prefer local Redis instead of Docker:**

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Note:** Docker Compose already includes Redis, so you can skip this step.

### Step 5: Install Docker (Optional - Native Installation)

**If you prefer local PostgreSQL instead of Docker:**

**macOS:**
```bash
brew install docker
brew services start docker
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ca-certificates
curl -fsSL https://get.docker.com -o get-docker.sh | sudo sh
sudo usermod -aG docker
```

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Note:** Docker Compose already includes PostgreSQL, so you can skip this step.

---

## 🔑 Create Environment Files

### Backend Environment

```bash
cd api
cp .env.example .env

# Edit and fill in values
nano .env
```

Required variables in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (generate with `openssl rand -base64 32`)
- `PORT` - API port (default: 3000)

### Frontend Environment

```bash
cd frontend
cp .env.local.example .env.local

# Edit and fill in values
nano .env.local
```

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (http://localhost:3000)

### Blockchain Environment

```bash
cd blockchain
cp .env.example .env

# Edit and fill in values
nano .env
```

Required variables:
- `PRIVATE_KEY` - Wallet private key for deployment
- `POLYGON_RPC_URL` - Polygon RPC endpoint
- `CHAIN_ID` - Chain ID (80002 for Amoy testnet, 80001 for Mumbai [deprecated], 137 for mainnet)

---

## 🚀 Start All Services

### Using Docker Compose

```bash
# Start development environment
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f frontend
```

**Services Started:**
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **LocalStack** on ports 4566, 4510-4559, 8080
- **API (NestJS)** on port 3000
- **Frontend (Next.js)** on port 3001

### Access Services

Once running, access at:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Swagger (API Docs)**: http://localhost:3000/docs
- **LocalStack Web UI**: http://localhost:8080

---

## ✅ Verification Checklist

Before proceeding, verify your setup:

- [ ] Node.js v20+ installed
- [ ] PostgreSQL v13+ installed (or running in Docker)
- [ ] Environment files copied from examples
- [ ] Environment variables configured
- [ ] Docker Compose starts successfully
- [ ] All services are healthy
- [ ] Frontend accessible at http://localhost:3001
- [ ] API accessible at http://localhost:3000
- [ ] API docs accessible at http://localhost:3000/docs

---

## 🎯 Next Steps

1. **Begin Development**: Start building features
2. **Run Database Migrations**: `cd api && npx typeorm migration:run`
3. **Consult Documentation**:
   - [API Reference](04-api-reference.md) - Backend API documentation
   - [Smart Contracts](05-smart-contracts.md) - Blockchain contract details
   - [Infrastructure](06-infrastructure.md) - Terraform and AWS setup
4. **Set up CI/CD**: Follow [CI/CD Pipelines](07-ci-cd.md) guide

---

## 📚 Learning Resources

### Architecture
- [System Architecture](03-architecture-overview.md) - Full system design and component diagram
- [API Reference](04-api-reference.md) - Complete backend API documentation

### Development
- [Setup & Installation](01-getting-started.md) - This guide
- [CI/CD Pipelines](07-ci-cd.md) - GitHub Actions workflows
- [Development Workflow](10-development-workflow.md) - Local development practices

### Deployment
- [Deployment Guide](08-deployment.md) - Production deployment procedures
- [Secrets Management](09-secrets-management.md) - GitHub secrets setup

---

## 🐛 Troubleshooting

Common issues and solutions covered in [Troubleshooting Guide](11-troubleshooting.md).

---

**Last Updated**: 2026-02-01
**Maintainer**: DevOps Team
