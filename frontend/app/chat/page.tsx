"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Shield, Mic, Square, Send, Paperclip } from "lucide-react";

const T = {
  ar: {
    brand: "Sima AI — الاستوديو الحواري",
    hint: "بث فوري مع محاكاة عند غياب الخادم",
    language: "اللغة",
    role: "الدور",
    roles: { authority: "جهة اعتماد", consultant: "استشاري", client: "عميل" },
    attach: "إرفاق",
    mic: "صوت",
    stop: "إيقاف",
    send: "إرسال",
    placeholder: "اكتب سؤالك المعماري…",
    tools: "أدوات",
    toolsList: {
      dasc: "مطابقة DASC",
      solar: "محاكاة شمس/ظل",
      materials: "توصيات مواد محلية",
    },
    status: { connected: "متصل بالبث", simulating: "محاكاة محلية", disconnected: "غير متصل" },
    clear: "مسح المحادثة",
    dropHere: "اسحب وأسقط الملفات هنا",
  },
  en: {
    brand: "Sima AI — Chat Studio",
    hint: "Live streaming with local fallback",
    language: "Language",
    role: "Role",
    roles: { authority: "Authority", consultant: "Consultant", client: "Client" },
    attach: "Attach",
    mic: "Voice",
    stop: "Stop",
    send: "Send",
    placeholder: "Type your architectural prompt…",
    tools: "Tools",
    toolsList: {
      dasc: "DASC Compliance",
      solar: "Solar/Shadow Simulation",
      materials: "Local Materials Advice",
    },
    status: { connected: "Streaming connected", simulating: "Local simulation", disconnected: "Disconnected" },
    clear: "Clear chat",
    dropHere: "Drag & drop files here",
  }
};

type Lang = keyof typeof T;
type Role = "authority" | "consultant" | "client";
type Msg = { id: string; role: "user"|"assistant"|"tool"; text: string; ts: number; attachments?: string[] };

function seedAssistant(lang: Lang): Msg {
  const hello = lang === "ar"
    ? "مرحباً، أنا مساعد Sima المعماري. فعِّل الأدوات وحدد سؤالك وسأحلّل مباشرة."
    : "Hello, I am Sima's architectural assistant. Toggle tools, ask your question, and I'll analyze live.";
  return { id: rid(), role: "assistant", text: hello, ts: Date.now() };
}

