from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, io, time, json
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

APP_NAME = "SIMA AI v6 NEXT"
APP_DESC = "Saudi Architectural Intelligence — studio, simulator, dashboard, chat (RAG-lite), and identity scoring."

app = FastAPI(title=APP_NAME, description=APP_DESC, version="6.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQ_COUNT = Counter("sima_requests_total", "Total HTTP Requests", ["route","method"])
REQ_LAT = Histogram("sima_request_latency_seconds", "Request latency", ["route"])

def track(route: str, method="GET"):
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
    return {"app": APP_NAME, "version": "6.0.0", "ok": True, "endpoints": ["/healthz","/readyz","/metrics","/v1/styles","/v1/materials","/v1/identity/score","/v1/vision/analyze","/v1/3d/reconstruct","/v1/simulator/urban","/v1/chat","/v1/dashboard/engines"]}

@app.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@app.get("/readyz")
async def readyz(): return PlainTextResponse("ready")

@app.get("/metrics")
async def metrics():
    return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

# ---------- Static Knowledge ----------
KSA_IDENTITIES = {
    "Central_Najdi": {"title":"Central Najdi","wwr_range":[10,25],"height_to_width_ratio":[1.2,2.7],"colors_ral":["RAL 1015","RAL 7032","RAL 7040","RAL 9010"],"key_features":["triangular_bands","crenellation","small_openings","projecting_turmah","asymmetry"]},
    "Hejazi_Coast": {"title":"Hejazi Coast","wwr_range":[30,60],"height_to_width_ratio":[1.2,1.8],"colors_ral":["White","Timber_Tones","Blue_Accents"],"key_features":["roshan","mashrabiya","screens_balconies","tripartite_facade"]},
    "Northern_Najdi": {"title":"Northern Najdi","wwr_range":[10,20],"height_to_width_ratio":[1.3,2.6],"colors_ral":["RAL 9002","RAL 7001","RAL 7032","RAL 1001"],"key_features":["corner_crenellation","triangular_bands_simple","stone_lower_base","timber_shutters"]},
}

MATERIALS = {
  "roofing": [
    {"id":"clay_tile","title":"Clay Tile","ral":"RAL 8004","note":"Traditional warm tone"},
    {"id":"ondulin","title":"Ondulin","ral":"RAL 7021","note":"Lightweight roofing"}
  ],
  "walls": {
    "decorative":[
      {"id":"stone_panel","title":"Stone Panel","ral":"RAL 1015"},
      {"id":"timber_slats","title":"Timber Slats","ral":"Timber_Tones"},
      {"id":"plaster_beige","title":"Plaster Beige","ral":"RAL 1013"}
    ],
    "insulation":[
      {"id":"xps","title":"XPS Insulation","u_value":"0.032 W/mK"},
      {"id":"rockwool","title":"Rockwool","u_value":"0.040 W/mK"}
    ]
  },
  "landscape":[
    {"id":"palm","title":"Date Palm"}, {"id":"ghaf","title":"Ghaf"}, {"id":"bougainvillea","title":"Bougainvillea"}
  ]
}

@app.get("/v1/styles")
async def styles():
    return {"styles":[{"id":k,"title":v["title"],"wwr_range":v["wwr_range"],"height_ratio":v["height_to_width_ratio"],"key_features":v["key_features"][:5]} for k,v in KSA_IDENTITIES.items()]}

@app.get("/v1/materials")
async def materials():
    return MATERIALS

class IdentityIn(BaseModel):
    region_hint: str | None = None
    wwr: float | None = 22.0
    height_ratio: float | None = 1.6
    colors: List[str] | None = []
    features: List[str] | None = []

@app.post("/v1/identity/score")
async def identity_score(body: IdentityIn):
    region = body.region_hint
    wwr = float(body.wwr or 0)
    hr = float(body.height_ratio or 1.6)
    cols = [c.lower() for c in (body.colors or [])]
    feats = [f.lower() for f in (body.features or [])]
    score = 50.0
    used = "unknown"
    if region in KSA_IDENTITIES:
        used = region
        r = KSA_IDENTITIES[region]
        wmin, wmax = r["wwr_range"]
        if wmin <= wwr <= wmax: score += 15
        else: score -= min(10, abs((wwr - (wmin+wmax)/2)/5))
        hmin, hmax = r["height_to_width_ratio"]
        if hmin <= hr <= hmax: score += 10
        else: score -= min(8, abs(hr - (hmin+hmax)/2))
        pal = set([c.lower() for c in r["colors_ral"]])
        if any(c in pal for c in cols): score += 10
        need = set([x.lower() for x in r["key_features"]])
        overlap = len(need.intersection(set(feats)))
        score += min(15, overlap*5)
    score = max(0.0, min(100.0, score))
    return {"region":used,"authenticity_score":round(score,2)}

@app.post("/v1/vision/analyze")
async def vision_analyze(file: UploadFile = File(...)):
    content = await file.read()
    return {"predicted_regions":[{"region":"Central_Najdi","confidence":0.64},{"region":"Hejazi_Coast","confidence":0.22},{"region":"Northern_Najdi","confidence":0.14}],
            "notes":[f"Received {file.filename} ({len(content)} bytes). Demo analysis."]}

@app.post("/v1/3d/reconstruct")
async def reconstruct(width: float = Form(6.0), depth: float = Form(4.0), height: float = Form(3.0), openings_json: str = Form("[]")):
    vertices = [[0,0,0],[width,0,0],[width,depth,0],[0,depth,0],[0,0,height],[width,0,height],[width,depth,height],[0,depth,height]]
    faces = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]
    meshes = [{"name":"room","vertices":vertices,"faces":faces,"material":{"color":"#ddd"}}]
    return {"meshes":meshes,"summary":{"bbox":[width,depth,height],"openings":0}}

