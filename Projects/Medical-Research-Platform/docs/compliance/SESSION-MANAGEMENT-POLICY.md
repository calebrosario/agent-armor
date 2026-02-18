# Session Management Policy

**Document Owner:** Chief Information Security Officer (CISO)
**Effective Date:** [Date]
**Review Date:** [Date + 1 year]
**Version:** 1.0

---

## Executive Summary

This Session Management Policy establishes requirements for managing user sessions across Health-Mesh platform. It implements HIPAA §164.312(a)(1)(ii)(C) (automatic logoff), SOC 2 CC6.1 (logical access controls), and ISO 27001 A.5.17 (authentication information) compliance.

**Purpose:**
1. Enforce session timeout to prevent unauthorized access
2. Provide secure session tokens and management
3. Implement session revocation for compromised accounts
4. Monitor session activity for security incidents
5. Maintain audit trail of all session events

---

## 1. Session Requirements

### 1.1 HIPAA Compliance

**Requirement:** §164.312(a)(1)(ii)(C) - Automatic Logoff
**Description:** Implement automatic termination of an electronic session after a time of inactivity.

**Health-Mesh Implementation:**
- **Idle Timeout:** 15 minutes of inactivity terminates session
- **Absolute Timeout:** 8 hours maximum session duration
- **Implementation:** API middleware enforces timeout for all user sessions
- **Evidence:** Session timeout logic in `auth.middleware.ts`

**Requirement:** §164.312(a)(1)(ii)(D) - Emergency Access Termination
**Description:** Terminate emergency procedures for emergency access termination.

**Health-Mesh Implementation:**
- CISO can immediately terminate any session for emergency security reasons
- Emergency access triggers: suspicious activity, compromised credentials, legal requirement
- Implementation: Emergency termination workflow with audit logging
- **Evidence:** Emergency session termination procedures documented in Information Security Policy

**Requirement:** §164.312(a)(1)(ii)(E) - Encryption and Decryption
**Description:** Encrypt and decrypt PHI at rest.

**Health-Mesh Implementation:**
- **Encryption at Rest:** All data encrypted at rest using AES-256
- **Encryption in Transit:** TLS 1.3 for all data in transit
- **Implementation:** PostgreSQL RDS encryption, S3 SSE-S3 encryption
- **Evidence:** Encryption documented in ASSET-INVENTORY.md and DATA-CLASSIFICATION-POLICY.md

### 1.2 SOC 2 Compliance

**Trust Service Criteria (TSC):** CC6.1 - Logical Access Controls

**Relevant Sections:**
- CC6.1.1 - Logical access to program operation
- CC6.1.2 - Logical access to data storage
- CC6.6 - Logical access to audit information

**Evidence:**
- RBAC implementation (see ACCESS-CONTROL-POLICY.md)
- Session timeout implementation (this document)
- Audit logging for all session events

### 1.3 ISO 27001 Compliance

**Control A.5.17 - Authentication Information**

**Objective:** Authenticate users and manage authentication information.

**Evidence:**
- MFA implementation (see ACCESS-CONTROL-POLICY.md)
- Session management (this document)
- Password policies documented in Information Security Policy

---

## 2. Session Architecture

### 2.1 Session Flow

```
User Login
    ↓ (Authentication)
JWT Token Generated
    ↓ (Session Storage)
Redis (key: "sess:{userId}")
    ↓ (JWT Validation)
Access Granted
    ↓ (Session Created)
Active Session
    ↓ (Session Refresh)
Timer: 15 min idle, 8 hr absolute
    ↓ (Session Expiration)
Session Terminated
```

### 2.2 Session Storage

**Storage System:** Redis (ElastiCache)
**Session Key Format:** `sess:{userId}`
**Session Data Stored:**
- User ID
- User email
- Session creation timestamp
- Session expiration timestamp
- User agent and IP address
- CSRF token (for double-submit pattern)

**Session TTL Configuration:**
- Idle timeout: 900 seconds (15 minutes)
- Absolute timeout: 28,800 seconds (8 hours)
- Token expiration: Matches session TTL

### 2.3 Security Features

