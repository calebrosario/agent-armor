# GitHub Secrets Configuration

This document lists all GitHub Secrets required for the Digital Asset Management Platform CI/CD pipelines.

## ⚠️ Security Warning

- **NEVER commit secrets to the repository**
- **NEVER expose secrets in logs or error messages**
- **Rotate secrets regularly** (recommended: quarterly)
- **Use different secrets for different environments** (dev, staging, production)
- **Grant minimum permissions** to each secret

---

## Required Secrets by Phase

### Phase 1: Core Validation & Infrastructure

#### Infrastructure Secrets

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for Terraform | Infrastructure deployment, LocalStack tests | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for Terraform | Infrastructure deployment, LocalStack tests | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for resources | Infrastructure deployment | `us-east-1` |
| `DB_PASSWORD` | PostgreSQL master password | Terraform RDS configuration | `SecurePassword123!` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | DNS management | `d41d8cd98f00b204e9800998ecf8427e` |
| `CLOUDFLARE_EMAIL` | Cloudflare account email | DNS management | `admin@example.com` |

---

### Phase 2: Smart Contract Deployment

#### Blockchain Secrets

 | Secret Name | Description | Required For | Example Value |
 |---------------|-------------|----------------|----------------|
 | `POLYGON_AMOY_RPC_URL` | Amoy testnet RPC endpoint | Contract deployment to testnet (recommended) | `https://rpc-amoy.polygon.technology/` |
 | `POLYGONSCAN_AMOY_API_KEY` | PolygonScan Amoy API key | Contract verification on testnet (recommended) | `ABCDEFGHIJKLMNOPQRSTUVWXYZ123456` |
 | `POLYGON_MUMBAI_RPC_URL` | ⚠️ Mumbai testnet RPC endpoint (deprecated) | Contract deployment to testnet (use Amoy) | `https://rpc-mumbai.maticvigil.com` |
 | `POLYGONSCAN_MUMBAI_API_KEY` | ⚠️ PolygonScan Mumbai API key (deprecated) | Contract verification on testnet (use Amoy) | `ABCDEFGHIJKLMNOPQRSTUVWXYZ123456` |
 | `POLYGON_RPC_URL` | Polygon mainnet RPC endpoint | Contract deployment to mainnet | `https://rpc-mainnet.maticvigil.com` |
 | `POLYGONSCAN_API_KEY` | PolygonScan API key for mainnet | Contract verification on mainnet | `QRSTUVWXYZ7890123456` |
 | `DEPLOYER_PRIVATE_KEY` | Private key for contract deployment | Contract deployment | `0x1234567890abcdef1234567890abcdef1234567890abcdef12` |

#### Web3 Authentication

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `WEB3AUTH_CLIENT_ID` | Web3Auth client ID | Wallet authentication in frontend | `BPi5eKz7... (full client ID from dashboard)` |

---

### Phase 3: Application CI/CD

#### Backend API Secrets

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `PRODUCTION_API_URL` | Production API endpoint | Frontend configuration, deployment | `https://api.digitalasset.com` |
| `STAGING_API_URL` | Staging API endpoint | Frontend configuration, staging deployment | `https://api-staging.digitalasset.com` |
| `JWT_SECRET` | JWT signing secret | Authentication, token generation | `super-secret-jwt-key-at-least-32-characters` |

#### OAuth Secrets

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google sign-in | `123456789-abcdef.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google sign-in | `GOCSPX-abcdef123456` |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth app ID | Facebook sign-in | `123456789012345` |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret | Facebook sign-in | `abcdef1234567890abcdef` |
| `APPLE_CLIENT_ID` | Apple Sign In client ID | Apple sign-in | `com.example.app.signin` |
| `APPLE_TEAM_ID` | Apple Developer Team ID | Apple sign-in | `ABCDEFGHIJK` |
| `APPLE_KEY_ID` | Apple Sign In Key ID | Apple sign-in | `XYZ1234567` |
| `APPLE_PRIVATE_KEY` | Apple Sign In private key (p8 file) | Apple sign-in | (Content of .p8 file) |

---

### Phase 4: Production Deployment

#### Deployment Platform Secrets

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `VERCEL_TOKEN` | Vercel deployment token | Frontend deployment to Vercel | `vercel_token_abcdefghijklmnopqrstuvwxyz123456` |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel deployment | `team_abc123def456` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel deployment | `prj_abc123def456ghi789` |
| `RENDER_SERVICE_ID` | Render service ID | Backend deployment to Render | `srv-abc123def456` |
| `RENDER_API_KEY` | Render API key | Backend deployment to Render | `rnd_abc123def456ghi789jkl` |

#### Monitoring & Notification Secrets

| Secret Name | Description | Required For | Example Value |
|---------------|-------------|----------------|----------------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | Deployment notifications | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXX` |

---

## Setting GitHub Secrets

### Method 1: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI (if not already installed)
brew install gh

# Login to GitHub
gh auth login

# Navigate to your repository
cd /path/to/digital-asset-management

