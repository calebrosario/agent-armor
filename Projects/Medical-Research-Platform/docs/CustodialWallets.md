## 1️⃣  What a **custodial wallet** actually is

| Feature | Custodial | Non‑custodial |
|--------|-----------|---------------|
| **Private keys** | Stored & controlled by the service (you) | Stored & controlled by the user |
| **Security model** | Server‑side threat surface, audit logs | User‑side threat surface, user must keep keys safe |
| **Compliance** | Easier to implement KYC/AML, can lock/unlock wallets | Harder – you cannot enforce KYC on a user‑owned key |
| **UX** | “One‑click” transfers, no seed‑phrase management | User must import/export seed, sign transactions locally |
| **Regulatory** | Often treated as a money‑service business | Usually not, but depends on jurisdiction |

> **Bottom line** – A custodial wallet lets you build a *“digital bank”* for your users: they see a UI, you keep the keys, and you can run smart‑contract logic on their behalf.

---

## 2️⃣  High‑level architecture

```
+-----------------+          +---------------------+          +--------------------+
|  Web / Mobile   | <------> |   Node.js API       | <------> |  Ethereum JSON RPC |
|   (React/React  |          | (Express + Ethers)  |          |  (Infura / Alchemy)|
|   Native / Expo)|          +---------------------+          +--------------------+
+-----------------+             |  ^   |  ^  |  ^
                                 |  |   |  |  |
                                 |  |   |  |  |
                                 v  v   v  v  v
+----------------+   +----------+  +------------+   +---------------------+
|  DB (Postgres) |   |  Cache   |  |  Vault/HSM |   |  Crypto / Crypto   |
|  (wallet_meta) |   |  (Redis) |  | (secrets)  |   |  Service (scrypt)  |
+----------------+   +----------+  +------------+   +---------------------+
        ^               ^             ^                ^
        |               |             |                |
        |               |             |                |
        +---------------+-------------+----------------+
```

* **`wallet_meta` table** – stores the *address*, an **encrypted private key** and a link to the user’s **identityNFT**.
* **Vault/HSM** – the *real* encryption‑key is stored out‑of‑band so that a database breach alone does not expose any private keys.
* **API** – owns the Ethers `Wallet` instances on demand, signs and broadcasts transactions on behalf of the user.

---

## 3️⃣  Creating a custodial wallet

### 3.1  Generate & encrypt the key

```js
// utils/keyManager.js
import { Wallet } from 'ethers';
import { encrypt, decrypt } from 'crypto'; // nodejs crypto
import { getVaultKey } from '../config/vault.js'; // HSM‑style key

export async function createCustodialWallet(userPassword) {
  // 1️⃣  Generate an Ethers wallet
  const wallet = Wallet.createRandom();

  // 2️⃣  Derive an encryption key from the user‑supplied password
  //      (or use a KMS/HSM key + per‑user IV)
  const { key, iv } = await deriveKeyFromPassword(userPassword);

  // 3️⃣  Encrypt the private key
  const cipher = encrypt('aes-256-gcm', key, iv);
  const encryptedPk = Buffer.concat([cipher.update(wallet.privateKey), cipher.final()]).toString('hex');

  // 4️⃣  Persist to DB
  await knex('wallet_meta')
    .insert({
      user_id: wallet.ownerId,          // whatever you want
      address: wallet.address,
      encrypted_private_key: encryptedPk,
      iv: iv.toString('hex'),
      created_at: new Date()
    });

  return wallet.address; // send the address back to the UI
}
```

* **Password‑based encryption** is optional if you use an HSM or a dedicated vault (e.g., AWS KMS, HashiCorp Vault).
  In that case the `key` in step 2 would be an HSM key handle and you would call the vault to do the encryption, storing only the encrypted blob in the DB.

### 3.2  Persisting the *IdentityNFT* and linking

When the user is registered:

```js
// POST /api/auth/register
async function register(req, res) {
  const { email, password } = req.body;
  // 1️⃣  create user row
  const user = await knex('users').insert({ email }).returning('*');

  // 2️⃣  mint an IdentityNFT to a newly created address
  const address = await createCustodialWallet(password); // from 3.1

  // 3️⃣  mint NFT (you need a smart‑contract helper)
  await identityNFT.mint(address, { tokenURI: buildTokenURI(user.id) });

  // 4️⃣  link address in users table
  await knex('users')
    .where({ id: user.id })
    .update({ wallet_address: address });

  // 5️⃣  create a session / JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token, address });
}
```

> **Why the wallet is stored in the user table?**
> It lets you quickly look up the wallet when a request arrives.

