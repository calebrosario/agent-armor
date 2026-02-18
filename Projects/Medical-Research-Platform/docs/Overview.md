# 🏥 Health-Mesh: Medical Research Platform - Overview

## 🎯 Core Purpose
**Health-Mesh** is a **blockchain-powered data control platform** that enables patients to **own, share, and monetize** their medical data while providing researchers with compliant, permissioned access to health datasets.

---

## 🏗️ Architecture Overview

### **Three-Tier Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER LAYER (Web/Mobile)                      │
│  - Patient Portal - control data, set fees, view consents         │
│  - Researcher Marketplace - browse data, purchase access          │
│  - Provider Portal - request patient data access                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                  API LAYER (Node.js/Express)                    │
│  • Consent API (HIPAA/GDPR/CCPA forms)                       │
│  • Legal Forms API                                           │
│  • Audit & Compliance Middleware                                │
│  • Worker Queue (BullMQ) - PDF signing, emails                │
│  • TypeORM + PostgreSQL (ACID-compliant)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              BLOCKCHAIN LAYER (Ethereum/EVM)                   │
│  • IdentityNFT (ERC-721) - Patient identity + fee control     │
│  • DataAccessManager - On-chain access control                  │
│  • UUPS Upgradeable Proxy Pattern                             │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Components

### **1. Smart Contracts (Solidity)**

#### **IdentityNFT Contract**
- **Purpose**: Represents patient/researcher identity as an ERC-721 token
- **Key Features**:
  - `mintIdentity()` - Creates owner (patient) or borrower (researcher) tokens
  - `setBorrowFee()` - Owner sets fee for data access (ETH or ERC-20)
  - `setFeeToken()` - Admin can change fee token (e.g., HEALTH token)
  - Stores borrower-specific fees (planned: different rates for doctors vs. researchers)

#### **DataAccessManager Contract**
- **Purpose**: Manages on-chain permissions and data access
- **Key Features**:
  - `setData()` - Owner stores data URI (IPFS/S3 pointer)
  - `requestAccess()` - Borrower requests access, pays fee (automatic approval if fee paid)
  - `approveAccess()` - Manual approval by owner
  - `revokeAccess()` - Owner can revoke access anytime
  - `getData()` - Borrower retrieves data if approved
  - **Reentrancy protection** on access requests
  - **Audit events** for all access operations

#### **Upgradeability**
- **UUPS Proxy Pattern** - Both contracts are upgradeable
- **UPGRADER_ROLE** - Admin-only contract upgrades
- **OpenZeppelin Upgradeable Contracts** - Secure, audited base

---

### **2. API Layer (Node.js/Express)**

#### **Consent API**
- **Tech Stack**: Express, TypeORM, PostgreSQL, BullMQ, Redis, Winston
- **Purpose**: Manages HIPAA/GDPR/CCPA consent forms
- **Key Endpoints**:
  - `POST /api/consents` - Create consent (pending status)
  - `PATCH /api/consents/{id}` - Update consent answers
  - `POST /api/consents/{id}/sign` - Trigger PDF signing (queued)
  - `GET /api/consents/{id}/pdf` - Download signed PDF
  - `DELETE /api/consents/{id}` - Revoke consent

#### **Legal Forms API**
- Manages dynamic form templates (RJSF JSON Schema)
- Validates answers using Ajv (JSON Schema validator)
- Stores form definitions and responses in PostgreSQL
- Queues signing/email tasks to BullMQ workers

#### **Worker Processes**
- **worker-sign.js** - Generates signed PDFs, uploads to S3, updates DB
- **worker-pdf.js** - Handles PDF generation workflows
- **ACID transactions** - All DB operations wrapped in transactions
- **Retry logic** - BullMQ provides exponential backoff

#### **Authentication & Security**
- **JWT authentication** (passport-jwt)
- **Swagger UI** for API documentation
- **Winston logging** + audit middleware
- **Rate limiting** (planned)
- **Input validation** (class-validator)

---

### **3. Database Layer**

#### **PostgreSQL Schema**
```sql
users                         - User accounts (email, password hash)
consent_form_definitions        - Form templates (HIPAA, GDPR, CCPA)
consents                      - Signed consents (status, signed_hash, expires_at)
consent_logs                  - Immutable audit trail
legal_forms                   - Legal form templates (RJSF schema)
legal_form_responses          - Form submissions
api_audit                     - API call logs
```

- **JSONB support** for flexible schema storage
- **Foreign keys** for referential integrity
- **Timestamps** for audit trails

---

### **4. Off-Chain Storage**

- **AWS S3** - Stores signed PDFs, medical records
- **IPFS** (planned) - Decentralized storage for data URIs
- **Encrypted at rest** - Compliance requirement

---

## 📊 Business Model

### **Revenue Streams**
| Stream | Pricing | Target |
|---------|----------|--------|
| Data Sale Fees | $0.02 ETH / $5 per 30-day access | Researchers |
| Patient Subscriptions | $9.99/month - premium features | Patients |
| Provider Portal | $500/month - API & dashboards | Hospitals |
| Token Incentive | HEALTH token - discounts, rewards | All users |

