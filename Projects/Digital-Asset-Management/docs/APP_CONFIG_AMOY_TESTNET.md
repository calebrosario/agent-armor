# Application Configuration Guide for Amoy Testnet

## Overview

This guide explains how to configure the application (frontend, backend) to use the Amoy testnet for smart contract integration.

**Important:** This guide is for AMOY TESTNET deployment. For production deployment, see separate guide.

---

## Network Configuration

### Amoy Testnet Details

| Property | Value |
|----------|-------|
| **Network Name** | Polygon Amoy Testnet |
| **Chain ID** | 80002 |
| **RPC Endpoint** | https://rpc-amoy.polygon.technology/ |
| **Explorer** | https://amoy.polygonscan.com |
| **Currency** | AMOY MATIC (testnet only, no real value) |

### Testnet Faucet

Get AMOY MATIC for deployments:
- https://amoy.polygonscan.com/faucet
- Alternative: https://faucet.polygon.technology/ (may redirect to Amoy)

**Note:** Testnet MATIC cannot be moved to mainnet.

---

## Smart Contract Deployment Status

### Current State

**Amoy Testnet Deployment:**
- ✅ PR #7 merged (Mumbai → Amoy migration)
- ✅ Deployment workflows created and tested
- ✅ Dry-run deployment successful (8s execution time)
- ✅ Ready for actual deployment

**Contract Deployment:**
- ⏸️ Contracts not yet deployed to Amoy
- ⏸️ Contract addresses pending from deployment
- ⏸️ Verification pending after deployment

### Next Steps

1. **Deploy contracts to Amoy testnet:**
   ```bash
   gh workflow run "deploy-contracts-amoy.yml" -f dry_run=false,verify_contracts=true
   ```

2. **Verify contracts on Amoy PolygonScan:**
   ```bash
   cd blockchain
   npm run verify:amoy
   ```

3. **Extract contract addresses from deployment artifacts**

4. **Update application configuration with deployed addresses**

---

## Backend Configuration (NestJS API)

### Update `.env.staging`

After contracts are deployed to Amoy, update the blockchain configuration section in `.env.staging`:

```bash
# Blockchain Configuration

# Polygon Amoy Testnet
BLOCKCHAIN_NETWORK=amoy
BLOCKCHAIN_CHAIN_ID=80002
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com
BLOCKCHAIN_AMOY_CHAIN_ID=80002

# Deployed Contract Addresses (Amoy Testnet)
# Update these after deployment
KYC_VERIFIER_ADDRESS=
ASSET_TOKEN_PROXY_ADDRESS=
SHARE_TOKEN_PROXY_ADDRESS=
ESCROW_PROXY_ADDRESS=
GOVERNANCE_ADDRESS=

# PolygonScan API
POLYGONSCAN_API_KEY=gNCLVEg8e2AykN2ZhLfbE
POLYGONSCAN_AMOY_API_KEY=gNCLVEg8e2AykN2ZhLfbE

# API Keys (already configured)
API_URL=https://api.digital-asset-staging.onrender.com
NODE_ENV=staging

# Database
STAGING_DB_CONNECTION_STRING=postgresql://staging-db-host:5432/digital_assets_staging

# Deployment Services
RENDER_SERVICE_ID=your-render-service-id
RENDER_API_KEY=your-render-api-key
VERCEL_TOKEN=your-vercel-token
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### Backend Environment Variables

Update these environment variables for blockchain integration:

```typescript
// src/config/blockchain.config.ts
export const blockchainConfig = {
  network: 'amoy', // 'mumbai' (deprecated), 'polygon' (mainnet)
  chainId: 80002, // 80001 (deprecated), 137 (mainnet)
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
  explorerUrl: process.env.BLOCKCHAIN_EXPLORER_URL,
  contracts: {
    kycVerifier: process.env.KYC_VERIFIER_ADDRESS,
    assetToken: process.env.ASSET_TOKEN_PROXY_ADDRESS,
    shareToken: process.env.SHARE_TOKEN_PROXY_ADDRESS,
    escrow: process.env.ESCROW_PROXY_ADDRESS,
    governance: process.env.GOVERNANCE_ADDRESS,
  },
};
```

---

## Frontend Configuration (Next.js)

### Update `.env.staging`

Add Amoy testnet configuration to frontend environment:

```bash
# Polygon Amoy Testnet
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=amoy
NEXT_PUBLIC_BLOCKCHAIN_CHAIN_ID=80002
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com

