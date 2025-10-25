from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import io, json, os, time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

APP_NAME = "SIMA AI v5 — Saudi Generative Architectural Intelligence"
APP_DESC = "FastAPI backend for vision/analysis/3D reconstruction, identity scoring, and generative recommendations."

# Metrics
REQ_COUNT = Counter("sima_requests_total", "Total HTTP Requests", ["route", "method"])
REQ_LAT = Histogram("sima_request_latency_seconds", "Request latency", ["route"])

# Load Identities DB
IDENTITIES_PATH = os.path.join(os.path.dirname(__file__), "data", "ksa_identities", "identities.json")
with open(IDENTITIES_PATH, "r", encoding="utf-8") as f:
    KSA_IDENTITIES = json.load(f)

# Simple helper scoring based on KSA_IDENTITIES rules
def score_identity(payload):
    region = payload.get("region_hint")
    wwr = float(payload.get("wwr", 0))
    height_ratio = float(payload.get("height_ratio", 1.5))
    colors = payload.get("colors", [])  # list of RAL-like strings
    features = payload.get("features", [])  # e.g., ["triangular_bands", "crenellation"]

    # Default simple heuristic
    score = 50.0
    matched_region = None

    if region and region in KSA_IDENTITIES:
        r = KSA_IDENTITIES[region]
        matched_region = region

        # WWR heuristic
        wmin, wmax = r.get("wwr_range", [10, 40])
        if wmin <= wwr <= wmax:
            score += 15
        else:
            score -= min(10, abs((wwr - (wmin + wmax)/2)/5))

        # Height ratio heuristic
        hrmin, hrmax = r.get("height_to_width_ratio", [1.2, 2.7])
        if hrmin <= height_ratio <= hrmax:
            score += 10
        else:
            score -= min(8, abs((height_ratio - (hrmin + hrmax)/2)))

        # Colors heuristic
        palette = set([c.lower() for c in r.get("colors_ral", [])])
        if any(c.lower() in palette for c in colors):
            score += 10

        # Features heuristic
        must = set([x.lower() for x in r.get("key_features", [])])
        got = set([x.lower() for x in features])
        overlap = len(must.intersection(got))
        score += min(15, 5 * overlap)

    score = max(0.0, min(100.0, score))
    return {"region": matched_region or "unknown", "authenticity_score": round(score, 2)}

# pydantic models
class IdentityScoreIn(BaseModel):
    region_hint: Optional[str] = None
    wwr: Optional[float] = 20.0
    height_ratio: Optional[float] = 1.6
    colors: Optional[List[str]] = []
    features: Optional[List[str]] = []

class VisionAnalyzeOut(BaseModel):
    predicted_regions: List[Dict[str, Any]]
    windows: List[Dict[str, Any]]
    doors: List[Dict[str, Any]]
    notes: List[str]

class ReconstructResponse(BaseModel):
    meshes: List[Dict[str, Any]]
    summary: Dict[str, Any]

app = FastAPI(title=APP_NAME, description=APP_DESC, version="5.0.0")

# CORS (demo-friendly)
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def track(route):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start = time.time()
            REQ_COUNT.labels(route=route, method="GET").inc() if route.startswith("GET") else REQ_COUNT.labels(route=route, method="POST").inc()
            try:
                return await func(*args, **kwargs)
            finally:
                REQ_LAT.labels(route=route).observe(time.time() - start)
        return wrapper
    return decorator

@app.get("/", response_class=JSONResponse)
async def root():
    return {
        "app": APP_NAME,
        "version": "5.0.0",
        "status": "ok",
        "endpoints": [
            "/healthz", "/readyz", "/metrics",
            "/v1/styles", "/v1/identity/score",
            "/v1/vision/analyze", "/v1/plan/upload",
            "/v1/3d/reconstruct", "/v1/report/pdf"
        ]
    }

@app.get("/healthz", response_class=PlainTextResponse)
async def healthz():
    return "ok"

@app.get("/readyz", response_class=PlainTextResponse)
async def readyz():
    return "ready"

@app.get("/metrics")
async def metrics():
    data = generate_latest()
    return StreamingResponse(io.BytesIO(data), media_type=CONTENT_TYPE_LATEST)

