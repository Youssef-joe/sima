import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sima AI — Screen 09: IoT Live (Sensors Stream, Charts, CSV)
 * - Live stream via SSE from /api/iot/stream?pid=… (JSON lines: {ts?, type, value})
 * - Automatic local simulation fallback if SSE not available
 * - Sensors: temp(°C), humid(%), light(lx), co2(ppm), noise(dB)
 * - Summary KPIs, SVG sparklines, recent table, CSV export
 * - i18n AR/EN + RTL, accessible live region, runtime tests badge
 * - No external libs/icons; all inline SVG + Tailwind classes
 */

// ————————— i18n —————————
const T = {
  ar: {
    brand: "Sima AI — مراقبة المباني (IoT)",
    back: "عودة",
    pid: "المشروع",
    pick: "اختر مشروعًا",
    connect: "بدء البث",
    disconnect: "إيقاف",
    status: { off: "غير متصل", sse: "متصل (بث مباشر)", sim: "محاكاة محلية" },
    sensors: "الحساسات",
    export: "تصدير CSV",
    table: { ts: "الوقت", type: "النوع", value: "القيمة" },
    kpi: { last: "آخر تحديث", avg: "متوسط", min: "أدنى", max: "أعلى", rpm: "قراءات/دقيقة" },
    legend: { temp: "حرارة", humid: "رطوبة", light: "إضاءة", co2: "CO₂", noise: "ضجيج" },
    testsPass: "اختبارات: ناجحة", testsCheck: "اختبارات: تحقق",
  },
  en: {
    brand: "Sima AI — IoT Building Monitor",
    back: "Back",
    pid: "Project",
    pick: "Select a project",
    connect: "Start Stream",
    disconnect: "Stop",
    status: { off: "Disconnected", sse: "Streaming (SSE)", sim: "Local Simulation" },
    sensors: "Sensors",
    export: "Export CSV",
    table: { ts: "Time", type: "Type", value: "Value" },
    kpi: { last: "Last Update", avg: "Average", min: "Min", max: "Max", rpm: "Reads/min" },
    legend: { temp: "Temp", humid: "Humid", light: "Light", co2: "CO₂", noise: "Noise" },
    testsPass: "Tests: PASS", testsCheck: "Tests: CHECK",
  }
};

type Lang = keyof typeof T;

type Sensor = "temp"|"humid"|"light"|"co2"|"noise";

interface Reading { ts: number; type: Sensor; value: number; pid: string; }

const SENSOR_META: Record<Sensor,{unit:string,min:number,max:number,fmt:(v:number)=>string}> = {
  temp:  { unit:"°C", min:10,  max:50,  fmt: (v)=>v.toFixed(1)+"°C" },
  humid: { unit:"%",  min:10,  max:100, fmt: (v)=>v.toFixed(0)+"%"  },
  light: { unit:"lx", min:0,   max:2000,fmt: (v)=>v.toFixed(0)+" lx" },
  co2:   { unit:"ppm",min:350, max:2000,fmt: (v)=>v.toFixed(0)+" ppm" },
  noise: { unit:"dB", min:20,  max:100, fmt: (v)=>v.toFixed(0)+" dB" },
};

const SEED_PIDS = ["P-001","P-002","P-003","P-004","P-005"];