# Deployed Contract Addresses (Amoy Testnet)
NEXT_PUBLIC_KYC_VERIFIER_ADDRESS=
NEXT_PUBLIC_ASSET_TOKEN_ADDRESS=
NEXT_PUBLIC_SHARE_TOKEN_ADDRESS=
NEXT_PUBLIC_ESCROW_ADDRESS=
NEXT_PUBLIC_GOVERNANCE_ADDRESS=
```

### Frontend Environment Variables

Update frontend to use Amoy configuration:

```typescript
// config/blockchain.ts
export const blockchainConfig = {
  network: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || 'amoy',
  chainId: parseInt(process.env.NEXT_PUBLIC_BLOCKCHAIN_CHAIN_ID || '80002'),
  rpcUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology/',
  explorerUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL || 'https://amoy.polygonscan.com',
  contracts: {
    kycVerifier: process.env.NEXT_PUBLIC_KYC_VERIFIER_ADDRESS,
    assetToken: process.env.NEXT_PUBLIC_ASSET_TOKEN_ADDRESS,
    shareToken: process.env.NEXT_PUBLIC_SHARE_TOKEN_ADDRESS,
    escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
    governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
  },
};
```

---

## Wagmi/Web3 Configuration

### Update Network Configuration

For frontend wallet connections (using Wagmi/Viem), update network configuration:

```typescript
// lib/wagmi.config.ts
import { defineChain } from 'wagmi';

export const amoyTestnet = defineChain({
  id: 80002,
  name: 'Amoy',
  network: 'amoy',
  nativeCurrency: {
    name: 'AMOY MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Amoy Explorer',
      url: 'https://amoy.polygonscan.com',
    },
  },
});

export const networks = {
  amoy: amoyTestnet,
  // Add mainnet when ready
  // polygon: defineChain({ id: 137, name: 'Polygon Mainnet', ... }),
};
```

---

## Deployment Workflow Configuration

### Verify GitHub Actions Secrets

Ensure these GitHub Secrets are set before deployment:

| Secret | Purpose | Get From |
|---------|---------|----------|
| `POLYGON_AMOY_RPC_URL` | Alchemy/Infura or use public endpoint | https://rpc-amoy.polygon.technology/ |
| `POLYGONSCAN_AMOY_API_KEY` | https://amoy.polygonscan.com/myapikey | Amoy PolygonScan |
| `DEPLOYER_PRIVATE_KEY` | Your deployer wallet private key | Create new wallet for Amoy |
| `SLACK_WEBHOOK_URL` | (Optional) Notifications | Configure if needed |

**Check Secrets:**
```bash
# List configured secrets
gh secret list --repo calebrosario/digital-asset-management
```

---

## Deployment Procedure

### 1. Dry-Run Test (Completed ✅)

```bash
# Test deployment flow without actual deployment
gh workflow run "deploy-contracts-amoy.yml" -f dry_run=true

# Verify workflow completed successfully
gh run list --limit 1
```

### 2. Actual Deployment

```bash
# Deploy contracts to Amoy testnet
gh workflow run "deploy-contracts-amoy.yml" -f dry_run=false,verify_contracts=true

# Monitor workflow execution
gh run view <workflow-run-id> --log-failed

# Wait for deployment artifacts
# Contract addresses will be in: blockchain/deployments/
```

### 3. Contract Verification

```bash
# Verify all deployed contracts on Amoy PolygonScan
cd blockchain
npm run verify:amoy

# Verify each contract on explorer
# https://amoy.polygonscan.com/address/<CONTRACT_ADDRESS>
```

### 4. Extract Contract Addresses

After deployment completes, extract contract addresses from workflow artifacts:

```bash
# View workflow summary
# Or access from: https://github.com/calebrosario/digital-asset-management/actions/workflows

# Update .env.staging with addresses
```

---

## Verification Checklist

After deployment, verify each aspect:

- [ ] All 5 contracts deployed (KYCVerifier, AssetToken, ShareToken, Escrow, Governance, Timelock)
- [ ] Contracts verified on Amoy PolygonScan
- [ ] Contract addresses extracted from deployment artifacts
- [ ] Deployment artifacts saved and accessible
- [ ] GitHub Actions workflow completed successfully
- [ ] Application configuration updated with contract addresses
- [ ] Frontend network configuration updated to Amoy
- [ ] Backend network configuration updated to Amoy

---

## Integration Testing

### Backend Integration Tests

After contracts are deployed, test backend integration:

```bash
# Start backend with Amoy configuration
cd api
npm run start:staging

# Test contract interactions
# 1. KYC verification
# 2. Asset token minting
# 3. Share token transfers
# 4. Escrow deployment
# 5. Governance proposals
```

### Frontend Integration Tests

After contracts are deployed, test frontend integration:

```bash
# Start frontend with Amoy configuration
cd frontend
npm run dev

