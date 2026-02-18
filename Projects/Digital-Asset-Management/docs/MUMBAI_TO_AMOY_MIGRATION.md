# Mumbai to Amoy Testnet Migration Guide

## Overview

Polygon Mumbai testnet (Chain ID: 80001) is **deprecated and read-only**. All future testnet deployments should use **Polygon Amoy testnet (Chain ID: 80002)**.

**Important:** This migration guide covers the changes needed to move from Mumbai to Amoy testnet.

---

## Quick Migration Summary

| Aspect | Mumbai (Deprecated) | Amoy (New) |
|---------|---------------------|----------------|
| Chain ID | 80001 | 80002 |
| RPC Endpoint (Public) | https://rpc-mumbai.maticvigil.com | https://rpc-amoy.polygon.technology/ |
| Explorer | https://mumbai.polygonscan.com | https://amoy.polygonscan.com |
| Faucet | https://faucet.polygon.technology/ | https://amoy.polygonscan.com/faucet |
| GitHub Secrets | `POLYGON_MUMBAI_RPC_URL`, `POLYGONSCAN_MUMBAI_API_KEY` | `POLYGON_AMOY_RPC_URL`, `POLYGONSCAN_AMOY_API_KEY` |

---

## Step 1: Update GitHub Secrets

### Old Mumbai Secrets (No longer needed)
- ❌ `POLYGON_MUMBAI_RPC_URL`
- ❌ `POLYGONSCAN_MUMBAI_API_KEY`

### New Amoy Secrets (Required)
Add these in GitHub repository settings (Settings → Secrets and variables → Actions):
- ✅ `POLYGON_AMOY_RPC_URL`: Use Alchemy or Infura endpoint, or public: `https://rpc-amoy.polygon.technology/`
- ✅ `POLYGONSCAN_AMOY_API_KEY`: Get from https://amoy.polygonscan.com/myapikey
- ✅ `DEPLOYER_PRIVATE_KEY`: (unchanged) Same private key works for both networks
- ✅ `SLACK_WEBHOOK_URL`: (unchanged) For notifications

### How to Get Amoy API Key
1. Go to https://amoy.polygonscan.com/
2. Click your account avatar → "API Keys"
3. Click "Add API Key"
4. Enter name: "GitHub Actions"
5. Copy the API Key to GitHub secrets

---

## Step 2: Update Local Development

### Update `.env` File

Replace Mumbai entries with Amoy:

```env
# Old (Mumbai - deprecated)
# POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
# POLYGONSCAN_MUMBAI_API_KEY=your_mumbai_key
# KYC_VERIFIER_ADDRESS_MUMBAI=0x...
# ASSET_TOKEN_PROXY_ADDRESS_MUMBAI=0x...
# SHARE_TOKEN_PROXY_ADDRESS_MUMBAI=0x...
# ESCROW_PROXY_ADDRESS_MUMBAI=0x...
# GOVERNANCE_ADDRESS_MUMBAI=0x...

# New (Amoy - current)
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGONSCAN_AMOY_API_KEY=your_amoy_key
KYC_VERIFIER_ADDRESS_AMOY=0x...
ASSET_TOKEN_PROXY_ADDRESS_AMOY=0x...
SHARE_TOKEN_PROXY_ADDRESS_AMOY=0x...
ESCROW_PROXY_ADDRESS_AMOY=0x...
GOVERNANCE_ADDRESS_AMOY=0x...
```

### Update Hardhat Config

The `hardhat.config.js` file has been updated to include `polygonAmoy` network:

```javascript
networks: {
  // ... other networks ...
  polygonAmoy: {
    url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 80002,
    gasPrice: 20000000000,
  },
  // ...
}
```

---

## Step 3: Deploy to Amoy Testnet

### Manual Deployment (GitHub UI)

1. Go to repository → Actions tab
2. Select "Deploy Contracts to Amoy Testnet" workflow
3. Click "Run workflow"
4. Select inputs:
   - environment: `testnet`
   - dry_run: `false` (for actual deployment)
   - verify_contracts: `true` (recommended)
