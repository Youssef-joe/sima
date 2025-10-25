from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, io, time, json, threading

from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from .services.identity import score_identity, load_identities
from .services.rag import RAGEngine
from .services.simple3d import simple_room_mesh

APP_NAME = "SIMA AI v5 MAX — Saudi Generative Architectural Intelligence"
APP_DESC = "Vision/Identity Scoring + RAG Chat + Instant 3D + Retraining Stub"

REQ_COUNT = Counter("sima_requests_total", "Total HTTP Requests", ["route","method"])
REQ_LAT = Histogram("sima_request_latency_seconds", "Request latency", ["route"])

app = FastAPI(title=APP_NAME, description=APP_DESC, version="5.1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
IDENTITIES = load_identities(os.path.join(DATA_DIR, "ksa_identities", "identities.json"))
RAG = RAGEngine(corpus_dir=os.path.join(DATA_DIR, "corpus"))

def track(route, method="GET"):
    def deco(fn):
        async def wrap(*args, **kwargs):
            start = time.time()
            REQ_COUNT.labels(route=route, method=method).inc()
            try:
                return await fn(*args, **kwargs)
            finally:
                REQ_LAT.labels(route=route).observe(time.time()-start)
        return wrap
    return deco

@app.get("/")
async def root():
    return {"app": APP_NAME, "version": "5.1.0", "ok": True}

@app.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@app.get("/readyz")
async def readyz(): return PlainTextResponse("ready")

@app.get("/metrics")
async def metrics():
    return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

@app.get("/v1/styles")
async def styles():
    out = []
    for key, val in IDENTITIES.items():
        out.append({"id": key, "title": val.get("title"), "wwr_range": val.get("wwr_range"),
                    "height_ratio": val.get("height_to_width_ratio"), "key_features": val.get("key_features", [])[:5]})
    return {"styles": out}

class IdentityIn(BaseModel):
    region_hint: Optional[str] = None
    wwr: Optional[float] = 22.0
    height_ratio: Optional[float] = 1.6
    colors: Optional[List[str]] = []
    features: Optional[List[str]] = []

@app.post("/v1/identity/score")
async def identity_score(body: IdentityIn):
    return score_identity(IDENTITIES, body.model_dump())

@app.post("/v1/vision/analyze")
async def vision_analyze(file: UploadFile = File(...)):
    content = await file.read()
    # Placeholder analysis — integrate ML detectors here.
    return {"predicted_regions":[{"region":"Central_Najdi","confidence":0.65},{"region":"Hejazi_Coast","confidence":0.2}],
            "notes":[f"Received {file.filename} ({len(content)} bytes). Demo mode."]}

@app.post("/v1/plan/upload")
async def plan_upload(file: UploadFile = File(...)):
    data = await file.read()
    # Stub parse
    return {"meta":{"filename":file.filename,"bytes":len(data)},"elements":{"walls":[{"p1":[0,0],"p2":[6,0]}] }}

@app.post("/v1/3d/reconstruct")
async def reconstruct(width: float = Form(6.0), depth: float = Form(4.0), height: float = Form(3.0), openings_json: str = Form("[]")):
    meshes, summary = simple_room_mesh(width, depth, height, openings_json)
    return {"meshes": meshes, "summary": summary}

# ---- Chat + RAG ----
class ChatIn(BaseModel):
    message: str
    region: Optional[str] = None

@app.post("/v1/chat")
async def chat(body: ChatIn):
    ctx = RAG.retrieve(body.message, topk=4)
    # Simple templated "generator"
    answer = RAG.generate_answer(body.message, ctx, region_hint=body.region)
    return {"answer": answer, "context": ctx}

# ---- Retraining Stub ----
@app.post("/v1/admin/retrain")
async def retrain():
    # In real ops, this would schedule a job; here we rebuild index synchronously.
    RAG.build_index()
    return {"ok": True, "indexed_docs": len(RAG.documents)}
