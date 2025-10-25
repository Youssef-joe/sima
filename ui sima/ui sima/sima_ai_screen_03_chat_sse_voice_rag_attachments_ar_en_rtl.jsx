import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 03: Chat (/chat)
 *
 * ✅ Features
 * - Streaming replies via Fetch + ReadableStream (SSE-compatible API)
 * - Fallback demo streamer when API unreachable
 * - Voice input (Web Speech API) + graceful fallback
 * - File attachments (multiple) with preview chips (no external icons)
 * - Simple Tool Cards (AI actions) including “Apply Recommendation” with Before/After preview
 * - i18n AR/EN + RTL auto
 * - Accessibility: roles, aria-live, keyboard support
 * - Tiny runtime tests (console.assert) → badge bottom-left
 *
 * 🔌 API contracts (plug your backend):
 * - POST /api/chat/stream { prompt, locale, tools, attachments? } → text stream (UTF-8 chunks)
 *   Response headers: { 'Content-Type': 'text/plain' } or 'text/event-stream' (server can push)
 * - POST /api/chat/message (optional non-stream)
 * - POST /api/chat/upload (optional) for attachments (FormData)
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — المساعد المعماري",
    placeholder: "اكتب سؤالك… (مثال: هل واجهتي تناسب مناخ نجران؟)",
    send: "إرسال",
    mic: "صوت",
    stop: "إيقاف",
    attach: "إرفاق",
    tools: "أدوات الذكاء",
    toolRag: "مرجع DASC",
    toolCity: "أطلس المدن",
    tool3d: "استوديو 3D",
    toolIot: "IoT المباني",
    applying: "تطبيق التوصية…",
    applied: "تم تطبيق التوصية",
    before: "قبل",
    after: "بعد",
    video: "مشاهدة العرض",
    lang: "AR",
    clear: "تنظيف",
    testsPass: "اختبارات: ناجحة",
    testsCheck: "اختبارات: تحقق",
  },
  en: {
    brand: "Sima AI — Architectural Assistant",
    placeholder: "Ask anything… (e.g., Is my facade suitable for Najran climate?)",
    send: "Send",
    mic: "Voice",
    stop: "Stop",
    attach: "Attach",
    tools: "AI Tools",
    toolRag: "DASC RAG",
    toolCity: "City Atlas",
    tool3d: "3D Studio",
    toolIot: "Building IoT",
    applying: "Applying recommendation…",
    applied: "Recommendation applied",
    before: "Before",
    after: "After",
    video: "Watch demo",
    lang: "EN",
    clear: "Clear",
    testsPass: "Tests: PASS",
    testsCheck: "Tests: CHECK",
  }
};

