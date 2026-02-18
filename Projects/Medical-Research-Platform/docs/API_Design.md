## 🚀  Node.js Consent‑API – “Consent‑Hub”

> **Goal** – A production‑ready, ACID‑compliant micro‑service that lets patients (or their agents) fill out
*HIPAA*, *GDPR*, and *CCPA* consent forms, stores the signed consent off‑chain in **PostgreSQL**, and pushes heavy
tasks (PDF generation, email, audit) into a **Redis‑based queue** that workers consume.

> **Tech stack** (all 100 % NPM / Node)

| Layer | Tool | Why |
|-------|------|-----|
| **HTTP server** | **Express** (v5) | Mature, async‑friendly, widely used |
| **ORM** | **TypeORM** (or **Prisma**) | Declarative schema, transaction helpers, Postgres‑first |
| **Queue** | **BullMQ** (Redis) | ACID‑guaranteed jobs, repeatable, worker pool |
| **PostgreSQL** | 12‑15 | ACID, JSONB, full‑text search |
| **Cache** | **Redis** (for BullMQ) | Job queue & optional cache |
| **Auth** | **JWT** (passport‑jwt) | Stateless, easy integration |
| **Validation** | **class‑validator** + **class‑transformer** | Strong types, automatic validation |
| **Audit** | **Winston** + **Sentry** | Log & error monitoring |
| **Docs** | **Swagger‑UI** | Auto‑generated OpenAPI |
| **Deployment** | Docker + Docker‑Compose | Reproducible, can spin in k8s |
| **Secrets** | **dotenv** + **HashiCorp Vault** (optional) | Secure env vars |

> **Why not** a “serverless” approach?
> BullMQ relies on Redis; serverless runtimes would add latency + cold‑start overhead. The ACID requirements (see
below) are best handled by a traditional VM / container.

---

## 1️⃣  Database Schema

```sql
-- users
CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name         TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- consent_form_definitions – static form templates
CREATE TABLE consent_form_definitions (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,          -- "HIPAA_Auth_2025"
    form_type   TEXT NOT NULL,           -- "HIPAA", "GDPR", "CCPA"
    version     INT NOT NULL,
    schema_json JSONB NOT NULL,          -- JSON Schema for the form
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- consents – actual signed consents
CREATE TABLE consents (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    form_def_id BIGINT REFERENCES consent_form_definitions(id) ON DELETE RESTRICT,
    signed_at   TIMESTAMP WITH TIME ZONE,
    expires_at  TIMESTAMP WITH TIME ZONE,
    signed_hash TEXT,                    -- e.g. SHA‑256 of signed PDF
    status      TEXT DEFAULT 'pending',  -- pending, active, revoked, expired
    version     INT,                     -- form version
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- consent_logs – immutable audit trail
CREATE TABLE consent_logs (
    id          BIGSERIAL PRIMARY KEY,
    consent_id  BIGINT REFERENCES consents(id) ON DELETE CASCADE,
    action      TEXT,                    -- create, update, revoke, expire
    performed_by BIGINT,                 -- user_id or system
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    details     JSONB
);

-- Optional: audit of API calls
CREATE TABLE api_audit (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT,
    method      TEXT,
    path        TEXT,
    ip          TEXT,
    status_code INT,
    duration_ms INT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

> **ACID guarantees**
> All mutations to `consents` + associated `consent_logs` must be inside a **single PostgreSQL transaction**.
> Use `QueryRunner` (TypeORM) or `prisma.$transaction`.
> The queue is *eventually consistent* – workers simply persist to DB inside a transaction.

---

## 2️⃣  API Contract (OpenAPI 3.0)

> **Auth** – `Authorization: Bearer <jwt>`
> **Body** – `application/json` (or `multipart/form-data` if you allow PDF upload)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/consents` | Create a new consent (user fills out the form) | ` { "form_def_id": 3, "answers": { "optInMedicalRecords": true, ... } } ` | `201 Created`, `{ "id": 42, "status": "pending" }` |
| `GET` | `/api/consents/{id}` | Retrieve a signed consent | – | `200 OK`, consent JSON + signed PDF URL |
| `PATCH` | `/api/consents/{id}` | Update a pending consent (change answers) | ` { "answers": { ... } } ` | `200 OK`, updated consent |
| `DELETE` | `/api/consents/{id}` | Revoke a consent | – | `204 No Content` |
| `GET` | `/api/consents` | List user’s consents (paginated) | `?page=1&limit=20` | `200 OK`, list |
| `POST` | `/api/consents/{id}/sign` | Sign the consent (PDF generation, hash, store) | – | `202 Accepted` – job queued |
| `GET` | `/api/consents/{id}/pdf` | Download signed PDF | – | `200 OK` – PDF binary |
| `GET` | `/api/consent-definitions` | List all form templates | – | `200 OK` |

> **Swagger UI** will automatically document these routes (`/api-docs`).

---

## 3️⃣  Queue + Workers (BullMQ)

### 3.1  Redis & BullMQ Configuration

```js
// queue-config.ts
import { Queue, QueueScheduler, Worker, QueueEvents } from 'bullmq';
import { config } from 'dotenv';
config();

const redisOpts = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const consentQueue = new Queue('consent', { connection: redisOpts });
export const scheduler = new QueueScheduler('consent', { connection: redisOpts });

export const consentQueueEvents = new QueueEvents('consent', { connection: redisOpts });
```

### 3.2  Worker Tasks

