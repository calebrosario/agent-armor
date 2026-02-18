# Phase 2: Access Control Implementation Plan

## Document Information

- **Document ID**: CC-PHASE2-PLAN-001
- **Version**: 1.0
- **Created**: February 8, 2026
- **Last Updated**: February 8, 2026
- **Owner**: CISO + DevOps Team
- **Classification**: Confidential

## Executive Summary

Based on comprehensive codebase analysis, Phase 2 will implement access control technical controls to satisfy SOC 2 CC6.1-CC6.7, ISO 27001 A.5.17-A.5.18, and HIPAA §164.312(a)(1)(ii)(C). Phase 1 governance documentation is complete (10 documents, ~30,000 lines). Phase 2 transforms these policies into enforceable code.

**Timeline**: 3 months (Months 4-6)
**Key Deliverables**:
- RBAC enforcement at database and application layers
- MFA deployment for all users (TOTP with backup codes)
- Session timeout enforcement (15-min idle, 8-hr absolute)
- Automated evidence collection for audit trails
- Comprehensive testing and validation

---

## Codebase Analysis Summary

### Current State Assessment

#### ✅ Existing Strengths

1. **Audit Logging** (COMPREHENSIVE)
   - Global audit middleware applied to all routes
   - PII masking with recursive field detection
   - Session tracking with generated session IDs
   - Database persistence via ApiAudit entity
   - Risk event emission integrated with rules engine
   - Console + database dual logging

2. **Authentication Infrastructure** (ROBUST)
   - JWT-based stateless authentication
   - Account lockout mechanism (failed_login_attempts, locked_until)
   - CSRF protection with csrf-csrf middleware
   - Rate limiting on auth endpoints
   - Password hashing with bcrypt

3. **Database Layer** (MATURE)
   - TypeORM with PostgreSQL
   - Existing User entity with basic auth fields
   - Migration framework available
   - Entity relationships established

4. **Compliance Documentation** (COMPLETE)
   - Information Security Policy (7,745 lines)
   - Security Roles & Responsibilities (1,500+ lines)
   - Access Control Policy (1,500+ lines)
   - Session Management Policy (1,400+ lines)
   - Evidence Repository framework

#### ❌ Critical Gaps

1. **RBAC Not Implemented**
   - User entity lacks role column
   - Role-based endpoint protection not enforced
   - Role management system absent
   - Access review workflow not automated

2. **MFA Not Implemented**
   - No TOTP secret generation/verification
   - No backup code generation
   - MFA enrollment flow absent
   - MFA verification not integrated with login

3. **Session Timeout Not Enforced**
   - auth.middleware.v2.ts exists with HIPAA-compliant timeouts but not deployed
   - No Session entity for server-side session tracking
   - No session termination endpoint
   - No concurrent session management

4. **Evidence Collection Not Automated**
   - No scheduled evidence export jobs
   - No evidence export endpoints for auditors
   - No immutable log storage configuration
   - No evidence retention enforcement

---

## Implementation Approaches

### Approach 1: Incremental Deployment (RECOMMENDED) ⭐

**Strategy**: Deploy controls incrementally with careful testing at each stage. Minimize disruption, maximize validation.

**Timeline**:
- **Month 4, Week 1-2**: RBAC database changes + middleware updates
- **Month 4, Week 3-4**: MFA service + login flow updates
- **Month 5, Week 1-2**: Session entity + timeout enforcement
- **Month 5, Week 3-4**: Evidence collection automation
- **Month 6**: Comprehensive testing + deployment

**Pros**:
- ✅ Risk mitigation: Each change tested independently before proceeding
- ✅ Rollback safety: Issues isolated to specific component
- ✅ User experience: Gradual introduction of new requirements (e.g., MFA)
- ✅ Knowledge transfer: Team learns incrementally
- ✅ Continuous integration: Each component integrates with existing system

**Cons**:
- ❌ Longer timeline: 3 months vs potentially faster approaches
- ❌ More commits: Git history will be more granular
- ❌ Requires disciplined testing: Each stage must be validated thoroughly

**Implementation Order**:

**Stage 1: RBAC Foundation (Weeks 1-2)**
```typescript
// 1. Add role enum
export enum UserRole {
  PATIENT = 'patient',
  RESEARCHER = 'researcher',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  SECURITY_ANALYST = 'security_analyst',
  COMPLIANCE_ANALYST = 'compliance_analyst',
  DEVELOPER = 'developer'
}

// 2. Add role column to User entity
@Column({ type: 'varchar', length: 50, default: 'patient' })
role!: string;

// 3. Create migration
// api/migrations/migrations/AddRoleToUser.ts

// 4. Update auth middleware to fetch role from database
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

// 5. Update requireRole to accept enum
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

**Stage 2: MFA Implementation (Weeks 3-4)**
```typescript
// 1. Install otplib (modern TOTP library, NOT deprecated speakeasy)
bun add otplib qrcode

// 2. Add MFA fields to User entity
@Column({ type: 'boolean', default: false })
mfa_enabled!: boolean;

@Column({ type: 'text', nullable: true })
mfa_secret!: string; // Encrypted TOTP secret

@Column({ type: 'boolean', default: false })
mfa_verified!: boolean;

@Column({ type: 'text', nullable: true, array: true })
mfa_backup_codes!: string[];

@Column({ type: 'timestamp with time zone', nullable: true })
last_mfa_at!: Date;

// 3. Create MFA service using otplib
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

export class MfaService {
  /**
   * Generate TOTP secret for user
   */
  async generateMfaSecret(userId: number): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = authenticator.generateSecret({ length: 32 }); // 256-bit entropy

    // Generate QR code URL for authenticator app
    const otpauthUrl = authenticator.keyuri(
      userId.toString(),
      'Health-Mesh',
      secret
    );

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, qrCodeUrl };
  }

  /**
   * Verify TOTP code
   */
  async verifyMfaToken(userId: number, token: string, secret: string): Promise<boolean> {
    return authenticator.check(token, secret);
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(count: number = 10): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-digit code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code (one-time use)
   */
  async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    const dataSource = getConnection();
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user || !user.mfa_backup_codes) {
      return false;
    }

    const codeIndex = user.mfa_backup_codes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    user.mfa_backup_codes.splice(codeIndex, 1);
    await userRepo.save(user);

    // Regenerate backup codes if less than 3 remaining
    if (user.mfa_backup_codes.length < 3) {
      const newCodes = await this.generateBackupCodes(10);
      user.mfa_backup_codes = newCodes;
      await userRepo.save(user);
    }

    return true;
  }
}

// 4. Update login flow with MFA
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
    const tempToken = jwt.sign(
      { userId: user.id, type: 'mfa_challenge' },
      getJwtSecretSync(),
      { expiresIn: '5m' }
    );

    return res.json({ requiresMfa: true, tempToken });
  }

  // If MFA not enabled, generate JWT
  const jwtToken = generateJwt(user);
  return res.json({ token: jwtToken });
});

// 5. Verify MFA code endpoint
router.post('/login/mfa', async (req, res) => {
  const { tempToken, mfaCode, backupCode } = req.body;

  // Verify temp token
  let userId: number;
  try {
    const decoded = jwt.verify(tempToken, getJwtSecretSync()) as any;
    if (decoded.type !== 'mfa_challenge') {
      return res.status(400).json({ error: 'Invalid token type' });
    }
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch user
  const dataSource = getConnection();
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });

  // Verify MFA code or backup code
  const mfaService = new MfaService();
  let verified = false;

  if (mfaCode) {
    verified = await mfaService.verifyMfaToken(userId, mfaCode, user.mfa_secret);
  } else if (backupCode) {
    verified = await mfaService.verifyBackupCode(userId, backupCode);
  }

  if (!verified) {
    // Increment failed login attempts
    user.failed_login_attempts++;
    await userRepo.save(user);

    // Lock account after 5 failed attempts
    if (user.failed_login_attempts >= 5) {
      user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await userRepo.save(user);
      return res.status(423).json({ error: 'Account locked' });
    }

    return res.status(401).json({ error: 'Invalid MFA code' });
  }

  // Reset failed login attempts on successful MFA
  user.failed_login_attempts = 0;
  user.last_mfa_at = new Date();
  await userRepo.save(user);

  // Generate JWT token
  const jwtToken = generateJwt(user);
  return res.json({ token: jwtToken });
});