### **Market Opportunity**
- **TAM**: $12B (patient-controlled data + research marketplaces)
- **Projected Revenue**: $240M by Year 5
- **Break-even**: Q3 2026

---

## 🛡️ Compliance Framework

### **Regulatory Support**
- **HIPAA** (U.S.) - PHI protection, BAAs, minimum necessary access
- **GDPR** (EU) - Explicit consent, right to erasure, DPIA
- **CCPA** (California) - Opt-in for sale, right to opt-out, 45-day breach notice

### **Key Compliance Features**
- ✅ **Explicit consent** stored in smart contracts
- ✅ **Audit logs** for all data accesses (on-chain + off-chain)
- ✅ **Revocation rights** - `revokeAccess()` anytime
- ✅ **Right to erasure** - Burn NFT, delete off-chain data
- ✅ **Minimum necessary** - Owners control who accesses what
- ✅ **Data portability** - Export patient data via API
- ✅ **Breach notification** - Automated alerts (72h HIPAA/GDPR, 45d CCPA)

---

## 🔄 Data Flow

### **Patient Journey**
```
1. Sign up → Create Health-Mesh profile
2. Upload medical records → Encrypted storage (S3/IPFS)
3. Mint IdentityNFT → Store consent hash on-chain
4. Fill consent forms → Signed PDF generated (BullMQ worker)
5. Set borrowing fee → e.g., 0.02 ETH per access
6. Monitor data sales → View audit log in dashboard
```

### **Researcher Journey**
```
1. Browse marketplace → Find relevant datasets
2. Pay access fee → ETH/ERC-20 transfer
3. Smart contract approves → Automatic if fee paid
4. Access data → Download encrypted records
5. Research → Use data for AI/ML studies
6. Renew access → Pay fee again for continued access
```

---

## 🎨 Key Features

### **For Patients**
- ✅ **Full data ownership** - Your data, your terms
- ✅ **Earn money** - Monetize health data
- ✅ **Granular control** - Set different fees for doctors vs. researchers
- ✅ **Compliance portal** - View all consents, audit logs
- ✅ **One-click revocation** - Revoke access instantly
- ✅ **Data portability** - Export your records anytime

### **For Researchers**
- ✅ **Instant access** - Pay fee, get approved automatically
- ✅ **Compliant data** - HIPAA/GDPR/CCPA compliant datasets
- ✅ **Large datasets** - Access to millions of patient records
- ✅ **Transparent provenance** - Blockchain audit trail

### **For Healthcare Providers**
- ✅ **Seamless interoperability** - Request access, get approved
- ✅ **Reduced admin** - No more faxing forms
- ✅ **Compliance** - Automated consent tracking

---

## 🚀 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | (Planned) React/Next.js | Web/Mobile portals |
| **Backend** | Node.js, Express | REST API, workers |
| **Database** | PostgreSQL | ACID-compliant storage |
| **Queue** | Redis, BullMQ | Async task processing |
| **Blockchain** | Ethereum, Solidity | Identity, access control |
| **Storage** | AWS S3, IPFS | Medical records, PDFs |
| **Auth** | JWT, Passport | Stateless authentication |
| **Docs** | Swagger UI | Interactive API docs |
| **Validation** | Ajv, class-validator | JSON Schema validation |
| **Logging** | Winston | Structured logs |
| **Development** | Hardhat, TypeScript | Smart contract testing |

---

## 📁 Project Structure

```
medical-research-platform/
├── contracts/              # Solidity smart contracts
│   ├── IdentityNFT.sol
│   └── DataAccessManager.sol
├── api/                   # Node.js backend
│   ├── server.ts          # Express app entry point
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation
│   └── workers/         # BullMQ background jobs
├── database/            # SQL schemas
├── docs/               # Architecture, compliance, business plan
├── test/               # Smart contract tests
├── ignition/           # Hardhat deployment modules
└── scripts/            # Utility scripts
```

---

## 🎯 Key Differentiators

1. **Patient-centric** - Patients own and monetize their data
2. **Blockchain-native** - Immutable consent and access logs
3. **Multi-regulatory** - HIPAA, GDPR, CCPA compliant
4. **Granular fees** - Different rates for different user types
5. **Upgradeable** - UUPS proxy pattern for future improvements
6. **ACID-compliant** - All database operations transactional
7. **Scalable** - Horizontal worker scaling with BullMQ

---

## 🔮 Future Roadmap

- **Multi-chain support** - Polygon, Arbitrum, L2s
- **AI marketplace** - Data validation and quality scoring
- **Insurance integration** - Direct payer data exchange
- **DAO governance** - Community-led platform upgrades
- **Mobile apps** - iOS/Android patient portals
- **On-prem deployment** - Enterprise hospital hosting

---

## 💡 Summary

**Health-Mesh** is a comprehensive blockchain platform that solves the medical data access problem by:
- Giving patients **ownership and control** of their health data
- Creating a **marketplace** for compliant data sharing
- Using **smart contracts** for transparent, auditable consent
- Providing **regulatory compliance** out of box (HIPAA/GDPR/CCPA)
- Enabling **monetization** for patients and **accelerating research**

The platform bridges the gap between data silos and research needs while maintaining patient privacy and regulatory compliance. 🚀
