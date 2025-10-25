export default function Docs(){
  return (
    <main style={{padding:20}}>
      <h2>واجهات الـAPI</h2>
      <ul>
        <li>/v1/chat — رد فوري مع سياق</li>
        <li>/v1/chat/stream — بث SSE</li>
        <li>/v1/rag/upload — رفع ملفات (PDF/MD/TXT)</li>
        <li>/v1/rag/search — بحث سياقي</li>
        <li>/v1/admin/retrain — إعادة بناء الفهرس</li>
        <li>/v1/identity/score — أداة الهوية</li>
        <li>/v1/layout/generate — أداة المخطط</li>
      </ul>
    </main>
  );
}