// 6. MFA setup endpoint
router.post('/mfa/setup', authenticateToken, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const mfaService = new MfaService();

  // Generate TOTP secret
  const { secret, qrCodeUrl } = await mfaService.generateMfaSecret(user.id);

  // Store encrypted secret in database (temporary, not verified yet)
  const dataSource = getConnection();
  const userRepo = dataSource.getRepository(User);
  const userRecord = await userRepo.findOne({ where: { id: user.id } });

  userRecord.mfa_secret = secret; // TODO: Encrypt with AWS KMS
  userRecord.mfa_enabled = true;
  userRecord.mfa_verified = false; // Require verification before enabling
  await userRepo.save(userRecord);

  res.json({
    qrCodeUrl,
    message: 'Scan QR code with authenticator app, then verify code'
  });
});

// 7. MFA verification endpoint
router.post('/mfa/verify', authenticateToken, async (req, res) => {
  const { mfaCode } = req.body;
  const user = (req as AuthenticatedRequest).user;
  const mfaService = new MfaService();

  const dataSource = getConnection();
  const userRepo = dataSource.getRepository(User);
  const userRecord = await userRepo.findOne({ where: { id: user.id } });

  // Verify MFA code
  const verified = await mfaService.verifyMfaToken(user.id, mfaCode, userRecord.mfa_secret);

  if (!verified) {
    return res.status(400).json({ error: 'Invalid MFA code' });
  }

  // Mark MFA as verified and generate backup codes
  userRecord.mfa_verified = true;
  userRecord.mfa_backup_codes = await mfaService.generateBackupCodes(10);
  await userRepo.save(userRecord);

  res.json({ success: true, backupCodes: userRecord.mfa_backup_codes });
});
```

**Stage 3: Session Management (Weeks 5-6)**
```typescript
// 1. Create Session entity
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

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expired_at!: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'text', nullable: true })
  ip_address!: string;

  @Column({ type: 'text', nullable: true })
  user_agent!: string;
}

// 2. Create Session service
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
   * Check if session is expired (HIPAA 15-min idle, 8-hr absolute)
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

// 3. Update login flow to create session
router.post('/login', async (req, res) => {
  // ... credential verification ...

  // Create session
  const sessionService = new SessionService();
  const sessionId = await sessionService.createSession(
    user.id,
    getClientIp(req),
    req.get('User-Agent') || ''
  );

  // Generate JWT token with session ID
  const jwtToken = jwt.sign(
    { userId: user.id, email: user.email, sessionId },
    getJwtSecretSync(),
    { expiresIn: '8h' } // Match absolute timeout
  );

  return res.json({ token: jwtToken, sessionId });
});

// 4. Create session timeout middleware
// api/middleware/session-timeout.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';

const sessionService = new SessionService();

export async function sessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionId || req.get('X-Session-ID');

  if (!sessionId) {
    return res.status(401).json({ error: 'No session ID provided' });
  }

  // Check if session is expired
  const isExpired = await sessionService.isSessionExpired(sessionId);
  if (isExpired) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  // Update session activity
  await sessionService.updateSessionActivity(sessionId);

  next();
}

export function setupSessionTimeout(app: any) {
  // Add session middleware after authentication
  app.use(sessionTimeoutMiddleware);
}

// 5. Add session logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const sessionId = (req as any).sessionId;

  const sessionService = new SessionService();

  // Terminate session in database
  await sessionService.terminateSession(sessionId);

  // Terminate all other user sessions
  await sessionService.terminateUserSessions(user.id, sessionId);

  res.json({ success: true });
});
```

**Stage 4: Evidence Collection (Weeks 7-8)**
```typescript
// 1. Create evidence collection service
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

// 2. Create scheduled evidence collection worker
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

// Keep process alive
console.log('Evidence collection worker started');

// 3. Add manual evidence export endpoints
// api/routes/evidence.routes.ts
import { Router } from 'express';
import { EvidenceCollectionService } from '../services/evidence-collection.service';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/role.enum';

const router = Router();
const evidenceService = new EvidenceCollectionService();