@app.get("/v1/styles")
async def get_styles():
    # Return a compact list of style names and key hints (for UI dropdowns)
    out = []
    for k, v in KSA_IDENTITIES.items():
        out.append({
            "id": k,
            "title": v.get("title"),
            "wwr_range": v.get("wwr_range"),
            "height_ratio": v.get("height_to_width_ratio"),
            "key_features": v.get("key_features", [])[:5],
        })
    return {"styles": out}

@app.post("/v1/identity/score")
async def identity_score(body: IdentityScoreIn):
    return score_identity(body.model_dump())

@app.post("/v1/vision/analyze", response_model=VisionAnalyzeOut)
async def vision_analyze(file: UploadFile = File(...)):
    # Demo: we don't run heavy ML here; return a structured placeholder
    # In production, plug Grounding-DINO + SAM2 + CLIP to detect & classify facade elements.
    content = await file.read()
    size_kb = round(len(content) / 1024, 2)
    notes = [
        f"Received image: {file.filename} ({size_kb} KB)",
        "This is a demo analysis; integrate ML models for real predictions."
    ]
    # naive heuristics stub
    predicted = [
        {"region": "Central_Najdi", "confidence": 0.62},
        {"region": "Hejazi_Coast", "confidence": 0.21},
        {"region": "Tabuk_Coast", "confidence": 0.17},
    ]
    windows = [{"x": 0.2, "y": 0.3, "w": 0.1, "h": 0.15}]
    doors = [{"x": 0.45, "y": 0.05, "w": 0.12, "h": 0.25}]
    return VisionAnalyzeOut(predicted_regions=predicted, windows=windows, doors=doors, notes=notes)

@app.post("/v1/plan/upload")
async def plan_upload(file: UploadFile = File(...)):
    # Stub parser: a real impl would parse DXF/IFC and extract walls/doors/windows/levels
    data = await file.read()
    meta = {"filename": file.filename, "bytes": len(data)}
    # Fake extraction
    walls = [{"p1": [0,0], "p2": [5,0]}, {"p1": [5,0], "p2": [5,3]}]
    windows = [{"center": [2.5, 0], "width": 1.2, "sill": 1.0, "height": 1.2}]
    doors = [{"center": [5,1.5], "width": 1.0, "swing": "L"}]
    return {"meta": meta, "elements": {"walls": walls, "windows": windows, "doors": doors}}

@app.post("/v1/3d/reconstruct", response_model=ReconstructResponse)
async def reconstruct_3d(
    width: float = Form(6.0),
    depth: float = Form(4.0),
    height: float = Form(3.0),
    openings_json: str = Form("[]")
):
    # Build a simple room box mesh + optional window openings
    try:
        openings = json.loads(openings_json)
    except Exception:
        openings = []

    # Simple box mesh with 8 vertices & 12 triangles (indexed); front-end can render quads/tris
    vertices = [
        [0,0,0],[width,0,0],[width,depth,0],[0,depth,0],  # bottom
        [0,0,height],[width,0,height],[width,depth,height],[0,depth,height]  # top
    ]
    faces = [
        [0,1,2],[0,2,3],  # floor
        [4,5,6],[4,6,7],  # ceiling
        [0,1,5],[0,5,4],  # wall1
        [1,2,6],[1,6,5],  # wall2
        [2,3,7],[2,7,6],  # wall3
        [3,0,4],[3,4,7],  # wall4
    ]
    meshes = [{"name": "room", "vertices": vertices, "faces": faces, "material": {"color": "#ddd"}}]
    for i, op in enumerate(openings):
        meshes.append({"name": f"opening_{i}", "type": "hole", "data": op})

    summary = {"bbox": [width, depth, height], "openings": len(openings)}
    return ReconstructResponse(meshes=meshes, summary=summary)

@app.post("/v1/report/pdf")
async def report_pdf(payload: IdentityScoreIn):
    # Minimal PDF-like response placeholder (normally you'd render a real PDF)
    scored = score_identity(payload.model_dump())
    content = json.dumps({"report": {"input": payload.model_dump(), "score": scored}}, indent=2)
    return JSONResponse(content=json.loads(content))

