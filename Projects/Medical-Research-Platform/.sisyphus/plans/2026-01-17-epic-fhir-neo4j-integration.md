# Epic FHIR Integration + Neo4j AuraDB Hybrid Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a HIPAA/GDPR-compliant medical research data platform that pulls patient data from Epic FHIR API upon consent, stores structured data in PostgreSQL, maintains relationships in Neo4j AuraDB, and processes everything through BullMQ queues for AI/human research consumption.

**Architecture:** Three-tier pipeline with SMART on FHIR patient consent → Epic FHIR data extraction → BullMQ queue processing → Hybrid storage (PostgreSQL for structured data, Neo4j for medical relationships) → AI/ML-ready data lake for research consumption.

**Tech Stack:** Epic FHIR R4 API, SMART on FHIR OAuth 2.0, Neo4j AuraDB, PostgreSQL 15+ with TypeORM, BullMQ with Redis, Node.js/Express, Federated Learning (optional).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│              PATIENT CONSENT LAYER (SMART on FHIR)           │
│  • MyChart Launch: Patient authorizes app from Epic           │
│  • Standalone Launch: Direct OAuth flow                      │
│  • Consent Form: HIPAA/GDPR/CCPA scope selection          │
│  • Revocation: One-click access termination                     │
└──────────────────────────────┬──────────────────────────────────┘
                             │ Patient grants consent
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              EPIC FHIR API DATA EXTRACTION                       │
│  • Authentication: OAuth 2.0 with PKCE                         │
│  • Patient Demographics: Patient resource                           │
│  • Clinical Data: Condition, Observation, MedicationRequest         │
│  • Lab Results: DiagnosticReport with nested Observations            │
│  • Encounters: Patient visit history                               │
│  • Bulk Export: Large-scale historical data pull                   │
└──────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              BULLMQ INGESTION QUEUE (Redis)                    │
│  • Queue: 'fhir-ingestion'                                     │
│  • Priority: High (patient-triggered), Medium (scheduled)      │
│  • Deduplication: Job ID = fhir-patient-sync:{patientId}      │
│  • Retry Strategy: Exponential backoff (3 attempts)                │
└──────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DATA TRANSFORMATION & VALIDATION LAYER               │
│  • FHIR to OMOP CDM Mapping                                  │
│  • Data Quality Checks: PHI detection, format validation             │
│  • Clinical Code Standardization: ICD-10→SNOMED, RxNorm            │
│  • De-identification: Safe Harbor + Expert Determination           │
└───────────┬─────────────────────────┬─────────────────────────┘
            │                     │
            ▼                     ▼
┌────────────────────────┐  ┌─────────────────────────┐
│   PostgreSQL (SQL)   │  │   Neo4j AuraDB      │
│                     │  │   (Graph Database)    │
│ • patients          │  │ • Nodes:             │
│ • lab_results      │  │   - Patient          │
│ • medications      │  │   - Condition        │
│ • vitals           │  │   - Treatment        │
│ • encounters       │  │   - Provider         │
│ • omop_* tables    │  │   - Medication       │
│ • consents         │  │ • Relationships:      │
│ • audit_logs      │  │   - HAS_CONDITION    │
│ • phi_access_logs │  │   - UNDERGOES       │
│                     │  │   - TAKES           │
│                     │  │   - VISITED         │
│                     │  │   - CONSENTED_TO     │
└─────────┬───────────┘  └───────────┬─────────────┘
          │                        │
          └────────┬───────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              RESEARCH DATA LAYER (AI/Human Ready)           │
│  • Data Warehouse: Parquet/Delta Lake (optimized for ML)       │
│  • Feature Store: Pre-computed ML features                       │
│  • Research API: GDPR/CCPA-compliant data access              │
│  • Federated Learning: Local model training without PHI movement    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### PostgreSQL Schema (Structured Medical Data)

```sql
-- 1. Patient Core Table
CREATE TABLE patients (
    id BIGSERIAL PRIMARY KEY,
    epic_patient_id VARCHAR(50) UNIQUE NOT NULL,  -- Epic internal ID
    patient_id VARCHAR(50) UNIQUE NOT NULL,        -- Health-Mesh internal ID
    birth_date DATE NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O', 'U')),
    race VARCHAR(50),
    ethnicity VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lab Results (OMOP-aligned)
CREATE TABLE lab_results (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    epic_observation_id VARCHAR(50) UNIQUE,
    test_code VARCHAR(20) NOT NULL,  -- LOINC code
    test_name VARCHAR(255) NOT NULL,
    numeric_value NUMERIC(20, 6),
    text_value TEXT,
    unit VARCHAR(20),
    reference_low NUMERIC(20, 6),
    reference_high NUMERIC(20, 6),
    is_abnormal BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_lab_patient_collected (patient_id, collected_at DESC)
);

-- 3. Medications (RxNorm-aligned)
CREATE TABLE medications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    epic_medication_id VARCHAR(50) UNIQUE,
    rx_norm_code VARCHAR(20) NOT NULL,  -- RxNorm standardized code
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage_form VARCHAR(50),  -- tablet, injection, etc.
    strength_value NUMERIC(15, 3),
    strength_unit VARCHAR(20),
    prescribed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_med_patient_active (patient_id, is_active)
);

-- 4. Vitals (Time-series optimized)
CREATE TABLE vitals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    vital_type VARCHAR(50) NOT NULL,  -- blood_pressure, heart_rate, temperature
    vital_data JSONB NOT NULL,  -- Store systolic/diastolic for BP
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_vital_patient_time (patient_id, measured_at DESC)
);

-- 5. Encounters (Visit history)
CREATE TABLE encounters (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    epic_encounter_id VARCHAR(50) UNIQUE,
    encounter_type VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    discharge_disposition VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_enc_patient_date (patient_id, start_date DESC)
);

-- 6. Epic Consent Tracking
CREATE TABLE epic_consents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    epic_user_id VARCHAR(50) NOT NULL,  -- Epic OAuth subject
    consent_type VARCHAR(20) NOT NULL,  -- 'HIPAA', 'GDPR', 'CCPA'
    scope_requested JSONB NOT NULL,  -- FHIR scopes granted
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'revoked', 'expired'
    refresh_token_encrypted BYTEA,  -- Encrypted refresh token
    access_token_hash VARCHAR(64),  -- Hash of last access token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (patient_id, epic_user_id)
);

-- 7. Data Sync Tracking
CREATE TABLE epic_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,  -- 'initial', 'incremental', 'bulk'
    epic_resources_synced JSONB NOT NULL,  -- List of FHIR resources pulled
    records_synced INT NOT NULL,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'failed'
    error_message TEXT,
    INDEX idx_sync_patient_status (patient_id, status)
);

-- 8. PHI Access Audit (HIPAA Requirement)
CREATE TABLE phi_access_logs (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    accessed_by_user_id BIGINT REFERENCES users(id),
    resource_type VARCHAR(50) NOT NULL,  -- 'lab_result', 'medication', etc.
    resources_accessed JSONB,  -- Specific IDs accessed
    purpose TEXT NOT NULL,  -- 'research_study_X', 'patient_portal'
    ip_address INET,
    user_agent TEXT,
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(64),
    INDEX idx_phi_patient_time (patient_id, access_time DESC)
);

-- 9. Data Retention Policy (HIPAA/GDPR)
CREATE TABLE data_retention_audit (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    record_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    retention_years INT NOT NULL,  -- 7 years adults, 21 minors
    action_required VARCHAR(20),  -- 'ARCHIVE', 'DELETE', 'ANONYMIZE'
    action_performed_at TIMESTAMP WITH TIME ZONE
);
```

### Neo4j Graph Schema (Medical Relationships)

```cypher
// Create indexes for performance
CREATE INDEX patient_id_index FOR (p:Patient) ON (p.patient_id);
CREATE INDEX condition_code_index FOR (c:Condition) ON (c.code);
CREATE INDEX medication_code_index FOR (m:Medication) ON (m.rx_norm_code);
CREATE INDEX provider_id_index FOR (pr:Provider) ON (pr.provider_id);

// Patient Node
CREATE CONSTRAINT patient_id_unique IF NOT EXISTS FOR (p:Patient) REQUIRE p.patient_id IS UNIQUE;

// Create patient with clinical timeline
MATCH (p:Patient {patient_id: $patient_id})
SET p.birth_date = $birth_date,
    p.gender = $gender,
    p.first_synced_at = datetime(),
    p.last_synced_at = datetime()
RETURN p;

// Condition Node (Standardized SNOMED CT codes)
CREATE CONSTRAINT condition_code_unique IF NOT EXISTS FOR (c:Condition) REQUIRE c.code IS UNIQUE;
MATCH (c:Condition {code: $code, name: $name, system: 'SNOMED-CT'})
RETURN c;

// Treatment/Medication Node (Standardized RxNorm)
CREATE CONSTRAINT medication_code_unique IF NOT EXISTS FOR (m:Medication) REQUIRE m.rx_norm_code IS UNIQUE;
MATCH (m:Medication {rx_norm_code: $code, name: $name})
RETURN m;

// Provider Node
CREATE CONSTRAINT provider_id_unique IF NOT EXISTS FOR (pr:Provider) REQUIRE pr.provider_id IS UNIQUE;
MATCH (pr:Provider {provider_id: $id, name: $name, specialty: $specialty, institution: $institution})
RETURN pr;

// Relationships: Patient to Conditions
MATCH (p:Patient {patient_id: $patient_id})
MATCH (c:Condition {code: $condition_code})
MERGE (p)-[r:HAS_CONDITION]->(c)
SET r.onset_date = $onset_date,
    r.severity = $severity,
    r.status = $status,
    r.epic_source = $epic_observation_id
RETURN p, c, r;

// Relationships: Patient to Medications
MATCH (p:Patient {patient_id: $patient_id})
MATCH (m:Medication {rx_norm_code: $rx_norm_code})
MERGE (p)-[r:TAKES]->(m)
SET r.started_at = $prescribed_at,
    r.dosage_form = $dosage_form,
    r.strength_value = $strength_value,
    r.strength_unit = $strength_unit,
    r.is_active = $is_active,
    r.prescribed_by = $provider_id
RETURN p, m, r;

// Relationships: Patient Encounters with Providers
MATCH (p:Patient {patient_id: $patient_id})
MATCH (pr:Provider {provider_id: $provider_id})
MERGE (p)-[r:VISITED]->(pr)
SET r.encounter_type = $encounter_type,
    r.start_date = $start_date,
    r.end_date = $end_date,
    r.epic_encounter_id = $epic_encounter_id
RETURN p, pr, r;

// Complex Query: Find Similar Patient Pathways
// Example: Find patients with similar condition→treatment sequences
MATCH path1 = (p1:Patient)-[:HAS_CONDITION]->(c:Condition)-[:RECOMMENDED_FOR]->(m:Medication)
MATCH path2 = (p2:Patient)-[:HAS_CONDITION]->(c)-[:RECOMMENDED_FOR]->(m)
WHERE p1.patient_id = $patient_id AND p1.patient_id <> p2.patient_id
WITH p2, count(path1) AS similarity_score
ORDER BY similarity_score DESC
LIMIT 100
RETURN p2, similarity_score;
```

---

## Implementation Phases

### Phase 1: Epic Sandbox Integration (Weeks 1-4)

**Goal:** Validate FHIR integration patterns in Epic's testing sandbox environment with example patient data.

**Deliverables:**
- OAuth 2.0 SMART on FHIR client registration
- Basic patient data extraction from Epic sandbox
- Consent management flow validation
- BullMQ queue for data ingestion
- PostgreSQL + Neo4j schema creation

---

### Phase 2: Patient-Driven MVP (Weeks 5-10)

**Goal:** Production SMART on FHIR app where patients install from MyChart, authorize data export, and sync medical records to Health-Mesh.

**Deliverables:**
- Standalone OAuth 2.0 launch with PKCE
- Patient consent UI (HIPAA/GDPR/CCPA scope selection)
- Incremental data sync (new data only)
- Patient portal for consent management
- Data validation and de-identification pipeline

---

### Phase 3: Enterprise Production (Weeks 11-16)

**Goal:** Full EHR integration for hospitals/providers to request patient consent for research studies at scale.

**Deliverables:**
- Production Epic client credentials
- Backend OAuth 2.0 with client credentials (machine-to-machine)
- Bulk data export for population health
- Researcher portal for study participation
- Advanced compliance monitoring (risk detection, audit trails)

---


---

## Detailed Implementation Tasks

### Task Organization Structure

This section breaks down all implementation into bite-sized tasks (2-5 minutes each) following TDD approach. Each task includes:
- Files to create/modify
- Test file locations
- Complete code examples
- Exact commands to run
- Expected outputs

**Total Estimated Tasks**: 180+ tasks across 12 components
**Total Estimated Time**: 16 weeks (3 developers × 40 hours/week)

---

## Component 1: Epic FHIR Service Layer

### Task 1.1: Create Epic FHIR Configuration

**Files:**
- Create: `api/config/epic-fhir.config.ts`
- Test: `test/unit/epic-fhir.config.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/epic-fhir.config.test.ts
import { EpicFhirConfig } from '../../api/config/epic-fhir.config';

describe('EpicFhirConfig', () => {
  it('should load sandbox configuration by default', () => {
    const config = new EpicFhirConfig();
    expect(config.fhirBaseUrl).toBe('https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4');
    expect(config.environment).toBe('sandbox');
  });

  it('should load production configuration when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    const config = new EpicFhirConfig();
    expect(config.fhirBaseUrl).toBe('https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4');
    expect(config.environment).toBe('production');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/epic-fhir.config.test.ts`
Expected: FAIL with "Cannot find module '../../api/config/epic-fhir.config'"

**Step 3: Write minimal implementation**

```typescript
// api/config/epic-fhir.config.ts
import dotenv from 'dotenv';
dotenv.config();

export interface EpicFhirConfigInterface {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fhirBaseUrl: string;
  tokenEndpoint: string;
  authorizeEndpoint: string;
  environment: 'sandbox' | 'production';
}

export class EpicFhirConfig implements EpicFhirConfigInterface {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly fhirBaseUrl: string;
  readonly tokenEndpoint: string;
  readonly authorizeEndpoint: string;
  readonly environment: 'sandbox' | 'production';

  constructor() {
    this.environment = (process.env.NODE_ENV as 'sandbox' | 'production') || 'sandbox';
    
    if (this.environment === 'sandbox') {
      this.fhirBaseUrl = process.env.EPIC_SANDBOX_FHIR_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
      this.clientId = process.env.EPIC_SANDBOX_CLIENT_ID || '';
      this.clientSecret = process.env.EPIC_SANDBOX_CLIENT_SECRET || '';
      this.redirectUri = process.env.EPIC_SANDBOX_REDIRECT_URI || 'http://localhost:4000/api/epic/callback';
      this.tokenEndpoint = process.env.EPIC_SANDBOX_TOKEN_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
      this.authorizeEndpoint = process.env.EPIC_SANDBOX_AUTHORIZE_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize';
    } else {
      this.fhirBaseUrl = process.env.EPIC_PRODUCTION_FHIR_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
      this.clientId = process.env.EPIC_PRODUCTION_CLIENT_ID || '';
      this.clientSecret = process.env.EPIC_PRODUCTION_CLIENT_SECRET || '';
      this.redirectUri = process.env.EPIC_PRODUCTION_REDIRECT_URI || 'https://app.health-mesh.com/api/epic/callback';
      this.tokenEndpoint = process.env.EPIC_PRODUCTION_TOKEN_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
      this.authorizeEndpoint = process.env.EPIC_PRODUCTION_AUTHORIZE_ENDPOINT || 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize';
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/epic-fhir.config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/config/epic-fhir.config.ts test/unit/epic-fhir.config.test.ts
git commit -m "feat: add Epic FHIR configuration with sandbox/production support"
```

---

### Task 1.2: Create Epic OAuth 2.0 Service

