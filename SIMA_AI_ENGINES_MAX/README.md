# SIMA AI — ENGINES MAX
Generated: 2025-10-23T08:40:06.055984

## Run (one command)
docker compose -f deploy/docker-compose.yml up --build
# Web:     http://localhost:3000
# API:     http://localhost:8080
# Trainer: http://localhost:8090
# Gateway: http://localhost:8081

## Local Dev
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
cd frontend && npm i && npm run dev

## Engines Endpoints
- /v1/design/generate
- /v1/render/preview
- /v1/layout/generate
- /v1/structure/simulate
- /v1/identity/score, /v1/styles, /v1/materials, /v1/materials/recommend
- /v1/generate3d/from_text
- /v1/eco/assess
- /v1/chat, /v1/admin/retrain

## Notes
- All-local; no external APIs. Replace heuristic formulas with advanced models as needed.
- Ready to attach vector DB (pgvector) + Ray Serve + MLflow later.