**Session Security:**
- **Secure Tokens:** JWT tokens signed with strong secret
- **CSRF Protection:** Double-submit pattern with /api/csrf-token endpoint
- **Rate Limiting:** Session creation rate limiting
- **Device Fingerprinting:** Detect session anomalies from device/IP changes
- **Concurrent Session Limiting:** Maximum 1 active session per user

---

## 3. Session Configuration

### 3.1 Timeouts

| Timeout Type | Duration | Implementation | Rationale |
|-------------|----------|-------------|------------|
| **Idle Timeout** | 15 minutes | API middleware | HIPAA §164.312(a)(1)(ii)(C) - Prevents unauthorized access to abandoned workstations |
| **Absolute Timeout** | 8 hours | API middleware | HIPAA §164.312(a)(1)(ii)(C) - Limits exposure of compromised sessions |

**Rationale:**
- 15-minute idle timeout prevents unauthorized access from unattended devices
- 8-hour absolute timeout limits credential exposure from compromised sessions
- Aligns with industry best practices (NIST CSF)

### 3.2 Token Expiration

| Token Type | Duration | Configuration |
|-------------|----------|-------------|
| **Access Token** | Matches session TTL | Redis TTL: 900s (15m) |
| **Refresh Token** | 30 minutes | Custom refresh tokens extend session |
| **Remember Me Token** | 30 days | Persistent authentication option |

### 3.3 Concurrent Session Limits

| Limit | Rationale | Implementation |
|-------|---------|-------------|------------|
| **Maximum Sessions** | 1 per user | Check existing sessions before creating new session |
| **Rate Limiting** | 10 sessions per hour per user | API rate limiting |
| **Platform-Wide** | 1,000 concurrent sessions maximum | Redis configuration |

---

## 4. Session Lifecycle

### 4.1 Session Creation

**Process:**
1. **Authentication:** User authenticates with credentials
2. **MFA Verification:** User completes MFA challenge (if enabled)
3. **Access Approval:** System verifies user has required access
4. **Session Token Generation:** JWT token created with user claims
5. **Session Storage:** Session created in Redis with expiration
6. **CSRF Token Generation:** CSRF token created for session
7. **Session Initialization:** User session context initialized

**Security Controls:**
- Password hashing with bcrypt (minimum 12 characters)
- JWT signing with secure secret
- MFA enforcement (if applicable)
- Session rate limiting
- Device fingerprinting
- IP reputation checking

### 4.2 Session Usage

**Process:**
1. **Token Validation:** JWT token validated on each API request
2. **Session Lookup:** Redis lookup for active session
3. **Session Refresh:** JWT token refreshed within idle period
4. **Authorization Check:** User permissions verified before protected operations
5. **Session Expiration:** Session terminated when TTL expires
6. **CSRF Validation:** CSRF token validated for state-changing operations

**Security Controls:**
- JWT expiration validation
- Redis session validation
- CSRF protection for all state-changing requests
- Permission checks before sensitive operations

### 4.3 Session Termination

**Triggers:**
1. **Idle Timeout:** 15 minutes of inactivity
2. **Absolute Timeout:** 8 hours total duration
3. **User Logout:** User explicitly logs out
4. **Admin Termination:** Administrator terminates session
5. **Security Termination:** CISO terminates for security incident
6. **Password Change:** User changes password (invalidates current sessions)
7. **Token Revocation:** JWT token added to blocklist

**Process:**
1. **Session Invalidation:** Session marked as invalid in Redis
2. **Cleanup:** Session context cleared
3. **Audit Logging:** Termination event logged with reason
4. **Notification:** User notified via email (if applicable)

**Security Controls:**
- Immediate session invalidation
- Audit logging of all termination events
- Security incident reporting for suspicious terminations

---

## 5. Session Refresh

### 5.1 Refresh Token Strategy

**Refresh Triggers:**
1. **Halfway Point:** Token age > 50% of TTL (7.5 minutes)
2. **Near Expiration:** Token expires within 5 minutes of expiration
3. **Activity Detection:** User activity detected (API call, page navigation)

**Implementation:**
- Custom JWT refresh tokens issued with longer validity (30 days)
- Client-side auto-refresh tokens when token approaching expiration
- Silent refresh in background without user disruption

