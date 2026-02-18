# Health-Mesh Platform Architecture and Data Flows

**Document Owner:** Chief Technology Officer (CTO)
**Effective Date:** [Date]
**Review Date:** [Date + 6 months]
**Version:** 1.0

---

## Executive Summary

This document provides a comprehensive overview of Health-Mesh Medical Research Platform architecture, including system components, data flows, security controls, and deployment infrastructure. This documentation is essential for SOC 2 CC3.1, ISO 27001 A.8.1, and HIPAA §164.308(a)(1) compliance.

**Platform Overview:**
Health-Mesh is a blockchain-powered medical research platform that enables patients to own, share, and monetize their health data while researchers gain compliant access to valuable datasets.

---

## 1. High-Level Architecture

### 1.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER LAYER (Web/Mobile)                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Patient Portal - control data, set fees, view consents        │  │
│  │ Researcher Marketplace - browse data, purchase access          │  │
│  │ Provider Portal - request patient data access                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                 │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                  API LAYER (Node.js/Express)                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ • Consent API (HIPAA/GDPR/CCPA forms)                    │  │
│  │ • Authentication & Authorization (JWT, Passport)               │  │
│  │ • Enhanced Audit Middleware with Risk Detection                 │  │
│  │ • Risk Event Bus & Rules Engine                             │  │
│  │ • Repository Layer (TypeORM entities)                         │  │
│  │ • Worker Queue (BullMQ) - PDF signing, email, alerts     │  │
│  │ • Compliance Services (HIPAA, GDPR, CCPA)                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                 │
┌───────────────────────────────────────▼─────────────────────────────────────┐
│              BLOCKCHAIN LAYER (Ethereum/EVM)                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ • IdentityNFT (ERC-721) - Patient identity + fee control   │  │
│  │ • DataAccessManager - On-chain access control                  │  │
│  │ • UUPS Upgradeable Proxy Pattern                              │  │
│  │ • Event-based integration with API layer                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interactions

**User Layer → API Layer:**
- Patient Portal: `/api/consents`, `/api/wallet`, `/api/risk-scores`
- Researcher Portal: `/api/data-marketplace`, `/api/data-requests`
- Provider Portal: `/api/provider`, `/api/compliance`
- Authentication: `/api/auth/login`, `/api/auth/register`

**API Layer → Blockchain Layer:**
- Smart Contract Events: Ethereum mainnet events
- Contract Calls: Data access verification, consent validation
- Blockchain State: Patient data ownership, access grants

**API Layer → Database Layer:**
- Patient Data: PostgreSQL RDS
- Consent Records: PostgreSQL RDS
- Audit Logs: PostgreSQL RDS
- Risk Scores: PostgreSQL RDS
- Compliance Metrics: PostgreSQL RDS

**API Layer → External Services:**
- Email: SendGrid, Nodemailer
- SMS: Twilio
- Slack: Webhook notifications
- Storage: AWS S3
- Encryption: AWS KMS

---

## 2. System Components

### 2.1 User Layer (Frontend)

| Component | Technology | Purpose | Security Controls |
|-----------|-------------|---------|------------------|
| **Patient Portal** | React/Next.js | Patient data control, consent management | MFA, CSRF, Session timeout |
| **Researcher Marketplace** | React/Next.js | Dataset discovery, access purchase | MFA, CSRF, Session timeout |
| **Provider Portal** | React/Next.js | Data access requests, verification | MFA, CSRF, Session timeout |
| **Admin Dashboard** | React/Next.js | Platform administration, analytics | MFA, RBAC, Session timeout |

**Security Features:**
- Multi-factor authentication (MFA) for all portals
- Cross-Site Request Forgery (CSRF) protection
- Session management (15-min idle, 8-hr absolute timeout)
- Content Security Policy (CSP) via Helmet
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff (MIME sniffing protection)

### 2.2 API Layer (Backend)