5. Click "Run workflow"

### Command Line Deployment

```bash
# Deploy to Amoy testnet
cd blockchain
npm run deploy:amoy

# Verify contracts on Amoy
npm run verify:amoy
```

---

## Step 4: Get Testnet MATIC (Amoy)

### Faucet Options

1. **Amoy PolygonScan Faucet**: https://amoy.polygonscan.com/faucet
   - Paste your wallet address
   - Complete captcha
   - Receive 0.1 AMOY MATIC

2. **Alchemy/Infura Faucet**: Check if your RPC provider has faucet service

3. **Alternative Faucets**:
   - https://faucet.polygon.technology/ (may redirect to Amoy)
   - https://amoy-faucet.polygon.technology/

**Note:** Testnet MATIC has no real value and cannot be moved to mainnet.

---

## Step 5: Verify Contracts on Amoy Explorer

### Manual Verification

1. Go to https://amoy.polygonscan.com/
2. Enter your contract address
3. Click "Verify and Publish"
4. Fill in:
   - Compiler Type: Solidity (Standard-Json-Input)
   - Compiler Version: 0.8.20
   - License: MIT
   - Constructor Arguments: (see below)

### Automatic Verification

The `verify-amoy.js` script automatically verifies all deployed contracts:

```bash
npm run verify:amoy
```

### Constructor Arguments

| Contract | Constructor Arguments |
|----------|---------------------|
| KYCVerifier | `[]` (empty) |
| AssetToken (Proxy) | `["ipfs://"]` |
| ShareToken (Proxy) | `["EstateNFT Shares", "ESHARES", <assetTokenAddress>, 18]` |
| Escrow (Proxy) | `[]` (empty) |
| Governance | `[<shareTokenAddress>]` |

---

## Step 6: Update Application Configuration

After successful deployment on Amoy:

### Backend API (NestJS)

Update `.env` for API backend:

```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK=amoy
BLOCKCHAIN_CHAIN_ID=80002
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/

# Contract Addresses
KYC_VERIFIER_ADDRESS=0x... (your deployed address)
ASSET_TOKEN_PROXY_ADDRESS=0x...
SHARE_TOKEN_PROXY_ADDRESS=0x...
ESCROW_PROXY_ADDRESS_AMOY=0x...
GOVERNANCE_ADDRESS=0x...

# Explorer
BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com
```

### Frontend (Next.js)

Update frontend `.env.local`:

```env
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=amoy
NEXT_PUBLIC_BLOCKCHAIN_CHAIN_ID=80002
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com

# Contract addresses
NEXT_PUBLIC_KYC_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_ASSET_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_SHARE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
```

---

## Workflow Changes Summary

### Files Created/Updated

1. **.github/workflows/deploy-contracts-amoy.yml** (NEW)
   - Replaces deploy-contracts-mumbai.yml
   - Uses Amoy secrets
   - Chain ID 80002
   - Explorer: amoy.polygonscan.com

2. **blockchain/scripts/deploy-amoy.js** (NEW)
   - Replaces deploy-mumbai.js
   - Same deployment logic, Amoy-specific logging
   - Network: polygonAmoy

3. **blockchain/scripts/verify-amoy.js** (NEW)
    - Replaces verify-mumbai.js
    - Uses shared verification utility: `blockchain/scripts/utils/verify-contracts.js`
    - All verification logic now unified across Mainnet, Amoy, and Mumbai
    - Environment variables: *_AMOY
    - Features: Retry logic, timeout handling, constructor argument validation

4. **blockchain/hardhat.config.js** (UPDATED)
   - Added `polygonAmoy` network configuration
   - Chain ID: 80002
   - RPC URL: https://rpc-amoy.polygon.technology/

5. **blockchain/package.json** (UPDATED)
   - Added `deploy:amoy` script
   - Added `verify:amoy` script

---

## Troubleshooting

### Issue: "Already Verified" Error

