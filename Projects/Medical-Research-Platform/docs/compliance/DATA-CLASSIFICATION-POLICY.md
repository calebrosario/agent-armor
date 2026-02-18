# Data Classification Policy

**Document Owner:** Chief Information Security Officer (CISO)
**Effective Date:** [Date]
**Review Date:** [Date + 1 year]
**Version:** 1.0

---

## Executive Summary

This Data Classification Policy establishes a framework for classifying information assets based on their sensitivity, confidentiality, and regulatory requirements. Proper data classification is essential for implementing appropriate security controls, complying with HIPAA, GDPR, CCPA, SOC 2, and ISO 27001 requirements.

**Purpose:**
1. Protect sensitive information from unauthorized disclosure
2. Ensure appropriate security controls for each classification level
3. Comply with regulatory requirements (HIPAA, GDPR, CCPA)
4. Enable effective risk management and access control
5. Support data retention and disposal procedures

---

## 1. Classification Scheme

### 1.1 Classification Levels

Health-Mesh uses three classification levels:

#### 1.1.1 Confidential

**Definition:** Information that, if disclosed, could cause significant harm to Health-Mesh, patients, or research participants. This includes:

- Protected Health Information (PHI)
- Personally Identifiable Information (PII)
- Financial data
- Proprietary intellectual property
- Research data before publication
- Contractual or confidential business information

**Security Requirements:**
- **Access Control:** Strict role-based access control (RBAC)
- **Encryption:** AES-256 encryption at rest, TLS 1.3 in transit
- **Audit Logging:** Comprehensive audit trail for all access
- **Authentication:** Multi-factor authentication (MFA) required
- **Storage:** Secure storage with controlled access
- **Transmission:** Encrypted transmission only
- **Retention:** Defined retention periods based on regulatory requirements

**Examples:**
- Patient medical records
- Patient personal information (name, DOB, SSN)
- Research data with patient identifiers
- Financial transactions
- Smart contract private keys
- API encryption keys

**Regulatory Mapping:**
- HIPAA: Protected Health Information (PHI)
- GDPR: Special category personal data (Article 9)
- CCPA: Personal information (1798.140(o)(1))

#### 1.1.2 Internal

**Definition:** Information that is not intended for public distribution but disclosure would not cause significant harm. This includes:

- Internal documentation
- System configuration files
- Operational procedures
- Non-sensitive business data
- Employee directory (non-public)
- Internal reports and dashboards

**Security Requirements:**
- **Access Control:** Standard access controls
- **Encryption:** Moderate encryption (AES-256 recommended)
- **Audit Logging:** Basic audit trail for access
- **Authentication:** Standard authentication (MFA recommended)
- **Storage:** Standard storage with access controls
- **Transmission:** Encrypted transmission recommended
- **Retention:** Business-defined retention periods

**Examples:**
- Internal process documentation
- System configuration files
- Internal project management data
- Employee onboarding materials
- Operational metrics and KPIs

**Regulatory Mapping:**
- HIPAA: Business operations data (non-PHI)
- GDPR: Personal data (non-special category)

#### 1.1.3 Public

**Definition:** Information that is intended for public distribution and has no confidentiality concerns. This includes:

- Marketing materials
- Public website content
- Public API documentation
- Press releases
- Published research results
- Product information

**Security Requirements:**
- **Access Control:** No access controls required
- **Encryption:** Not required
- **Audit Logging:** Optional
- **Authentication:** Not required for public access
- **Storage:** Standard web hosting
- **Transmission:** Standard HTTP/HTTPS
- **Retention:** Permanent or business-defined

**Examples:**
- Public website (health-mesh.com)
- Public API documentation
- Published research papers
- Marketing brochures
- Press releases
- Product feature descriptions

**Regulatory Mapping:**
- None (publicly available)

### 1.2 Classification Decision Tree

```
Does the data contain PHI?
├─ Yes → Confidential
└─ No
    Does the data contain PII?
    ├─ Yes → Confidential
    └─ No
        Is the data financial in nature?
        ├─ Yes → Confidential
        └─ No
            Is the data proprietary IP?
            ├─ Yes → Internal
            └─ No
                Is the data intended for public distribution?
                ├─ Yes → Public
                └─ No → Internal
```