| Job | Payload | Description | Transaction? |
|-----|---------|-------------|--------------|
| `sign-consent` | `{ consentId, userId }` | 1. Render PDF from `answers` (use `pdf-lib` or `puppeteer`) 2. Compute hash 3. Update `consents.signed_at`, `signed_hash`, `status='active'` 4. Persist `consent_logs` | **Yes** – use a DB transaction inside worker |
| `send-signature-email` | `{ consentId, userId }` | Send an email with PDF attachment | **No** – purely async |
| `audit-api` | `{ … }` | Persist to `api_audit` | **No** – separate from consent logic |
| `expire-consent` | `{ consentId }` | Auto‑expire when `expires_at` passes | **Yes** – update status, log |

> Workers run in separate processes, e.g. `worker-sign.js`, `worker-email.js`.
> They can be scaled horizontally (k8s pod autoscaler).

### 3.3  Worker Example (sign-consent)

```js
// worker-sign.js
import { Worker, QueueEvents } from 'bullmq';
import { createConnection, getConnection } from 'typeorm';
import { Consents, ConsentDefinitions, ConsentLogs } from './entities';
import { generateSignedPdf } from './pdf-utils';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import winston from 'winston';

const connection = createConnection();   // DB
const s3 = new S3Client({ region: process.env.AWS_REGION });

const worker = new Worker(
  'consent',
  async job => {
    const { consentId, userId } = job.data;
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1️⃣ Grab consent & def
      const consent = await queryRunner.manager.findOneOrFail(Consents, consentId, { relations: ['form_def'] });
      const def = await queryRunner.manager.findOneOrFail(ConsentDefinitions, consent.form_def_id);

      // 2️⃣ Render PDF
      const pdfBuffer = await generateSignedPdf(def.schema_json, job.data.answers);
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      // 3️⃣ Upload PDF to S3
      const s3Key = `consents/${consentId}.pdf`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        })
      );

      // 4️⃣ Persist signed consent + log
      consent.signed_at = new Date();
      consent.expires_at = new Date(Date.now() + 365*24*60*60*1000);   // 1‑year default
      consent.signed_hash = hash;
      consent.status = 'active';
      consent.version = def.version;
      await queryRunner.manager.save(consent);

      await queryRunner.manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'sign',
        performed_by: userId,
        details: { pdf_s3_key: s3Key },
      });

      await queryRunner.commitTransaction();

      winston.info(`Signed consent ${consentId} for user ${userId}`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      winston.error(`Failed sign-consent job ${job.id}`, { err });
      throw err;          // re‑throw so BullMQ can retry / mark failed
    } finally {
      await queryRunner.release();
    }
  },
  {
    connection: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT) },
    concurrency: 4,      // number of parallel workers
    defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  }
);

worker.on('completed', job => winston.info(`Job ${job.id} completed`));
worker.on('failed', (job, err) => winston.warn(`Job ${job.id} failed`, { err }));
```

> **Notes**
> • `generateSignedPdf` uses a headless browser (Puppeteer) or PDF‑lib to fill a template PDF.
> • All DB writes happen **inside a single transaction** (`queryRunner`).
> • BullMQ guarantees *at least once* delivery – the worker’s transaction ensures *exactly once* mutation
semantics.

---

## 4️⃣  Service Layer (ACID Transaction)

### 4.1  ConsentService (TypeORM example)

```js
// services/consent.service.ts
import { getConnection, Repository } from 'typeorm';
import { Consents, ConsentLogs } from '../entities';
import { consentQueue } from '../queue-config';

export class ConsentService {
  constructor(
    private consents: Repository<Consents>,
    private logs: Repository<ConsentLogs>,
    private queue: typeof consentQueue
  ) {}

  /** Create new consent (inside a transaction) */
  async create(userId, formDefId, answers) {
    return await getConnection().transaction(async manager => {
      const consent = manager.create(Consents, {
        user_id: userId,
        form_def_id: formDefId,
        answers,          // store raw answers JSONB
        status: 'pending',
      });
      await manager.save(consent);
      await manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'create',
        performed_by: userId,
        details: { answers },
      });
      return consent;
    });
  }

  /** Sign – enqueue a job */
  async sign(consentId, userId) {
    const job = await this.queue.add('sign-consent', { consentId, userId }, {
      jobId: `sign:${consentId}`,  // unique per consent
    });
    return job.id;
  }

  /** Revoke – immediate transaction */
  async revoke(consentId, userId) {
    return await getConnection().transaction(async manager => {
      const consent = await manager.findOneOrFail(Consents, { where: { id: consentId, user_id: userId } });
      if (consent.status !== 'active') throw new Error('Only active consents can be revoked');

      consent.status = 'revoked';
      await manager.save(consent);

      await manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'revoke',
        performed_by: userId,
        details: { reason: 'user requested' },
      });
      return consent;
    });
  }
}
```

> **Key points**
> *All* CRUD mutations are inside `getConnection().transaction(...)`.
> The *sign* operation is a **fire‑and‑forget**: we queue the job, the worker does the heavy work in a separate
transaction.

---

## 5️⃣  Workers – How They Keep Things ACID

1. **PDF Generation** – uses `puppeteer` or `pdf-lib`.
2. **Hash Calculation** – `crypto.createHash('sha256').update(pdfBuffer).digest('hex')`.
3. **Persist** – inside `transaction()`: update `consents.signed_at`, `expires_at`, `signed_hash`,
`status='active'`.
4. **Log** – `consent_logs` row with action “sign”.
5. **Notify** – send email (AWS SES / SendGrid) *after* the DB commit, or in a *second* queue job (so that the
sign job remains deterministic).

