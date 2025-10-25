# SIMA AI — Unified Build v1.1 (أمني + 3D واقعي + vLLM + Dashboards)
Generated: 2025-10-23T09:45:56.221982

## تشغيل
docker compose up --build
Web:  http://localhost:3000
API:  http://localhost:8080  (Swagger at /docs)
Grafana: http://localhost:3001  | Prometheus: http://localhost:9090

## MQTT آمن
- أنشئ شهادات TLS: `bash tools/generate_mqtt_certs.sh`
- حدّث backend/.env لو أردت mTLS (MQTT_TLS_CERT/MQTT_TLS_KEY)
- كلمات مرور و ACL في `mqtt/passwords` و `mqtt/acls`

## vLLM (اختياري)
- الخادم يعمل على http://localhost:8000 (OpenAI-compatible)
- فعّل في backend/.env: `CLOUD_RELAY_URL=http://vllm:8000/v1/chat/completions`

## RAG
- استعمل: `python tools/ingest_rag.py "DASC" tools/dasc_sample.txt`

## 3D/IFC/GLTF
- رفع GLTF جاهز من الواجهة.
- IFC جاهز للتفعيل عبر web-ifc-three (يتطلب WASM/loader).

## مراقبة
- لوحات Grafana جاهزة (Latency/Requests)
