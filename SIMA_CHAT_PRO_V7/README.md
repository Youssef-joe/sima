# SIMA Chat Pro V7
Generated: 2025-10-23T08:43:59.769903

## Run
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080

## API
- POST /v1/chat           -> JSON {"answer","tools","context"}
- POST /v1/chat/stream    -> SSE stream (events: start, token, done)
- POST /v1/rag/upload     -> file (pdf/txt/md)
- POST /v1/rag/search     -> {"query","k"}
- POST /v1/admin/retrain  -> rebuild TF-IDF index
- POST /v1/identity/score -> identity score
- POST /v1/layout/generate-> simple layout

## Notes
- All-local; no external APIs.
- SSE uses 'text/event-stream' with EventSource on the frontend.
- Replace simple generator with a local LLM server (e.g., llama.cpp or vLLM) by wiring /v1/chat/stream to that endpoint.
