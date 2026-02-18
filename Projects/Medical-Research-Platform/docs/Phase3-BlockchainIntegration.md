# Phase 3: Blockchain Integration

## Overview
Phase 3 implements blockchain functionality for the Medical Research Platform, including smart contract interactions, event monitoring, and deployment scripts.

## Completed Tasks

### 3.1 Contract Service Layer ✅
**File:** `api/services/contract.service.ts`

Implemented a singleton service that manages blockchain interactions using ethers.js:

**Features:**
- Provider management with automatic network detection
- Signer management from environment variables
- Contract instantiation with ABIs for both contracts
- Transaction wrapper functions:
  - `mintIdentity()` - Mint new identity NFTs
  - `setBorrowFee()` - Set access fees
  - `setData()` - Update data URIs
  - `requestAccess()` - Request data access with fee payment
  - `approveAccess()` - Approve access requests
  - `revokeAccess()` - Revoke access permissions
  - `getData()` - Retrieve data URI
- Transaction waiting and logging
- JWT-authenticated API endpoints

**API Endpoints:**
```
POST   /api/contracts/identity/mint
POST   /api/contracts/identity/fee
POST   /api/contracts/data/set
POST   /api/contracts/access/request
POST   /api/contracts/access/approve
POST   /api/contracts/access/revoke
GET    /api/contracts/data/:ownerId/:borrowerId
```

### 3.2 Blockchain Event Listeners ✅
**File:** `api/services/blockchain-event-listeners.service.ts`

Implemented real-time blockchain event monitoring:

**Monitored Events:**
1. `IdentityMinted` - When new identity tokens are minted
2. `BorrowFeeSet` - When access fees are updated
3. `AccessRequested` - When users request data access
4. `AccessApproved` - When access is approved
5. `AccessRevoked` - When access is revoked
6. `DataUpdated` - When data URIs are updated
7. `FeeTokenSet` - When fee token is changed

**Features:**
- Event subscription with ethers.js provider
- Automatic event logging to `api_audit` table
- Wallet-based filtering (subscribe/unsubscribe)
- Event statistics API

**API Endpoints:**
```
GET    /api/events                    - Paginated event history
GET    /api/events/stats              - Event counts by type
POST   /api/events/subscribe          - Subscribe to wallet events
DELETE /api/events/unsubscribe        - Unsubscribe from wallet events
```

**Database Schema:**
Events are stored in `api_audit` table:
```sql
CREATE TABLE api_audit (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Smart Contract Deployment Scripts ✅
**Files:**
- `ignition/modules/IdentityNFT.ts`
- `ignition/modules/DataAccessManager.ts`
- `ignition/modules/DeployAll.ts`
- `ignition/modules/README.md`

Created Hardhat Ignition deployment modules for production deployment:

**IdentityNFT Deployment:**
```typescript
// Deploys IdentityNFT contract with:
// - ERC-721 token name and symbol
// - Fee token (ERC-20 or native ETH)
// - Admin account configuration
```

**DataAccessManager Deployment:**
```typescript
// Deploys DataAccessManager with:
// - Reference to IdentityNFT contract
// - Admin account configuration
```

**DeployAll Orchestrator:**
```typescript
// Deploys both contracts sequentially:
// 1. IdentityNFT
// 2. DataAccessManager
// 3. Mints test owner token
// 4. Mints test borrower token
// 5. Sets default borrow fee
```

**Contract Changes:**
- Fixed OpenZeppelin v5 compatibility
- Updated imports for upgradeable contracts
- Fixed deprecated Counters (removed, using uint256)
- Added public `setTokenURI()` for data updates
- Made `requestAccess()` payable for ETH fees
- Implemented nested mapping for borrower-specific fees

**Deployment Commands:**
```bash
# Local deployment
npx hardhat ignition deploy ignition/modules/IdentityNFT.ts

# Sepolia deployment
npx hardhat ignition deploy --network sepolia ignition/modules/DeployAll.ts

# With parameters
npx hardhat ignition deploy ignition/modules/DeployAll.ts --token-name "Medical Identity" --default-fee 1000000000000000
```

## Smart Contract Design

### IdentityNFT.sol
ERC-721 token representing user identities with fee management.

**Key Functions:**
- `initialize(name, symbol, feeToken, admin)` - Contract initialization
- `mintIdentity(to, isOwner, tokenURI)` - Admin-only minting
- `setBorrowFee(ownerTokenId, borrowerTokenId, fee)` - Set per-borrower fees
- `setFeeToken(newToken)` - Change fee currency
- `setTokenURI(tokenId, uri)` - Update data URI (admin)

**Events:**
- `BorrowFeeSet(uint256 ownerTokenId, uint256 borrowerTokenId, uint256 fee)`
- `FeeTokenSet(address token)`
- `IdentityMinted` (via Transfer event)

**State Variables:**
- `borrowFee[borrowerTokenId][ownerTokenId]` - Nested fee mapping
- `feeToken` - ERC-20 token address (0x0 = native ETH)
- `_nextTokenId` - Token counter

### DataAccessManager.sol
Manages access requests and approvals for identity data.

**Key Functions:**
- `initialize(identityNFTAddress, admin)` - Contract initialization
- `setData(ownerTokenId, uri)` - Owner updates data URI
- `requestAccess(borrowerTokenId, ownerTokenId)` - Request access (payable)
- `approveAccess(borrowerTokenId, ownerTokenId)` - Owner approves request
- `revokeAccess(borrowerTokenId, ownerTokenId)` - Owner revokes access
- `getData(ownerTokenId, borrowerTokenId)` - Retrieve authorized data

**Events:**
- `AccessRequested(uint256 borrowerId, uint256 ownerId)`
- `AccessApproved(uint256 borrowerId, uint256 ownerId)`
- `AccessRevoked(uint256 borrowerId, uint256 ownerId)`
- `DataUpdated(uint256 ownerId)`

**Access Logic:**
- Fees are automatically transferred from borrower to owner
- ERC-20 fees use `safeTransferFrom`
- Native ETH fees use `msg.value`
- Reentrancy protection on `requestAccess`

## Environment Variables

```env
# Blockchain Configuration
IDENTITY_NFT_ADDRESS=0xDeployedAddress
DATA_ACCESS_MANAGER_ADDRESS=0xDeployedAddress
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_PRIVATE_KEY=0xPrivateKey

