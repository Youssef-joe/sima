# SIMA Chat Pro GPU-PRO (Local-first Saudi RAG + pgvector + optional vLLM GPU)
Generated: 2025-10-23T09:08:01.583438

Run (local-first):
  docker compose -f deploy/docker-compose.yml up --build
Web:  http://localhost:3000
API:  http://localhost:8080

Enable pgvector:
  Edit backend/.env -> PG_DSN=postgresql://postgres:postgres@vector-db:5432/pgdb
  (compose includes pgvector image and persistent volume)

GPU + vLLM (optional):
  - Install NVIDIA driver + Container Toolkit on host
  - Export MODEL_ID (e.g., meta-llama/Llama-3.1-8B-Instruct)
  - Set MODE=hybrid and CLOUD_RELAY_URL=http://vllm:8000/v1/chat/completions in backend/.env

SSE/Docs:
  - Streaming via SSE (EventSource); FastAPI docs at /docs and /redoc
