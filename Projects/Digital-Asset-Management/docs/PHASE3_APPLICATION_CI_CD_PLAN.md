# Phase 3: Application CI/CD and Smart Contract Integration

## Overview

Phase 2 (Smart Contract Deployment) is complete with Mumbai → Amoy migration. Phase 3 focuses on integrating deployed smart contracts into the application (NestJS backend, Next.js frontend) and establishing comprehensive CI/CD pipelines.

**Status:** 🟡 IN PLANNING  
**Estimated Duration:** 2-3 weeks  
**Priority:** HIGH (unblocks application contract integration)

---

## Goals

### Primary Objectives

1. **Application CI/CD Pipeline**
   - Automated deployment of frontend (Vercel) and backend (Render)
   - Environment-specific configurations (staging, production)
   - Health checks and rollback procedures
   - Database migrations for schema changes

2. **Smart Contract Integration**
   - Backend: Contract interaction service (mint, escrow, transfers)
   - Frontend: Contract hooks and UI components
   - Event listeners for blockchain events (Transfer, Mint, Escrow events)
   - Configuration-driven contract addresses (environment-specific)

3. **Infrastructure Enhancement**
   - Enhanced GitHub Actions workflows
   - Automated testing pipelines
   - Infrastructure monitoring
   - Secret management improvements

4. **Testing & QA**
   - Integration tests for contract interactions
   - E2E tests with deployed contracts on Amoy testnet
   - Load testing and performance optimization
   - Security audits

---

## Phase 3 Architecture