| Component | Technology | Purpose | Security Controls |
|-----------|-------------|---------|------------------|
| **API Server** | Node.js/Express v5.1.0 | Main API server | Rate limiting, JWT auth, Audit middleware |
| **Authentication Service** | Passport JWT | User authentication | Password hashing, JWT signing, Session management |
| **Consent Service** | TypeORM | Consent form management | Input validation, Audit logging |
| **Risk Detection Service** | Risk Events, Rules Engine | Real-time risk assessment | Event-driven, Audit logging |
| **Compliance Service** | HIPAA/GDPR/CCPA checks | Regulatory compliance | Input validation, Audit logging |
| **Alert Service** | BullMQ workers | Multi-channel notifications | Deduplication, Rate limiting, Retry logic |
| **Data Storage Service** | AWS S3 SDK | Document storage | Presigned URLs, Encryption at rest |
| **Audit Middleware** | Winston logger | Structured logging | PII masking, Session tracking |

**Security Features:**
- **Rate Limiting:** Express-rate-limit (token bucket algorithm)
- **Input Validation:** class-validator for all API inputs
- **Audit Logging:** Winston-based structured logging with PII masking
- **Session Management:** 15-min idle timeout, 8-hr absolute timeout
- **CSRF Protection:** csrf-csrf middleware with /api/csrf-token endpoint
- **Security Headers:** Helmet middleware (CSP, HSTS, frameguard, noSniff)

### 2.3 Blockchain Layer (Smart Contracts)

| Component | Technology | Purpose | Security Controls |
|-----------|-------------|---------|------------------|
| **IdentityNFT** | Solidity 0.8.27 | Patient identity NFT | nonReentrant, Access control, CEI pattern |
| **DataAccessManager** | Solidity 0.8.27 | Data access control | nonReentrant, Access control, CEI pattern |
| **Proxy Contracts** | OpenZeppelin | Upgradeable proxies | UUPS pattern, Time locks |

**Security Features:**
- **Reentrancy Protection:** `nonReentrant` modifier on all state-changing functions
- **Checks-Effects-Interactions (CEI) Pattern:** Prevents reentrancy attacks
- **Access Control:** Role-based access control in smart contracts
- **Upgradeable Proxy Pattern:** UUPS proxies for controlled upgrades
- **Time Locks:** Delay in contract upgrades for security review
- **Event Logging:** All state changes emit events for API layer integration

### 2.4 Data Layer (Databases)

| Component | Technology | Purpose | Security Controls |
|-----------|-------------|---------|------------------|
| **PostgreSQL RDS** | PostgreSQL 13.7 | Primary database | AES-256 encryption, Prepared statements |
| **TypeORM** | TypeORM 0.3.28 | ORM framework | SQL injection prevention, Input validation |
| **Redis (ElastiCache)** | Redis | Cache and session store | AUTH encryption, TLS |

**Security Features:**
- **Encryption at Rest:** AES-256 encryption for PostgreSQL RDS
- **SQL Injection Prevention:** Prepared statements via TypeORM
- **Input Validation:** TypeORM entity validation
- **Database Access:** Role-based database access control
- **Encryption in Transit:** TLS 1.3 for all database connections
- **Backup Encryption:** Encrypted backups stored in S3 Glacier

### 2.5 Infrastructure Layer (Cloud)

| Component | AWS Service | Purpose | Security Controls |
|-----------|--------------|---------|------------------|
| **EKS Cluster** | EKS | Container orchestration | VPC segmentation, Security groups |
| **RDS PostgreSQL** | RDS | Primary database | Encryption, Multi-AZ, Automated backups |
| **ElastiCache** | ElastiCache | Redis cache | AUTH encryption, TLS |
| **S3 Storage** | S3 | Document storage | SSE-S3 encryption, Bucket policies |
| **KMS** | KMS | Encryption key management | Key rotation, IAM policies |
| **CloudFront** | CloudFront | CDN | HTTPS, WAF integration |
| **WAF** | WAF | Web application firewall | Rules-based blocking |
| **CloudTrail** | CloudTrail | Audit logging | 7-year log retention |
| **Secrets Manager** | Secrets Manager | Secret storage | Encryption, IAM policies |

