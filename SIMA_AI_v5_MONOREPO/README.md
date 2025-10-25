# SIMA AI v5 — Code Blue
Generated: 2025-10-23T08:01:16.383305

## Quick Start (Docker)
```bash
cp backend/.env backend/.env.local 2>/dev/null || true
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080
```

## Quick Start (Local Dev)
```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# Frontend
cd frontend
npm i
npm run dev
```

## Test Endpoints
```bash
curl -X GET http://localhost:8080/
curl -X POST http://localhost:8080/v1/identity/score -H "Content-Type: application/json" -d '{"region_hint":"Central_Najdi","wwr":22,"height_ratio":1.7,"colors":["RAL 1015"],"features":["triangular_bands","crenellation"]}'

# 3D reconstruct
curl -X POST http://localhost:8080/v1/3d/reconstruct -F width=6 -F depth=4 -F height=3
```

## Notes
- This is a runnable demo scaffold. Plug ML weights (DINO / SAM2 / CLIP) into `/backend/app/services` in a future step.
- Identity rules are simplified; extend `backend/app/data/ksa_identities/identities.json`.
- For Prometheus/Grafana, extend `deploy/docker-compose.yml` and add respective services.
