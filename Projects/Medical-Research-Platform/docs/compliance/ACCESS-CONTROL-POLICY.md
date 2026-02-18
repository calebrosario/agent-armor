# Access Control Policy

**Document Owner:** Chief Information Security Officer (CISO)
**Effective Date:** [Date]
**Review Date:** [Date + 1 year]
**Version:** 1.0

---

## Executive Summary

This Access Control Policy establishes a framework for managing user access to Health-Mesh platform information assets, systems, and facilities. It implements principle of least privilege (PoLP), role-based access control (RBAC), separation of duties, and multi-factor authentication (MFA).

**Purpose:**
1. Ensure only authorized users can access Health-Mesh systems and data
2. Implement principle of least privilege
3. Separate sensitive duties to prevent unauthorized access
4. Enforce strong authentication and session management
5. Provide comprehensive audit trail of all access events
6. Comply with regulatory requirements (HIPAA, SOC 2, ISO 27001)

---

## 1. Access Control Principles

### 1.1 Principle of Least Privilege (PoLP)

**Definition:** Users should only have access to the minimum information and resources necessary to perform their job function.

**Implementation:**
- Role-based access control (RBAC) enforced across all systems
- Minimum necessary permissions assigned to each user role
- Time-limited access for elevated privileges
- Explicit approval required for access requests beyond baseline
- Regular access reviews to prevent privilege creep

### 1.2 Role-Based Access Control (RBAC)

**Definition:** Access granted based on user's role and responsibilities.

**Implementation:**
- Roles defined in Security Roles and Responsibilities Matrix
- Permissions mapped to roles in access control system
- Group-based permissions for efficiency
- Hierarchical permissions (role inherits parent role permissions)
- Dynamic permission adjustments based on role changes

### 1.3 Multi-Factor Authentication (MFA)

**Requirement:** All users must use MFA for accessing Health-Mesh systems.

**Implementation:**
- **MFA Methods:**
  - TOTP (Time-based One-Time Password) via authenticator app
  - SMS-based authentication (Twilio) for backup
  - Hardware security keys (YubiKey, Google Titan) for primary
- - Push notifications (authenticator apps)
- **Enforcement:** MFA required for:
  - All user accounts (production, staging, development)
  - Administrator and privileged accounts
  - External API access (third-party services)
- **Fallback Options:** SMS, backup codes for temporary loss of MFA device

### 1.4 Session Management

**Requirements:**
- **Idle Timeout:** 15 minutes of inactivity terminates session
- **Absolute Timeout:** 8 hours maximum session duration
- **Concurrent Sessions:** Limit to 1 active session per user
- **Secure Session Tokens:** JWT with proper expiration and signing

**Implementation:**
- Session timeout enforced by API middleware
- Session storage in Redis with TTL (time-to-live)
- Automatic logout on timeout
- Session invalidation on password change or role change

### 1.5 Account Management

**Lifecycle:**
1. **Provisioning:** Account created upon onboarding or registration
2. **Active:** Account in active status for regular use
3. **Suspended:** Account temporarily or permanently suspended for policy violations
4. **Deactivation:** Account disabled upon termination or exit

**Policies:**
- Immediate deactivation upon employee termination
- Automated suspension for suspicious activity detection
- Deletion or anonymization of data for deactivated accounts

---

## 2. Access Control Levels

### 2.1 Access Categories

| Access Level | Description | Approval Required | Audit Level |
|--------------|-------------|-----------------|-------------|
| **No Access** | No system or data access | N/A | N/A |
| **Basic Access** | Read-only access to public data | Manager | Basic |
| **Standard Access** | Read/write access to assigned assets | Manager | Standard |
| **Sensitive Access** | Access to confidential data | Manager + Security Review | Comprehensive |
| **Privileged Access** | Administrative or root-level access | CISO | Comprehensive |
| **Emergency Access** | Temporary elevated access for incident response | CISO | Critical + Immediate escalation |

### 2.2 Access Control System Components