# For Hardhat deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=0xPrivateKey
```

## Dependencies Installed

```json
{
  "ethers": "^6.13.0",
  "@openzeppelin/contracts-upgradeable": "^5.0.0",
  "@openzeppelin/contracts": "^5.0.0",
  "@nomicfoundation/hardhat-ethers": "^3.0.0",
  "@nomicfoundation/hardhat-toolbox-mocha-ethers": "^4.0.0"
}
```

## Contract ABIs

Generated ABIs are available in `artifacts/contracts/`:
- `IdentityNFT.sol/IdentityNFT.json`
- `DataAccessManager.sol/DataAccessManager.json`

These ABIs are used by `contract.service.ts` for contract interactions.

## Security Considerations

1. **Access Control:** All critical functions use `onlyRole(DEFAULT_ADMIN_ROLE)` or `onlyTokenOwner`
2. **Reentrancy:** `requestAccess()` has `nonReentrant` modifier
3. **Safe Transfers:** ERC-20 transfers use `safeTransferFrom`
4. **UUPS Upgradeable:** Both contracts use UUPS proxy pattern with `_authorizeUpgrade`
5. **Rate Limiting:** API endpoints should implement rate limiting (Phase 5)

## Testing

### Local Testing
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local hardhat network
npx hardhat ignition deploy ignition/modules/DeployAll.ts
```

### Event Listener Testing
```bash
# Start API server
cd api
npm start

# Events will be logged to console and database
# POST to /api/events/subscribe to monitor specific wallets
```

## Next Steps

Phase 3 is complete. The following is ready for Phase 4:

**Phase 4: Workers & Processing**
- PDF generation utilities
- Complete worker implementations (consent-email, consent-sign, consent-submit, data-store)
- Data storage service (IPFS + S3)
- Worker health checks

## Files Created/Modified

### Created:
- `api/services/contract.service.ts`
- `api/routes/contract.routes.ts`
- `api/dto/contract.dto.ts`
- `api/services/blockchain-event-listeners.service.ts`
- `api/routes/blockchain-events.routes.ts`
- `ignition/modules/IdentityNFT.ts`
- `ignition/modules/DataAccessManager.ts`
- `ignition/modules/DeployAll.ts`
- `ignition/modules/README.md`
- `api/types/express.d.ts`

### Modified:
- `contracts/IdentityNFT.sol` - Fixed OpenZeppelin v5 compatibility
- `contracts/DataAccessManager.sol` - Fixed OpenZeppelin v5 compatibility
- `hardhat.config.ts` - Added networks and plugins
- `api/server.ts` - Added contract and events routes
- `package.json` - Added new dependencies

## Issues and Resolutions

### Issue 1: OpenZeppelin v5 Compatibility
**Problem:** Contracts used deprecated imports and functions
**Solution:** Updated to use correct v5 imports and replaced `_setupRole` with `_grantRole`

### Issue 2: Counters Deprecation
**Problem:** `_tokenIds.current()` not available in v5
**Solution:** Changed to simple `uint256 _nextTokenId` counter

### Issue 3: Nested Mapping Access
**Problem:** `borrowFee` was single-level but function expected nested
**Solution:** Changed to `mapping(uint256 => mapping(uint256 => uint256))`

### Issue 4: Payable Function
**Problem:** `msg.value` used in non-payable function
**Solution:** Added `payable` modifier to `requestAccess()`

### Issue 5: Internal setTokenURI
**Problem:** `setTokenURI` is internal in ERC721URIStorageUpgradeable
**Solution:** Added public wrapper in IdentityNFT contract

## Architecture Overview

```
┌─────────────────┐
│   API Layer    │
│  (Express.js)   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Contract Service (Singleton)       │
│  - Provider Management            │
│  - Signer Management            │
│  - Transaction Wrappers          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Blockchain (Ethereum/Sepolia)   │
│  - IdentityNFT Contract          │
│  - DataAccessManager Contract      │
└────────┬─────────────────────────┘
         │
         │ (Events)
         ▼
┌──────────────────────────────────────┐
│  Event Listener Service           │
│  - Subscribe to Events           │
│  - Log to Database             │
│  - Filter by Wallet             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  PostgreSQL (api_audit table)     │
│  - Event Records               │
│  - Timestamps                 │
│  - Details (JSONB)            │
└─────────────────────────────────┘
```

## Documentation References

- [Hardhat Ignition Documentation](https://hardhat.org/ignition)
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