```
┌─────────────────────────────────────────────────────┐
│                     APPLICATION CI/CD PIPELINE                │
│  ┌─────────────┬─────────────┬─────────────┐   │
│  │    GitHub    │   Vercel     │   Render      │   │
│  │   Actions    │   Frontend    │   Backend      │   │
│  ├─────────────┼─────────────┼─────────────┤   │
│  │  On Push    │   Staging     │   Staging     │   │
│  │  (main)     │              │              │   │
│  │              │              │              │   │
│  └─────────────┴─────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│             SMART CONTRACT INTEGRATION                │
├─────────────────┬──────────────────┬──────────────┐   │
│   Backend API  │   Frontend UI   │   Events      │   │
│  (NestJS)   │   (Next.js)    │   Listeners   │   │
│ ├─────────────┼──────────────┼──────────────┤   │
│  │ Contract    │   Contract     │   Transfer    │   │
│  │ Service    │   Hooks       │   Events      │   │
│  │            │              │              │   │   │
│  └─────────────┴──────────────┴──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Task Breakdown

### Task 3.1: Application CI/CD Setup

**Objective:** Establish automated deployment pipelines for frontend and backend.

**Components:**
1. **Vercel Deployment Workflow** (`deploy-frontend.yml`)
   - Staging environment: `staging` branch
   - Production environment: `main` branch
   - Auto-deploy on push to respective branches
   - Environment variable injection via Vercel
   - Pre-deployment health checks
   - Rollback on deployment failure

2. **Render Deployment Workflow** (`deploy-backend.yml`)
   - Staging environment: `staging` branch
   - Production environment: `main` branch
   - Database migrations before startup
   - Health check endpoint (`/health`)
   - Auto-scale based on traffic
   - Blue/green deployment strategy

3. **GitHub Actions Integration**
   - Workflow triggers: `push` (staging), `release` (production)
   - Environment protection rules
   - Required reviewers for production
   - Slack notifications on deployment status

**Deliverables:**
- `.github/workflows/deploy-frontend.yml` (new)
- `.github/workflows/deploy-backend.yml` (new)
- `render.yaml` configuration
- Health check endpoints in both API and frontend
- Database migration scripts
- Deployment documentation

---

### Task 3.2: Smart Contract Integration - Backend

**Objective:** Create NestJS service for blockchain contract interactions.

**Components:**

1. **Contract Service Module** (`api/src/contracts/`)
   - `ContractService` - Main service class
   - `KYCVerifierService` - KYC verification
   - `AssetTokenService` - ERC-1155 operations
   - `ShareTokenService` - ERC-20 operations
   - `EscrowService` - Escrow state machine
   - `GovernanceService` - DAO proposal voting

2. **Contract Configuration** (`api/src/config/contracts.ts`)
   - Environment-based contract addresses
   - Support for multiple networks (Amoy, mainnet)
   - ABI loading from deployment artifacts
   - Type-safe contract interfaces

3. **Event Listeners** (`api/src/listeners/`)
   - `TransferListener` - Monitor asset token transfers
   - `MintListener` - Track new NFT mints
   - `EscrowListener` - Watch escrow state changes
   - `GovernanceListener` - Handle DAO proposals

4. **Utilities** (`api/src/utils/contracts.ts`)
   - Transaction wrappers with retries
   - Gas optimization helpers
   - Error handling and logging
   - Event parsing and validation

**Deliverables:**
- Contract service implementations
- Configuration management system
- Event listener infrastructure
- Utility functions and helpers
- Unit tests for contract services
- Integration tests with mock contracts

---

### Task 3.3: Smart Contract Integration - Frontend

**Objective:** Integrate smart contract interactions into Next.js frontend.

**Components:**

1. **Contract Hooks** (`frontend/hooks/contracts/`)
   - `useContractMint` - Mint asset tokens
   - `useContractTransfer` - Transfer tokens
   - `useContractEscrow` - Deploy escrow
   - `useContractVote` - Governance voting
   - `useKYCVerification` - Check KYC status

2. **Contract Components** (`frontend/components/contracts/`)
   - `ContractCard` - Display contract info
   - `MintForm` - Mint asset form
   - `TransferForm` - Token transfer form
   - `EscrowTimeline` - Escrow state visualization
   - `GovernanceProposal` - Proposal list
   - `KYCVerifier` - KYC verification status

3. **Contract Context Provider** (`frontend/contexts/ContractContext.tsx`)
   - Manages connected wallet
   - Provides contract instances via Web3Auth/Wagmi
   - Handles network switching (Amoy ↔ mainnet)
   - Caches ABIs and contract instances

4. **UI Pages** (`frontend/app/`)
   - `/assets/[id]` - Asset detail with contract info
   - `/escrows/[id]` - Escrow management
   - `/governance` - DAO proposal interface
   - `/portfolio` - Token balance display
   - `/profile/[address]` - User contract activity

**Deliverables:**
- React hooks for contract interactions
- Reusable contract UI components
- Context provider for wallet/contract management
- Network switcher component
- UI pages with contract integration
- TypeScript interfaces for all contracts
- Unit tests for hooks and components

---

### Task 3.4: Testing & Quality Assurance

**Objective:** Establish comprehensive testing for contract integration and CI/CD pipelines.

**Components:**

1. **Integration Tests** (`tests/integration/contracts/`)
   - Test backend contract service with mock contracts
   - Test frontend contract hooks with mocked blockchain
   - End-to-end user flows (mint → transfer → escrow)
   - Event listener validation
   - Network switching tests

2. **E2E Tests** (`tests/e2e/`)
   - Contract interaction flows on Amoy testnet
   - Real wallet connections via Playwright
   - Contract UI component testing
   - Performance benchmarks
   - Error scenario testing

3. **Load Testing** (`tests/load/`)
   - Stress test contract endpoints
   - Verify API performance under load
   - Database connection pool limits
   - Frontend bundle size validation

4. **Code Quality** (`scripts/lint`, `scripts/test`)
   - ESLint for TypeScript
   - Solhint for Solidity
   - Unit test coverage reporting (80%+)
   - Type checking with TypeScript compiler
   - Security scanning with Slither

**Deliverables:**
- Integration test suite
- E2E test scenarios and Playwright scripts
- Load testing scripts
- CI/CD pipeline tests
- Code quality metrics dashboard
- Security audit reports

---

### Task 3.5: Documentation

**Objective:** Create comprehensive documentation for developers and operations.

**Components:**

1. **Developer Guides** (`docs/`)
   - `APP_DEVELOPMENT.md` - Local development setup
   - `CONTRACT_INTEGRATION.md` - Smart contract integration guide
   - `DEPLOYMENT.md` - CI/CD deployment procedures
   - `TROUBLESHOOTING.md` - Common issues and solutions

2. **API Documentation** (`api/README.md`)
   - Endpoints reference with request/response examples
   - Contract interaction examples
   - Authentication and authorization flows
   - Error codes and handling patterns

3. **Architecture Diagram** (`docs/ARCHITECTURE.md`)
   - System architecture overview
   - Component relationships
   - Data flow diagrams
   - Network topology

4. **Runbooks** (`docs/RUNBOOKS.md`)
   - Incident response procedures
   - Deployment operations
   - Rollback procedures
   - Monitoring and alerting

**Deliverables:**
- Comprehensive developer documentation
- API reference documentation
- Architecture diagrams (Mermaid)
- Operational runbooks
- Deployment checklists

---

## Implementation Sequence

### Phase 3.1: Application CI/CD Setup (Week 1)
1. Create `deploy-frontend.yml` workflow
2. Create `deploy-backend.yml` workflow
3. Configure Vercel project
4. Configure Render service
5. Set up environment protection rules
6. Create health check endpoints
7. Write deployment documentation

### Phase 3.2: Smart Contract Integration - Backend (Week 1-2)
1. Deploy contracts to Amoy testnet (from Phase 2)
2. Extract contract addresses from deployment artifacts
3. Create `ContractService` module
4. Implement contract services for all 5 contracts
5. Create event listeners
6. Add configuration management
7. Write unit and integration tests

### Phase 3.3: Smart Contract Integration - Frontend (Week 1-2)
1. Create contract context provider
2. Implement React hooks for contract interactions
3. Create contract UI components
4. Add network switcher
5. Implement contract pages (assets, escrows, governance)
6. Configure Wagmi with Amoy network
7. Write component tests

### Phase 3.4: Testing & QA (Week 2-3)
1. Create integration test suite
2. Set up Playwright for E2E testing
3. Write load testing scripts
4. Implement CI/CD pipeline tests
5. Set up code quality automation
6. Run security scans on integrated code

### Phase 3.5: Deployment to Production (Week 3)
1. Complete contract integration testing
2. Deploy backend to production (Render)
3. Deploy frontend to production (Vercel)
4. Run production smoke tests
5. Configure monitoring and alerting
6. Update runbooks with production procedures

---

## Dependencies & Integration Points

### Phase 3.2 Dependent On:
- ✅ Phase 2 complete (Amoy testnet contracts deployed)
- ✅ Application configuration guide created
- ✅ Amoy network configured in all configs
- ✅ Dry-run deployment tested

### Phase 3.3 Dependent On:
- Contract addresses from Amoy deployment
- Contract interaction services implemented
- Frontend contract integration components ready

### Phase 3.4 Dependent On:
- CI/CD workflows implemented
- Integration tests written
- E2E tests configured
- Load testing scripts created

---

## Success Criteria

Phase 3.1: Application CI/CD Setup
- [x] GitHub Actions workflows created
- [x] Vercel configured
- [x] Render configured
- [x] Health check endpoints deployed
- [x] Environment protection rules set

Phase 3.2: Smart Contract Integration - Backend
- [x] All 5 contract services implemented
- [x] Event listeners configured
- [x] Configuration management system created
- [x] Unit tests (80%+ coverage)
- [x] Integration tests passing

Phase 3.3: Smart Contract Integration - Frontend
- [x] Contract context provider implemented
- [x] React hooks created (5+ hooks)
- [x] Contract UI components created (6+ components)
- [x] Network switcher implemented
- [x] Wagmi configured for Amoy
- [x] Component tests passing

Phase 3.4: Testing & QA
- [x] Integration test suite complete
- [x] E2E tests passing
- [x] Load testing scripts created
- [x] Code quality automation (ESLint, Solhint)
- [x] Security scans passing (Slither)

Phase 3.5: Deployment to Production
- [x] Staging deployments successful
- [x] Production deployments successful
- [x] Smoke tests passing
- [x] Monitoring configured
- [x] Runbooks updated

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|-------|------------|--------|-----------|
| **Contract integration bugs** | Medium | High | Comprehensive testing, gradual rollout |
| **ABI mismatch errors** | Low | Medium | Versioned ABIs, automatic verification |
| **Gas cost increases** | Low | Medium | Gas optimization, batch operations |
| **Event listener failures** | Low | High | Retry logic, monitoring |
| **Frontend wallet connection issues** | Medium | High | Multiple wallet providers (Web3Auth, Wagmi) |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|-------|------------|--------|-----------|
| **Deployment downtime** | Low | Medium | Blue/green deployments, rollback procedures |
| **Staging data corruption** | Low | Medium | Separate databases, backup procedures |
| **Secret misconfiguration** | Low | Critical | Secret validation, environment separation |
| **Performance degradation** | Medium | Medium | Load testing, monitoring, auto-scaling |

---

## Rollback Plan

### Rollback Triggers

1. Critical bugs in production
2. Performance degradation (>50% increase)
3. Data corruption or loss
4. Security vulnerabilities

### Rollback Procedures

#### 1. Application Rollback
```bash
# Revert to previous deployment
cd frontend
git checkout <previous-stable-tag>
git push --force origin main