---

## 2. Classification by Data Type

### 2.1 Patient Data

| Data Element | Classification | Rationale | Retention Period |
|--------------|---------------|-----------|-----------------|
| **Patient ID** | Confidential | PII | 10 years |
| **Patient Name** | Confidential | PII | 10 years |
| **Date of Birth** | Confidential | PII | 10 years |
| **Social Security Number** | Confidential | Sensitive PII | 10 years |
| **Address** | Confidential | PII | 10 years |
| **Phone Number** | Confidential | PII | 10 years |
| **Email Address** | Confidential | PII | 10 years |
| **Medical Diagnosis** | Confidential | PHI | 10 years |
| **Medications** | Confidential | PHI | 10 years |
| **Lab Results** | Confidential | PHI | 10 years |
| **Imaging Studies** | Confidential | PHI | 10 years |
| **Treatment History** | Confidential | PHI | 10 years |
| **Vaccination Records** | Confidential | PHI | 10 years |
| **Allergies** | Confidential | PHI | 10 years |

**Regulatory Requirements:**
- HIPAA §164.308(a)(2)(i) - Authentication and encryption
- HIPAA §164.312(a)(1) - Access controls
- HIPAA §164.312(e)(1) - Transmission security
- GDPR Article 6 - Lawfulness of processing
- GDPR Article 9 - Processing of special category data

### 2.2 Research Data

| Data Type | Classification | Rationale | Retention Period |
|-----------|---------------|-----------|-----------------|
| **Raw Research Data** | Confidential | Patient identifiers | 10 years |
| **Anonymized Research Data** | Internal | No patient identifiers | Permanent |
| **Published Research Results** | Public | Publicly available | Permanent |
| **Research Protocols** | Internal | Proprietary methodology | 5 years |
| **Informed Consent Forms** | Confidential | Legal document | 10 years |

### 2.3 Financial Data

| Data Type | Classification | Rationale | Retention Period |
|-----------|---------------|-----------|-----------------|
| **Payment Transactions** | Confidential | Financial regulations | 7 years (SOX) |
| **Credit Card Data** | Confidential | PCI-DSS requirements | Transaction-only (no storage) |
| **Billing Information** | Confidential | Financial records | 7 years (SOX) |
| **Invoices** | Confidential | Financial records | 7 years (SOX) |

**Regulatory Requirements:**
- PCI-DSS REQ-3.4 - Render cardholder data unreadable
- PCI-DSS REQ-4.1 - Use strong cryptography
- SOX Section 404 - 7-year retention

### 2.4 Employee Data

| Data Type | Classification | Rationale | Retention Period |
|-----------|---------------|-----------|-----------------|
| **Employee ID** | Internal | Business operations | 7 years post-termination |
| **Employment Contracts** | Confidential | Legal document | 7 years post-termination |
| **Performance Reviews** | Internal | Business operations | 3 years |
| **Salary Information** | Confidential | Financial data | 7 years post-termination |

---

## 3. Data Handling Requirements by Classification

### 3.1 Confidential Data

#### 3.1.1 Access Control
- **RBAC:** Role-based access control enforced
- **Authorization:** Explicit approval required for access
- **Minimum Privilege:** Least privilege principle applied
- **Access Reviews:** Quarterly access reviews
- **Termination:** Immediate revocation upon employee termination

#### 3.1.2 Encryption
- **At Rest:** AES-256 encryption required for all storage
- **In Transit:** TLS 1.3 required for all transmission
- **Key Management:** AWS KMS for encryption key management
- **Key Rotation:** Annual encryption key rotation

#### 3.1.3 Audit Logging
- **Comprehensive Logging:** All access logged
- **Log Retention:** 7-year log retention (SOX requirement)
- **Log Analysis:** Regular log reviews and anomaly detection
- **Immutable Logs:** Audit logs cannot be modified