# Add secrets using gh CLI
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set AWS_REGION
gh secret set DB_PASSWORD
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_EMAIL
gh secret set POLYGON_MUMBAI_RPC_URL
gh secret set POLYGONSCAN_MUMBAI_API_KEY
gh secret set POLYGON_RPC_URL
gh secret set POLYGONSCAN_API_KEY
gh secret set DEPLOYER_PRIVATE_KEY
gh secret set WEB3AUTH_CLIENT_ID
gh secret set PRODUCTION_API_URL
gh secret set STAGING_API_URL
gh secret set JWT_SECRET
gh secret set GOOGLE_CLIENT_ID
gh secret set GOOGLE_CLIENT_SECRET
gh secret set FACEBOOK_CLIENT_ID
gh secret set FACEBOOK_CLIENT_SECRET
gh secret set APPLE_CLIENT_ID
gh secret set APPLE_TEAM_ID
gh secret set APPLE_KEY_ID
gh secret set APPLE_PRIVATE_KEY
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set RENDER_SERVICE_ID
gh secret set RENDER_API_KEY
gh secret set SLACK_WEBHOOK_URL
```

### Method 2: Using GitHub Web UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**
6. Repeat for all required secrets

---

## Secret Rotation Strategy

### Recommended Rotation Schedule

| Secret Type | Rotation Frequency | Notes |
|-------------|-------------------|-------|
| Infrastructure secrets (AWS) | Quarterly | Rotate AWS credentials regularly |
| OAuth secrets | Quarterly | OAuth providers recommend rotation every 90 days |
| JWT_SECRET | Quarterly | Rotate JWT signing keys regularly |
| Deployment tokens | Annually | Vercel and Render tokens can be long-lived |
| Private keys | On compromise | Rotate immediately if leaked |

### How to Rotate Secrets

1. **Generate new secret value**
2. **Add new secret to GitHub** (don't remove old one yet)
3. **Deploy application** with new secret
4. **Verify application works** with new secret
5. **Remove old secret** from GitHub

---

## Environment-Specific Secrets

### Development Environment

Use these secrets for development and testing:
- `AWS_ACCESS_KEY_ID` (use test credentials or LocalStack)
- `POLYGON_MUMBAI_RPC_URL` (testnet only)
- `POLYGONSCAN_MUMBAI_API_KEY` (testnet only)

### Staging Environment

Use these secrets for staging deployments:
- `STAGING_API_URL` (staging endpoint)
- `POLYGON_MUMBAI_RPC_URL` (testnet for staging)

### Production Environment

Use these secrets for production deployments:
- `PRODUCTION_API_URL` (production endpoint)
- `POLYGON_RPC_URL` (mainnet)
- `POLYGONSCAN_API_KEY` (mainnet)
- `VERCEL_TOKEN` (for frontend deployment)
- `RENDER_API_KEY` (for backend deployment)
- `SLACK_WEBHOOK_URL` (for production notifications)

---

## Troubleshooting

### Secret Not Found in Workflow

**Error**: `secrets.AWS_ACCESS_KEY_ID is not a valid secret name`

**Solution**:
1. Check that secret is spelled correctly (case-sensitive)
2. Verify secret exists in repository Settings → Secrets and variables → Actions
3. Ensure workflow has `contents: read` permission
4. Check that secret name doesn't have spaces or special characters

### Secret Not Loaded in Application

**Error**: Application fails to start, secret-related errors

**Solution**:
1. Verify secret is set in correct environment (dev/staging/prod)
2. Check that secret value is not truncated
3. Ensure application is reading from process.env correctly
4. Review application logs for secret parsing errors

### Secret Exposed in Logs

**Error**: Secret value appears in GitHub Actions logs

**Solution**:
1. **IMMEDIATELY** rotate the exposed secret
2. Add secret to GitHub's secret scanning allowlist if it's a false positive
3. Review workflow logs and add `echo "***SECRET***"` instead of actual values
4. Use `::add-mask::` GitHub Actions command to mask sensitive data

---

## Best Practices

1. **Use environment-specific secrets**: Don't mix dev and production secrets
2. **Document secrets clearly**: Update this document when adding new secrets
3. **Rotate secrets regularly**: Follow the rotation schedule above
4. **Limit secret scope**: Grant minimum permissions for each secret
5. **Monitor for leaks**: Use GitHub secret scanning and Dependabot alerts
6. **Use OIDC for AWS**: When possible, use OpenID Connect instead of hardcoded credentials
7. **Never hardcode secrets**: Always use `${{ secrets.SECRET_NAME }}` in workflows
8. **Test locally with act**: Use dummy secrets for local testing before pushing to GitHub

---

## Related Documentation

- [CI/CD Integration Plan](../.sisyphus/plans/CICD_Integration_Plan.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Web3Auth Documentation](https://web3auth.io/docs)
- [Polygon Documentation](https://docs.polygon.technology/)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-31
**Maintainer**: DevOps Team