**Files:**
- Create: `api/services/epic-oauth.service.ts`
- Test: `test/unit/epic-oauth.service.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/epic-oauth.service.test.ts
import { EpicOAuthService } from '../../api/services/epic-oauth.service';

describe('EpicOAuthService', () => {
  it('should generate OAuth 2.0 authorize URL with PKCE', async () => {
    const service = new EpicOAuthService();
    const state = 'test-state-123';
    const codeVerifier = service.generateCodeVerifier();
    const authUrl = await service.getAuthorizeUrl(state, codeVerifier);
    
    expect(authUrl).toContain('https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize');
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('code_challenge=');
    expect(authUrl).toContain('code_challenge_method=S256');
    expect(authUrl).toContain('state=' + state);
  });

  it('should exchange authorization code for access token', async () => {
    const service = new EpicOAuthService();
    const mockCode = 'auth-code-xyz';
    const mockVerifier = 'code-verifier-123';
    
    const tokenResponse = await service.exchangeCodeForToken(mockCode, mockVerifier);
    
    expect(tokenResponse.access_token).toBeDefined();
    expect(tokenResponse.refresh_token).toBeDefined();
    expect(tokenResponse.expires_in).toBe(3600);
    expect(tokenResponse.token_type).toBe('Bearer');
  });

  it('should refresh access token using refresh token', async () => {
    const service = new EpicOAuthService();
    const mockRefreshToken = 'refresh-token-abc';
    
    const tokenResponse = await service.refreshAccessToken(mockRefreshToken);
    
    expect(tokenResponse.access_token).toBeDefined();
    expect(tokenResponse.refresh_token).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/epic-oauth.service.test.ts`
Expected: FAIL with "Cannot find module '../../api/services/epic-oauth.service'"

**Step 3: Write minimal implementation**

```typescript
// api/services/epic-oauth.service.ts
import crypto from 'crypto';
import axios from 'axios';
import { EpicFhirConfig } from '../config/epic-fhir.config';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface AuthorizeUrlResult {
  url: string;
  state: string;
  codeVerifier: string;
}

export class EpicOAuthService {
  private config: EpicFhirConfig;
  private static readonly CODE_VERIFIER_LENGTH = 128;

  constructor() {
    this.config = new EpicFhirConfig();
  }

  /**
   * Generate cryptographically secure code verifier (random string)
   * Used in PKCE (Proof Key for Code Exchange) flow
   */
  generateCodeVerifier(): string {
    return crypto
      .randomBytes(this.CODE_VERIFIER_LENGTH)
      .toString('base64url')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate code challenge from verifier (SHA-256 hash)
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Build OAuth 2.0 authorize URL with PKCE
   * SMART on FHIR specification: https://hl7.org/fhir/smart-app-launch/
   */
  async getAuthorizeUrl(stateOverride?: string): Promise<AuthorizeUrlResult> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = stateOverride || this.generateState();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'patient/*.rs launch', // SMART on FHIR v2.2 scopes
      aud: this.config.fhirBaseUrl,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${this.config.authorizeEndpoint}?${params.toString()}`;

    return {
      url: authUrl,
      state,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for access token
   * OAuth 2.0 token endpoint
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier
    });

    const response = await axios.post(this.config.tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.status !== 200) {
      throw new Error(`OAuth token exchange failed: ${response.status} - ${response.data}`);
    }

    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId
    });

    const response = await axios.post(this.config.tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.status !== 200) {
      throw new Error(`OAuth token refresh failed: ${response.status} - ${response.data}`);
    }

    return response.data;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/epic-oauth.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/services/epic-oauth.service.ts test/unit/epic-oauth.service.test.ts
git commit -m "feat: add Epic OAuth 2.0 service with PKCE support"
```

---

### Task 1.3: Create Epic FHIR Client Service

**Files:**
- Create: `api/services/epic-fhir.service.ts`
- Test: `test/unit/epic-fhir.service.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/epic-fhir.service.test.ts
import { EpicFhirService } from '../../api/services/epic-fhir.service';

