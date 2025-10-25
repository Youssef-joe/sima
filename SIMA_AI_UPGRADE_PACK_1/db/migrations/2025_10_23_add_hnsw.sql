CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX CONCURRENTLY IF NOT EXISTS rag_docs_embedding_hnsw
ON rag_docs USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