**Security Features:**
- **VPC Segmentation:** Network segmentation by environment (dev/staging/prod)
- **Security Groups:** Whitelist-only access to resources
- **Encryption at Rest:** AES-256 for RDS, SSE-S3 for S3
- **Encryption in Transit:** TLS 1.3 for all AWS services
- **Key Management:** AWS KMS for encryption key management with annual rotation
- **No Environment Variables:** Secrets stored in AWS Secrets Manager
- **Audit Logging:** AWS CloudTrail for all API calls

---

## 3. Data Flows

### 3.1 Patient Onboarding Flow

```
1. Patient Registration
   ↓ (POST /api/auth/register)
   Input: Name, email, password
   Validation: Email format, password complexity
   Storage: User entity in PostgreSQL
   Security: Password hashing (bcrypt), Email verification

2. Create IdentityNFT
   ↓ (POST /api/wallet/create)
   Input: Patient metadata, fee preferences
   Smart Contract Call: IdentityNFT.mint()
   Event: IdentityNFT.Transfer (minting event)
   Storage: Blockchain event logged in PostgreSQL
   Security: Wallet signature verification

3. Complete Consent Forms
   ↓ (POST /api/consents/{formId}/complete)
   Input: Consent form responses
   Validation: Required fields, data format
   Storage: Consent entity in PostgreSQL
   Security: Audit logging of consent completion

4. Upload Medical Records
   ↓ (POST /api/documents/upload)
   Input: Medical documents (PDF, DICOM)
   Storage: S3 (presigned URL)
   Security: File type validation, virus scanning, encryption at rest

5. Risk Assessment
   ↓ (Risk Events Service)
   Triggers: New patient data, consent changes
   Assessment: HIPAA compliance rules engine
   Storage: RiskScore entity in PostgreSQL
   Security: All risk events logged
```

**Compliance Mapping:**
- HIPAA §164.308(a)(1) - Security management process
- GDPR Article 7 - Conditions for consent
- SOC 2 CC3.1 - System components

### 3.2 Researcher Data Access Flow

```
1. Researcher Browse Marketplace
   ↓ (GET /api/data-marketplace)
   Input: Filters (data type, price range, research field)
   Output: Available datasets (anonymized)
   Security: JWT authentication, Rate limiting

2. Request Data Access
   ↓ (POST /api/data-requests)
   Input: Dataset ID, access duration, payment method
   Validation: Researcher permissions, dataset availability
   Storage: DataRequest entity in PostgreSQL
   Smart Contract Call: DataAccessManager.requestAccess()
   Event: DataAccessManager.AccessRequest
   Security: Audit logging, Payment verification

3. Payment Processing
   ↓ (POST /api/payments/process)
   Input: Tokenized payment data (Stripe)
   Validation: Token validity, sufficient funds
   Smart Contract Call: DataAccessManager.processPayment()
   Storage: Payment entity in PostgreSQL
   Security: PCI-DSS compliance (no raw card data, MFA)

4. Patient Consent Verification
   ↓ (Smart Contract + API)
   Smart Contract Call: DataAccessManager.checkConsent()
   API Call: GET /api/consents/{patientId}/check
   Output: Consent status (granted/revoked)
   Security: Blockchain verification, Audit logging

5. Data Access Grant
   ↓ (Smart Contract + API)
   Smart Contract Call: DataAccessManager.grantAccess()
   Event: DataAccessManager.AccessGranted
   API Call: POST /api/data-access/grant
   Storage: DataAccess entity in PostgreSQL
   Security: Time-limited access, Audit logging

6. Data Delivery
   ↓ (API + S3)
   API Call: GET /api/data/{datasetId}/download
   S3 Presigned URL: Generated with time-limited access
   Output: Encrypted data package
   Security: TLS 1.3, Presigned URL expiration, Audit logging

7. Access Expiration
   ↓ (Smart Contract + API)
   Smart Contract Call: DataAccessManager.expireAccess()
   Event: DataAccessManager.AccessExpired
   API Call: POST /api/data-access/revoke
   Storage: DataAccess entity updated (status=expired)
   Security: Automatic revocation, Audit logging
```