// Manual evidence export (for auditors)
router.post('/export/audit-logs',
  authenticateToken,
  requireRole(UserRole.SECURITY_ANALYST, UserRole.ADMIN),
  async (req, res) => {
    const { startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    await evidenceService.exportAuditLogs(start, end);

    res.json({
      success: true,
      message: 'Audit logs exported to evidence repository'
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

export default router;
```

---

### Approach 2: Parallel Development

**Strategy**: Develop all components in parallel, deploy together after comprehensive integration testing. Minimize development time, maximize risk.

**Timeline**:
- **Month 4, Week 1-2**: Develop RBAC, MFA, Session, Evidence in parallel (3 teams)
- **Month 4, Week 3-4**: Integration testing of all components
- **Month 5**: End-to-end testing and bug fixes
- **Month 6**: Deployment to production

**Pros**:
- ✅ Faster timeline: 2 months vs 3 months
- ✅ Parallel development: Multiple developers can work simultaneously
- ✅ Single deployment: One large release instead of multiple small releases

**Cons**:
- ❌ Higher risk: Integration testing must be comprehensive
- ❌ Difficult rollback: Multiple components deployed together
- ❌ Complex debugging: Issues harder to isolate
- ❌ Requires coordination: Multiple teams must align on interfaces
- ❌ Larger failure surface: More components can fail in single deployment

---

### Approach 3: Phased Rollout with Feature Flags

**Strategy**: Deploy all code at once but use feature flags to enable controls gradually. Combine speed of parallel development with safety of incremental deployment.

**Timeline**:
- **Month 4, Week 1-2**: Develop all components with feature flags
- **Month 4, Week 3**: Deploy to staging with all flags disabled
- **Month 5, Week 1**: Enable RBAC flag for test users (10%)
- **Month 5, Week 2**: Enable MFA flag for test users (10%)
- **Month 5, Week 3**: Enable session timeout flag for test users (10%)
- **Month 5, Week 4**: Enable evidence collection flag (100% - no user impact)
- **Month 6**: Roll out to 100% of users

**Pros**:
- ✅ Fast development: Parallel development
- ✅ Safe deployment: Feature flags allow instant rollback
- ✅ Gradual rollout: Test with small user groups first
- ✅ Single codebase: No branching for different phases
- ✅ A/B testing: Compare enabled vs disabled groups

**Cons**:
- ❌ Feature flag complexity: Additional infrastructure required
- ❌ Code complexity: All code paths must be maintained simultaneously
- ❌ Testing overhead: Must test both enabled and disabled states
- ❌ Flag management: Need feature flag service (LaunchDarkly, Unleash)
- ❌ User inconsistency: Some users see new features, others don't

---

## Recommendation

### 🏆 Recommended Approach: Approach 1 (Incremental Deployment)

**Rationale**:

1. **Risk Mitigation**: Each change tested independently before proceeding. Critical for production medical data platform.

2. **Team Expertise**: Team can focus on one area at a time, building deep understanding before moving to next component.

3. **Rollback Safety**: Issues isolated to specific component. If RBAC has bug, MFA not affected.

4. **Compliance Validation**: Each component can be validated against SOC 2/ISO 27001/HIPAA requirements before proceeding.

5. **User Experience**: Gradual introduction of new requirements (e.g., MFA enrollment) reduces user friction.

6. **Documentation Alignment**: Matches Phase 2 implementation guide (docs/compliance/PHASE2-ACCESS-CONTROL-IMPLEMENTATION.md) structure.

**Timeline Adjustment**: 3 months (Weeks 1-12)
- **Weeks 1-2**: RBAC database + middleware
- **Weeks 3-4**: MFA service + login flow
- **Weeks 5-6**: Session entity + timeout enforcement
- **Weeks 7-8**: Evidence collection automation
- **Weeks 9-10**: Comprehensive testing
- **Weeks 11-12**: Deployment + validation

---

## Detailed Implementation Schedule

### Month 4: RBAC and MFA Foundation

#### Week 1-2: RBAC Implementation

**Tasks**:
1. Create UserRole enum (api/types/role.enum.ts)
2. Add role column to User entity (api/entities/User.ts)
3. Create database migration (api/migrations/migrations/AddRoleToUser.ts)
4. Update auth.middleware.ts to fetch role from database
5. Update requireRole to accept UserRole enum
6. Apply role-based protection to sensitive endpoints
7. Test RBAC with unit and integration tests
8. Document role assignments and permissions

**Compliance Mappings**:
- SOC 2 CC6.1 (Logical Access Control) ✅
- SOC 2 CC6.2 (Access Privilege Management) ✅
- ISO 27001 A.5.18 (Access Rights) ✅
- HIPAA §164.312(a)(2)(iii) (Access Authorization)

**Deliverables**:
- UserRole enum
- Updated User entity
- Migration file
- Updated auth middleware
- RBAC test suite
- Role documentation

**Acceptance Criteria**:
- [ ] All users have role assigned (default: 'patient')
- [ ] Role-based endpoint protection functional
- [ ] Unauthorized access attempts blocked with 403
- [ ] Migration tested (up and down)
- [ ] All tests passing

---

#### Week 3-4: MFA Implementation

**Tasks**:
1. Install otplib and qrcode packages
2. Add MFA fields to User entity
3. Create MFA service (api/services/mfa.service.ts)
4. Update login flow with MFA verification
5. Create MFA setup endpoint (/api/auth/mfa/setup)
6. Create MFA verification endpoint (/api/auth/mfa/verify)
7. Create MFA disable endpoint (/api/auth/mfa/disable)
8. Implement backup code generation and verification
9. Test MFA with authenticator app (Google Authenticator, Authy)
10. Document MFA enrollment process

**Compliance Mappings**:
- SOC 2 CC6.3 (Multi-Factor Authentication) ✅
- ISO 27001 A.5.17 (Authentication) ✅
- HIPAA §164.312(d) (Person or Entity Authentication)

**Deliverables**:
- Updated User entity with MFA fields
- MFA service with TOTP and backup codes
- Updated login flow with MFA challenge
- MFA setup/verify/disable endpoints
- MFA test suite
- MFA documentation

**Acceptance Criteria**:
- [ ] MFA enrollment flow functional
- [ ] TOTP code verification works with Google Authenticator
- [ ] Backup codes work and are one-time use
- [ ] Backup codes regenerated when <3 remaining
- [ ] Account lockout after 5 failed MFA attempts
- [ ] All tests passing

---

### Month 5: Session Management and Evidence Collection

#### Week 5-6: Session Timeout Enforcement

**Tasks**:
1. Create Session entity (api/entities/Session.entity.ts)
2. Create Session service (api/services/session.service.ts)
3. Update login flow to create session
4. Create session timeout middleware
5. Add session timeout middleware to server.ts
6. Create session logout endpoint
7. Implement concurrent session termination
8. Test idle timeout (15 minutes)
9. Test absolute timeout (8 hours)
10. Document session management

**Compliance Mappings**:
- SOC 2 CC6.5 (Session Management) ✅
- HIPAA §164.312(a)(1)(ii)(C) (Automatic Logoff) ✅

**Deliverables**:
- Session entity
- Session service with timeout enforcement
- Session timeout middleware
- Updated login flow with session creation
- Logout endpoint
- Session management test suite

**Acceptance Criteria**:
- [ ] Session created on login
- [ ] Idle timeout enforced after 15 minutes
- [ ] Absolute timeout enforced after 8 hours
- [ ] Session activity updated on each request
- [ ] Session termination on logout functional
- [ ] All other user sessions terminated on login
- [ ] All tests passing

---

#### Week 7-8: Evidence Collection Automation

**Tasks**:
1. Create EvidenceCollectionService
2. Implement audit log export functionality
3. Implement access control matrix export
4. Create evidence collection report generator
5. Create scheduled evidence collection worker (cron jobs)
6. Create manual evidence export endpoints
7. Configure evidence storage location
8. Test evidence export with sample data
9. Verify evidence format matches audit requirements
10. Document evidence collection process

**Compliance Mappings**:
- SOC 2 CC8.1 (Monitoring and Logging) ✅
- SOC 2 CC8.2 (Change Management) ✅
- ISO 27001 A.12.4 (Logging) ✅
- HIPAA §164.312(b) (Audit Controls) ✅

**Deliverables**:
- EvidenceCollectionService
- Scheduled evidence collection worker
- Manual evidence export endpoints
- Evidence repository structure
- Evidence collection test suite

**Acceptance Criteria**:
- [ ] Audit logs exported weekly
- [ ] Access control matrix exported monthly
- [ ] Manual export endpoints functional
- [ ] Evidence stored in correct location
- [ ] Evidence format matches audit requirements
- [ ] PII masking applied to exported evidence
- [ ] All tests passing

---

### Month 6: Testing, Deployment, and Validation

#### Week 9-10: Comprehensive Testing

**Tasks**:
1. RBAC testing
   - Test each role has correct access permissions
   - Test role escalation prevention
   - Test access denial for unauthorized roles
   - Test role-based endpoint protection

2. MFA testing
   - Test MFA setup flow
   - Test MFA verification with valid code
   - Test MFA verification with invalid code
   - Test backup code functionality
   - Test MFA disable functionality
   - Test MFA with multiple authenticator apps

3. Session management testing
   - Test session creation on login
   - Test session idle timeout (simulate 15-min idle)
   - Test session absolute timeout (simulate 8-hr duration)
   - Test session termination on logout
   - Test concurrent session handling
   - Test session recovery after timeout

4. Audit logging testing
   - Test audit log creation for all API calls
   - Test PII masking in logs
   - Test session tracking across requests
   - Test evidence export functionality
   - Verify audit log completeness

5. Performance testing
   - Test authentication latency (<100ms target)
   - Test session update latency
   - Test evidence export performance
   - Verify no performance degradation from access controls

6. Security testing
   - Test RBAC bypass attempts
   - Test MFA bypass attempts
   - Test session hijacking attempts
   - Test evidence tampering attempts

**Deliverables**:
- Test execution reports
- Test results summary
- List of defects found
- Remediation plan for any issues

**Acceptance Criteria**:
- [ ] All unit tests passing (target: 95%+ coverage)
- [ ] All integration tests passing
- [ ] Performance benchmarks met (auth <100ms)
- [ ] Security tests passing
- [ ] No critical or high-severity defects

---

#### Week 11-12: Deployment and Validation

**Tasks**:
1. Update Access Control Policy with implementation details
2. Create Access Control Implementation Guide
3. Prepare deployment checklist
4. Create rollback plan
5. Deploy to production (following checklist)
6. Monitor for errors (1 hour post-deployment)
7. Verify all controls working
8. Collect initial evidence
9. Update runbooks and documentation
10. Create Phase 2 completion report

**Deployment Checklist**:

```markdown
# Phase 2 Deployment Checklist

## Pre-Deployment
- [ ] Database migrations tested (up and down) in staging
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment

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
- [ ] Notify stakeholders of successful deployment

## Rollback Plan
- If deployment fails: `git revert <commit>`
- Rollback database: `npm run migrate:down`
- Monitor rollback success
- Notify stakeholders of rollback
```

**Rollback Plan**:
- Immediate (0-1 hour): Revert code to previous stable version, rollback database migrations
- Short-term (1-24 hours): Investigate root cause, document lessons learned, plan remediation
- Long-term (1-7 days): Fix identified issues, re-test thoroughly, re-deploy with fixes

**Deliverables**:
- Updated Access Control Policy document
- Access Control Implementation Guide
- Deployment checklist
- Phase 2 completion report
- Evidence of successful deployment

**Acceptance Criteria**:
- [ ] All Phase 2 controls operational
- [ ] All tests passing
- [ ] No critical or high-severity issues
- [ ] Performance metrics met
- [ ] Evidence collection automated
- [ ] Documentation updated

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

**Access Control Metrics**:
- MFA enrollment rate: Target 80%+ within 3 months
- Failed login attempts: Monitor for account lockouts
- Session timeout rate: Track frequency and user impact
- Access denial rate: Monitor for unauthorized access attempts

**Evidence Collection Metrics**:
- Audit log export success rate: Target 99%+
- Evidence export latency: Target <5 minutes for 30-day range
- Evidence repository size: Monitor storage usage
- Evidence export schedule compliance: Verify weekly/monthly jobs running

**Performance Metrics**:
- Authentication latency: Target <100ms
- Session update latency: Target <50ms
- Evidence export latency: Target <5 minutes
- API response time: Maintain <200ms for auth endpoints

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

**Recommended Approach**: Incremental Deployment (Approach 1)
- Lowest risk
- Highest quality
- Best team learning
- Safest rollback
- Meets all compliance requirements

**Key Takeaways**:
- RBAC enforced at database and application layers
- MFA provides strong authentication for all users
- Session timeout ensures HIPAA compliance
- Automated evidence collection enables audit readiness
- Testing validates all controls meet compliance requirements

**Success Criteria**:
- All SOC 2 CC6.1-CC6.7 controls operational
- All ISO 27001 A.5.17-A.5.18 controls operational
- HIPAA §164.312(a)(1)(ii)(C) satisfied
- Evidence repository populated and automated
- Phase 2 complete and ready for Phase 3

---

**Document End**