**Cause:** Contract already verified on PolygonScan

**Solution:** The verification scripts handle this automatically. You'll see:
```
✅ <Contract> already verified!
   View: https://amoy.polygonscan.com/address/<address>
```

### Issue: "Contract not yet indexed"

**Cause:** PolygonScan hasn't indexed the contract yet (usually 2-5 minutes)

**Solution:**
1. Wait 2-5 minutes after deployment
2. Run `npm run verify:amoy` again
3. Or verify manually on amoy.polygonscan.com

### Issue: "Invalid API Key"

**Cause:** Incorrect `POLYGONSCAN_AMOY_API_KEY`

**Solution:**
1. Verify secret is set in GitHub repository settings
2. Get new API key from https://amoy.polygonscan.com/myapikey
3. Update secret and re-run workflow

### Issue: "Insufficient funds for gas"

**Cause:** Deployer wallet doesn't have enough AMOY MATIC

**Solution:**
1. Go to https://amoy.polygonscan.com/faucet
2. Request testnet MATIC
3. Wait for transaction to confirm
4. Re-run deployment workflow

### Issue: "Network mismatch"

**Cause:** Hardhat config pointing to wrong network

**Solution:** Check `hardhat.config.js` has correct `polygonAmoy` network:
```javascript
polygonAmoy: {
  url: process.env.POLYGON_AMOY_RPC_URL,
  chainId: 80002, // ← Must be 80002
  // ...
}
```

---

## Rollback Plan (If Needed)

If Amoy deployment fails and you need to revert to Mumbai:

1. **Revert workflows**: Delete `deploy-contracts-amoy.yml` and rename `deploy-contracts-mumbai.yml.original` back
2. **Revert scripts**: Delete `deploy-amoy.js` (verify-amoy.js uses shared utility, can be kept for compatibility)
3. **Revert hardhat.config.js**: Remove `polygonAmoy` network entry
4. **Revert package.json**: Remove `deploy:amoy` and `verify:amoy` scripts

**Note:** Mumbai is read-only and will be deprecated completely in future. Rollback is only for emergency testing.

---

## Additional Resources

- **Polygon Amoy Documentation**: https://docs.polygon.technology/pos/reference/rpc-endpoints/
- **Amoy Explorer**: https://amoy.polygonscan.com/
- **Amoy Faucet**: https://amoy.polygonscan.com/faucet
- **Hardhat Network Config**: https://docs.polygon.technology/tools/dApp-development/common-tools/hardhat/
- **PolygonScan Verification**: https://docs.polygon.technology/tools/smart-contracts/polygonscan/

---

## Checklist

Before deploying to Amoy:

- [ ] Updated GitHub secrets: `POLYGON_AMOY_RPC_URL`, `POLYGONSCAN_AMOY_API_KEY`
- [ ] Updated local `.env` with Amoy RPC URL and API key
- [ ] Reviewed updated `hardhat.config.js` has `polygonAmoy` network
- [ ] Checked `package.json` has `deploy:amoy` and `verify:amoy` scripts
- [ ] Obtained testnet MATIC from https://amoy.polygonscan.com/faucet
- [ ] Reviewed migration impact on application configuration

After deploying to Amoy:

- [ ] Successfully deployed all contracts to Amoy (Chain ID: 80002)
- [ ] Verified all contracts on https://amoy.polygonscan.com/
- [ ] Updated API `.env` with new contract addresses
- [ ] Updated frontend `.env.local` with new contract addresses
- [ ] Tested contract functionality on Amoy
- [ ] Archived Mumbai workflow (renamed to `deploy-contracts-mumbai.yml.deprecated`)

---

## Migration Complete

Once all steps are completed:
- ✅ All workflows updated for Amoy testnet
- ✅ All deployment/verification scripts updated
- ✅ Documentation updated
- ✅ GitHub secrets configured
- ✅ Contracts deployed and verified on Amoy
- ✅ Application updated with new addresses

**Result:** Mumbai → Amoy migration complete! 🎉
