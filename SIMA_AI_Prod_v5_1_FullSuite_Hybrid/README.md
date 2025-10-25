# SIMA AI — Production-Grade FullSuite v5.1 (Hybrid)

تشغيل المنظومة كاملة بأمر واحد — محليًا أو فعليًا بنطاق وشهادات Let's Encrypt.

## التشغيل المحلي
```bash
./sima_production.sh local
# واجهة: http://localhost:3000 | API: http://localhost:8080 | Grafana: http://localhost:3001
```

## التشغيل الفعلي (نطاق حقيقي + TLS)
```bash
sudo ./sima_production.sh prod sima.yourdomain.sa admin@yourdomain.sa
# سيقوم السكربت بإصدار الشهادة تلقائيًا ثم تشغيل المنظومة عبر Nginx + TLS 1.3
```

## المتطلبات
- Docker & Docker Compose
- فتح المنافذ 80/443 على الخادم للنطاق
- DNS يشير إلى الـIP الخاص بالخادم

## المكونات
- Postgres + pgvector
- FastAPI API
- Next.js Frontend
- Keycloak (RBAC)
- Mosquitto (MQTT) مع TLS حقيقي
- Prometheus + Grafana (مراقبة)
- Nginx + Certbot (Let's Encrypt)

## الأمان
- TLS 1.3 + HSTS
- كلمات مرور قوية في .env.prod
- Mosquitto يستخدم نفس شهادات النطاق

