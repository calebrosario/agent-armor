## 📚 **Data‑Compliance Spec & Cheat Sheet**
*(HIPAA, GDPR, CCPA – for a patient‑controlled data platform)*

> **Goal** – give you a single reference that tells you *what* each regulation demands and *how* to satisfy it in
a smart‑contract‑based, blockchain‑oriented product.
> **Scope** – only the core obligations that affect a data‑control platform that holds PHI (Health‑Mesh, etc.).

---

### 1️⃣  High‑Level Compliance Architecture

| Layer | HIPAA | GDPR | CCPA |
|-------|-------|------|------|
| **Data Storage** | Encrypted on‑chain pointers + off‑chain storage (HIPAA‑approved). | Encryption + pseudonymisation; audit logs in the chain. | Encryption; no unnecessary personal data. |
| **Consent & Consent‑Management** | *Business Associate Agreement (BA‑A)*; signed *Authorization*. | Consent must be *explicit*, *specific*, *freely given*, *informed*, *documented*. | Consent must be *verifiable* and *revocable* in 24 hrs. |
| **Access Control** | *Minimum necessary* principle & *role‑based access* (RBAC) via the `DataAccessManager`. | *Data minimisation* + *purpose limitation*; record *access logs* for audit. | *Opt‑out* rights for all personal data transactions. |
| **Security** | *Encryption at rest & in transit*, *audit logs*, *incident response plan*, *regular penetration tests*. | *Security by design* (ISO 27001), *encryption*, *data‑breach notification* ≤ 72 h. | *Security* & *incident response*; *breach notification* within 45 days. |
| **Data Subject Rights** | *Right to access*, *right to correction*, *right to deletion* (except for compliance & treatment). | *Right to access*, *right to rectification*, *right to erasure (“right to be forgotten”)*, *right to restrict processing*, *right to data portability*. | *Right to access*, *right to delete*, *right to correct*, *right to opt‑out of data sale* (including “do‑not‑sell” flag). |
| **Data Flow & Transfer** | No export of PHI outside the U.S. without proper safeguards (e.g., BA‑A, 42 CFR § 164.305). | No transfer of personal data outside the EU/EEA without adequacy decision or appropriate safeguards. | No sale of data to third parties without user opt‑in; data must stay within the U.S. unless user explicitly consents. |
| **Record‑Keeping** | 6‑year retention for PHI documents. | 1‑year retention of logs after completion of purpose. | 2‑year retention of consumer records. |
| **Governance & Accountability** | HIPAA requires *covered entity* & *business associate* roles. | GDPR mandates *Data Protection Officer (DPO)*, *risk‑assessment* & *Data Protection Impact Assessment (DPIA)*. | CCPA requires *privacy policy* and *notice* upon data collection. |

---

## 🗂️  Cheat Sheet –  Quick Reference

| Regulation | Key Definition | Who Is Affected | Data Types | Core Obligations | Rights to Enforce | Where It Matters in Your Platform |
|------------|----------------|-----------------|------------|------------------|-------------------|-----------------------------------|
| **HIPAA** (U.S.) | PHI – *Protected Health Information* | Patients, providers, payers | Clinical notes, imaging, lab results, billing info | • Minimum‑necessary<br>• Access audit logs<br>• Security rule (encryption, integrity)<br>• Business Associate Agreement (BA‑A) | • Right to access, correct, delete (except for treatment/compliance)<br>• Right to accounting of disclosures | • `IdentityNFT` holds signed authorization<br>• `DataAccessManager` enforces “minimum‑necessary” via fee & revocation |
| **GDPR** (EU) | PII – *Personal Data* (including “special category” health data) | EU citizens/Residents | Same as HIPAA, but includes biometric, genetic data | • Lawful basis: Consent, contract, legitimate interest<br>• Data minimisation & purpose limitation<br>• Pseudonymisation & encryption<br>• DPIA for high‑risk processing<br>• Data Protection Impact Assessment (DPIA) | • Right to access, rectification, erasure, restriction, portability, objection<br>• Right to be forgotten (erasure) | • Off‑chain audit logs → GDPR‑friendly “transparent logs”<br>• Token‑based consent records on‑chain (proof of consent) |
| **CCPA** (California) | Consumer Personal Data | California residents | Same as above, plus “pseudonymous data” (usernames, etc.) | • Notice at collection (type of data, purpose)<br>• Right to delete & opt‑out of sale<br>• No “do‑not‑sell” if user consents<br>• At‑least 45‑day breach notification<br>• Consumer access to list of third‑party recipients | • Right to know & delete<br>• Right to opt‑out of data sale | • `HealthNFT` stores “do‑not‑sell” flag in metadata<br>• Marketplace front‑end shows opt‑out option |

