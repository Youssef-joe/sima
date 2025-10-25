SIMA AI — Upgrade Pack 1 (Overlay)
==================================

ماذا تضيف هذه الحزمة فوق v4.1 + Overlay v4.2؟
- مسار جديد لاستخراج معايير DASC من PDF:  /v1/dasc/extract
- صفحة Atlas مطوّرة: Choropleth + KPIs من /v1/metrics/cities + Legend
- صفحة Studio 3D محدّثة: زر WebXR (تجريبي) + حفظ حالة IFC كما هو
- SQL Migration لفهرس HNSW (pgvector) لتسريع استعلامات RAG

طريقة التركيب (Overlay):
1) انسخ محتويات هذا الـZIP فوق مشروعك (استبدال الملفات في المسارات المطابقة).
2) شغّل ترحيل قاعدة البيانات:
   psql "$DB_DSN" -f db/migrations/2025_10_23_add_hnsw.sql
3) أعد بناء وتشغيل الخوادم:
   docker compose build web api
   docker compose up
4) اختبارات قبول:
   - /v1/dasc/extract: ارفع PDF رسمي من DASC (region=Najdi مثلًا).
   - /city/atlas: تأكد أن الخريطة تُظهر legend والـpass_rate.
   - /studio/3d: زر Enter VR (Beta) يظهر؛ لتمكين VR كامل استخدم HTTPS وأدرج @react-three/xr أو VRButton مع تهيئة renderer.
   - /v1/rag/search: اسأل عن بنود محددة وشاهد السرعة بعد HNSW.

ملاحظات:
- WebXR الكامل يتطلب سياق HTTPS ودعم المتصفح، وقد يلزم تبعية @react-three/xr عند الرغبة بتكامل تام مع react-three-fiber.
- بإمكانك تعديل نمط الانضمام للمدن/الهوية عبر GeoJSON في frontend/public/atlas/* وربطه بـ/metrics/cities.

بالتوفيق!