#### 3.1.4 Data Transmission
- **Secure Channels:** Encrypted transmission only
- **Authorized Recipients:** Only authorized recipients can receive data
- **Transmission Logs:** All transmissions logged
- **Secure Protocols:** HTTPS, SFTP, VPN required

### 3.2 Internal Data

#### 3.2.1 Access Control
- **RBAC:** Role-based access control
- **Authorization:** Standard access request process
- **Access Reviews:** Semi-annual access reviews

#### 3.2.2 Encryption
- **At Rest:** AES-256 encryption recommended
- **In Transit:** TLS 1.3 recommended

#### 3.2.3 Audit Logging
- **Basic Logging:** Access logged
- **Log Retention:** 1-year log retention (minimum)

### 3.3 Public Data

#### 3.3.1 Access Control
- **No Restrictions:** Publicly accessible
- **Version Control:** Maintain version history for public content

#### 3.3.2 Audit Logging
- **Optional:** Logging optional for public data

---

## 4. Data Lifecycle Management

### 4.1 Data Creation and Classification

**Process:**
1. **Data Creation:** New data created during normal business operations
2. **Automatic Classification:** Data classified based on type (e.g., patient data = Confidential)
3. **Manual Review:** Data owner reviews classification if uncertain
4. **Classification Approval:** Manager approves classification if manual
5. **Labeling:** Data labeled with classification
6. **Storage:** Data stored according to classification requirements

**Tools:**
- Database schema constraints for automatic classification
- Metadata tagging for file storage
- Classification decision support tool

### 4.2 Data Access

**Process:**
1. **Access Request:** User requests access to data
2. **Authorization:** Data owner or manager reviews and approves request
3. **Authentication:** User authenticates with MFA
4. **Access Granted:** User granted access with appropriate permissions
5. **Access Logging:** All access events logged
6. **Session Management:** Session timeout enforced (15 min idle, 8 hr absolute)

**Controls:**
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session timeout (15 min idle, 8 hr absolute)
- Audit logging

### 4.3 Data Use and Modification

**Process:**
1. **Data Retrieval:** User retrieves data for business purpose
2. **Data Use:** User uses data according to acceptable use policy
3. **Modification (if applicable):** User modifies data with authorization
4. **Change Logging:** All modifications logged
5. **Approval (if applicable):** Critical data changes require approval

**Controls:**
- Audit logging for all modifications
- Version control for critical data
- Approval workflows for sensitive data changes

### 4.4 Data Retention

**Retention Periods by Classification:**

| Data Type | Classification | Retention Period | Regulatory Basis |
|-----------|---------------|------------------|------------------|
| **Patient Medical Records** | Confidential | 10 years | HIPAA §164.316(c) |
| **Patient PII** | Confidential | 10 years | HIPAA §164.316(c) |
| **Research Data** | Confidential | 10 years | Institutional policy |
| **Financial Records** | Confidential | 7 years | SOX Section 404 |
| **Employee Records** | Confidential | 7 years post-termination | Labor laws |
| **Audit Logs** | Internal | 7 years | SOX Section 404 |
| **System Logs** | Internal | 1 year | Industry best practice |

### 4.5 Data Disposal

**Process:**
1. **Retention Expiration:** Data reaches end of retention period
2. **Review:** Data owner reviews data for extended retention need
3. **Approval:** Manager approves disposal
4. **Secure Erasure:** Data securely erased or destroyed
5. **Verification:** Secure erasure verified
6. **Documentation:** Disposal documented

**Secure Erasure Methods:**
- **Digital Data:** Cryptographic erasure (multi-pass overwrite), degaussing
- **Physical Media:** Shredding, incineration, pulverization
- **Cloud Data:** Secure deletion with verification from cloud provider

**Compliance Mapping:**
- HIPAA §164.310(d)(1) - Disposal
- GDPR Article 17 - Right to erasure
- ISO 27001 A.8.10 - Information deletion

---

## 5. Special Data Types

### 5.1 PHI (Protected Health Information)

**Definition:** Any information that relates to:
- Past, present, or future physical or mental health or condition of an individual
- Provision of health care to an individual
- Past, present, or future payment for health care

**Examples:**
- Medical diagnoses
- Treatments
- Prescription information
- Lab results
- Patient demographics

