# Phase 2: Access Control Implementation Guide

## Document Information

- **Document ID:** CC-PHASE2-001
- **Version:** 1.0
- **Created:** February 8, 2026
- **Last Updated:** February 8, 2026
- **Owner:** CISO + DevOps Team
- **Status:** In Progress
- **Classification:** Confidential

## Executive Summary

**Phase 2: Access Control Implementation** focuses on translating the comprehensive policies created in Phase 1 into enforceable technical controls. This phase implements Role-Based Access Control (RBAC), Multi-Factor Authentication (MFA), session management, and audit logging in code.

**Timeline:** Months 4-6
**Key Deliverables:**
- RBAC enforcement in database and code
- MFA implementation for all users
- Session timeout enforcement (15-min idle, 8-hr absolute)
- Comprehensive audit logging
- Access review and revocation workflow
- Control testing and validation

---

## Current State Assessment

### Existing Controls

| Control Area | Implementation Status | Gaps |
|---------------|----------------------|-------|
| **Authentication Middleware** | ✅ JWT authentication with `authenticateToken()` and `requireRole()` | Role not stored in User entity |
| **Security Headers** | ✅ Helmet middleware with CSP, HSTS, frameguard, noSniff | None |
| **CSRF Protection** | ✅ csrf-csrf middleware with `/api/csrf-token` endpoint | None |
| **Audit Logging** | ✅ Comprehensive audit middleware with PII masking, session tracking, geo location | Evidence collection not automated |
| **Session Management** | ⏳ Policy documented but not enforced in middleware | Session timeout not enforced |
| **MFA** | ❌ Not implemented | No MFA for any users |
| **RBAC Database** | ⏳ Role checks in middleware but not persisted | No role column in User entity |
| **Access Reviews** | ❌ Not implemented | No automated access review process |
| **Access Revocation** | ⏳ Basic JWT token revocation | No formal workflow |

### Infrastructure Review

**Authentication Flow:**
```
User Login → JWT Token Generation → Token Stored in Client
                 ↓
            Request with Bearer Token
                 ↓
          authenticateToken() Middleware
                 ↓
          Role Check via requireRole()
                 ↓
            Access Granted/Denied
```

**Current Issues:**
1. **Role Not Persisted:** User entity lacks role column, roles only exist in JWT payload
2. **No MFA:** Password-only authentication, no second factor
3. **Session Not Managed:** Session IDs generated but not tracked for timeout enforcement
4. **No Access Reviews:** No process to review and revoke access
5. **Manual Evidence Collection:** Audit logs stored but not exported for evidence repository

---

## Implementation Plan

### Month 4: RBAC Enforcement and Access Control

#### Week 1-2: RBAC Database Implementation

**Objective:** Add role support to database and implement RBAC enforcement

**Tasks:**

1. **Add Role Column to User Entity**
   ```typescript
   // api/entities/User.ts
   @Column({ type: 'varchar', length: 50, default: 'user' })
   role!: string;
   ```

2. **Create Database Migration**
   ```typescript
   // api/migrations/migrations/<timestamp>-AddRoleToUser.ts
   import { MigrationInterface, QueryRunner } from 'typeorm';

   export class AddRoleToUser1234567890 implements MigrationInterface {
     public async up(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.addColumn('users', 'role', {
         type: 'varchar',
         length: 50,
         default: "'user'",
         isNullable: false
       });
     }

     public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.dropColumn('users', 'role');
     }
   }
   ```

3. **Update Authentication Middleware to Use Database Role**
   ```typescript
   // api/middleware/auth.middleware.ts
   import { getConnection } from 'typeorm';
   import { User } from '../entities/User';

   export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
     const authHeader = req.headers.authorization;

     if (!authHeader) {
       return res.status(401).json({ error: 'No token provided' });
     }

     const token = authHeader.replace('Bearer ', '');

     try {
       const decoded = jwt.verify(token, getJwtSecretSync()) as any;
       const userId = decoded.userId || decoded.sub;

       // Fetch user from database to get current role
       const dataSource = getConnection();
       const userRepo = dataSource.getRepository(User);
       const user = await userRepo.findOne({ where: { id: userId } });

       if (!user) {
         return res.status(401).json({ error: 'User not found' });
       }

       (req as AuthenticatedRequest).user = {
         id: user.id,
         email: user.email,
         role: user.role // Use database role instead of JWT claim
       };
       next();
     } catch (error) {
       return res.status(401).json({ error: 'Invalid token' });
     }
   }
   ```

