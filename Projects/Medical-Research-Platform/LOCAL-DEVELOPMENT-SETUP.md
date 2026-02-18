# Local Development Setup Guide

**Date:** January 28, 2026
**Purpose:** Reduce testing and development costs using local emulators

---

## Overview

This guide sets up local development and testing environments for the Health-Mesh platform, reducing AWS and GitHub Actions costs significantly.

## Cost Savings

| Environment | Original Cost (Monthly) | Local Cost (Monthly) | Savings |
|-------------|--------------------------|---------------------|----------|
| GitHub Actions CI/CD | ~$50-100 | $0 (local) | **$50-100** |
| AWS Development | ~$350 | $0 (local) | **$350** |
| AWS Staging | ~$1,421 | $0 (local) | **$1,421** |
| **Total Savings** | ~$1,821/month | **$0/month** | **$1,821/month** |

**Annual Savings:** ~$21,852/year

---

## Tool 1: act - Local GitHub Actions Runner

### What is act?

**act** is a tool for running GitHub Actions locally. It reads your `.github/workflows/` and determines the set of actions that need to be run, then uses Docker to execute them.

### Key Features

- ✅ **Fast Feedback:** No need to commit/push to test workflow changes
- ✅ **Full Compatibility:** Supports all GitHub Actions features
- ✅ **Docker-based:** Uses same images as GitHub Actions runners
- ✅ **Local Task Runner:** Replace Makefiles with GitHub Actions workflows
- ✅ **Multiple Runners:** Ubuntu, macOS, Windows support

### Installation