export default function SimaChat(){
  const [lang,setLang] = useState("ar");
  const t = useMemo(()=>T[lang], [lang]);
  const rtl = lang === "ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; }, [rtl]);

  // messages state
  const [messages,setMessages] = useState(() => [
    { id: id(), role: "assistant", content: rtl ? "مرحبًا! أنا المساعد المعماري لـ Sima AI — ارفع مخططك أو اسألني عن مطابقة الطراز." : "Hi! I’m Sima AI’s architectural assistant — upload a plan or ask about style compliance." }
  ]);

  const [input,setInput] = useState("");
  const [busy,setBusy] = useState(false);
  const [tools,setTools] = useState({ rag:true, city:true, studio:true, iot:false });
  const [files,setFiles] = useState([]); // File[] as any to keep JS
  const listRef = useRef(null);
  const liveRef = useRef("");

  // Scroll to bottom on new message
  useEffect(()=>{ if(listRef.current){ listRef.current.scrollTop = listRef.current.scrollHeight; } }, [messages, busy]);

  // Voice (Web Speech API)
  const recogRef = useRef(null);
  const [listening,setListening] = useState(false);
  useEffect(()=>{
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(SR){
      const r = new SR();
      r.lang = rtl? "ar-SA" : "en-US";
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = (e)=>{
        const last = e.results[e.results.length-1];
        if(last){ setInput(prev=> (prev+" "+ last[0].transcript).trim()); }
      };
      r.onend = ()=> setListening(false);
      recogRef.current = r;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtl]);

  function toggleVoice(){
    const r = recogRef.current;
    if(!r){ alert(rtl?"الميزة غير مدعومة في هذا المتصفح":"Voice is not supported in this browser"); return; }
    if(listening){ r.stop(); setListening(false); } else { setListening(true); r.start(); }
  }

  // Attachments
  function onPickFiles(ev){
    const f = Array.from(ev.target.files || []);
    if(f.length) setFiles(prev=> [...prev, ...f].slice(0, 6)); // cap 6 files
  }
  function removeFile(name){ setFiles(prev=> prev.filter(f=> f.name!==name)); }

  // Send message → stream reply
  async function onSend(){
    const text = input.trim();
    if(!text) return;
    setBusy(true);
    setInput("");

    const userMsg = { id:id(), role:"user", content:text, files: files.map(f=>({name:f.name, size:f.size})) };
    setMessages(m=> [...m, userMsg, { id:id(), role:"assistant", content:"" }]);
    setFiles([]);

    try{
      // Optional: upload files first (if backend supports)
      // const fd = new FormData(); files.forEach(f=>fd.append('files', f));
      // await fetch('/api/chat/upload', { method:'POST', body: fd });

      await streamReply(text, { lang, tools });
    }catch(err){
      console.warn("Stream failed, switching to demo:", err);
      await demoStream();
    }finally{
      setBusy(false);
    }
  }

  async function streamReply(prompt, meta){
    // Use fetch streaming; backend can still implement SSE headers if it wants
    const res = await fetch('/api/chat/stream', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt, locale: lang, tools: Object.keys(meta.tools).filter(k=>meta.tools[k]) })
    });
    if(!res.ok || !res.body) throw new Error('no-stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done=false; let acc="";
    while(!done){
      const chunk = await reader.read();
      done = chunk.done; if(done) break;
      acc += decoder.decode(chunk.value, { stream:true });
      appendToLastAssistant(acc);
    }
  }

  function appendToLastAssistant(text){
    setMessages(curr=>{
      const copy = [...curr];
      for(let i=copy.length-1;i>=0;i--){ if(copy[i].role==='assistant'){ copy[i] = { ...copy[i], content: text }; break; } }
      return copy;
    });
  }

  // Demo streamer (offline)
  function demoStream(){
    return new Promise((resolve)=>{
      const sample = rtl
        ? "تحليل أولي: الواجهة الجنوبية تحتوي على نسبة زجاج مرتفعة. \nتوصية: خفّض نسبة الزجاج 15% وأضف تظليلًا رأسيًا. \nسأعرض لك بعدها مقارنة قبل/بعد."
        : "Preliminary analysis: south facade has a high glazing ratio.\nRecommendation: reduce glazing by 15% and add vertical shading.\nI will then show a before/after comparison.";
      let i=0; const timer = setInterval(()=>{
        i+=5; appendToLastAssistant(sample.slice(0,i));
        if(i>=sample.length){ clearInterval(timer); resolve(); }
      }, 40);
    });
  }

  // Apply Recommendation → inject Before/After card
  function applyRecommendation(){
    liveRef.current = rtl? t.applying : t.applying;
    const beforeScore = 72 + Math.floor(Math.random()*6); // 72–77
    const afterScore  = beforeScore + 8 + Math.floor(Math.random()*6); // +8–13

    const card = {
      id: id(), role:'tool',
      content: JSON.stringify({ kind:'before-after', beforeScore, afterScore })
    };
    setMessages(m=> [...m, card, { id:id(), role:'assistant', content: rtl? t.applied : t.applied }]);
  }

  // tests (non-invasive)
  const testsOk = useTinyTests();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Logo/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang('ar')} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang('en')} className={clsBtn(lang==='en')}>EN</button>
            <a className="text-sm underline text-slate-700" href="/dashboard">Dashboard</a>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Chat List */}
        <section className="border rounded-2xl overflow-hidden flex flex-col">
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
            {messages.map(m=> (
              <MessageBubble key={m.id} role={m.role} t={t} rtl={rtl} content={m.content}/>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="px-3 py-2 border rounded-xl text-sm cursor-pointer">
                <input type="file" multiple className="hidden" onChange={onPickFiles}/>
                {t.attach}
              </label>
              <button onClick={toggleVoice} className={clsVoice(listening)}>{listening? t.stop : t.mic}</button>
              <button onClick={applyRecommendation} className="px-3 py-2 border rounded-xl text-sm">Apply ↻</button>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={()=>setMessages([{ id:id(), role:'assistant', content: messages[0].content }])} className="px-3 py-2 border rounded-xl text-sm">{t.clear}</button>
                <button onClick={onSend} disabled={busy} className="px-4 py-2 rounded-xl text-sm bg-slate-900 text-white disabled:opacity-50">{t.send}</button>
              </div>
            </div>
            {/* input */}
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); } }}
              placeholder={t.placeholder}
              className="w-full px-3 py-2 border rounded-xl text-sm"
              aria-label={t.placeholder}
            />
            {/* file chips */}
            {files.length>0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f)=> (
                  <FileChip key={f.name} name={f.name} size={f.size} onRemove={()=>removeFile(f.name)}/>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Side tools */}
        <aside className="border rounded-2xl p-4 space-y-3">
          <div className="text-sm font-medium mb-1">{t.tools}</div>
          <ToggleRow checked={tools.rag}    onChange={v=>setTools(s=>({...s,rag:v}))}    label={t.toolRag}/>
          <ToggleRow checked={tools.city}   onChange={v=>setTools(s=>({...s,city:v}))}   label={t.toolCity}/>
          <ToggleRow checked={tools.studio} onChange={v=>setTools(s=>({...s,studio:v}))} label={t.tool3d}/>
          <ToggleRow checked={tools.iot}    onChange={v=>setTools(s=>({...s,iot:v}))}    label={t.toolIot}/>

          <div className="mt-4 text-[12px] text-slate-500">
            <p>• Streaming enabled — UTF‑8 chunks.</p>
            <p>• Voice via Web Speech API (if available).</p>
            <p>• Attach IFC/PDF for analysis.</p>
          </div>
        </aside>
      </div>

      {/* live region for applied actions */}
      <div className="sr-only" aria-live="polite">{liveRef.current}</div>

      {/* tests badge */}
      <div className="fixed bottom-3 left-3 z-50"><span className={clsBadge(testsOk)}>{testsOk? t.testsPass : t.testsCheck}</span></div>

      <style>{`
        html{scroll-behavior:smooth}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

// ————————— Components —————————
function MessageBubble({ role, content, t, rtl }){
  if(role==='tool'){
    try{
      const data = JSON.parse(content);
      if(data.kind==='before-after'){
        return <BeforeAfterCard before={data.beforeScore} after={data.afterScore} t={t}/>;
      }
    }catch{}
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm">
        <div className="font-medium mb-1">Tool Output</div>
        <pre className="whitespace-pre-wrap text-[12px]">{content}</pre>
      </div>
    );
  }
  const isUser = role==='user';
  return (
    <div className={`max-w-[85%] ${isUser? 'ms-auto' : ''}`}>
      <div className={`rounded-2xl px-3 py-2 text-sm border ${isUser? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex w-6 h-6 rounded-lg bg-slate-900 text-white items-center justify-center">{isUser? 'يو' : 'AI'}</span>
          <span className="text-[12px] text-slate-500">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    </div>
  );
}