```js
// worker-pdf.js
import { Queue } from 'bullmq';
import { ConsentService } from '../services/consent.service';

const pdfQueue = new Queue('consent', { connection: redisOpts });

pdfQueue.process('sign-consent', async job => {
  const { consentId, userId } = job.data;
  // 1️⃣ Get consent answers
  const consent = await ConsentService.get(consentId);
  // 2️⃣ Generate PDF
  const pdfBuffer = await generateSignedPdf(consent.form_def.schema_json, consent.answers);
  // 3️⃣ Store in S3 (or local fs for dev)
  const s3Key = `consents/${consentId}.pdf`;
  await s3Client.putObject({ Bucket, Key: s3Key, Body: pdfBuffer });

  // 4️⃣ Persist signed data in a transaction
  await getConnection().transaction(async manager => {
    await manager.update(Consents, consentId, {
      signed_at: new Date(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1‑yr
      signed_hash: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
      status: 'active',
    });
    await manager.save(ConsentLogs, {
      consent_id: consentId,
      action: 'sign',
      performed_by: userId,
      details: { s3_key: s3Key },
    });
  });
});
```

> **Error handling** – if the worker throws, BullMQ will retry automatically (configurable attempts + backoff).
> **Idempotency** – the `jobId` pattern `sign:${consentId}` guarantees the job runs only once.

---

## 6️⃣  Compliance‑Form Flow (Front‑End + API)

1. **User hits `/api/consent-definitions`** → receives a list of JSON‑Schema definitions.
2. Front‑end renders a **dynamic form** (React/Angular/Whatever) that validates against the schema.
3. On submit, POST `/api/consents` → server creates a *pending* consent record.
4. User may **edit** the answers (`PATCH`) until they hit **“I Agree”**.
5. Clicking **“Sign”** triggers `POST /api/consents/{id}/sign`.
   *Server* enqueues a job.
   *Worker* generates signed PDF, signs it (if you use a hardware‑security module or E‑Signature provider), stores
the PDF in S3, writes the hash to `consents.signed_hash`, sets status `active`.
6. The signed consent can now be **downloaded** (`GET /api/consents/{id}/pdf`) and/or **shared** (if the user
opted in).

> **Tip** – Keep the *answers* JSONB in `consents` table (so you can query “who gave opt‑in to medical records?”)
but only store the *signed hash* on‑chain or in a block‑chain if you later need a tamper‑proof proof.
> For now we keep everything in Postgres + S3.

---

## 7️⃣  Security & Best‑Practices

| Area | Practice | Implementation |
|------|----------|----------------|
| **Transport** | HTTPS only | TLS termination at load balancer |
| **Auth** | JWT signed with RS256 | Use `passport-jwt`, verify `exp` & `iat` |
| **Rate‑limit** | 60 req/min per IP | `express-rate-limit` |
| **Input** | Schema validation | `class-validator` + `class-transformer` |
| **XSS** | Sanitize user input | `xss-clean` |
| **Password** | Argon2 / bcrypt | `argon2` |
| **Secrets** | `dotenv` + `.env` file | Store in Docker secrets or Vault |
| **Audit** | Immutable logs | `consent_logs` + `api_audit` |
| **Data at rest** | Encrypted S3 | SSE‑S3 or SSE‑KMS |
| **Data in transit** | TLS 1.2+ | `tls` |

---

## 8️⃣  Docker‑Compose (Development)

```yaml
version: '3.8'

services:
  api:
    build: .
    environment:
      - PORT=4000
      - DATABASE_URL=postgres://user:pw@db:5432/consentdb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    ports:
      - '4000:4000'
    depends_on:
      - db
      - redis
    command: sh -c "npm run migration:run && npm start"

  worker:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pw@db:5432/consentdb
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - db
      - redis
    command: node worker/worker-pdf.js

  db:
    image: postgres:13
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pw
      POSTGRES_DB: consentdb
    volumes:
      - ./data/db:/var/lib/postgresql/data

  redis:
    image: redis:7
    command: redis-server --save "" --appendonly no
```

> **Run**: `docker‑compose up --build`.
> **Migrations**: `npm run migration:run` (TypeORM CLI).
> **Worker**: each node process will spawn a BullMQ worker.

---

## 9️⃣  Sample Code (Key Files)

### 9.1  `server.ts`

```ts
import express from 'express';
import { json } from 'body-parser';
import { createConnection } from 'typeorm';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import consentRoutes from './routes/consent.routes';
import auditMiddleware from './middleware/audit.middleware';
import { config } from 'dotenv';
config();

const app = express();
app.use(json());
app.use(auditMiddleware);          // logs each request

// ------------- Auth -------------
passport.use(new JwtStrategy({
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}, async (payload, done) => {
  // payload contains userId
  done(null, { id: payload.sub });
}));
app.use(passport.initialize());

const swaggerDocument = yaml.load(fs.readFileSync('./api-docs.yaml', 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ------------- Routes -------------
app.use('/api', passport.authenticate('jwt', { session: false }), consentRoutes);

// ------------- Start -------------
const PORT = process.env.PORT || 4000;
createConnection().then(() => {
  app.listen(PORT, () => console.log(`Consent‑API listening on ${PORT}`));
}).catch(err => { console.error(err); process.exit(1); });
```

### 9.2  `routes/consent.routes.ts`

```ts
import { Router } from 'express';
import { ConsentService } from '../services/consent.service';
import { validate } from '../middleware/validate.middleware';
import { CreateConsentDto, UpdateConsentDto } from '../dto/consent.dto';

const router = Router();
const svc = new ConsentService();

router.post('/', validate(CreateConsentDto), async (req, res) => {
  const consent = await svc.create(req.user.id, req.body);
  res.status(201).json(consent);
});

router.get('/:id', async (req, res) => {
  const consent = await svc.getById(req.user.id, req.params.id);
  res.json(consent);
});

router.patch('/:id', validate(UpdateConsentDto), async (req, res) => {
  const consent = await svc.update(req.user.id, req.params.id, req.body);
  res.json(consent);
});

router.delete('/:id', async (req, res) => {
  await svc.revoke(req.user.id, req.params.id);
  res.sendStatus(204);
});

router.post('/:id/sign', async (req, res) => {
  await svc.signConsent(req.user.id, req.params.id);
  res.status(202).send({ job: 'queued' });
});

export default router;
```

### 9.3  `services/consent.service.ts`

```ts
import { getConnection, Repository } from 'typeorm';
import { Consents, ConsentLogs, ConsentFormDefinitions } from '../entities';
import { consentQueue } from '../queue-config';
import { validateOrReject } from 'class-validator';

export class ConsentService {
  constructor(
    private consentsRepo: Repository<Consents>,
    private logsRepo: Repository<ConsentLogs>,
    private defsRepo: Repository<ConsentFormDefinitions>
  ) {}

  async create(userId: number, dto: any) {
    await validateOrReject(dto);
    return await getConnection().transaction(async manager => {
      const def = await manager.findOneOrFail(ConsentFormDefinitions, dto.form_def_id);
      const consent = manager.create(Consents, {
        user_id: userId,
        form_def_id: def.id,
        answers: dto.answers,
        status: 'pending',
        version: def.version,
      });
      await manager.save(consent);
      await manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'create',
        performed_by: userId,
        details: { answers: dto.answers },
      });
      return consent;
    });
  }

  async getById(userId: number, id: number) {
    const consent = await this.consentsRepo.findOneOrFail({ where: { id, user_id: userId } });
    return consent;
  }

  async update(userId: number, id: number, dto: any) {
    await validateOrReject(dto);
    return await getConnection().transaction(async manager => {
      const consent = await manager.findOneOrFail(Consents, { where: { id, user_id: userId } });
      if (consent.status !== 'pending') throw new Error('Only pending consents can be edited');

      consent.answers = dto.answers;
      await manager.save(consent);
      await manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'update',
        performed_by: userId,
        details: { answers: dto.answers },
      });
      return consent;
    });
  }

  async revoke(userId: number, id: number) {
    return await getConnection().transaction(async manager => {
      const consent = await manager.findOneOrFail(Consents, { where: { id, user_id: userId } });
      if (consent.status !== 'active') throw new Error('Only active consents can be revoked');

      consent.status = 'revoked';
      await manager.save(consent);
      await manager.save(ConsentLogs, {
        consent_id: consent.id,
        action: 'revoke',
        performed_by: userId,
        details: { reason: 'user requested' },
      });
      return consent;
    });
  }

  async signConsent(userId: number, id: number) {
    await consentQueue.add('sign-consent', { consentId: id, userId }, {
      jobId: `sign:${id}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

### 9.4  `middleware/validate.middleware.ts`

```ts
import { validateOrReject } from 'class-validator';
export const validate = (dtoClass) => async (req, res, next) => {
  const dto = new dtoClass();
  Object.assign(dto, req.body);
  try {
    await validateOrReject(dto);
    next();
  } catch (err) {
    res.status(400).json({ errors: err });
  }
};
```

---

## 𝟙𝟎.  Conclusion

* **Consent‑API** provides a fully fledged CRUD interface for user consents.
* All state changes are performed inside **database transactions** – that guarantees ACID semantics.
* **Asynchronous tasks** (PDF signing, email notifications) are handled by **BullMQ workers**.
* Workers run separate from the API process, so the API remains fast and scalable.
* The architecture easily extends to an actual blockchain or an external e‑signature provider if you want
tamper‑proof evidence later.

This design satisfies the requirements:
* **Transactional** (ACID) operations for all CRUD.
* **Asynchronous** background processing for the heavy signing/notification workload.
* **Scalable** (Redis queues + horizontal worker scaling).
* **Secure** and auditable.








## 🚀  Node / Express – “Legal‑Forms” API
*(mirrors the same style you already have for the Consent API)*

Below is a **complete, copy‑paste‑ready** implementation that

* exposes the routes from the OpenAPI spec you saw earlier
* validates every request with the same **Ajv** schema‑validator you use for consents
* stores templates & responses in Postgres (via `knex`)
* pushes the “sign & email” job to the same BullMQ worker you already use
* keeps the code clean – a tiny controller, a tiny service, and a thin router

> **Tip** – If you’re already using `express‑consent` you can drop this file set into the same project; no extra dependencies beyond what you already have.

---

### 1️⃣  Project layout (partial)

```
/src
 ├─ app.js                # Express app
 ├─ routes
 │   └─ legalForms.js
 ├─ controllers
 │   └─ legalFormsController.js
 ├─ services
 │   └─ legalFormsService.js
 ├─ models
 │   ├─ legalForm.js
 │   └─ legalFormResponse.js
 ├─ validators
 │   └─ answersValidator.js
 ├─ queues
 │   └─ legalFormQueue.js   # BullMQ queue
 └─ helpers
     └─ errorHandler.js
```