4. **Create Role Enum for Consistency**
   ```typescript
   // api/types/role.enum.ts
   export enum UserRole {
     PATIENT = 'patient',
     RESEARCHER = 'researcher',
     PROVIDER = 'provider',
     ADMIN = 'admin',
     SECURITY_ANALYST = 'security_analyst',
     COMPLIANCE_ANALYST = 'compliance_analyst',
     DEVELOPER = 'developer'
   }
   ```

5. **Update requireRole to Accept Role Enum**
   ```typescript
   // api/middleware/auth.middleware.ts
   export function requireRole(...allowedRoles: UserRole[]) {
     return (req: Request, res: Response, next: NextFunction) => {
       const authReq = req as AuthenticatedRequest;

       if (!authReq.user) {
         return res.status(401).json({ error: 'Authentication required' });
       }

       if (!allowedRoles.includes(authReq.user.role as UserRole)) {
         return res.status(403).json({
           error: 'Forbidden',
           message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
         });
       }

       next();
     };
   }
   ```

**Deliverables:**
- Updated User entity with role column
- Database migration file
- Updated authentication middleware
- Role enum definition

**Testing:**
- Unit tests for User entity with role
- Integration tests for authentication middleware
- Migration test (up and down)

---

#### Week 3-4: MFA Implementation

**Objective:** Implement Multi-Factor Authentication for all user logins

**Tasks:**

1. **Choose MFA Provider**
   - **Option 1 (Recommended):** AWS Cognito + TOTP (Time-based One-Time Password)
   - **Option 2:** Google Authenticator with TOTP library
   - **Option 3:** SMS-based MFA with Twilio

   **Recommendation:** Use AWS Cognito with TOTP for cost-effective, cloud-native solution

2. **Add MFA Fields to User Entity**
   ```typescript
   // api/entities/User.ts
   @Column({ type: 'boolean', default: false })
   mfa_enabled!: boolean;

   @Column({ type: 'text', nullable: true })
   mfa_secret!: string; // Encrypted TOTP secret

   @Column({ type: 'boolean', default: false })
   mfa_verified!: boolean;

   @Column({ type: 'timestamp with time zone', nullable: true })
   last_mfa_at!: Date;
   ```

