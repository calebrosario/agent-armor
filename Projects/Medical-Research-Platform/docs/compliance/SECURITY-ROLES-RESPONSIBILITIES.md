# Security Roles and Responsibilities

## Document Information

- **Document ID:** CR-SRR-001
- **Version:** 2.0
- **Created:** February 8, 2026
- **Last Updated:** February 8, 2026
- **Owner:** Chief Information Security Officer (CISO)
- **Approver:** CEO
- **Status:** Active
- **Classification:** Confidential
- **Review Cycle:** Annual

## Executive Summary

This document defines security roles and responsibilities across Health-Mesh Medical Research Platform. It establishes clear accountability for information security activities, ensuring all personnel understand their security obligations and responsibilities.

**Key Objectives:**
1. Define clear security roles across the organization
2. Assign specific responsibilities to each role
3. Establish approval authority for security decisions
4. Ensure separation of duties and appropriate oversight
5. Map responsibilities to NIST CSF, SOC 2, ISO 27001, HIPAA, GDPR, and CCPA requirements

---

## 1. Role Categories

### 1.1 Executive Leadership

**Roles:**
- CEO (Chief Executive Officer)
- CTO (Chief Technology Officer)
- CFO (Chief Financial Officer)
- General Counsel / Chief Compliance Officer

**Primary Responsibilities:**
- Executive sponsorship of security program
- Strategic security decision-making
- Resource allocation and budget approval
- Legal and compliance oversight

---

### 1.2 Engineering & Development

**Roles:**
- VP of Engineering
- Development Team
- DevOps Team

**Primary Responsibilities:**
- Secure coding practices
- Application security
- Infrastructure security
- Secure development lifecycle

---

### 1.3 Security Team

**Roles:**
- CISO (Chief Information Security Officer)
- Security Analysts
- Security Engineers
- Compliance Analysts

**Primary Responsibilities:**
- Security monitoring and detection
- Incident response
- Vulnerability management
- Compliance and evidence collection

---

### 1.4 Product & UX

**Roles:**
- VP of Product
- Product Managers
- UX Researchers

**Primary Responsibilities:**
- Security requirements in products
- Privacy and consent design
- User experience for security controls

---

### 1.5 Data & Privacy

**Roles:**
- Data Privacy Officer
- Data Governance Team

**Primary Responsibilities:**
- Data privacy and protection
- Data governance and classification
- Data subject rights (GDPR Article 15)
- Regulatory compliance for data handling

---

### 1.6 Operations & Infrastructure

**Roles:**
- VP of Operations
- Operations Team
- IT Support

**Primary Responsibilities:**
- System availability and uptime
- Physical security of facilities
- Equipment and device security
- Business continuity operations

---

### 1.7 HR & Training

**Roles:**
- VP of HR
- Training Coordinator

**Primary Responsibilities:**
- Security awareness training
- Employee screening and background checks
- Security policy violations
- Access termination procedures

---

### 1.8 Legal & Compliance

**Roles:**
- General Counsel
- Compliance Manager

**Primary Responsibilities:**
- Legal compliance oversight
- Regulatory interpretation
- Business Associate Agreements (BAAs)
- Breach notification and regulatory reporting

---

## 2. Accountability Structure

### 2.1 Role, Responsibilities, and Approval Authority Matrix

| Role | Security Responsibilities | Approval Authority | Reporting Line | NIST CSF Function | SOC 2 CC | ISO 27001 Control | HIPAA Safeguard |
|--------|----------------------|-------------------|----------------|-------------------|-------------|--------------------|------------------|
| **CEO** | Executive sponsorship, strategic security decisions | Security policy, risk acceptance, major security incidents | N/A | ID.GV | CC1.1, CC1.4 | A.5.1, A.5.4 | Admin |
| **CTO** | Secure architecture, technology strategy, security investments | Technology stack, development process, security tools | CEO | PR.PS | CC3.1, CC4.1 | A.8.1, A.8.24 | Technical |
| **CFO** | Security budget, financial controls, insurance coverage | Security budget, vendor contracts, insurance purchases | CEO | ID.GV | CC1.1 | A.5.1 | Admin |
| **General Counsel** | Legal compliance, BAAs, regulatory interpretation | Policy legal review, BAA approval, breach notification communications | CEO | ID.GV | CC1.1, CC5.2 | A.5.1, A.5.19 | Admin |
| **VP of Engineering** | Secure coding, security reviews, vulnerability remediation | Development process, technology decisions, code reviews | CTO | PR.PS | CC3.1, CC3.2 | A.8.24, A.8.25 | Technical |
| **CISO** | Overall security posture, incident response, vulnerability management | Security controls, incident response actions, access revocation | CEO + ISSC | PR.MN, RS.RP | CC5.1, CC6.1 | A.5.24, A.5.15 | Admin + Technical |
| **Security Analysts** | Monitor security events, investigate incidents, collect evidence | Incident response actions, alert configuration, evidence collection | CISO | DE.AE, DE.CM | CC8.1, CC8.2 | A.8.15, A.8.16 | Technical |
| **Security Engineers** | Deploy security tools, configure controls, test effectiveness | Security tool configuration, control settings, test results | CISO | PR.PS, PR.AT | CC3.1, CC4.1 | A.8.1, A.8.18 | Technical |
| **Compliance Analysts** | Evidence collection, compliance gap analysis, audit preparation | Evidence collection requests, gap remediation priorities, audit schedules | CISO | DE.CM, RS.MG | CC8.1, CC1.2 | A.5.1, A.5.3 | Admin |
| **VP of Product** | Security requirements in products, privacy design | Product security requirements, privacy controls, feature prioritization | CTO | PR.AT | CC6.1, CC8.2 | A.5.15, A.5.17 | Admin |
| **Product Managers** | Write user stories with security requirements, coordinate security testing | User story approval, security acceptance criteria, testing coordination | VP of Product | PR.AT, PR.PS | CC3.1, CC3.6 | A.5.15, A.8.25 | Technical |
| **UX Researchers** | Design secure user experiences, test security usability | UX design decisions, error messages, security UI flows | VP of Product | PR.AT | CC6.1, CC8.1 | A.8.1, A.8.15 | Technical |
| **Data Privacy Officer** | GDPR compliance, data subject rights, DPAs | Data handling decisions, consent approvals, data request responses | CTO + General Counsel | PR.DS, ID.RA | CC6.1, CC8.2 | A.5.12, A.5.28 | Admin + Technical |
| **Data Governance Team** | Data classification, lifecycle management, access reviews | Data classification decisions, retention schedules, access approvals | Data Privacy Officer | PR.DS, ID.AM | CC6.1, CC8.2 | A.5.9, A.5.12 | Admin + Technical |
| **VP of Operations** | System availability, physical security, disaster recovery | Operational procedures, physical security measures, DR testing | CTO | PR.PS, RC.RP | CC2.1, CC4.1, CC5.1 | A.8.13, A.8.30 | Technical + Admin |
| **Operations Team** | Monitor systems, follow procedures, report incidents | Operational changes, security event reporting, DR execution | VP of Operations | DE.CM, RC.RP | CC2.1, CC4.1 | A.8.13, A.8.30 | Technical + Admin |
| **VP of HR** | Security training, screening, disciplinary actions | Training materials, hiring decisions, policy violations | CEO | PR.AT, ID.AM | CC1.5 | A.6.3 | Admin |
| **Training Coordinator** | Conduct training, track completion, phishing simulations | Training schedules, attendance tracking, simulation results | VP of HR | PR.AT, DE.AE | CC1.5 | A.6.3 | Admin |
| **Compliance Manager** | Regulatory compliance, BAAs, audit coordination | Compliance decisions, BAA management, audit scheduling | General Counsel + CISO | ID.GV, RS.MN | CC1.1, CC1.2 | A.5.1, A.5.19 | Admin + Technical |

