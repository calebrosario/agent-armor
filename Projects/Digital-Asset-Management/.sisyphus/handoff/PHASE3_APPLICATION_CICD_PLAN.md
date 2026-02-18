# Phase 3: Application CI/CD Workflows

**Status**: 🔄 Planning  
**Duration**: Week 5-6 (2 weeks)  
**Prerequisites**: Phase 1 & 2 complete, Docker images built

---

## 🎯 Objectives

### Primary Goals
1. Add comprehensive testing for backend and frontend
2. Build and test Docker images in CI
3. Run E2E tests with Playwright
4. Set up deployment to staging environment
5. Implement integration testing across all services

### Success Criteria
- All backend tests pass with 80%+ coverage
- All frontend tests pass with 80%+ coverage
- E2E tests cover critical user flows
- Docker images build and push to registry
- Staging deployment succeeds automatically on main branch merge

---

## 📋 Detailed Tasks

### Week 5: Backend & Frontend Testing (Days 1-7)

#### Day 1-2: Backend Testing Workflow
**Task**: Create `.github/workflows/test-backend.yml`

**Purpose**: Add lint, unit tests, and E2E tests for NestJS backend

**Workflow Components**:
```yaml
name: Test Backend API

on:
  pull_request:
    paths:
      - 'api/**'
      - '.github/workflows/test-backend.yml'
  push:
    branches: [main, develop]
    paths:
      - 'api/**'

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd api
          npm ci
          
      - name: Run linter
        run: |
          cd api
          npm run lint
          
  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd api
          npm ci
          
      - name: Run unit tests
        run: |
          cd api
          npm run test -- --coverage
          
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./api/coverage/lcov.info
          
  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: |
          cd api
          npm ci
          
      - name: Start services
        run: docker-compose up -d postgres redis localstack
      
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_HOST: localhost
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_ENDPOINT_URL: http://localhost:4566
        run: |
          cd api
          npm run test:e2e
          
      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-artifacts
          path: api/test-results/
          
      - name: Stop services
        if: always()
        run: docker-compose down
```

**Acceptance Criteria**:
- [ ] Workflow runs on PR/push to api/
- [ ] Linting passes (no errors)
- [ ] Unit tests pass with 80%+ coverage
- [ ] E2E tests pass for critical flows
- [ ] Coverage report uploaded

---

#### Day 3-4: Frontend Testing Workflow
**Task**: Create `.github/workflows/test-frontend.yml`

**Purpose**: Add lint, unit tests, and E2E tests for Next.js frontend

**Workflow Components**:
```yaml
name: Test Frontend

on:
  pull_request:
    paths:
      - 'frontend/**'
      - '.github/workflows/test-frontend.yml'
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run linter
        run: |
          cd frontend
          npm run lint
          
  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run unit tests
        run: |
          cd frontend
          npm run test -- --coverage
          
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./frontend/coverage/lcov.info
          
  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Playwright
        run: |
          npm install -g @playwright/test
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps
          
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e
          
      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-artifacts
          path: frontend/playwright-report/
          
      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-videos
          path: frontend/playwright-report/
          retention-days: 7
```

**Acceptance Criteria**:
- [ ] Workflow runs on PR/push to frontend/
- [ ] Linting passes (no errors)
- [ ] Unit tests pass with 80%+ coverage
- [ ] E2E tests pass for critical user flows
- [ ] Playwright reports uploaded

---

#### Day 5-6: Integration Testing Workflow
**Task**: Create `.github/workflows/integration-test.yml`

**Purpose**: Test cross-service integration (API + Frontend + Blockchain)

**Workflow Components**:
```yaml
name: Integration Tests

on:
  pull_request:
    paths:
      - 'api/**'
      - 'frontend/**'
      - 'blockchain/**'
  push:
    branches: [main, develop]
    paths:
      - 'api/**'
      - 'frontend/**'
      - 'blockchain/**'

permissions:
  contents: read

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start all services
        run: docker-compose up -d
      
      - name: Wait for services to be ready
        run: sleep 30
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_HOST: localhost
          NEXT_PUBLIC_API_URL: http://localhost:3000
          POLYGON_MUMBAI_RPC_URL: ${{ secrets.POLYGON_MUMBAI_RPC_URL }}
        run: |
          cd tests/integration
          npm run test:integration
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-results
          path: tests/integration/results/
          
      - name: Stop services
        if: always()
        run: docker-compose down
```

**Acceptance Criteria**:
- [ ] Workflow runs on PR/push to any service
- [ ] All services start successfully
- [ ] Integration tests pass end-to-end
- [ ] Test results uploaded

---

### Week 6: Staging Deployment (Days 8-10)

#### Day 8-9: Staging Deployment Workflow
**Task**: Create `.github/workflows/deploy-staging.yml`

**Purpose**: Automatically deploy to staging environment on main branch merge

