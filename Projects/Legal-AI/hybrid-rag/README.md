# Hybrid Legal RAG System

A hybrid retrieval-augmented generation (RAG) system for legal documents combining vector search (pgvector) and graph traversal (Apache AGE).

## Features

- Ingest US Code HTML documents
- Hierarchical chunking with citation preservation
- Vector similarity search using legal-tuned embeddings
- Citation network graph
- REST API for document retrieval

## Tech Stack

- Database: PostgreSQL 16 with pgvector + Apache AGE
- Embeddings: Legal-Embed-bge-base-en-v1.5
- API: FastAPI
- Citation Extraction: eyecite

## Quick Start

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Ingest Sample Data

```bash
python scripts/ingest_uscode.py
```

### 4. Generate Embeddings

```bash
python scripts/generate_embeddings.py
```

### 5. Start API

```bash
python src/api.py
```

### 6. Test API

```bash
# Health check
curl http://localhost:8000/health

# Search
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "income tax deduction", "top_k": 5}'

# Get document
curl http://localhost:8000/document/1
```

## Project Structure

```
opencode-rag-test/
├── src/              # Source code
├── db/schema/         # SQL schema files
├── scripts/          # Utility scripts
├── tests/            # Test files
└── data/             # Sample data
```

## API Endpoints

- `GET /health` - Health check
- `POST /search` - Search for similar text
- `GET /document/{id}` - Get document by ID

## Next Steps

1. Add authentication
2. Implement hybrid vector+graph fusion
3. Add re-ranking
4. Support case law ingestion
5. Deploy to AWS

## License

MIT