**Security Controls:**
- Token rotation on refresh
- Background token refresh to prevent session disruption
- Audit logging for refresh events

---

## 6. Security Monitoring

### 6.1 Session Anomaly Detection

**Detection Rules:**

| Anomaly Type | Detection Method | Threshold | Action |
|--------------|------------------|------------|---------|
| **Concurrent Sessions** | Check Redis for multiple active sessions for same user | >1 → Alert user |
| **Device Fingerprinting** | IP address changes detected for active session → Immediate review | Revoke session |
| **Geographic Anomaly** | Login from unusual location | Verify with user | Alert security team |
| **Velocity Violations** | More than 5 sensitive API calls per minute | Rate limit user |
| **Session Hijacking** | Session used from different IP than usual pattern → Verify with user | Revoke session |
| **Impossible Travel** | Login from geographically distant location → Verify with user | Revoke session |

**Implementation:**
- Real-time session monitoring via Redis logs
- Alert Service integration with Risk Scoring Service
- Automated risk scoring for session anomalies
- Incident response procedures for confirmed compromises

**Evidence:**
- Risk detection rules for session anomalies in RISK-RULES-ENGINE.service.ts
- Alert routing via ALERT-ROUTES.md (Severity-based: HIGH for session hijacking)

---

## 7. Audit Logging

### 7.1 Session Events to Log

**Required Events (per compliance):**
- Session creation (timestamp, user ID, IP, user agent, device fingerprint)
- Session refresh (timestamp, user ID, token age)
- Session expiration (timestamp, user ID, reason)
- Session invalidation (timestamp, user ID, trigger)
- Session termination (timestamp, user ID, trigger, terminator)
- Session revocation (timestamp, user ID, trigger, revoker)
- CSRF token generation (timestamp, user ID)
- Failed authentication attempts (timestamp, user ID, IP, failure reason)
- Authorization failures (timestamp, user ID, operation, failure reason)

**Log Storage:**
- **Location:** PostgreSQL RDS, table: `audit_logs`
- **Retention:** 7 years (SOC 2 requirement)
- **Format:** Structured JSON in AuditLog entity
- **Access Control:** Read-only for security analysts and CISO

**Implementation:**
- Audit middleware logs all session events to PostgreSQL
- Winston logger with structured logging (user ID, IP, event type)
- PII masking in logs (email, name in logs)

---

## 8. Session Recovery

### 8.1 Incident Response Procedures

**Incidents Triggering Session Termination:**
1. **Compromised Credentials:** User reports credentials shared
2. **Stolen Device:** User reports device lost or stolen
3. **Phishing Attack:** User provided credentials to malicious site
4. **Session Hijacking:** Unusual activity detected by user

**Response Actions:**
1. **Immediate Session Termination:** All sessions for user terminated immediately
2. **Password Reset:** User forced password reset on next login
3. **MFA Enforcement:** Require MFA re-authentication for next login
4. **Account Review:** Investigate account for recent suspicious activity
5. **Security Notification:** Notify security team immediately

**Post-Incident:**
1. **Forensic Analysis:** Review Redis logs for session hijacking evidence
2. **IP Reputation Check:** Check IP geolocation and reputation
3. **User Notification:** Provide incident summary to user
4. **Account Cleanup:** Close account or limit access if necessary
5. **Legal Review:** Consult General Counsel if >$10K potential loss

---

## 9. Compliance Evidence

### 9.1 HIPAA Requirements

| Requirement | Evidence | Status |
|-------------|----------|--------|
| **§164.312(a)(1)(ii)(C) - Automatic Logoff** | ✅ Implemented via middleware, 15/8 timeout | ✅ |
| **§164.312(a)(1)(ii)(D) - Emergency Termination** | ✅ Procedures documented | ✅ |
| **§164.312(e)(1) - Encryption and Decryption** | ✅ AES-256 at rest, TLS 1.3 in transit | ✅ |

### 9.2 SOC 2 Requirements