---

### 2.2 Separation of Duties

**Principles:**

**1. No Conflicting Responsibilities:**
- Security operations (monitoring, incident response) must not report to same person responsible for development
- Compliance assessments must be conducted by team independent of the controls being assessed
- Risk assessments must be reviewed by someone other than the risk owner

**2. Approval Authority Limits:**
- Access to production systems requires approval from Operations or DevOps
- Security policy changes require CEO approval
- Risk acceptance requires ISSC approval
- BAA terms require Legal approval

**3. Independent Verification:**
- Compliance Analysts must independently verify security controls
- Penetration testing must be conducted by third-party firm
- Internal audit function independent of security team
- Incident post-mortem reviewed by ISSC

---

## 3. Incident Response Team Structure

### 3.1 Incident Response Roles

**Incident Commander:**
- **Primary Role:** Coordinates overall incident response
- **Authority:** Makes critical decisions during incident
- **Responsibilities:**
  - Declare incident severity and classification
  - Activate incident response team
  - Assign tasks and coordinate response
  - Communicate with stakeholders
  - Escalate to executive leadership
  - Conduct post-incident review
- **Requirements:** Senior security role, incident response training

**Technical Lead:**
- **Primary Role:** Provides technical analysis and coordination
- **Authority:** Makes technical decisions for containment and eradication
- **Responsibilities:**
  - Determine root cause and scope
  - Coordinate technical containment and eradication
  - Provide technical guidance to response team
  - Coordinate with DevOps and Engineering
  - Implement technical remediation
  - Preserve forensic evidence
- **Requirements:** Senior technical role, incident response training

**Communications Lead:**
- **Primary Role:** Manages internal and external communications
- **Authority:** Approves all communications during incident
- **Responsibilities:**
  - Draft breach notification communications
  - Coordinate with Legal for regulatory compliance
  - Manage media relations if needed
  - Provide updates to affected parties
  - Maintain communication timeline
  - Archive all communications
- **Requirements:** Communication skills, legal knowledge

**Legal Counsel:**
- **Primary Role:** Provides legal guidance and oversight
- **Authority:** Approves all legal and regulatory communications
- **Responsibilities:**
  - Review breach notification for regulatory compliance
  - Advise on legal obligations and risks
  - Coordinate with regulators and authorities
  - Assess legal liability and insurance coverage
  - Review communications for legal risks
  - Coordinate with external counsel if needed
- **Requirements:** Legal background, regulatory knowledge

**HR Representative:**
- **Primary Role:** Manages personnel-related incident response
- **Authority:** Makes personnel decisions related to incident
- **Responsibilities:**
  - Handle employee discipline if insider threat
  - Coordinate employee support and communication
  - Manage access termination if necessary
  - Document personnel actions taken
  - Provide HR guidance to incident team
  - Coordinate with employee unions if applicable
- **Requirements:** HR management experience, employee relations knowledge

**Security Analyst:**
- **Primary Role:** Provides security intelligence and monitoring
- **Authority:** Escalates incidents based on severity
- **Responsibilities:**
  - Monitor incident detection and response
  - Provide real-time threat intelligence
  - Coordinate with external security vendors
  - Document incident timeline and actions
  - Collect and preserve forensic evidence
  - Provide security recommendations
- **Requirements:** Security monitoring experience, threat intelligence

---

### 3.2 Incident Response Escalation

**Severity Levels and Escalation:**

| Severity | Description | Notification Time | Escalation Path |
|-----------|-------------|------------------|----------------|
| **Low** | Minor impact, limited scope, no data exposure | 24 hours | Security Analyst → CISO |
| **Medium** | Moderate impact, limited data exposure | 4 hours | Security Analyst → CISO → CEO |
| **High** | Significant impact, PHI/PII exposure | 1 hour | Security Analyst → CISO → CEO + ISSC |
| **Critical** | Severe impact, extensive PHI/PII exposure, business disruption | Immediate (15 min) | Security Analyst → CISO → CEO + ISSC → Legal + PR |

