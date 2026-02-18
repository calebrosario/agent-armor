# Smart Contracts Documentation

## Overview

This document provides comprehensive documentation for the smart contracts in the Digital Asset Management Platform, including deployment, verification, and integration details.

---

## Contract Architecture

### Deployed Contracts

All contracts are deployed using the following order:

1. **KYCVerifier.sol** - Identity verification contract
2. **AssetToken.sol** (ERC-1155) - Asset NFT contract (UUPS upgradeable)
3. **ShareToken.sol** (ERC-20) - Fractional ownership shares (UUPS upgradeable)
4. **Escrow.sol** - Escrow contract (UUPS upgradeable)
5. **Governance.sol** - DAO governance (Timelock + Governor)

### Contract Features

- **OpenZeppelin 5.0** - Latest audited security patterns
- **UUPS Upgradeability** - Universal Upgradeable Proxy Standard
- **Polygon zkEVM Compatible** - Optimized for Polygon zkEVM (Chain ID 1101)
- **IPFS Integration** - Metadata stored on IPFS
- **DAO Governed** - Escrow controlled by decentralized governance

---

## Networks

### Mainnet (Production)

- **Network**: Polygon zkEVM
- **Chain ID**: 1101
- **RPC**: https://rpc-zkevm.poly.technology/
- **Explorer**: https://explorer.zkevm.poly.technology/
- **Explorer API**: https://api-explorer.zkevm.poly.technology/

### Amoy Testnet (Recommended)

- **Network**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC**: https://rpc-amoy.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com/
- **Explorer API**: https://api-amoy.polygonscan.com/
- **Faucet**: https://amoy.polygonscan.com/faucet

### Mumbai Testnet (Deprecated)

- **Network**: Polygon Mumbai Testnet
- **Chain ID**: 80001
- **Status**: ⚠️ **DEPRECATED** - Read-only, use Amoy instead
- **Explorer**: https://mumbai.polygonscan.com/

> **Important**: Mumbai testnet is deprecated. All new deployments should use Amoy testnet.

---

## Deployment

### Local Deployment

Deploy contracts to a local network:

```bash
cd blockchain
npx hardhat run scripts/deploy-mainnet.js --network localhost
```

### Testnet Deployment (Amoy)

Deploy contracts to Amoy testnet:

```bash
cd blockchain
npx hardhat run scripts/deploy-amoy.js --network polygonAmoy
```

Or use the npm script:

```bash
npm run deploy:amoy
```

### Mainnet Deployment

Deploy contracts to Polygon zkEVM mainnet:

```bash
cd blockchain
npx hardhat run scripts/deploy-mainnet.js --network polygonZkEVM
```

Or use the npm script:

```bash
npm run deploy:mainnet
```

### GitHub Actions Deployment

Use GitHub Actions workflows for automated deployment:

- **Amoy Testnet**: `.github/workflows/deploy-contracts-amoy.yml`
- **Mainnet**: `.github/workflows/deploy-contracts-mainnet.yml`

Trigger workflows manually via GitHub UI or by pushing to main branch.

---

## Contract Verification

### Unified Verification Utility

All contract verification is now handled by a **unified verification utility** that works across all networks:

**File**: `blockchain/scripts/utils/verify-contracts.js`

#### Features

- **Multi-network support**: Mainnet, Amoy, Mumbai
- **Automatic artifact parsing**: Reads deployment JSON files automatically
- **Retry logic**: Handles temporary network failures
- **Timeout handling**: Prevents hanging verifications
- **Constructor argument validation**: Ensures correct parameters
- **Batch verification**: Verifies multiple contracts in one run
- **Security checks**: Validates addresses and network configuration

#### How It Works

The verification utility:
1. Parses deployment artifacts from `blockchain/deployments/` directory
2. Extracts contract addresses, constructor arguments, and compiler settings
3. Calls PolygonScan API with correct verification parameters
4. Handles retry logic and timeout scenarios
5. Reports success/failure for each contract

### Verification Scripts

Network-specific wrapper scripts call the unified utility:

#### Amoy Testnet Verification

```bash
cd blockchain
npm run verify:amoy
```

Or:

```bash
node scripts/verify-amoy.js
```

#### Mainnet Verification

```bash
cd blockchain
npm run verify:mainnet
```

Or:

```bash
node scripts/verify-mainnet.js
```

#### Mumbai Testnet Verification (Deprecated)

```bash
cd blockchain
npm run verify:mumbai
```

Or:

```bash
node scripts/verify-mumbai.js
```

> **Note**: Mumbai verification is deprecated. Use Amoy testnet for all new deployments.

### Manual Verification

If automated verification fails, verify manually on PolygonScan:

1. Go to the contract address on the appropriate explorer:
   - Amoy: https://amoy.polygonscan.com/address/<contract-address>
   - Mainnet: https://explorer.zkevm.poly.technology/address/<contract-address>

2. Click "Verify and Publish"

3. Fill in:
   - **Compiler Type**: Solidity (Standard-Json-Input)
   - **Compiler Version**: 0.8.20
   - **License**: MIT
   - **Constructor Arguments**: See `blockchain/scripts/contract-config.js`