**Components:**
1. **Authentication:** Login, MFA, session management
2. **Authorization:** RBAC, permission checks, role validation
3. **Provisioning:** Automated user account creation and access assignment
4. **Auditing:** Comprehensive logging of all access events
5. **Review Process:** Regular access reviews and privilege recertification
6. **Deactivation:** Automated and manual account deactivation

---

## 3. Role-Based Access Control

### 3.1 User Roles

| Role | Access Level | System Access | Data Access | Actions |
|------|--------------|-------------|-----------|---------|
| **Patient** | Standard | Patient Portal + Researcher Marketplace | View/consent history, manage fees | Basic CRUD operations |
| **Researcher** | Standard | Researcher Marketplace | Browse datasets, purchase access, download data | Basic CRUD operations |
| **Provider** | Standard | Provider Portal | Request patient data access | Read-only patient data (no PII/PHI) |
| **Administrator** | Privileged | Admin Dashboard | Full system access | All administrative operations |
| **Security Analyst** | Sensitive | Security tools and audit logs | Access to all logs and monitoring dashboards | Read-only audit logging |
| **Developer** | Sensitive | Development environments | Access to code repositories, dev environments | Basic CRUD operations |
| **Compliance Analyst** | Sensitive | Compliance tools and evidence repository | Access to all compliance documentation | Read-only evidence documentation |

### 3.2 Permission Matrix

| Permission | Patient | Researcher | Provider | Administrator | Security Analyst | Compliance Analyst |
|-----------|--------|-----------|----------|-------------------|-------------------|
| **View Own Patient Data** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Update Own Consent History** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Manage Access Fees** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **View Researcher Marketplace** | ✅ | ✅ | ✅ ❌ | ❌ | ❌ |
| **Purchase Dataset Access** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Download Anonymized Data** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Admin Dashboard Access** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Security Tools Access** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Compliance Tools Access** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Audit Logs Access** | ✅ | ✅ | ✅ ✅ | ✅ | ❌ |
| **System Configuration** | ❌ | ❌ | ❌ | ✅ | ❌ |

### 3.3 Privilege Separation

**Objective:** Separate conflicting or incompatible duties to prevent unauthorized access.

**Implementation:**
- **Separate Development and Production:** Different credentials for each environment
- **Separate Security Administration:** Security team does not have regular access to production data
- **Separate Compliance and Development:** Compliance team reviews changes but doesn't make production changes
- **Time-Limited Privileged Access:** Temporary elevated access for specific tasks with defined duration
- **Rotating Privileged Access:** Multiple security analysts with privileged access, rotated regularly

---

## 4. Access Request Process

### 4.1 Request Initiation

**Process:**
1. **Submit Request:** User submits access request via IT portal or email
2. **Request Details:**
   - User requesting access
   - System or data requiring access
   - Reason for access (business justification)
   - Duration required (temporary, permanent, one-time)
   - Line manager approval (if applicable)
3. **Review:** System reviews request for:
   - Business justification validity
   - Risk assessment (for sensitive data access)
   - User's current access level vs. requested level
   - Manager approval authority check
4. **Approval:** Manager or CISO approves/denies request
5. **Provisioning:** IT team provisions access based on approved request
6. **Notification:** User and manager notified of access grant

**Required Information:**
- User ID and name
- System or data requiring access
- Business justification
- Duration (start date, end date if temporary)
- Line manager email (if applicable)

**Approval Authority Matrix:**

| Request Type | Standard Access | Sensitive Access | Privileged Access | Emergency Access |
|--------------|----------------------------|--------------------|------------------|
| **Standard Data Access** | Manager | Manager + CISO | CISO | CISO |
| **New Patient Data Access** | Manager + CISO | Manager + CISO | CISO |
| **PHI/PII Access** | Manager + CISO | Manager + CISO | CISO |
| **System Configuration Changes** | CISO | CISO | CISO | CISO |
| **Privileged Operations** | CISO | CISO | CISO | CISO |