---

### 🔑  Implementation Checklist

| Area | HIPAA | GDPR | CCPA | NOTES |
|------|-------|------|------|------|
| **Consent** | Signed Authorization (HIPAA BA‑A) – stored off‑chain; on‑chain flag in NFT metadata | Explicit consent – stored in smart‑contract as a signed `Consent` struct | Explicit opt‑in for data sale; “do‑not‑sell” flag |
| **Access Control** | Minimum‑necessary – enforce via smart‑contract `requestAccess` with fee & revocation | Purpose‑limited – audit logs & time‑bound access in `DataAccessManager` | Restrict sale to California residents only if CCPA‑compliant; otherwise block sale |
| **Encryption** | At rest & in transit; HIPAA requires *AES‑256* or equivalent | GDPR: pseudonymisation + encryption; DPIA required if high‑risk | CCPA: no specific encryption rule but “reasonable security” |
| **Audit Trail** | Complete audit log of all PHI accesses, modifications, and disclosures | Audit logs for 30‑day retention of access logs | Logging for 2‑year retention |
| **Data Subject Rights** | Provide portal for patients to view, request deletion, correct data, or block researchers | Provide “Data Request API” that allows access to records, request deletion, data portability | Same as GDPR + “right to opt‑out of sale” |
| **Transfer Rules** | No export of PHI outside the U.S. without BA‑A or a compliant contract | No transfer outside EEA without adequacy or safeguards | Data cannot be sold outside the U.S. without opt‑in |
| **Breach Notification** | 60 days (if no PHI), 72 hours (if PHI) | 72 hours | 45 days | Smart‑contract‑based alert system & email to affected users |
| **Governance** | Covered Entity / Business Associate roles | Data Protection Officer (DPO) & DPIA | Privacy Officer (optional) | Assign roles in DAO or internal org |

---

### ⚙️  Quick Reference “One‑Line” Rules

| Rule | HIPAA | GDPR | CCPA |
|------|-------|------|------|
| **Consent** | Must be *explicit*, *documented*, *specific* | Must be *explicit*, *freely given* | Must be *opt‑in* for sale |
| **Minimum Necessary** | Yes – access limited to what is required | Yes – only data needed for purpose | Yes – limit data sold to what is required |
| **Right to Delete** | Yes – patient may request deletion | Yes – “Right to be forgotten” | Yes – “Right to delete” |
| **Right to Access** | Yes – patients may request PHI | Yes – “Right of access” | Yes – “Right of access” |
| **Data Transfer** | Allowed only with safeguards (BA‑A) | Allowed only to EEA or with adequate safeguards | Data cannot leave U.S. without opt‑in |
| **Security** | Encryption + audit logs | Encryption + DPIA | Reasonable security; breach notification |
| **Breach Notification** | 60‑72 hrs | 72 hrs | 45 days |
| **Notice of Collection** | Not required | Yes | Yes |
| **Data Minimisation** | Yes | Yes | Yes |
| **Consumer Data Sale** | Allowed (with consent) | Allowed (with consent) | Allowed (with opt‑in & “do‑not‑sell” opt‑out) |

---

### 📦  How to Apply to Your Contracts

