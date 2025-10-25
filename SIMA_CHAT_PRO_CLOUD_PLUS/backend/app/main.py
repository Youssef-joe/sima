from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, io, json, time, math, glob, uuid, re, asyncio
import numpy as np
import httpx
from sklearn.feature_extraction.text import TfidfVectorizer
from pypdf import PdfReader
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

APP = FastAPI(title="SIMA Chat Pro Cloud+", description="Local-first Saudi RAG + optional cloud relay", version="8.0.0")
origins = os.getenv("CORS_ORIGINS","http://localhost:3000").split(",")
APP.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in origins],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

REQ_COUNT = Counter("sima_cloud_chat_requests_total","Total HTTP Requests",["route","method"])
REQ_LAT = Histogram("sima_cloud_chat_request_latency_seconds","Request latency",["route"])

def track(route, method="GET"):
    def deco(fn):
        async def wrap(*a, **kw):
            s=time.time()
            REQ_COUNT.labels(route=route, method=method).inc()
            try: return await fn(*a, **kw)
            finally: REQ_LAT.labels(route=route).observe(time.time()-s)
        return wrap
    return deco

@APP.get("/")
async def root(): return {"app":"SIMA Chat Pro Cloud+","ok":True,"mode":os.getenv("MODE","local")}

@APP.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@APP.get("/readyz")
async def readyz(): return PlainTextResponse("ready")

@APP.get("/metrics")
async def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

# ---------------- RAG STORE ----------------
VEC=None; DOCS=[]; DOC_IDS=[]
def build_index():
    global VEC, DOCS, DOC_IDS
    DOCS=[]; DOC_IDS=[]
    for f in sorted(glob.glob("app/corpus/*.md")) + sorted(glob.glob("uploads/*.txt")) + sorted(glob.glob("uploads/*.md")):
        with open(f,"r",encoding="utf-8") as fh:
            DOCS.append(fh.read()); DOC_IDS.append(os.path.basename(f))
    VEC = TfidfVectorizer(stop_words="english")
    if DOCS: VEC.fit(DOCS)

os.makedirs("uploads", exist_ok=True)
build_index()

class RAGQuery(BaseModel):
    query:str; k:int=4

@APP.post("/v1/rag/search")
async def rag_search(body: RAGQuery):
    if not DOCS: return {"hits":[]}
    qv = VEC.transform([body.query]); dv = VEC.transform(DOCS)
    sims = (dv @ qv.T).toarray().ravel()
    idx = sims.argsort()[::-1][:body.k]
    hits=[{"doc_id":DOC_IDS[i],"score":float(sims[i]),"excerpt":DOCS[i][:280]} for i in idx]
    return {"hits": hits}

@APP.post("/v1/rag/upload")
async def rag_upload(file: UploadFile = File(...)):
    raw = await file.read()
    name=file.filename.lower()
    path=f"uploads/{uuid.uuid4().hex}_{name}"
    if name.endswith(".pdf"):
        # extract PDF
        try:
            r=PdfReader(io.BytesIO(raw))
            txt="\n".join([p.extract_text() or "" for p in r.pages])
            path=path.replace(".pdf",".txt")
            with open(path,"w",encoding="utf-8") as fh: fh.write(txt)
        except Exception as e:
            return JSONResponse({"ok":False,"error":str(e)}, status_code=400)
    else:
        with open(path,"wb") as fh: fh.write(raw)
    build_index()
    return {"ok":True,"docs":len(DOCS)}

@APP.post("/v1/admin/retrain")
async def retrain(): build_index(); return {"ok":True,"docs":len(DOCS)}

# --------------- TOOLS (Local SIMA Engines subset) ---------------
class IdentityIn(BaseModel):
    region_hint: Optional[str]="Central_Najdi"; wwr: Optional[float]=22.0; height_ratio: Optional[float]=1.6
    colors: Optional[List[str]]=[]; features: Optional[List[str]]=[]
IDENTITIES={
 "Central_Najdi":{"title":"Central Najdi","wwr":[10,25],"hwr":[1.2,2.7],"palette":["RAL 1015","RAL 7032","RAL 7040","RAL 9010"],"feat":["triangular_bands","crenellation","small_openings"]},
 "Hejazi_Coast":{"title":"Hejazi","wwr":[30,60],"hwr":[1.2,1.8],"palette":["White","Timber_Tones","Blue_Accents"],"feat":["roshan","mashrabiya","screens_balconies"]},
}