**Handling Requirements:**
- **Minimum Necessary:** Access only to minimum necessary information
- **Incidental Use:** PHI not used for purposes other than stated
- **Authorization:** Patient authorization required for most uses
- **De-identification:** De-identified data not PHI

**Regulatory Requirements:**
- HIPAA Privacy Rule (45 CFR Part 160 and 164)
- HIPAA Security Rule (45 CFR Part 164, Subpart C)

### 5.2 PII (Personally Identifiable Information)

**Definition:** Any information that can be used to identify, contact, or locate a specific individual.

**Examples:**
- Name
- Address
- Phone number
- Email address
- Social Security Number
- Driver's license number
- Date of birth
- Mother's maiden name

**Handling Requirements:**
- **Consent:** Consent required for collection and use
- **Purpose Limitation:** Use limited to stated purpose
- **Data Minimization:** Collect only necessary information
- **Access Control:** Restricted access to PII

**Regulatory Requirements:**
- GDPR Articles 5-9 (Data processing principles)
- CCPA 1798.140(o)(1) (Definition of personal information)

### 5.3 Anonymized Data

**Definition:** Data from which all direct identifiers have been removed, making identification of individuals impossible.

**De-identification Methods:**
- **Removal of Direct Identifiers:** Name, DOB, SSN, address
- **Statistical Methods:** Data aggregation, suppression
- **Pseudonymization:** Replacement of identifiers with pseudonyms
- **Generalization:** Replacement of specific values with general categories

**Anonymized Data Classification:**
- **Strict Anonymization:** Public (no re-identification risk)
- **Partial Anonymization:** Internal (some re-identification risk)

**Regulatory Mapping:**
- HIPAA Safe Harbor: Data is de-identified if 18 identifiers removed
- GDPR Recital 26: Pseudonymized data can reduce risk

---

## 6. Cross-Border Data Transfers

### 6.1 International Data Transfers

**Scenario:** Transferring data outside of originating country or region.

**Requirements:**
- **Adequacy Determination:** Verify destination country has adequate data protection
- **GDPR Compliance:** Article 44-50 - Transfers of personal data to third countries
- **CCPA Compliance:** Notice to California residents if data transferred internationally
- **Contractual Safeguards:** Standard contractual clauses (SCCs) for EU transfers
- **Data Localization:** PIPL requires data localization for "important data"

**Decision Matrix:**

| Scenario | Requirement |
|-----------|-------------|
| **EU to Non-EU** | Adequacy determination + Standard Contractual Clauses (SCCs) |
| **US to EU** | EU GDPR compliance + Binding Corporate Rules (BCRs) |
| **China to Non-China** | CAC security assessment (PIPL Article 37) |
| **US to International** | CCPA notice to California residents |

---

## 7. Data Breach Response

### 7.1 Breach Notification Requirements

| Regulation | Notification Deadline | To Whom |
|-------------|----------------------|-----------|
| **HIPAA** | 60 days after discovery | Individuals, HHS, Media (if >500 individuals) |
| **GDPR** | 72 hours after discovery | Supervisory authority, affected individuals |
| **CCPA** | Reasonable time, no later than 30 days | California residents |

### 7.2 Breach Notification Process

1. **Discovery:** Breach discovered
2. **Assessment:** Breach assessed for risk to individuals
3. **Notification:** Regulators and affected individuals notified
4. **Mitigation:** Containment and remediation measures implemented
5. **Documentation:** All steps documented
6. **Post-Review:** Lessons learned and process improvements

---

## 8. Compliance Evidence

### 8.1 Evidence Requirements for Audits

| Audit Requirement | Evidence |
|------------------|----------|
| **SOC 2 CC6.1** | RBAC matrices, access control logs, access reviews |
| **SOC 2 CC6.3** | Encryption configuration, key management procedures |
| **ISO 27001 A.5.12** | Data classification policy, classification procedures |
| **HIPAA §164.308(a)(2)** | Risk analysis, risk management plan |
| **HIPAA §164.312(e)** | Encryption standards, transmission security |

### 8.2 Monitoring and Enforcement