### 4.2 Access Revocation

**Process:**
1. **Trigger:** Employee termination, role change, policy violation, or manager request
2. **Revocation:** IT team revokes access immediately
3. **Verification:** Access removal verified across all systems
4. **Notification:** User and manager notified
5. **Audit:** Revocation event logged with reason and approver

**Revocation Triggers:**
- Employee termination or exit
- Change of role or responsibilities
- Security incident involving user account
- Extended period expiration for temporary access
- Policy violation investigation findings
- Manager or business need no longer exists

---

## 5. Access Reviews

### 5.1 Review Schedule

| Review Type | Frequency | Owner | Participants | Deliverable |
|-------------|------------|--------|-------------|-------------|
| **Quarterly Access Reviews** | Quarterly | Line Manager | User, Manager, IT Team | Updated permission matrix, identified privilege creep |
| **Annual Role Reviews** | Annually | CISO | All roles, managers, CISO, HR | Updated role definitions, alignment matrix |
| **Privileged Access Reviews** | Monthly | CISO | Privileged access users | Verified need for continued access, identified redundant access |
| **Emergency Access Audits** | Quarterly | CISO | Emergency access grants | Verified emergency access was appropriate, documented need |

### 5.2 Review Process

**Quarterly Access Reviews:**
1. **Self-Assessment:** Users review their own access requirements
2. **Manager Review:** Line managers verify access is appropriate for role
3. **Cross-Verification:** Other managers review user's access
4. **Security Review:** Security team reviews for compliance and risk
5. **Privilege Reduction:** Identify and revoke unnecessary privileged access
6. **Documentation Update:** Update access records with any changes

**Annual Role Reviews:**
1. **Role Justification:** Each role documented with access requirements
2. **Access Matrix Update:** Permission matrix reviewed and updated
3. **Risk Impact Analysis:** Access changes assessed for security impact
4. **Approval:** CISO approves updated roles and permissions
5. **Communication:** All users notified of role and permission changes

**Privileged Access Audits:**
1. **Justification Review:** Verify each privileged access request is still required
2. **Frequency Review:** Identify users with excessive privileged access
3. **Security Risk Assessment:** Assess security risk of continued privileged access
4. **Reduction Actions:** Reduce or remove access if not justified
5. **CISO Approval:** Any removal requires CISO approval

### 5.3 Review Criteria

**Criteria for Access Approval:**
- [ ] Business need exists and is documented
- [ ] User has completed required training for access level
- [ ] User's role justifies access level
- [ ] Line manager approved request (if applicable)
- [ ] CISO reviewed risk assessment (for sensitive data access)
- [ ] Time-limited access has defined duration with end date
- [ ] Emergency access has documented justification
- [ ] Alternative access methods considered (if applicable)

**Criteria for Access Denial:**
- [ ] No business need exists
- [ ] User's role does not require access
- [ ] User lacks required training or certifications
- [ ] Alternative access methods not available
- [ ] Request violates principle of least privilege
- [ ] Security team identifies unacceptable risk

---

## 6. Third-Party Access

### 6.1 Vendor Access Requirements

**Third-Party Service Access:**

| Service | Access Level | Requirements | Security Controls | Owner |
|----------|--------------|------------|-------------------|---------|
| **AWS Infrastructure** | Privileged | AWS IAM policies, MFA | CISO | IAM least privilege, MFA enforcement |
| **SendGrid (Email)** | Standard | API keys, rate limits | VP of Engineering | Encryption, rate limiting, audit logging |
| **Twilio (SMS)** | Standard | API keys, rate limits | VP of Engineering | Encryption, rate limiting, audit logging |
| **Stripe (Payment)** | Standard | API keys | Rate limits, PCI-DSS | CFO | PCI-DSS compliance, no raw card data, MFA |
| **Blockchain Networks** | Standard | RPC endpoints, wallet signing | CTO | Contract verification, access controls |

### 6.2 Third-Party Risk Management