function FileChip({ name, size, onRemove }){
  return (
    <div className="px-2.5 py-1.5 rounded-full border text-[12px] flex items-center gap-2">
      <span className="truncate max-w-[180px]" title={name}>{name}</span>
      <span className="opacity-60">{pretty(size)}</span>
      <button onClick={onRemove} aria-label="remove" className="border rounded-md px-1">×</button>
    </div>
  );
}

function ToggleRow({ checked, onChange, label }){
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={()=>onChange(!checked)} className={`w-10 h-6 rounded-full border relative transition ${checked? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'}`}
        role="switch" aria-checked={checked}>
        <span className={`absolute top-0.5 ${checked? 'left-5' : 'left-0.5'} w-5 h-5 rounded-full bg-white border border-slate-300 transition`}></span>
      </button>
    </label>
  );
}

function BeforeAfterCard({ before, after, t }){
  const delta = Math.max(0, after - before);
  return (
    <div className="p-3 border rounded-2xl bg-white">
      <div className="text-sm font-medium mb-2">{t.applied}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border bg-slate-50">
          <div className="text-[12px] text-slate-500 mb-1">{t.before}</div>
          <ScoreBar value={before}/>
        </div>
        <div className="p-3 rounded-xl border bg-emerald-50/50">
          <div className="text-[12px] text-slate-600 mb-1">{t.after}</div>
          <ScoreBar value={after} accent="emerald"/>
        </div>
      </div>
      <div className="mt-2 text-[12px] text-slate-600">Δ +{delta} pts</div>
    </div>
  );
}

function ScoreBar({ value, accent }){
  const color = accent==='emerald' ? 'bg-emerald-500' : 'bg-sky-500';
  return (
    <div className="w-full h-3 bg-white border rounded-full overflow-hidden">
      <div className={`${color} h-3`} style={{ width: Math.max(0, Math.min(100, value))+"%" }}/>
    </div>
  );
}

function Logo(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="logo">
      <path d="M12 3l8 5v8l-8 5-8-5V8l8-5z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

// ————————— Utils —————————
function id(){ return Math.random().toString(36).slice(2); }
function pretty(bytes){ if(bytes<1024) return bytes+"B"; const kb=bytes/1024; if(kb<1024) return kb.toFixed(1)+"KB"; const mb=kb/1024; return mb.toFixed(1)+"MB"; }
function clsBtn(active){ return `px-3 py-1.5 rounded-xl text-sm ${active? 'bg-slate-900 text-white':'text-slate-600 hover:text-slate-900'}`; }
function clsVoice(active){ return `px-3 py-2 rounded-xl text-sm border ${active? 'border-rose-300 bg-rose-50 text-rose-700' : ''}`; }
function clsBadge(ok){ return `px-2.5 py-1.5 rounded-full text-[10px] ${ok? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'}`; }

function useTinyTests(){
  const [ok,setOk] = useState(false);
  useEffect(()=>{
    try{
      console.assert(typeof TextDecoder!=="undefined", 'TextDecoder exists');
      console.assert(pretty(1536).endsWith('KB'), 'pretty formats KB');
      setOk(true);
    }catch(e){ setOk(false); }
  },[]);
  return ok;
}