#### macOS (Homebrew)
\`\`\`bash
brew install act
\`\`\`

#### Linux (Homebrew)
\`\`\`bash
brew install act
\`\`\`

#### Manual Installation
\`\`\`bash
# Download latest release
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Or build from source
go install github.com/nektos/act@latest
\`\`\`

### Basic Usage

\`\`\`bash
# List all jobs in workflows
act -l

# Run all jobs
act

# Run specific job
act -j <job-name>

# Run specific workflow
act -W .github/workflows/<workflow-name>.yml

# Use specific runner
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Run in verbose mode
act -v
\`\`\`

### Configuration

Create `.actrc` in project root:

\`\`\`yaml
# .actrc
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-20.04=catthehacker/ubuntu:act-20.04
--container-architecture linux/amd64
--secret GITHUB_TOKEN=${GITHUB_TOKEN:-}
--secret AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
--secret AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
\`\`\`

### Limitations

- ⚠️ Some GitHub Actions may not be fully supported (rare)
- ⚠️ Need Docker installed and running
- ⚠️ Some GitHub-specific features unavailable (e.g., some secrets)
- ⚠️ GitHub marketplace actions need to be Docker-based

### Best Practices

1. **Test Before Pushing:** Always run `act` before pushing workflow changes
2. **Use Same Images:** Configure act to use same images as production
3. **Environment Variables:** Set up `.actrc` for secrets and vars
4. **Parallel Execution:** act runs jobs in parallel, similar to GitHub Actions
5. **Cache Workflows:** act caches workflow runs for faster re-execution

---

## Tool 2: localstack - Local AWS Cloud Stack

### What is localstack?

**LocalStack** is a fully functional local AWS cloud stack that provides an emulated environment for developing and testing your AWS applications locally. It runs in a Docker container and supports most AWS services.

### Supported Services

| Service | Status | Notes |
|---------|----------|--------|
| ✅ S3 | Full | Object storage |
| ✅ DynamoDB | Full | NoSQL database |
| ✅ SQS | Full | Message queuing |
| ✅ SNS | Full | Pub/sub messaging |
| ✅ Lambda | Full | Serverless functions |
| ✅ API Gateway | Full | API management |
| ✅ CloudFormation | Full | IaC orchestration |
| ✅ CloudWatch | Partial | Logging/monitoring |
| ✅ IAM | Partial | Identity management |
| ✅ KMS | Partial | Encryption |
| ✅ RDS | Partial | PostgreSQL/MySQL (Pro) |
| ✅ ElastiCache | Partial | Redis/Memcached (Pro) |
| ✅ Secrets Manager | Full | Secrets storage |

### Installation

#### Using LocalStack CLI
\`\`\`bash
# macOS or Linux (Homebrew)
brew install localstack/tap/localstack-cli

# Binary download
curl -O https://raw.githubusercontent.com/localstack/localstack-cli/master/install.sh
chmod +x install.sh
./install.sh

# PyPI
pip3 install localstack
\`\`\`

### Basic Usage

\`\`\`bash
# Start LocalStack
localstack start

# Check status
localstack status

# Stop LocalStack
localstack stop

# View logs
localstack logs

# Reset state
localstack reset
\`\`\`

### Integration with Health-Mesh

#### Using awslocal CLI
\`\`\`bash
# Install awslocal
pip3 install awscli-local

# Configure
awslocal configure

# Use awslocal instead of aws for all commands
awslocal s3 ls
awslocal s3 cp file.txt s3://bucket/
awslocal sqs create-queue --queue-name test-queue
\`\`\`

#### Using aws CLI with LocalStack endpoint
\`\`\`bash
# Set environment variable
export AWS_ENDPOINT_URL=http://localhost:4566

# Use standard aws CLI with endpoint
aws --endpoint-url=http://localhost:4566 s3 ls

# Create S3 bucket
aws s3 mb s3://medical-research-dev --endpoint-url=http://localhost:4566
\`\`\`

### Integration with Terraform

Update `terraform/provider.tf` for local development:

\`\`\`hcl
# terraform/provider.tf

# Provider for local development
provider "aws" {
  region = "us-east-1"

  # LocalStack endpoints
  endpoints {
    s3       = "http://localhost:4566"
    dynamodb  = "http://localhost:4566"
    sqs       = "http://localhost:4566"
    sns       = "http://localhost:4566"
    lambda    = "http://localhost:4566"
    iam       = "http://localhost:4566"
    cloudwatch = "http://localhost:4566"
    apigateway = "http://localhost:4566"
  }

  # LocalStack credentials (any values work locally)
  access_key = "test"
  secret_key = "test"
  skip_credentials_validation = true
  skip_metadata_api_check = true
  skip_requesting_account_id = true
}

# Production provider (comment out for production)
# provider "aws" {
#   region = var.aws_region
#   # Use actual AWS credentials
#   access_key = var.aws_access_key_id
#   secret_key = var.aws_secret_access_key
# }
\`\`\`

#### Terraform Environment Variables

Create `terraform/environments/local.tfvars`:

\`\`\`hcl
aws_region     = "us-east-1"
aws_access_key_id = "test"
aws_secret_access_key = "test"

# LocalStack endpoints
s3_endpoint           = "http://localhost:4566"
dynamodb_endpoint     = "http://localhost:4566"
sqs_endpoint           = "http://localhost:4566"
sns_endpoint           = "http://localhost:4566"
lambda_endpoint        = "http://localhost:4566"
iam_endpoint           = "http://localhost:4566"
cloudwatch_endpoint    = "http://localhost:4566"
apigateway_endpoint    = "http://localhost:4566"
\`\`\`

Use with:

\`\`\`bash
# Plan with local variables
terraform plan -var-file="terraform/environments/local.tfvars"

# Apply with local variables
terraform apply -var-file="terraform/environments/local.tfvars"
\`\`\`

### Integration with Node.js / AWS SDK

Update environment variables in `.env`:

\`\`\`bash
# LocalStack development
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1

# Override AWS SDK configuration
S3_ENDPOINT=http://localhost:4566
DYNAMODB_ENDPOINT=http://localhost:4566
\`\`\`

Update `api/data-storage.service.ts`:

\`\`\`typescript
// api/data-storage.service.ts
import { S3Client } from '@aws-sdk/client-s3';

// Local development with LocalStack
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.LOCALSTACK_ENDPOINT || undefined, // Only set for local
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for LocalStack
});
\`\`\`

### Configuration

Create `localstack.yml`:

\`\`\`yaml
# localstack.yml
version: "3.8"

services:
  localstack:
    image: localstack/localstack:latest
    container_name: localstack-dev
    ports:
      - "4566:4566"  # Edge port
      - "4510-4559:4510-4559"  # Service ports
    environment:
      - DEBUG=1
      - SERVICES=s3,dynamodb,sqs,sns,lambda,apigateway,cloudwatch,iam,secretsmanager
      - DOCKER_HOST=unix:///var/run/docker.sock
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - "./localstack-data:/tmp/localstack/data"
      - "/var/run/docker.sock:/var/run/docker.sock"
\`\`\`

Start with Docker Compose:

\`\`\`bash
docker-compose -f localstack.yml up -d
\`\`\`

### Limitations

- ⚠️ Not all AWS services are fully supported
- ⚠️ Some features are Pro-only (e.g., advanced RDS, ElastiCache)
- ⚠️ Performance differences from real AWS
- ⚠️ No actual AWS costs (but no real services)
- ⚠️ Some AWS-specific features may not work

### Best Practices

1. **Use docker-compose:** Start LocalStack with Docker Compose for easy management
2. **Version Consistency:** Match LocalStack version with AWS SDK version
3. **Environment Isolation:** Use different LocalStack instances for different environments
4. **Testing Strategy:** Test locally first, then validate on AWS staging
5. **State Management:** Reset LocalStack state between test runs
6. **Secrets Management:** Use `.env` for local, AWS Secrets Manager for production

---

## Combined Development Workflow

### Prerequisites

\`\`\`bash
# Install Docker
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/engine/install/

# Install act
brew install act

# Install LocalStack
brew install localstack/tap/localstack-cli

# Install awslocal
pip3 install awscli-local
\`\`\`

### Daily Development

#### Step 1: Start Local Development Environment

\`\`\`bash
# Terminal 1: Start LocalStack
localstack start

# Terminal 2: Start application services
docker-compose up -d postgres redis

# Terminal 3: Start application
cd api && npm start
\`\`\`

#### Step 2: Test Changes Locally

\`\`\`bash
# Run tests
npm test

# Run workflows locally
act -j test

# Test Terraform changes locally
terraform plan -var-file="terraform/environments/local.tfvars"
terraform apply -var-file="terraform/environments/local.tfvars"
\`\`\`

#### Step 3: Verify Before Push

\`\`\`bash
# Run all workflows
act

# Run tests
npm test

# Check Terraform
terraform validate
terraform plan -var-file="terraform/environments/local.tfvars"
\`\`\`

#### Step 4: Push to GitHub (Only after local verification)

\`\`\`bash
# Add, commit, push
git add .
git commit -m "feat: add new feature"
git push origin feature-branch

# GitHub Actions will run as final verification
\`\`\`

---

## CI/CD Integration

### GitHub Actions with act

Update `.github/workflows/ci.yml`:

\`\`\`yaml
name: CI

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run lint
        run: npm run lint

      - name: Run build
        run: npm run build
\`\`\`

Test locally with act:

\`\`\`bash
# Run all jobs
act

# Run specific job
act -j test

# Run with secrets
act -s GITHUB_TOKEN=$(gh auth token)
\`\`\`

### Terraform with LocalStack

Create `terraform/environments/development/main.tf`:

\`\`\`hcl
# Use LocalStack provider
provider "aws" {
  region = "us-east-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    s3       = "http://localhost:4566"
    dynamodb  = "http://localhost:4566"
    sqs       = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check = true
}

# Import VPC module
module "vpc" {
  source = "../../modules/vpc"
  vpc_cidr = var.vpc_cidr
  availability_zones = var.availability_zones
}

# Import S3 module
module "s3" {
  source = "../../modules/s3"
  bucket_name = "${var.project_name}-dev"
}
\`\`\`

Deploy locally:

\`\`\`bash
# Ensure LocalStack is running
localstack start

# Deploy to LocalStack
cd terraform/environments/development
terraform init
terraform apply -auto-approve

# Verify resources
awslocal s3 ls
awslocal dynamodb list-tables
\`\`\`

Deploy to production (when ready):

\`\`\`bash
# Ensure LocalStack is stopped or use different AWS credentials
cd terraform/environments/production
terraform init
terraform apply -auto-approve
\`\`\`

---

## Troubleshooting

### act Issues

#### "act: command not found"
\`\`\`bash
# Ensure act is in PATH
echo $PATH

# Or use full path
/Users/your-user/.local/bin/act -l
\`\`\`

#### Docker daemon not running
\`\`\`bash
# Start Docker Desktop
open -a Docker

# Or start Docker service
sudo systemctl start docker
\`\`\`

#### Secrets not available
\`\`\`bash
# Use .actrc for secrets
cat .actrc

# Or pass with -s flag
act -s GITHUB_TOKEN=$GITHUB_TOKEN
\`\`\`

### LocalStack Issues

#### "Connection refused" errors
\`\`\`bash
# Check LocalStack status
localstack status

# Check if Docker is running
docker ps

# Restart LocalStack
localstack stop
localstack start
\`\`\`

#### Service not available
\`\`\`bash
# Check available services
curl http://localhost:4566/health

# Check LocalStack logs
localstack logs

# Verify service is enabled
localstack status services
\`\`\`

#### AWS SDK connection errors
\`\`\`bash
# Verify endpoint is correct
echo $LOCALSTACK_ENDPOINT

# Test endpoint directly
curl http://localhost:4566

# Check credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
\`\`\`

### Terraform Issues

#### State lock errors
\`\`\`bash
# Release state lock
terraform force-unlock <lock-id>

# Or reset state
terraform state list
terraform state rm <resource>
\`\`\`

#### Provider mismatch
\`\`\`bash
# Ensure correct provider
cat terraform/provider.tf

# Reinitialize
terraform init -upgrade=true
\`\`\`

---

## Performance Tips

### act Performance

\`\`\`bash
# Use platform-specific images for faster execution
act -P ubuntu-latest=node:16-buster-slim

# Bind mount Docker socket for faster builds
act --container-socket-path /var/run/docker.sock

# Use local action cache
act --cache
\`\`\`

### LocalStack Performance

\`\`\`yaml
# Enable LocalStack volume caching
services:
  localstack:
    volumes:
      - "./localstack-data:/tmp/localstack/data"

# Disable DEBUG in production
environment:
  - DEBUG=0

# Use specific services only
environment:
  - SERVICES=s3,dynamodb,sqs
\`\`\`

---

## Migration Checklist

### From AWS Development to LocalStack

- [ ] Install LocalStack CLI
- [ ] Update Terraform provider configuration
- [ ] Create local environment variables (.env)
- [ ] Test S3 operations with awslocal
- [ ] Test DynamoDB operations
- [ ] Test SQS/SNS operations
- [ ] Verify Lambda function execution (if applicable)
- [ ] Update CI/CD to use localstack for development
- [ ] Document any service limitations
- [ ] Train team on local development workflow

### From GitHub Actions to act

- [ ] Install act
- [ ] Create `.actrc` configuration
- [ ] Test all workflows locally
- [ ] Update documentation with act usage
- [ ] Configure CI/CD to run act for local PR checks
- [ ] Verify secrets management locally
- [ ] Test with different runner images
- [ ] Document any workflow limitations
- [ ] Train team on local testing workflow

---

## Cost Comparison

### Development Workflow Costs

| Activity | Original (With AWS/GitHub) | Local (With act/LocalStack) |
|-----------|------------------------------|------------------------------|
| CI/CD Runs | $50-100/month | $0 |
| AWS Resources | $350/month (dev) | $0 |
| Testing Iterations | $0.10 per workflow run | $0 |
| Resource Provisioning | Minutes per deployment | Seconds (Docker) |
| Total Monthly | **$400-450** | **$0** |

### Production Deployment Costs

| Environment | Cost | Frequency |
|-------------|-------|----------|
| Development (local) | $0 | Daily |
| Staging (AWS) | $1,421/month | Weekly |
| Production (AWS) | $3,101/month | Monthly |
| **Total** | **$4,522/month** | **$1,421/month** (63% savings) |

---

## Best Practices Summary

### Development Workflow

1. **Always Test Locally First:**
   - Run `act` before pushing
   - Deploy to LocalStack before AWS
   - Fix issues locally (faster iteration)

2. **Use Environment Variables:**
   - Separate configs for dev/staging/production
   - Never commit secrets
   - Use `.env` for local development

3. **Docker Compose for Orchestration:**
   - Single command to start all services
   - Reproducible environments
   - Easy cleanup

4. **Automate Verification:**
   - Pre-commit hooks to run tests
   - Pre-push hooks to run workflows
   - CI as final gatekeeper

### Production Deployment

1. **Staging on AWS:** Use staging environment for final validation
2. **Canary Deployments:** Gradual rollout to production
3. **Rollback Plan:** Always have rollback strategy ready
4. **Monitoring:** Set up alerts for production issues
5. **Documentation:** Document all deployment procedures

---

## Resources

- **act:** https://github.com/nektos/act
- **act Documentation:** https://nektosact.com
- **LocalStack:** https://github.com/localstack/localstack
- **LocalStack Documentation:** https://docs.localstack.cloud
- **awslocal CLI:** https://github.com/localstack/awscli-local
- **Docker:** https://docs.docker.com

---

**Next Steps:**
1. Install act and LocalStack
2. Configure local development environment
3. Update existing workflows to support local testing
4. Migrate Terraform configurations
5. Train team on new workflow
6. Monitor cost savings