**Workflow Components**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: ghcr.io/${{ github.repository }}/digital-asset-api:latest
          
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/digital-asset-frontend:latest
          
  deploy-to-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render (Backend)
        uses: johnbeynon/render-deploy-action@v2.5.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          
      - name: Deploy to Vercel (Frontend)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          
      - name: Verify deployment
        run: |
          curl -f ${{ secrets.STAGING_API_URL }}/health
          curl -f ${{ secrets.STAGING_API_URL }}/health
          
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "Staging deployment completed: ${{ job.status }}"
            }
```

**Acceptance Criteria**:
- [ ] Workflow runs on push to main
- [ ] Docker images build and push to GitHub Container Registry
- [ ] Backend deploys to Render
- [ ] Frontend deploys to Vercel
- [ ] Health checks pass
- [ ] Slack notification sent

---

#### Day 10: Testing & Documentation
**Tasks**:
1. Run full test suite on staging environment
2. Test deployment rollback procedures
3. Document staging environment configuration
4. Create monitoring dashboard guide
5. Update API documentation with staging endpoints

**Test Scenarios**:
- User authentication (email/password + OAuth + Web3Auth)
- Asset creation and listing
- Deed upload to IPFS
- Asset minting (ERC-1155)
- Escrow creation and funding
- DAO proposal and voting
- Wallet connection and transfers

**Acceptance Criteria**:
- [ ] All test scenarios pass on staging
- [ ] Rollback procedures documented
- [ ] Staging environment documented
- [ ] Monitoring guide created

---

## 📊 Files to Create

| File | Purpose | Workflow Trigger |
|-------|---------|----------------|
| test-backend.yml | Backend lint, unit, E2E | PR/push to api/ |
| test-frontend.yml | Frontend lint, unit, E2E | PR/push to frontend/ |
| integration-test.yml | Cross-service integration | PR/push to any service |
| deploy-staging.yml | Deploy to staging | Push to main |

---

## 🔑 Required Secrets (Additional)

| Secret | Purpose | Already Set? |
|--------|---------|---------------|
| STAGING_API_URL | Staging environment endpoint | ❌ |
| GITHUB_TOKEN | Container registry authentication | ✅ (auto) |
| RENDER_SERVICE_ID | Render service identifier | ❌ |
| RENDER_API_KEY | Render deployment key | ❌ |

**Action Required**: Set staging and deployment secrets before starting Phase 3

---

## 🎯 Phase 3 Success Criteria

| Criteria | How to Verify | Target |
|----------|-----------------|--------|
| Backend testing | Lint, unit, E2E workflows run | ✅ |
| Frontend testing | Lint, unit, E2E workflows run | ✅ |
| Integration testing | Cross-service tests pass | ✅ |
| Docker builds | Images build and push to registry | ✅ |
| Staging deployment | Auto-deploy on main merge | ✅ |
| Test coverage | > 80% for backend & frontend | ✅ |
| Documentation | All guides created | ✅ |

---

## ⚠️ Known Challenges & Solutions

### Challenge 1: E2E Test Framework
**Challenge**: Need to choose E2E testing framework

**Options**:
1. **Cypress** - Better TypeScript support
2. **Playwright** - Faster, better video recording
3. **TestCafe** - Visual testing

**Recommendation**: Use **Playwright**
**Reasoning**: Better TypeScript support, faster execution, video recording

---

### Challenge 2: Deployment Target
**Challenge**: Need to choose deployment platforms for staging/production

**Options**:
1. **Vercel + Render** - Fast, serverless
2. **AWS ECS + CloudFront** - More control
3. **Kubernetes** - Scalable

**Decision**: Use **Vercel (frontend) + Render (backend)**
**Reasoning**: Fast deployment, good DX, matches project requirements

---

### Challenge 3: Container Registry
**Challenge**: Where to host Docker images?

**Options**:
1. **GitHub Container Registry (ghcr.io)** - Free, integrated with GitHub
2. **Docker Hub** - Public, no rate limits
3. **AWS ECR** - Secure, more complex

**Recommendation**: Use **GitHub Container Registry (ghcr.io)**
**Reasoning**: Free, integrated with GitHub Actions, no separate auth needed

---

## 🚀 First Steps for Next Session

### Session Start
1. Review Phase 1 & 2 completion
2. Set staging and deployment secrets (4 required)
3. Create branch `feature/app-testing-ci`
4. Start implementing test-backend.yml

### Task Order
1. Create test-backend.yml (Day 1-2)
2. Create test-frontend.yml (Day 3-4)
3. Create integration-test.yml (Day 5-6)
4. Create deploy-staging.yml (Day 8-9)
5. Set up Playwright for E2E testing (Day 3-4)
6. Create E2E test suite (Day 3-4)
7. Test staging deployment (Day 10)
8. Document all workflows (Day 10)

---

## 📚 References

- [CI/CD Integration Plan](../plans/CICD_Integration_Plan.md) - Full plan with all phases
- [API.md](../../docs/API.md) - Backend API documentation
- [GitHub Secrets Guide](../../docs/GITHUB_SECRETS.md) - Secrets setup instructions

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Maintainer**: DevOps Team  
**Status**: 🔄 Ready for Implementation
