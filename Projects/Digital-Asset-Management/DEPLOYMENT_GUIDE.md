# EstateNFT - Deployment Guide

## ✅ Completed Setup

### Smart Contracts
All 4 core contracts compile successfully with OpenZeppelin v4.9.0:
- ✅ **AssetToken.sol** - ERC-1155 NFT for property deeds
- ✅ **ShareToken.sol** - ERC-20 for fractional ownership
- ✅ **Escrow.sol** - DAO-governed escrow
- ✅ **KYCVerifier.sol** - Access control

### Backend Integration
- ✅ **Web3Auth** integrated in wallet service
- ✅ **Event Listener** service implemented
- ✅ **IPFS integration** for document storage
- ✅ **Metadata extraction** from PDFs

### Frontend Preparation
- ✅ Contract ABIs copied to `frontend/src/lib/abis/`
- ✅ Configuration files created:
  - `frontend/src/lib/contracts.ts`
  - `frontend/src/lib/constants.ts`
  - `frontend/.env.local` template

### Deployer Wallet
**Address**: \`0x42c9f51781b021C03F8Fa18EC594b9703de15ac5\`

**⚠️ CRITICAL - SAVE THIS MNEMONIC:**
\`\`\`
human torch spice obtain crumble sustain left foster pitch child apple act
\`\`\`

**Cannot be recovered if lost!**

---

## ⚠️ Deployment Blocked by Network Issue

### Problem
\`\`\`
Error: SSL alert number 112 - tlsv1 unrecognized name
\`\`\`

### Attempted Solutions (All Failed)
1. Multiple RPC endpoints tried (Ankr, MaticVigil, BlockPI, Blast API)
2. Environment variables set (NODE_TLS_PROTOCOL_VERSION)
3. HTTP vs HTTPS protocols tested
4. OpenZeppelin v4 downgrade

### Root Cause
Likely Node.js/OpenSSL incompatibility or network firewall blocking RPC connections

---

## 🎯 Recommended Solution: Use Remix IDE

This is the **easiest and most reliable** way to deploy contracts.

### Step-by-Step Guide

#### 1. Prepare Your Environment
1. Install MetaMask browser extension
2. Add Mumbai testnet to MetaMask:
   - Network Name: Polygon Mumbai Testnet
   - RPC URL: https://rpc-mumbai.blockpi.xyz/v1/rpc
   - Chain ID: 80001
   - Currency Symbol: MATIC

#### 2. Go to Remix
1. Visit https://remix.ethereum.org/
2. Create new files:
   - \`AssetToken.sol\` (from \`/blockchain/contracts/\`)
   - \`ShareToken.sol\` 
   - \`Escrow.sol\`
   - \`KYCVerifier.sol\`

#### 3. Compile Each Contract
1. Click the "Compile" tab in Remix
2. Ensure no compilation errors
3. Copy the ABI for each contract

#### 4. Deploy Contracts
**Order Matters - Deploy in this sequence:**

1. **KYCVerifier** (Non-upgradeable)
   - Click "Deploy" tab
   - Select constructor parameter: \`admin\` = your wallet address
   - Click "Deploy"
   - Save the contract address

2. **AssetToken** (Non-upgradeable)
   - Constructor: no parameters
   - Click "Deploy"
   - Save the contract address

3. **ShareToken** (Non-upgradeable)
   - Constructor parameters:
     - \`name\`: "EstateNFT Shares"
     - \`symbol\`: "ESHARES"
     - \`assetToken\`: AssetToken contract address (from step 2)
     - \`assetTokenId\`: 1
   - Click "Deploy"
   - Save the contract address

4. **Escrow** (Non-upgradeable)
   - Constructor: no parameters
   - Click "Deploy"
   - Save the contract address

#### 5. Verify Contracts on Polygonscan
1. For each deployed contract:
   - Go to https://mumbai.polygonscan.com/
   - Paste the contract address
   - Click "Verify and Publish"
   - Select "Solidity (Single file)"
   - Select Compiler version: 0.8.24
   - Copy and paste contract source
   - Click "Verify"
   - Wait for contract to show as "Verified"

#### 6. Update Environment Files

**Blockchain (\`blockchain/.env\`):**
\`\`\`bash
NFT_CONTRACT_ADDRESS=<AssetToken address>
ESCROW_CONTRACT_ADDRESS=<Escrow address>
SHARE_TOKEN_CONTRACT_ADDRESS=<ShareToken address>
KYC_VERIFIER_ADDRESS=<KYCVerifier address>
\`\`\`

**Frontend (\`frontend/.env.local\`):**
\`\`\`bash
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=<AssetToken address>
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=<Escrow address>
NEXT_PUBLIC_SHARE_TOKEN_CONTRACT_ADDRESS=<ShareToken address>
NEXT_PUBLIC_KYC_VERIFIER_ADDRESS=<KYCVerifier address>
\`\`\`

---

## 🚀 Alternative: Manual Deployment via Alternative RPC

If you want to continue with Hardhat deployment, try these steps:

### 1. Get a Free Alchemy API Key
1. Go to https://www.alchemy.com/
2. Sign up (free tier)
3. Create new app
4. Select "Polygon Mumbai"
5. Copy the HTTP URL (starts with https://polygon-mumbai...)

### 2. Update Hardhat Config
Update \`blockchain/hardhat.config.js\`:
\`\`\`javascript
polygonMumbai: {
  url: "https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 80001,
  gasPrice: 20000000000,
}
\`\`\`

### 3. Fund Your Deployer Wallet
Send ~1 MATIC to: \`0x42c9f51781b021C03F8Fa18EC594b9703de15ac5\`

**Faucets:**
- https://faucet.polygon.technology/
- https://mumbaifaucet.com/
- https://quicknode.com/faucet/polygon-mumbai

### 4. Deploy
\`\`\`bash
cd blockchain
npm run deploy:mumbai
\`\`\`

---

## 📋 Post-Deployment Tasks

After contracts are deployed:

### 1. Transfer Ownership to DAO (Manual)
Currently, deploy script includes DAO setup, but if deploying via Remix:

For each contract with \`Ownable\`:
1. Go to Remix "Deployed Contracts" tab
2. Find the contract
3. Click "At Address"
4. Call \`transferOwnership(timelockAddress)\`
5. Repeat for all contracts

### 2. Setup Timelock and Governor
If not using the deploy script's built-in DAO setup, you'll need to deploy:

1. **TimelockController** from OpenZeppelin
2. **Governor** contract
3. Configure roles and permissions

### 3. Grant KYC Admin Role
1. Go to KYCVerifier contract
2. Call \`grantRole(KYC_ADMIN_ROLE, timelockAddress)\`

### 4. Test the Full Flow
1. Start API server: \`cd api && npm start:dev\`
2. Start frontend: \`cd frontend && npm run dev\`
3. Register a new user
4. Create an asset
5. Upload deed
6. Mint NFT
7. Create escrow
8. Fund escrow
9. Release escrow

---

## 📊 Project Status Summary

| Component | Status | Notes |
|-----------|--------|--------|
| Smart Contracts | ✅ Ready | All 4 compile successfully |
| Backend API | ✅ Ready | Web3Auth integrated |
| Frontend | ✅ Ready | ABIs and config prepared |
| Deployment | ⏸️ Blocked | SSL/RPC network issue |
| Deployer Wallet | ⏸️ Unfunded | Needs ~1 MATIC |
| DAO Governance | ⏸️ Pending | Requires deployed contracts |

---

## 🎓 Key Files Reference

### Contract Files
\`\`\`
/blockchain/contracts/AssetToken.sol
/blockchain/contracts/ShareToken.sol
/blockchain/contracts/Escrow.sol
/blockchain/contracts/KYCVerifier.sol
\`\`\`

### Configuration Files
\`\`\`
/blockchain/.env - Deployment wallet and RPC
/blockchain/hardhat.config.js - Network config
/api/.env - API config
/frontend/.env.local - Frontend environment
\`\`\`

### Frontend Integration
\`\`\`
/frontend/src/lib/abis/ - Contract ABIs
/frontend/src/lib/contracts.ts - Contract addresses
/frontend/src/lib/constants.ts - Network config
\`\`\`

---

## 🔐 Security Reminders

1. **NEVER** commit \`.env\` files with real private keys
2. **NEVER** share deployer mnemonic publicly
3. **ALWAYS** verify contracts on Polygonscan before mainnet deployment
4. **USE** Remix deployment for testnet (simplest and most reliable)
5. **CONSIDER** using hardware wallet for production deployments
6. **ALWAYS** use different wallets for testnet vs mainnet

---

## 📞 Troubleshooting

### Remix Deployment Fails
- Ensure MetaMask is connected to Mumbai testnet (Chain ID: 80001)
- Check you have enough MATIC for gas (~0.1 MATIC should suffice)
- Check contract constructor parameters are correct

### Polygonscan Verification Fails
- Ensure compiler version matches (Solidity 0.8.24)
- Copy the EXACT source code (no modifications)
- Wait 1-2 minutes after deployment before verifying

### Frontend Connection Fails
- Check contract addresses in \`.env.local\` are correct
- Ensure API server is running on port 3001
- Check browser console for error messages

---

**Last Updated**: January 21, 2026
**Status**: Ready for deployment via Remix IDE