---

## 4️⃣  Signing transactions on behalf of the user

### 4.1  The “send‑money” endpoint

```js
// POST /api/wallet/transfer
// body: { to: '0x...', amount: '0.1' }
async function transfer(req, res) {
  const { to, amount } = req.body;
  const user = await req.user;                 // pulled by your JWT middleware

  // 1️⃣  pull the encrypted key from DB
  const meta = await knex('wallet_meta')
    .where({ user_id: user.id })
    .first();

  // 2️⃣  decrypt it (you can use the same `decrypt()` from keyManager.js)
  const pk = await decryptCustodialPk(meta, user.password); // you passed the user’s password earlier

  // 3️⃣  create a temporary ethers wallet
  const signer = new Wallet(pk, provider);

  // 3️⃣  build the transaction
  const tx = {
    to,
    value: ethers.utils.parseEther(amount),
    gasLimit: 21000,
    gasPrice: await provider.getGasPrice()
  };

  // 4️⃣  sign & send
  const sentTx = await signer.sendTransaction(tx);

  // 5️⃣  respond with the tx hash
  res.json({ txHash: sentTx.hash });
}
```

> **Note** – In a real‑world service you would **never** expose the raw private key to the browser; the server signs the tx, sends it to the network, and returns the *transaction hash* to
the client.
> The user’s UI simply shows “Transfer sent – `0x…hash`”.

### 4.2  Interacting with the **DataAccessManager** smart contract

The `DataAccessManager` is a *permission‑oriented* contract that expects calls from **IdentityNFT holders**.
Because your custodial wallet is the owner of the address, you can call it like any other function:

```js
// POST /api/data/request-access
// body: { resourceId: '123', purpose: 'analysis' }
async function requestAccess(req, res) {
  const { resourceId, purpose } = req.body;
  const user = await req.user;

  // Pull and decrypt the key as above (re‑use a helper)
  const pk = await getDecryptedKeyForUser(user.id);

  // Build the ethers Wallet
  const signer = new Wallet(pk, provider);

  // Call the DataAccessManager contract
  const tx = await dataAccessManager
    .connect(signer)
    .grantAccess(resourceId, ethers.utils.id(purpose));

  res.json({ txHash: tx.hash });
}
```

*If you want to keep a record of the *request* (for audits or later UI) store the tx hash in a `data_access_requests` table.*

---

## 5️⃣  Node.js API patterns for a custodial service

| Route | Purpose | Implementation detail |
|-------|---------|-----------------------|
| `POST /wallet/create` | Create a new custodial wallet | `createCustodialWallet(password)` |
| `POST /wallet/transfer` | Move ETH or ERC‑20 | Decrypt key → sign → broadcast |
| `GET /wallet/balance` | Read balance (no private key needed) | `provider.getBalance(address)` |
| `POST /consent/grant` | Grant a *DataConsent* to a dApp | `DataAccessManager` contract call via custodial wallet |
| `POST /consent/revoke` | Revoke | Same as above |
| `GET /identity` | Return the user’s identityNFT metadata | `identityNFT.ownerOf(address)` + IPFS fetch |

> **All state‑changing calls must go through the *custodial wallet* layer** – this is what turns a “cold” key into a “hot” bank account.

---

## 5️⃣.1  Helper to decrypt on demand

```js
// utils/keyManager.js
export async function decryptCustodialPk(userId, password) {
  const meta = await knex('wallet_meta')
    .where({ user_id: userId })
    .first();

  const { key, iv } = await deriveKeyFromPassword(password);
  const plainPkHex = decrypt('aes-256-gcm', key, Buffer.from(meta.iv, 'hex'))
    .update(Buffer.from(meta.encrypted_private_key, 'hex'))
    .final()
    .toString('hex');

  return plainPkHex;
}
```

You can cache the decrypted key for the life of a request, or keep an in‑memory pool of `Wallet` objects if you expect a lot of traffic.

---

## 6️⃣  Security & Compliance Checklist

