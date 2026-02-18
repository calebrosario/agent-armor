# Local Development with act & LocalStack

**Purpose:** Reduce development and testing costs by using local emulators

## Quick Start

### Prerequisites

```bash
# Install Docker
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/engine/install/

# Install act (GitHub Actions runner)
brew install act

# Install LocalStack
brew install localstack/tap/localstack-cli

# Install awslocal (AWS CLI for LocalStack)
pip3 install awscli-local
```

### Daily Development Workflow

#### Step 1: Start Services

```bash
# Terminal 1: Start LocalStack
docker-compose -f localstack.yml up -d

# Terminal 2: Start application services
docker-compose up -d postgres redis

# Terminal 3: Start application
cd api && npm start
```

#### Step 2: Test Changes Locally

```bash
# Run tests
npm test

# Run GitHub Actions workflows locally
act -j test
act -j build

# Test Terraform with LocalStack
terraform plan -var-file="terraform/environments/local.tfvars"
```

#### Step 3: Verify Before Push

```bash
# Run all workflows
act

# Run tests
npm test

# Check Terraform
terraform validate
```

#### Step 4: Push to GitHub

```bash
# Only push after local verification passes
git add .
git commit -m "feat: add new feature"
git push origin feature-branch
```

## Cost Savings

| Activity | Monthly Cost (Original) | Monthly Cost (Local) | Savings |
|-----------|----------------------|---------------------|----------|
| GitHub Actions | $50-100 | $0 | $50-100 |
| AWS Development | $350 | $0 | $350 |
| AWS Staging | $1,421 | $0 | $1,421 |
| **Total** | **$1,821** | **$0** | **$1,821/month** |

**Annual Savings:** $21,852/year

## Configuration Files

### .actrc
Configuration for running GitHub Actions locally with secrets and custom runners.

### localstack.yml
Docker Compose configuration for LocalStack with service ports and environment variables.

### .env.local
Local environment variables (not committed to git):
```bash
# LocalStack
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Application
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=local_secret_for_development
```

## Testing with act

### List Available Jobs

```bash
act -l
```

### Run All Jobs

```bash
act
```

### Run Specific Job

```bash
act -j test
act -j build
```

### Run Specific Workflow

```bash
act -W .github/workflows/ci.yml
```

### Run with Secrets

```bash
act -s GITHUB_TOKEN=$GITHUB_TOKEN
```

## Testing with LocalStack

### Start LocalStack

```bash
# With Docker Compose
docker-compose -f localstack.yml up -d

# Or with CLI
localstack start
```

### Check Status

```bash
localstack status services
```

### Test S3 Operations

```bash
# With awslocal
awslocal s3 ls
awslocal s3 mb s3://test-bucket
awslocal s3 cp file.txt s3://test-bucket/

# With aws CLI + endpoint
aws --endpoint-url=http://localhost:4566 s3 ls
```

### Test DynamoDB Operations

```bash
awslocal dynamodb list-tables
awslocal dynamodb create-table --table-name TestTable --attribute-definitions AttributeName=TestID,AttributeType=S
```

## Troubleshooting

### act Not Found

```bash
# Ensure act is in PATH
echo $PATH | grep act

# Reinstall if needed
brew reinstall act
```

### LocalStack Connection Refused

```bash
# Check LocalStack status
localstack status

# Restart if needed
localstack stop
localstack start
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# Restart Docker Desktop
open -a Docker
```

## Best Practices

1. **Always Test Locally First**
   - Run `act` before pushing
   - Test with LocalStack before deploying to AWS
   - Fix issues locally (faster iteration)

2. **Environment Isolation**
   - Use separate `.env.local` for each developer
   - Don't commit local configuration
   - Use different LocalStack instances for different projects

3. **Secret Management**
   - Use `.actrc` for GitHub Actions secrets
   - Use `.env.local` for application secrets
   - Never commit secrets to git

4. **Documentation**
   - Document any service limitations
   - Note any workarounds needed
   - Share best practices with team

5. **CI/CD Integration**
   - Use GitHub Actions for production builds
   - Use act for local development and PR validation
   - Use LocalStack for AWS development
   - Deploy to staging/production only after local validation

## Additional Resources

- [act Documentation](https://nektosact.com)
- [LocalStack Documentation](https://docs.localstack.cloud)
- [awslocal Documentation](https://github.com/localstack/awscli-local)
- [Docker Documentation](https://docs.docker.com)