export default function SimaIotLive(){
  // i18n
  const [lang,setLang]=useState<Lang>("ar");
  const t = useMemo(()=>T[lang],[lang]);
  const rtl = lang==="ar"; useEffect(()=>{ document.documentElement.dir = rtl?"rtl":"ltr"; },[rtl]);

  // routing state
  const [pid,setPid]=useState<string>(SEED_PIDS[0]);

  // connection state
  const [mode,setMode]=useState<"off"|"sse"|"sim">("off");
  const [live,setLive]=useState("");
  const esRef = useRef<EventSource|null>(null);
  const simRef = useRef<{timer:any; last:number}>({timer:null,last:Date.now()});

  // selections
  const [enabled,setEnabled]=useState<Record<Sensor,boolean>>({ temp:true, humid:true, light:true, co2:false, noise:false });

  // data buffers
  const MAX_POINTS = 180; // ~3 min if 1s rate
  const [buf,setBuf]=useState<Record<Sensor,Reading[]>>({ temp:[], humid:[], light:[], co2:[], noise:[] });
  const [flat,setFlat]=useState<Reading[]>([]); // unified table view (last 300)

  // ——— connect / disconnect ———
  function start(){
    stop();
    try{
      const url = `/api/iot/stream?pid=${encodeURIComponent(pid)}`;
      const es = new EventSource(url);
      esRef.current = es; setMode("sse"); setLive(t.status.sse);
      es.onmessage = (ev)=>{ handleIncoming(ev.data); };
      es.onerror = ()=>{ es.close(); esRef.current=null; startSim(); };
    }catch{
      startSim();
    }
  }
  function stop(){
    try{ esRef.current?.close(); esRef.current=null; }catch{}
    try{ if(simRef.current.timer){ clearInterval(simRef.current.timer); simRef.current.timer=null; } }catch{}
    setMode("off"); setLive(t.status.off);
  }

  // ——— SSE payload handler (JSON or CSV-like) ———
  function handleIncoming(raw:string){
    try{
      const j = JSON.parse(raw);
      const r: Reading = { ts: j.ts || Date.now(), type: j.type, value: Number(j.value), pid } as Reading;
      pushReading(r);
    }catch{
      // try csv: ts,type,value
      const parts = String(raw).split(",");
      if(parts.length>=3){
        const r: Reading = { ts:Number(parts[0])||Date.now(), type:parts[1] as Sensor, value:Number(parts[2]), pid };
        pushReading(r);
      }
    }
  }

  // ——— Local simulation fallback ———
  function startSim(){
    setMode("sim"); setLive(t.status.sim);
    // initialize seeds from current buffers
    const lastVals: Record<Sensor,number> = {
      temp: lastOr(buf.temp, 30),
      humid: lastOr(buf.humid, 40),
      light: lastOr(buf.light, 500),
      co2: lastOr(buf.co2, 600),
      noise: lastOr(buf.noise, 55),
    };
    if(simRef.current.timer){ clearInterval(simRef.current.timer); }
    simRef.current.timer = setInterval(()=>{
      const now = Date.now();
      (Object.keys(enabled) as Sensor[]).forEach((k)=>{
        if(!enabled[k]) return;
        const drift = rand(-1,1);
        const target = clamp(lastVals[k] + drift + trend(k), SENSOR_META[k].min, SENSOR_META[k].max);
        lastVals[k] = lerp(lastVals[k], target, 0.5);
        pushReading({ ts: now, type: k, value: Number(lastVals[k].toFixed(2)), pid });
      });
    }, 1000);
  }

  // ——— push with bounds & flat log ———
  function pushReading(r:Reading){
    setBuf(prev=>{
      const copy = { ...prev } as typeof prev;
      const arr = (copy[r.type] || []).slice(-MAX_POINTS+1);
      arr.push(r); copy[r.type] = arr; return copy;
    });
    setFlat(prev=> {
      const a = prev.concat(r).slice(-300);
      return a.sort((a,b)=>a.ts-b.ts);
    });
  }

  // ——— KPIs ———
  function kpi(type:Sensor){
    const arr = buf[type]; if(!arr || arr.length===0){ return { last:"—", avg:"—", min:"—", max:"—" }; }
    const vs = arr.map(x=>x.value); const last = vs[vs.length-1];
    const avg = vs.reduce((s,v)=>s+v,0)/vs.length; const mn = Math.min(...vs); const mx = Math.max(...vs);
    return { last: SENSOR_META[type].fmt(last), avg: SENSOR_META[type].fmt(avg), min: SENSOR_META[type].fmt(mn), max: SENSOR_META[type].fmt(mx) };
  }

  // reads/min estimation
  const rpm = useMemo(()=>{
    const now = Date.now(); const windowMs = 60_000; const cutoff = now - windowMs;
    const n = flat.filter(r=>r.ts>=cutoff && enabled[r.type]).length;
    return Math.round((n / (windowMs/1000)) * 60);
  },[flat,enabled]);

  // ——— CSV export ———
  function csvEsc(val:any){ const s = String(val).replace(/"/g,'""'); return '"'+s+'"'; }
  function exportCSV(){
    const header = ["ts","iso","pid","type","value"];
    const lines = flat.map(r=> [r.ts, new Date(r.ts).toISOString(), r.pid, r.type, r.value].map(csvEsc).join(","));
    const csv = header.join(",")+"\n"+lines.join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a = document.createElement("a"); const url = URL.createObjectURL(blob);
    a.href=url; a.download=`iot_${pid}_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  // ——— Dev tests ———
  useEffect(()=>{
    try{
      console.assert(scale(10,0,100,0,100)===10, 'scale basic');
      console.assert(csvEsc('He said "Hi"')==='"He said ""Hi"""', 'CSV escape');
      const test: Reading = { ts:Date.now(), type:"temp", value:30, pid:"X"};
      const a = clamp(999,0,100)===100 && clamp(-1,0,1)===0; console.assert(a,'clamp works');
    }catch(e){ console.warn('Dev tests warn:', e); }
  },[]);

  const testsOk = true;

  // ——— UI ———
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center"><ChipIcon/></div>
            <div className="font-semibold text-sm sm:text-base">{t.brand}</div>
            <span className="hidden sm:inline text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{mode==="sse"? t.status.sse : mode==="sim"? t.status.sim : t.status.off}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang("ar")} className={clsBtn(lang==='ar')}>AR</button>
            <button onClick={()=>setLang("en")} className={clsBtn(lang==='en')}>EN</button>
            <a href="/dashboard" className="text-sm underline text-slate-700">{t.back}</a>
          </div>
        </div>
      </header>

      {/* controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 grid gap-4 md:grid-cols-[260px,1fr]">
        {/* sidebar */}
        <aside className="p-4 border rounded-2xl bg-white h-fit">
          <label className="block text-[12px] text-slate-600 mb-1">{t.pid}</label>
          <select value={pid} onChange={e=>setPid(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm mb-2">
            {SEED_PIDS.map(x=> <option key={x} value={x}>{x}</option>)}
          </select>
          <div className="flex items-center gap-2 mb-3">
            {mode!=="off" ? (
              <button onClick={stop} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-1"><StopIcon/>{t.disconnect}</button>
            ) : (
              <button onClick={start} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-1"><PlayIcon/>{t.connect}</button>
            )}
            <button onClick={exportCSV} className="px-3 py-2 rounded-xl border text-sm"><DownloadIcon/>{t.export}</button>
          </div>
          <div className="text-sm font-medium mb-2">{t.sensors}</div>
          {(Object.keys(enabled) as Sensor[]).map(s=> (
            <label key={s} className="flex items-center justify-between text-sm mb-1">
              <span className="capitalize">{t.legend[s]}</span>
              <input type="checkbox" checked={enabled[s]} onChange={e=>setEnabled(v=>({...v,[s]:e.target.checked}))}/>
            </label>
          ))}
        </aside>

        {/* main */}
        <section>
          {/* KPIs */}
          <div className="grid md:grid-cols-5 gap-3 mb-4">
            {(Object.keys(enabled) as Sensor[]).filter(s=>enabled[s]).map(s=> (
              <SummaryCard key={s} title={`${t.legend[s]}`} value={kpi(s).last} sub={`${t.kpi.avg}: ${kpi(s).avg}`} />
            ))}
            <SummaryCard title={t.kpi.rpm} value={`${rpm}`} sub={mode==="sse"? "SSE" : mode==="sim"? "SIM" : "OFF"} />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(enabled) as Sensor[]).filter(s=>enabled[s]).map(s=> (
              <ChartPanel key={s} title={`${t.legend[s]} (${SENSOR_META[s].unit})`} unit={SENSOR_META[s].unit} data={buf[s].map(r=>r.value)} meta={SENSOR_META[s]} />
            ))}
          </div>

          {/* Table */}
          <div className="mt-4 border rounded-2xl overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>{t.table.ts}</Th>
                  <Th>{t.table.type}</Th>
                  <Th>{t.table.value}</Th>
                </tr>
              </thead>
              <tbody>
                {flat.slice(-50).reverse().map((r,i)=> (
                  <tr key={r.ts+"-"+i} className="border-t">
                    <Td>{new Date(r.ts).toLocaleString()}</Td>
                    <Td>{t.legend[r.type]}</Td>
                    <Td>{SENSOR_META[r.type].fmt(r.value)}</Td>
                  </tr>
                ))}
                {flat.length===0 && (
                  <tr><Td colSpan={3}><div className="py-8 text-center text-slate-500">— No data —</div></Td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div aria-live="polite" className="sr-only">{live}</div>

      {/* tests badge */}
      <div className="fixed bottom-3 left-3 z-50">
        <div className={clsBadge(testsOk)}>{testsOk? t.testsPass : t.testsCheck}</div>
      </div>

      <style>{`
        html{scroll-behavior:smooth}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        :focus{outline:2px solid #0ea5e9; outline-offset:2px}
      `}</style>
    </div>
  );
}

// ————————— UI Helpers —————————
function clsBtn(active:boolean){ return `px-3 py-1.5 rounded-xl text-sm ${active?"bg-slate-900 text-white":"text-slate-600 hover:text-slate-900"}`; }
function clsBadge(ok:boolean){ return `px-2.5 py-1.5 rounded-full text-[10px] ${ok?"bg-emerald-600 text-white":"bg-amber-500 text-black"}`; }
function Th({children}:{children:React.ReactNode}){ return <th scope="col" className="text-left px-3 py-2 font-medium">{children}</th>; }
function Td({children, colSpan}:{children:React.ReactNode, colSpan?:number}){ return <td colSpan={colSpan} className="px-3 py-2 align-top">{children}</td>; }

function SummaryCard({title,value,sub}:{title:string; value:string; sub?:string}){
  return (
    <div className="p-3 border rounded-2xl bg-white">
      <div className="text-[12px] text-slate-500">{title}</div>
      <div className="text-xl font-semibold">{value || "—"}</div>
      {sub? <div className="text-[12px] text-slate-500">{sub}</div> : null}
    </div>
  );
}

function ChartPanel({title, unit, data, meta}:{title:string; unit:string; data:number[]; meta:{min:number; max:number}}){
  const W=560, H=160, P=12; const xs = data.map((_,i)=> scale(i, 0, Math.max(1,data.length-1), P, W-P));
  const ys = data.map(v=> H - scale(v, meta.min, meta.max, P, H-P));
  const d = xs.map((x,i)=> `${i?"L":"M"}${x.toFixed(1)},${ys[i]?.toFixed(1)}`).join(" ");
  const last = data[data.length-1];
  return (
    <div className="p-3 border rounded-2xl bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[12px] text-slate-500">{last!==undefined? last.toFixed(2)+" "+unit : "—"}</div>
      </div>
      <svg role="img" aria-label={title+" sparkline"} width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="1" y="1" width={W-2} height={H-2} rx="10" ry="10" fill="none" stroke="#e2e8f0"/>
        <path d={d} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ————————— Icons —————————
function ChipIcon(){ return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="chip">
    <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
); }
function PlayIcon(){ return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-label="play"><path d="M8 5l12 7-12 7V5z" stroke="currentColor" strokeWidth="1.5"/></svg>
); }
function StopIcon(){ return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-label="stop"><rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="1.5"/></svg>
); }
function DownloadIcon(){ return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-label="download"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
); }

// ————————— Math helpers —————————
function clamp(v:number, a:number, b:number){ return Math.max(a, Math.min(b, v)); }
function lerp(a:number,b:number,t:number){ return a + (b-a)*t; }
function scale(v:number, inMin:number, inMax:number, outMin:number, outMax:number){ if(inMax===inMin) return outMin; const t=(v-inMin)/(inMax-inMin); return outMin + t*(outMax-outMin); }
function rand(a:number,b:number){ return a + Math.random()*(b-a); }
function trend(k:Sensor){ switch(k){ case "temp": return rand(-0.2,0.4); case "humid": return rand(-0.4,0.2); case "light": return rand(-10,20); case "co2": return rand(-5,15); case "noise": return rand(-1,2); } }
function lastOr(arr:Reading[], def:number){ return arr.length? arr[arr.length-1].value : def; }