---

## 4. Training Requirements by Role

### 4.1 Annual Security Awareness Training (All Employees)

**Required For:** All employees, contractors, vendors with access to systems

**Training Topics:**
1. Information Security Policy overview
2. HIPAA Security Rule requirements
3. GDPR data protection principles
4. CCPA consumer privacy rights
5. Phishing and social engineering awareness
6. Password security and MFA
7. Physical security (clean desk, badge wearing)
8. Data classification and handling
9. Incident reporting procedures
10. Business continuity responsibilities

**Completion Target:** 100% of employees
**Evidence:** Training attendance records, completion certificates
**Frequency:** Annual, with quarterly refreshers for high-risk topics

---

### 4.2 Role-Specific Training

#### 4.2.1 CISO and Security Team

**Required Training:**
- Advanced incident response (Tabletop exercises)
- Vulnerability assessment techniques
- Threat hunting and intelligence
- Digital forensics
- Security architecture and design
- Regulatory compliance (HIPAA, GDPR, CCPA, SOC 2, ISO 27001)
- Security tool administration (SIEM, vulnerability scanner, WAF)
- Penetration testing methodologies

**Completion Target:** 100% of Security Team
**Evidence:** Training certificates, tabletop exercise reports, tool certifications
**Frequency:** Annual basic training, quarterly advanced training

---

#### 4.2.2 Development Team

**Required Training:**
- Secure coding practices (OWASP Top 10)
- SQL injection prevention
- Cross-site scripting (XSS) prevention
- Authentication and authorization best practices
- Cryptography and encryption
- API security
- Dependency management
- Secure software development lifecycle (SDLC)
- Code review security checklist

**Completion Target:** 100% of Development Team
**Evidence:** Training certificates, code review checklists, security code reviews
**Frequency:** Annual, with monthly security refreshers

---

#### 4.2.3 DevOps and Operations Team

**Required Training:**
- AWS security best practices
- Infrastructure as code (IaC) security
- Container security (Docker, Kubernetes)
- CI/CD pipeline security
- Network security (VPC, security groups, NACLs)
- Cloud security (IAM roles, KMS, CloudTrail)
- Backup and disaster recovery
- Monitoring and alerting
- Patch management

**Completion Target:** 100% of DevOps and Operations Team
**Evidence:** Training certificates, AWS certifications, infrastructure security reviews
**Frequency:** Annual, with quarterly refreshers

---

#### 4.2.4 Compliance Analysts

**Required Training:**
- SOC 2 Trust Services Criteria (TSC) interpretation
- ISO 27001:2022 implementation guidance
- HIPAA Security Rule detailed requirements
- GDPR Articles 25, 30, 33, 72 detailed analysis
- CCPA requirements and breach notification
- Evidence collection methodologies
- Audit preparation best practices
- Regulatory filing procedures

**Completion Target:** 100% of Compliance Analysts
**Evidence:** Training certificates, compliance certifications, audit preparation guides
**Frequency:** Annual, with quarterly regulatory updates

---

#### 4.2.5 Product and UX Teams

**Required Training:**
- Privacy by design and by default (GDPR Article 25)
- Data minimization principles
- Consent management best practices
- User experience for security controls (MFA, session timeout)
- Privacy notice drafting
- Data subject rights interfaces
- Security requirements in product design
- Secure UI/UX patterns (error messages, password reset)

**Completion Target:** 100% of Product and UX Teams
**Evidence:** Training certificates, privacy design reviews, UX security testing
**Frequency:** Annual, with quarterly refreshers

---

#### 4.2.6 Data and Privacy Teams

**Required Training:**
- Data classification and handling procedures
- GDPR data subject rights (Articles 15-17-20)
- Data processing agreement (DPA) drafting
- Data Protection Impact Assessment (DPIA) methodology (GDPR Article 35)
- Data breach notification procedures (60-day HIPAA, 72-hour GDPR)
- Data portability and erasure procedures
- Privacy policy interpretation
- Regulatory compliance for data handling

**Completion Target:** 100% of Data and Privacy Teams
**Evidence:** Training certificates, DPIA certifications, data handling procedure reviews
**Frequency:** Annual, with quarterly regulatory updates

---

#### 4.2.7 HR and Training Coordinator

**Required Training:**
- Employee screening and background checks
- Security awareness training delivery
- Phishing simulation administration
- Security policy violation handling
- Disciplinary process for security incidents
- Access termination procedures
- Confidentiality agreements (NDAs)
- Training tracking and reporting

**Completion Target:** 100% of HR and Training Team
**Evidence:** Training delivery records, phishing simulation reports, disciplinary procedure documentation
**Frequency:** Annual basic training, quarterly refresher

---

### 4.3 MFA for Privileged Access

**Requirement:** All users with privileged access (admin, security analyst, compliance analyst) must have MFA enabled.

**Training:**
- MFA setup and usage training
- Backup code usage and storage
- Recognizing MFA phishing attempts
- Lost device and recovery procedures

**Completion Target:** 100% of privileged users
**Evidence:** MFA enrollment reports, training attendance records

---

## 5. Approval Authority Matrix

### 5.1 Security Control Approvals

| Control | Approval Authority | Minimum Approver | Required Documentation | Timeframe |
|----------|-------------------|-------------------|----------------------|------------|
| **Access Request (Basic)** | Security Team Manager | Security Team Manager | Access request form | 24 hours |
| **Access Request (Privileged)** | CISO | CISO | Access request form + business justification | 48 hours |
| **Access Revocation** | Security Analyst (immediate), CISO (review) | Security Analyst | Access revocation form | Immediate action, 48-hour review |
| **Policy Change (Supporting)** | CISO | CISO | Change request form + impact assessment | 72 hours |
| **Policy Change (Major)** | CEO + ISSC | CEO | Change request form + ISSC recommendation | 14 days |
| **Risk Acceptance (Medium)** | ISSC | ISSC | Risk assessment + treatment plan | 30 days |
| **Risk Acceptance (High)** | CEO + ISSC | CEO | Risk assessment + ISSC recommendation | 7 days |
| **Security Tool Configuration** | Security Engineer (testing), CISO (production) | CISO | Configuration request + test results | 48 hours |
| **Incident Response Actions** | Incident Commander (operational), CISO (critical) | Incident Commander | Incident log + remediation plan | Immediate action, 24-hour review |
| **Breach Notification** | CEO + Legal | CEO + Legal | Breach notification template + legal review | 60 days (HIPAA) / 72 hours (GDPR) |

---

### 5.2 Technology and Infrastructure Approvals

| Category | Approval Authority | Minimum Approver | Required Documentation | Timeframe |
|-----------|-------------------|-------------------|----------------------|------------|
| **Development Process** | VP of Engineering | VP of Engineering | Process documentation | 30 days |
| **Technology Stack** | CTO | CTO | Technology evaluation + cost/benefit analysis | 30 days |
| **Cloud Infrastructure** | CTO + CISO | CTO | Architecture review + security assessment | 21 days |
| **Security Tool Selection** | CISO + CFO | CISO | RFP responses + cost/benefit analysis | 30 days |
| **Infrastructure Change** | DevOps Manager (minor), VP of Operations (major) | DevOps Manager | Change request form + impact assessment | 48 hours (minor), 14 days (major) |
| **Production Deployment** | VP of Engineering | VP of Engineering | Deployment checklist + sign-off | 7 days |
| **Database Migration** | DevOps Manager | DevOps Manager | Migration plan + rollback plan | 14 days |
| **Vendor Selection** | CFO + General Counsel | CFO + General Counsel | Vendor evaluation + security assessment | 30 days |
| **Vendor Contract** | General Counsel | General Counsel | Contract + BAA terms | 14 days |

---

### 5.3 Budget and Financial Approvals

| Category | Approval Authority | Minimum Approver | Required Documentation | Timeframe |
|-----------|-------------------|-------------------|----------------------|------------|
| **Security Budget** | CFO + CEO | CFO | Budget proposal + business case | Annual cycle |
| **Security Tool Purchases** | CISO + CFO | CFO | RFP responses + cost/benefit analysis | 30 days |
| **Insurance Coverage** | CFO + CEO | CFO | Insurance proposals + risk assessment | Annual cycle |
| **Vendor Contracts** | CFO + General Counsel | CFO + General Counsel | Contract + BAA terms + cost analysis | 30 days |
| **Emergency Spending** | CEO (immediate) | CFO | Emergency justification + post-approval documentation | Immediate action, 30-day review |

---

## 6. Key Risk Indicators

### 6.1 Incident Response KPIs

| KPI | Target | Measurement Method | Owner | Frequency |
|------|--------|------------------|--------|-----------|
| **Time to Detect (MTTD)** | <4 hours | Time from incident start to detection | CISO | Per incident |
| **Time to Contain (MTTC)** | <24 hours | Time from detection to containment | CISO | Per incident |
| **Time to Eradicate (MTTE)** | <48 hours | Time from containment to eradication | CISO | Per incident |
| **Time to Recover (MTTR)** | <72 hours | Time from eradication to recovery | CISO | Per incident |
| **Incident Resolution Time** | <7 days | Total incident resolution time | CISO | Per incident |
| **Breach Notification Time** | 60 days (HIPAA), 72 hours (GDPR) | Time from breach to notification | Legal Counsel | Per breach |
| **Incident Response Team Activation Time** | <1 hour | Time from incident declaration to team activation | CISO | Per incident |

---

### 6.2 Access Control KPIs

| KPI | Target | Measurement Method | Owner | Frequency |
|------|--------|------------------|--------|-----------|
| **MFA Enrollment Rate** | 80%+ within 3 months | Percentage of users with MFA enabled | CISO | Monthly |
| **Failed Login Attempts** | <5 consecutive attempts | Lockout after 5 failed attempts | Security Team | Daily |
| **Account Lockout Rate** | <2% of accounts | Percentage of accounts locked | Security Team | Monthly |
| **Access Request Approval Time** | 95% within SLA | Percentage of requests approved within SLA | Security Team | Weekly |
| **Access Review Completion Rate** | 100% quarterly | Percentage of access reviews completed | Compliance Analyst | Quarterly |
| **Privileged Access Review Rate** | 100% monthly | Percentage of privileged access reviewed | CISO | Monthly |
| **Access Revocation Time** | <4 hours | Time from request to revocation | Security Team | Per request |
| **Emergency Access Usage** | <1% of total access | Percentage of emergency access events | CISO | Monthly |

---

### 6.3 Training and Awareness KPIs

| KPI | Target | Measurement Method | Owner | Frequency |
|------|--------|------------------|--------|-----------|
| **Training Completion Rate** | 100% annually | Percentage of employees completing training | Training Coordinator | Monthly |
| **Training Attendance Rate** | 95%+ | Percentage of employees attending training | Training Coordinator | Per session |
| **Phishing Detection Rate** | >80% by Month 6 | Percentage of phishing emails detected | Training Coordinator | Per simulation |
| **Phishing Reporting Rate** | >60% | Percentage of phishing emails reported | Training Coordinator | Per simulation |
| **Security Awareness Quiz Score** | >90% | Average score on security awareness quiz | Training Coordinator | Per quiz |
| **Training Effectiveness Score** | >80% | Post-training evaluation score | Training Coordinator | Per training |
| **New Hire Security Training Completion Rate** | 100% within 30 days | Percentage of new hires completing training | VP of HR | Monthly |

---

### 6.4 Vulnerability and Patch Management KPIs

| KPI | Target | Measurement Method | Owner | Frequency |
|------|--------|------------------|--------|-----------|
| **Vulnerability Remediation SLA Compliance** | 95%+ | Percentage of vulnerabilities remediated within SLA | Security Engineers | Weekly |
| **Critical Vulnerability Remediation Time** | <7 days | Time from detection to remediation | Security Engineers | Per vulnerability |
| **High Vulnerability Remediation Time** | <14 days | Time from detection to remediation | Security Engineers | Per vulnerability |
| **Medium Vulnerability Remediation Time** | <30 days | Time from detection to remediation | Security Engineers | Per vulnerability |
| **Patch Compliance Rate** | 95%+ | Percentage of systems patched within SLA | DevOps Team | Monthly |
| **Unpatched Systems Rate** | <5% | Percentage of systems behind on patching | DevOps Team | Monthly |
| **Vulnerability Scan Coverage** | 100% | Percentage of systems scanned | Security Engineers | Monthly |

---

### 6.5 Compliance KPIs

| KPI | Target | Measurement Method | Owner | Frequency |
|------|--------|------------------|--------|-----------|
| **Evidence Collection Completeness** | 100% | Percentage of required evidence collected | Compliance Analyst | Weekly |
| **Audit Finding Remediation Rate** | 95%+ | Percentage of findings remediated within SLA | CISO + Compliance | Per audit |
| **Critical Audit Finding Remediation Time** | <14 days | Time from finding to remediation | CISO + Compliance | Per finding |
| **High Audit Finding Remediation Time** | <30 days | Time from finding to remediation | CISO + Compliance | Per finding |
| **Access Review Completion Rate** | 100% quarterly | Percentage of access reviews completed | Compliance Analyst | Quarterly |
| **Policy Compliance Rate** | 95%+ | Percentage of controls compliant with policy | Compliance Analyst | Quarterly |
| **Regulatory Filing Timeliness** | 100% on time | Percentage of regulatory filings on time | Legal Counsel | Per filing |

---

## 7. Compliance Mapping

### 7.1 SOC 2 Trust Services Criteria Mapping

**Common Criteria 1: Governance and Risk Management**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC1.1** (Governance and risk management) | CEO, CISO, ISSC | ISP policy, risk assessments, ISSC minutes | ✅ Documented |
| **CC1.2** (Risk assessment and management) | CISO, Security Team | Risk register, risk assessments, treatment plans | ✅ Documented |
| **CC1.3** (Monitoring objectives) | CISO, Security Team | Monitoring objectives, dashboards, KPIs | ✅ Documented |
| **CC1.4** (Risk response) | ISSC, CISO | Risk acceptance decisions | ✅ Documented |
| **CC1.5** (Security training) | VP of HR, Training Coordinator, CISO | Training materials, attendance records, phishing simulations | ✅ Documented |

**Common Criteria 2: System Availability**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC2.1** (Availability objectives) | VP of Operations, CTO | Availability targets, uptime reports, BCP | ✅ Documented |
| **CC2.2** (Change management) | VP of Engineering, DevOps Manager | Change management procedures, change logs | ✅ Documented |
| **CC2.3** (Incident response) | CISO, Incident Commander | Incident response plan, incident logs | ✅ Documented |
| **CC2.4** (Availability testing) | VP of Operations, CTO | Load tests, DR tests, BCP tests | ✅ Documented |
| **CC2.5** (Business continuity) | VP of Operations, CISO | BCP, DRP, test results | ⏳ In Phase 4 |

**Common Criteria 3: System Integrity (Change Management)**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC3.1** (Logical access controls) | CISO, Security Team | Access Control Policy, access logs | ✅ Documented |
| **CC3.2** (Data loss prevention) | CISO, Security Engineers | DLP policies, data loss incidents | ⏳ In Phase 2 |
| **CC3.3** (Data protection) | Data Privacy Officer, CISO | Data Classification Policy, encryption policies | ✅ Documented |
| **CC3.4** (Encryption evidence) | CISO, DevOps Team | Encryption configurations, key management | ⏳ In Phase 2 |
| **CC3.5** (Security controls) | CISO, Security Engineers | Security headers, CSRF protection, rate limiting | ✅ Documented |
| **CC3.6** (Vulnerability management) | Security Engineers, CISO | Vulnerability scans, remediation logs | ⏳ In Phase 3 |

**Common Criteria 4: Physical Security**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC4.1** (Physical access controls) | VP of Operations | Physical security procedures, access logs | ⏳ In Phase 3 |
| **CC4.2** (Data center security) | CTO, DevOps Team | AWS security configurations, data center access | ⏳ In Phase 3 |
| **CC4.3** (Workplace security) | VP of Operations | Remote work policies, workplace procedures | ✅ Documented |
| **CC4.4** (Device security) | VP of Operations, IT Support | Device policies, endpoint security | ⏳ In Phase 2 |

**Common Criteria 6: Logical and Physical Access**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC6.1** (Access control implementation) | CISO, Security Team | Access Control Policy, RBAC matrix | ✅ Documented |
| **CC6.2** (Access privilege management) | Compliance Analyst, CISO | Access reviews, privilege escalation logs | ⏳ In Phase 2 |
| **CC6.3** (Multi-factor authentication) | CISO, Security Engineers | MFA policy, MFA enrollment reports | ⏳ In Phase 2 |
| **CC6.4** (Access review) | Compliance Analyst, CISO | Access review reports, approval records | ⏳ In Phase 2 |
| **CC6.5** (Session management) | CISO, Security Team | Session Management Policy, session logs | ✅ Documented |
| **CC6.6** (Emergency access) | CISO, Security Team | Emergency access procedures, audit logs | ⏳ In Phase 4 |
| **CC6.7** (Access logging) | Security Analyst, CISO | Audit logs, access event logs | ✅ Documented |

**Common Criteria 7: System Operations**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC7.1** (Change management) | VP of Engineering, DevOps Manager | Change management procedures, change logs | ✅ Documented |
| **CC7.2** (Configuration management) | CTO, DevOps Team | Configuration management procedures | ✅ Documented |
| **CC7.3** (Patch management) | DevOps Team, Security Engineers | Patch management procedures, patch logs | ⏳ In Phase 3 |
| **CC7.4** (Incident response) | CISO, Incident Commander | Incident response plan, incident logs | ✅ Documented |
| **CC7.5** (System monitoring) | CISO, Security Analysts | Monitoring dashboards, alert rules | ⏳ In Phase 3 |

**Common Criteria 8: Data Protection**

| SOC 2 CC | Roles Responsible | Evidence Location | Implementation Status |
|-----------|----------------|-------------------|---------------------|
| **CC8.1** (Data protection policy) | Data Privacy Officer, CISO | Data Classification Policy, encryption policies | ✅ Documented |
| **CC8.2** (Data classification) | Data Governance Team, CISO | Data classification records, handling procedures | ✅ Documented |
| **CC8.3** (Data encryption) | CISO, DevOps Team | Encryption configurations, key management | ⏳ In Phase 2 |
| **CC8.4** (Data disposal) | VP of Operations, Compliance Analyst | Disposal procedures, disposal logs | ⏳ In Phase 4 |
| **CC8.5** (Data retention) | Data Governance Team, Compliance Analyst | Retention policies, disposal schedules | ✅ Documented |
| **CC8.6** (Data backup) | VP of Operations, DevOps Team | Backup procedures, test results | ⏳ In Phase 4 |

---

### 7.2 ISO 27001:2022 Control Mapping

**Annex A.5: Organizational Controls**

| ISO 27001 Control | Roles Responsible | SOC 2 Mapping | Implementation Status |
|------------------|----------------|---------------|---------------------|
| **A.5.1** (Policies for information security) | CEO, CISO, ISSC | CC1.1 | ✅ Documented |
| **A.5.2** (Roles and responsibilities) | CEO, CISO, HR | CC1.1 | ✅ Documented |
| **A.5.3** (Risk assessment process) | CISO, Security Team | CC1.2 | ✅ Documented |
| **A.5.4** (Risk treatment process) | ISSC, CISO | CC1.4 | ✅ Documented |
| **A.5.5** (Information security policies) | CISO, Security Team | CC1.1 | ✅ Documented |
| **A.5.6** (Contact with authorities) | Legal Counsel, CISO | CC1.1 | ✅ Documented |
| **A.5.7** (Threat intelligence) | Security Analyst, CISO | CC1.3 | ⏳ In Phase 3 |
| **A.5.8** (Project security) | VP of Product, CISO | CC3.1 | ⏳ In Phase 2 |
| **A.5.9** (Inventory of information assets) | CISO, Data Governance Team | CC1.1 | ✅ Documented |
| **A.5.10** (Acceptable use policy) | HR, CISO | CC1.1 | ⏳ To be created |
| **A.5.11** (Returning assets) | VP of Operations, HR | CC1.1 | ⏳ To be created |
| **A.5.12** (Classification of information) | Data Governance Team, CISO | CC8.2 | ✅ Documented |
| **A.5.13** (Information transfer) | Data Privacy Officer, CISO | CC8.6 | ✅ Documented |
| **A.5.14** (Access control policy) | CISO, Security Team | CC6.1 | ✅ Documented |
| **A.5.15** (User access) | CISO, Security Team | CC6.1 | ⏳ In Phase 2 |
| **A.5.16** (Identity management) | CISO, Security Team | CC6.1 | ⏳ In Phase 2 |
| **A.5.17** (Authentication) | CISO, Security Engineers | CC6.3 | ⏳ In Phase 2 |
| **A.5.18** (Access rights) | Compliance Analyst, CISO | CC6.2 | ⏳ In Phase 2 |
| **A.5.19** (Supplier security) | CISO, Legal Counsel | CC4.3 | ⏳ To be created |
| **A.5.20** (Addressing information security within supplier agreements) | Legal Counsel, CISO | CC4.3 | ⏳ To be created |
| **A.5.21** (Managing information security within supplier relationships) | CISO, Legal Counsel | CC4.3 | ⏳ To be created |
| **A.5.22** (Managing information security incidents) | CISO, Incident Commander | CC5.1 | ✅ Documented |
| **A.5.23** (Information security awareness, education and training) | VP of HR, Training Coordinator, CISO | CC1.5 | ✅ Documented |
| **A.5.24** (Employment termination) | VP of HR, CISO | CC6.4 | ⏳ In Phase 2 |
| **A.5.25** (Contractor access) | CISO, HR | CC6.1 | ⏳ To be created |
| **A.5.26** (Teleworking) | VP of Operations, CISO | CC4.3 | ✅ Documented |
| **A.5.27** (Mobile devices) | VP of Operations, CISO | CC4.4 | ⏳ In Phase 2 |
| **A.5.28** (Bring your own device) | VP of Operations, CISO | CC4.4 | ⏳ In Phase 2 |
| **A.5.29** (Information transfer) | Data Privacy Officer, CISO | CC8.6 | ✅ Documented |
| **A.5.30** (Information security for ICT readiness for business continuity) | VP of Operations, CISO | CC2.5 | ⏳ In Phase 4 |

---

### 7.3 HIPAA Security Rule Mapping

**Administrative Safeguards (45 CFR §164.308(a))**

