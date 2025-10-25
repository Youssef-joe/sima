SIMA AI v4.2 OVERLAY
--------------------
ضع هذه الملفات فوق مصدر v4.1 ثم أعد البناء:
  docker compose build web api
  docker compose up

ما الذي تضيفه؟
- backend/app/main.py: تقارير 5 لغات + حفظ حالة IFC + مؤشرات مدن
- frontend/app/city/atlas: خريطة Choropleth
- frontend/app/studio/3d: استيراد IFC مع حفظ الحالة
- mosquitto/secure.conf + scripts/enable_tls.sh: تفعيل TLS والحسابات