| Requirement | Evidence | Status |
|-------------|----------|--------|
| **CC6.1 - Logical Access Controls** | ✅ RBAC implemented, session control, access reviews | ✅ |
| **CC6.6 - Logical Access to Data Storage** | ✅ JWT auth, session management, RBAC on data access | ✅ |
| **CC8.1 - Monitoring of System Activity** | ✅ Winston audit logging, session anomaly detection | ✅ |

### 9.3 ISO 27001 Requirements

| Requirement | Evidence | Status |
|-------------|----------|--------|
| **A.5.17 - Authentication Information** | ✅ MFA, JWT, password policies | ✅ |
| **A.8.15 - Logging** | ✅ Comprehensive audit logging, 7-year retention | ✅ |

---

## 10. Appendix

### Appendix A: Session Configuration Values

| Configuration Parameter | Value | Unit | Rationale |
|----------------------|-------|--------|-----------|
| **IDLE_TIMEOUT_SECONDS** | 900 | seconds | 15 minutes of inactivity timeout |
| **ABSOLUTE_TIMEOUT_SECONDS** | 28800 | seconds | 8 hours absolute session timeout |
| **JWT_TOKEN_EXPIRY_MINUTES** | 30 | minutes | Custom refresh token validity |
| **JWT_TOKEN_EXPIRY_DAYS** | 30 | days | Remember Me token validity |
| **MAX_CONCURRENT_SESSIONS_PER_USER** | 1 | Limit concurrent sessions per user |
| **SESSION_RATE_LIMIT_PER_HOUR** | 10 | Rate limit for session creation |
| **PLATFORM_WIDE_SESSION_LIMIT** | 1000 | Platform-wide concurrent session limit |
| **CSRF_TOKEN_EXPIRY_MINUTES** | 30 | minutes | CSRF token validity |

### Appendix B: Error Codes

| Error Code | Description | Severity | Action |
|-----------|-------------|-----------|---------|-----------|
| **ERR_SESS_EXPIRED** | Session expired due to inactivity | Low | Redirect to login |
| **ERR_SESS_INVALID** | Session invalid or tampered | High | Force logout, investigate |
| **ERR_MFA_FAILED** | MFA verification failed | Medium | Block login temporarily |
| **ERR_CSRF_INVALID** | CSRF token validation failed | High | Block request, investigate |
| **ERR_RATE_LIMIT** | Too many session creation attempts | Medium | Temporary block, investigate |
| **ERR_DEVICE_CHANGED** | Device fingerprint mismatch | Medium | Verify with user |
| **ERR_GEO_MISMATCH** | Login from unusual location | Medium | Verify with user |

### Appendix C: Audit Log Schema

**Table:** `audit_logs` (PostgreSQL)

| Columns:
- `id` (Primary Key) - Auto-incrementing integer
- `timestamp` - Event timestamp with timezone
- `event_type` - Session lifecycle event (created, refreshed, expired, invalidated, terminated, revoked, failed_auth, csrf_token_generated)
- `user_id` - Foreign key to users table
- `user_email` - Email address (PII masked in logs)
- `ip_address` - User's IP address
- `user_agent` - Browser user agent string
- `device_fingerprint` - Hash of device characteristics
- `csrf_token_hash` | CSRF token fingerprint
- `session_id` - Redis session key
- `token_age_seconds` - JWT token age at event time
- `token_expires_at` - When session expires
- `reason_code` - Error code from Appendix B
- `trigger` | User action or system event
- `terminator_id` | ID of admin or system if terminated
- `admin_user_id` | ID of admin who terminated session
- `created_at` - When audit log entry was created
- `updated_at` - When audit log entry was last updated

---

## 11. Document Control

| Version | Date | Changes | Approved By |
|---------|-------|---------|--------------|
| 1.0 | [Date] | Initial document creation | CISO |

---

**Document Classification:** Confidential

**Distribution:** All Health-Mesh security team, developers, and operations team

---

**Last Updated:** [Date]

**Next Review Date:** [Date + 1 year]

---

*This Session Management Policy aligns with NIST Cybersecurity Framework 2.1 (Protect function), HIPAA Security Rule §164.312(a)(1), SOC 2 Type II Trust Services Criteria (Security + Availability), and ISO/IEC 27001:2022 standards.*