| HIPAA Safeguard | Roles Responsible | SOC 2 Mapping | ISO 27001 Mapping | Implementation Status |
|----------------|----------------|---------------|-------------------|---------------------|
| **§164.308(a)(1)** (Security management process) | CEO, CISO, ISSC | CC1.1 | A.5.1 | ✅ Documented |
| **§164.308(a)(1)(i)(A)** (Risk analysis) | CISO, Security Team | CC1.2 | A.5.3 | ✅ Documented |
| **§164.308(a)(1)(ii)(A)** (Risk management) | CISO, Security Team | CC1.2 | A.5.3 | ✅ Documented |
| **§164.308(a)(1)(ii)(B)** (Sanction policy) | CISO, HR, VP of HR | CC1.5 | A.6.3 | ⏳ To be created |
| **§164.308(a)(1)(ii)(C)** (Information system activity review) | CISO, Security Analyst | CC8.1 | A.8.15 | ✅ Documented |
| **§164.308(a)(2)** (Assigned security official) | CEO, CISO | CC1.1 | A.5.1 | ✅ Documented |
| **§164.308(a)(2)(i)** (Workforce security and training) | VP of HR, Training Coordinator, CISO | CC1.5 | A.6.3 | ✅ Documented |
| **§164.308(a)(2)(ii)(A)** (Authorization and/or supervision) | CISO, Security Team | CC6.1 | A.5.18 | ⏳ In Phase 2 |
| **§164.308(a)(2)(ii)(B)** (Workforce clearance procedure) | VP of HR, CISO | CC6.1 | A.5.18 | ⏳ In Phase 2 |
| **§164.308(a)(3)(i)** (Information access management) | CISO, Security Team | CC6.1 | A.5.15 | ⏳ In Phase 2 |
| **§164.308(a)(3)(ii)(A)** (Access authorization) | CISO, Compliance Analyst | CC6.2 | A.5.18 | ⏳ In Phase 2 |
| **§164.308(a)(3)(ii)(B)** (Access establishment and modification) | CISO, Compliance Analyst | CC6.2 | A.5.18 | ⏳ In Phase 2 |
| **§164.308(a)(3)(ii)(C)** (Access termination) | CISO, HR, Security Team | CC6.4 | A.5.24 | ⏳ In Phase 2 |
| **§164.308(a)(4)** (Access controls) | CISO, Security Team | CC6.1 | A.5.15 | ✅ Documented |
| **§164.308(a)(5)** (Security incident procedures) | CISO, Incident Commander, Legal Counsel | CC5.1 | A.5.24 | ✅ Documented |
| **§164.308(a)(5)(ii)** (Response and reporting) | CISO, Incident Commander, Legal Counsel | CC5.2 | A.5.24 | ✅ Documented |

**Physical Safeguards (45 CFR §164.310)**

| HIPAA Safeguard | Roles Responsible | SOC 2 Mapping | ISO 27001 Mapping | Implementation Status |
|----------------|----------------|---------------|-------------------|---------------------|
| **§164.310(a)(1)** (Facility access controls) | VP of Operations, CISO | CC4.1 | A.7.1 | ⏳ In Phase 3 |
| **§164.310(a)(2)** (Contingency operations) | VP of Operations, CISO | CC2.1 | A.8.30 | ⏳ In Phase 4 |
| **§164.310(b)** (Workstation use) | VP of Operations, HR | CC4.3 | A.7.2 | ⏳ To be created |
| **§164.310(c)** (Device and media controls) | VP of Operations, IT Support | CC4.4 | A.7.10 | ⏳ In Phase 2 |

**Technical Safeguards (45 CFR §164.312)**

| HIPAA Safeguard | Roles Responsible | SOC 2 Mapping | ISO 27001 Mapping | Implementation Status |
|----------------|----------------|---------------|-------------------|---------------------|
| **§164.312(a)(1)** (Access control) | CISO, Security Team | CC6.1 | A.5.15 | ⏳ In Phase 2 |
| **§164.312(a)(2)(i)** (Unique user identification) | CISO, Security Team | CC6.1 | A.5.15 | ✅ Documented |
| **§164.312(a)(2)(ii)(A)** (Emergency access procedure) | CISO, Security Team | CC6.6 | A.5.18 | ⏳ In Phase 4 |
| **§164.312(a)(2)(ii)(C)** (Automatic logoff) | CISO, Security Team | CC6.5 | A.5.18 | ✅ Documented |
| **§164.312(a)(2)(iv)** (Encryption and decryption) | CISO, DevOps Team | CC3.4 | A.8.24 | ⏳ In Phase 2 |
| **§164.312(b)** (Audit controls) | CISO, Security Analyst | CC8.1 | A.8.15 | ✅ Documented |
| **§164.312(c)(1)** (Integrity) | CISO, DevOps Team | CC3.2 | A.8.10 | ⏳ In Phase 2 |
| **§164.312(d)(1)** (Transmission security) | CISO, DevOps Team | CC3.4 | A.8.24 | ✅ Documented |
| **§164.312(e)** (Person or entity authentication) | CISO, Security Team | CC6.3 | A.5.17 | ⏳ In Phase 2 |

---

### 7.4 GDPR Mapping

**Key GDPR Articles Mapped:**

| GDPR Article | SOC 2 Mapping | ISO 27001 Mapping | HIPAA Mapping | Roles Responsible | Implementation Status |
|-------------|---------------|-------------------|---------------|----------------|---------------------|
| **Article 25** (Data protection by design and by default) | CC3.2, CC8.1 | A.8.1, A.8.15 | Not applicable | VP of Product, Data Privacy Officer | ⏳ In Phase 2 |
| **Article 30** (Records of processing activities) | CC1.1, CC8.1 | A.5.1, A.5.10 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ In Phase 2 |
| **Article 33** (Notification of personal data breach) | CC5.2 | A.5.22 | §164.308(a)(5)(ii) | CISO, Incident Commander, Legal Counsel | ⏳ In Phase 4 |
| **Article 72** (Data subject access requests) | CC6.1 | A.5.15 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ In Phase 2 |
| **Article 5** (Principles relating to processing of personal data) | CC1.1, CC8.2 | A.5.1 | Not applicable | Data Privacy Officer | ⏳ In Phase 2 |
| **Article 9** (Processing of special categories of personal data) | CC6.1, CC8.2 | A.5.12 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ In Phase 2 |
| **Article 32** (Security of processing) | CC3.1, CC3.4, CC6.1 | A.8.1, A.8.24 | §164.312 | CISO, Security Team | ⏳ In Phase 2 |