**Compliance Mapping:**
- HIPAA §164.508 - Uses and disclosures for research
- GDPR Article 6 - Lawfulness of processing
- SOC 2 CC6.1 - Logical access controls

### 3.3 Provider Data Request Flow

```
1. Provider Authentication
   ↓ (POST /api/auth/login)
   Input: Provider credentials
   Validation: Provider license, credentials
   Security: MFA, Session management

2. Request Patient Data Access
   ↓ (POST /api/provider/request-access)
   Input: Patient ID, access reason, data scope
   Validation: Provider-Patient relationship, access authorization
   Storage: ProviderRequest entity in PostgreSQL
   Smart Contract Call: DataAccessManager.checkProviderAccess()
   Security: Role-based access control, Audit logging

3. Patient Notification
   ↓ (Email + SMS + Slack)
   Email: Notification sent via SendGrid
   SMS: Notification sent via Twilio
   Slack: Provider access alert
   Security: PHI sanitization, Consent verification

4. Patient Consent Verification
   ↓ (API + Smart Contract)
   API Call: GET /api/consents/{patientId}/verify
   Smart Contract Call: IdentityNFT.checkConsent()
   Output: Consent status
   Security: Blockchain verification, Audit logging

5. Grant Provider Access
   ↓ (Smart Contract + API)
   Smart Contract Call: DataAccessManager.grantProviderAccess()
   Event: DataAccessManager.ProviderAccessGranted
   API Call: POST /api/provider/access-granted
   Storage: ProviderAccess entity in PostgreSQL
   Security: Time-limited access, Audit logging

6. Data Retrieval
   ↓ (API + Database)
   API Call: GET /api/provider/patient-data/{patientId}
   Database: Patient medical records from PostgreSQL
   Output: Patient data (PHI)
   Security: Minimum necessary data, Audit logging, PII masking

7. Audit Trail
   ↓ (Audit Middleware)
   All provider access events logged
   Storage: AuditLog entity in PostgreSQL
   Security: 7-year log retention, Immutable logs
```

**Compliance Mapping:**
- HIPAA §164.502(a)(1)(iii) - Minimum necessary standard
- HIPAA §164.308(a)(5)(ii) - Information access
- SOC 2 CC8.1 - Monitoring of system activity

### 3.4 Risk Detection Flow

```
1. API Request
   ↓ (API Gateway)
   Input: User request (any endpoint)
   Security: JWT authentication, Rate limiting, CSRF token

2. Audit Middleware
   ↓ (Audit Middleware)
   Processing: Request/response captured
   Logging: Structured logging (Winston)
   Sanitization: PII masked in logs
   Storage: AuditLog entity in PostgreSQL
   Output: Audit ID

3. Risk Event Bus
   ↓ (Risk Events Service)
   Trigger: Audit ID received
   Processing: Event emitted to Risk Event Bus
   Analysis: Risk events analyzed by subscribers

4. Rules Engine Evaluation
   ↓ (Risk Rules Engine)
   Input: Risk event data
   Processing: 6 HIPAA compliance rules evaluated
   Rules:
   - Rule 1: Unauthorized PHI Access
   - Rule 2: Consent Revocation Violations
   - Rule 3: Unauthorized Data Export
   - Rule 4: High-Risk Geographic Access
   - Rule 5: Suspicious Access Patterns
   - Rule 6: General Compliance Violations
   Output: Risk score (0-100), severity, violations

5. Risk Score Storage
   ↓ (Risk Scoring Service)
   Storage: RiskScore entity in PostgreSQL
   Output: Risk score with component breakdown

6. Alert Generation (if risk score >= threshold)
   ↓ (Alert Service)
   Processing: Alert created with severity
   Routing: Email + SMS + Slack based on severity
   Deduplication: Fingerprint-based deduplication with 5-min window
   Rate Limiting: Per-source limits (system: 10/min, security: 5/min)
   Storage: Alert entity in PostgreSQL
   Output: Alert ID, notification status
```