3. **Create MFA Service**
   ```typescript
   // api/services/mfa.service.ts
   import speakeasy from 'speakeasy';
   import crypto from 'crypto';

   export class MfaService {
     /**
      * Generate TOTP secret for user
      */
     generateMfaSecret(userId: number): { secret: string; qrCodeUrl: string } {
       const secret = speakeasy.generateSecret({ length: 20 }).base32;

       // Generate QR code URL for authenticator app
       const qrCodeUrl = `otpauth://totp/Health-Mesh:${userId}?secret=${secret}&issuer=Health-Mesh`;

       return { secret, qrCodeUrl };
     }

     /**
      * Verify TOTP code
      */
     verifyMfaToken(userId: number, token: string, secret: string): boolean {
       const verified = speakeasy.totp.verify({
         secret,
         encoding: 'base32',
         token,
         window: 2 // Allow 2 time steps window (±60 seconds)
       });

       return verified;
     }

     /**
      * Generate backup codes
      */
     generateBackupCodes(count: number = 10): string[] {
       const codes: string[] = [];
       for (let i = 0; i < count; i++) {
         codes.push(crypto.randomBytes(4).toString('hex'));
       }
       return codes;
     }
   }
   ```

4. **Update Login Flow with MFA**
   ```typescript
   // api/routes/auth.routes.ts
   // Step 1: Initial login (username + password)
   router.post('/login', async (req, res) => {
     const { email, password } = req.body;

     // Verify credentials
     const user = await verifyCredentials(email, password);
     if (!user) {
       return res.status(401).json({ error: 'Invalid credentials' });
     }

     // Check if MFA is enabled
     if (user.mfa_enabled) {
       // Generate temporary token and store in Redis for 5 minutes
       const tempToken = generateTempToken(user.id);
       return res.json({ requiresMfa: true, tempToken });
     }

     // If MFA not enabled, generate JWT
     const jwtToken = generateJwt(user);
     return res.json({ token: jwtToken });
   });

   // Step 2: Verify MFA code
   router.post('/login/mfa', async (req, res) => {
     const { tempToken, mfaCode, backupCode } = req.body;

     // Verify temp token from Redis
     const userId = await verifyTempToken(tempToken);
     if (!userId) {
       return res.status(401).json({ error: 'Invalid or expired token' });
     }

     // Fetch user
     const user = await userRepository.findOne({ where: { id: userId } });

     // Verify MFA code or backup code
     const verified = mfaService.verifyMfaToken(userId, mfaCode, user.mfa_secret);

     if (!verified) {
       // Check backup codes if provided
       const backupVerified = await verifyBackupCode(userId, backupCode);
       if (!backupVerified) {
         // Increment failed login attempts
         user.failed_login_attempts++;
         await userRepository.save(user);

         // Lock account after 5 failed attempts
         if (user.failed_login_attempts >= 5) {
           user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
           await userRepository.save(user);
           return res.status(423).json({ error: 'Account locked' });
         }

         return res.status(401).json({ error: 'Invalid MFA code' });
       }
     }

     // Reset failed login attempts on successful MFA
     user.failed_login_attempts = 0;
     user.last_mfa_at = new Date();
     await userRepository.save(user);

     // Generate JWT token
     const jwtToken = generateJwt(user);
     return res.json({ token: jwtToken });
   });
   ```

5. **Add MFA Setup Endpoint**
   ```typescript
   // api/routes/auth.routes.ts
   router.post('/mfa/setup', authenticateToken, async (req, res) => {
     const user = (req as AuthenticatedRequest).user;

     // Generate TOTP secret
     const { secret, qrCodeUrl } = mfaService.generateMfaSecret(user.id);

     // Store encrypted secret in database
     user.mfa_secret = encrypt(secret); // Use AWS KMS for encryption
     user.mfa_enabled = true;
     user.mfa_verified = false; // Require verification before enabling
     await userRepository.save(user);

     res.json({
       qrCodeUrl,
       message: 'Scan QR code with authenticator app, then verify code'
     });
   });

   router.post('/mfa/verify', authenticateToken, async (req, res) => {
     const { mfaCode } = req.body;
     const user = (req as AuthenticatedRequest).user;

     // Verify MFA code
     const verified = mfaService.verifyMfaToken(user.id, mfaCode, user.mfa_secret);

     if (!verified) {
       return res.status(400).json({ error: 'Invalid MFA code' });
     }

     // Mark MFA as verified
     user.mfa_verified = true;
     await userRepository.save(user);

     res.json({ success: true });
   });

   router.post('/mfa/disable', authenticateToken, async (req, res) => {
     const user = (req as AuthenticatedRequest).user;

     user.mfa_enabled = false;
     user.mfa_secret = null;
     await userRepository.save(user);

     res.json({ success: true });
   });
   ```

**Deliverables:**
- MFA service with TOTP generation and verification
- Updated User entity with MFA fields
- Login flow with MFA verification
- MFA setup and disable endpoints
- Backup code generation

**Testing:**
- Unit tests for MFA service
- Integration tests for login with MFA
- Manual testing with authenticator app (Google Authenticator, Authy)
- Test backup code functionality

---

### Month 5: Session Management and Audit Logging

#### Week 1-2: Session Timeout Enforcement

**Objective:** Implement session timeout enforcement (15-min idle, 8-hr absolute) per HIPAA §164.312(a)(1)(ii)(C)

**Tasks:**

1. **Create Session Entity**
   ```typescript
   // api/entities/Session.entity.ts
   import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
   import { User } from './User';

   @Entity('sessions')
   export class Session {
     @PrimaryGeneratedColumn()
     id!: string; // Session ID

     @Column({ type: 'integer' })
     user_id!: number;

     @ManyToOne(() => User)
     @JoinColumn({ name: 'user_id' })
     user!: User;

     @Column({ type: 'timestamp with time zone' })
     last_activity_at!: Date;

     @Column({ type: 'timestamp with time zone' })
     created_at!: Date;

     @Column({ type: 'timestamp with time zone', nullable: true })
     expired_at!: Date;

     @Column({ type: 'boolean', default: true })
     is_active!: boolean;

     @Column({ type: 'text', nullable: true })
     ip_address!: string;

     @Column({ type: 'text', nullable: true })
     user_agent!: string;

     @CreateDateColumn({ type: 'timestamp with time zone' })
     created_at!: Date;
   }
   ```

2. **Create Session Service**
   ```typescript
   // api/services/session.service.ts
   import { getConnection } from 'typeorm';
   import { Session } from '../entities/Session';
   import crypto from 'crypto';

   export class SessionService {
     /**
      * Generate session ID
      */
     generateSessionId(): string {
       return crypto.randomBytes(32).toString('hex');
     }

     /**
      * Create session
      */
     async createSession(userId: number, ip: string, userAgent: string): Promise<string> {
       const sessionId = this.generateSessionId();
       const now = new Date();

       const session = new Session();
       session.id = sessionId;
       session.user_id = userId;
       session.last_activity_at = now;
       session.created_at = now;
       session.expired_at = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours absolute
       session.is_active = true;
       session.ip_address = ip;
       session.user_agent = userAgent;

       const dataSource = getConnection();
       const sessionRepo = dataSource.getRepository(Session);
       await sessionRepo.save(session);

       return sessionId;
     }

     /**
      * Update session activity
      */
     async updateSessionActivity(sessionId: string): Promise<void> {
       const dataSource = getConnection();
       const sessionRepo = dataSource.getRepository(Session);

       const session = await sessionRepo.findOne({ where: { id: sessionId, is_active: true } });
       if (!session) {
         return; // Session not found or expired
       }

       session.last_activity_at = new Date();
       await sessionRepo.save(session);
     }

     /**
      * Check if session is expired
      */
     async isSessionExpired(sessionId: string): Promise<boolean> {
       const dataSource = getConnection();
       const sessionRepo = dataSource.getRepository(Session);

       const session = await sessionRepo.findOne({ where: { id: sessionId, is_active: true } });
       if (!session) {
         return true;
       }

       // Check idle timeout (15 minutes)
       const idleTimeout = 15 * 60 * 1000; // 15 minutes
       const now = Date.now();
       const lastActivity = session.last_activity_at.getTime();
       const timeSinceLastActivity = now - lastActivity;

       // Check absolute timeout (8 hours)
       const createdTime = session.created_at.getTime();
       const absoluteTimeout = 8 * 60 * 60 * 1000; // 8 hours
       const timeSinceCreation = now - createdTime;

       if (timeSinceLastActivity > idleTimeout || timeSinceCreation > absoluteTimeout) {
         // Mark session as expired
         session.is_active = false;
         session.expired_at = new Date(now);
         await sessionRepo.save(session);
         return true;
       }

       return false;
     }

     /**
      * Terminate session
      */
     async terminateSession(sessionId: string): Promise<void> {
       const dataSource = getConnection();
       const sessionRepo = dataSource.getRepository(Session);

       const session = await sessionRepo.findOne({ where: { id: sessionId } });
       if (session) {
         session.is_active = false;
         session.expired_at = new Date();
         await sessionRepo.save(session);
       }
     }

     /**
      * Terminate all user sessions except current
      */
     async terminateUserSessions(userId: number, currentSessionId: string): Promise<void> {
       const dataSource = getConnection();
       const sessionRepo = dataSource.getRepository(Session);

       await sessionRepo.update(
         { user_id: userId, is_active: true, id: Not(currentSessionId) },
         { is_active: false, expired_at: new Date() }
       );
     }
   }
   ```

3. **Update Login Flow to Create Session**
   ```typescript
   // api/routes/auth.routes.ts
   import { SessionService } from '../services/session.service';
   import { getClientIp } from '../utils/ip.util';

   const sessionService = new SessionService();

   router.post('/login', async (req, res) => {
     const { email, password } = req.body;

     // Verify credentials
     const user = await verifyCredentials(email, password);
     if (!user) {
       return res.status(401).json({ error: 'Invalid credentials' });
     }

     // Check if MFA is enabled
     if (user.mfa_enabled) {
       const tempToken = generateTempToken(user.id);
       return res.json({ requiresMfa: true, tempToken });
     }

     // Create session
     const sessionId = await sessionService.createSession(
       user.id,
       getClientIp(req),
       req.get('User-Agent') || ''
     );

     // Generate JWT token with session ID
     const jwtToken = generateJwt({ ...user, sessionId });
     return res.json({ token: jwtToken, sessionId });
   });
   ```

4. **Create Session Middleware for Timeout Enforcement**
   ```typescript
   // api/middleware/session.middleware.ts
   import { Request, Response, NextFunction } from 'express';
   import { SessionService } from '../services/session.service';

   const sessionService = new SessionService();

   export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
     const sessionId = (req as any).sessionId || req.get('X-Session-ID');

     if (!sessionId) {
       return res.status(401).json({ error: 'No session ID provided' });
     }

     // Check if session is expired
     const isExpired = await sessionService.isSessionExpired(sessionId);
     if (isExpired) {
       return res.status(401).json({ error: 'Session expired' });
     }

     // Update session activity
     await sessionService.updateSessionActivity(sessionId);

     next();
   }

   export function setupSessionTimeout(app: any) {
     // Add session middleware after authentication
     app.use(sessionMiddleware);
   }
   ```

5. **Add Session Logout Endpoint**
   ```typescript
   // api/routes/auth.routes.ts
   router.post('/logout', authenticateToken, async (req, res) => {
     const user = (req as AuthenticatedRequest).user;
     const sessionId = (req as any).sessionId;

     // Terminate session in database
     await sessionService.terminateSession(sessionId);

     // Terminate all other user sessions
     await sessionService.terminateUserSessions(user.id, sessionId);

     // Clear session cookie
     res.clearCookie('sessionId');

     res.json({ success: true });
   });
   ```

**Deliverables:**
- Session entity
- Session service with timeout enforcement
- Session middleware for automatic timeout checking
- Updated login flow with session creation
- Logout endpoint

**Testing:**
- Unit tests for session service
- Integration tests for session timeout (simulate 15-min idle)
- Integration tests for absolute timeout (simulate 8-hr duration)
- Test session termination

---

#### Week 3-4: Audit Logging Evidence Collection

**Objective:** Automate evidence collection from audit logs for SOC 2 and ISO 27001

**Tasks:**

1. **Create Evidence Collection Service**
   ```typescript
   // api/services/evidence-collection.service.ts
   import { getConnection } from 'typeorm';
   import { ApiAudit } from '../entities/ApiAudit';
   import * as fs from 'fs/promises';
   import * as path from 'path';

   export class EvidenceCollectionService {
     private evidenceDir: string;

     constructor() {
       this.evidenceDir = path.join(__dirname, '../../docs/compliance/evidence');
     }

     /**
      * Export audit logs to evidence repository
      */
     async exportAuditLogs(startDate: Date, endDate: Date): Promise<void> {
       const dataSource = getConnection();
       const auditRepo = dataSource.getRepository(ApiAudit);

       // Query audit logs for date range
       const audits = await auditRepo.find({
         where: {
           created_at: {
             $gte: startDate,
             $lte: endDate
           }
         },
         order: { created_at: 'ASC' }
       });

       // Export to JSON with PII masking
       const maskedAudits = audits.map(audit => ({
         ...audit,
         user_id: audit.user_id ? audit.user_id : '[REDACTED]',
         ip: audit.ip ? audit.ip : '[REDACTED]',
         user_agent: audit.user_agent ? audit.user_agent : '[REDACTED]'
       }));

       // Write to evidence repository
       const filePath = path.join(
         this.evidenceDir,
         'SOC2/CC8.1/logs',
         `audit-logs-${startDate.toISOString().split('T')[0]}.json`
       );

       await fs.mkdir(path.dirname(filePath), { recursive: true });
       await fs.writeFile(filePath, JSON.stringify(maskedAudits, null, 2));

       console.log(`Exported ${audits.length} audit logs to ${filePath}`);
     }

     /**
      * Export access control evidence
      */
     async exportAccessControlEvidence(): Promise<void> {
       const dataSource = getConnection();
       const userRepo = dataSource.getRepository(User);

       // Query all users with roles
       const users = await userRepo.find();

       // Export access control matrix
       const accessControlMatrix = users.map(user => ({
         user_id: user.id,
         email: user.email,
         role: user.role,
         mfa_enabled: user.mfa_enabled,
         wallet_address: user.wallet_address
       }));

       // Write to evidence repository
       const filePath = path.join(
         this.evidenceDir,
         'SOC2/CC6.1',
         `access-control-matrix-${new Date().toISOString().split('T')[0]}.json`
       );

       await fs.mkdir(path.dirname(filePath), { recursive: true });
       await fs.writeFile(filePath, JSON.stringify(accessControlMatrix, null, 2));

       console.log(`Exported access control matrix to ${filePath}`);
     }

     /**
      * Generate evidence collection report
      */
     async generateEvidenceReport(): Promise<any> {
       const now = new Date();
       const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

       // Export audit logs
       await this.exportAuditLogs(startDate, now);

       // Export access control evidence
       await this.exportAccessControlEvidence();

       return {
         exportDate: now.toISOString(),
         evidenceTypes: ['audit-logs', 'access-control'],
         dateRange: `${startDate.toISOString()} to ${now.toISOString()}`
       };
     }
   }
   ```

2. **Create Scheduled Evidence Collection**
   ```typescript
   // api/workers/evidence-collection.worker.ts
   import cron from 'node-cron';
   import { EvidenceCollectionService } from '../services/evidence-collection.service';

   const evidenceService = new EvidenceCollectionService();

   // Schedule weekly evidence export (every Sunday at 2 AM)
   cron.schedule('0 2 * * 0', async () => {
     console.log('Starting weekly evidence collection...');
     const report = await evidenceService.generateEvidenceReport();
     console.log('Evidence collection completed:', report);
   });

   // Schedule monthly evidence export (1st of month at 3 AM)
   cron.schedule('0 3 1 * *', async () => {
     console.log('Starting monthly evidence export...');
     const now = new Date();
     const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
     await evidenceService.exportAuditLogs(startDate, now);
     await evidenceService.exportAccessControlEvidence();
   });
   ```

3. **Add Manual Evidence Export Endpoint**
   ```typescript
   // api/routes/evidence.routes.ts
   import { EvidenceCollectionService } from '../services/evidence-collection.service';
   import { authenticateToken, requireRole } from '../middleware/auth.middleware';
   import { UserRole } from '../types/role.enum';

   const evidenceService = new EvidenceCollectionService();

   // Manual evidence export (for auditors)
   router.post('/export/audit-logs',
     authenticateToken,
     requireRole(UserRole.SECURITY_ANALYST, UserRole.ADMIN),
     async (req, res) => {
       const { startDate, endDate } = req.body;

       const start = new Date(startDate);
       const end = new Date(endDate);

       const report = await evidenceService.exportAuditLogs(start, end);

       res.json({
         success: true,
         message: 'Audit logs exported to evidence repository',
         report
       });
     }
   );

   // Generate full evidence report
   router.post('/export/report',
     authenticateToken,
     requireRole(UserRole.SECURITY_ANALYST, UserRole.ADMIN),
     async (req, res) => {
       const report = await evidenceService.generateEvidenceReport();

       res.json(report);
     }
   );
   ```

4. **Configure Evidence Storage in AWS S3**
   ```bash
   # scripts/setup-evidence-bucket.sh
   #!/bin/bash

   BUCKET_NAME="health-mesh-compliance-evidence"

   # Create S3 bucket with encryption
   aws s3api create-bucket \
     --bucket $BUCKET_NAME \
     --region us-east-1

   # Enable server-side encryption
   aws s3api put-bucket-encryption \
     --bucket $BUCKET_NAME \
     --server-side-encryption configuration=AES256

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket $BUCKET_NAME \
     --versioning-configuration Status=Enabled

   # Set lifecycle policy (7-year retention)
   aws s3api put-bucket-lifecycle-configuration \
     --bucket $BUCKET_NAME \
     --lifecycle-configuration file://lifecycle-policy.json

   echo "Evidence bucket setup complete"
   ```

**Deliverables:**
- Evidence collection service
- Scheduled evidence export worker
- Manual evidence export endpoints
- S3 bucket for evidence storage
- Evidence collection report template

**Testing:**
- Test evidence export with sample data
- Verify evidence stored in correct location
- Test scheduled jobs (cron jobs)
- Verify evidence format matches audit requirements

---

### Month 6: Testing and Validation

#### Week 1-2: Control Testing

**Objective:** Test all access controls to ensure compliance requirements are met

**Tasks:**

1. **RBAC Testing**
   - Test each role has correct access permissions
   - Test role escalation prevention
   - Test access denial for unauthorized roles
   - Test role-based endpoint protection

2. **MFA Testing**
   - Test MFA setup flow
   - Test MFA verification with valid code
   - Test MFA verification with invalid code
   - Test backup code functionality
   - Test MFA disable functionality

3. **Session Management Testing**
   - Test session creation on login
   - Test session idle timeout (15 minutes)
   - Test session absolute timeout (8 hours)
   - Test session termination on logout
   - Test concurrent session handling

4. **Audit Logging Testing**
   - Test audit log creation for all API calls
   - Test PII masking in logs
   - Test session tracking across requests
   - Test evidence export functionality
   - Verify audit log completeness

5. **Performance Testing**
   - Test authentication latency (<100ms target)
   - Test session update latency
   - Test evidence export performance
   - Verify no performance degradation from access controls

**Deliverables:**
- Test execution reports
- Test results summary
- List of defects found
- Remediation plan for any issues

---

#### Week 3-4: Documentation and Deployment

**Objective:** Document implementation and deploy to production

**Tasks:**

1. **Update Access Control Policy**
   - Document implementation details
   - Add configuration screenshots
   - Include testing results
   - Update evidence requirements

2. **Create Access Control Implementation Guide**
   - Document all code changes
   - Include configuration instructions
   - Provide troubleshooting guide
   - Add monitoring and alerting setup

3. **Prepare Deployment Checklist**
   ```markdown
   # Phase 2 Deployment Checklist

   ## Pre-Deployment
   - [ ] Database migrations tested (up and down)
   - [ ] All unit tests passing
   - [ ] All integration tests passing
   - [ ] Code review completed
   - [ ] Security review completed
   - [ ] Performance benchmarks met

   ## Deployment Steps
   - [ ] Run database migrations: `npm run migrate`
   - [ ] Deploy API changes: `git push origin && CI/CD deploy`
   - [ ] Verify deployment health: `curl http://api.health-mesh.com/api/health`
   - [ ] Test authentication endpoints
   - [ ] Test MFA endpoints
   - [ ] Test session timeout
   - [ ] Test evidence export
   - [ ] Monitor error logs for 1 hour

   ## Post-Deployment
   - [ ] Verify all users have role assigned
   - [ ] Test MFA with test accounts
   - [ ] Verify session timeout working
   - [ ] Test evidence export
   - [ ] Monitor performance metrics
   - [ ] Verify audit logs collecting data
   - [ ] Update runbooks and documentation

   ## Rollback Plan
   - If deployment fails: `git revert`
   - Rollback database: `npm run migrate:down`
   - Monitor rollback success
   ```

4. **Deploy to Production**
   - Execute deployment checklist
   - Monitor for errors
   - Verify all controls working
   - Collect initial evidence

5. **Create Phase 2 Completion Report**
   - Document all completed tasks
   - List controls implemented
   - Include test results
   - Provide metrics and KPIs
   - Identify Phase 2 gaps (if any)

**Deliverables:**
- Updated Access Control Policy document
- Access Control Implementation Guide
- Deployment checklist
- Phase 2 completion report
- Evidence of successful deployment

---

## Success Criteria

### Functional Requirements
- [ ] RBAC enforced in database and code
- [ ] MFA implemented for all users
- [ ] Session timeout enforced (15-min idle, 8-hr absolute)
- [ ] Audit logging comprehensive and automated
- [ ] Evidence collection automated
- [ ] Access review workflow implemented

### Compliance Requirements
- [ ] SOC 2 CC6.1 (Access Control Implementation): ✅ Satisfied
- [ ] SOC 2 CC6.2 (Access Privilege Management): ✅ Satisfied
- [ ] SOC 2 CC6.3 (Multi-Factor Authentication): ✅ Satisfied
- [ ] SOC 2 CC6.4 (Access Review): ✅ Satisfied
- [ ] SOC 2 CC6.5 (Session Management): ✅ Satisfied
- [ ] SOC 2 CC6.6 (Emergency Access): ✅ Satisfied
- [ ] SOC 2 CC6.7 (Access Logging): ✅ Satisfied
- [ ] ISO 27001 A.5.17 (Authentication): ✅ Satisfied
- [ ] ISO 27001 A.5.18 (Access Rights): ✅ Satisfied
- [ ] HIPAA §164.312(a)(1)(ii)(C) (Automatic Logoff): ✅ Satisfied

### Quality Requirements
- [ ] All unit tests passing (target: 95%+ coverage)
- [ ] All integration tests passing
- [ ] Performance benchmarks met (auth <100ms)
- [ ] Security review completed
- [ ] Documentation updated and approved

### Evidence Requirements
- [ ] Evidence repository populated with access control evidence
- [ ] Audit logs exported weekly
- [ ] Access control matrix exported monthly
- [ ] Evidence collection automated
- [ ] Evidence retention policy enforced (7 years)

---

## Risk Mitigation

### Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|-------|------------|---------|------------|
| **Database migration failure** | Medium | High | Test migrations in staging, have rollback plan ready |
| **MFA adoption friction** | High | Medium | Provide backup codes, gradual rollout, clear documentation |
| **Session timeout user impact** | High | Low | Communicate timeout policy in advance, provide session extension for critical work |
| **Performance degradation** | Medium | Medium | Benchmark performance before deployment, monitor closely post-deployment |
| **Evidence collection failure** | Low | High | Implement error handling and retry logic, manual fallback process |

---

## Monitoring and Alerting

### Key Performance Indicators (KPIs)

**Access Control Metrics:**
- MFA enrollment rate: Target 80%+ within 3 months
- Failed login attempts: Monitor for account lockouts
- Session timeout rate: Track frequency and user impact
- Access denial rate: Monitor for unauthorized access attempts

**Evidence Collection Metrics:**
- Audit log export success rate: Target 99%+
- Evidence export latency: Target <5 minutes for 30-day range
- Evidence repository size: Monitor storage usage
- Evidence export schedule compliance: Verify weekly/monthly jobs running

**Performance Metrics:**
- Authentication latency: Target <100ms
- Session update latency: Target <50ms
- Evidence export latency: Target <5 minutes
- API response time: Maintain <200ms for auth endpoints

---

## Rollback Plan

If Phase 2 implementation causes critical issues:

1. **Immediate (0-1 hour):**
   - Revert code to previous stable version
   - Rollback database migrations
   - Notify stakeholders of rollback

2. **Short-term (1-24 hours):**
   - Investigate root cause of failure
   - Document lessons learned
   - Plan remediation approach

3. **Long-term (1-7 days):**
   - Fix identified issues
   - Re-test thoroughly
   - Re-deploy with fixes

---

## Next Steps After Phase 2

### Phase 3: Monitoring & Detection (Months 7-9)
1. Deploy SIEM solution (Datadog or Splunk)
2. Configure centralized log collection
3. Implement vulnerability scanning (Tenable or Qualys)
4. Set up automated threat detection rules
5. Begin SOC 2 Type II observation period (6 months)

### Phase 4: Response & Recovery (Months 10-12)
1. Implement incident response procedures
2. Conduct tabletop exercises
3. Configure business continuity and disaster recovery
4. Complete ISO 27001 Stage 1 and Stage 2 audits
5. Complete SOC 2 Type II audit

---

## Conclusion

Phase 2 transforms the access control policies created in Phase 1 into enforceable technical controls. By implementing RBAC, MFA, session management, and automated evidence collection, Health-Mesh will meet SOC 2, ISO 27001, and HIPAA requirements for access control.

**Key Takeaways:**
- RBAC enforced at database and application layers
- MFA provides strong authentication for all users
- Session timeout ensures HIPAA compliance
- Automated evidence collection enables audit readiness
- Testing validates all controls meet compliance requirements

**Success Criteria:**
- All SOC 2 CC6.1-CC6.7 controls operational
- All ISO 27001 A.5.17-A.5.18 controls operational
- HIPAA §164.312(a)(1)(ii)(C) satisfied
- Evidence repository populated and automated
- Phase 2 complete and ready for Phase 3

---

**Document End**