describe('EpicFhirService', () => {
  it('should fetch patient resource by ID', async () => {
    const service = new EpicFhirService('mock-access-token');
    const patient = await service.getPatient('patient-123');
    
    expect(patient).toBeDefined();
    expect(patient.resourceType).toBe('Patient');
    expect(patient.id).toBe('patient-123');
    expect(patient.name).toBeDefined();
  });

  it('should fetch patient conditions', async () => {
    const service = new EpicFhirService('mock-access-token');
    const conditions = await service.getPatientConditions('patient-123');
    
    expect(conditions).toBeDefined();
    expect(conditions.length).toBeGreaterThan(0);
    expect(conditions[0].resourceType).toBe('Condition');
  });

  it('should fetch patient observations (labs, vitals)', async () => {
    const service = new EpicFhirService('mock-access-token');
    const observations = await service.getPatientObservations('patient-123');
    
    expect(observations).toBeDefined();
    expect(Array.isArray(observations)).toBe(true);
  });

  it('should fetch patient medications', async () => {
    const service = new EpicFhirService('mock-access-token');
    const medications = await service.getPatientMedications('patient-123');
    
    expect(medications).toBeDefined();
    expect(Array.isArray(medications)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/epic-fhir.service.test.ts`
Expected: FAIL with "Cannot find module '../../api/services/epic-fhir.service'"

**Step 3: Write minimal implementation**

```typescript
// api/services/epic-fhir.service.ts
import axios from 'axios';
import { EpicFhirConfig } from '../config/epic-fhir.config';

export interface FhirResource<T = any> {
  resourceType: string;
  id: string;
  [key: string]: T;
}

export interface FhirPatient extends FhirResource<any> {
  resourceType: 'Patient';
  name?: { family: string; given: string[] };
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  identifier?: Array<{ system: string; value: string }>;
}

export interface FhirCondition extends FhirResource<any> {
  resourceType: 'Condition';
  code?: { coding: Array<{ system: string; code: string; display: string }> };
  clinicalStatus?: { coding: Array<{ code: string }> };
  onsetDateTime?: string;
  verificationStatus?: { coding: Array<{ code: string }> };
}

export interface FhirObservation extends FhirResource<any> {
  resourceType: 'Observation';
  code?: { coding: Array<{ system: string; code: string; display: string }> };
  valueQuantity?: { value: number; unit: string };
  effectiveDateTime?: string;
  referenceRange?: Array<{ low: { value: number }; high: { value: number } }>;
  category?: Array<{ coding: Array<{ code: string; display: string }> }>;
}

export interface FhirMedicationRequest extends FhirResource<any> {
  resourceType: 'MedicationRequest';
  medicationCodeableConcept?: { coding: Array<{ system: string; code: string; display: string }> };
  dosageInstruction?: { text: string };
  authoredOn?: string;
  status?: string;
}

export interface FhirBundle<T> {
  resourceType: 'Bundle';
  entry?: Array<{ resource: T }>;
  total?: number;
  link?: Array<{ url: string; relation: string }>;
}

export class EpicFhirService {
  private config: EpicFhirConfig;
  private accessToken: string;
  private axiosInstance: any;

  constructor(accessToken: string) {
    this.config = new EpicFhirConfig();
    this.accessToken = accessToken;
    this.axiosInstance = axios.create({
      baseURL: this.config.fhirBaseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      },
      timeout: 30000 // 30 seconds
    });
  }

  /**
   * Fetch patient resource by ID
   * FHIR R4 specification: https://hl7.org/fhir/R4/patient.html
   */
  async getPatient(patientId: string): Promise<FhirPatient> {
    const response = await this.axiosInstance.get<FhirBundle<FhirPatient>>(`/Patient/${patientId}`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch patient: ${response.status} - ${response.data}`);
    }

    if (!response.data.entry || response.data.entry.length === 0) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    return response.data.entry[0].resource;
  }

  /**
   * Search patient by identifier (MRN, insurance ID, etc.)
   * Supports Epic's $match operation
   */
  async searchPatient(identifier: string): Promise<FhirPatient[]> {
    const response = await this.axiosInstance.get<FhirBundle<FhirPatient>>(
      `/Patient?identifier=${encodeURIComponent(identifier)}`
    );

    if (response.status !== 200) {
      throw new Error(`Failed to search patient: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Fetch patient conditions (diagnoses, health concerns)
   * SMART on FHIR scope: patient/Condition.rs
   */
  async getPatientConditions(patientId: string): Promise<FhirCondition[]> {
    const response = await this.axiosInstance.get<FhirBundle<FhirCondition>>(
      `/Condition?patient=${encodeURIComponent(patientId)}&_count=100`
    );

    if (response.status !== 200) {
      throw new Error(`Failed to fetch conditions: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Fetch patient observations (lab results, vitals, measurements)
   * SMART on FHIR scope: patient/Observation.rs
   * Uses _lastn operation for latest values
   */
  async getPatientObservations(patientId: string, categories?: string[]): Promise<FhirObservation[]> {
    let url = `/Observation?patient=${encodeURIComponent(patientId)}&_lastn=100`;
    
    if (categories && categories.length > 0) {
      const categoryParams = categories.map(cat => `category=${encodeURIComponent(cat)}`).join('&');
      url = `/Observation?patient=${encodeURIComponent(patientId)}&${categoryParams}`;
    }

    const response = await this.axiosInstance.get<FhirBundle<FhirObservation>>(url);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch observations: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Fetch patient medications
   * SMART on FHIR scope: patient/MedicationRequest.rs
   */
  async getPatientMedications(patientId: string, status?: 'active' | 'completed' | 'entered-in-error' | 'stopped' | 'cancelled' | 'on-hold'): Promise<FhirMedicationRequest[]> {
    let url = `/MedicationRequest?patient=${encodeURIComponent(patientId)}&_count=100`;
    
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    const response = await this.axiosInstance.get<FhirBundle<FhirMedicationRequest>>(url);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch medications: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Fetch patient encounters (visits, admissions)
   * SMART on FHIR scope: patient/Encounter.rs
   */
  async getPatientEncounters(patientId: string): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/Encounter?patient=${encodeURIComponent(patientId)}&_count=100&_sort=-date`
    );

    if (response.status !== 200) {
      throw new Error(`Failed to fetch encounters: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Fetch diagnostic reports (comprehensive lab results)
   * SMART on FHIR scope: patient/DiagnosticReport.rs
   */
  async getDiagnosticReports(patientId: string): Promise<any[]> {
    const response = await this.axiosInstance.get(
      `/DiagnosticReport?patient=${encodeURIComponent(patientId)}&_count=50`
    );

    if (response.status !== 200) {
      throw new Error(`Failed to fetch diagnostic reports: ${response.status}`);
    }

    return response.data.entry?.map(entry => entry.resource) || [];
  }

  /**
   * Request bulk data export for initial patient sync
   * Uses FHIR Bulk Data Export specification
   */
  async requestBulkExport(patientId: string, resourceTypes: string[]): Promise<string> {
    const response = await this.axiosInstance.post(
      '/$bulk-export',
      {
        resourceType: resourceTypes,
        patient: patientId,
        outputFormat: 'application/fhir+json',
        since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // Last year
      }
    );

    if (response.status !== 202) {
      throw new Error(`Failed to request bulk export: ${response.status}`);
    }

    return response.data.pollingLocation;
  }

  /**
   * Check bulk export status
   */
  async getBulkExportStatus(pollingLocation: string): Promise<any> {
    const response = await this.axiosInstance.get(pollingLocation);

    if (response.status !== 200) {
      throw new Error(`Failed to check export status: ${response.status}`);
    }

    return response.data;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/epic-fhir.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/services/epic-fhir.service.ts test/unit/epic-fhir.service.test.ts
git commit -m "feat: add Epic FHIR client service with R4 resource support"
```

---


## Component 2: BullMQ Queue & Workers

### Task 2.1: Configure Epic FHIR Ingestion Queue

**Files:**
- Modify: `api/queue-config.ts`
- Test: `test/unit/queue-config.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/queue-config.test.ts
import { epicIngestionQueue } from '../../api/queue-config';

describe('Epic Ingestion Queue', () => {
  it('should queue fhir-sync job with unique ID', async () => {
    const job = await epicIngestionQueue.add('sync-patient-data', {
      patientId: 'patient-123',
      syncType: 'initial',
      epicUserId: 'epic-user-456'
    }, {
      jobId: 'fhir-sync:patient-123'
    });

    expect(job.id).toBeDefined();
    expect(job.name).toBe('sync-patient-data');
  });

  it('should reject duplicate sync job for same patient', async () => {
    const job1 = await epicIngestionQueue.add('sync-patient-data', {
      patientId: 'patient-123',
      syncType: 'initial'
    }, {
      jobId: 'fhir-sync:patient-123'
    });

    try {
      await epicIngestionQueue.add('sync-patient-data', {
        patientId: 'patient-123',
        syncType: 'initial'
      }, {
        jobId: 'fhir-sync:patient-123'
      });
      fail('Expected duplicate job error');
    } catch (error: any) {
      expect(error.message).toContain('duplicate');
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/queue-config.test.ts`
Expected: FAIL with "Cannot find module '../../api/queue-config'"

**Step 3: Write minimal implementation**

```typescript
// api/queue-config.ts (MODIFY - append to existing config)
import { Queue, QueueScheduler, QueueEvents } from 'bullmq';
import { config } from 'dotenv';
config();

const redisOpts = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
};

// Existing queues from current codebase
export const consentQueue = new Queue('consent', { connection: redisOpts });
export const legalFormQueue = new Queue('legal-form', { connection: redisOpts });

// NEW: Epic FHIR Ingestion Queue
export const epicIngestionQueue = new Queue('fhir-ingestion', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Remove jobs after 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Remove failed jobs after 7 days
      count: 5000,
    },
  }
});

export const epicScheduler = new QueueScheduler('fhir-ingestion', { connection: redisOpts });
export const epicQueueEvents = new QueueEvents('fhir-ingestion', { connection: redisOpts });

// Queue health monitoring
epicQueueEvents.on('waiting', ({ jobId }) => {
  console.log(`Job waiting: ${jobId}`);
});

epicQueueEvents.on('active', ({ jobId }) => {
  console.log(`Job started: ${jobId}`);
});

epicQueueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job completed: ${jobId}, records: ${returnvalue?.recordsSynced || 0}`);
});

epicQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Job failed: ${jobId}, reason: ${failedReason}`);
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/queue-config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/queue-config.ts test/unit/queue-config.test.ts
git commit -m "feat: add Epic FHIR ingestion queue with deduplication and monitoring"
```

---

### Task 2.2: Create Epic Sync Worker

**Files:**
- Create: `api/workers/epic-fhir.worker.ts`
- Test: `test/integration/epic-fhir.worker.test.ts`

**Step 1: Write failing test**

```typescript
// test/integration/epic-fhir.worker.test.ts
import { epicIngestionQueue } from '../../api/queue-config';
import EpicFhirWorker from '../../api/workers/epic-fhir.worker';
import { TestDatabase } from '../helpers/test-database.helper';

describe('EpicFhirWorker', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
  });

  it('should process initial sync job', async () => {
    const job = await epicIngestionQueue.add('sync-patient-data', {
      patientId: 'test-patient-1',
      syncType: 'initial',
      epicUserId: 'epic-user-1',
      accessToken: 'mock-token'
    });

    await new EpicFhirWorker().processJob(job);

    const patient = await testDb.query('SELECT * FROM patients WHERE patient_id = $1', ['test-patient-1']);
    
    expect(patient).toBeDefined();
    expect(patient.epic_patient_id).toBe('epic-user-1');
    expect(patient.birth_date).toBeDefined();
  });

  it('should process incremental sync job for new lab results', async () => {
    const job = await epicIngestionQueue.add('sync-patient-data', {
      patientId: 'test-patient-1',
      syncType: 'incremental',
      resources: ['Observation'],
      lastSyncDate: '2025-01-01T00:00:00Z',
      accessToken: 'mock-token'
    });

    await new EpicFhirWorker().processJob(job);

    const labResults = await testDb.query('SELECT * FROM lab_results WHERE patient_id = (SELECT id FROM patients WHERE patient_id = $1)', ['test-patient-1']);
    
    expect(labResults).toBeDefined();
    expect(labResults.length).toBeGreaterThan(0);
  });

  it('should log sync failures and retry', async () => {
    const job = await epicIngestionQueue.add('sync-patient-data', {
      patientId: 'test-patient-fail',
      syncType: 'initial',
      accessToken: 'invalid-token'
    });

    try {
      await new EpicFhirWorker().processJob(job);
      fail('Expected API error');
    } catch (error: any) {
      expect(error.message).toContain('Failed to fetch patient data');
    }

    const syncLog = await testDb.query('SELECT * FROM epic_sync_logs WHERE patient_id = $1 AND status = $2', ['test-patient-fail', 'failed']);
    
    expect(syncLog).toBeDefined();
    expect(syncLog.error_message).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/integration/epic-fhir.worker.test.ts`
Expected: FAIL with "Cannot find module '../../api/workers/epic-fhir.worker'"

**Step 3: Write minimal implementation**

```typescript
// api/workers/epic-fhir.worker.ts
import { Worker, Job } from 'bullmq';
import { epicIngestionQueue } from '../queue-config';
import { EpicFhirService } from '../services/epic-fhir.service';
import { getConnection } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { LabResult } from '../entities/lab-result.entity';
import { Medication } from '../entities/medication.entity';
import { EpicSyncLog } from '../entities/epic-sync-log.entity';
import logger from '../logger';

export interface SyncJobData {
  patientId: string;
  syncType: 'initial' | 'incremental' | 'bulk';
  epicUserId: string;
  accessToken: string;
  resources?: string[];
  lastSyncDate?: string;
}

export class EpicFhirWorker {
  private fhirService: EpicFhirService;

  constructor() {
    this.fhirService = new EpicFhirService();
  }

  async processJob(job: Job<SyncJobData>) {
    const { patientId, syncType, epicUserId, accessToken, resources, lastSyncDate } = job.data;

    logger.info(`Processing Epic sync job: ${job.id}, type: ${syncType}, patient: ${patientId}`);

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create or update sync log
      const syncLogRepo = queryRunner.manager.getRepository(EpicSyncLog);
      const syncLog = syncLogRepo.create({
        patient_id: null, // Will be set after patient creation
        sync_type: syncType,
        epic_resources_synced: resources || [],
        records_synced: 0,
        sync_started_at: new Date(),
        status: 'in_progress'
      });

      await syncLogRepo.save(syncLog);

      // Fetch patient data from Epic
      if (syncType === 'initial' || syncType === 'bulk') {
        await this.syncInitialData(queryRunner, patientId, epicUserId, accessToken, syncLog.id);
      } else if (syncType === 'incremental') {
        await this.syncIncrementalData(queryRunner, patientId, accessToken, resources, lastSyncDate, syncLog.id);
      }

      await queryRunner.commitTransaction();
      logger.info(`Epic sync completed successfully: patient ${patientId}, records: ${syncLog.records_synced}`);

      return syncLog.records_synced;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error(`Epic sync failed: patient ${patientId}`, { error: error.message });

      // Update sync log with error
      const syncLogRepo = queryRunner.manager.getRepository(EpicSyncLog);
      await syncLogRepo.update(syncLog.id, {
        status: 'failed',
        error_message: error.message,
        sync_completed_at: new Date()
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async syncInitialData(
    queryRunner: any,
    patientId: string,
    epicUserId: string,
    accessToken: string,
    syncLogId: number
  ) {
    const fhirService = new EpicFhirService(accessToken);

    // Fetch patient demographics
    const patientRepo = queryRunner.manager.getRepository(Patient);
    let patient = await patientRepo.findOne({ where: { patient_id: patientId } });

    if (!patient) {
      const epicPatient = await fhirService.searchPatient(epicUserId);
      const newPatient = patientRepo.create({
        patient_id: patientId,
        epic_patient_id: epicUserId,
        birth_date: new Date(epicPatient.birthDate),
        gender: this.mapGender(epicPatient.gender)
      });
      patient = await patientRepo.save(newPatient);
    }

    // Fetch conditions
    const conditions = await fhirService.getPatientConditions(epicUserId);
    // Save conditions to graph database (Neo4j task will handle this)

    // Fetch observations (labs, vitals)
    const observations = await fhirService.getPatientObservations(epicUserId);
    
    // Transform and save lab results
    const labRepo = queryRunner.manager.getRepository(LabResult);
    for (const obs of observations) {
      if (this.isLabResult(obs)) {
        const labResult = labRepo.create({
          patient_id: patient.id,
          epic_observation_id: obs.id,
          test_code: obs.code?.coding?.[0]?.code || '',
          test_name: obs.code?.coding?.[0]?.display || '',
          numeric_value: obs.valueQuantity?.value,
          unit: obs.valueQuantity?.unit || '',
          reference_low: obs.referenceRange?.[0]?.low?.value,
          reference_high: obs.referenceRange?.[0]?.high?.value,
          is_abnormal: this.isAbnormal(obs),
          collected_at: new Date(obs.effectiveDateTime || '')
        });
        await labRepo.save(labResult);
      }
    }

    // Fetch medications
    const medications = await fhirService.getPatientMedications(epicUserId, 'active');
    
    const medRepo = queryRunner.manager.getRepository(Medication);
    for (const med of medications) {
      const medication = medRepo.create({
        patient_id: patient.id,
        epic_medication_id: med.id,
        rx_norm_code: med.medicationCodeableConcept?.coding?.[0]?.code || '',
        medication_name: med.medicationCodeableConcept?.coding?.[0]?.display || '',
        prescribed_at: new Date(med.authoredOn || '')
      });
      await medRepo.save(medication);
    }

    // Update sync log
    const syncLogRepo = queryRunner.manager.getRepository(EpicSyncLog);
    await syncLogRepo.update(syncLogId, {
      records_synced: conditions.length + observations.length + medications.length,
      status: 'completed',
      sync_completed_at: new Date()
    });
  }

  private async syncIncrementalData(
    queryRunner: any,
    patientId: string,
    accessToken: string,
    resources: string[],
    lastSyncDate: string,
    syncLogId: number
  ) {
    const fhirService = new EpicFhirService(accessToken);
    let recordsSynced = 0;

    if (resources.includes('Observation')) {
      const observations = await fhirService.getPatientObservations(patientId);
      // Filter for new observations since lastSyncDate
      const newObservations = observations.filter(obs => {
        return new Date(obs.effectiveDateTime || '') > new Date(lastSyncDate);
      });

      const labRepo = queryRunner.manager.getRepository(LabResult);
      for (const obs of newObservations) {
        if (this.isLabResult(obs)) {
          const labResult = labRepo.create({
            patient_id: patientId,
            epic_observation_id: obs.id,
            test_code: obs.code?.coding?.[0]?.code || '',
            test_name: obs.code?.coding?.[0]?.display || '',
            numeric_value: obs.valueQuantity?.value,
            unit: obs.valueQuantity?.unit || '',
            reference_low: obs.referenceRange?.[0]?.low?.value,
            reference_high: obs.referenceRange?.[0]?.high?.value,
            is_abnormal: this.isAbnormal(obs),
            collected_at: new Date(obs.effectiveDateTime || '')
          });
          await labRepo.save(labResult);
          recordsSynced++;
        }
      }
    }

    const syncLogRepo = queryRunner.manager.getRepository(EpicSyncLog);
    await syncLogRepo.update(syncLogId, {
      records_synced,
      status: 'completed',
      sync_completed_at: new Date()
    });
  }

  private mapGender(gender: string): 'M' | 'F' | 'O' | 'U' {
    const map: Record<string, 'M' | 'F' | 'O' | 'U'> = {
      'male': 'M',
      'female': 'F',
      'other': 'O',
      'unknown': 'U'
    };
    return map[gender.toLowerCase()] || 'U';
  }

  private isLabResult(observation: any): boolean {
    const labCategories = ['laboratory', 'vital-signs', 'imaging'];
    return observation.category?.some((cat: any) => 
      labCategories.includes(cat?.coding?.[0]?.code)
    );
  }

  private isAbnormal(observation: any): boolean {
    if (!observation.valueQuantity || !observation.referenceRange) {
      return false;
    }
    const value = observation.valueQuantity.value;
    const low = observation.referenceRange[0]?.low?.value;
    const high = observation.referenceRange[0]?.high?.value;

    return value < low || value > high;
  }
}

// Initialize worker
const worker = new Worker('fhir-ingestion', async (job: Job<SyncJobData>) => {
  const epicWorker = new EpicFhirWorker();
  return await epicWorker.processJob(job);
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  concurrency: 4, // Process 4 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs per patient per hour
    duration: 3600000, // 1 hour window
  },
});

worker.on('completed', (job) => {
  logger.info(`Job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id}`, { error: err.message });
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/integration/epic-fhir.worker.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/workers/epic-fhir.worker.ts test/integration/epic-fhir.worker.test.ts
git commit -m "feat: add Epic FHIR sync worker with initial and incremental sync"
```

---


## Component 3: Neo4j AuraDB Integration

### Task 3.1: Create Neo4j Configuration

**Files:**
- Create: `api/config/neo4j.config.ts`
- Test: `test/unit/neo4j.config.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/neo4j.config.test.ts
import { Neo4jConfig } from '../../api/config/neo4j.config';

describe('Neo4jConfig', () => {
  it('should load AuraDB connection string from env', () => {
    const config = new Neo4jConfig();
    expect(config.uri).toContain('neo4j+s://');
    expect(config.uri).toContain('databases.neo4j.io');
    expect(config.username).toBe('neo4j');
    expect(config.password).toBeDefined();
  });

  it('should use AuraDB managed instance', () => {
    const config = new Neo4jConfig();
    expect(config.environment).toBe('production');
    expect(config.host).toBeUndefined(); // AuraDB uses URI, not host/port
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/neo4j.config.test.ts`
Expected: FAIL with "Cannot find module '../../api/config/neo4j.config'"

**Step 3: Write minimal implementation**

```typescript
// api/config/neo4j.config.ts
import dotenv from 'dotenv';
dotenv.config();

export interface Neo4jConfigInterface {
  uri: string;
  username: string;
  password: string;
  database?: string;
  environment: 'local' | 'sandbox' | 'production';
}

export class Neo4jConfig implements Neo4jConfigInterface {
  readonly uri: string;
  readonly username: string;
  readonly password: string;
  readonly database?: string;
  readonly environment: 'local' | 'sandbox' | 'production';

  constructor() {
    this.environment = (process.env.NODE_ENV as 'local' | 'sandbox' | 'production') || 'local';
    
    if (this.environment === 'production') {
      // AuraDB production instance
      this.uri = process.env.NEO4J_AURA_URI || 'neo4j+s://instance-id.databases.neo4j.io';
      this.username = process.env.NEO4J_AURA_USERNAME || 'neo4j';
      this.password = process.env.NEO4J_AURA_PASSWORD || '';
      this.database = 'neo4j'; // Default database in AuraDB
    } else if (this.environment === 'sandbox') {
      // Development/test instance
      this.uri = process.env.NEO4J_SANDBOX_URI || 'neo4j+s://sandbox.databases.neo4j.io';
      this.username = process.env.NEO4J_SANDBOX_USERNAME || 'neo4j';
      this.password = process.env.NEO4J_SANDBOX_PASSWORD || '';
      this.database = 'neo4j';
    } else {
      // Local development
      this.uri = process.env.NEO4J_LOCAL_URI || 'bolt://localhost:7687';
      this.username = process.env.NEO4J_LOCAL_USERNAME || 'neo4j';
      this.password = process.env.NEO4J_LOCAL_PASSWORD || 'neo4j';
      this.database = process.env.NEO4J_LOCAL_DATABASE || 'neo4j';
    }
  }

  /**
   * Get driver instance (connection pool)
   * Lazy-loaded to avoid creating connections unnecessarily
   */
  async getDriver(): Promise<any> {
    const neo4j = await import('neo4j-driver');
    return neo4j.driver(this.uri, {
      username: this.username,
      password: this.password,
      database: this.database,
      maxConnectionLifetime: 3600000, // 1 hour
      maxConnectionPoolSize: 50, // Connection pool for AuraDB
      connectionAcquisitionTimeout: 30000, // 30 seconds
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/neo4j.config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/config/neo4j.config.ts test/unit/neo4j.config.test.ts
git commit -m "feat: add Neo4j AuraDB configuration with environment support"
```

---

### Task 3.2: Create Neo4j Graph Service

**Files:**
- Create: `api/services/neo4j.service.ts`
- Test: `test/unit/neo4j.service.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/neo4j.service.test.ts
import { Neo4jGraphService } from '../../api/services/neo4j.service';

describe('Neo4jGraphService', () => {
  it('should create patient node', async () => {
    const service = new Neo4jGraphService();
    const patient = await service.createPatient({
      patientId: 'patient-123',
      birthDate: '1990-01-01',
      gender: 'M'
    });

    expect(patient).toBeDefined();
    expect(patient.patient_id).toBe('patient-123');
    expect(patient.birth_date).toBeDefined();
  });

  it('should create condition node and relationship', async () => {
    const service = new Neo4jGraphService();
    const result = await service.createPatientCondition({
      patientId: 'patient-123',
      conditionCode: 'I10',
      conditionName: 'Type 2 Diabetes',
      onsetDate: '2020-01-01',
      severity: 'moderate'
    });

    expect(result.condition).toBeDefined();
    expect(result.relationship).toBeDefined();
    expect(result.patient).toBeDefined();
  });

  it('should find similar patients by condition→medication pathway', async () => {
    const service = new Neo4jGraphService();
    const similarPatients = await service.findSimilarPathways('patient-123', 10);

    expect(similarPatients).toBeDefined();
    expect(Array.isArray(similarPatients)).toBe(true);
    expect(similarPatients.length).toBeLessThanOrEqual(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/neo4j.service.test.ts`
Expected: FAIL with "Cannot find module '../../api/services/neo4j.service'"

**Step 3: Write minimal implementation**

```typescript
// api/services/neo4j.service.ts
import { Neo4jConfig } from '../config/neo4j.config';
import logger from '../logger';

export interface PatientNode {
  patient_id: string;
  birth_date: Date;
  gender: 'M' | 'F' | 'O' | 'U';
  first_synced_at?: Date;
  last_synced_at?: Date;
}

export interface ConditionNode {
  code: string;
  name: string;
  system: string; // 'SNOMED-CT', 'ICD-10'
}

export interface MedicationNode {
  rx_norm_code: string;
  name: string;
}

export interface ProviderNode {
  provider_id: string;
  name: string;
  specialty?: string;
  institution?: string;
}

export interface HasConditionRelationship {
  onset_date?: Date;
  severity?: string;
  status?: string;
  epic_source?: string;
}

export interface TakesMedicationRelationship {
  started_at?: Date;
  dosage_form?: string;
  strength_value?: number;
  strength_unit?: string;
  is_active?: boolean;
  prescribed_by?: string;
}

export interface VisitedProviderRelationship {
  encounter_type?: string;
  start_date?: Date;
  end_date?: Date;
  epic_encounter_id?: string;
}

export interface SimilarPatientResult {
  patient_id: string;
  similarity_score: number;
  shared_conditions?: string[];
  shared_medications?: string[];
  shared_treatments?: string[];
}

export class Neo4jGraphService {
  private driver: any;
  private config: Neo4jConfig;

  constructor() {
    this.config = new Neo4jConfig();
  }

  /**
   * Initialize Neo4j driver (call once on app startup)
   */
  async initialize(): Promise<void> {
    this.driver = await this.config.getDriver();
    logger.info('Neo4j driver initialized');
  }

  /**
   * Create or update patient node
   */
  async createPatient(data: Omit<PatientNode, 'first_synced_at' | 'last_synced_at'>): Promise<PatientNode> {
    const session = this.driver.session();
    const tx = session.beginTransaction();

    try {
      const result = await tx.run(`
        MERGE (p:Patient {patient_id: $patient_id})
        ON CREATE SET p.birth_date = $birth_date, p.gender = $gender
        RETURN p
      `, {
        patient_id: data.patientId,
        birth_date: data.birthDate,
        gender: data.gender
      });

      await tx.commit();
      session.close();
      return result.records[0].get('p');
    } catch (error) {
      await tx.rollback();
      session.close();
      logger.error('Failed to create patient node', { error });
      throw error;
    }
  }

  /**
   * Create or update patient with last synced timestamp
   */
  async updatePatientSyncTime(patientId: string, syncTime: Date): Promise<void> {
    const session = this.driver.session();
    const tx = session.beginTransaction();

    try {
      await tx.run(`
        MATCH (p:Patient {patient_id: $patient_id})
        SET p.last_synced_at = $last_synced_at
        RETURN p
      `, {
        patient_id: patientId,
        last_synced_at: syncTime
      });

      await tx.commit();
      session.close();
    } catch (error) {
      await tx.rollback();
      session.close();
      logger.error('Failed to update patient sync time', { error });
      throw error;
    }
  }

  /**
   * Create or update condition node and relationship to patient
   */
  async createPatientCondition(data: {
    patientId: string;
    conditionCode: string;
    conditionName: string;
    system?: string;
    onsetDate?: Date;
    severity?: string;
    status?: string;
    epicSource?: string;
  }): Promise<{ patient: PatientNode; condition: ConditionNode; relationship: HasConditionRelationship }> {
    const session = this.driver.session();
    const tx = session.beginTransaction();

    try {
      // Create patient node if not exists
      await tx.run(`
        MERGE (p:Patient {patient_id: $patient_id})
        ON CREATE SET p.birth_date = date(), p.gender = 'U'
      `, { patient_id: data.patientId });

      // Create or update condition node
      const conditionResult = await tx.run(`
        MERGE (c:Condition {code: $code, name: $name, system: $system})
        RETURN c
      `, {
        code: data.conditionCode,
        name: data.conditionName,
        system: data.system || 'SNOMED-CT'
      });

      const condition = conditionResult.records[0].get('c');

      // Create relationship
      const relResult = await tx.run(`
        MATCH (p:Patient {patient_id: $patient_id})
        MATCH (c:Condition {code: $code})
        MERGE (p)-[r:HAS_CONDITION]->(c)
        SET r.onset_date = $onset_date,
            r.severity = $severity,
            r.status = $status,
            r.epic_source = $epic_source
        RETURN p, c, r
      `, {
        patient_id: data.patientId,
        code: data.conditionCode,
        onset_date: data.onsetDate,
        severity: data.severity,
        status: data.status,
        epic_source: data.epicSource
      });

      await tx.commit();
      session.close();

      return {
        patient: relResult.records[0].get('p'),
        condition,
        relationship: relResult.records[0].get('r')
      };
    } catch (error) {
      await tx.rollback();
      session.close();
      logger.error('Failed to create patient condition', { error });
      throw error;
    }
  }

  /**
   * Create or update medication node and relationship to patient
   */
  async createPatientMedication(data: {
    patientId: string;
    rxNormCode: string;
    medicationName: string;
    dosageForm?: string;
    strengthValue?: number;
    strengthUnit?: string;
    startedAt?: Date;
    isActive?: boolean;
    prescribedBy?: string;
  }): Promise<{ patient: PatientNode; medication: MedicationNode; relationship: TakesMedicationRelationship }> {
    const session = this.driver.session();
    const tx = session.beginTransaction();

    try {
      // Create medication node
      const medResult = await tx.run(`
        MERGE (m:Medication {rx_norm_code: $code, name: $name})
        RETURN m
      `, {
        code: data.rxNormCode,
        name: data.medicationName
      });

      const medication = medResult.records[0].get('m');

      // Create relationship
      const relParams: any = {
        patient_id: data.patientId,
        code: data.rxNormCode
      };

      if (data.startedAt) relParams.started_at = data.startedAt;
      if (data.dosageForm) relParams.dosage_form = data.dosageForm;
      if (data.strengthValue) relParams.strength_value = data.strengthValue;
      if (data.strengthUnit) relParams.strength_unit = data.strengthUnit;
      if (data.isActive !== undefined) relParams.is_active = data.isActive;
      if (data.prescribedBy) relParams.prescribed_by = data.prescribedBy;

      const relResult = await tx.run(`
        MATCH (p:Patient {patient_id: $patient_id})
        MATCH (m:Medication {rx_norm_code: $code})
        MERGE (p)-[r:TAKES]->(m)
        SET r = $props
        RETURN p, m, r
      `, relParams);

      await tx.commit();
      session.close();

      return {
        patient: relResult.records[0].get('p'),
        medication,
        relationship: relResult.records[0].get('r')
      };
    } catch (error) {
      await tx.rollback();
      session.close();
      logger.error('Failed to create patient medication', { error });
      throw error;
    }
  }

  /**
   * Create provider node and encounter relationship
   */
  async createEncounter(data: {
    patientId: string;
    providerId: string;
    providerName?: string;
    specialty?: string;
    institution?: string;
    encounterType?: string;
    startDate?: Date;
    endDate?: Date;
    epicEncounterId?: string;
  }): Promise<{ patient: PatientNode; provider: ProviderNode; relationship: VisitedProviderRelationship }> {
    const session = this.driver.session();
    const tx = session.beginTransaction();

    try {
      // Create provider node
      const providerResult = await tx.run(`
        MERGE (pr:Provider {provider_id: $provider_id})
        ON CREATE SET pr.name = $name, pr.specialty = $specialty, pr.institution = $institution
        RETURN pr
      `, {
        provider_id: data.providerId,
        name: data.providerName,
        specialty: data.specialty,
        institution: data.institution
      });

      const provider = providerResult.records[0].get('pr');

      // Create relationship
      const relParams: any = {
        patient_id: data.patientId,
        provider_id: data.providerId
      };

      if (data.encounterType) relParams.encounter_type = data.encounterType;
      if (data.startDate) relParams.start_date = data.startDate;
      if (data.endDate) relParams.end_date = data.endDate;
      if (data.epicEncounterId) relParams.epic_encounter_id = data.epicEncounterId;

      const relResult = await tx.run(`
        MATCH (p:Patient {patient_id: $patient_id})
        MATCH (pr:Provider {provider_id: $provider_id})
        MERGE (p)-[r:VISITED]->(pr)
        SET r = $props
        RETURN p, pr, r
      `, relParams);

      await tx.commit();
      session.close();

      return {
        patient: relResult.records[0].get('p'),
        provider,
        relationship: relResult.records[0].get('r')
      };
    } catch (error) {
      await tx.rollback();
      session.close();
      logger.error('Failed to create encounter', { error });
      throw error;
    }
  }

  /**
   * Complex query: Find patients with similar treatment pathways
   * Used for clinical trial matching, patient similarity analysis
   */
  async findSimilarPathways(patientId: string, limit: number): Promise<SimilarPatientResult[]> {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH path1 = (p1:Patient)-[:HAS_CONDITION]->(c:Condition)-[:RECOMMENDED_FOR]->(m:Medication)
        MATCH path2 = (p2:Patient)-[:HAS_CONDITION]->(c)-[:RECOMMENDED_FOR]->(m)
        WHERE p1.patient_id = $patient_id AND p1.patient_id <> p2.patient_id
        WITH p2, count(path1) AS similarity_score
        RETURN p2, similarity_score
        ORDER BY similarity_score DESC
        LIMIT $limit
      `, {
        patient_id: patientId,
        limit
      });

      session.close();
      return result.records || [];
    } catch (error) {
      session.close();
      logger.error('Failed to find similar pathways', { error });
      throw error;
    }
  }

  /**
   * Get patient's complete graph data (all relationships)
   * Used for GDPR data portability exports
   */
  async getPatientGraphData(patientId: string): Promise<any> {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (p:Patient {patient_id: $patient_id})
        OPTIONAL (p)-[r1:HAS_CONDITION]->(c:Condition)
        OPTIONAL (p)-[r2:TAKES]->(m:Medication)
        OPTIONAL (p)-[r3:VISITED]->(pr:Provider)
        RETURN p, 
               collect({condition: c, relationship: r1}) AS conditions,
               collect({medication: m, relationship: r2}) AS medications,
               collect({provider: pr, relationship: r3}) AS providers
      `, { patient_id });

      session.close();
      return result.records[0];
    } catch (error) {
      session.close();
      logger.error('Failed to get patient graph data', { error });
      throw error;
    }
  }

  /**
   * Close driver connection (call on app shutdown)
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      logger.info('Neo4j driver closed');
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/neo4j.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/services/neo4j.service.ts test/unit/neo4j.service.test.ts
git commit -m "feat: add Neo4j graph service with patient/condition/medication relationships"
```

---


## Component 4: TypeORM Entities

### Task 4.1: Create Patient Entity

**Files:**
- Create: `api/entities/patient.entity.ts`
- Test: `test/unit/patient.entity.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/patient.entity.test.ts
import { Patient } from '../../api/entities/patient.entity';
import { getRepository, DataSource } from 'typeorm';

describe('Patient Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'test_medical_platform',
      entities: [Patient],
      synchronize: true
    });
    await dataSource.initialize();
  });

  it('should create patient with epic_patient_id and patient_id', async () => {
    const repo = getRepository(Patient);
    const patient = repo.create({
      epic_patient_id: 'EPIC-123456',
      patient_id: 'HM-PAT-001',
      birth_date: new Date('1990-01-01'),
      gender: 'M',
      race: 'White',
      ethnicity: 'Non-Hispanic',
    });
    
    const saved = await repo.save(patient);
    
    expect(saved.id).toBeDefined();
    expect(saved.epic_patient_id).toBe('EPIC-123456');
    expect(saved.patient_id).toBe('HM-PAT-001');
    expect(saved.birth_date.toISOString()).toBe(new Date('1990-01-01').toISOString());
    expect(saved.gender).toBe('M');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/patient.entity.test.ts`
Expected: FAIL with "Cannot find module '../../api/entities/patient.entity'"

**Step 3: Write minimal implementation**

```typescript
// api/entities/patient.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('patients')
@Index(['epic_patient_id'])
@Index(['patient_id'])
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'epic_patient_id', length: 50, unique: true })
  epic_patient_id: string;

  @Column({ name: 'patient_id', length: 50, unique: true })
  patient_id: string;

  @Column({ type: 'date' })
  birth_date: Date;

  @Column({ type: 'char', length: 1, default: 'U' })
  gender: 'M' | 'F' | 'O' | 'U';

  @Column({ type: 'varchar', length: 50, nullable: true })
  race: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ethnicity: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/patient.entity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/entities/patient.entity.ts test/unit/patient.entity.test.ts
git commit -m "feat: add Patient entity with Epic integration fields"
```

---

### Task 4.2: Create Lab Result Entity

**Files:**
- Create: `api/entities/lab-result.entity.ts`
- Test: `test/unit/lab-result.entity.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/lab-result.entity.test.ts
import { LabResult } from '../../api/entities/lab-result.entity';
import { getRepository, DataSource } from 'typeorm';

describe('LabResult Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'test_medical_platform',
      entities: [LabResult, Patient],
      synchronize: true
    });
    await dataSource.initialize();
    // Create test patient
    const patientRepo = getRepository(Patient);
    await patientRepo.save({
      epic_patient_id: 'EPIC-TEST',
      patient_id: 'HM-PAT-TEST',
      birth_date: new Date('1980-01-01'),
      gender: 'M'
    });
  });

  it('should create lab result with LOINC code', async () => {
    const repo = getRepository(LabResult);
    const labResult = repo.create({
      patient_id: 1, // Will be set after save
      epic_observation_id: 'OBS-123456',
      test_code: '2345-7',
      test_name: 'Glucose',
      numeric_value: 105.5,
      unit: 'mg/dL',
      reference_low: 70.0,
      reference_high: 130.0,
      is_abnormal: true,
      collected_at: new Date('2025-01-01T10:00:00Z')
    });
    
    // Set patient_id after we have it
    const patientRepo = getRepository(Patient);
    const patient = await patientRepo.findOne({ where: { id: 1 } });
    if (patient) {
      labResult.patient_id = patient.id;
    }
    
    const saved = await repo.save(labResult);
    
    expect(saved.id).toBeDefined();
    expect(saved.test_code).toBe('2345-7');
    expect(saved.numeric_value).toBe(105.5);
    expect(saved.unit).toBe('mg/dL');
    expect(saved.is_abnormal).toBe(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/lab-result.entity.test.ts`
Expected: FAIL with "Cannot find module '../../api/entities/lab-result.entity'"

**Step 3: Write minimal implementation**

```typescript
// api/entities/lab-result.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('lab_results')
@Index(['patient_id', 'collected_at'], { synchronize: false })
export class LabResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number; // Denormalized for queries

  @Column({ name: 'epic_observation_id', length: 50, unique: true, nullable: true })
  epic_observation_id: string;

  @Column({ name: 'test_code', length: 20 })
  test_code: string;

  @Column({ name: 'test_name', length: 255 })
  test_name: string;

  @Column({ type: 'numeric', precision: 20, scale: 6, nullable: true })
  numeric_value: number;

  @Column({ type: 'text', nullable: true })
  text_value: string;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ type: 'numeric', precision: 20, scale: 6, nullable: true })
  reference_low: number;

  @Column({ type: 'numeric', precision: 20, scale: 6, nullable: true })
  reference_high: number;

  @Column({ type: 'boolean', default: false })
  is_abnormal: boolean;

  @Column({ type: 'timestamp with time zone', nullable: false })
  collected_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Index(['patient_id', 'collected_at'])
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/lab-result.entity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/entities/lab-result.entity.ts test/unit/lab-result.entity.test.ts
git commit -m "feat: add LabResult entity with OMOP alignment"
```

---

### Task 4.3: Create Medication Entity

**Files:**
- Create: `api/entities/medication.entity.ts`
- Test: `test/unit/medication.entity.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/medication.entity.test.ts
import { Medication } from '../../api/entities/medication.entity';
import { getRepository, DataSource } from 'typeorm';

describe('Medication Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'test_medical_platform',
      entities: [Medication, Patient],
      synchronize: true
    });
    await dataSource.initialize();
    const patientRepo = getRepository(Patient);
    await patientRepo.save({
      epic_patient_id: 'EPIC-TEST',
      patient_id: 'HM-PAT-TEST',
      birth_date: new Date('1980-01-01'),
      gender: 'M'
    });
  });

  it('should create medication with RxNorm code', async () => {
    const repo = getRepository(Medication);
    const medication = repo.create({
      patient_id: 1,
      epic_medication_id: 'MED-123456',
      rx_norm_code: '314858',
      medication_name: 'Aspirin',
      generic_name: 'Acetylsalicylic Acid',
      dosage_form: 'tablet',
      strength_value: 81,
      strength_unit: 'mg',
      prescribed_at: new Date('2025-01-01T10:00:00Z'),
      is_active: true
    });
    
    const saved = await repo.save(medication);
    
    expect(saved.id).toBeDefined();
    expect(saved.rx_norm_code).toBe('314858');
    expect(saved.medication_name).toBe('Aspirin');
    expect(saved.is_active).toBe(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/medication.entity.test.ts`
Expected: FAIL with "Cannot find module '../../api/entities/medication.entity'"

**Step 3: Write minimal implementation**

```typescript
// api/entities/medication.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medications')
@Index(['patient_id', 'is_active'])
export class Medication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ name: 'epic_medication_id', length: 50, unique: true, nullable: true })
  epic_medication_id: string;

  @Column({ name: 'rx_norm_code', length: 20 })
  rx_norm_code: string;

  @Column({ name: 'medication_name', length: 255 })
  medication_name: string;

  @Column({ name: 'generic_name', length: 255, nullable: true })
  generic_name: string;

  @Column({ name: 'dosage_form', length: 50, nullable: true })
  dosage_form: string;

  @Column({ type: 'numeric', precision: 15, scale: 3, nullable: true })
  strength_value: number;

  @Column({ length: 20, nullable: true })
  strength_unit: string;

  @Column({ type: 'timestamp with time zone', nullable: false })
  prescribed_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/medication.entity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/entities/medication.entity.ts test/unit/medication.entity.test.ts
git commit -m "feat: add Medication entity with RxNorm standardization"
```

---


## Component 5: API Routes & Controllers

### Task 5.1: Create Epic OAuth Callback Handler

**Files:**
- Create: `api/routes/epic.routes.ts`
- Create: `api/controllers/epic.controller.ts`
- Test: `test/integration/epic-callback.test.ts`

**Step 1: Write failing test**

```typescript
// test/integration/epic-callback.test.ts
import request from 'supertest';
import express, { Response } from 'express';
import epicRoutes from '../../api/routes/epic.routes';
import app from '../../api/server';

describe('Epic OAuth Callback', () => {
  it('should handle OAuth callback with code', async () => {
    const res = await request(app)
      .get('/api/epic/callback?code=auth-code-xyz&state=test-state')
      .expect(302); // Found redirect
    
    expect(res.headers.location).toContain('/dashboard?epic_connected=true');
  });

  it('should handle OAuth callback with error', async () => {
    const res = await request(app)
      .get('/api/epic/callback?error=access_denied&state=test-state')
      .expect(302);
    
    expect(res.headers.location).toContain('/dashboard?error=access_denied');
  });

  it('should exchange code for access token', async () => {
    const res = await request(app)
      .post('/api/epic/exchange-token')
      .send({
        code: 'mock-auth-code',
        codeVerifier: 'mock-verifier',
        state: 'mock-state'
      })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/integration/epic-callback.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// api/controllers/epic.controller.ts
import { Request, Response } from 'express';
import { EpicOAuthService } from '../services/epic-oauth.service';
import logger from '../logger';

export class EpicController {
  private oauthService: EpicOAuthService;

  constructor() {
    this.oauthService = new EpicOAuthService();
  }

  /**
   * Handle Epic OAuth callback from MyChart/EHR launch
   * SMART on FHIR specification
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn('Epic OAuth callback error:', { error, state });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      logger.error('Invalid OAuth callback', { code, state });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=invalid_callback`);
    }

    // Exchange authorization code for access token
    try {
      const tokenResponse = await this.oauthService.exchangeCodeForToken(code, state);
      
      // Store tokens in database (will be implemented in consent service)
      // For now, redirect to success page
      logger.info('Epic OAuth successful', { state });
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?epic_connected=true`);
    } catch (error) {
      logger.error('Failed to exchange Epic OAuth code', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=token_exchange_failed`);
    }
  }

  /**
   * Handle token exchange (manual API endpoint for testing)
   */
  async exchangeToken(req: Request, res: Response): Promise<void> {
    const { code, codeVerifier, state } = req.body;

    if (!code || !codeVerifier) {
      return res.status(400).json({ error: 'Missing code or codeVerifier' });
    }

    try {
      const tokenResponse = await this.oauthService.exchangeCodeForToken(code, codeVerifier);
      
      res.json({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      });
    } catch (error) {
      logger.error('Failed to exchange token', { error: error.message });
      res.status(500).json({ error: 'Token exchange failed' });
    }
  }

  /**
   * Trigger patient data sync
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id; // From JWT auth middleware
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { patientId, syncType } = req.body;

    if (!patientId || !syncType) {
      return res.status(400).json({ error: 'Missing patientId or syncType' });
    }

    try {
      const epicConsentRepo = getRepository(EpicConsent);
      const consent = await epicConsentRepo.findOne({
        where: { patient_id: patientId, status: 'active' }
      });

      if (!consent || !consent.refresh_token_encrypted) {
        return res.status(400).json({ error: 'No active Epic consent found' });
      }

      // Queue sync job
      const job = await epicIngestionQueue.add('sync-patient-data', {
        patientId,
        syncType,
        epicUserId: consent.epic_user_id,
        accessToken: await this.decryptRefreshToken(consent.refresh_token_encrypted)
      }, {
        jobId: `fhir-sync:${patientId}`
      });

      res.status(202).json({
        message: 'Sync job queued',
        jobId: job.id
      });
    } catch (error) {
      logger.error('Failed to trigger sync', { error: error.message });
      res.status(500).json({ error: 'Failed to trigger sync' });
    }
  }

  /**
   * Check sync status
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { patientId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const syncLogRepo = getRepository(EpicSyncLog);
      const syncLogs = await syncLogRepo.find({
        where: { patient_id: patientId },
        order: { sync_started_at: 'DESC' },
        take: 10
      });

      res.json({
        patientId,
        syncHistory: syncLogs.map(log => ({
          syncType: log.sync_type,
          status: log.status,
          recordsSynced: log.records_synced,
          startedAt: log.sync_started_at,
          completedAt: log.sync_completed_at,
          errorMessage: log.error_message
        }))
      });
    } catch (error) {
      logger.error('Failed to get sync status', { error: error.message });
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  }

  /**
   * Revoke Epic consent
   */
  async revokeConsent(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { consentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const epicConsentRepo = getRepository(EpicConsent);
      const consent = await epicConsentRepo.findOne({
        where: { id: parseInt(consentId), patient_id: userId }
      });

      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      // Update status to revoked
      consent.status = 'revoked';
      await epicConsentRepo.save(consent);

      // Log PHI access
      const phiLogRepo = getRepository(PHIAccessLog);
      await phiLogRepo.save({
        patient_id: userId,
        accessed_by_user_id: userId,
        resource_type: 'epic_consent',
        resources_accessed: { consent_id: consentId },
        purpose: 'revocation_request',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        access_time: new Date(),
        session_id: req.sessionID
      });

      logger.info('Epic consent revoked', { consentId });
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to revoke consent', { error: error.message });
      res.status(500).json({ error: 'Failed to revoke consent' });
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/integration/epic-callback.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/routes/epic.routes.ts api/controllers/epic.controller.ts test/integration/epic-callback.test.ts
git commit -m "feat: add Epic OAuth callback handler and sync endpoints"
```

---

## Component 6: Data Transformation & Validation

### Task 6.1: Create Data Quality Service

**Files:**
- Create: `api/services/data-quality.service.ts`
- Test: `test/unit/data-quality.service.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/data-quality.service.test.ts
import { DataQualityService } from '../../api/services/data-quality.service';

describe('DataQualityService', () => {
  it('should detect direct identifiers (PHI)', () => {
    const service = new DataQualityService();
    const testData = {
      name: 'John Doe',
      ssn: '123-45-6789',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      medicalRecordNumber: 'MRN123456'
    };

    const violations = service.detectPHI(testData);
    
    expect(violations).toBeDefined();
    expect(violations.length).toBeGreaterThan(0);
    expect(violations).toContainEqual(expect.arrayContaining('ssn'));
    expect(violations).toContainEqual(expect.arrayContaining('email'));
  });

  it('should validate FHIR date formats', () => {
    const service = new DataQualityService();
    
    expect(service.isValidDate('2025-01-01')).toBe(true);
    expect(service.isValidDate('2025-02-30')).toBe(true);
    expect(service.isValidDate('invalid-date')).toBe(false);
    expect(service.isValidDate('2025-13-01')).toBe(false); // No 13th month
  });

  it('should validate medical codes', () => {
    const service = new DataQualityService();
    
    expect(service.isValidMedicalCode('I10', 'E10.9', 'ICD-10')).toBe(true);
    expect(service.isValidMedicalCode('I10', 'INVALID', 'ICD-10')).toBe(false);
    expect(service.isValidMedicalCode('314858', 'Aspirin', 'RxNorm')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/data-quality.service.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// api/services/data-quality.service.ts
import logger from '../logger';

export interface PHIViolation {
  type: 'direct_identifier' | 'indirect_identifier' | 'sensitive_data';
  field: string;
  value: any;
  severity: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  phiViolations: PHIViolation[];
}

export class DataQualityService {

  /**
   * HIPAA Safe Harbor detection
   * 18 direct identifiers + indirect identifiers (dates, ZIP codes)
   */
  detectPHI(data: any): PHIViolation[] {
    const violations: PHIViolation[] = [];
    
    // Direct identifiers
    const ssnPattern = /\d{3}-\d{2}-\d{4}/;
    if (ssnPattern.test(JSON.stringify(data))) {
      violations.push({
        type: 'direct_identifier',
        field: 'ssn',
        value: this.extractMatch(data, ssnPattern),
        severity: 'high'
      });
    }

    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (emailPattern.test(JSON.stringify(data))) {
      violations.push({
        type: 'direct_identifier',
        field: 'email',
        value: this.extractMatch(data, emailPattern),
        severity: 'high'
      });
    }

    const phonePattern = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/;
    if (phonePattern.test(JSON.stringify(data))) {
      violations.push({
        type: 'direct_identifier',
        field: 'phone',
        value: this.extractMatch(data, phonePattern),
        severity: 'high'
      });
    }

    // Sensitive medical identifiers
    if (data.medicalRecordNumber) {
      violations.push({
        type: 'indirect_identifier',
        field: 'medicalRecordNumber',
        value: data.medicalRecordNumber,
        severity: 'medium'
      });
    }

    return violations;
  }

  /**
   * Validate FHIR date format (ISO 8601)
   */
  isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d{3}Z)?)?$/;
    return isoDateRegex.test(dateString);
  }

  /**
   * Validate clinical coding systems (ICD-10, SNOMED-CT, RxNorm, LOINC)
   */
  isValidMedicalCode(code: string, system: string, version?: string): boolean {
    // Basic validation - more comprehensive validation would call external APIs
    const codePattern = /^[A-Za-z0-9.]+$/;
    
    if (!codePattern.test(code)) {
      return false;
    }

    // System-specific patterns
    switch (system) {
      case 'ICD-10':
        // ICD-10 format: A00-Z99 with optional decimal
        return /^[A-Z]\d{2}(?:\.\d{1})?$/.test(code);
      case 'SNOMED-CT':
        // SNOMED format: 8+ digits (SCTID)
        return /^\d{8}$/.test(code);
      case 'RxNorm':
        // RxNorm format: Typically 6-8 digits
        return /^\d{6,8}$/.test(code);
      case 'LOINC':
        // LOINC format: LLXXX-X (alphanumeric)
        return /^[A-Z]{2}\d{4}-[A-Z0-9]/.test(code);
      default:
        return true;
    }
  }

  /**
   * Validate complete FHIR resource payload
   */
  validateFhirResource(resource: any, resourceType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const phiViolations: PHIViolation[] = [];

    // PHI detection
    const phi = this.detectPHI(resource);
    phiViolations.push(...phi);

    // Date validation
    if (resource.birthDate && !this.isValidDate(resource.birthDate)) {
      errors.push(`Invalid birthDate format: ${resource.birthDate}`);
    }

    // Medical code validation
    if (resource.code) {
      const coding = Array.isArray(resource.code.coding) ? resource.code.coding[0] : resource.code;
      if (!this.isValidMedicalCode(coding.code, coding.system || 'unknown')) {
        errors.push(`Invalid ${coding.system} code: ${coding.code}`);
      }
    }

    return {
      isValid: errors.length === 0 && phiViolations.length === 0,
      errors,
      warnings,
      phiViolations
    };
  }

  private extractMatch(data: any, pattern: RegExp): string {
    const match = pattern.exec(JSON.stringify(data));
    return match ? match[0] : '';
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/data-quality.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/services/data-quality.service.ts test/unit/data-quality.service.test.ts
git commit -m "feat: add data quality service with PHI detection and validation"
```

---


## Component 7: Testing Strategy

### Task 7.1: Create Test Database Helper

**Files:**
- Create: `api/test/helpers/test-database.helper.ts`
- Test: `test/unit/test-database.helper.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/test-database.helper.test.ts
import { TestDatabase } from '../../api/test/helpers/test-database.helper';

describe('TestDatabase', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
  });

  it('should create in-memory PostgreSQL database', async () => {
    const connection = await testDb.getConnection();
    expect(connection).toBeDefined();
    expect(connection.isConnected).toBe(true);
  });

  it('should run migrations', async () => {
    await testDb.initialize();
    await testDb.query('SELECT * FROM migrations ORDER BY version DESC LIMIT 1');
    // Success if no error thrown
  });

  it('should cleanup after all tests', async () => {
    await testDb.cleanup();
    const connection = await testDb.getConnection();
    expect(connection.isConnected).toBe(false);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/test-database.helper.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// api/test/helpers/test-database.helper.ts
import { createConnection, DataSource, DataSourceOptions } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';

export class TestDatabase {
  private dataSource: DataSource;
  private connection: any;
  private dbName: string;

  constructor() {
    this.dbName = `test_${uuidv4().replace(/-/g, '_')}`;
    const options: DataSourceOptions = {
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
      username: process.env.TEST_DB_USER || 'test',
      password: process.env.TEST_DB_PASSWORD || 'test',
      database: this.dbName,
      dropSchema: true,
      synchronize: true
    };

    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();
  }

  async initialize(): Promise<void> {
    await this.dataSource.synchronize();
    logger.info(`Test database initialized: ${this.dbName}`);
  }

  async getConnection(): Promise<any> {
    return await this.dataSource.createEntityManager().connection;
  }

  /**
   * Execute SQL query
   */
  async query(sql: string, params?: any[]): Promise<any> {
    const connection = await this.getConnection();
    const result = await connection.query(sql, params);
    return result;
  }

  /**
   * Get TypeORM repository
   */
  getRepository<T>(entity: any): any {
    return this.dataSource.getRepository(entity);
  }

  /**
   * Cleanup test database
   */
  async cleanup(): Promise<void> {
    await this.dataSource.dropDatabase();
    await this.dataSource.destroy();
    logger.info(`Test database cleaned up: ${this.dbName}`);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/test-database.helper.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/test/helpers/test-database.helper.ts test/unit/test-database.helper.test.ts
git commit -m "test: add in-memory test database helper"
```

---

### Task 7.2: Create Epic FHIR Mock Service

**Files:**
- Create: `api/test/mocks/epic-fhir.mock.ts`
- Test: Uses mock service in integration tests

**Step 1: Write mock implementation**

```typescript
// api/test/mocks/epic-fhir.mock.ts
import { FhirPatient, FhirCondition, FhirObservation, FhirMedicationRequest, FhirBundle } from '../../api/services/epic-fhir.service';

export class EpicFhirMock {
  /**
   * Mock patient resource
   */
  static mockPatient(overrides: Partial<FhirPatient> = {}): FhirPatient {
    return {
      resourceType: 'Patient',
      id: 'patient-123456',
      name: {
        family: 'Test',
        given: ['John']
      },
      birthDate: '1980-01-01',
      gender: 'male',
      identifier: [
        { system: 'urn:oid:1.2.840.113554.1.20.4.3', value: 'MRN-123456' },
        { system: 'https://fhir.epic.com', value: 'EPIC-123456' }
      ]
    };
  }

  /**
   * Mock conditions
   */
  static mockConditions(count: number): FhirCondition[] {
    const conditions: FhirCondition[] = [];
    for (let i = 0; i < count; i++) {
      conditions.push({
        resourceType: 'Condition',
        id: `condition-${i}`,
        code: {
          coding: [{
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: `E11.${i}`,
            display: `Mock Condition ${i}`
          }]
        },
        clinicalStatus: { coding: [{ code: 'active' }] },
        onsetDateTime: '2020-01-01T00:00:00Z',
        verificationStatus: { coding: [{ code: 'confirmed' }] }
      });
    }
    return conditions;
  }

  /**
   * Mock observations (lab results, vitals)
   */
  static mockObservations(count: number): FhirObservation[] {
    const observations: FhirObservation[] = [];
    for (let i = 0; i < count; i++) {
      const isLab = i % 2 === 0; // Every other one is lab result
      observations.push({
        resourceType: 'Observation',
        id: `observation-${i}`,
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: isLab ? `2345-${i}` : `8480-${i}`,
            display: isLab ? `Lab Test ${i}` : `Vital Test ${i}`
          }]
        },
        valueQuantity: {
          value: 100 + i * 0.5,
          unit: 'mg/dL' if isLab else 'bpm'
        },
        effectiveDateTime: '2025-01-01T10:00:00Z',
        referenceRange: [
          { low: { value: 90 }, high: { value: 110 } } // Only for lab results
        ],
        category: isLab ? [{
          coding: [{ code: 'laboratory', display: 'Laboratory' }]
        }] : [{
          coding: [{ code: 'vital-signs', display: 'Vital Signs' }]
        }]
      });
    }
    return observations;
  }

  /**
   * Mock medications
   */
  static mockMedications(count: number): FhirMedicationRequest[] {
    const medications: FhirMedicationRequest[] = [];
    for (let i = 0; i < count; i++) {
      medications.push({
        resourceType: 'MedicationRequest',
        id: `medication-${i}`,
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: `314${i}`,
            display: `Mock Medication ${i}`
          }]
        },
        dosageInstruction: { text: `Take 1 tablet daily` },
        authoredOn: `2025-01-01T09:00:00Z`,
        status: 'active'
      });
    }
    return medications;
  }

  /**
   * Mock FHIR bundle response
   */
  static mockBundle<T>(resources: T[], total?: number): FhirBundle<T> {
    return {
      resourceType: 'Bundle',
      entry: resources.map((r, i) => ({
        resource: r,
        fullUrl: `${process.env.EPIC_SANDBOX_FHIR_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'}/${r.resourceType}/${r.id}`
      })),
      total: total || resources.length,
      link: [
        {
          relation: 'self',
          url: `${process.env.EPIC_SANDBOX_FHIR_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'}`
        },
        {
          relation: 'next',
          url: `${process.env.EPIC_SANDBOX_FHIR_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'}?_count=50&_getpages=yes`
        }
      ]
    };
  }
}
```

**Step 2: Commit**

```bash
git add api/test/mocks/epic-fhir.mock.ts
git commit -m "test: add Epic FHIR mock service"
```

---

### Task 7.3: Create Integration Test Suite

**Files:**
- Create: `test/integration/epic-sync.e2e.test.ts`

**Step 1: Write E2E test**

```typescript
// test/integration/epic-sync.e2e.test.ts
import request from 'supertest';
import express, { Response } from 'express';
import app from '../../api/server';
import { TestDatabase } from '../helpers/test-database.helper';
import { epicIngestionQueue } from '../../api/queue-config';

describe('Epic Sync Integration Tests', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
  });

  describe('Epic OAuth Flow', () => {
    it('should redirect to Epic authorize URL', async () => {
      const res = await request(app)
        .get('/api/epic/authorize')
        .expect(302); // Redirect
      
      expect(res.headers.location).toContain('fhir.epic.com/oauth2/authorize');
      expect(res.headers.location).toContain('response_type=code');
      expect(res.headers.location).toContain('client_id=');
    });

    it('should handle Epic callback with code exchange', async () => {
      const res = await request(app)
        .post('/api/epic/exchange-token')
        .send({
          code: 'mock-auth-code',
          codeVerifier: 'mock-verifier',
          state: 'test-state'
        })
        .expect(200);
      
      const tokens = res.body;
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.expires_in).toBe(3600);
    });
  });

  describe('Patient Data Sync', () => {
    it('should queue initial sync job', async () => {
      const res = await request(app)
        .post('/api/epic/sync')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          patientId: 'test-patient-1',
          syncType: 'initial'
        })
        .expect(202);
      
      const job = res.body;
      expect(job.jobId).toBeDefined();
      expect(job.jobId).toBe('fhir-sync:test-patient-1');
    });

    it('should sync patient data to database', async () => {
      // This would run the worker in real scenario
      // For integration test, we mock worker behavior
      
      const patient = await testDb.query(
        'SELECT * FROM patients WHERE patient_id = $1',
        ['test-patient-1']
      );
      
      expect(patient).toBeDefined();
      expect(patient.epic_patient_id).toBe('epic-user-1');
    });

    it('should sync lab results to database', async () => {
      const labResults = await testDb.query(
        'SELECT * FROM lab_results WHERE patient_id = (SELECT id FROM patients WHERE patient_id = $1)',
        ['test-patient-1']
      );
      
      expect(labResults).toBeDefined();
      expect(Array.isArray(labResults)).toBe(true);
    });
  });

  describe('Consent Management', () => {
    it('should store Epic consent in database', async () => {
      const res = await request(app)
        .post('/api/epic/consent')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          epicUserId: 'epic-user-1',
          consentType: 'HIPAA',
          scopes: ['patient/*.rs']
        })
        .expect(201);
      
      const consent = await testDb.query(
        'SELECT * FROM epic_consents WHERE epic_user_id = $1',
        ['epic-user-1']
      );
      
      expect(consent).toBeDefined();
      expect(consent.consent_type).toBe('HIPAA');
      expect(consent.status).toBe('active');
    });

    it('should revoke Epic consent', async () => {
      const res = await request(app)
        .delete('/api/epic/consent/1')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(204);
      
      const consent = await testDb.query(
        'SELECT * FROM epic_consents WHERE id = $1',
        [1]
      );
      
      expect(consent).toBeDefined();
      expect(consent.status).toBe('revoked');
    });
  });

  afterAll(async () => {
    await testDb.cleanup();
  });
});
```

**Step 2: Commit**

```bash
git add test/integration/epic-sync.e2e.test.ts
git commit -m "test: add Epic sync integration E2E tests"
```

---

## Component 8: Security & Compliance Validation

### Task 8.1: Create Compliance Service

**Files:**
- Create: `api/services/compliance.service.ts`
- Test: `test/unit/compliance.service.test.ts`

**Step 1: Write failing test**

```typescript
// test/unit/compliance.service.test.ts
import { ComplianceService } from '../../api/services/compliance.service';

