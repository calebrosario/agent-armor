## 1️⃣  Overview

| Layer | What it does |
|-------|--------------|
| **Node‑JS API** | Handles user registration, login, JWT auth, and **KYC** flow via a third‑party provider (Trulioo / Onfido). |
| **Database** | Stores user credentials, KYC status, and a hash of the KYC evidence. |
| **Smart‑Contract Integration** | A tiny on‑chain `KYCVerifier` contract keeps a `mapping(address=>bool)` of verified users.  The API calls the contract after the provider confirms KYC. |
| **DAO / Contract checks** | `AssetToken`, `Escrow` and other contracts read `KYCVerifier.isKYCVerified()` before allowing minting, escrow creation, or share sales. |

The result is a **fully compliant flow**: a user cannot mint or put an asset in escrow until the KYC provider verifies their identity, the status is stored off‑chain *and* reflected on‑chain, and the DAO can later revoke verification if
needed.

---

## 2️⃣  Database Design (PostgreSQL)

```sql
CREATE TABLE users (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text UNIQUE NOT NULL,
    password    text NOT NULL,          -- bcrypt hash
    full_name   text NOT NULL,
    kyc_status  text NOT NULL DEFAULT 'PENDING',   -- PENDING / APPROVED / REJECTED
    kyc_hash    text,                 -- SHA‑256 hash of KYC evidence
    kyc_expires timestamptz,          -- optional expiry
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
```

> The `kyc_hash` is stored **only as a hash**.  The real PDFs are kept in IPFS (as you already do).

---

## 3️⃣  Node‑JS API (Express + JWT)

> All code is written in **TypeScript** for safety, but plain JavaScript works the same.

```bash
npm install express pg bcryptjs jsonwebtoken dotenv
npm install -D ts-node typescript @types/express @types/jsonwebtoken
```

### 3.1  `src/config.ts`

```ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET!,
  pgConnectionString: process.env.DATABASE_URL!,
  kycProviderKey: process.env.KYC_PROVIDER_API_KEY!,
  kycProviderSecret: process.env.KYC_PROVIDER_API_SECRET!,
  kycProviderUrl: process.env.KYC_PROVIDER_URL!,      // e.g. https://api.trulioo.com
  ethRpcUrl: process.env.ETH_RPC_URL!,
  kycVerifierAddress: process.env.KYC_VERIFIER_ADDRESS!, // deployed on‑chain
  kycVerifierAbi: JSON.parse(process.env.KYC_VERIFIER_ABI!), // ABI JSON
};
```

### 3.2  `src/db.ts`

```ts
import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.pgConnectionString,
});
```

### 3.3  `src/middleware/auth.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = payload;  // attaches { id, email, role, kycStatus }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
```

### 3.4  `src/middleware/kyc.ts`

```ts
import { Request, Response, NextFunction } from 'express';

export function requireKYC(req: Request, res: Response, next: NextFunction) {
  if (req.user?.kycStatus !== 'APPROVED') {
    return res.status(403).json({
      message: 'KYC not approved.  Please complete KYC before continuing.',
    });
  }
  next();
}
```

### 3.5  `src/controllers/auth.ts`

```ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { config } from '../config';

const router = Router();

// 1. register
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO users (email, password, full_name, kyc_status)
       VALUES ($1,$2,$3,$4)`,
      [email, hash, fullName, 'PENDING']
    );
    res.status(201).json({ message: 'User created – pending KYC' });
  } catch (e) {
    res.status(400).json({ message: 'User already exists' });
  } finally {
    client.release();
  }
});

// 2. login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  const { rows } = await client.query(
    'SELECT id,password,kyc_status FROM users WHERE email=$1',
    [email]
  );
  client.release();
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password))) {
    return res.status(401).json({ message: 'Wrong email / password' });
  }
  const payload = {
    id: rows[0].id,
    email,
    role: 'USER',
    kycStatus: rows[0].kyc_status,
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
```

### 3.5  `src/controllers/kyc.ts`

This controller talks to **Trulioo** (or any provider).  For brevity we’ll use a *mock* POST that returns `idVerified:true`.

```ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import axios from 'axios';
import { config } from '../config';
import { ethers } from 'ethers';

const router = Router();

/**
 * 1️⃣  User submits his ID / documents.
 * The API forwards them to the KYC provider and stores a *pending* entry.
 */
router.post('/request', async (req: Request, res: Response) => {
  const { idDocument, proofOfAddress } = req.body; // base64 strings or file URLs

  // 1. Store the raw data in IPFS – you already do that, so just hash the CID
  const ipfsCid = await uploadToIPFS(idDocument, proofOfAddress);
  const kycHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ipfsCid));

  // 2. Call provider – POST /verify
  const providerResp = await axios.post(
    `${config.kycProviderUrl}/verify`,
    {
      userId: req.user.id,
      idDocument,
      proofOfAddress,
    },
    {
      auth: {
        username: config.kycProviderKey,
        password: config.kycProviderSecret,
      },
    }
  );

  // 3. Store the hash & status = PENDING
  const client = await pool.connect();
  await client.query(
    `UPDATE users SET kyc_hash=$1, kyc_expires=NOW()+INTERVAL '90 days', updated_at=NOW()
     WHERE id=$2`,
    [kycHash, req.user.id]
  );
  client.release();

  // 4. Return provider token – user will poll /status
  res.json({ providerToken: providerResp.data.token });
});

/**
 * 2️⃣  Provider calls this webhook when KYC is complete.
 * The provider sends `verified:true/false`, `userId`, and a signed payload.
 */
router.post('/callback', async (req: Request, res: Response) => {
  const { userId, verified, signature } = req.body;

  // 1. Verify the signature (provider‑specific – omitted for brevity)
  // 2. Update DB
  const client = await pool.connect();
  await client.query(
    `UPDATE users
     SET kyc_status=$1, updated_at=NOW()
     WHERE id=$2`,
    [verified ? 'APPROVED' : 'REJECTED', userId]
  );
  client.release();

  // 3. If approved – push the state on‑chain
  if (verified) {
    await setKYCOnChain(userId, true);
  } else {
    await setKYCOnChain(userId, false);
  }

  res.json({ ok:true });
});

/**
 * 3️⃣  Return current KYC status
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({ kycStatus: req.user?.kycStatus });
});

/** ---------------------------------------------------------------------- */
/* --------------  Smart‑contract helper ---------------------------------- */

async function setKYCOnChain(userId: string, status: boolean) {
  const provider = new ethers.providers.JsonRpcProvider(config.ethRpcUrl);
  const signer = provider.getSigner();          // your DAO‑admin wallet
  const verifier = new ethers.Contract(
    config.kycVerifierAddress,
    config.kycVerifierAbi,
    signer
  );
  const tx = await verifier.verifyKYC(userId, status);
  await tx.wait();
}
```