**Compliance Mapping:**
- HIPAA §164.308(a)(1) - Risk analysis and risk management
- SOC 2 CC3.2 - Change detection and logging
- SOC 2 CC8.1 - Monitoring of system activity

---

## 4. Security Architecture

### 4.1 Network Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet                              │
│                         │                                 │
│                    CloudFront (CDN/WAF)            │
│                         │                                 │
│                    Load Balancer (ALB)              │
│            ┌────────────┴────────────┐                │
│            │                        │                 │
│   ┌────────▼─────────────┐   ┌────────▼─────────┐   │
│   │   EKS Cluster 1   │   │   EKS Cluster 2   │   │
│   │ (us-east-1a)       │   │ (us-east-1b)       │   │
│   └────────┬─────────────┘   └────────┬─────────────┘   │
│            │                        │                 │
│            └───────────────┬─────────────────┘               │
│                           │                                    │
│                    ┌────────▼────────┐                    │
│                    │   VPC (us-east-1) │                    │
│                    │   Segmented:      │                    │
│                    │   - Production     │                    │
│                    │   - Staging       │                    │
│                    │   - Development    │                    │
│                    └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**
- **VPC Segmentation:** Separate VPCs for prod/staging/dev
- **Security Groups:** Whitelist-only access to resources
- **WAF:** AWS WAF rules-based blocking of common attacks
- **CDN:** CloudFront with HTTPS and DDoS protection

### 4.2 Application Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Browser                        │
│                         │                                 │
│                    HTTPS (TLS 1.3)                  │
│                         │                                 │
│                    Helmet Middleware                 │
│            ┌────────────┴────────────┐                │
│            │                        │                 │
│   ┌────────▼────────────────────────┐                 │
│   │   Security Headers:         │                 │
│   │   - CSP (Content Security Policy)                 │
│   │   - HSTS (Strict Transport Security)             │
│   │   - X-Frame-Options: DENY (clickjacking)       │
│   │   - X-Content-Type-Options: nosniff (MIME) │
│   │   CSRF Protection (csrf-csrf)                 │
│   │   Rate Limiting (express-rate-limit)                │
│   │   Input Validation (class-validator)                 │
│   └────────┬─────────────────────┘                 │
│            │                        │                 │
│            └───────────────┬─────────────────┘               │
│                           │                                    │
│                    Express API Server                    │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**
- **Content Security Policy (CSP): Whitelisted sources only
- **HTTP Strict Transport Security (HSTS): 1 year max-age
- **Clickjacking Protection:** X-Frame-Options: DENY
- **MIME Sniffing Protection:** X-Content-Type-Options: nosniff
- **CSRF Protection:** csrf-csrf middleware with /api/csrf-token endpoint
- **Rate Limiting:** Token bucket algorithm with configurable limits
- **Input Validation:** class-validator for all API inputs

### 4.3 Data Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application                      │
│                         │                                 │
│                    TLS 1.3 In Transit               │
│                         │                                 │
│                    Encryption at Rest                 │
│            ┌────────────┴────────────┐                │
│            │                        │                 │
│   ┌────────▼────────────────────────┐                 │
│   │   AES-256 Encryption:      │                 │
│   │   - PostgreSQL RDS (Database)                 │
│   │   - S3 Storage (Documents)                 │
│   │   - AWS KMS (Key Management)                 │
│   └────────┬─────────────────────┘                 │
│            │                        │                 │
│            └───────────────┬─────────────────┘               │
│                           │                                    │
│                    Secrets Management (AWS)               │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**
- **Encryption at Rest:** AES-256 for RDS, SSE-S3 for S3
- **Encryption in Transit:** TLS 1.3 for all data transfer
- **Key Management:** AWS KMS for encryption key management
- **Key Rotation:** Annual encryption key rotation
- **No Environment Variables:** Secrets stored in AWS Secrets Manager
- **Secrets Encryption:** Secrets encrypted at rest in Secrets Manager

