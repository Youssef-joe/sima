SIMA AI — Upgrade Pack 2 (Overlay) — v4.3

يشمل:
- Workflows Engine (بدء/متابعة/اعتماد/رفض).
- e-Sign (Stub) تكامل DocuSign/Adobe/داخلي لتتبع الحالة.
- IoT MQTT + TLS: Mosquitto + Ingestor + سكربت نشر بيانات.
- IFC Re-evaluation: تعديل ورفع الدرجة حسب التغييرات (WWR/مواد/لون/Scale).

التركيب:
1) نسخ الملفات كـ Overlay فوق مشروعك v4.2/4.1.
2) ترحيل قاعدة البيانات:
   psql "$DB_DSN" -f db/migrations/2025_10_23_pack2_workflows.sql
   psql "$DB_DSN" -f db/migrations/2025_10_23_pack2_esign.sql
   psql "$DB_DSN" -f db/migrations/2025_10_23_pack2_model_changes.sql
   psql "$DB_DSN" -f db/migrations/2025_10_23_pack2_iot.sql
3) TLS للمسكيُتو:
   ./scripts/mqtt_make_certs.sh
   ./scripts/mqtt_add_user.sh sima_ingestor changeme
   ./scripts/mqtt_add_user.sh sima_device changeme
4) تشغيل الإضافات:
   docker compose -f docker-compose.yml -f docker-compose.iot.yml up -d --build
5) اختبارات:
   - Workflow: /v1/workflow/* (start/status/task)
   - eSign: /v1/esign/start + /status
   - IoT: scripts/sensor_publish_demo.py <PID> ثم /v1/sensor/<PID>/latest
   - IFC: POST /v1/project/<PID>/re-evaluate

مراجع تقنية (مهمة):
- DocuSign Envelopes API (createEnvelope): developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/
- Adobe (Acrobat Sign) API Usage: opensource.adobe.com/acrobat-sign/developer_guide/apiusage.html
- Mosquitto TLS & config: mosquitto.org/man/mosquitto-conf-5.html
- Paho MQTT (Python) أمثلة: hivemq.com/blog/mqtt-client-library-paho-python/
- WebXR المتطلبات (Secure Context): developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