> All files use **ES6‑style** `import`/`export`.
> If you’re on CommonJS, just change to `require()`/`module.exports` – the logic stays the same.

---

### 2️⃣  OpenAPI (excerpt) – for reference

```yaml
paths:
  /api/legal-forms:
    get:   ...          # list
    post:  ...          # create (admin)

  /api/legal-forms/{formId}:
    get:   ...          # template

  /api/legal-forms/{formId}/fill:
    post: ...           # create a response
```

---

## 3️⃣  Code –  from router to controller

#### 3.1  `queues/legalFormQueue.js`

```js
// same queue you already use for consents
import Queue from 'bullmq';
import { connection } from '../config/redis.js';   // ← your redis config

export const legalFormQueue = new Queue('legalFormQueue', {
  connection
});
```

#### 3.2  `validators/answersValidator.js`

```js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// simple in‑memory cache: formId → compiled Ajv schema
const compiledCache = new Map();

export function validateAnswers(formSchema, answers) {
faga  const cacheKey = formSchema.id || JSON.stringify(formSchema);

  let validateFn = compiledCache.get(cacheKey);
  if (!validateFn) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    validateFn = ajv.compile(formSchema);
    compiledCache.set(cacheKey, validateFn);
  }

  const valid = validateFn(answers);
  if (!valid) {
    const errors = validateFn.errors.map(
      e => `${e.instancePath} ${e.message}`
    ).join('; ');
    const err = new Error(`Answers do not conform to form schema: ${errors}`);
    err.status = 400;
    throw err;
  }
}
```

> **Why Ajv?**
> It’s what you already run for consent validation – no need for another validator library.

---

#### 3.3  `models/legalForm.js`

```js
// knex instance
import knex from '../config/knex.js';

export default {
  async all() {
    return knex('legal_forms').select('*');
  },

  async findById(id) {
    return knex('legal_forms').where({ id }).first();
  },

  async create({ id, schema_json, title, description }) {
    return knex('legal_forms')
      .insert({ id, schema_json, title, description })
      .returning('*');
  }
};
```

> `schema_json` is the raw JSON that came from the RJSF schema file.

#### 3.4  `models/legalFormResponse.js`

```js
export default {
  async create({ id, formId, formData, userId }) {
    return knex('legal_form_responses')
      .insert({ id, form_id: formId, form_data: formData, user_id: userId })
      .returning('*');
  }
};
```

---

#### 3.5  `services/legalFormsService.js`

```js
import LegalForm from '../models/legalForm.js';
import LegalFormResponse from '../models/legalFormResponse.js';
import { validateAnswers } from '../validators/answersValidator.js';
import { legalFormQueue } from '../queues/legalFormQueue.js';

export async function listTemplates() {
  return LegalForm.all();
}

export async function getTemplate(formId) {
  return LegalForm.findById(formId);
}

export async function createTemplate(dto) {
  return LegalForm.create(dto);
}

export async function fillForm(formId, { answers, userId }) {
  // 1️⃣  pull template so we can validate the answers
  const form = await LegalForm.findById(formId);
  if (!form) throw { status: 404, message: 'Form not found' };

  // 2️⃣  validate the incoming answers against `schema_json`
  validateAnswers(form.schema_json, answers); // throws if invalid

  // 3️⃣  store the response
  const response = await LegalFormResponse.create({
    formId,
    formData: answers,
    userId
  });

  // 4️⃣  push job to the worker (same queue you use for consents)
  await legalFormQueue.add('signAndEmail', {
    formId,
    responseId: response.id
  });

  return response;
}
```

---

#### 3.6  `controllers/legalFormsController.js`

```js
import { legalFormQueue } from '../queues/legalFormQueue.js';
import * as svc from '../services/legalFormsService.js';
import { asyncHandler } from '../helpers/errorHandler.js'; // wraps async fn

export const listTemplates = asyncHandler(async (req, res) => {
  const forms = await svc.listTemplates();
  res.json(forms);
});

export const getTemplate = asyncHandler(async (req, res) => {
  const form = await svc.getTemplate(req.params.formId);
  if (!form) return res.status(404).json({ error: 'Not found' });
  res.json(form);
});

export const createTemplate = asyncHandler(async (req, res) => {
  const dto = req.body;          // we trust the OpenAPI body schema here
  const created = await svc.createTemplate(dto);
  res.status(201).json(created);
});

export const fillForm = asyncHandler(async (req, res) => {
  const { formId } = req.params;
  const { answers } = req.body;
  const userId = req.user?.id;   // set by your auth middleware

  const response = await svc.fillForm(formId, { answers, userId });

  res.status(201).json(response);
});
```

---

#### 3.7  `routes/legalForms.js`

```js
import express from 'express';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  fillForm
} from '../controllers/legalFormsController.js';
import { requireAdmin } from '../middlewares/auth.js';   // your auth middleware

const router = express.Router();

/**
 * @route GET /api/legal-forms
 * @summary List all legal‑form templates
 */
router.get('/', listTemplates);

/**
 * @route POST /api/legal-forms
 * @summary Create a new template (admin only)
 */
router.post('/', requireAdmin, createTemplate);

/**
 * @route GET /api/legal-forms/{formId}
 * @summary Get a specific template
 */
router.get('/:formId', getTemplate);

/**
 * @route POST /api/legal-forms/{formId}/fill
 * @summary Create a new response (i.e. “sign & email” the form)
 */
router.post('/:formId/fill', fillForm);

export default router;
```

> Attach this router in `app.js` (or wherever you mount your API):