4. Upload the flattened contract file and constructor arguments

### Troubleshooting Verification

#### Error: "Already Verified"

**Cause**: Contract already verified on PolygonScan

**Solution**: The verification scripts handle this automatically. You'll see:
```
✅ <Contract> already verified!
   View: https://amoy.polygonscan.com/address/<address>
```

#### Error: "Contract not yet indexed"

**Cause**: PolygonScan hasn't indexed the contract yet (usually 2-5 minutes)

**Solution**:
1. Wait 2-5 minutes after deployment
2. Run verification script again
3. Or verify manually on the explorer

#### Error: "Invalid API Key"

**Cause**: Incorrect or missing PolygonScan API key

**Solution**:
1. Verify secret is set in GitHub repository settings
2. Get new API key from the explorer:
   - Amoy: https://amoy.polygonscan.com/myapikey
   - Mainnet: https://explorer.zkevm.poly.technology/myapikey
3. Update secret and re-run workflow

#### Error: "Insufficient funds for gas"

**Cause**: Deployer wallet doesn't have enough testnet MATIC

**Solution**:
1. Go to the testnet faucet:
   - Amoy: https://amoy.polygonscan.com/faucet
2. Request testnet MATIC
3. Wait for transaction to confirm
4. Re-run deployment workflow

---

## Contract Configuration

### Constructor Arguments

All constructor arguments are defined in `blockchain/scripts/contract-config.js`:

```javascript
module.exports = {
  KYCVerifier: {
    args: [] // Empty constructor
  },
  AssetToken: {
    args: ["ipfs://"] // Base URI for token metadata
  },
  ShareToken: {
    args: [
      "EstateNFT Shares", // Token name
      "ESHARES", // Token symbol
      "<assetTokenAddress>", // Asset token address (auto-filled)
      18 // Decimals
    ]
  },
  Escrow: {
    args: [] // Empty constructor
  },
  Governance: {
    args: [
      "<shareTokenAddress>" // Share token address (auto-filled)
    ]
  }
};
```

### Deployment Artifacts

After deployment, contract addresses and deployment details are saved to:

```
blockchain/deployments/
├── localhost/
│   └── <timestamp>-deployment.json
├── polygonAmoy/
│   └── <timestamp>-deployment.json
└── polygonZkEVM/
    └── <timestamp>-deployment.json
```

Each deployment JSON file contains:

```json
{
  "network": "polygonAmoy",
  "chainId": 80002,
  "timestamp": "2026-02-09T00:00:00.000Z",
  "contracts": {
    "KYCVerifier": {
      "address": "0x...",
      "constructorArgs": []
    },
    "AssetToken": {
      "implementation": "0x...",
      "proxy": "0x...",
      "constructorArgs": ["ipfs://"]
    }
    // ... other contracts
  }
}
```

---

## Integration

### Backend Integration

Use the `ContractService` in the NestJS backend to interact with contracts:

```typescript
import { ContractService } from './contract.service';

@Injectable()
export class SomeService {
  constructor(private contractService: ContractService) {}

  async getAssetTokenBalance(address: string): Promise<bigint> {
    return this.contractService.getAssetTokenBalance(address);
  }
}
```

### Frontend Integration

Use wagmi hooks for React frontend:

```typescript
import { useReadContract } from 'wagmi';
import { assetTokenABI } from '@/contracts/abis';

export function AssetBalance({ address }: { address: string }) {
  const { data: balance, isLoading } = useReadContract({
    address: assetTokenAddress,
    abi: assetTokenABI,
    functionName: 'balanceOf',
    args: [address]
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>Balance: {balance?.toString()}</div>;
}
```

---

## Security

### Best Practices

1. **Use Hardhat Ignition for Deployments**: Ignition provides better deployment safety
2. **Verify All Contracts**: Always verify on PolygonScan after deployment
3. **Use Multi-sig for Governance**: Deployer wallet should be multi-sig
4. **Audit Upgrade Logic**: Thoroughly test upgrade procedures
5. **Monitor Contracts**: Set up on-chain monitoring with OpenZeppelin Defender

### Upgrade Process

For UUPS upgradeable contracts:

1. Deploy new implementation contract
2. Call `upgradeTo()` on proxy with new implementation address
3. Verify new implementation on PolygonScan
4. Test functionality thoroughly

**Never upgrade to an unverified implementation!**

---

## Testing

### Unit Tests

Run unit tests for contracts:

```bash
cd blockchain
npx hardhat test
```

### Integration Tests

Run integration tests with LocalStack:

```bash
# Via GitHub Actions
gh workflow run test-contracts-localstack.yml
```

### Coverage Report

Generate coverage report:

```bash
cd blockchain
npx hardhat coverage
```

---

## References

- [Deployment Scripts](../blockchain/scripts/)
- [Verification Utility](../blockchain/scripts/utils/verify-contracts.js)
- [Contract ABIs](../blockchain/artifacts/contracts/)
- [Hardhat Network Config](https://docs.polygon.technology/tools/dApp-development/common-tools/hardhat/)
- [PolygonScan Verification](https://docs.polygon.technology/tools/smart-contracts/polygonscan/)

---

**Last Updated**: 2026-02-09
