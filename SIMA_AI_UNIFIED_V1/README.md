# SIMA AI — Unified Build v1.0
Generated: 2025-10-23T09:36:45.909778

## Run (Light mode + Arabic default)
docker compose up --build

Web:  http://localhost:3000
API:  http://localhost:8080  (Swagger at /docs, ReDoc at /redoc)

## Features
- Next.js 14 (Light/Dark + RTL/LTR) + 3D Studio (Three.js) + Urban Simulator
- FastAPI backend:
  - Project upload/analysis/score/improve/certificate
  - RAG on pgvector
  - SSE Chat
  - MQTT ingestion for IoT -> /v1/iot/latest/:pid
- Monitoring (Prometheus + Grafana)
