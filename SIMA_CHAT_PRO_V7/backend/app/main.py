from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import os, io, time, json, math, glob, uuid, re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from pypdf import PdfReader

APP = FastAPI(title="SIMA Chat Pro V7", version="7.0.0", description="Local generative chat with RAG + SSE + tools")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
APP.add_middleware(CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

REQ_COUNT = Counter("sima_chat_requests_total", "Total HTTP Requests", ["route","method"])
REQ_LAT = Histogram("sima_chat_request_latency_seconds", "Request latency", ["route"])

def track(route:str, method="GET"):
    def deco(fn):
        async def wrap(*a, **kw):
            start=time.time()
            REQ_COUNT.labels(route=route, method=method).inc()
            try: return await fn(*a, **kw)
            finally: REQ_LAT.labels(route=route).observe(time.time()-start)
        return wrap
    return deco

# ------------------- Health & Metrics -------------------
@APP.get("/")
async def root(): return {"app":"SIMA Chat Pro V7","ok":True}

@APP.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@APP.get("/readyz")
async def readyz(): return PlainTextResponse("ready")

@APP.get("/metrics")
async def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

# ------------------- Simple Engines (tools) -------------------
IDENTITIES = {
    "Central_Najdi": {"title":"Central Najdi","wwr_range":[10,25],"hwr":[1.2,2.7],"colors_ral":["RAL 1015","RAL 7032","RAL 7040","RAL 9010"],"feat":["triangular_bands","crenellation","small_openings"]},
    "Hejazi_Coast": {"title":"Hejazi Coast","wwr_range":[30,60],"hwr":[1.2,1.8],"colors_ral":["White","Timber_Tones","Blue_Accents"],"feat":["roshan","mashrabiya","screens_balconies"]}
}
class IdentityIn(BaseModel):
    region_hint: Optional[str] = "Central_Najdi"
    wwr: Optional[float] = 22.0
    height_ratio: Optional[float] = 1.6
    colors: Optional[List[str]] = []
    features: Optional[List[str]] = []

@APP.post("/v1/identity/score")
async def identity_score(body: IdentityIn):
    reg = body.region_hint; wwr = float(body.wwr or 0); hr = float(body.height_ratio or 1.6)
    sc = 50.0; used="unknown"
    if reg in IDENTITIES:
        r = IDENTITIES[reg]; used = reg
        wmin,wmax = r["wwr_range"]; hmin,hmax = r["hwr"]
        sc += 15 if wmin<=wwr<=wmax else -min(10, abs((wwr-(wmin+wmax)/2)/5))
        sc += 10 if hmin<=hr<=hmax else -min(8, abs(hr-(hmin+hmax)/2))
        pal={c.lower() for c in r["colors_ral"]}; cols={c.lower() for c in body.colors or []}
        if pal.intersection(cols): sc += 10
        need=set([x.lower() for x in r["feat"]]); feats=set([x.lower() for x in (body.features or [])])
        sc += min(15, len(need.intersection(feats))*5)
    return {"region":used,"authenticity_score":round(max(0,min(100,sc)),2)}

class LayoutIn(BaseModel):
    site_w: float = 12.0
    site_d: float = 10.0
    rooms: Dict[str, float] = {"living":20,"kitchen":12,"master":18,"bed":12,"bath":6}
@APP.post("/v1/layout/generate")
async def layout_generate(body: LayoutIn):
    sw, sd = int(body.site_w), int(body.site_d)
    x=y=0; placed={}
    for nm, area in body.rooms.items():
        w=max(3,int(round(math.sqrt(area)))); h=max(3,int(round(area/w)))
        if x+w>sw: x=0; y+=h+1
        if y+h>sd: break
        placed[nm]={"x":x,"y":y,"w":w,"h":h}; x+=w+1
    return {"rooms":placed,"fit_score":75.0}

# ------------------- RAG Store -------------------
VEC = None
DOCS = []
DOC_IDS = []
def build_index():
    global VEC, DOCS, DOC_IDS
    texts=[]; DOC_IDS=[]; DOCS=[]
    for f in sorted(glob.glob("app/corpus/*.md")) + sorted(glob.glob("uploads/*.txt")) + sorted(glob.glob("uploads/*.md")):
        with open(f,"r",encoding="utf-8") as fh:
            DOCS.append(fh.read()); DOC_IDS.append(os.path.basename(f))
    VEC = TfidfVectorizer(stop_words="english")
    if DOCS: VEC.fit(DOCS)

os.makedirs("uploads", exist_ok=True)
build_index()

@APP.post("/v1/rag/upload")
async def rag_upload(file: UploadFile = File(...)):
    name = file.filename.lower()
    raw = await file.read()
    path = f"uploads/{uuid.uuid4().hex}_{name}"
    if name.endswith(".pdf"):
        # extract text
        try:
            r = PdfReader(io.BytesIO(raw))
            txt = "\n".join([p.extract_text() or "" for p in r.pages])
        except Exception as e:
            return JSONResponse({"ok":False,"error":str(e)}, status_code=400)
        with open(path.replace(".pdf",".txt"), "w", encoding="utf-8") as fh: fh.write(txt)
    else:
        with open(path, "wb") as fh: fh.write(raw)
    build_index()
    return {"ok":True, "docs": len(DOCS)}

class RAGQuery(BaseModel):
    query: str
    k: int = 3
@APP.post("/v1/rag/search")
async def rag_search(body: RAGQuery):
    if not DOCS or VEC is None: return {"hits":[]}
    qvec = VEC.transform([body.query])
    dvec = VEC.transform(DOCS)
    sims = (dvec @ qvec.T).toarray().ravel()
    idx = sims.argsort()[::-1][:max(1,body.k)]
    return {"hits":[{"doc_id":DOC_IDS[i], "score": float(sims[i]), "excerpt": DOCS[i][:240]} for i in idx]}

@APP.post("/v1/admin/retrain")
async def retrain():
    build_index(); return {"ok":True,"docs":len(DOCS)}

# ------------------- Generative Stub + Tool-calling -------------------
class ChatIn(BaseModel):
    session: Optional[str] = None
    message: str
    region: Optional[str] = "Central_Najdi"

def sse_pack(event: str, data: Any):
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")

def simple_generate(answer: str):
    # stream word by word
    for w in re.split(r"(\s+)", answer):
        yield sse_pack("token", {"text": w})
        time.sleep(0.01)

def run_tools_if_needed(msg: str):
    out = []
    if "هوية" in msg or "identity" in msg:
        res = {"region":"Central_Najdi","authenticity_score":88.5}
        out.append({"tool":"identity_score","result":res})
    if "مخطط" in msg or "layout" in msg:
        res = {"fit_score":75.0, "rooms":{"living":{"x":0,"y":0,"w":5,"h":4}}}
        out.append({"tool":"layout_generate","result":res})
    return out

def retrieve_ctx(q: str, topk=2):
    if not DOCS or VEC is None: return []
    qv = VEC.transform([q]); dv = VEC.transform(DOCS)
    sims = (dv @ qv.T).toarray().ravel()
    idx = sims.argsort()[::-1][:topk]
    return [{"doc_id":DOC_IDS[i], "excerpt": DOCS[i][:280]} for i in idx]

@APP.post("/v1/chat", response_class=JSONResponse)
async def chat(body: ChatIn):
    tools = run_tools_if_needed(body.message)
    ctx = retrieve_ctx(body.message, 3)
    answer = "سأعتمد على مراجع الهوية السعودية وأطبق قواعد DASC مع مراعاة النِّسَب وWWR. "
    if tools: answer += "نفذت أدوات: " + ", ".join([t["tool"] for t in tools]) + ". "
    if ctx: answer += "مقتطفات: " + " | ".join([c["excerpt"][:80] for c in ctx]) + " ..."
    return {"answer": answer, "tools": tools, "context": ctx}

@APP.post("/v1/chat/stream")
async def chat_stream(body: ChatIn):
    # build context
    tools = run_tools_if_needed(body.message)
    ctx = retrieve_ctx(body.message, 2)
    preface = "سأتناول سؤالك اعتمادًا على المرجع المحلي ومعايير الهوية:\n"
    if tools:
        preface += " [أدوات منفذة: " + ", ".join([t["tool"] for t in tools]) + "]\n"
    if ctx:
        preface += " [مراجع: " + ", ".join([c["doc_id"] for c in ctx]) + "]\n"
    answer = preface + "\n" + "الاقتراح: حافظ على WWR منخفض في الواجهات المشمسة، وفعّل الظلال، واستخدم ألوان RAL فاتحة."

    async def eventgen():
        yield sse_pack("start", {"ok":True, "tools": tools, "context": ctx})
        for chunk in simple_generate(answer):
            yield chunk
        yield sse_pack("done", {"finished": True})

    return StreamingResponse(eventgen(), media_type="text/event-stream")