**Risk Management Process:**
1. **Vendor Selection:** Third-party services evaluated for security and reliability
2. **Due Diligence:** Contracts reviewed for security clauses
3. **Business Associate Agreements (BAAs):** Required for all PHI-processing vendors
4. **Regular Reviews:** Quarterly security and performance reviews
5. **Incident Response Planning:** Plan for third-party service disruptions
6. **Exit Planning:** 90-day notice for contract termination

---

## 7. Audit and Logging

### 7.1 Access Events to Log

**Required Events to Log:**
1. All authentication events (login, MFA verification, logout)
2. All authorization events (access grant, access denied, access revocation)
3. All privilege changes (access granted, access revoked, role changes)
4. All data access events (PHI access, research data access, financial data access)
5. All system configuration changes
6. All administrative operations
7. All emergency access grants

**Event Details to Capture:**
- Event type (authentication/authorization/privilege/data/system/admin/emergency)
- User ID and name
- Timestamp (UTC)
- Source IP address and location
- Target system or data
- Access level requested/granted
- Approval details (approver, timestamp, justification)
- Risk score (if applicable)
- Event outcome (success/failure)

### 7.2 Audit Log Retention

| Log Type | Retention Period | Compliance Reference |
|----------|--------------|------------------------------|
| **Access Logs** | 7 years | SOX Section 404, HIPAA §164.316(b) |
| **Audit Logs** | 7 years | SOX Section 404, HIPAA §164.316(b) |
| **Security Logs** | 7 years | SOX Section 404 |
| **System Logs** | 1 year | Industry best practice |
| **Incident Response Logs** | 7 years | HIPAA §164.308(a)(6), GDPR Article 33 |
| **Change Logs** | 3 years | Industry best practice |

**Log Storage:**
- **Access Logs:** PostgreSQL RDS, encrypted at rest
- **Audit Logs:** PostgreSQL RDS, encrypted at rest
- **System Logs:** PostgreSQL RDS
- **Backup Verification Logs:** S3 Glacier, encrypted at rest

### 7.3 Audit Trail Requirements

**Compliance Mapping:**
- **SOC 2 CC6.1:** Logging of system activity
- **SOC 2 CC6.2:** System anomalies and errors
- **SOC 2 CC6.3:** Unauthorized access attempts
- **SOC 2 CC8.1:** Information protection events
- **ISO 27001 A.8.15:** Logging of access events
- **ISO 27001 A.12.3:** Detailed logging
- **HIPAA §164.312(b):** Audit controls
- **HIPAA §164.316(b):** Audit controls

---

## 8. Compliance Mapping

### 8.1 SOC 2 Mapping

| SOC 2 TSC | Access Control Implementation | Evidence |
|-------------|---------------------------------|----------|
| **CC1.1** | Governance and risk management | Security Roles and Responsibilities Matrix, Risk Assessment Methodology |
| **CC1.2** | Risk assessment and management | Risk register, treatment plans, monitoring |
| **CC6.1** | Logical access controls | This policy, RBAC implementation, access reviews |
| **CC6.2** | Logical access controls | MFA, session management, RBAC |
| **CC6.3** | Logical access controls | Separation of duties, privileged access controls |
| **CC6.6** | Logical access controls | Role-based permissions, permission matrix |
| **CC6.7** | System monitoring | Audit logging, rate limiting, intrusion detection |
| **CC8.1** | Monitoring of system activity | Comprehensive access event logging |
| **CC8.2** | System anomalies and errors | Alert system for anomaly detection |

### 8.2 ISO 27001 Mapping

| ISO Control | Access Control Implementation | Evidence |
|-------------|---------------------------------|----------|
| **A.5.1** | Access control | RBAC system, role definitions, permission matrix |
| **A.5.2** | Access control | MFA, authentication, session management |
| **A.9.1** | Access control | Security reviews, access certifications |
| **A.9.2** | Access control | User access rights, role changes |
| **A.9.4** | Access control | Access provisioning and deprovisioning |
| **A.12.3** | Access control | Authorization for access, access reviews |