**Monitoring:**
- **Classification Accuracy:** Regular review of classification accuracy
- **Access Control Compliance:** Monitoring of access control violations
- **Encryption Compliance:** Verification of encryption implementation
- **Retention Compliance:** Monitoring of data disposal procedures

**Enforcement:**
- **Violations:** Violations of data handling requirements may result in disciplinary action
- **Training:** Additional training for repeat violations
- **Process Improvement:** Processes updated based on violation trends

---

## 9. Training and Awareness

### 9.1 Training Requirements

All employees who handle data must complete data classification training:

| Audience | Training Topics | Frequency | Duration |
|-----------|----------------|------------|-----------|
| **All Employees** | Data classification overview, handling procedures | Annually | 1 hour |
| **Developers** | Data handling in code, encryption implementation | Annually | 2 hours |
| **Database Administrators** | Database security, access controls | Annually | 2 hours |
| **Security Team** | Data breach response, classification enforcement | Annually | 2 hours |
| **Executives** | Data governance, risk management | Annually | 1 hour |

### 9.2 Training Completion

- **Tracking:** Training completion tracked by employee
- **Records:** Training records maintained for 7 years
- **Refreshers:** Annual refresher training required
- **New Hires:** Training within 30 days of hire

---

## 10. Document Maintenance

### 10.1 Review Schedule

| Document Component | Review Frequency | Review By |
|-------------------|------------------|-----------|
| **Classification Scheme** | Annually | CISO |
| **Handling Procedures** | Annually | CISO |
| **Retention Periods** | Annually | General Counsel |
| **Regulatory Changes** | As needed | Compliance Manager |
| **Process Improvements** | Quarterly | CISO |

### 10.2 Change Process

1. **Proposal:** Change proposal submitted to CISO
2. **Review:** CISO reviews proposal for impact
3. **Approval:** CEO or ISSC approves change
4. **Documentation:** Change documented in document control table
5. **Communication:** Changes communicated to affected personnel
6. **Training:** Training conducted if required

---

## 11. Appendices

### Appendix A: Classification Checklist

**Before creating or modifying data, classify the data:**

- [ ] Does data contain PHI? → Confidential
- [ ] Does data contain PII? → Confidential
- [ ] Is data financial in nature? → Confidential
- [ ] Is data proprietary IP? → Internal
- [ ] Is data intended for public distribution? → Public
- [ ] Is classification uncertain? → Consult data owner or CISO

### Appendix B: Data Labeling Guidelines

**Labeling Convention:**

| Format | Example |
|---------|---------|
| **Digital Files:** [Classification]_[Document_Title] | Confidential_Patient_Smith_John_Medical_Records.pdf |
| **Database Records:** Classification column | classification: 'CONFIDENTIAL' |
| **Email Subject:** [Classification] [Subject] | CONFIDENTIAL: Patient data request |
| **File Headers:** Classification watermark | CONFIDENTIAL - Internal Use Only |

### Appendix C: Data Handling Summary Table

| Classification | Access Control | Encryption | Audit Logging | Transmission | Retention |
|---------------|-----------------|------------|----------------|-------------|------------|
| **Confidential** | RBAC + MFA | AES-256 at rest, TLS 1.3 in transit | Comprehensive | Encrypted only | Defined by regulation |
| **Internal** | RBAC | Recommended AES-256 | Basic | Encrypted recommended | Business-defined |
| **Public** | None | Not required | Optional | Standard | Permanent |

---

## 12. Document Control

| Version | Date | Changes | Approved By |
|---------|-------|---------|--------------|
| 1.0 | [Date] | Initial document creation | CISO |

---

**Document Classification:** Confidential

**Distribution:** All Health-Mesh employees, contractors, and relevant third-party vendors

---

**Last Updated:** [Date]

**Next Review Date:** [Date + 1 year]

---

*This Data Classification Policy aligns with NIST Cybersecurity Framework 2.1 (Protect function), HIPAA Security Rule, GDPR, CCPA, SOC 2 Type II Trust Services Criteria (Security + Availability), and ISO/IEC 27001:2022 standards.*