### 4.4 Smart Contract Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ethereum Mainnet                     │
│                         │                                 │
│                    Smart Contract Calls                 │
│            ┌────────────┴────────────┐                │
│            │                        │                 │
│   ┌────────▼────────────────────────┐                 │
│   │   Security Features:      │                 │
│   │   - nonReentrant Modifier (Reentrancy Protection)   │
│   │   - CEI Pattern (Checks-Effects-Interactions)     │
│   │   - Role-Based Access Control                   │
│   │   - UUPS Upgradeable Proxy Pattern               │
│   │   - Time Locks (Delayed Upgrades)               │
│   │   - Event Logging (All State Changes)                 │
│   └────────┬─────────────────────┘                 │
│            │                        │                 │
│            └───────────────┬─────────────────┘               │
│                           │                                    │
│                    Health-Mesh API (Event Listener)        │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**
- **Reentrancy Protection:** `nonReentrant` modifier on all state-changing functions
- **CEI Pattern:** Prevents reentrancy attacks by checking effects first
- **Access Control:** Role-based access control in contracts
- **Proxy Pattern:** UUPS proxies for controlled upgrades
- **Time Locks:** Delay in contract upgrades for security review
- **Event Logging:** All state changes emit events for API layer

---

## 5. Deployment Infrastructure

### 5.1 AWS Infrastructure

| Component | AWS Service | Configuration | Security Controls |
|-----------|--------------|---------------|------------------|
| **Compute** | EKS | Multi-AZ deployment, Auto-scaling | VPC segmentation, Security groups |
| **Database** | RDS PostgreSQL 13.7 | Multi-AZ, Read replicas | AES-256 encryption, Automated backups |
| **Cache** | ElastiCache Redis | Cluster mode | AUTH encryption, TLS |
| **Storage** | S3 | Standard, Glacier | SSE-S3 encryption, Bucket policies |
| **Key Management** | KMS | Customer-managed keys | IAM policies, Annual rotation |
| **CDN** | CloudFront | HTTPS, DDoS protection | WAF integration |
| **WAF** | WAF | Rules-based blocking | OWASP Top 10 rules |
| **Audit Logging** | CloudTrail | API call logging | 7-year retention |
| **Secrets** | Secrets Manager | Secure storage | Encryption, IAM policies |

### 5.2 Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet                           │
│                         │                                 │
│                    CloudFront (CDN/WAF)            │
│            ┌────────────┴────────────┐                │
│            │                        │                 │
│       ┌────▼────┐       ┌────────▼────────┐                │
│       │   ALB    │       │   EKS Clusters   │                │
│       │   (Prod)  │       │   (Prod/Stg/Dev) │                │
│       └────┬────┘       └────┬────────────┘                │
│            │                  │                 │
│       ┌────▼────┐    ┌───▼────────┐               │
│       │   RDS     │    │   VPC        │               │
│       │   (Multi-AZ)│    │   (Segmented) │               │
│       └────┬────┘    └────┬────────┘               │
│            │                  │                 │
│       ┌────▼────┐    ┌───▼────────┐               │
│       │  ElastiCache│    │   S3 Storage │               │
│       │  (Redis)    │    │   (Encrypted) │               │
│       └────────────┘    └──────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Environment Separation

| Environment | VPC | Security | Deployment |
|------------|------|----------|-------------|
| **Production** | VPC-PROD | Strictest controls, limited access | Auto-scaling, multi-AZ |
| **Staging** | VPC-STG | Moderate controls, testing access | Minimal resources, single-AZ |
| **Development** | VPC-DEV | Relaxed controls, developer access | Local development, no auto-scaling |