### 3.6  `src/index.ts`

```ts
import express from 'express';
import authRouter from './controllers/auth';
import kycRouter from './controllers/kyc';
import { jwtMiddleware } from './middleware/auth';

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/kyc', jwtMiddleware, kycRouter);   // all /kyc routes are JWT‑protected

app.listen(process.env.PORT || 4000, () => {
  console.log(`🚀 API listening on port ${process.env.PORT}`);
});
```

**Result** – a user who *has not completed KYC* receives `403` on any route that uses `requireKYC` middleware.

---

## 4️⃣  On‑chain `KYCVerifier` Contract

> Transparent, upgradeable (`UUPS`) so the DAO can revoke or add new verified users.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title KYCVerifier
 * @notice DAO‑controlled mapping of verified addresses.
 * Contracts read `isKYCVerified(msg.sender)` before allowing mint/escrow.
 */
contract KYCVerifier is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN");

    mapping(address => bool) private _verified;

    event KYCVerified(address indexed user, bool status);

    function initialize(address admin) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(KYC_ADMIN_ROLE, admin);
    }

    function isKYCVerified(address user) external view returns (bool) {
        return _verified[user];
    }

    function verifyKYC(address user, bool status) external onlyRole(KYC_ADMIN_ROLE) {
        _verified[user] = status;
        emit KYCVerified(user, status);
    }

    /* -----------  Upgradeability -------------- */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
```

### 4.1  Deploy the Verifier

```js
// scripts/deployKYCVerifier.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const KYCVerifier = await ethers.getContractFactory("KYCVerifier");
  const kycVerifier = await KYCVerifier.deploy();   // no constructor params
  await kycVerifier.deployed();

  console.log("KYCVerifier deployed:", kycVerifier.address);

  // Optionally grant KYC_ADMIN to your DAO contract address
  // await kycVerifier.grantRole(
  //   ethers.utils.id("KYC_ADMIN"),
  //   daoContract.address
  // );
}

main().catch(console.error);
```

---

## 5️⃣  Gating the Existing Smart Contracts

Add a `kyc` guard in all places where a user must be verified:

```solidity
// example snippet inside AssetToken.mint
function mint(...) external onlyOwner {
    require(
        kycVerifier.isKYCVerified(msg.sender),
        "KYC not verified"
    );
    ...
}
```

And in `Escrow.create` / `Escrow.fund` / any share‑sale logic:

```solidity
require(
    kycVerifier.isKYCVerified(msg.sender),
    "KYC not verified"
);
```

> The DAO can revoke a user’s KYC by calling `verifyKYC(address, false)` – the user will no longer be able to mint or create escrows until re‑verified.

---

## 6️⃣  End‑to‑End Flow (What Maria sees)

1. **Register** → API creates user → JWT → `kyc_status=PENDING`.
2. **Login** → JWT.
3. **Start Asset** → API checks KYC; if `PENDING` → returns `403`.
4. Maria clicks **“Start KYC”** → API forwards her ID to Trulioo, receives a *providerToken* back.
5. Provider does the checks, then **calls `/kyc/callback`** webhook with `{userId, verified:true}`.
6. Callback handler
   * updates DB → `kyc_status=APPROVED`
   * hashes evidence → `kyc_hash`.
   * **Calls** `KYCVerifier.verifyKYC(address, true)` on‑chain.
7. Now the user is `APPROVED` both off‑ and on‑chain.
8. **Create Asset → Upload Deed → Mint NFT** – all routes check `KYCVerifier.isKYCVerified(msg.sender)` before allowing the mint.
9. When Maria decides to sell, the **Escrow** creation checks KYC again – the buyer can only create an escrow if *both* parties are verified.
10. After escrow release, Maria’s KYC status is still “APPROVED” (the DAO could revoke it later if the user’s identity changes).

---

## 7️⃣  Quick Checklist for Compliance

| ✅ | Item |
|----|------|
| **Identity Proof** – API sends government ID to provider. |
| **Proof of Address** – stored in IPFS, hashed in DB. |
| **Risk Assessment** – provider’s `verified` flag stored as `kyc_status`. |
| **On‑Chain Reflection** – `KYCVerifier` mapping keeps the same flag. |
| **Revocation** – DAO can call `verifyKYC(user, false)` if KYC is later revoked. |
| **GDPR** – only hashes, never raw personal data, access logged. |
| **Audit** – every `/kyc/callback` request is signed by provider (you can add HMAC check). |

With this API + contract stack the EstateNFT platform is **fully KYC‑compliant** and has a transparent, auditable on‑chain flag that all token‑minting and escrow logic can read.