### 8.3 HIPAA Mapping

| HIPAA Requirement | Access Control Implementation | Evidence |
|-------------------|----------------------------------|----------|
| **§164.308(a)(1)** | Access controls | RBAC, MFA, session management, audit logging |
| **§164.308(a)(3)** | Workforce security | Background checks, security training |
| **§164.312(a)(i)** | Workforce clearance procedures | Background checks, access revocation |
| **§164.312(b)** | Audit controls | Comprehensive access event logging |
| **§164.312(e)(1)** | Authentication | MFA, secure authentication, password policies |

---

## 9. Enforcement

### 9.1 Violation Categories

| Violation Type | Description | Penalty | Severity |
|----------------|-------------|-----------|-----------|
| **Unauthorized Access** | Access to systems/data without authorization | Immediate revocation + Investigation | Critical |
| **Exceeding Privilege** | Access beyond role permissions | Access revocation + Manager review | High |
| **MFA Bypass** | Attempting to access without MFA | Account suspension | Critical |
| **Password Sharing** | Sharing credentials or password reuse | Password reset + Security training | High |
| **Phishing/Vishing** | Providing credentials to attackers | Security awareness training | Critical |
| **Data Exfiltration** | Unauthorized data export or download | Access revocation + Investigation | Critical |
| **Session Abuse** | Multiple concurrent sessions | Session termination + Monitoring | Medium |

### 9.2 Enforcement Actions

**For Critical Violations:**
1. Immediate access revocation
2. Account suspension
3. Security incident investigation
4. Executive notification (if >$10K potential loss)
5. Law enforcement consultation (if applicable)
6. Employee termination (if intentional)

**For High Violations:**
1. Access revocation
2. Manager review and training
3. Written warning
4. Access level reduction

**For Medium Violations:**
1. Session termination
2. Security awareness training
3. Written warning

**For Low Violations:**
1. Written reminder
2. Security awareness training

### 9.3 Incident Response Integration

**Security Incidents Requiring Access Revocation:**
1. **Confirmed Breach:** All access logs reviewed, user accounts revoked
2. **Suspected Breach:** Access logs analyzed, user accounts locked pending investigation
3. **Incident Response:** Access control measures enhanced based on incident findings

---

## 10. Training and Awareness

### 10.1 Required Training

| Audience | Training Topic | Frequency | Duration | Owner |
|-----------|--------------|-------------|-----------|---------|-----------|
| **All Employees** | Access Control Policy | Annually | 1 hour | HR Manager |
| **All Employees** | HIPAA Privacy & Security | Annually | 1 hour | HR Manager |
| **All Employees** | Phishing Awareness | Quarterly | 30 minutes | HR Manager |
| **All Employees** | Security Awareness | Annually | 1 hour | CISO |
| **Managers** | Access Management | Semi-annually | 2 hours | CISO |
| **IT Team** | Security Tools | Semi-annually | 4 hours | VP of Engineering |
| **Developers** | Secure Coding Practices | Annually | 4 hours | VP of Engineering |

### 10.2 Training Documentation

**All employees must complete:**
1. Annual access control policy training (this document)
2. Annual HIPAA privacy and security training
3. Annual phishing awareness training
4. Annual security awareness training
5. Role-specific training upon role changes or access grants

---

## 11. Document Control

| Version | Date | Changes | Approved By |
|---------|-------|---------|--------------|
| 1.0 | [Date] | Initial document creation | CISO |

---

**Document Classification:** Confidential

**Distribution:** All Health-Mesh employees, managers, contractors, and relevant third-party vendors

---

**Last Updated:** [Date]

**Next Review Date:** [Date + 1 year]

---

*This Access Control Policy aligns with NIST Cybersecurity Framework 2.1 (Protect function), HIPAA Security Rule, SOC 2 Type II Trust Services Criteria (Security + Availability), and ISO/IEC 27001:2022 standards.*