class UrbanIn(BaseModel):
    lighting: int = 50
    greenery: int = 50
    mobility: int = 50
    culture: int = 50

@app.post("/v1/simulator/urban")
async def simulator_urban(body: UrbanIn):
    # Simple scoring model: weighted indices for demo
    comfort = round(0.4*body.greenery + 0.3*body.lighting + 0.2*body.mobility + 0.1*body.culture, 1)
    vitality = round(0.35*body.culture + 0.35*body.mobility + 0.2*body.lighting + 0.1*body.greenery, 1)
    safety = round(0.45*body.lighting + 0.3*body.mobility + 0.15*body.greenery + 0.1*body.culture, 1)
    return {"indices":{"comfort":comfort,"vitality":vitality,"safety":safety},"recommendations":[
        "Increase shade trees along main paths",
        "Add pedestrian lighting at intersections",
        "Introduce cultural activations (plazas/street art)"]}

# RAG-lite chat
CORPUS = {
 "ksa_overview": "Saudi architecture recognizes 19 identities mapped across regions. Keep Najdi openings modest and emphasize triangular bands & crenellation.",
 "hejazi": "Hejazi coastal architecture uses Roshan, mashrabiya, and white plaster with timber accents. Higher WWR acceptable on shaded facades.",
 "najdi": "Central Najdi prefers modest WWR (~10-25%), light earth tones (RAL 1015), vertical alignment of small openings, and crenellations."
}

class ChatIn(BaseModel):
    message: str
    region: Optional[str] = None

@app.post("/v1/chat")
async def chat(body: ChatIn):
    msg = (body.message or "").lower()
    ctx = []
    if "hejazi" in msg or (body.region and "hejazi" in body.region.lower()):
        ctx.append(("hejazi", CORPUS["hejazi"]))
    if "najdi" in msg or (body.region and "najdi" in body.region.lower()):
        ctx.append(("najdi", CORPUS["najdi"]))
    if not ctx:
        ctx.append(("ksa_overview", CORPUS["ksa_overview"]))
    answer = "ملخص مستند إلى مرجع الهوية: " + " | ".join([f"{k}: {v[:120]}..." for k,v in ctx])
    return {"answer": answer, "context":[{"doc":k,"excerpt":v} for k,v in ctx]}

@app.get("/v1/dashboard/engines")
async def dashboard_engines():
    # Simulated engines status
    engines = [
        {"name":"IdentityEngine","status":"operational","rps":18.2},
        {"name":"VisionEngine","status":"operational","rps":11.4},
        {"name":"SimulatorEngine","status":"operational","rps":7.1},
        {"name":"ChatEngine","status":"operational","rps":12.6},
    ]
    health = {"system":"normal","uptime_hours": 72}
    return {"engines":engines, "health":health}