describe('ComplianceService', () => {
  it('should validate HIPAA minimum necessary access', async () => {
    const service = new ComplianceService();
    const result = await service.validateAccess({
      patientId: 'patient-1',
      userId: 'user-1',
      requestedFields: ['name', 'birth_date', 'gender'], // Minimum necessary
      purpose: 'research_study_123'
    });

    expect(result.granted).toBe(true);
    expect(result.grantedFields).toEqual(['name', 'birth_date', 'gender']);
    expect(result.warnings).toEqual([]);
  });

  it('should deny excessive PHI access', async () => {
    const service = new ComplianceService();
    const result = await service.validateAccess({
      patientId: 'patient-1',
      userId: 'user-1',
      requestedFields: ['ssn', 'email', 'phone'], // More than minimum necessary
      purpose: 'research_study_123'
    });

    expect(result.granted).toBe(false);
    expect(result.deniedReason).toContain('exceeds minimum necessary');
  });

  it('should verify GDPR consent expiration', async () => {
    const service = new ComplianceService();
    const result = await service.checkGDPRConsent('patient-1', 'research');

    expect(result.isValid).toBe(true);
    expect(result.consentExists).toBe(true);
    expect(result.expired).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/unit/compliance.service.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// api/services/compliance.service.ts
import { getConnection } from 'typeorm';
import logger from '../logger';
import { PHIAccessLog } from '../entities/phi-access-log.entity';
import { EpicConsent } from '../entities/epic-consent.entity';
import { DataRetentionAudit } from '../entities/data-retention-audit.entity';

export interface AccessRequest {
  patientId: string;
  userId: number;
  requestedFields: string[];
  purpose: string;
}

export interface AccessGrantResult {
  granted: boolean;
  grantedFields?: string[];
  deninedReason?: string;
  warnings: string[];
}

export interface GDPRConsentCheck {
  isValid: boolean;
  consentExists: boolean;
  expired: boolean;
  daysUntilExpiry?: number;
}

export class ComplianceService {

  /**
   * Validate PHI access request against HIPAA minimum necessary principle
   * Only request fields that are essential for the stated purpose
   */
  async validateAccess(request: AccessRequest): Promise<AccessGrantResult> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch patient to get consent scope
      const patientRepo = queryRunner.manager.getRepository('patients');
      const patient = await patientRepo.findOne({ where: { patient_id: request.patientId } });

      if (!patient) {
        return {
          granted: false,
          deninedReason: 'Patient not found'
        };
      }

      // Fetch active consent
      const consentRepo = queryRunner.manager.getRepository(EpicConsent);
      const consent = await consentRepo.findOne({
        where: { patient_id: patient.id, status: 'active' }
      });

      if (!consent) {
        return {
          granted: false,
          deninedReason: 'No active consent found'
        };
      }

      const consentScope = consent.scope_requested as string[]; // Array of granted FHIR scopes

      // Check if requested fields are within consent scope
      const fieldMapping: Record<string, string[]> = {
        'name': ['patient/Patient.name'],
        'birth_date': ['patient/Patient.birthDate'],
        'gender': ['patient/Patient.gender'],
        'lab_results': ['patient/Observation.rs', 'patient/DiagnosticReport.rs'],
        'medications': ['patient/MedicationRequest.rs'],
        'vitals': ['patient/Observation.rs']
      };

      const grantedFields: string[] = [];
      const warnings: string[] = [];

      for (const field of request.requestedFields) {
        const allowedScopes = fieldMapping[field] || [];
        
        if (allowedScopes.some(scope => consentScope.includes(scope))) {
          grantedFields.push(field);
        } else {
          warnings.push(`Field '${field}' not in consent scope`);
        }
      }

      // Log PHI access
      const phiLogRepo = queryRunner.manager.getRepository(PHIAccessLog);
      await phiLogRepo.save({
        patient_id: patient.id,
        accessed_by_user_id: request.userId,
        resource_type: request.requestedFields.join(','),
        resources_accessed: { fields: request.requestedFields },
        purpose: request.purpose,
        ip_address: '', // Will be filled by middleware
        user_agent: '', // Will be filled by middleware
        access_time: new Date(),
        session_id: '' // Will be filled by middleware
      });

      await queryRunner.commitTransaction();

      return {
        granted: grantedFields.length > 0,
        grantedFields,
        warnings
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Compliance validation error', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check GDPR consent status
   * Verify consent exists and not expired
   */
  async checkGDPRConsent(patientId: string, purpose: string): Promise<GDPRConsentCheck> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();

    try {
      const consentRepo = queryRunner.manager.getRepository(EpicConsent);
      const consent = await consentRepo.findOne({
        where: { patient_id: patientId, status: 'active' }
      });

      if (!consent) {
        return {
          isValid: false,
          consentExists: false,
          expired: false
        };
      }

      // Check expiration
      const isExpired = new Date(consent.expires_at) < new Date();
      const daysUntilExpiry = isExpired ? 0 : Math.ceil(
        (new Date(consent.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        isValid: !isExpired,
        consentExists: true,
        expired: isExpired,
        daysUntilExpiry
      };

    } catch (error) {
      logger.error('GDPR consent check error', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Enforce data retention policy
   * Automatically expire/delete records based on HIPAA/GDPR requirements
   */
  async enforceDataRetention(): Promise<{ processed: number; expired: number; deleted: number }> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const retentionAuditRepo = queryRunner.manager.getRepository(DataRetentionAudit);
      
      // Find records that have expired
      const expiredRecords = await queryRunner.query(`
        SELECT * FROM data_retention_audit 
        WHERE expires_at <= NOW() 
          AND action_performed_at IS NULL 
        LIMIT 1000
      `);

      let processed = 0;
      let expired = 0;
      let deleted = 0;

      for (const record of expiredRecords) {
        const action = record.action_required;

        if (action === 'DELETE') {
          // Delete from all tables
          await queryRunner.query(
            `DELETE FROM ${record.record_type} WHERE id = $1`,
            [record.record_id]
          );
          deleted++;
        } else if (action === 'ANONYMIZE') {
          // De-identify data (Safe Harbor)
          await this.anonymizeRecord(queryRunner, record);
          deleted++;
        } else if (action === 'ARCHIVE') {
          // Move to archive tables
          await this.archiveRecord(queryRunner, record);
          expired++;
        }

        // Update audit record
        await retentionAuditRepo.update(record.id, {
          action_performed_at: new Date()
        });

        processed++;
      }

      await queryRunner.commitTransaction();

      return { processed, expired, deleted };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error('Data retention enforcement error', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Anonymize record using Safe Harbor de-identification
   */
  private async anonymizeRecord(queryRunner: any, record: any): Promise<void> {
    const sql = `
      UPDATE ${record.record_type} SET 
        ${this.getAnonymizeColumns(record.record_type)}
      WHERE id = $1
    `;

    await queryRunner.query(sql, [record.record_id]);
  }

  /**
   * Get columns to anonymize based on record type
   */
  private getAnonymizeColumns(recordType: string): string {
    const anonymizationMap: Record<string, string> = {
      'patients': 'name = NULL, race = NULL, ethnicity = NULL',
      'lab_results': 'text_value = NULL',
      'medications': 'generic_name = NULL'
    };

    return anonymizationMap[recordType] || '';
  }

  /**
   * Archive record
   */
  private async archiveRecord(queryRunner: any, record: any): Promise<void> {
    const archiveTable = `${record.record_type}_archive`;
    
    await queryRunner.query(`
      INSERT INTO ${archiveTable} 
      SELECT * FROM ${record.record_type} WHERE id = $1
    `, [record.record_id]);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/unit/compliance.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add api/services/compliance.service.ts test/unit/compliance.service.test.ts
git commit -m "feat: add compliance service with HIPAA/GDPR validation"
```

---


## Component 9: Deployment & Operations

### Task 9.1: Create Docker Compose Configuration

**Files:**
- Create: `docker-compose.epic.yml`
- Test: Uses existing API tests

**Step 1: Add Neo4j service to docker-compose**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: health-mesh-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-medical}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-medical}
      POSTGRES_DB: medical_platform
      POSTGRES_PORT: 5432
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d medical"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - medical-network

  # Neo4j AuraDB (managed service - no docker image needed)
  # Connection is handled via environment variable in api/config/neo4j.config.ts

  # Redis for BullMQ queues
  redis:
    image: redis:7
    container_name: health-mesh-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - medical-network

  # API Server
  api:
    build: .
    container_name: health-mesh-api
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://medical:password@postgres:5432/medical_platform
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - EPIC_SANDBOX_FHIR_URL
      - EPIC_SANDBOX_CLIENT_ID
      - EPIC_PRODUCTION_FHIR_URL
      - EPIC_PRODUCTION_CLIENT_ID
      - NEO4J_AURA_URI
      - NEO4J_AURA_USERNAME
      - NEO4J_AURA_PASSWORD
      - S3_BUCKET_NAME
      - AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY
      - AWS_REGION
    depends_on:
      - postgres
      - redis
    volumes:
      - ./api:/app
      - ./logs:/app/logs
    networks:
      - medical-network

  # BullMQ Workers (Epic FHIR sync workers)
  epic-fhir-worker:
    build: .
    container_name: health-mesh-epic-worker
    command: npm run worker:epic-fhir
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://medical:password@postgres:5432/medical_platform
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - EPIC_SANDBOX_FHIR_URL
      - EPIC_SANDBOX_CLIENT_ID
      - NEO4J_AURA_URI
      - NEO4J_AURA_USERNAME
      - NEO4J_AURA_PASSWORD
    depends_on:
      - postgres
      - redis
    networks:
      - medical-network

volumes:
  postgres_data:
  redis_data:

networks:
  medical-network:
```

**Step 2: Commit**

```bash
git add docker-compose.epic.yml
git commit -m "feat: add docker compose with Neo4j and all services"
```

---

### Task 9.2: Create Environment Configuration Template

**Files:**
- Create: `.env.epic.example`
- Test: Verify environment variables load correctly

**Step 1: Create .env.example**

```bash
# Epic FHIR Integration Environment Variables

# Application
NODE_ENV=sandbox|production
PORT=4000
LOG_LEVEL=info

# Database (PostgreSQL)
POSTGRES_USER=medical
POSTGRES_PASSWORD=medical
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=medical_platform

# Redis (BullMQ Queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Epic FHIR API (Sandbox)
EPIC_SANDBOX_FHIR_URL=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
EPIC_SANDBOX_CLIENT_ID=your-sandbox-client-id
EPIC_SANDBOX_CLIENT_SECRET=your-sandbox-client-secret
EPIC_SANDBOX_REDIRECT_URI=http://localhost:4000/api/epic/callback
EPIC_SANDBOX_TOKEN_ENDPOINT=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
EPIC_SANDBOX_AUTHORIZE_ENDPOINT=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize

# Epic FHIR API (Production)
EPIC_PRODUCTION_FHIR_URL=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
EPIC_PRODUCTION_CLIENT_ID=your-production-client-id
EPIC_PRODUCTION_CLIENT_SECRET=your-production-client-secret
EPIC_PRODUCTION_REDIRECT_URI=https://app.health-mesh.com/api/epic/callback
EPIC_PRODUCTION_TOKEN_ENDPOINT=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
EPIC_PRODUCTION_AUTHORIZE_ENDPOINT=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize

# Neo4j AuraDB
NEO4J_AURA_URI=neo4j+s://instance-id.databases.neo4j.io
NEO4J_AURA_USERNAME=neo4j
NEO4J_AURA_PASSWORD=your-aura-password
NEO4J_DATABASE=neo4j

# AWS S3 (File Storage)
S3_BUCKET_NAME=health-mesh-medical-records
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret-key...
AWS_REGION=us-east-1

# JWT (API Authentication)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=3600

# Frontend URL (for OAuth callbacks)
FRONTEND_URL=http://localhost:3000

# Compliance
DATA_RETENTION_YEARS_ADULTS=7
DATA_RETENTION_YEARS_MINORS=21
PHI_DETECTION_ENABLED=true
GDPR_CONSENT_EXPIRY_DAYS=90
```

**Step 2: Commit**

```bash
git add .env.epic.example
git commit -m "feat: add Epic FHIR environment configuration template"
```

---

### Task 9.3: Create Health Check Endpoint

**Files:**
- Create: `api/routes/health-epic.routes.ts`
- Test: `test/integration/health-epic.test.ts`

**Step 1: Create health check endpoint**

```typescript
// api/routes/health-epic.routes.ts
import { Router, Request, Response } from 'express';
import { getConnection } from 'typeorm';
import { epicIngestionQueue } from '../queue-config';
import { Neo4jGraphService } from '../services/neo4j.service';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbConnection = await getConnection();
    const dbHealthy = dbConnection.isConnected;

    // Check Redis connection
    const redisHealth = await epicIngestionQueue.isHealth();
    
    // Check Neo4j connection
    const neo4jService = new Neo4jGraphService();
    const neo4jHealthy = await neo4jService.ping();

    const isHealthy = dbHealthy && redisHealth && neo4jHealthy;

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealth ? 'up' : 'down',
        neo4j: neo4jHealthy ? 'up' : 'down'
      }
    };

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

**Step 2: Commit**

```bash
git add api/routes/health-epic.routes.ts
git commit -m "feat: add comprehensive health check endpoint"
```

---


## Plan Summary & Execution Guide

### Project Overview

**Plan Name:** Epic FHIR Integration + Neo4j AuraDB Hybrid Architecture
**Plan File:** `.sisyphus/plans/2026-01-17-epic-fhir-neo4j-integration.md`
**Plan Version:** 1.0
**Created:** January 17, 2026
**Status:** ✅ COMPLETE

---

### Implementation Summary

| Component | Tasks | Estimated Time | Dependencies |
|-----------|--------|---------------|--------------|
| Epic FHIR OAuth & Service | 5 tasks | 2 weeks |
| BullMQ Queue & Workers | 2 tasks | 1 week |
| Neo4j AuraDB Integration | 3 tasks | 1.5 weeks |
| TypeORM Entities (9 tables) | 9 tasks | 2 weeks |
| API Routes & Controllers | 3 tasks | 1 week |
| Data Transformation & Validation | 2 tasks | 1.5 weeks |
| Testing Strategy | 3 tasks | 1.5 weeks |
| Security & Compliance | 1 task | 1 week |
| Deployment & Operations | 3 tasks | 0.5 weeks |
| **TOTAL** | **29 tasks** | **16 weeks** (4 months) |

---

### Cost Estimates

| Category | Item | Estimated Cost (Year 1) | Notes |
|----------|------|------------------------|-------|
| **Infrastructure** | | | |
| Neo4j AuraDB (Professional tier) | $45/month | 1M nodes, 1B relationships, managed service |
| PostgreSQL (AWS RDS r6.2xlarge) | $294/month | Production-ready, managed DB |
| AWS S3 Storage | $23/TB + $0.023/GB requests | Medical records storage |
| Redis (ElastiCache) | $19/month | Queue management |
| CloudFront/ALB | $20/month + $0.02/GB | API endpoint |
| **Development** | | | |
| Engineering (3 FTE @ $150/hour) | $46,800/month | 2 developers @ 75% FTE for 4 months |
| QA Engineer (1 FTE @ $130/hour) | $20,800/month | Testing and quality assurance |
| DevOps Engineer (0.5 FTE @ $150/hour) | $31,200/month | Deployment, monitoring, operations |
| **Development Infrastructure** | | | |
| GitHub Codespaces | $0 | Open source for public code |
| CI/CD (GitHub Actions) | $0 | Native GitHub Actions |
| **Running Costs (Annualized)** | | | |
| Infrastructure (Cloud) | $421/month | $5,052/year |
| Development | $98,800/month | $1,185,600/year |
| **TOTAL YEAR 1** | **$1,607,600** | ~$134k/month |

---

### Timeline Breakdown

#### **Phase 1: Epic Sandbox Integration (Weeks 1-4)**
| Week | Focus | Tasks |
|-------|--------|--------|
| Week 1 | Epic FHIR configuration and OAuth service | OAuth config, PKCE implementation |
| Week 2 | Epic FHIR client service | FHIR R4 resource fetching (Patient, Conditions, Observations, Medications, Encounters) |
| Week 3 | BullMQ queue and workers | Queue setup, deduplication, sync worker with initial/incremental support |
| Week 4 | Neo4j configuration and graph service | AuraDB connection, patient/condition/medication nodes and relationships |
| Week 4-5 | TypeORM entities | Patient, LabResult, Medication entity creation with tests |
| Week 5-6 | PostgreSQL migrations and schema creation | Migration files, database initialization |
| Week 6 | API routes and controllers | Epic OAuth callback, sync triggers, consent management endpoints |
| Week 6-7 | Data transformation service | PHI detection, FHIR to OMOP CDM mapping, validation logic |

#### **Phase 2: Patient-Driven MVP (Weeks 5-10)**
| Week | Focus | Tasks |
|-------|--------|--------|
| Week 5 | Frontend patient consent UI | React/Next.js consent form, scope selection, MyChart integration |
| Week 6 | Standalone OAuth flow implementation | PKCE with code verifier/challenge generation |
| Week 7 | Incremental sync logic | Delta tracking, change detection, smart re-sync |
| Week 8 | Consent management UI | View/manage/revoke consents, data scope visualization |
| Week 9 | Data quality monitoring dashboard | Sync status, error tracking, data validation metrics |
| Week 10 | MVP testing and hardening | E2E tests, penetration testing, load testing |

#### **Phase 3: Enterprise Production (Weeks 11-16)**
| Week | Focus | Tasks |
|-------|--------|--------|
| Week 11 | Production Epic client credentials | OAuth 2.0 client credentials, JWT assertion signing |
| Week 12 | Bulk data export system | Large-scale historical data export, job queueing |
| Week 13 | Researcher portal | Study browsing, data access requests, payment processing |
| Week 14 | Advanced compliance monitoring | Real-time PHI access monitoring, automated violation detection |
| Week 15 | Clinical trial matching | Graph-based patient similarity, eligibility checking |
| Week 16 | Federated learning infrastructure | FL framework, secure model training without PHI movement |

---

### Dependencies & Prerequisites

| Dependency | Version | Required By | Notes |
|-----------|--------|--------------|-------|
| Node.js | 18+ | All services | Server runtime |
| PostgreSQL | 15+ | Database | OMOP CDM support |
| Redis | 7+ | Queue management | BullMQ requirement |
| Neo4j AuraDB | 5+ | Graph database | Managed service (Neo4j driver 5.x+) |
| TypeScript | 5+ | Development language | Strict mode enabled |
| TypeORM | 0.3+ | ORM | Postgres entities and migrations |
| Docker | 20.10+ | Containerization | Docker Compose v3.8 |
| Docker Compose | 2.24+ | Multi-container | Required for local dev |
| npm | 9+ | Package manager | Package management |
| Jest | 29+ | Testing framework | Unit and E2E testing |
| Supertest | 6+ | HTTP testing | Integration test framework |

---

### Risk Mitigation Strategies

| Risk | Mitigation Strategy | Owner |
|------|------------------|-------|
| **Epic API Rate Limiting** | Implement exponential backoff, request queuing, cache FHIR metadata | Backend Team |
| **PHI Exposure** | Comprehensive de-identification (Safe Harbor + Expert Determination), field-level encryption, access logging | Compliance Team |
| **Data Loss** | ACID transactions, database backups, write-ahead logging, queue durability | DevOps Team |
| **Token Theft** | Short-lived access tokens (1 hour), secure refresh token storage, encryption at rest | Security Team |
| **Compliance Violations** | Automated compliance checks, real-time PHI access monitoring, audit trail analysis | Compliance Team |
| **Neo4j Performance Issues** | Connection pooling, query optimization, batch operations, index strategy | Backend Team |
| **Queue Processing Failures** | Dead letter queues, job retry with exponential backoff, error alerting | DevOps Team |
| **Security Breaches** | Multi-layer security (TLS 1.3+, encrypted storage, MFA for admin access), penetration testing | Security Team |
| **Regulatory Non-Compliance** | Quarterly compliance audits, legal review of consent language, GDPR right-to-erasure implementation | Compliance Team |

---

### Execution Handoff

**This plan is now complete and ready for implementation.**

#### Two Execution Options:

**Option 1: Subagent-Driven Implementation (This Session)**
- ✅ Stay in this session
- ✅ I dispatch fresh subagent for each task
- ✅ Review progress between tasks
- ✅ Fast iteration with code review
- ⚠️ Slower than parallel execution

**Option 2: Parallel Session (Separate)**  
- ✅ Open new session with executing-plans skill
- ✅ Batch process multiple tasks concurrently
- ✅ Faster overall execution
- ⚠️ Requires session management

**RECOMMENDED FOR THIS PLAN: Option 2 (Parallel Session)**
- 29 tasks across 16 weeks = substantial complexity
- Parallel execution with checkpoints will be 2-3x faster
- Risk detection and quality checks benefit from independent agents

---

### How to Execute This Plan

#### **Step 1: Review the Complete Plan**

```bash
# View the comprehensive plan
cat .sisyphus/plans/2026-01-17-epic-fhir-neo4j-integration.md

# Plan file length check
wc -l .sisyphus/plans/2026-01-17-epic-fhir-neo4j-integration.md
```

**Expected Output:** ~3,500 lines of detailed implementation tasks

#### **Step 2: Choose Execution Approach**

**Choose one:**

A. **Subagent-Driven (This Session)** - Recommended for initial development
   ```bash
   # Start subagent-driven implementation
   /start-work
   ```

B. **Parallel Session with executing-plans** - Recommended for this plan
   ```bash
   # Open new session with batch execution
   /start-work --parallel-session
   ```

C. **Manual Implementation** - Only if you prefer to implement task-by-task manually yourself

#### **Step 3: Begin Implementation**

Once you've chosen your execution approach and reviewed the plan:

**For Option A (Subagent-Driven):**
Just say: "Start implementation" and I'll dispatch subagents for each task systematically.

**For Option B (Parallel Session):**
Just say: "Start parallel implementation" and I'll use executing-plans skill with checkpoint-based batch processing.

---

### Appendix: Technical References

#### **Epic FHIR Documentation**
- Official Epic on FHIR Developer Portal: https://fhir.epic.com
- SMART on FHIR Specification: https://hl7.org/fhir/smart-app-launch/
- Epic FHIR R4 Specifications: https://fhir.epic.com/Specifications
- OAuth 2.0 with PKCE Guide: https://datatracker.org/oauth-2-0-pkce
- Open-source examples: https://github.com/search?q=epic+fhir+examples

#### **Neo4j Documentation**
- AuraDB Documentation: https://neo4j.com/docs/aura-managed/
- Neo4j Driver: https://neo4j.com/docs/neo4j-client-js/current/
- Healthcare Use Cases: https://neo4j.com/developer/industry-use-cases/life-sciences/medical-care/
- Cypher Query Language: https://neo4j.com/docs/cypher-manual/current/
- Graph Database Performance: https://neo4j.com/blog/healthcare-graph-benchmark/

#### **Healthcare Data Standards**
- OMOP CDM: https://www.ohdsi.org/initiatives/omop-cdm/
- FHIR R4: https://hl7.org/fhir/
- HL7 Standards: https://www.hl7.org/
- LOINC Database: https://loinc.org/
- SNOMED CT: https://confluence.ihtsdotools.org/display/SNOMED
- RxNorm: https://www.nlm.nih.gov/research/umls/rxnorm/

#### **Compliance & Security**
- HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/special-topics/security/
- GDPR Implementation Guidelines: https://gdpr.eu/
- NIST HIPAA Security Framework: https://www.nist.gov/privacy-framework
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

### Quick Reference

**Key Files to Modify in Existing Codebase:**
- `api/queue-config.ts` - Add Epic ingestion queue
- `api/server.ts` - Add Epic routes and health check
- `api/entities/index.ts` - Export new entities
- `docker-compose.yml` - Extend with Epic services
- `.env` - Add Epic configuration variables

**New Files to Create (179 files):**
All detailed in plan document at `/docs/plans/2026-01-17-epic-fhir-neo4j-integration.md`

---

**Plan Version:** 1.0  
**Last Updated:** January 17, 2026  
**Status:** ✅ READY FOR IMPLEMENTATION  
**Total Lines:** ~3,500  
**Total Tasks:** 29 bite-sized tasks  
**Total Estimated Effort:** 16 weeks (4 months)  
**Estimated Cost Year 1:** $1,607,600 (~$134k/month)

---

**READY FOR EXECUTION!**

EOFPLAN

## Appendix: State Machine Diagrams

### State Machine Visualization Notes
- All diagrams use Mermaid syntax for GitHub rendering
- Each diagram shows states, transitions, and actions
- States are represented as `[State]`
- Transitions are labeled with triggers
- Terminate states shown as `[*]`

---

## Appendix 1: Epic FHIR OAuth 2.0 State Machine

### OAuth Flow: Standalone Launch with PKCE

```mermaid
stateDiagram-v2
    [*] --> StandaloneStart: Patient initiates app
    
    StandaloneStart --> GeneratePKCE: Generate code verifier and challenge
    
    GeneratePKCE --> BuildAuthorizeUrl: Create OAuth URL with PKCE parameters
    
    BuildAuthorizeUrl --> RedirectUser: Redirect to Epic authorize endpoint
    
    RedirectUser --> UserAuthorizes: Patient approves consent in Epic
    
    UserAuthorizes --> ReceiveAuthCode: Receive authorization code in callback
    
    ReceiveAuthCode --> ValidateCode: Verify code and state parameter
    
    ValidateCode --> ExchangeForToken: Exchange code for access token
    
    ExchangeForToken --> GetResources: Obtain access token
    
    GetResources --> [*]: OAuth flow complete, ready for data access
    
    note right of ExchangeForToken: InvalidToken: Token exchange failed
    
    InvalidToken --> [*]: OAuth error, requires retry
    
    note right of UserAuthorizes: UserDenies: Patient denies consent
    
    UserDenies --> [*]: Consent denied, access not granted
```

### State Descriptions

| State | Description | Entry Action | Exit Actions |
|--------|-------------|-------------|--------------|
| **StandbyStart** | Initial state, waiting for patient to initiate | None | Generate PKCE |
| **GeneratePKCE** | Creating cryptographically secure PKCE pair | crypto.randomBytes(128) | Store verifier, create SHA-256 challenge |
| **BuildAuthorizeUrl** | Constructing Epic OAuth authorize URL | Append codeChallenge, state | Epic authorize endpoint |
| **RedirectUser** | Redirecting patient's browser to Epic | Epic OAuth flow | User authorizes in Epic |
| **UserAuthorizes** | Patient clicked "Allow Access" | Epic callback | Receive code |
| **ReceiveAuthCode** | Epic callback with authorization code | Validate code | Validate state, verify code format |
| **ValidateCode** | Verifying code and state integrity | Validate code | Exchange for token or retry |
| **ExchangeForToken** | POST to Epic token endpoint with authorization code | Exchange | Validate response or extract tokens |
| **GetResources** | Valid access tokens received | Store tokens | Return success, enable data sync |
| **InvalidToken** | Token exchange failed (401, 403, etc.) | None | Log error, redirect to retry flow |
| **[*]** | Terminal states - success or failure | Return success/failure | OAuth flow complete |

### Error States and Recovery

| Error Type | State Transition | Recovery Action |
|-----------|------------------|----------------|
| **NetworkError** | ExchangeForToken → InvalidToken | Retry with exponential backoff, max 3 attempts |
| **ServerError** | ExchangeForToken → InvalidToken | Log error, notify user, retry later |
| **UserDenied** | UserAuthorizes → [*] | Inform user of denied access, offer retry |
| **InvalidState** | ReceiveAuthCode → InvalidToken | Reject invalid state parameter, log security incident |

---

## Appendix 2: Data Synchronization Pipeline State Machine

### Initial Patient Sync (First-time data pull)

```mermaid
stateDiagram-v2
    [*] --> SyncRequested: Patient or system triggers initial sync
    
    SyncRequested --> ValidateConsent: Check for active Epic consent
    
    ValidateConsent --> FetchFhirPatient: Consent valid, fetch patient demographics
    
    FetchFhirPatient --> TransformFhirPatient: Map FHIR to OMOP format
    
    TransformFhirPatient --> CreatePatientRecord: Create patient in PostgreSQL
    
    CreatePatientRecord --> CreatePatientGraph: Create patient node in Neo4j
    
    CreatePatientGraph --> FetchFhirConditions: Fetch patient conditions from Epic
    
    FetchFhirConditions --> TransformConditions: Map to standardized SNOMED codes
    
    TransformConditions --> CreateConditionNodes: Create condition nodes in Neo4j
    
    CreateConditionNodes --> LinkConditionsToPatient: Create patient→condition relationships
    
    LinkConditionsToPatient --> FetchFhirObservations: Fetch observations (labs, vitals)
    
    note left of FetchFhirObservations: FetchError: Epic API error
    
    FetchError --> LogSyncFailure: Record sync failure in database
    
    LogSyncFailure --> QueueRetry: Queue job for retry with backoff
    
    QueueRetry --> [*]: Retry with exponential backoff
    
    LinkConditionsToPatient --> FetchFhirMedications: Fetch medications from Epic
    
    FetchFhirMedications --> TransformMedications: Map to RxNorm
    
    TransformMedications --> CreateMedicationNodes: Create medication nodes
    
    CreateMedicationNodes --> LinkMedicationsToPatient: Create patient→medication relationships
    
    LinkMedicationsToPatient --> FetchFhirEncounters: Fetch encounter history
    
    FetchFhirEncounters --> TransformEncounters: Map encounters
    
    TransformEncounters --> CreateEncounterRecords: Create encounter records
    
    CreateEncounterRecords --> CreateEncounterGraph: Create patient→provider relationships
    
    CreateEncounterGraph --> UpdateSyncTimestamp: Mark patient sync complete
    
    UpdateSyncTimestamp --> CreateSyncLog: Record successful sync in database
    
    CreateSyncLog --> [*]: Initial sync complete
    
    note right of CreatePatientGraph: CreateGraphFailed: Neo4j connection failed
    
    CreateGraphFailed --> LogNeo4jError: Log graph database error
    
    LogNeo4jError --> [*]: Sync failed, notify admin
```

### Incremental Sync (Ongoing - fetch only new data)

```mermaid
stateDiagram-v2
    [*] --> IncrementalSyncTriggered: Scheduled job or patient request
    
    IncrementalSyncTriggered --> CheckLastSyncDate: Get last successful sync timestamp
    
    CheckLastSyncDate --> FetchNewFhirResources: Query Epic for data since last sync
    
    FetchNewFhirResources --> TransformNewData: Map FHIR to OMOP/Neo4j format
    
    TransformNewData --> ProcessLabResults: Process new lab results
    
    ProcessLabResults --> ProcessMedications: Process new medications
    
    ProcessMedications --> ProcessEncounters: Process new encounters
    
    ProcessEncounters --> UpdateSyncTimestamp: Mark incremental sync complete
    
    UpdateSyncTimestamp --> CreateSyncLog: Record sync success
    
    CreateSyncLog --> [*]: Incremental sync complete
    
    note left of ProcessLabResults: FetchError: Epic API error during fetch
    
    FetchError --> LogSyncFailure: Record sync failure
    
    LogSyncFailure --> QueueRetry: Queue retry job
    
    QueueRetry --> [*]: Retry with exponential backoff
```

### Bulk Export (Large-scale historical data pull)

```mermaid
stateDiagram-v2
    [*] --> BulkExportRequested: Researcher or admin triggers bulk export
    
    BulkExportRequested --> ValidateBulkPermissions: Check user authorization
    
    ValidateBulkPermissions --> RequestBulkExport: Submit FHIR $bulk-export request to Epic
    
    RequestBulkExport --> AwaitingExportUrl: Poll for export URL
    
    AwaitingExportUrl --> DownloadExportFiles: Download exported data files
    
    DownloadExportFiles --> ValidateDataIntegrity: Check file checksums
    
    ValidateDataIntegrity --> ImportToDatabases: Import to PostgreSQL + Neo4j
    
    ImportToDatabases --> UpdateSyncTimestamp: Mark bulk export complete
    
    UpdateSyncTimestamp --> CreateSyncLog: Record successful bulk export
    
    CreateSyncLog --> [*]: Bulk export complete
    
    note right of ValidateBulkPermissions: Unauthorized: User lacks permissions
    
    Unauthorized --> [*]: Access denied, log security incident
    
    note right of DownloadExportFiles: DownloadFailed: File download failed
    
    DownloadFailed --> LogExportFailure: Record download failure
    
    LogExportFailure --> [*]: Export failed, notify researcher
```

### State Transitions Table

| From State | To State | Trigger | Guard Condition | Error Handling |
|-------------|-----------|---------|----------------|---------------|-----------|
| SyncRequested | ValidateConsent | User/initiation | Consent must be active | Check consent status |
| FetchFhirPatient | TransformFhirPatient | Patient data received | FHIR data valid | Validate FHIR format |
| TransformFhirPatient | CreatePatientRecord | Patient mapped | Data transformation complete | Transaction safety |
| FetchFhirConditions | TransformConditions | Conditions received | FHIR data valid | Validate SNOMED codes |
| ValidateConsent | FetchFhirPatient | Consent verified | Consent active and not expired | Return error if invalid |
| BulkExportRequested | ValidateBulkPermissions | Export request | User authenticated | Check user role |
| AwaitingExportUrl | RequestBulkExport | Export URL received | Export status = 'ready' | Poll status endpoint |
| DownloadExportFiles | ValidateDataIntegrity | Files downloaded | All files received | Verify checksums |
| UpdateSyncTimestamp | CreateSyncLog | Import complete | Sync finished | Create audit log |
| [*] | Any | Success/Failure terminal | - | Return to caller |

---

## Appendix 3: Consent Management Lifecycle State Machine

### Patient Consent Flow

```mermaid
stateDiagram-v2
    [*] --> ConsentPending: User initiates consent request
    
    ConsentPending --> DisplayConsentForm: Show HIPAA/GDPR/CCPA consent form
    
    DisplayConsentForm --> UserReviewsScope: Patient reviews data categories
    
    UserReviewsScope --> UserConfirmsScope: Patient selects scopes to share
    
    UserConfirmsScope --> StoreConsentIntent: Store consent in database (status=pending)
    
    StoreConsentIntent --> QueueEpicAuth: Queue Epic OAuth authorization
    
    QueueEpicAuth --> RedirectToEpic: Redirect to Epic MyChart
    
    RedirectToEpic --> PatientAuthorizesEpic: Patient approves in MyChart
    
    PatientAuthorizesEpic --> ReceiveEpicAuthCode: Receive authorization callback
    
    ReceiveEpicAuthCode --> ExchangeForAccessToken: Exchange code for access token
    
    ExchangeForAccessToken --> StoreEpicTokens: Encrypt and store tokens in database
    
    StoreEpicTokens --> CreateConsentRecord: Update consent status to active
    
    CreateConsentRecord --> ConsentActive: Consent is now active, data sync can begin
    
    ConsentActive --> [*]: Consent lifecycle complete, ready for data access
    
    note left of UserReviewsScope: UserDeclines: User declines consent
    
    UserDeclines --> [*]: Consent declined, no access granted
    
    note left of ConsentPending: ConsentExpired: Previously granted consent expired
    
    ConsentExpired --> [*]: Consent expired, requires renewal
    
    note left of ConsentActive: UserRequestsRevocation: Patient requests revocation
    
    UserRequestsRevocation --> RevokeAccess: Disable Epic data access
    
    RevokeAccess --> UpdateConsentStatus: Update status to revoked
    
    UpdateConsentStatus --> RevokeEpicTokens: Invalidate Epic tokens
    
    RevokeEpicTokens --> LogRevocation: Create audit log entry
    
    LogRevocation --> [*]: Revocation complete, data access terminated
```

### Consent State Definitions

| State | Description | Allowed Transitions | Data Access |
|--------|-------------|-------------------|----------------|
| **ConsentPending** | Initial consent request, not yet signed | ConsentActive | None |
| **ConsentActive** | Consent granted and active, data access enabled | ConsentExpired, UserRequestsRevocation | Full access to Epic FHIR data |
| **ConsentExpired** | Consent reached expiration date | StoreEpicTokens (renewal), ConsentPending | None |
| **[*]** | Terminal state | - | No transitions |

### Consent Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Epic MyChart / OAuth Portal               │
│  1. Patient clicks "Connect App"                       │
│ 2. Shows consent form (HIPAA/GDPR/CCPA scopes)          │
│ 3. Patient selects data categories to share               │
│ 4. Epic OAuth redirects to Health-Mesh callback            │
│ 5. Exchange authorization code for access tokens             │
│ 6. Store tokens → Consent status: ACTIVE                   │
│ 7. Enable FHIR data sync → Patient controls access          │
└──────────────────────────┬──────────────────────────────────────┘
                         │ Tokens stored, consent granted
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Health-Mesh Backend (PostgreSQL + Neo4j)      │
│  1. Consent status: ACTIVE                              │
│  2. Epic access tokens stored securely                     │
│  3. Queue initial sync job (fhir-sync:{patientId})       │
│  4. Worker fetches: Patient → Conditions → Labs → Meds     │
│ 5. Stores in PostgreSQL (structured) + Neo4j (graph)     │
│  6. Patient can view/manage/revoke consent in UI         │
└───────────────────────────────────────────────────────────┘
```

---

## Appendix 4: High-Level System Architecture State Machine

### Complete Medical Research Platform Data Flow

```mermaid
stateDiagram-v2
    [*] --> SystemIdle: Platform waiting for input
    
    SystemIdle --> PatientInitiatesConsent: Patient authorizes data sharing
    
    PatientInitiatesConsent --> EpicOAuthFlow: SMART on FHIR OAuth flow
    EpicOAuthFlow --> ConsentActive: Consent granted, tokens stored
    
    ConsentActive --> DataSyncTriggered: Patient or researcher triggers data sync
    
    DataSyncTriggered --> SyncQueueProcessing: Job added to BullMQ
    
    SyncQueueProcessing --> FetchFromEpic: Worker pulls data from Epic FHIR API
    
    FetchFromEpic --> TransformAndValidate: FHIR → OMOP CDM + Quality checks
    
    TransformAndValidate --> StoreInHybridDatabases: Write to PostgreSQL + Neo4j
    
    StoreInHybridDatabases --> SyncComplete: Data successfully stored
    
    SyncComplete --> ReadyForResearch: Data available for queries
    
    ReadyForResearch --> ResearcherQuery: Researcher queries patient data
    
    ResearcherQuery --> ApplyComplianceChecks: Validate access permissions
    
    ApplyComplianceChecks --> ReturnData: Return results if compliant
    
    ReturnData --> [*]: Query complete
    
    note left of SyncQueueProcessing --> SyncFailed: Error occurred during sync
    
    SyncFailed --> LogErrorAndQueueRetry: Log error, queue retry job
    
    LogErrorAndQueueRetry --> [*]: Sync failed, scheduled retry
    
    note left of ConsentActive --> UserRevokesConsent: Patient revokes access
    
    UserRevokesConsent --> RevokeDataAccess: Invalidate tokens, stop sync
    
    RevokeDataAccess --> ConsentRevoked: Consent status revoked
    
    ConsentRevoked --> [*]: Data access terminated
    
    note left of DataSyncTriggered --> BulkExportTriggered: Large data export request
    
    BulkExportTriggered --> BulkExportProcessing: Bulk data export job running
    
    BulkExportProcessing --> BulkExportComplete: Export ready for research
    
    note left of BulkExportComplete: [*]: Export complete
```

### System States Summary

| State | Description | Components | Exit Conditions |
|--------|-------------|------------|----------------|
| **SystemIdle** | No active operations | All systems available | External trigger |
| **EpicOAuthFlow** | OAuth flow in progress | Epic FHIR Service, BullMQ | Tokens obtained or error |
| **ConsentActive** | Consent granted, data access enabled | PostgreSQL, Neo4j, Sync Workers | Revocation or expiration |
| **DataSyncTriggered** | Data sync requested | BullMQ, Workers | Job queued/completed/failed |
| **SyncQueueProcessing** | Worker processing sync job | BullMQ Workers, Epic FHIR Service | Job moved to next state |
| **ReadyForResearch** | Data available for queries | API Layer, Compliance Service | Query returns results |
| **ResearcherQuery** | Researcher querying data | API Layer | Query completes or access denied |
| **SyncFailed** | Sync operation failed | Error Logging | Retry queued or notified |
| **ConsentRevoked** | Consent revoked, data access stopped | Compliance Service, Workers | Data access disabled |
| **BulkExportProcessing** | Large data export in progress | BullMQ Workers, Epic FHIR Bulk Export | Export completes or fails |

### Data Flow Between Components

```
┌─────────────────────────────────────────────────────────┐
│                     Patient Portal / Researcher UI          │
│  1. Patient connects Epic (OAuth)                           │
│  2. Patient grants consent → Consent: ACTIVE               │
│  3. Epic FHIR data pulls → PostgreSQL + Neo4j             │
│  4. Researcher queries → Compliance check → Data returned  │
└───────────────────────────────────────┬──────────────────────────────┘
                         │ Data flows through platform
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Health-Mesh Backend (API + Workers)         │
│  • PostgreSQL: Structured medical data                    │
│  • Neo4j AuraDB: Medical relationships                  │
│  • Redis/BullMQ: Async job processing                   │
│  • Epic FHIR Integration: Data extraction               │
│  • Compliance: HIPAA/GDPR/CCPA validation             │
└───────────────────────────────────────────────────────────┘
```

---

## Appendix 5: Worker Job Processing State Machine

### BullMQ Job Lifecycle

```mermaid
stateDiagram-v2
    [*] --> JobQueued: Job added to queue
    
    JobQueued --> JobWaiting: Waiting for worker to pick up
    
    JobWaiting --> JobActive: Worker processing job
    
    JobActive --> ProcessingFhirData: Fetching data from Epic API
    
    ProcessingFhirData --> TransformingData: Mapping FHIR to OMOP format
    
    TransformingData --> ValidatingData: Running quality checks
    
    ValidatingData --> StoringToPostgres: Writing to PostgreSQL
    
    StoringToPostgres --> StoringToNeo4j: Writing to Neo4j graph
    
    StoringToNeo4j --> UpdatingSyncLog: Marking sync progress
    
    UpdatingSyncLog --> JobCompleted: All data stored, log updated
    
    JobCompleted --> [*]: Job finished successfully
    
    note left of ProcessingFhirData --> FetchFailed: Epic API error
    
    FetchFailed --> JobFailedWithRetry: Mark job failed, queue retry
    
    JobFailedWithRetry --> [*]: Job failed, will retry
    
    note left of JobActive --> TransformationFailed: Data transformation error
    
    TransformationFailed --> JobFailedWithRetry: Mark failed, queue retry
    
    note left of JobActive --> StorageFailed: Database write error
    
    StorageFailed --> JobFailedWithRetry: Mark failed, queue retry
    
    note left of JobQueued --> JobSkipped: Duplicate job ID
    
    JobSkipped --> [*]: Job not processed (deduplication)
```

### Job States

| State | Description | Actions | Transitions |
|--------|-------------|---------|-------------|
| **JobQueued** | Job waiting in Redis queue | None | JobWaiting, JobSkipped |
| **JobWaiting** | Job waiting for worker | None | JobActive |
| **JobActive** | Worker processing job | Execute FHIR fetch, transformation, storage | JobCompleted, JobFailedWithRetry |
| **JobCompleted** | Job finished successfully | Update sync log, mark complete | [*] |
| **JobFailedWithRetry** | Job failed, will retry | Queue retry, increase attempt count | JobWaiting |
| **JobSkipped** | Duplicate job detected | Log deduplication, mark skipped | [*] |

---

## Appendix 6: Compliance Validation Flow State Machine

### HIPAA/GDPR/CCPA Access Control

```mermaid
stateDiagram-v2
    [*] --> AccessRequestInitiated: Researcher or system requests patient data
    
    AccessRequestInitiated --> ValidateUserAuth: Check JWT authentication
    
    ValidateUserAuth --> CheckPatientConsent: Verify active consent exists
    
    CheckPatientConsent --> VerifyConsentScope: Check if requested fields in consent scope
    
    VerifyConsentScope --> EvaluatePHIRisk: PHI detection and classification
    
    EvaluatePHIRisk --> ApplyDataMinimization: Filter to minimum necessary fields
    
    ApplyDataMinimization --> LogPHIAccess: Create PHI access log entry
    
    LogPHIAccess --> ReturnFilteredData: Return compliant data subset
    
    ReturnFilteredData --> [*]: Access granted, audit logged
    
    note left of CheckPatientConsent --> ConsentNotFound: No active consent
    
    ConsentNotFound --> LogAccessDenial: Log denied access attempt
    
    LogAccessDenial --> [*]: Access denied, security alert
    
    note left of CheckPatientConsent --> ConsentExpired: Consent past expiration date
    
    ConsentExpired --> LogExpirationEvent: Log expiration, revoke consent
    
    LogExpirationEvent --> [*]: Consent expired, access terminated
    
    note left of ValidateUserAuth --> AuthenticationFailed: Invalid JWT
    
    AuthenticationFailed --> LogSecurityIncident: Log security incident
    
    LogSecurityIncident --> [*]: Authentication failed, user logged out
```

### Compliance Checkpoints

| Checkpoint | Description | Failure Action |
|-----------|-------------|----------------|
| **Authentication** | Verify JWT token is valid and not expired | Reject request, return 401 |
| **ConsentExistence** | Confirm active, non-expired consent for patient | Return 403 if no consent |
| **ScopeValidation** | Verify requested fields are within granted consent scope | Filter to subset if over-broad |
| **PHIDetection** | Scan for direct identifiers (SSN, email, phone, medical record number) | Mask or deny access |
| **DataMinimization** | Return only minimum necessary fields for purpose | Apply field-level filtering |
| **AuditLogging** | Create immutable PHI access log entry | Log to PostgreSQL + audit table |
| **ExpiryCheck** | Verify consent not expired before granting access | Reject or renew if expired |

---

**END OF APPENDICES - State Machine Diagrams Complete**

Total State Machine Diagrams: 6
Total States Documented: 40+
Total Transitions Defined: 60+
Total Appendix Lines: ~1,200 lines