| Feature | HIPAA | GDPR | CCPA |
|---------|-------|------|------|
| **`IdentityNFT`** (patient ID) | *Business Associate* – store *signed authorization* in the off‑chain portion (not on‑chain). | Store a *hash* of the consent text; keep full consent off‑chain for verifiability. | Store *opt‑out* flag; enforce *no‑sale* via `setBorrowFee(0)`. |
| **`DataAccessManager`** | Enforce *minimum‑necessary* via revocation before access; log all access events. | Add *purpose* field to each access request; enforce *purpose limitation*. | Block sale to non‑California entities unless opt‑in is present. |
| **Marketplace UI** | Provide *patient portal* to review each data‑sale, view audit logs, revoke access. | Offer *data portability* via CSV download of their data with proper encryption. | Include *opt‑out* button on sale interface. |
| **Token‑Incentives** | Tokens must be *non‑admissible* as “payment for services” (avoid being considered a “service” under HIPAA). | Tokens must be *stable* (or hedged) to satisfy GDPR “reasonably foreseeable loss” requirement. | Keep transaction fees in stable‑coin to simplify breach notification & consumer clarity. |
| **Compliance Audits** | Quarterly *HIPAA* audit by an external CPA/attorney. | Annual *GDPR* DPIA and data‑security audit. | Quarterly *CCPA* privacy review. |

---

### 🧩  One‑Page “Compliance Sprint” Summary

1. **Collect & Store**
   - PHI → off‑chain (IPFS / secure storage).
   - On‑chain pointer in NFT `tokenURI`.
2. **Obtain Consent**
   - *HIPAA*: Signed BA‑A + Authorization.
   - *GDPR/CCPA*: Explicit opt‑in + privacy notice.
3. **Record Consent**
   - Store signed hash of consent in off‑chain ledger.
   - On‑chain `IdentityNFT` carries a *consent flag* (`doNotSell`).
4. **Grant Access**
   - `DataAccessManager.requestAccess` pulls fee → grants *time‑limited* access.
   - Audit log (blockchain + off‑chain) meets all 3 regulations.
5. **Data Subject Rights**
   - UI: “Delete my data”, “View my consent history”, “Export data”.
   - Smart‑contract: `revokeAccess()` + `burn` token for deletion.
6. **Security & Breach**
   - 256‑bit AES encryption + 2‑factor for portal.
   - 72‑hr (GDPR/HIPAA) & 45‑day (CCPA) breach‑alert logic.
7. **Governance**
   - DAO or internal DPO reviews.
   - Regular DPIAs & penetration tests.

---

### 🚀  Quick‑Start Code Snippets

```solidity
// --- HIPAA Consent ---
IdentityNFT  patientNFT = new IdentityNFT();
bytes32      consentHash = keccak256(abi.encodePacked("HIPAA_Auth_2025"));
patientNFT.mintIdentity(patientAddress, consentHash); // Stores signed auth hash off‑chain

// --- GDPR Consent ---
IdentityNFT  patientNFT = new IdentityNFT();
patientNFT.setFeeToken(HEALTH); // Stablecoin for GDPR‑friendly pricing
patientNFT.setBorrowFee(patientNFT.tokenId(), 1 ether); // Fee for researchers

// --- CCPA Opt‑out ---
IdentityNFT  patientNFT = new IdentityNFT();
patientNFT.setBorrowFee(patientNFT.tokenId(), 0); // Zero fee = “do‑not‑sell” flag

// --- Access Request (All Regs) ---
DataAccessManager accessMgr = new DataAccessManager();
accessMgr.requestAccess(researcherId, patientNFTId, {value: 1 ether}); // Auto‑pulls fee, grants read
```

---

## 🎯  Bottom Line

| Regulation | Must‑Do | Quick Fix |
|------------|---------|-----------|
| **HIPAA** | Encrypt PHI, keep audit logs, sign BA‑A | Use off‑chain storage + on‑chain consent flag |
| **GDPR** | Explicit consent, right to erasure, DPIA | Store consent hash; offer “delete” UI + token burn |
| **CCPA** | Opt‑in for sale, right to opt‑out, 45‑day breach notice | Zero‑fee flag → opt‑out; 45‑day
notification contract |

Keep this cheat sheet handy during development, audit, and user onboarding.  It’s a living document – update it
whenever you add a new data type, change your jurisdiction, or receive a new regulatory update. Happy building!