from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, io, time, json
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

APP_NAME = "SIMA AI v7 — PROFESSIONAL"
app = FastAPI(title=APP_NAME, version="v7")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in origins],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

REQ_COUNT = Counter("sima_requests_total", "Total HTTP Requests", ["route","method"])
REQ_LAT = Histogram("sima_request_latency_seconds", "Request latency", ["route"])

def metric(route, method="GET"):
    def deco(fn):
        async def wrap(*a, **kw):
            start = time.time()
            REQ_COUNT.labels(route=route, method=method).inc()
            try:
                return await fn(*a, **kw)
            finally:
                REQ_LAT.labels(route=route).observe(time.time()-start)
        return wrap
    return deco

@app.get("/") async def root(): return {"app": APP_NAME, "ok": True}
@app.get("/healthz") async def healthz(): return PlainTextResponse("ok")
@app.get("/readyz") async def readyz(): return PlainTextResponse("ready")
@app.get("/metrics") async def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

# --- Identity & materials (appear from v1) ---
IDENTITIES = {"Central_Najdi": {"title": "Central Najdi", "wwr_range": [10, 25], "height_to_width_ratio": [1.2, 2.7], "colors_ral": ["RAL 1015", "RAL 7032", "RAL 7040", "RAL 9010"], "key_features": ["triangular_bands", "crenellation", "small_openings", "projecting_turmah", "asymmetry"]}, "Hejazi_Coast": {"title": "Hejazi Coast", "wwr_range": [30, 60], "height_to_width_ratio": [1.2, 1.8], "colors_ral": ["White", "Timber_Tones", "Blue_Accents"], "key_features": ["roshan", "mashrabiya", "screens_balconies", "tripartite_facade"]}}
class IdentityIn(BaseModel):
    region_hint: Optional[str] = None
    wwr: Optional[float] = 22.0
    height_ratio: Optional[float] = 1.6
    colors: Optional[List[str]] = []
    features: Optional[List[str]] = []

@app.get("/v1/styles")
async def styles():
    return {"styles":[{"id":k,"title":v["title"],"wwr_range":v["wwr_range"],"height_ratio":v["height_to_width_ratio"],"key_features":v["key_features"][:5]} for k,v in IDENTITIES.items()]}

@app.post("/v1/identity/score")
async def identity_score(body: IdentityIn):
    region = body.region_hint
    wwr = float(body.wwr or 0); hr = float(body.height_ratio or 1.6)
    cols = [c.lower() for c in (body.colors or [])]; feats = [f.lower() for f in (body.features or [])]
    score = 50.0; used = "unknown"
    if region in IDENTITIES:
        used = region; r = IDENTITIES[region]
        wmin, wmax = r["wwr_range"]; hmin, hmax = r["height_to_width_ratio"]
        score += 15 if wmin <= wwr <= wmax else -min(10, abs((wwr-(wmin+wmax)/2)/5))
        score += 10 if hmin <= hr <= hmax else -min(8, abs(hr-(hmin+hmax)/2))
        pal = set([c.lower() for c in r["colors_ral"]])
        if any(c in pal for c in cols): score += 10
        need = set([x.lower() for x in r["key_features"]]); overlap = len(need.intersection(set(feats)))
        score += min(15, overlap*5)
    return {"region":used, "authenticity_score": round(max(0,min(100,score)),2)}

@app.post("/v1/3d/reconstruct")
async def reconstruct(width: float = Form(6.0), depth: float = Form(4.0), height: float = Form(3.0)):
    verts = [[0,0,0],[width,0,0],[width,depth,0],[0,depth,0],[0,0,height],[width,0,height],[width,depth,height],[0,depth,height]]
    faces = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]
    return {"meshes":[{"name":"room","vertices":verts,"faces":faces,"material":{"color":"#ddd"}}],
            "summary":{"bbox":[width,depth,height]}}

@app.post("/v1/vision/analyze")
async def vision_analyze(file: UploadFile = File(...)):
    content = await file.read()
    return {"predicted_regions":[{"region":"Central_Najdi","confidence":0.62},{"region":"Hejazi_Coast","confidence":0.2}],
            "notes":[f"Received {file.filename} ({len(content)} bytes). Demo"]}

CORPUS = {"ksa":"KSA identities emphasize regional cues.", "najdi":"Najdi uses modest WWR and light tones.", "hejazi":"Hejazi uses Roshan/Mashrabiya and white plaster."}
class ChatIn(BaseModel): message: str; region: Optional[str] = None
@app.post("/v1/chat")
async def chat(body: ChatIn):
    msg = (body.message or "").lower(); ctx=[]
    if "najdi" in msg or (body.region and "najdi" in body.region.lower()): ctx.append(("najdi", CORPUS["najdi"]))
    if "hejazi" in msg or (body.region and "hejazi" in body.region.lower()): ctx.append(("hejazi", CORPUS["hejazi"]))
    if not ctx: ctx.append(("ksa", CORPUS["ksa"]))
    ans = "ملخص: " + " | ".join([f"{k}:{v[:80]}..." for k,v in ctx])
    return {"answer": ans, "context":[{"doc":k,"excerpt":v} for k,v in ctx]}

class UrbanIn(BaseModel):
    lighting: int = 50; greenery: int = 50; mobility: int = 50; culture: int = 50
@app.post("/v1/simulator/urban")
async def simulator_urban(body: UrbanIn):
    comfort = round(0.4*body.greenery + 0.3*body.lighting + 0.2*body.mobility + 0.1*body.culture, 1)
    vitality = round(0.35*body.culture + 0.35*body.mobility + 0.2*body.lighting + 0.1*body.greenery, 1)
    safety = round(0.45*body.lighting + 0.3*body.mobility + 0.15*body.greenery + 0.1*body.culture, 1)
    return {"indices":{"comfort":comfort,"vitality":vitality,"safety":safety}}

@app.get("/v1/dashboard/engines")
async def engines():
    return {"engines":[{"name":"IdentityEngine","status":"operational"},{"name":"VisionEngine","status":"operational"}]}
