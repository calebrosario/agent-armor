# Local Testing with act

This guide explains how to run the staging workflow locally using `act` and LocalStack for comprehensive testing.

## Prerequisites

1. **act** - GitHub Actions runner for local CI/CD
   ```bash
   # Install via Homebrew
   brew install act
   
   # Or download from GitHub
   wget https://github.com/nektos/act/releases/latest/download/act_Darwin_amd64_v0.2.54
   ```
   
2. **Docker** - Required for running tests locally
   ```bash
   docker --version
   ```

3. **LocalStack** - AWS cloud service emulator (optional but recommended)
   ```bash
   # Install via Homebrew
   brew tap localstack/localstack
   localstack start -d
   ```

## Running the Test-Staging Workflow

### Step 1: Prepare Environment

Copy the staging environment configuration:

```bash
cp .env.staging .env
```

### Step 2: Run All Tests

Run complete workflow:

```bash
act -W .github/workflows/test-staging.yml
```

This will:
1. ✅ Build Docker images for backend and frontend
2. ✅ Start Docker Compose services
3. ✅ Wait for services to be healthy
4. ✅ Run backend unit tests
5. ✅ Run frontend unit tests
6. ✅ Run E2E tests
7. ✅ Run integration tests (if configured)
8. ✅ Cleanup services

### Step 3: Run Specific Jobs

Run only build-and-test job:
```bash
act -W .github/workflows/test-staging.yml -j build-and-test
```

Run only validation job:
```bash
act -W .github/workflows/test-staging.yml -j validate-deployment
```

Run only the validation job:

```bash
act -j validate-deployment
```

## Using LocalStack (Optional but Recommended)

If you want to test with AWS services (DynamoDB, S3, SNS, etc.):

1. **Start LocalStack**:
   ```bash
   ./localstack start -d
   ```

2. **Configure services** in `localstack.yml`:
   - S3: For static assets
   - DynamoDB: For database
   - Lambda: For API functions
   
3. **Update environment variables** to use LocalStack endpoints

  4. **Run workflow**:
    ```bash
    act -W .github/workflows/test-staging.yml
    ```

## Workflow Jobs

### build-and-test
Builds Docker images and runs all tests locally.

### validate-deployment
Verifies staging configuration and displays setup instructions.

## Troubleshooting

### Common act CLI Issues

#### Parser Error: "workflow is not valid"

**Cause:** act has known limitations with complex workflow syntax

**Solution:**
```bash
# Use dry run first
act -W .github/workflows/test-staging.yml -n

# If parser fails, fallback to GitHub Actions for full validation
# Common workarounds:
# - Simplify complex `if` conditions
# - Use string expressions instead of complex ones
# - Verify YAML syntax with `yamllint .github/workflows/test-staging.yml`
```

#### "docker command not found"

**Cause:** Docker daemon not running or not installed

**Solution:**
```bash
# Check Docker status
docker ps

# Start Docker Desktop (macOS/Windows)
# or start Docker daemon (Linux)
sudo systemctl start docker

# Verify installation
docker --version
```

#### "Error: pull access denied for ghcr.io"

**Cause:** Act cannot access GitHub Container Registry without authentication

**Solution:**
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or pull images first
docker pull ghcr.io/catthehacker/ubuntu:act-20.04
```

#### Workflow step timeout

**Cause:** Services not ready when tests start

**Solution:**
```bash
# Manually check service health
curl http://localhost:3000/health
curl http://localhost:3001/

# Increase timeout in workflow or add retry logic
```

### Docker Compose Issues

Services won't start:
```bash
# Check port conflicts
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

### Database Connection

If tests fail due to database:
```bash
# Check if database is running
docker-compose ps

# View logs
docker-compose logs api

# Restart database service
docker-compose restart db
```

### Tests Not Found

If `npm test` fails:
```bash
# Check if tests are configured
cat api/package.json | grep test
cat frontend/package.json | grep test

# Ensure test dependencies are installed
cd api && npm list | grep -E "jest|vitest|playwright"
cd frontend && npm list | grep -E "jest|vitest|playwright"
```

## Act Flags Reference

Commonly used act flags:

- `-W <workflow-file>` - Specify workflow file to run
- `-j <job>` - Run specific job
- `-l <label>` - Run steps with label
- `-n` - Dry run (don't execute)
- `-v` - Verbose output
- `--secret-file <path>` - Load secrets from file

## Examples

### Run workflow with verbose output:

```bash
act -W .github/workflows/test-staging.yml -v
```

### Run specific test only:

```bash
act -W .github/workflows/test-staging.yml -j build-and-test -l "Run Tests" -v
```

### Dry run to check workflow:

```bash
act -W .github/workflows/test-staging.yml -n
```

## CI/CD Context

This workflow is part of the hybrid cloud + local testing approach (Approach 3):

- **Workflow**: `.github/workflows/test-staging.yml`
- **Environment File**: `.env.staging`
- **Main Production Workflow**: `.github/workflows/deploy-staging.yml`

### Next Steps

1. ✅ Environment files created
2. ✅ Integration tests created
3. ⏭ Test locally with act
4. 📝 Update deploy-staging.yml to use environment files

### Related Documentation

- [Local Testing Guide](.sisyphus/docs/LOCAL_TESTING.md) - This file
- [Deployment Documentation](../docs/07-ci-cd.md) - Main CI/CD docs
- [GitHub Secrets Guide](../docs/GITHUB_SECRETS.md) - How to configure secrets
