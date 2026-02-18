## Flow‑Chart (sequence of actions)

Below is a **complete, ready‑to‑paste Mermaid sequence diagram** that shows the full lifecycle of an IdentityNFT
and DataAccessManager interaction for **two distinct wallets** – one holding the *Owner* token and the other
holding the *Borrower* token.

```mermaid
sequenceDiagram
    participant O as Owner Wallet
    participant B as Borrower Wallet
    participant P as Proxy
    participant ID as IdentityNFT
    participant DM as DataAccessManager

    %% -----------------------------
    %% 1️⃣ Owner mints his identity token
    %% -----------------------------
    Note over O: Owner mints an ERC‑721 token that
    Note over O: represents the *Owner* identity.
    O->>P: tx (mintIdentity(to=O, isOwner=true))
    P->>ID: forward(mintIdentity)
    ID-->>O: emits IdentityMinted(tokenId=ownerId)

    %% ---------------------------------------------------------------
    %% 2️⃣ Owner sets a borrowing fee
    %% ---------------------------------------------------------------
    Note over O: Owner sets a fee for borrowers (e.g., 0.05 ETH)
    O->>P: tx (setBorrowFee(ownerId, 0.05 ETH))
    P->>ID: forward(setBorrowFee)
    ID-->>O: emits BorrowFeeSet

    %% -----------------------------
    %% 3️⃣ Borrower mints his identity token
    %% -----------------------------
    Note over B: Borrower mints an ERC‑721 token that
    Note over B: represents the *Borrower* identity.
    B->>P: tx (mintIdentity(to=B, isOwner=false))
    P->>ID: forward(mintIdentity)
    ID-->>B: emits IdentityMinted(tokenId=borrowerId)

    %% -----------------------------
    %% 4️⃣ Owner stores data for his token
    %% -----------------------------
    Note over O: The Owner stores an off‑chain data URI
    Note over O: (e.g., an IPFS hash) that will be
    Note over O: accessed by approved Borrowers.
    O->>P: tx (setData(ownerTokenId, "ipfs://QmXYZ"))
    P->>DM: forward(setData)
    DM-->>O: emits DataUpdated(ownerTokenId)

    %% ---------------------------------------------------------------
    %% 5️⃣ Borrower requests access (and pays the fee)
    %% ---------------------------------------------------------------
    Note over B: Borrower wants to read the Owner’s data
    B->>P: tx (requestAccess(borrowerId, ownerId), value=0.05 ETH)
    P->>DM: forward(requestAccess)
    DM-->>B: emits AccessRequested

    %% -----------------------------
    %% 6️⃣ Owner approves the request
    %% -----------------------------
    Note over O: Owner reviews the request
    Note over O: and approves it, granting
    Note over O: temporary read‑access.
    O->>P: tx (approveAccess(borrowerTokenId, ownerTokenId))
    P->>DM: forward(approveAccess)
    DM-->>O: emits AccessApproved(borrowerTokenId, ownerTokenId)

    %% -----------------------------
    %% 7️⃣ Borrower reads the data
    %% -----------------------------
    Note over B: Borrower now reads the data URI
    Note over B: stored by the Owner.  The
    Note over B: contract checks the approval
    Note over B: before returning the URI.
    B->>P: tx (getData(ownerTokenId, borrowerTokenId))
    P->>DM: forward(getData)
    DM-->>B: returns dataUri

    %% -----------------------------
    %% 8️⃣  Owner revokes access
    %% -----------------------------
    Note over O: Owner may revoke access at any time.
    O->>P: tx (revokeAccess(borrowerTokenId, ownerTokenId))
    P->>DM: forward(revokeAccess)
    DM-->>O: emits AccessRevoked(borrowerTokenId, ownerTokenId)
```

### How to use this diagram

1. **Copy** the block above.
2. **Paste** it into any Markdown/mermaid‑enabled editor (GitHub README, VS Code preview, Typora, etc.).
3. The diagram will render a linear sequence of steps that involve **two distinct wallet actors**—`Owner Wallet`
and `Borrower Wallet`.

### Quick recap of the interactions

| Step | Owner | Borrower | Proxy | IdentityNFT | DataAccessManager |
|------|-------|----------|-------|-------------|-------------------|
| 1 | mints Owner NFT | – | forwards | mints | – |
| 2 | sets a borrowing fee | – | forwards | set fee | – |
| 3 | – | mints Borrower NFT | forwards | mints | – |
| 4 | sets data | – | forwards | – | updates data |
| 5 | – | requests access | forwards | – | logs request |
| 6 | approves request | – | forwards | – | logs approval |
| 7 | – | reads data | forwards | – | returns data |
| 8 | revokes access | – | forwards | – | logs revocation |

### Step‑by‑step

| Step | Actors | Action | Event |
|------|--------|--------|-------|
| **1** | User (Owner) | `mintIdentity(ownerNFT, true)` | `IdentityMinted` |
| **2** | User (Owner) | `setBorrowFee(ownerTokenId, fee)` | `BorrowFeeSet` |
| **3** | User (Borrower) | `mintIdentity(borrowerNFT, false)` | `IdentityMinted` |
| **4** | Owner | `setData(ownerTokenId, dataURI)` | `DataUpdated` |
| **5** | Borrower | `requestAccess(borrowerTokenId, ownerTokenId)` | `AccessRequested` |
| **5a** | Borrower | `requestAccess(borrowerTokenId, ownerTokenId)` with fee | `AccessRequested` & `AccessApproved` |
| **6** | Owner | `approveAccess(borrowerTokenId, ownerTokenId)` | `AccessApproved` |
| **7** | Borrower | `getData(ownerTokenId, borrowerTokenId)` | returns data |
| **8** | Owner | `revokeAccess(borrowerTokenId, ownerTokenId)` | `AccessRevoked` |

> The diagram shows **Proxy → Contract** forwarding.  Each external transaction is sent by a wallet; the proxy
forwards to the implementation that actually executes the logic.

---
