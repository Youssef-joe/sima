# SIMA AI v5 MAX — Code Blue
Generated: 2025-10-23T08:07:35.738743

## What is new
- ✅ Working **RAG-like Chat** endpoint `/v1/chat` with TF-IDF retrieval over `backend/app/data/corpus/*.md` (no external LLM dependency).
- ✅ **/v1/admin/retrain** to rebuild the index (simulate 24/7 training).
- ✅ Expanded identities DB and endpoints.
- ✅ Frontend chat panel integrated with the backend.

## Run (Docker)
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080

## Local Dev
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

cd frontend
npm i && npm run dev