# Test wallet connection
# 1. Connect wallet (Web3Auth + Wagmi)
# 2. Switch network to Amoy
# 3. Test contract read operations
# 4. Test contract write operations
# 5. Test escrow interactions
```

---

## Migration Notes

### From Mumbai to Amoy

**What Changed:**
- Network: Mumbai (80001) → Amoy (80002)
- RPC URL: Updated to Amoy endpoint
- Explorer URL: Updated to amoy.polygonscan.com
- API Key: POLYGONSCAN_MUMBAI_API_KEY → POLYGONSCAN_AMOY_API_KEY
- Environment Variables: Updated suffix from _MUMBAI to _AMOY

**What Stayed the Same:**
- Deployer private key (DEPLOYER_PRIVATE_KEY)
- Contract code (same contracts)
- Deployment scripts (refactored but same functionality)
- Application architecture (no changes needed)

**Backend Compatibility:**
- Current backend code works with both networks
- No changes needed - just configuration updates

**Frontend Compatibility:**
- Current frontend code works with multiple networks
- Wagmi supports dynamic network configuration
- No changes needed - just environment variables

---

## Troubleshooting

### Common Issues

#### Issue: "Network mismatch"

**Cause:** Using Mumbai configuration while trying to connect to Amoy

**Solution:** Ensure all configurations use `amoy` network and Chain ID 80002

#### Issue: "Contract not found"

**Cause:** Contract address not configured in environment variables

**Solution:** Update `.env.staging` with deployed contract addresses

#### Issue: "Verification failed"

**Cause:** Contract not yet indexed by PolygonScan

**Solution:** Wait 2-5 minutes and try verification again

#### Issue: "Insufficient funds"

**Cause:** Deployer wallet doesn't have enough AMOY MATIC

**Solution:** Get more AMOY MATIC from faucet

---

## Rollback Plan

If Amoy deployment needs to be rolled back to Mumbai:

1. **Switch Backend Configuration:**
   ```bash
   BLOCKCHAIN_NETWORK=mumbai
   BLOCKCHAIN_CHAIN_ID=80001
   BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
   BLOCKCHAIN_EXPLORER_URL=https://mumbai.polygonscan.com
   ```

2. **Switch Frontend Configuration:**
   ```bash
   NEXT_PUBLIC_BLOCKCHAIN_NETWORK=mumbai
   NEXT_PUBLIC_BLOCKCHAIN_CHAIN_ID=80001
   NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
   NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL=https://mumbai.polygonscan.com
   ```

3. **Rename Amoy Workflows:**
   ```bash
   # Archive Amoy workflows
   mv .github/workflows/deploy-contracts-amoy.yml .github/workflows/deploy-contracts-amoy.yml.archived
   
   # Reactivate Mumbai workflows
   mv .github/workflows/backup/deploy-contracts-mumbai.yml.original .github/workflows/deploy-contracts-mumbai.yml
   ```

---

## Security Considerations

### Amoy Testnet Security

✅ **Safe for Testing:**
- Testnet MATIC has no real value
- Smart contracts are upgradeable (proxy patterns)
- Governance contracts in place
- No production funds at risk

### Pre-Production Checklist

Before deploying to Polygon Mainnet:

- [ ] All Amoy testnet contracts tested
- [ ] Frontend and backend integration verified
- [ ] Security audits passed
- [ ] Governance processes established
- [ ] Multi-sig deployed for critical functions
- [ ] Emergency procedures documented
- [ ] Mainnet secrets configured and secured
- [ ] Approval gates for mainnet deployment configured

---

## Next Steps

### Immediate (After Amoy Deployment)

1. **Deploy contracts to Amoy** - Use GitHub Actions workflow
2. **Verify contracts** - Use `npm run verify:amoy` (uses shared verification utility via `blockchain/scripts/utils/verify-contracts.js`)
3. **Extract addresses** - Get from deployment artifacts or logs
4. **Update .env.staging** - Fill in deployed contract addresses
5. **Test backend integration** - Verify contract interactions work
6. **Test frontend integration** - Verify wallet connection and contract UI

### Future (Phase 3)

Once Amoy testnet is stable, proceed to **Phase 3: Application CI/CD + Contract Integration**

See: [Phase 3 Plan](./PHASE3_APPLICATION_CI_CD_PLAN.md) (to be created)

---

## References

- [Mumbai to Amoy Migration Guide](./MUMBAI_TO_AMOY_MIGRATION.md)
- [Amoy Deployment Workflow](../../.github/workflows/deploy-contracts-amoy.yml)
- [Amoy Deployment Script](../../blockchain/scripts/deploy-amoy.js)
- [Amoy Verification Script](../../blockchain/scripts/verify-amoy.js) (uses shared utility `blockchain/scripts/utils/verify-contracts.js`)
- [Unified Verification Utility](../../blockchain/scripts/utils/verify-contracts.js)
- [Amoy Contract Config](../../blockchain/scripts/contract-config.js)
- [Blockchain README](../../blockchain/README.md)
- [Phase 2 Plan](../PHASE2_SMART_CONTRACTS_PLAN.md)