export default function ChatPage(){
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang === "ar";
  useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  const [role, setRole] = useState<Role>("consultant");
  const [connected, setConnected] = useState<"off"|"sse"|"sim">("off");
  const [live, setLive] = useState("");

  const [tools, setTools] = useState({ dasc:true, solar:false, materials:false });

  const [files, setFiles] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  
  useEffect(() => {
    setMsgs([seedAssistant(lang)]);
  }, [lang]);

  const listRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); },[msgs.length]);

  const recRef = useRef<{rec:any; active:boolean}>({rec:null, active:false});
  
  function startVoice(){
    try{
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if(!SR){ alert("SpeechRecognition not supported"); return; }
      const rec = new SR(); rec.lang = rtl? "ar-SA" : "en-US"; rec.continuous = false; rec.interimResults = true;
      rec.onresult = (e:any)=>{
        let txt = ""; for(let i=0;i<e.results.length;i++){ txt += e.results[i][0].transcript; }
        setInput((p)=> p? (p+" "+txt) : txt);
      };
      rec.onend = ()=>{ recRef.current.active=false; };
      rec.start(); recRef.current = { rec, active:true };
    }catch{ /* ignore */ }
  }
  
  function stopVoice(){ try{ recRef.current.rec?.stop?.(); recRef.current.active=false; }catch{} }

  function speak(text:string){ try{ const u = new SpeechSynthesisUtterance(text); u.lang = rtl?"ar-SA":"en-US"; window.speechSynthesis.speak(u); }catch{} }

  function clearChat(){ setMsgs([seedAssistant(lang)]); }

  function buildPrompt(){
    const hints:string[] = [];
    if(tools.dasc) hints.push(rtl?"(مطابقة DASC)":"(DASC compliance)");
    if(tools.solar) hints.push(rtl?"(محاكاة شمس/ظل)":"(Solar/Shadow sim)");
    if(tools.materials) hints.push(rtl?"(مواد محلية)":"(Local materials)");
    const f = files.length? `\n${rtl?"مرفقات":"Attachments"}: ${files.join(", ")}` : "";
    return `${input} ${hints.join(" ")}${f}`.trim();
  }

  async function send(){
    const prompt = buildPrompt();
    if(!prompt) return;
    const userMsg: Msg = { id: rid(), role: "user", text: prompt, ts: Date.now(), attachments: files.slice() };
    setMsgs(m=>[...m, userMsg]);
    setInput(""); setFiles([]);

    // Professional mock responses
    const mockResponses = getMockResponse(prompt, lang, tools, role);
    
    // Simulate typing effect
    const assistantId = rid();
    setMsgs(m=>[...m, { id: assistantId, role: "assistant", text: "", ts: Date.now() }]);
    
    let currentText = "";
    for(let i = 0; i < mockResponses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      currentText += mockResponses[i];
      setMsgs(m => m.map(msg => 
        msg.id === assistantId ? { ...msg, text: currentText } : msg
      ));
    }
    
    speak(currentText);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>){
    const names = Array.from(e.target.files || []).map(f=>f.name);
    setFiles(prev=> Array.from(new Set([...prev, ...names])));
    e.currentTarget.value = "";
  }

  function onDrop(e: React.DragEvent){ e.preventDefault(); setDragOver(false);
    const names = Array.from(e.dataTransfer.files || []).map(f=>f.name);
    setFiles(prev=> Array.from(new Set([...prev, ...names])));
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><Spark/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{t.hint}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
              className="px-3 py-2 rounded-xl text-sm bg-slate-900 text-white hover:bg-slate-700"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <select value={role} onChange={e=>setRole(e.target.value as Role)} className="px-3 py-1.5 border rounded-xl text-sm">
              <option value="authority">{t.roles.authority}</option>
              <option value="consultant">{t.roles.consultant}</option>
              <option value="client">{t.roles.client}</option>
            </select>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid gap-4 md:grid-cols-[260px,1fr]">
        {/* Tools panel */}
        <aside className="p-4 border rounded-2xl bg-white h-fit">
          <div className="text-sm font-medium mb-2">{t.tools}</div>
          <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={tools.dasc} onChange={e=>setTools(s=>({...s,dasc:e.target.checked}))}/><span>{t.toolsList.dasc}</span></label>
          <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={tools.solar} onChange={e=>setTools(s=>({...s,solar:e.target.checked}))}/><span>{t.toolsList.solar}</span></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tools.materials} onChange={e=>setTools(s=>({...s,materials:e.target.checked}))}/><span>{t.toolsList.materials}</span></label>
          <div className="mt-3 text-[12px] text-slate-500">{connected==="sse"? t.status.connected : connected==="sim"? t.status.simulating : t.status.disconnected}</div>
        </aside>

        {/* Chat area */}
        <section className="grid grid-rows-[1fr,auto] h-[calc(100vh-9rem)]">
          <div ref={listRef} className="overflow-auto border rounded-2xl p-3 bg-slate-50">
            {msgs.map(m=> (
              <Message key={m.id} m={m} rtl={rtl} />
            ))}
          </div>

          {/* Composer */}
          <div className="mt-3">
            {files.length>0 && (
              <div className="mb-2 flex gap-2 flex-wrap">
                {files.map(f=> <span key={f} className="px-2 py-1 rounded-full text-[11px] border bg-white">{f}</span>)}
              </div>
            )}

            <div onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop} className={`border rounded-2xl bg-white p-2 ${dragOver?"ring-2 ring-sky-400":""}`}>
              <div className="flex items-end gap-2">
                <button title={t.attach} className="p-2 rounded-lg border bg-white"><Paperclip/></button>
                <input type="file" multiple onChange={onPickFiles} className="hidden" id="filepick"/>
                <label htmlFor="filepick" className="text-[12px] text-slate-500 cursor-pointer">{t.attach}</label>

                <textarea value={input} onChange={(e)=>setInput(e.target.value)} placeholder={t.placeholder} rows={2} className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"/>
                {recRef.current.active ? (
                  <button onClick={stopVoice} className="px-3 py-2 rounded-xl border text-sm"><Square/></button>
                ) : (
                  <button onClick={startVoice} className="px-3 py-2 rounded-xl border text-sm" title={t.mic}><Mic/></button>
                )}
                <button onClick={send} className="px-3 py-2 rounded-xl border text-sm"><Send/></button>
              </div>
              <div className="mt-1 text-[12px] text-slate-500">{dragOver? t.dropHere : ""}</div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <button onClick={clearChat} className="text-[12px] underline text-slate-600">{t.clear}</button>
              <div className="text-[11px] text-slate-500">{t.hint}</div>
            </div>
          </div>
        </section>
      </div>

      <div aria-live="polite" className="sr-only">{live}</div>

      <style>{`
        html{scroll-behavior:smooth}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

function Message({ m, rtl }: { m: Msg; rtl:boolean }){
  const isUser = m.role === "user"; const isTool = m.role === "tool"; const isAssistant = m.role === "assistant";
  const align = isUser? (rtl?"justify-start":"justify-end") : "justify-start";
  const tone = isUser? "bg-emerald-50 border-emerald-200" : isTool? "bg-sky-50 border-sky-200" : "bg-white border-slate-200";
  const label = isUser? "👤" : isTool? "🛠️" : "🤖";
  return (
    <div className={`mb-2 flex ${align}`}>
      <div className={`max-w-[82%] border rounded-2xl px-3 py-2 ${tone}`}>
        <div className="text-[11px] text-slate-500 mb-1">{label} — {new Date(m.ts).toLocaleTimeString()}</div>
        <div className="whitespace-pre-wrap text-sm leading-6">{m.text || "\u00A0"}</div>
        {m.attachments && m.attachments.length>0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {m.attachments.map(a=> <span key={a} className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] border">{a}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Spark(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="spark">
    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);} 

function getMockResponse(prompt: string, lang: Lang, tools: any, role: Role): string {
  const isAr = lang === 'ar';
  const lowerPrompt = prompt.toLowerCase();
  
  // Professional responses based on keywords and tools
  if (lowerPrompt.includes('واجهة') || lowerPrompt.includes('facade')) {
    return isAr ? 
      `تحليل معايير الواجهات النجدية:

• نسبة النوافذ إلى الجدران (WWR): 15-25%
• استخدام الحجر الجيري المحلي
• عناصر الحماية من الشمس (مشربيات)
• الألوان الترابية: RAL 1015, RAL 9010
• المداخل المنخفضة والأفنية الداخلية

${tools.dasc ? '✅ مطابقة DASC: معايير الهوية مستوفاة' : ''}
${tools.solar ? '☀️ محاكاة شمسية: تعرض مثالي للواجهة الجنوبية' : ''}` :
      `Najdi Facade Standards Analysis:

• Window-to-Wall Ratio (WWR): 15-25%
• Local limestone usage required
• Sun protection elements (mashrabiya)
• Earth-tone colors: RAL 1015, RAL 9010
• Low entrances and internal courtyards

${tools.dasc ? '✅ DASC Compliance: Identity standards met' : ''}
${tools.solar ? '☀️ Solar Simulation: Optimal south-facing exposure' : ''}`;
  }
  
  if (lowerPrompt.includes('مواد') || lowerPrompt.includes('material')) {
    return isAr ?
      `توصيات المواد المحلية:

🏠 الجدران:
• الحجر الجيري من محاجر الرياض
• الطوب الطيني المحروق

🪨 النوافذ:
• الخشب المعالج (السدر أو الجوز)
• زجاج مزدوج للعزل الحراري

🎨 التشطيبات:
• الجص المحلي الأبيض
• الدهانات الطبيعية` :
      `Local Materials Recommendations:

🏠 Walls:
• Riyadh limestone quarries
• Fired clay bricks

🪨 Windows:
• Treated cedar or walnut wood
• Double-glazed thermal insulation

🎨 Finishes:
• Local white plaster
• Natural earth pigments`;
  }
  
  if (lowerPrompt.includes('dasc') || lowerPrompt.includes('معايير')) {
    return isAr ?
      `تقييم مطابقة DASC:

📊 نتائج التحليل:
• الهوية المعمارية: 87%
• المناخ والبيئة: 92%
• السياق العمراني: 85%
• الوضيفة: 90%

✅ النتيجة الإجمالية: 88.5% - مقبول` :
      `DASC Compliance Assessment:

📊 Analysis Results:
• Architectural Identity: 87%
• Climate & Environment: 92%
• Urban Context: 85%
• Functionality: 90%

✅ Overall Score: 88.5% - APPROVED`;
  }
  
  // Default professional response
  return isAr ?
    `مرحباً بك في Sima AI! 🏢

أنا مساعدك المعماري الذكي. يمكنني مساعدتك في:

• تحليل معايير الواجهات النجدية
• تقييم مطابقة DASC
• توصيات المواد المحلية
• محاكاة الإضاءة والظلال

ما هو سؤالك المعماري اليوم؟` :
    `Welcome to Sima AI! 🏢

I'm your intelligent architectural assistant. I can help you with:

• Najdi facade standards analysis
• DASC compliance assessment
• Local materials recommendations
• Lighting and shadow simulation

What's your architectural question today?`;
}

function rid(){ return Math.random().toString(36).slice(2); }
function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }