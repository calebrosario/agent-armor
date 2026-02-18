## 1. Architecture Diagram (Text‑Based)

```
┌────────────────────────────────────────────────────────────────────────-────────────────────┐
│                                   ┌─────────────────┐                                       │
│                                   │  Public‑Facing  │                                       │
│                                   │  Load Balancer │   (NGINX / ALB)                        │
│                                   └───────┬─────────┘                                       │
│                                           │                                                 │  
│                                           ▼                                                 │
│                         ┌───────────────────────────────────────┐                           │
│                         │            API Gateway (Ingress)      │                           │  
│                         └───────┬───────────────────────┬───────┘                           │
│                                 │                       │                                   │
│                                 │                       │                                   │
│          ┌──────────────────────┴───────┐   ┌───────────┴───────────────┐                   │
│          │     Uploader Service (NGINX) │   │     Auth / Identity (OPA) │                   │
│          └────────────┬─────────────────┘   └─────────┬─────────────────┘                   │
│                       │                               │                                     │
│                       ▼                               ▼                                     │
│          ┌───────────────────────┐   ┌───────────────────────┐                              │
│          │  Document Ingestor    │   │  Private Identity &   │                              │
│          │  (File Converter,     │   │  Access Control (OPA) │                              │
│          │   OCR, Hashing)       │   └───────────────────────┘                              │
│          └─────────────┬─────────┘                                                          │
│                        │                                                                    │
│                        ▼                                                                    │
│            ┌───────────────────────────────────────────────────────────────┐                │
│            │          Kubernetes Cluster (EKS/GKE/AWS‑K8s)                 │                │
│            └─────────────────────────────────────┬─────────────────────────┘                │
│                                                  │                                          │
│  ┌────────────────────────────────────┬─────────────────┬──────────────────┐                │
│  │  Slim Pod (MCP + RAG + DB)         │  Standard Pod   │  Full‑Suite Pod  │                │
│  │(CPU‑only, on‑prem or private cloud)│ (adds Uploader) │(adds UI + Ollama)│                │
│  │                                    │                 │                  │                │
│  └───────┬───────────────────┬───────┬───────────┬─────────────────────────┘                │
│          │                   │       │           │                      │                   │ 
│          ▼                   ▼       ▼           ▼                      ▼                   │
│  ┌───────────────┐       ┌───────────────┐  ┌───────────────┐      ┌────────────────────┐   │
│  │  LangChain TS │       │  LangChain TS │  │  LangChain TS │      │  LangChain TS      │   │
│  │   (MCP)       │       │   (MCP)       │  │   (MCP)       │      │   (MCP + RAG)      │   │
│  └───────┬───────┘       └───────┬───────┘  └───────┬───────┘      └──────┬─────────────┘   │ 
│          │                           │              │                     │                 │ 
│          ▼                           ▼              ▼                     ▼                 │ 
│  ┌─────────────┐               ┌───────────────────────┐   ┌───────────────────────┐        │ 
│  │  RAG Store  │               │  RAG Store (Doc‑DB)   │   │  RAG Store (Doc‑DB)   │        │ 
│  └───────┬─────┘               └───────┬───────────────┘   └───────┬───────────────┘        │ 
│          │                             │                           │                        │ 
│          ▼                             ▼                           ▼                        │ 
│  ┌───────────────┐        ┌─────────────────────────┐   ┌────────────────────────┐          │ 
│  │  Vector Store │        │  Vector Store           │   │  Vector Store          │          │ 
│  │  (Weaviate,   │        │  (Weaviate, Elastic)    │   │  (Weaviate, Elastic)   │          │ 
│  │  Chroma)      │        │                         │   │                        │          │ 
│  └───────┬───────┘        └───────┬─────────────────┘   └───────┬────────────────┘          │ 
│          │                           │                          │                           │ 
│          ▼                           ▼                          ▼                           │ 
│  ┌───────────────┐        ┌─────────────────────────┐   ┌─────────────────────────┐         │ 
│  │  Document DB  │        │  Document DB            │   │  Document DB            │         │ 
│  │  (Postgres)   │        │  (Postgres/Redis)       │   │  (Postgres/Redis)       │         │ 
│  └───────┬───────┘        └───────┬─────────────────┘   └───────┬─────────────────┘         │ 
│          │                           │                          │                           │ 
│          ▼                           ▼                          ▼                           │ 
│  ┌───────────────────────────────────────────────────────────────────────────────┐          │
│  │                                 Storage Layer (S3 / EFS / GCS)                │          │
│  └───────────────────────────────────────────────────────────────────────────────┘          │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐            │
│  │  Data‑Cleaning Service (GDPR‑aware pipeline) – separate pod (CPU‑GPU)       │            │
│  └─────────────────────────────────────────────────────────────────────────────┘            │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐            │
│  │  Cyber Audit & Contract Validation Service – separate pod (CPU‑GPU)         │            │
│  └─────────────────────────────────────────────────────────────────────────────┘            │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐            │
│  │  OpenWeb UI (React/Next.js) – static web app served by CDN                  │            │
│  └─────────────────────────────────────────────────────────────────────────────┘            │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐            │
│  │  Ollama Runtime (LLM inference) – GPU pod (optional per user config)        │            │
│  └─────────────────────────────────────────────────────────────────────────────┘            │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Points

| Layer | Purpose | Security |
|-------|---------|----------|
| **Ingress / Load Balancer** | Single entry point, TLS termination | 2‑factor auth for UI, rate limiting |
| **Uploader + Auth** | Secure file ingestion, encryption at rest | Data hashing, file type validation |
| **Pods** | Logical separation of functions | Namespace isolation, RBAC, network policies |
| **Vector & Doc DB** | Retrieval‑Augmented Generation | Role‑based access, encryption in transit |
| **Storage Layer** | Object storage for large docs | SSE‑S3/GCS, versioning |
| **Data‑Cleaning / Audit** | GDPR & compliance pipelines | Audit logs, immutable snapshots |
| **UI & LLM Runtime** | User interaction, inference | Zero‑trust, local inference (Ollama) |

---

## 4. Summary

* **Architecture** – A modular, pod‑based Kubernetes stack that isolates data ingestion, LLM
inference, vector search, and UI. All data stays on‑prem or in a private cloud, with optional
hosted upsell.

Feel free to request deeper dives into any component (e.g., cost‑per‑pod detailed, detailed
KPI dashboards, or investor pitch deck).