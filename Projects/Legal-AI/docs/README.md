
Below is a **complete, copy‑and‑paste starter kit** for a **RAG‑MCP** (Retrieval‑Augmented Generation – Multi‑Tenant Compute Platform) server written
in **TypeScript**.
It uses

| Technology | Why it fits |
|------------|-------------|
| **Node.js + Express** | Light‑weight, async I/O, great TS support |
| **LangChain** | Handles LLM orchestration, prompt templates, vector stores |
| **Ollama** | Local inference (any model – e.g., `llama2:7b`, `qwen2:1.5b`) |
| **PostgreSQL + pgvector** | Native vector support, ACID guarantees, easy to run on RDS/Aurora / Azure Postgres |
| **Docker / Docker‑Compose** | Easy local dev & production deployment |
| **AWS ECS (Fargate) / Azure Container Instances** | Serverless container platforms – no VM ops |
| **Mongoose‑like multi‑tenant design** | Separate schemas/tenant_id per client – no data leakage |

> **TL;DR**
> 1. Build the image (`docker build -t rag-mcp .`)
> 2. Run locally (`docker compose up`) – it starts an Express API, an Ollama server and a Postgres container.
> 3. Deploy to AWS or Azure with the scripts under `scripts/`.
> 4. Use `/ingest` to upload documents, `/query` to ask a question – the API returns the model answer + citations.

---

## 1. Repository Layout

```
rag-mcp/
├── src/
│   ├── config.ts
│   ├── llm.ts
│   ├── router.ts
│   ├── server.ts
│   ├── vectorStore.ts
│   └── types.ts
├── scripts/
│   ├── deploy-aws.sh
│   ├── deploy-azure.sh
│   └── setup-db.sh
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

> **Tip**: Copy `.env.example` to `.env` and edit the variables for your environment.

---

## 2. Core Source Code

### 2.1 `src/config.ts`

```ts
import * as dotenv from 'dotenv';
dotenv.config();

/** Environment variables */
export const PORT = process.env.PORT ?? 3000;

// ----- Ollama -----
export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama2:7b';

// ----- PostgreSQL -----
export const PG_CONNECTION_STRING = process.env.PG_CONNECTION_STRING ??
  'postgresql://postgres:postgres@localhost:5432/rag_mcp';

/** Multi‑tenant auth – simple bearer token → tenant ID */
export const TENANT_HEADER = 'X-Tenant-Id';
```

### 2.2 `src/llm.ts`

```ts
import { ChatOpenAI, LLMChain, PromptTemplate } from 'langchain/chat_models';
import { Ollama } from 'langchain/llms/ollama';

/**
 * Wrapper that points LangChain to the local Ollama instance.
 */
export const llm = new Ollama({
  baseUrl: OLLAMA_URL,
  model: OLLAMA_MODEL,
  temperature: 0.1,
  maxTokens: 1024,
});

/**
 * Simple prompt for a RAG chain.
 */
export const prompt = new PromptTemplate({
  inputVariables: ['context', 'question'],
  template: `You are a helpful assistant.

Context:
{context}

Question:
{question}

Answer:`,
});

export const chain = new LLMChain({
  llm,
  prompt,
});
```

### 2.3 `src/vectorStore.ts`

```ts
import { PostgresVectorStore } from 'langchain/vectorstores/postgres';
import { Document } from 'langchain/document';
import { Database } from 'pg';
import { DB_CONNECTION_STRING } from './config';

/**
 * A thin wrapper that creates a tenant‑aware vector store.
 */
export async function getTenantStore(tenantId: string) {
  const client = new Database(DB_CONNECTION_STRING);
  await client.connect();

  // Create schema for the tenant if it doesn't exist
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

  // pgvector index already in the table
  const store = await PostgresVectorStore.fromDocuments(
    [],
    {
      client,
      tableName: `"${tenantId}".documents`,
      vectorColumn: 'embedding',
    },
    {
      embeddings: new OpenAIEmbeddings({}),
      // You can swap the embeddings model
    },
  );
  return store;
}
```

> **Note**: The above example is intentionally minimal.
> In production you’ll want to add connection pooling, retry logic, and a proper `embeddings` implementation that does not hit the OpenAI API (you can
use `OpenAIEmbeddings` with a local model or any open‑source embedder).

### 2.4 `src/router.ts`

```ts
import express, { Request, Response } from 'express';
import { Document } from 'langchain/document';
import * as fs from 'fs';
import { getTenantStore } from './vectorStore';
import { chain } from './llm';
import { TENANT_HEADER } from './config';

const router = express.Router();

/**
 * POST /ingest
 * Body: { file: Buffer } – supports plain text for demo
 * Query: tenant ID via X-Tenant-Id header
 */
router.post('/ingest', async (req: Request, res: Response) => {
  const tenant = req.header(TENANT_HEADER);
  if (!tenant) return res.status(400).send('Missing tenant ID');

  const fileBuffer = req.body;
  if (!fileBuffer) return res.status(400).send('No file content');

  const text = fileBuffer.toString('utf8');

  // Split into chunks
  const chunks = text.match(/.{1,2000}/g) ?? [text];

  const docs = chunks.map((chunk) => new Document({ pageContent: chunk }));

  const store = await getTenantStore(tenant);
  await store.addDocuments(docs);

  res.json({ status: 'ingested', docs: docs.length });
});

/**
 * POST /query
 * Body: { question: string }
 * Header: X-Tenant-Id
 */
router.post('/query', async (req: Request, res: Response) => {
  const tenant = req.header(TENANT_HEADER);
  if (!tenant) return res.status(400).send('Missing tenant ID');

  const { question } = req.body;
  if (!question) return res.status(400).send('Missing question');

  const store = await getTenantStore(tenant);
  const results = await store.similaritySearch(question, 3);

  const context = results.map((doc) => doc.pageContent).join('\n---\n');

  const answer = await chain.run({ context, question });

  res.json({ answer, citations: results.map((doc) => doc.metadata) });
});

export default router;
```

### 2.5 `src/server.ts`

```ts
import express from 'express';
import bodyParser from 'body-parser';
import router from './router';
import { PORT } from './config';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`RAG‑MCP listening on port ${PORT}`);
});
```

---

## 3. Docker & Local Development

### 3.1 Dockerfile

```dockerfile
# Stage 1 – build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 2 – runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --production
COPY --from=build /app/dist ./dist
COPY .env.example .env
CMD ["node", "dist/server.js"]
```

### 3.2 docker‑compose.yml

```yaml
version: '3.9'

services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: rag_mcp
    volumes:
      - db-data:/var/lib/postgresql/data
    command: >
      postgres -c shared_preload_libraries=pgvector
    ports:
      - "5432:5432"

  ollama:
    image: ollama/ollama:latest
    command: serve
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"

  app:
    build: .
    depends_on:
      - db
      - ollama
    environment:
      PG_CONNECTION_STRING: postgres://postgres:postgres@db:5432/rag_mcp
      OLLAMA_URL: http://ollama:11434
      OLLAMA_MODEL: llama2:7b
      PORT: 3000
    ports:
      - "3000:3000"

volumes:
  db-data:
  ollama-data:
```

> **Run**
> ```bash
> docker compose up --build
> ```
> The API will be reachable at `http://localhost:3000/api`.

---



---

## 5. Testing the Solution

```bash
# Assuming Docker containers are running (docker‑compose or deployed)
curl -X POST http://localhost:3000/api/ingest \
  -H "X-Tenant-Id: lawfirm-a" \
  --data-binary @example.txt
```

```bash
curl -X POST http://localhost:3000/api/query \
  -H "X-Tenant-Id: lawfirm-a" \
  -H "Content-Type: application/json" \
  -d '{"question":"Explain the statute of limitations for breach of contract in
California."}'
```

---

## 6. Production Checklist

| Item | Status | Notes |
|------|--------|-------|
| **GPU** | ✅ | Ensure GPU memory fits the chosen model |
| **PostgreSQL + pgvector** | ✅ | Create extension `CREATE EXTENSION pgvector;` |
| **Ollama** | ✅ | Load model: `ollama pull llama2:7b` |
| **TLS** | ❌ | Use Nginx/Traefik as reverse proxy |
| **Auth** | ❌ | Add JWT or API keys |
| **Observability** | ❌ | OTel, Prometheus |
| **CI/CD** | ❌ | GitHub Actions / GitLab CI |
| **High‑Availability** | ❌ | Multi‑AZ deployment |

---

## 7. Troubleshooting

- **`similaritySearch` returns empty**: Check that the schema for the tenant exists
(`CREATE SCHEMA`).
- **Ollama not starting**: Inspect the container logs: `docker logs ollama`.
- **MemoryError**: Load smaller embeddings / reduce chunk size.

---

## 8. License

MIT © 2024 Your Organization

