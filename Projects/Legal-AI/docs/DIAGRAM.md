                               ┌─────────────────────--─┐
                               │  External LLM (Ollama) │
                               └───────┬────────────────┘
                                       │ (1) Prompt & Context
                                       ▼
                               ┌──────────────────────--┐
                               │   Fastify RAG API      │
                               └───────┬────────────────┘
                                       │ (2) Semantic Search
                                       ▼
                     ┌───────────────────────────────────────--┐
                     │ PostgreSQL (pgvector)                   │
                     │  ┌────────────────────────────────---─┐ │
                     │  │   SELECT ... ORDER BY embedding <->│ │
                     │  │   RETURN top‑k documents (id, text)│ │
                     │  └─────────────────────────────────---┘ │
                     └───────────────────────────────────────--┘
                                       ▲
                                       │ (3) Graph Expansion
                                       │
                     ┌───────────────────────────────────────┐
                     │ Neo4j (CITES, HAS_SECTION, etc.)      │
                     │  ┌─────────────────────────────────-┐ │
                     │  │ MATCH (s:Document)-[:CITES]->(t) │ │
                     │  │ WHERE s.id IN $ids               │ │
                     │  │ RETURN t.id, t.text              │ │
                     │  └─────────────────────────────────-┘ │
                     └───────────────────────────────────────┘
                                       ▲
                                       │ (4) ETL Pipeline
                                       │
               ┌───────────────────────────────────────────────────┐
               │ Node.js ETL script (src/etl.js)                   │
               │  ┌──────────────────────────────────---─────┐     │
               │  │ 1. Read USCODE‑2023‑title26.txt          │     │
               │  │ 2. Clean / split into sentences          │     │
               │  │ 3. Embed each sentence with Ollama       │     │
               │  │ 4. Bulk‑insert into PostgreSQL (pgvector)│     │
               │  │ 5. Create Neo4j nodes & CITES edges      │     │
               │  └───────────────────────────────────────---┘     │
               └───────────────────────────────────────────────────┘


## How the flow works
1. **User query → Fastify**
 - The Fastify API receives the question, calls Ollama to embed the prompt, and then queries Postgres for the nearest‑neighbour documents.
2. **Postgres → Neo4j**
 - The top‑k semantic hits are sent to Neo4j, where all documents that those hits cite are fetched (one hop in the graph).
The union of the semantic hits and the related graph nodes becomes the context for the LLM.
3. **Context + Prompt → Ollama**
 - The context (concatenated text) and the original prompt are sent back to Ollama for generation.
The LLM returns a final answer that is passed back to the user.
4. **ETL**
 - The ETL script runs once (or on a schedule) to keep the vector store and the graph in sync with the source file.