| Item | Why it matters | How to mitigate |
|------|----------------|-----------------|
| **Private‑key encryption** | Prevents on‑demand extraction even if DB is breached | Use a per‑user KDF + HSM or a dedicated vault. |
| **Password policies** | Weak passwords mean brute‑force risk | Enforce minimum length + use argon2id + rate‑limit |
| **Key rotation** | Stolen key can’t be used forever | Allow periodic re‑encryption with a new IV or HSM key |
| **Audit logging** | Regulatory bodies will want a record of who moved funds | Log `user_id`, `to`, `value`, `txHash`, `timestamp` |
| **KYC/AML** | Custodial wallets are usually money‑service businesses | Integrate a KYC provider (Jumio, Onfido) at signup |
| **GDPR / e‑Privacy** | You are the data controller | Store minimal PII, use encryption at rest, have a “right to be forgotten” endpoint that deletes all user data + wallet |
| **Denial‑of‑Service** | Node.js API could be flooded with signing requests | Rate‑limit, circuit‑breaker, or use a payment‑model for heavy calls |
| **Smart‑contract upgrade** | IdentityNFT or DataAccessManager may need upgrades | Use a proxy pattern (OpenZeppelin’s `TransparentUpgradeableProxy`) and keep your API happy with new ABI |

> **Regulatory note** – In the EU a custodial wallet is *potentially a “financial institution”* and in the U.S. it can be a “money‑service business” (MSB).  You’ll likely need a FinCEN
registration, AML/KYC, and possibly a state money‑transmission license.  Talk to a lawyer before launching.

---

## 7️⃣  Optional Enhancements

### 7.1  Threshold / multi‑sig custody

If you don’t want to hold **one** private key, split it:

| Component | Benefit |
|-----------|---------|
| **Gnosis Safe** | 2‑of‑3 or 3‑of‑5 multi‑sig contracts | Auditable, HSM‑free, user can still recover |
| **Threshold signature (TSS)** | No single point of failure, no private key in DB | Harder to implement, but you get “self‑service” security |

> *Custodial services that want to stay compliant can still use multi‑sig to reduce risk.*

### 7.2  Client‑side “meta‑transaction” fallback

If you decide to allow users to *sign locally*:

```js
// The API sends back a “meta‑tx” (unsigned tx) that the front‑end signs with MetaMask
// The server only broadcasts the signed tx.
```

But that turns it into a *semi‑custodial* approach and defeats the “no seed‑phrase” UX.

---

## 8️⃣  Bringing it all together

1. **User signs up** → the API creates a *custodial wallet* (private key → encrypted → DB) and mints an **IdentityNFT** to that address.
2. **Every API call** that needs on‑chain access first pulls the encrypted key, decrypts it (vault), builds an Ethers `Wallet`, signs the transaction, and pushes it to Infura/Alchemy.
3. **Smart‑contract interactions**
   * *IdentityNFT* – only minted during registration.
   * *DataAccessManager* – the server calls `grantAccess`, `revokeAccess`, etc. on behalf of the user.
4. **Security** – All raw keys are **never** sent to the browser, never stored in plain text, and the only thing a user sees is an address (the *public key*).
5. **UX** – The UI can show “Send 0.5 ETH → 0xAB…” and immediately display “✅ Transaction pending”.

---

## 9️⃣  Quick “starter‑kit” snippet

```bash
# ──────  Install dependencies  ──────
npm install express ethers knex pg redis dotenv bcrypt jsonwebtoken
```

```js
// server.js
import express from 'express';
import { json } from 'body-parser';
import { register, transfer } from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
import { createCustodialWallet } from './utils/keyManager.js';
import { identityNFT, dataAccessManager } from './contracts/index.js';

const app = express();
app.use(json());

// ---------- USER ROUTES ----------
app.post('/api/auth/register', register);

// ---------- WALLET ROUTES ----------
app.post('/api/wallet/transfer', requireAuth, transfer);

// ---------- START ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`💎 API listening on ${PORT}`));
```

> The code above is *minimal* – you’ll need to flesh out JWT middleware, error handling, rate‑limiting, etc., but it shows the “decrypted‑key → sign → send” cycle.

---

## 10️⃣  Takeaway

| Goal | Implementation |
|------|----------------|
| **Custodial key storage** | DB + vault‑encrypted private key |
| **IdentityNFT link** | Mint on user creation, store address in `users` table |
| **DataConsent & DataAccessManager** | API calls the contract with the user’s wallet (or a server‑side signature if you’re delegating access) |
| **Node.js integration** | Ethers `Wallet` instance per request, sign & broadcast |
| **Security & compliance** | KDF + HSM, audit logs, KYC, rate‑limiting |

> Build the wallet layer first (key creation + encryption).
> Then hook the smart‑contracts (`IdentityNFT`, `DataAccessManager`) into that layer.
> Finally expose simple REST endpoints that do **not** require the user to touch a seed phrase.

With the snippets above you have a *complete, ready‑to‑spin* custodial wallet that can serve non‑technical users while still giving them full data‑consent control through your NFT &
smart‑contract stack. Happy coding! 🚀