---

### 7.5 CCPA Mapping

**Key CCPA Requirements Mapped:**

| CCPA Requirement | SOC 2 Mapping | ISO 27001 Mapping | HIPAA Mapping | Roles Responsible | Implementation Status |
|----------------|---------------|-------------------|---------------|----------------|---------------------|
| **1798.150(c)(1)** (Security practices) | CC3.1, CC6.1 | A.8.1, A.5.15 | §164.312 | CISO, Security Team | ⏳ In Phase 2 |
| **Right to know** (Access to personal information) | CC6.1 | A.5.15 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ In Phase 2 |
| **Right to delete** (Deletion of personal information) | CC6.1 | A.5.11 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ In Phase 2 |
| **Right to opt-out** (Opt-out of sale of personal information) | CC8.1 | A.5.10 | Not applicable | Data Privacy Officer, Compliance Analyst | ⏳ To be created |
| **Right to equal service** (Non-discrimination) | CC1.1 | A.5.1 | Not applicable | VP of HR, General Counsel | ⏳ To be created |

---

## 8. MFA for Privileged Access

### 8.1 Requirement

**Policy:** All users with privileged access must have Multi-Factor Authentication (MFA) enabled and configured before access is granted.

**Privileged Access Roles:**
- Administrator (admin)
- Security Analyst (security_analyst)
- Compliance Analyst (compliance_analyst)
- Developer (developer)
- DevOps Engineer
- Database Administrator

### 8.2 MFA Implementation

**MFA Methods:**
- **TOTP (Time-based One-Time Password):** Google Authenticator, Authy, Microsoft Authenticator
- **Backup Codes:** 10 one-time use codes for emergency access
- **Hardware Token:** YubiKey (optional for high-security accounts)

**Enforcement:**
1. New privileged accounts cannot be created without MFA enrollment
2. Existing privileged accounts must enable MFA within 30 days of policy enforcement
3. MFA verification required for all privileged access attempts
4. Backup codes generated and provided during MFA setup
5. Lost devices must be reported immediately, temporary MFA issued

### 8.3 Emergency Access with MFA Bypass

**Scenario:** Emergency access required when MFA device is unavailable (lost, stolen, battery dead).

**Process:**
1. Request emergency access from CISO
2. Provide business justification and identity verification
3. CISO approves emergency access (temporary, limited duration)
4. Generate temporary access token (8-hour maximum)
5. Access logged with emergency bypass reason
6. User must re-enable MFA or get new device within 24 hours

---

## 9. Access Request and Approval Workflow

### 9.1 Access Request Process

**Step 1: Access Request Submission**
- Requester submits access request form:
  - System or data being accessed
  - Access level required (basic, standard, sensitive, privileged)
  - Business justification
  - Duration of access required
  - Approver (based on access level)
  - Date of request

**Step 2: Manager Review**
- Manager reviews request:
  - Validates business need
  - Confirms appropriate access level
  - Approves or rejects request
  - Documents justification for rejection
  - Forwards approved request to Security Team

**Step 3: Security Team Review**
- Security Team reviews approved request:
  - Verifies principle of least privilege
  - Checks for role-based access
  - Reviews access duration
  - Confirms existing access doesn't conflict
  - Implements access controls

**Step 4: Access Provisioning**
- DevOps or IT Support provisions access:
  - Creates account or updates existing permissions
  - Configures appropriate restrictions
  - Enables MFA (if required)
  - Notifies requester of access granted

**Step 5: Access Confirmation**
- Requester confirms access:
  - Tests access to granted systems/data
  - Confirms access level meets needs
  - Reports any issues immediately

---

### 9.2 Access Revocation Process

**Immediate Revocation (Critical Security Incidents):**
1. **Trigger:** Security incident, insider threat, compromise suspected
2. **Action:** Security Analyst or CISO initiates immediate revocation
3. **Authority:** No additional approval required for immediate security concerns
4. **Notification:**
   - Requester notified immediately
   - Manager notified
   - Audit trail created
   - Security incident initiated

**Planned Revocation:**
1. **Trigger:** Role change, employment termination, contract end, no longer needed
2. **Request:** Manager or HR submits revocation request
3. **Approval:** Security Team reviews and approves
4. **Action:** DevOps or IT Support revokes access within SLA (4 hours)
5. **Notification:**
   - Requester notified
   - Manager notified
   - Audit trail created
   - Asset return if applicable

**Verification:**
- Access verified as revoked
- Account disabled or permissions removed
- MFA disabled or reconfigured
- Audit log entry created

---

## 10. Document Version Control

| Version | Date | Changes | Author | Approver |
|---------|-------|----------|--------|----------|
| 1.0 | January 28, 2026 | Initial version | CISO |
| 2.0 | February 8, 2026 | Recreated with comprehensive NIST CSF alignment | CISO |

---

## Conclusion

This document establishes clear security roles and responsibilities across Health-Mesh Medical Research Platform. By defining accountability, approval authorities, training requirements, and compliance mappings, the organization ensures all personnel understand their security obligations and responsibilities.

**Key Takeaways:**
- Clear role definitions with specific responsibilities
- Comprehensive approval authority matrix
- Training requirements defined for all roles
- Incident response team structure established
- KPIs defined for continuous improvement
- Compliance mappings to SOC 2, ISO 27001, HIPAA, GDPR, and CCPA

**Next Steps:**
1. Distribute this document to all personnel
2. Obtain acknowledgment of understanding
3. Begin implementing role-specific training programs
4. Set up KPI tracking and reporting
5. Conduct annual security roles and responsibilities review

---

**Document End**
