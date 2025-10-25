# SIMA AI v7 — PROFESSIONAL
Generated: 2025-10-23T08:29:32.553087

## Run (Docker)
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080



## Local Dev
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
cd frontend && npm i && npm run dev