```js
import legalFormsRouter from './routes/legalForms.js';
app.use('/api/legal-forms', legalFormsRouter);
```

---

### 4️⃣  Validation of *answers* (inside `services/legalFormsService.js`)

```js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import LegalForm from '../models/legalForm.js';
import LegalFormResponse from '../models/legalFormResponse.js';
import { legalFormQueue } from '../queues/legalFormQueue.js';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// simple cache so we don’t re‑compile for every request
const schemaCache = new Map();

export async function validateAnswers(formId, answers) {
  const form = await LegalForm.findById(formId);
  if (!form) throw { status: 404, message: 'Form not found' };

  let validateFn = schemaCache.get(formId);
  if (!validateFn) {
    validateFn = ajv.compile(form.schema_json);
    schemaCache.set(formId, validateFn);
  }

  const ok = validateFn(answers);
  if (!ok) {
    const errors = validateFn.errors.map(
      e => `${e.instancePath} ${e.message}`
    ).join('; ');
    const err = new Error(`Answers validation failed: ${errors}`);
    err.status = 400;
    throw err;
  }

  return form;  // we’ll need the schema_json later for the worker
}
```

---

### 5️⃣  Worker queue (same as your Consent worker)

```js
import Queue from 'bullmq';
import { connection } from '../config/redis.js';

export const legalFormQueue = new Queue('legalFormQueue', { connection });
```

In the `fillForm` controller we already did:

```js
await legalFormQueue.add('signAndEmail', {
  formId,
  responseId: response.id
});
```

Your existing worker can pick up the job:

```js
legalFormQueue.process('signAndEmail', async job => {
  const { formId, responseId } = job.data;

  // 1️⃣  pull the template & response from DB
  const form = await LegalForm.findById(formId);
  const resp = await LegalFormResponse.findById(responseId);

  // 2️⃣  Sign the PDF (e.g. pdf-lib, pdftk, etc.)
  const signedPdf = await signPdf(resp.form_data, form.schema_json);

  // 3️⃣  Email it (nodemailer or your preferred mailer)
  await sendEmail({
    to: resp.form_user_email,   // you should store the user email on the response
    subject: `Signed legal form: ${form.title}`,
    attachments: [{ filename: 'signed.pdf', content: signedPdf }]
  });

  // 4️⃣  Update the response status
  await LegalFormResponse.updateStatus(responseId, 'sent');
});
```

> **You can reuse all the helper functions (`signPdf`, `sendEmail`, etc.) that you already use for the Consent API – just give them a slightly different payload.**

---

### 6️⃣  Error handling (global)

```js
import { json, urlencoded } from 'express';
import { errorHandler } from '../helpers/errorHandler.js';
import legalFormsRouter from './routes/legalForms.js';

export const app = express();
app.use(json());
app.use(urlencoded({ extended: true }));

// Mount the routes
app.use('/api/legal-forms', legalFormsRouter);

// Global error handler
app.use(errorHandler);
```

**`helpers/errorHandler.js`**

```js
export function errorHandler(err, req, res, next) {
  console.error(err);          // dev‑only; you probably want a logger

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
```

---

## 🎉  What you get

| Route | HTTP | Description | What the controller does |
|------|------|-------------|---------------------------|
| `GET /api/legal-forms` | List all templates | `svc.listTemplates()` → DB → `res.json()` |
| `GET /api/legal-forms/:id` | Get one template | `svc.getTemplate(id)` → DB → `res.json()` |
| `POST /api/legal-forms` (admin) | Create new template | `svc.createTemplate(dto)` → DB → `res.status(201)` |
| `POST /api/legal-forms/:id/fill` | Create a *response* |
  * Pull template (to get `schema_json`)
  * Validate `answers` via Ajv
  * Persist the response (`legal_form_responses`)
  * Push job `signAndEmail` to BullMQ
  * Return the new response |


All the **business‑logic** (validation, DB CRUD, queueing) lives in the service layer – the controller is nothing more than plumbing.
If you want to add pagination, filters, or bulk‑export you can drop the logic straight into `legalFormsService.js` – the pattern is the same you used for consent pagination.






Below is a **minimal‑but‑complete** recipe that plugs into the same Express/Node stack you already have for the consent API.
It shows:

| What | Where | Why |
|------|-------|-----|
| **Ethereum provider** – connects to an Infura/Alchemy node (or a local node) | `config/eth.js` | Pull logs / events from the blockchain |
| **Contract ABI + address** – tells ethers which contract we’re watching | `abis/LegalForms.json` | Decode logs |
| **Event‑subscription service** – keeps the listener alive, retries on disconnect, and forwards heavy work to BullMQ | `services/contractEventService.js` | Decouple on‑chain vs. off‑chain
logic |
| **Event handlers** – one per event type (FormCreated, FormSigned, DataAccessRequested, …) | `listeners/contractListener.js` | Capture logs and persist to Postgres |
| **Off‑chain work queue** – a BullMQ job that does “fetch‑IPFS, sign‑PDF, email” | `queues/legalFormQueue.js` (re‑used) | Keeps the listener thin & idempotent |
| **Graceful shutdown** – removes listeners on SIGINT/SIGTERM | `listeners/contractListener.js` | Avoid orphaned connections |

> **TL;DR** – drop the two files below into the `src` tree, add a call to `startListeners()` in your `app.js`, and you’re done.
> All the plumbing is the same as the consent listeners you already have, so you’ll be able to audit, log, and test the same way.

---

## 1️⃣  Project layout (relevant parts)