---

## 6. Compliance Evidence

### 6.1 SOC 2 CC3.1 - System Components

**Evidence:**
- Architecture documentation (this document)
- Asset inventory (ASSET-INVENTORY.md)
- Data flows (this document)
- Component diagrams
- Third-party service agreements

### 6.2 ISO 27001 A.8.1 - User endpoint devices

**Evidence:**
- Device management procedures
- Endpoint security configurations
- Mobile device management (if applicable)
- BYOD policies (if applicable)

### 6.3 HIPAA §164.308(a)(1) - Security Management Process

**Evidence:**
- Risk assessment process (RISK-ASSESSMENT-METHODOLOGY.md)
- Risk management plan
- Security policies (ISP, Access Control, Data Classification)
- Security incident response procedures

---

## 7. Document Maintenance

### 7.1 Review Schedule

| Document Component | Review Frequency | Review By |
|-------------------|------------------|-----------|
| **Architecture Diagrams** | Quarterly | CTO |
| **Data Flows** | Quarterly | CTO |
| **Security Controls** | Quarterly | CISO |
| **Third-Party Services** | Annually | CISO |
| **Infrastructure Changes** | As needed | VP of Operations |

### 7.2 Change Process

1. **Proposal:** Architecture change proposal submitted to CTO
2. **Review:** CTO reviews proposal for security impact
3. **Approval:** ISSC approves change
4. **Documentation:** Change documented in document control table
5. **Communication:** Changes communicated to affected teams
6. **Training:** Training conducted if required

---

## 8. Appendices

### Appendix A: Port and Protocol Summary

| Protocol | Port | Purpose | Security |
|----------|-------|---------|-----------|
| **HTTPS** | 443 | API server, Frontend | TLS 1.3, Certificate validation |
| **SSH** | 22 | Server administration | Key-based authentication, VPN-only access |
| **PostgreSQL** | 5432 | Database access | VPC-restricted, TLS |
| **Redis** | 6379 | Cache access | VPC-restricted, AUTH encryption |
| **Ethereum RPC** | 8545 (HTTP), 30303 (WebSocket) | Blockchain | TLS, Rate limiting |

### Appendix B: Service Dependencies

| Service | Dependency | SLA | Backup Plan |
|---------|-----------|------|-------------|
| **PostgreSQL RDS** | AWS RDS | 99.9% | Multi-AZ, read replicas |
| **Redis** | ElastiCache | 99.9% | Cluster mode |
| **S3** | AWS S3 | 99.999999999% | Cross-region replication |
| **KMS** | AWS KMS | 99.9% | Automatic key rotation |
| **SendGrid** | SendGrid | 99.9% | Twilio backup for SMS |

### Appendix C: Disaster Recovery

**Recovery Time Objectives (RTO):**

| Service | RTO | RPO | Recovery Plan |
|---------|-----|-----|-------------|
| **API Server** | 2 hours | 15 minutes | Auto-scaling, read replicas |
| **Database** | 4 hours | 15 minutes | Multi-AZ, point-in-time recovery |
| **S3 Storage** | 1 hour | 0 minutes | Cross-region replication |
| **Blockchain** | N/A | N/A | On-chain data (immutable) |

---

## 9. Document Control

| Version | Date | Changes | Approved By |
|---------|-------|---------|--------------|
| 1.0 | [Date] | Initial document creation | CTO |

---

**Document Classification:** Confidential

**Distribution:** All Health-Mesh technical teams, security team, and architecture stakeholders

---

**Last Updated:** [Date]

**Next Review Date:** [Date + 6 months]

---

*This Architecture and Data Flows document aligns with NIST Cybersecurity Framework 2.1 (Identify and Protect functions), HIPAA Security Rule, SOC 2 Type II Trust Services Criteria (Security + Availability), and ISO/IEC 27001:2022 standards.*
