# Production Deployment Guide

This guide covers deploying the Medical Research Platform to production.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 13+ database
- Redis 7+ for job queue
- Ethereum node for blockchain (optional - can use RPC providers)
- AWS S3 bucket (if using S3 storage)
- Domain name configured with DNS
- SSL/TLS certificates

## Environment Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_USER=medical_research
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=medical_research

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Application
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_min_32_chars

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
IDENTITY_NFT_ADDRESS=0xYourDeployedContractAddress
DATA_ACCESS_MANAGER_ADDRESS=0xYourDeployedContractAddress

# Storage (choose one)
STORAGE_TYPE=s3  # Options: s3, local

# AWS S3 (if using S3)
S3_REGION=us-east-1
S3_BUCKET=medical-research-production
S3_ACCESS_KEY_ID=your_aws_access_key
S3_SECRET_ACCESS_KEY=your_aws_secret_key

# Logging
LOG_LEVEL=info
```

## Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f workers
```

## Services

### PostgreSQL
- Host: `postgres:5432`
- Database: `medical_research`
- User: `medical_research`
- Password: Set via `POSTGRES_PASSWORD`
- Data persistence: Docker volume `postgres_data`

### Redis
- Host: `redis:6379`
- Password protection: Set via `REDIS_PASSWORD`
- Persistence: Docker volume `redis_data`

### API Server
- Port: `3000`
- Health check: `/api/health`
- Logs: Mounted to `./api/logs`
- Storage: Mounted to `./api/storage`
- Auto-restart on failure

### Workers
- Processes: Consent, Legal Form, Data Store queues
- Logs: Mounted to `./api/logs`
- Auto-restart on failure

### Blockchain Node
- Port: `8545` (JSON-RPC), `8546` (WebSocket)
- CORS enabled for external access
- Chain data: Docker volume `blockchain_data`

## Deployment Steps

### 1. Deploy Smart Contracts

If not yet deployed:

```bash
# Deploy to Sepolia testnet first
cd contracts
npx hardhat ignition deploy --network sepolia ignition/modules/DeployAll.ts

# Update .env with deployed addresses
IDENTITY_NFT_ADDRESS=0xDeployedAddress
DATA_ACCESS_MANAGER_ADDRESS=0xDeployedAddress
```

### 2. Configure DNS

Point your domain's A record to your server's IP address.

### 3. Set up SSL/TLS

Use Let's Encrypt or your SSL certificate:

```bash
# Example with Certbot
sudo certbot certonly --standalone -d yourdomain.com
```

Update `Dockerfile` to include SSL certificates.

### 4. Configure S3 Storage

If using S3:

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket medical-research-production \
  --region us-east-1