# Trigger Vercel rollback
vercel rollback --token <VERCEL_TOKEN> --yes
```

#### 2. Backend Rollback
```bash
# Revert to previous deployment
cd api
git checkout <previous-stable-tag>
git push --force origin main

# Render rollback to previous deployment
render rollback <RENDER_SERVICE_ID> --yes
```

#### 3. Database Rollback
```bash
# Run rollback migration
cd api
npm run migrate:rollback

# Restore from backup
pg_restore --clean <backup-file>
```

#### 4. Smart Contract Rollback
```bash
# Re-deploy previous contract version
cd blockchain
npm run deploy:amoy:rollback <previous-contract-version>

# Update application configuration
# Contract addresses set to previous version
```

**Recovery Time Objectives:**
- **1 hour:** Application deployments
- **4 hours:** Smart contract deployments
- **24 hours:** Full system recovery

---

## Monitoring & Observability

### Metrics to Track

**Application Metrics:**
- Deployment frequency and success rate
- Response time (p50, p95, p99)
- Error rate and types
- Database connection pool utilization
- Active user sessions and throughput

**Contract Metrics:**
- Transaction volume and gas usage
- Contract interaction success/failure rates
- Event processing lag
- Verification status

**Infrastructure Metrics:**
- API uptime and availability
- Database query performance
- Cache hit rates
- CDN bandwidth usage

### Alerting Strategy

**Critical Alerts (PagerDuty/SMS):**
- Production deployments failed
- Contract deployment errors
- API error rate > 10%
- Database connection failures
- Security incidents

**Warning Alerts (Slack/Email):**
- Staging deployments failed
- Performance degradation (>30% increase)
- Low disk space (<20%)
- Backup job failures

**Info Logs (Rollbar/DataDog):**
- All deployments
- Successful deployments
- Code quality metrics
- Test results

### Observability Stack

1. **Application Monitoring** - Sentry for errors
2. **API Monitoring** - Render metrics + uptime
3. **Database Monitoring** - Query performance, connection health
4. **Infrastructure Monitoring** - GitHub Actions, Vercel, Render
5. **Smart Contract Monitoring** - PolygonScan APIs, event listeners
6. **Log Aggregation** - Centralized logging service

---

## Resource Requirements

### Team Skills Needed
- DevOps Engineer (CI/CD, monitoring)
- Backend Developer (NestJS, contract integration)
- Frontend Developer (Next.js, contract UI)
- Blockchain Developer (Solidity, gas optimization)
- QA Engineer (testing, automation)

### Infrastructure Costs (Monthly)
- GitHub Actions: $0-$10
- Render: $7-$50 (backend scale)
- Vercel: $0-$20 (frontend build minutes)
- Database: $15-$50 (managed PostgreSQL)
- PolygonScan API: Free tier
- Monitoring (Sentry/Rollbar): $14-$50
- Storage (S3/CDN): $10-$30
- **Total Estimated:** $60-$200/month for full production

### External Services
- Vercel (hosting)
- Render (backend hosting)
- Polygon RPC (Alchemy or Infura for mainnet)
- PolygonScan API (contract verification via unified `blockchain/scripts/utils/verify-contracts.js`)
- Sentry (error tracking)
- Rollbar or DataDog (monitoring)
- Slack (notifications)

---

## Acceptance Criteria

**Phase 3.1: Application CI/CD Setup**
- [x] GitHub Actions workflows created and tested
- [x] Vercel and Render configured and tested
- [x] Health check endpoints deployed
- [x] Environment separation (staging, production)
- [x] Deployment documentation complete
- [x] Rollback procedures documented
- [x] Secret management guide included

**Phase 3.2: Smart Contract Integration - Backend**
- [x] Contract service module created
- [x] All 5 contract services implemented
- [x] Event listeners configured
- [x] Configuration management system created
- [x] Unit tests with 80%+ coverage
- [x] Integration tests passing
- [x] Type-safe contract interfaces
- [x] Error handling and logging
- [x] Contract addresses extracted from Amoy deployment

**Phase 3.3: Smart Contract Integration - Frontend**
- [x] Contract context provider implemented
- [x] 5+ React hooks created
- [x] 6+ UI components created
- [x] Network switcher implemented
- [x] Wagmi configured for Amoy network
- [x] Contract pages implemented
- [x] Component tests passing
- [x] TypeScript interfaces complete
- [x] State management for wallet/contracts

**Phase 3.4: Testing & QA**
- [x] Integration test suite created
- [x] E2E tests configured with Playwright
- [x] Load testing scripts created
- [x] CI/CD pipeline tests implemented
- [x] Code quality automation (ESLint, Solhint)
- [x] Security scans passing
- [x] Performance benchmarks established
- [x] Smoke tests passing

**Phase 3.5: Deployment to Production**
- [x] Staging deployments successful (all services)
- [x] Production deployments successful (all services)
- [x] Smoke tests passing on Amoy testnet
- [x] Monitoring and alerting configured
- [x] Runbooks updated for production
- [x] Rollback procedures tested

---

## Related Documents

- [Phase 2 Plan](../sisyphus/handoff/PHASE2_SMART_CONTRACTS_PLAN.md)
- [Phase 2 Completion](../sisyphus/handoff/PHASE2_COMPLETION.md)
- [Mumbai to Amoy Migration](../MUMBAI_TO_AMOY_MIGRATION.md)
- [Application Configuration Guide](../docs/APP_CONFIG_AMOY_TESTNET.md)
- [Amoy Deployment Guide](../docs/APP_CONFIG_AMOY_TESTNET.md) - To be created

---

## Blockers

1. **Amoy Testnet Deployment Not Complete**
   - Dependencies: Contracts deployed to Amoy testnet
   - Action: Deploy contracts to Amoy testnet (Task 5 done)
   - Verify contracts on Amoy PolygonScan
   - Extract contract addresses

2. **Contract Addresses Not Extracted**
   - Dependencies: Addresses from deployment artifacts
   - Action: Update `.env.staging` with addresses
   - Blocker: Can't update application configuration

3. **CI/CD Workflows Not Created**
   - Dependencies: Application CI/CD setup (Phase 3.1)
   - Action: Implement Phase 3.1 tasks
   - Timeframe: Week 1

4. **Contract Integration Not Implemented**
   - Dependencies: Smart contract services (Phase 3.2, 3.3)
   - Action: Implement backend and frontend integration
   - Timeframe: Weeks 2-3

---

## Timeline

| Week | Phase | Tasks |
|-------|-------|--------|
| 1 | Phase 3.1 | Application CI/CD Setup |
| 2 | Phase 3.2 | Contract Integration (Backend) |
| 3 | Phase 3.3 | Contract Integration (Frontend) |
| 4 | Phase 3.4 | Testing & QA |
| 5 | Phase 3.5 | Production Deployment & Monitoring |
| 6 | Post-Phase | Documentation & Optimization |

**Total Duration:** 6 weeks

---

## Success Definition

Phase 3 is **SUCCESSFUL** when:

1. **All acceptance criteria met** (as listed above)
2. **Production deployments successful** (all services green)
3. **Performance benchmarks met** (within SLA thresholds)
4. **Security audits passed** (no critical findings)
5. **Monitoring fully operational** (all metrics tracked)
6. **Runbooks complete** (operational procedures documented)
7. **Team trained** on new infrastructure and processes

---

## Next Steps After Phase 3

### Immediate Actions (Post-Phase 3)

1. **Proceed with Amoy Deployment** (Phase 3.2, 3.3 blockers removed)
   ```bash
   # Deploy contracts to Amoy testnet
   gh workflow run "deploy-contracts-amoy.yml" -f dry_run=false,verify_contracts=true
   
   # Verify contracts
   cd blockchain
   npm run verify:amoy
   
   # Extract addresses from artifacts
   # Update .env.staging with deployed addresses
   ```

2. **Begin Phase 3.1** (Application CI/CD Setup)
   ```bash
   # Create GitHub Actions workflows
   # Configure Vercel project
   # Configure Render service
   # Set up health checks
   ```

3. **Update Documentation**
   ```bash
   # Create Phase 3 plan document
   # Update project README
   # Create integration guides
   ```

---

## Notes

- **Amoy Testnet**: Chain ID 80002, fully supported
- **Mumbai Testnet**: Chain ID 80001, deprecated but preserved for reference
- **Backward Compatibility**: Application supports switching between testnets seamlessly
- **Production Path**: Deploy to Polygon Mainnet after Phase 3 complete
- **Scalability**: All infrastructure designed for production load

---

**Plan Version:** 1.0  
**Last Updated:** 2026-02-08 (after Phase 2 completion)  
**Status:** 🟡 READY FOR IMPLEMENTATION
