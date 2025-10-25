# SIMA Chat Pro Cloud+ (Local-first Saudi RAG + optional cloud)
Generated: 2025-10-23T08:52:50.274938

## Run (local-first)
docker compose -f deploy/docker-compose.yml up --build
# Web: http://localhost:3000
# API: http://localhost:8080
# Local LLM: http://localhost:7070 (SSE)
# Cloud Relay: http://localhost:9090 (disabled unless keys provided)

## Modes
- Local (default): يعتمد على RAG والمعرفة المحلية ومحرك LLM المحلي.
- Hybrid: يبدأ محليًا ثم يكمل عبر السحابة (إن وُجد مزود).
- Cloud: يمر عبر Cloud Relay فقط (إذا تم تهيئته).

## API
- POST /v1/chat/stream     -> SSE streaming (events: start, tools, token, done)
- POST /v1/rag/upload      -> upload PDF/MD/TXT
- POST /v1/rag/search      -> contextual search
- POST /v1/admin/retrain   -> rebuild index
- POST /v1/identity/score  -> Saudi identity scorer
- POST /v1/layout/generate -> simple layout

## Notes
- All code is ours. لا توجد تبعيات على خدمات مغلقة؛ Cloud Relay اختياري وبناءنا بالكامل.
- استبدل خدمة llm بمخدم vLLM/llama.cpp عند الحاجة، واضبط MODE=hybrid أو cloud.
