# Custodial Wallet Implementation Plan
## Health-Mesh Medical Research Platform

**Objective**: Update platform to use custodial wallets (Web3Auth + Fireblocks) so users do not need to know how to use Web3 wallets.

---

## Executive Summary

**Current State:**
- Backend API with JWT authentication (email/password)
- Smart contracts (IdentityNFT, DataAccessManager) using ethers.js v6
- PostgreSQL database with User, Consent, ApiAudit entities
- **NO wallet functionality implemented** - users authenticate with traditional credentials only

**Proposed Solution:**
- **Web3Auth (MetaMask Embedded Wallets)** - Non-custodial patient-facing wallets with OAuth login
- **Fireblocks** - Enterprise-grade custodial solution for platform treasury
- **Smart Contract Updates** - Add wallet address linkage to user accounts
- **Account Abstraction** - Sponsor gas fees for patient transactions

**Target Users:**
- Patients: Sign up with Google/Apple, get automatic wallet, control their health data
- Researchers: Purchase data access via ETH/USDC, no wallet knowledge required
- Providers: Request patient data through institutional wallets

---

## Phase 1: Smart Contract & Backend Updates (Weeks 1-3)

### 1.1 Update Smart Contracts

**File: \`contracts/IdentityNFT.sol\`**
Add wallet address mapping and linking function.

**File: \`contracts/DataAccessManager.sol\`**
Add sponsored gas functionality.

**Deployment:**
Compile and deploy to testnet/mainnet.

**Testing:**
Unit tests for wallet linking and gas sponsorship.

### 1.2 Database Schema Updates

**New Table: wallet_metadata**
Store encrypted private keys and provider metadata.

**New Table: gas_sponsorships**
Track gas sponsorship transactions.

**Update: users table**
Add \`wallet_address VARCHAR(42) UNIQUE\` column.

### 1.3 Backend Services

**New File: api/services/web3auth.service.ts**
Web3Auth SDK integration for patient authentication.

**New File: api/services/fireblocks.service.ts**
Fireblocks SDK integration for platform treasury.

**New File: api/services/wallet.service.ts**
Wallet management service linking users to addresses.

---

## Phase 2: Frontend Integration (Weeks 4-7)

### 2.1 Authentication Flow

User Experience:
1. Click "Sign In with Google/Apple"
2. Web3Auth OAuth modal opens
3. Non-custodial wallet created automatically
4. JWT token issued
5. Redirect to dashboard (no wallet knowledge needed)

### 2.2 Smart Contract Interactions

User Experience:
1. Patient signs consent → Backend signs with custodial wallet
2. Researcher requests data → Platform sponsors gas
3. Transaction confirmation with status tracking

---

## Phase 3: Testing & Security (Weeks 8-9)

### 3.1 Smart Contract Tests
- Unit tests for wallet linking
- Gas sponsorship tests
- Access control tests

### 3.2 Security Audits
- Slither: \`npx slither contracts/\`
- MythX: \`npx mythx contracts/\`
- Penetration testing on wallet endpoints

---

## Phase 4: Deployment (Week 10)

### 4.1 Web3Auth Configuration
- Register at Web3Auth Dashboard
- Create project, get Client ID
- Configure whitelisted domains
- Set up social login providers

### 4.2 Fireblocks Setup
- Enterprise onboarding and KYB
- Configure API keys and vaults
- Set up policy-based transaction approvals

### 4.3 Smart Contract Deployment
- Testnet deployment and verification
- Mainnet deployment
- Update contract addresses in .env

---

## Phase 5: Compliance & Documentation (Weeks 11-12)

### 5.1 HIPAA Compliance
- PHI never stored on blockchain
- All data access logged
- User consent revocation working
- Data encryption (AES-256 at rest, TLS in transit)

### 5.2 Documentation
- Technical implementation guides
- API documentation
- User onboarding guides
- Security best practices

---

## Cost Estimates

| Component | Year 1 Cost |
|------------|--------------|
| Web3Auth (10k MAU) | $5,000-6,000 |
| Fireblocks Enterprise | $10,000-20,000 |
| Smart Contract Audit | $15,000-25,000 |
| Development (3 senior devs, 12 weeks) | $50,000-80,000 |
| **Total** | **$80,000-131,000** |

---

## Success Criteria

- [ ] Patients sign up with Google/Apple without wallet knowledge
- [ ] Non-custodial wallet automatically created
- [ ] Wallet address linked to user account
- [ ] Smart contracts support wallet linkage
- [ ] Backend signs transactions with custodial wallet
- [ ] Gas fees sponsored for patient operations
- [ ] All tests passing
- [ ] Security audit clean
- [ ] HIPAA compliance verified
- [ ] Platform treasury managed via Fireblocks
- [ ] Production deployment live

---

## Risks & Mitigations

| Risk | Mitigation |
|-------|-------------|
| Web3Auth outage | Fallback to email/SMS auth |
| Smart contract bugs | Multiple audits, testnet deployment |
| Regulatory non-compliance | Legal review, HIPAA consultant |
| User adoption friction | UX testing, simplified onboarding |

---

## Timeline Summary

| Phase | Duration | Milestones |
|-------|-----------|------------|
| Phase 1: Smart Contract & Backend | Weeks 1-3 | Contract updates, DB schema, wallet services |
| Phase 2: Frontend Integration | Weeks 4-7 | Web3Auth integration, auth flow, contract interactions |
| Phase 3: Testing & Security | Weeks 8-9 | Tests complete, audits passed |
| Phase 4: Deployment | Week 10 | Testnet and mainnet live |
| Phase 5: Compliance & Docs | Weeks 11-12 | HIPAA compliant, documentation complete |

---

