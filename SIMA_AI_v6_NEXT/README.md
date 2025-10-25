# SIMA AI v6 NEXT — Ready in Moments
Generated: 2025-10-23T08:18:19.284706

## Run with Docker (one command)
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080

## Local Dev
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
cd frontend && npm i && npm run dev

## What you get
- FastAPI backend with stable endpoints: styles, materials, identity scoring, vision analyze, 3D reconstruct, urban simulator, chat (RAG-lite), engines dashboard.
- Next.js app with 4 polished UIs: Studio, Simulator, AI Design, Dashboard.
- Zero heavy deps. No internet calls. Works offline.

## Notes
- Identity rules and materials DB are simplified — expand JSON as needed.
- Plug advanced engines later (DINO/SAM-2, OpenStudio, Radiance). The API contracts are already defined.