# Set up CORS policy
aws s3api put-bucket-cors \
  --bucket medical-research-production \
  --cors-configuration \
  '{
    "CORSRules": [{
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

### 5. Deploy Application

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check service health
curl http://localhost:3000/api/health

# Verify workers are running
docker-compose ps workers
```

### 6. Configure Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /workers {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## Health Checks

### API Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected",
  "workers": "running"
}
```

### Worker Health Check

Access worker monitoring via API:

```bash
curl http://localhost:3000/api/workers/health
```

## Monitoring

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f workers
docker-compose logs -f postgres
docker-compose logs -f redis

# Follow logs
docker-compose logs -f api --tail 100 -f
```

### Log Files

- **API logs**: `./api/logs/combined-YYYY-MM-DD.log`
- **Worker logs**: `./api/logs/worker-YYYY-MM-DD.log`
- **HTTP logs**: `./api/logs/http-YYYY-MM-DD.log`
- **Error logs**: `./api/logs/error-YYYY-MM-DD.log`
- **Database logs**: `./api/logs/database-YYYY-MM-DD.log`
- **Blockchain logs**: `./api/logs/blockchain-YYYY-MM-DD.log`

Logs are rotated automatically:
- Daily rotation for combined/error logs
- 30-day retention for all logs
- Automatic compression of old logs

## Scaling

### Horizontal Scaling (API)

```bash
# Scale API to 3 instances
docker-compose up -d --scale api=3

# Use load balancer to distribute traffic
```

### Worker Scaling

Workers are horizontally scalable. Add more worker containers:

```yaml
# In docker-compose.yml
services:
  workers:
    deploy:
      replicas: 3
```

## Database Maintenance

### Backup Database

```bash
# Create backup
docker exec -it medical-research-postgres pg_dump \
  -U medical_research \
  medical_research > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20240115.sql | docker exec -i medical-research-postgres psql \
  -U medical_research \
  medical_research
```

### Migrations

When modifying database schema:

1. Create migration file in `database/migrations/`
2. Test migration on development database
3. Apply to production using:
   ```bash
   docker exec -it medical-research-postgres psql \
     -U medical_research \
     -d medical_research \
     -f migration.sql
   ```

## Security Checklist

### Critical Security Features (COMPLETED ✅)
- [x] **Security Headers**: Helmet middleware with CSP, HSTS (1 year), frameguard, noSniff
- [x] **CSRF Protection**: csrf-csrf middleware with /api/csrf-token endpoint
- [x] **Session Timeout**: 15-minute idle timeout + 8-hour absolute timeout (HIPAA compliant)
- [x] **Smart Contract Reentrancy Protection**: CEI pattern applied (state before external calls)
- [x] **PII Masking in Audit Logs**: Automatic redaction of sensitive fields
- [x] **TypeScript Compilation Fixed**: Resolved blocking errors in compliance and HL7 services

### Production Security Requirements
- [ ] Strong, unique database passwords
- [ ] JWT secret is > 32 characters and stored securely (currently in .env, plan SEC-001 for AWS KMS)
- [x] SSL/TLS enabled (via HTTPS)
- [ ] Firewall configured (only ports 80, 443, 22)
- [ ] Rate limiting enabled on API endpoints (partially implemented)
- [ ] IP whitelisting configured for admin access
- [ ] S3 bucket has appropriate permissions
- [ ] Environment variables are not committed to git (.gitignore configured)
- [ ] PostgreSQL allows only connections from application network
- [ ] Redis requires password for remote access
- [x] Logs are regularly rotated (Winston daily rotation configured)
- [ ] Blockchain RPC endpoint uses HTTPS
- [ ] Smart contract addresses are verified
- [ ] Regular security audits scheduled

### Additional Security Recommendations
- [ ] **AWS Secrets Manager Integration**: Replace .env JWT secrets with KMS-backed secrets (SEC-001)
- [ ] **BAA Workflow Automation**: Business Associate Agreement tracking and renewal
- [ ] **Automated Breach Notification**: 60-day notification to affected individuals
- [ ] **Data Protection Impact Assessment (DPIA)**: GDPR Article 35 requirement
- [ ] **Incident Response Plan**: Formal IR team and procedures
- [ ] **SIEM Integration**: Forward logs to Security Information and Event Management system
- [ ] **Multi-Factor Authentication**: Add MFA for admin and researcher accounts
- [ ] **Penetration Testing**: Regular third-party security assessments

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker-compose ps

# View logs for errors
docker-compose logs

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Test database connection
docker exec -it medical-research-api node -e \
  "const { Client } = require('pg'); \
   const client = new Client({ connectionString: process.env.DATABASE_URL }); \
   await client.connect(); \
   console.log('Database connected');"

# Check database is accepting connections
docker exec -it medical-research-postgres psql \
  -U medical_research \
  -d medical_research \
  -c "SELECT 1"
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs workers | grep "Error"

# Check Redis connection
docker exec -it medical-research-redis redis-cli PING

# Restart workers
docker-compose restart workers
```

## Production Backup Strategy

### Daily Backups

1. **Database**: Automated via cron job
2. **S3 Storage**: S3 versioning enabled
3. **Logs**: S3 or separate backup location

### Disaster Recovery

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: < 1 hour data loss
3. **Backup frequency**: Daily at 2:00 AM UTC
4. **Off-site backups**: S3 or separate region

## Performance Tuning

### Database Optimization

```sql
-- Add these indexes to database
CREATE INDEX idx_consents_user_id ON consents(user_id);
CREATE INDEX idx_consents_status ON consents(status);
CREATE INDEX idx_consents_created_at ON consents(created_at DESC);
```

### API Response Time

- Target: < 200ms for p95 requests
- Monitor with APM (Application Performance Monitoring)
- Enable HTTP caching for static assets

### Worker Optimization

- Process 100 jobs per queue before checking for new work
- Increase concurrency based on queue length
- Implement job priorities for critical tasks

## Rollback Procedure

### Rollback Checklist

1. Stop all services: `docker-compose down`
2. Restore database from last backup
3. Revert to previous Docker images
4. Update environment to previous configuration
5. Restart services: `docker-compose up -d`
6. Verify all health checks pass

## Support

### Contact Points

- **Technical Issues**: DevOps team
- **Security Incidents**: Security team
- **Database Issues**: DBA team
- **Application Bugs**: Development team

### Escalation

1. P0 (Critical): Immediate escalation, 15-minute response time
2. P1 (High): Escalation within 1 hour
3. P2 (Medium): Escalation within 4 hours
4. P3 (Low): Escalation within 24 hours

## CI/CD

Set up automated deployments using GitHub Actions, GitLab CI, or similar.

### Example GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker-compose pull
            docker-compose up -d
            docker-compose exec api npm run migrate
```

## Documentation

- [API Documentation](./api/README.md)
- [Worker Documentation](./api/workers/README.md)
- [Blockchain Integration](./docs/Phase3-BlockchainIntegration.md)
- [Database Schema](./database/schema.sql)