```
/src
 ├─ config
 │   ├─ eth.js            ← ETH node + contract
 │   └─ redis.js          ← already exists
 ├─ listeners
 │   └─ contractListener.js   ← starts the event listeners
 ├─ services
 │   └─ contractEventService.js
 ├─ queues
 │   └─ legalFormQueue.js   ← BullMQ queue you already use
 ├─ models
 │   └─ legalFormResponse.js
 ├─ helpers
 │   └─ gracefulShutdown.js
 └─ app.js
```

---

## 2️⃣  Configuration

`src/config/eth.js`

```js
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();                       // .env must contain ETH_RPC_URL
export const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // e.g. 0x123...
```

> Use the same `process.env` file you already have for the consent API.

---

## 3️⃣  ABI

The ABI is required only for the events you want to listen to.
Below is a tiny **mock ABI** – replace it with the real ABI of your contract.

```json
// src/abis/LegalForms.json
[
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "formId",  "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "schemaCID", "type": "string" }
    ],
    "name": "FormCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "uint256", "name": "formId",       "type": "uint256" },
      { "indexed": true,  "internalType": "address", "name": "signer",       "type": "address" },
      { "indexed": false, "internalType": "bytes32", "name": "signatureHash","type": "bytes32" }
    ],
    "name": "FormSigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "dataOwner",     "type": "address" },
      { "indexed": true,  "internalType": "bytes32", "name": "accessRequestId","type": "bytes32" },
      { "indexed": false, "internalType": "string",  "name": "metadataIPFS",   "type": "string" }
    ],
    "name": "DataAccessRequested",
    "type": "event"
  }
]
```

---

## 4️⃣  Service that knows how to *process* an event

`src/services/contractEventService.js`

```js
import LegalFormResponse from '../models/legalFormResponse.js';
import { legalFormQueue } from '../queues/legalFormQueue.js';
import { ethers } from 'ethers';
import crypto from 'crypto';

export class ContractEventService {
  /**
   * Called when a `FormSigned` event is captured.
   *
   * The chain side contains only the hash of the signed PDF (e.g. IPFS CID)
   * and the address that signed it.  We want to:
   *   1. Grab the off‑chain file (IPFS / S3 / local FS)
   *   2. Persist the signature in the `legal_form_responses` table
   *   3. Trigger the same `signAndEmail` job that the REST API would do
   */
  static async handleFormSigned(log) {
    const { formId, signer, signatureHash } = log.args;   // ethers v5 style
    const userId = await this._findUserIdByAddress(signer);   // helper

    // 1️⃣  persist a “signed” row – we keep the raw signature hash
    const response = await LegalFormResponse.create({
      id: crypto.randomUUID(),
      formId: formId.toString(),
      formData: { signatureHash: signatureHash.toString() },
      userId
    });

    // 2️⃣  push a job so that a worker can download the PDF, sign it, and e‑mail it
    await legalFormQueue.add('signAndEmail', {
      contractFormId: formId,
      responseId: response.id,
      signatureHash
    });

    return response;
  }

  /**
   * Utility – find the local user id that owns a given Ethereum address.
   */
  static async _findUserIdByAddress(addr) {
    // Replace with your own user‑lookup logic
    const user = await knex('users')
      .where({ eth_address: addr.toLowerCase() })
      .first();
    if (!user) throw { status: 404, message: `No local user for ${addr}` };
    return user.id;
  }

  /**
   * Called when a `FormCreated` event is emitted.
   * Persists the on‑chain form ID + schema CID into `legal_forms`.
   */
  static async handleFormCreated(log) {
    const { formId, schemaCID } = log.args;
    // schemaCID is an IPFS CID pointing to the raw RJSF JSON.
    const schemaJson = await fetchSchemaFromIPFS(schemaCID); // helper

    await knex('legal_forms').insert({
      id: formId.toString(),
      schema_json: schemaJson,
      title: 'Off‑chain Form',
      description: `Created by ${log.args.creator}`
    });
  }

  /**
   * Called when a `DataAccessRequested` event is emitted.
   * The worker can verify the signature and set a flag in the DB.
   */
  static async handleDataAccessRequested(log) {
    const { dataOwner, accessRequestId, metadataIPFS } = log.args;

    // store the request – the worker will later verify it
    await knex('data_access_requests').insert({
      id: accessRequestId.toString(),
      owner: dataOwner.toLowerCase(),
      metadata_cid: metadataIPFS,
      status: 'pending'
    });

    // schedule a heavy job
    await dataAccessQueue.add('verifyAndGrant', {
      requestId: accessRequestId.toString()
    });
  }
}
```

*The service above is intentionally thin – all heavy work is off‑loaded to a BullMQ job (see the “queues” section).
The API and the listener share the same DB schema, so you can even reuse the same queue workers.*

---

## 5️⃣  The listener that registers with the provider

`src/listeners/contractListener.js`

```js
import { ethers } from 'ethers';
import { provider, CONTRACT_ADDRESS } from '../config/eth.js';
import LegalFormsAbi from '../abis/LegalForms.json';
import * as EventService from '../services/contractEventService.js';
import { gracefulShutdown } from '../helpers/gracefulShutdown.js';

const contract = new ethers.Contract(CONTRACT_ADDRESS, LegalFormsAbi, provider);

export function startListeners() {
  // 1️⃣  `FormCreated` → create a template in the DB
  const formCreatedFilter = contract.filters.FormCreated();
  provider.on(formCreatedFilter, async (log) => {
    try {
      await EventService.ContractEventService.handleFormCreated(log);
      console.log(`✅ FormCreated (id=${log.args.formId.toString()}) persisted`);
    } catch (e) {
      console.error('⚠️  FormCreated processing error', e);
    }
  });

  // 2️⃣  `FormSigned` → capture the signature + enqueue off‑chain work
  const formSignedFilter = contract.filters.FormSigned();
  provider.on(formSignedFilter, async (log) => {
    try {
      await EventService.ContractEventService.handleFormSigned(log);
      console.log(`✅ FormSigned (id=${log.args.formId.toString()}) queued`);
    } catch (e) {
      console.error('⚠️  FormSigned processing error', e);
    }
  });

  // 3️⃣  `DataAccessRequested` → log the request
  const dataReqFilter = contract.filters.DataAccessRequested();
  provider.on(dataReqFilter, async (log) => {
    try {
      await EventService.ContractEventService.handleDataAccessRequested(log);
      console.log(`✅ DataAccessRequested (id=${log.args.accessRequestId.toString()}) queued`);
    } catch (e) {
      console.error('⚠️  DataAccessRequested processing error', e);
    }
  });

  // Optional: log provider health
  provider._node._provider.on('error', (err) => {
    console.error('❌  Ethereum provider error', err);
  });

  // Hook into process exit to remove listeners
  process.on('SIGINT', () => gracefulShutdown(provider));
  process.on('SIGTERM', () => gracefulShutdown(provider));

  console.log('📡  Smart‑contract listeners started.');
}
```

### 5️⃣.1  Graceful shutdown helper

`src/helpers/gracefulShutdown.js`

```js
export function gracefulShutdown(provider) {
  console.log('🛑  Disconnecting from Ethereum node...');
  provider.removeAllListeners();
  // If you use websockets, you might want to call provider.destroy()
  if (provider._node && provider._node.destroy) {
    provider._node.destroy();
  }
  process.exit(0);
}
```

---

## 6️⃣  Hook it into the Express bootstrap

`src/app.js`

```js
import express from 'express';
import { startListeners } from './listeners/contractListener.js';
import legalFormsRouter from './routes/legalForms.js';
import { errorHandler } from './helpers/errorHandler.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the legal‑form API
app.use('/api/legal-forms', legalFormsRouter);

// Global error handler
app.use(errorHandler);

// ---------------------------------------------------------------------
//  ▶️  Start the Ethereum listeners **after** the HTTP server is ready
// ---------------------------------------------------------------------
app.listen(process.env.PORT || 3000, async () => {
  console.log(`🚀  API listening on port ${process.env.PORT || 3000}`);
  await startListeners();      // ← spins up the event watchers
});
```

> All the environment variables you already have for the consent API (`DATABASE_URL`, etc.) are still in play.
> Just add:

```dotenv
ETH_RPC_URL=wss://mainnet.infura.io/ws/v3/<project‑id>
CONTRACT_ADDRESS=0xABCD1234EF...      # your legal‑forms contract
```

---

## 7️⃣  What the worker does (quick sketch)

`workers/legalFormWorker.js` (or the same file you already have for consent)

```js
import { legalFormQueue } from '../queues/legalFormQueue.js';
import { signPdf } from '../utils/pdf.js';           // your PDF‑lib helper
import { sendEmail } from '../utils/email.js';       // your nodemailer helper
import { knex } from '../config/knex.js';

legalFormQueue.process('signAndEmail', async job => {
  const { responseId, signatureHash } = job.data;

  // 1️⃣  download the signed PDF from IPFS (or wherever it lives)
  const signedPdfBuffer = await fetchFromIPFS(signatureHash); // helper

  // 2️⃣  optional: verify the signature against the hash
  const ok = await verifySignature(responseId, signedPdfBuffer);
  if (!ok) throw new Error('Invalid signature!');

  // 3️⃣  email the signed copy
  await sendEmail({
    to: await knex('legal_form_responses')
      .where({ id: responseId })
      .select('user_email')
      .first()
      .then(r => r.user_email),
    subject: 'Your legal form is signed',
    attachments: [{ filename: 'signed.pdf', content: signedPdfBuffer }]
  });

  // 4️⃣  mark the response as “sent”
  await knex('legal_form_responses')
    .where({ id: responseId })
    .update({ status: 'sent' });
});
```

*All of the above helpers (`fetchFromIPFS`, `verifySignature`, `sendEmail`) are exactly the same you use for the consent API, so you can copy‑paste them.*

---

## 8️⃣  Summary checklist

| ✅ | Item |
|----|------|
| ✅  **Provider** – connects via WSS to Infura/Alchemy (or local node). |
| ✅  **Contract ABI** – only the events you need. |
| ✅  **Event filter & subscription** – `provider.on(filter, cb)`. |
| ✅  **DB persistence** – same tables (`legal_forms`, `legal_form_responses`). |
| ✅  **BullMQ job** – heavy work (IPFS fetch, PDF signing, e‑mail) goes into `legalFormQueue`. |
| ✅  **Graceful shutdown** – `provider.removeAllListeners()`. |
| ✅  **Bootstrapping** – call `startListeners()` right after `app.listen`. |
| ✅  **Same error/validation logic** – Ajv for payloads, `errorHandler` for API errors. |

With the snippets above you can start watching your contract *immediately* – no extra deployment scripts required.
Just run `node src/app.js` (or `npm run dev`) and you’ll see the console log

```
📡  Smart‑contract listeners started.
```

…and all on‑chain events will fire through your existing off‑chain pipelines. Happy listening! 🚀