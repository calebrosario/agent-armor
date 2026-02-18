# AWS Setup Plan

## Overview

This document outlines the current AWS integration status and future plans for adding AWS services to the Healthcare Auditor system.

## Current State (February 2026)

### What's Configured

**LocalStack Setup** (for local development):
- ✅ `docker-compose.localstack.yml` - LocalStack container configuration
- ✅ S3 bucket: `healthcare-auditor-uploads` (file storage)
- ✅ DynamoDB table: `healthcare-auditor-logs` (audit logging)
- ✅ Automatic initialization via `.awsinit/` scripts
- ✅ Environment variables configured in `.github/workflows/.env.local`

### What's NOT Implemented

**No AWS Integration** in production code:
- ❌ No AWS SDK usage (boto3, @aws-sdk/*)
- ❌ No S3 file uploads/downloads
- ❌ No DynamoDB read/write operations
- ❌ No Terraform or CloudFormation IaC
- ❌ No actual AWS infrastructure deployment

### Current Stack

The application currently uses:
- PostgreSQL - Primary database (bills, providers, users, etc.)
- Neo4j - Knowledge graph (provider networks, relationships)
- Redis - Caching and task queue
- Kubernetes - Deployment orchestration

---

## Future AWS Integration Scenarios

### Scenario A: Document Storage (S3)

**Use Case**: Store uploaded documents (PDFs, images, medical records) securely.

**Implementation Approach**:

1. **Backend Changes** (`backend/requirements.txt`):
   ```txt
   boto3==1.34.0
   botocore==1.34.0
   ```

2. **S3 Client Service** (`backend/app/services/s3_service.py`):
   ```python
   import boto3
   from botocore.exceptions import ClientError
   from typing import Optional
   import os

   class S3Service:
       def __init__(self):
           self.s3_client = boto3.client(
               's3',
               endpoint_url=os.getenv('AWS_ENDPOINT_URL'),
               aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
               aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
               region_name=os.getenv('AWS_REGION', 'us-east-1')
           )
           self.bucket_name = os.getenv('S3_BUCKET_NAME')

       async def upload_file(self, file_path: str, object_key: str) -> bool:
           # Implementation
           pass

       async def download_file(self, object_key: str, dest_path: str) -> bool:
           # Implementation
           pass

       async def generate_presigned_url(self, object_key: str, expires_in: int = 3600) -> Optional[str]:
           # Implementation
           pass
   ```

3. **Security Considerations**:
   - HIPAA compliance: Encrypt data at rest (S3 SSE-S3 or SSE-KMS)
   - Encrypt data in transit (HTTPS/TLS)
   - Implement bucket policies for access control
   - Enable S3 versioning for audit trails
   - Use IAM roles instead of access keys in production

4. **Environment Variables**:
   ```env
   AWS_ENDPOINT_URL=https://s3.amazonaws.com  # Production
   AWS_ACCESS_KEY_ID=<from-iam-role-or-secrets-manager>
   AWS_SECRET_ACCESS_KEY=<from-iam-role-or-secrets-manager>
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=healthcare-auditor-documents-prod
   ```

---

### Scenario B: Audit Logging (DynamoDB)

**Use Case**: Immutable audit trail for compliance and forensic analysis.

**Implementation Approach**:

1. **Backend Changes** (`backend/app/services/audit_logger.py`):
   ```python
   import boto3
   from datetime import datetime
   from typing import Dict, Any

   class AuditLogger:
       def __init__(self):
           self.dynamodb = boto3.resource('dynamodb', ...)
           self.table = self.dynamodb.Table(os.getenv('DYNAMODB_TABLE'))

       async def log_event(self, event_type: str, entity_id: str, data: Dict[str, Any]) -> None:
           item = {
               'id': f"{entity_id}#{datetime.utcnow().isoformat()}",
               'timestamp': datetime.utcnow().isoformat(),
               'entity_type': event_type,
               'entity_id': entity_id,
               'data': data,
               'created_at': datetime.utcnow().isoformat()
           }
           self.table.put_item(Item=item)
   ```

2. **Audit Event Types**:
   - `bill_validated` - When a bill is validated
   - `fraud_detected` - When fraud is flagged
   - `user_login` - User authentication events
   - `data_access` - Sensitive data access
   - `configuration_change` - System configuration updates

3. **Security Considerations**:
   - Enable DynamoDB Point-in-Time Recovery (PITR)
   - Use AWS KMS for encryption at rest
   - Implement fine-grained IAM policies (least privilege)
   - Set up DynamoDB Streams for real-time monitoring
   - Configure TTL for old audit records (compliance requirements)

---

### Scenario C: Infrastructure as Code (Terraform)

**Use Case**: Declarative AWS infrastructure for production deployments.

**Directory Structure**:
```
infrastructure/
├── terraform/
│   ├── main.tf                 # Root configuration
│   ├── variables.tf            # Variable definitions
│   ├── outputs.tf              # Output definitions
│   ├── modules/
│   │   ├── s3/                 # S3 bucket module
│   │   ├── dynamodb/           # DynamoDB table module
│   │   ├── iam/                # IAM roles and policies
│   │   └── security/           # Security groups, KMS keys
│   ├── environments/
│   │   ├── dev/                # Dev environment
│   │   ├── staging/            # Staging environment
│   │   └── prod/               # Production environment
│   └── backend.tfstate         # Backend state storage (S3 + DynamoDB)
```

**Terraform Module Example** (`infrastructure/terraform/modules/s3/main.tf`):
```hcl
resource "aws_s3_bucket" "documents" {
  bucket_prefix = var.bucket_prefix

  tags = {
    Name        = "${var.project_name}-documents"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

**Production Deployment Flow**:
```bash
cd infrastructure/terraform/environments/prod

# Initialize Terraform
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy (only for non-prod)
terraform destroy
```

---

### Scenario D: CI/CD with AWS

**Use Case**: Automate deployment to AWS infrastructure.

**Updates to `.github/workflows/ci-cd.yml`**:

```yaml
# Add AWS authentication step
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-region: us-east-1
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole

# Add Terraform validation
- name: Terraform fmt check
  run: |
    terraform fmt -check
  working-directory: infrastructure/terraform

- name: Terraform validate
  run: |
    terraform init -backend=false
    terraform validate
  working-directory: infrastructure/terraform

# Add security scanning
- name: Trivy filesystem scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: 'backend'
    severity: 'CRITICAL,HIGH'

# Add infrastructure deployment (for staging only)
- name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  run: |
    cd infrastructure/terraform/environments/staging
    terraform init
    terraform apply -auto-approve
```

---

## Security & Compliance Checklist

### HIPAA Requirements

- [ ] Data encryption at rest (S3 SSE, DynamoDB KMS)
- [ ] Data encryption in transit (TLS 1.2+)
- [ ] Access controls (IAM roles, least privilege)
- [ ] Audit logging (CloudTrail, DynamoDB Streams)
- [ ] Business Associate Agreement (BAA) with AWS
- [ ] Data retention policies (S3 lifecycle, DynamoDB TTL)
- [ ] Regular security assessments
- [ ] Incident response procedures

### AWS Best Practices

- [ ] Use AWS Organizations for multi-account isolation
- [ ] Implement AWS Control Tower for governance
- [ ] Enable AWS Security Hub for centralized security monitoring
- [ ] Use AWS GuardDuty for threat detection
- [ ] Enable AWS Config for compliance monitoring
- [ ] Implement S3 Bucket Policies for access control
- [ ] Use AWS KMS for key management
- [ ] Enable CloudWatch Logs and Metrics
- [ ] Set up AWS Budgets and Cost Anomaly Detection
- [ ] Use AWS Secrets Manager (not environment variables) for sensitive data

### Cost Optimization

- [ ] Use S3 Intelligent Tiering for cost-effective storage
- [ ] Enable DynamoDB On-Demand for unpredictable workloads
- [ ] Use AWS Cost Explorer for cost analysis
- [ ] Implement tagging strategy for cost allocation
- [ ] Set up budgets and alerts
- [ ] Use AWS Compute Optimizer for resource sizing

---

## Migration Path

### Phase 1: Local Development (Current)
- ✅ LocalStack configured
- ✅ S3 and DynamoDB resources defined
- ✅ Initialization scripts in place

### Phase 2: Proof of Concept
- Add boto3 dependency
- Implement S3 upload/download in dev environment
- Implement DynamoDB audit logging in dev environment
- Test with LocalStack

### Phase 3: Staging Environment
- Set up staging AWS account
- Create Terraform infrastructure code
- Deploy to staging AWS account
- Run integration tests against real AWS
- Validate security and compliance

### Phase 4: Production Environment
- Set up production AWS account
- Implement full IAM roles and policies
- Enable AWS GuardDuty and Security Hub
- Configure monitoring and alerting
- Deploy to production
- Conduct penetration testing
- Go-live with monitoring in place

---

## References

### AWS Documentation
- [AWS HIPAA Compliance](https://aws.amazon.com/compliance/hipaa/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### Project Resources
- LocalStack config: `docker-compose.localstack.yml`
- Initialization scripts: `.awsinit/`
- Environment template: `.github/workflows/.env.local`
- README section: README.md (LocalStack Development)

---

## Next Steps

**Immediate** (if planning AWS integration):
1. Review and approve this plan with stakeholders
2. Identify specific AWS services needed for use cases
3. Set up development AWS account for testing
4. Begin Phase 2 (Proof of Concept) with one service (e.g., S3 for file storage)

**Long-term**:
1. Hire or train team members on AWS security best practices
2. Conduct HIPAA compliance review with legal counsel
3. Set up AWS Organizations for multi-account strategy
4. Implement full Infrastructure as Code with Terraform
5. Configure comprehensive monitoring and alerting

---

**Last Updated**: February 14, 2026
**Status**: Planning Phase - No AWS services currently implemented