@APP.post("/v1/identity/score")
async def identity_score(body: IdentityIn):
    reg=body.region_hint; wwr=float(body.wwr); hr=float(body.height_ratio); score=50.0; used="unknown"
    if reg in IDENTITIES:
        r=IDENTITIES[reg]; used=reg
        wmin,wmax=r["wwr"]; hmin,hmax=r["hwr"]
        score += 15 if wmin<=wwr<=wmax else -min(10, abs((wwr-(wmin+wmax)/2)/5))
        score += 10 if hmin<=hr<=hmax else -min(8, abs(hr-(hmin+hmax)/2))
        pal=set([c.lower() for c in r["palette"]]); cols=set([c.lower() for c in (body.colors or [])])
        if pal.intersection(cols): score+=10
        need=set([x.lower() for x in r["feat"]]); feats=set([x.lower() for x in (body.features or [])])
        score+=min(15, len(need.intersection(feats))*5)
    return {"region":used,"authenticity_score":round(max(0,min(100,score)),2)}

class LayoutIn(BaseModel):
    site_w: float=12.0; site_d: float=10.0; rooms: Dict[str,float]={"living":20,"kitchen":12,"master":18,"bed":12,"bath":6}
@APP.post("/v1/layout/generate")
async def layout_generate(body: LayoutIn):
    sw,sd=int(body.site_w),int(body.site_d); x=y=0; placed={}
    for nm,area in body.rooms.items():
        w=max(3,int(round(math.sqrt(area)))); h=max(3,int(round(area/w)))
        if x+w>sw: x=0; y+=h+1
        if y+h>sd: break
        placed[nm]={"x":x,"y":y,"w":w,"h":h}; x+=w+1
    return {"rooms":placed,"fit_score":75.0}

# --------------- HYBRID ORCHESTRATION ---------------
class ChatIn(BaseModel):
    message: str; session: Optional[str]=None; region: Optional[str]="Central_Najdi"; mode: Optional[str]=None

def sse_pack(event, data): return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")

async def call_local_llm(prompt: str):
    url = os.getenv("LOCAL_LLM_URL","http://llm:7070/generate")
    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", url, json={"prompt":prompt}) as r:
            async for chunk in r.aiter_bytes():
                yield chunk

async def call_cloud_llm(prompt: str):
    relay = os.getenv("CLOUD_RELAY_URL")  # optional
    if not relay:
        # fallback to local if cloud not configured
        async for c in call_local_llm(prompt):
            yield c
        return
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", relay, json={"prompt":prompt}) as r:
            async for chunk in r.aiter_bytes():
                yield chunk

def retrieve_ctx(q: str, k=4):
    if not DOCS: return []
    qv = VEC.transform([q]); dv = VEC.transform(DOCS)
    sims=(dv @ qv.T).toarray().ravel()
    idx=sims.argsort()[::-1][:k]
    return [{"doc_id":DOC_IDS[i], "excerpt":DOCS[i][:240]} for i in idx]

def tool_router(msg: str):
    actions=[]
    if ("هوية" in msg) or ("identity" in msg):
        actions.append(("identity", {"region_hint":"Central_Najdi","wwr":22.0,"height_ratio":1.6}))
    if ("مخطط" in msg) or ("layout" in msg):
        actions.append(("layout", {}))
    return actions

@APP.post("/v1/chat/stream")
async def chat_stream(body: ChatIn):
    mode = body.mode or os.getenv("MODE","local")
    ctx = retrieve_ctx(body.message, 3)
    tools = tool_router(body.message)
    preamble = "سياسة SIMA: نبدأ بالهوية السعودية (RAG محلي) ثم نوسع عند الحاجة.\\n"
    preamble += "[مراجع] " + ", ".join([c["doc_id"] for c in ctx]) + "\\n"
    if tools: preamble += "[أدوات] " + ", ".join([t[0] for t in tools]) + "\\n"
    prompt = preamble + "\\n" + f"السؤال: {body.message}\\nأجب باحترافية مع اقتراحات قابلة للتطبيق محليًا."

    async def events():
        yield sse_pack("start", {"ok":True, "mode": mode, "context": ctx, "tools": [t[0] for t in tools]})
        # synthesize tool results quickly (non-blocking demo)
        if tools:
            results=[]
            for t,_ in tools:
                if t=="identity":
                    res = {"region":"Central_Najdi","authenticity_score":88.5}
                elif t=="layout":
                    res = {"fit_score":75.0}
                else: res={"ok":True}
                results.append({"tool":t,"result":res})
            yield sse_pack("tools", results)
        # choose engine
        if mode=="local":
            async for c in call_local_llm(prompt): yield c
        elif mode=="hybrid":
            # try local first for 1s, then switch to cloud continuation
            deadline = time.time()+1.0
            async for c in call_local_llm(prompt):
                yield c
                if time.time()>deadline: break
            async for c in call_cloud_llm(prompt + "\\nأكمل باقتراحات عالمية متوافقة مع الهوية السعودية."):
                yield c
        else: # cloud
            async for c in call_cloud_llm(prompt): yield c
        yield sse_pack("done", {"finished":True})

    return StreamingResponse(events(), media_type="text/event-stream")
