
# Health-Mesh: Implementation Plans

This directory contains detailed implementation plans for Health-Mesh Medical Research Platform features.

---

## Quick Reference

| Plan File | Description | Duration | Status |
|------------|-------------|-----------|--------------|
| `custodial-wallet-implementation.md` | Backend smart contracts, DB schema, Web3Auth, Fireblocks | 12 weeks |
| `ui-frontend-plan.md` | Next.js frontend, shadcn/ui + Wagmi | 12 weeks |
| `risk-detection-system-plan.md` | Phase 1 risk detection (audit middleware, event bus, rules engine) | Completed ✅ |
| `phase1-backend-summary.md` | Backend Phase 1 completion | Completed ✅ |
| `phase1-complete-summary.md` | Full Phase 1 summary | Completed ✅ |
| `2026-01-17-epic-fhir-neo4j-integration.md` | Epic FHIR integration + Neo4j AuraDB hybrid architecture | 16 weeks | ✅ NEW |

---

## New Plan: Epic FHIR Integration + Neo4j AuraDB

**Comprehensive implementation guide covering:**
- Three-phase approach (Sandbox → MVP → Production)
- Epic FHIR OAuth 2.0 with PKCE (SMART on FHIR)
- BullMQ queue processing for data ingestion
- Neo4j AuraDB for medical relationship graph
- PostgreSQL for structured medical data (9 tables with OMOP alignment)
- Data transformation with FHIR to OMOP CDM mapping
- Comprehensive HIPAA/GDPR/CCPA compliance validation
- Docker compose with all services
- Testing strategy (unit + integration + E2E)
- Security & compliance services
- 29 bite-sized tasks across 12 components
- ~3,500 lines of detailed implementation

**Tech Stack:**
- Epic FHIR R4 API
- Neo4j AuraDB (managed)
- PostgreSQL 15+ with TypeORM
- BullMQ with Redis
- Node.js/Express
- Docker Compose

**Estimated Timeline:** 16 weeks (4 months)
**Estimated Cost Year 1:** $1,607,600 (~$134k/month)

---

## Next Steps

1. Review plan:
   ```bash
   cat .sisyphus/plans/2026-01-17-epic-fhir-neo4j-integration.md
   ```

2. Choose execution approach:
   - **Option A (Recommended):** Subagent-driven implementation (this session)
     ```bash
     /start-work
     ```
   - **Option B:** Parallel session with batch processing
     ```bash
     /start-work --parallel-session
     ```

3. Begin implementation following plan tasks step-by-step

---

**Last Updated:** January 17, 2026

---

