from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, io, time, json, math, glob
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

APP_NAME = "SIMA AI — ENGINES MAX"
APP_DESC = "All-local suite: design, render, layout, structure, identity, chat (RAG), 3D gen, materials, eco, plus trainer 24/7."

app = FastAPI(title=APP_NAME, description=APP_DESC, version="7.0.0")

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
    return {"app": APP_NAME, "version": "7.0.0", "ok": True}

@app.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@app.get("/readyz")
async def readyz(): return PlainTextResponse("ready")

@app.get("/metrics")
async def metrics():
    return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

# ---------- Shared data ----------
IDENTITIES = {
    "Central_Najdi": {"title":"Central Najdi","wwr_range":[10,25],"height_to_width_ratio":[1.2,2.7],"colors_ral":["RAL 1015","RAL 7032","RAL 7040","RAL 9010"],"key_features":["triangular_bands","crenellation","small_openings","projecting_turmah","asymmetry"]},
    "Hejazi_Coast": {"title":"Hejazi Coast","wwr_range":[30,60],"height_to_width_ratio":[1.2,1.8],"colors_ral":["White","Timber_Tones","Blue_Accents"],"key_features":["roshan","mashrabiya","screens_balconies","tripartite_facade"]},
}
MATERIALS = {
  "roofing": [
    {"id":"clay_tile","title":"Clay Tile","ral":"RAL 8004","embodied_kgco2e_m2": 18.0},
    {"id":"ondulin","title":"Ondulin","ral":"RAL 7021","embodied_kgco2e_m2": 12.0}
  ],
  "walls": {
    "decorative":[
      {"id":"stone_panel","title":"Stone Panel","ral":"RAL 1015","embodied_kgco2e_m2": 35.0},
      {"id":"timber_slats","title":"Timber Slats","ral":"Timber_Tones","embodied_kgco2e_m2": 8.0},
      {"id":"plaster_beige","title":"Plaster Beige","ral":"RAL 1013","embodied_kgco2e_m2": 5.0}
    ],
    "insulation":[
      {"id":"xps","title":"XPS","u_value":"0.032 W/mK","embodied_kgco2e_m2": 6.0},
      {"id":"rockwool","title":"Rockwool","u_value":"0.040 W/mK","embodied_kgco2e_m2": 5.5}
    ]
  }
}

# ---------- Identity Engine ----------
class IdentityIn(BaseModel):
    region_hint: Optional[str] = None
    wwr: Optional[float] = 22.0
    height_ratio: Optional[float] = 1.6
    colors: Optional[List[str]] = []
    features: Optional[List[str]] = []

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
    return {"region":used,"authenticity_score": round(max(0,min(100,score)),2)}

@app.get("/v1/styles")
async def styles(): return {"styles":[{"id":k,"title":v["title"],"wwr_range":v["wwr_range"],"height_ratio":v["height_to_width_ratio"],"key_features":v["key_features"][:5]} for k,v in IDENTITIES.items()]}

@app.get("/v1/materials")
async def materials(): return MATERIALS

# ---------- Design Engine (parametric massing) ----------
class DesignIn(BaseModel):
    typology: str = "villa"
    floors: int = 2
    footprint_w: float = 10.0
    footprint_d: float = 8.0
    style: Optional[str] = "Central_Najdi"

@app.post("/v1/design/generate")
async def design_generate(body: DesignIn):
    w, d, f = body.footprint_w, body.footprint_d, body.floors
    # Simple stepped massing for style variety
    levels = []
    for k in range(f):
        shrink = 0.05 * k
        levels.append({"level":k+1, "w": round(w*(1-shrink),2), "d": round(d*(1-shrink),2), "h": 3.2})
    # Features inferred from style
    feats = {"Central_Najdi":["triangular_bands","crenellation"], "Hejazi_Coast":["roshan","mashrabiya"]}.get(body.style, [])
    return {"massing":levels, "features":feats}

# ---------- Layout Engine (grid packing with simple constraints) ----------
class LayoutIn(BaseModel):
    site_w: float = 12.0
    site_d: float = 10.0
    rooms: Dict[str, float] = {"living":20,"kitchen":12,"master":18,"bed":12,"bath":6}

@app.post("/v1/layout/generate")
async def layout_generate(body: LayoutIn):
    # simple bin-packing on grid 1m
    sw, sd = int(body.site_w), int(body.site_d)
    grid = np.zeros((sd, sw), dtype=int)
    placed = {}
    x,y = 0,0
    for name, area in body.rooms.items():
        w = max(3, int(round(math.sqrt(area))))
        h = max(3, int(round(area / w)))
        if x+w > sw: x=0; y += h+1
        if y+h > sd: break
        placed[name] = {"x":x,"y":y,"w":w,"h":h}
        grid[y:y+h, x:x+w] = 1
        x += w+1
    # adjacency bonus: ensure kitchen near living (if exists)
    adj = 0
    if "kitchen" in placed and "living" in placed:
        dx = abs(placed["kitchen"]["x"] - placed["living"]["x"])
        dy = abs(placed["kitchen"]["y"] - placed["living"]["y"])
        adj = 1 if (dx+dy) <= 4 else 0
    score = round(70 + 10*adj, 1)
    return {"rooms":placed, "fit_score":score}

# ---------- Structure/Environment Engine (proxy sims) ----------
class StructureIn(BaseModel):
    wwr: float = 25.0
    orientation_deg: float = 90.0
    glazing_u: float = 2.0
    area_m2: float = 120.0

@app.post("/v1/structure/simulate")
async def structure_simulate(body: StructureIn):
    # simple proxy for daylight factor and thermal EUI
    daylight = round(min(10.0, (body.wwr/10.0) * (1.0 - abs(math.cos(math.radians(body.orientation_deg)))) * 5.0), 2)
    eui = round(120 - body.wwr*0.4 + (body.glazing_u-1.8)*8, 2)  # kWh/m2.y heuristic
    wind_exposure = round(0.6 + 0.4*abs(math.sin(math.radians(body.orientation_deg))), 2)
    return {"daylight_index":daylight, "thermal_eui_kwh_m2y":eui, "wind_exposure":wind_exposure}

# ---------- Render Engine (preview token; front-end 3D viewer renders) ----------
class RenderIn(BaseModel):
    style: str = "Central_Najdi"
    palette: List[str] = ["RAL 1015","RAL 9010"]
    quality: str = "fast"

@app.post("/v1/render/preview")
async def render_preview(body: RenderIn):
    token = f"preview::{body.style}::{'-'.join(body.palette)}::{body.quality}"
    return {"preview_token": token, "hint": "Use token with the web viewer to apply materials & lighting presets."}

# ---------- Generate3D Engine (text → parametric geometry) ----------
class Gen3DIn(BaseModel):
    prompt: str = "modern villa two floors low windows"
@app.post("/v1/generate3d/from_text")
async def generate3d_from_text(body: Gen3DIn):
    p = body.prompt.lower()
    floors = 2 + (1 if "three" in p or "3" in p else 0)
    low_windows = ("low" in p) or ("نجدي" in p)
    w,d,h = (12,10,3.2)
    open_ratio = 0.18 if low_windows else 0.35
    # return a basic box mesh + metadata
    verts = [[0,0,0],[w,0,0],[w,d,0],[0,d,0],[0,0,floors*h],[w,0,floors*h],[w,d,floors*h],[0,d,floors*h]]
    faces = [[0,1,2],[0,2,3],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]
    return {"meshes":[{"name":"mass","vertices":verts,"faces":faces}],"params":{"floors":floors,"open_ratio":open_ratio}}

# ---------- Materials Engine (recommendation) ----------
class MatIn(BaseModel):
    region: str = "Central_Najdi"
    target_wwr: Optional[float] = 22.0
@app.post("/v1/materials/recommend")
async def materials_recommend(body: MatIn):
    if body.region == "Central_Najdi":
        combo = [{"layer":"finish","id":"plaster_beige"}, {"layer":"insulation","id":"xps"}, {"layer":"roofing","id":"clay_tile"}]
    else:
        combo = [{"layer":"finish","id":"timber_slats"}, {"layer":"insulation","id":"rockwool"}, {"layer":"roofing","id":"ondulin"}]
    return {"recommendation": combo, "catalog": MATERIALS}

# ---------- Eco Engine (sustainability heuristic) ----------
class EcoIn(BaseModel):
    wall_area_m2: float = 220.0
    roof_area_m2: float = 120.0
    finish_id: str = "plaster_beige"
    insulation_id: str = "xps"
    roofing_id: str = "clay_tile"

@app.post("/v1/eco/assess")
async def eco_assess(body: EcoIn):
    # sum embodied carbon from catalog
    fin = next(x for x in MATERIALS["walls"]["decorative"] if x["id"] == body.finish_id)
    ins = next(x for x in MATERIALS["walls"]["insulation"] if x["id"] == body.insulation_id)
    roof = next(x for x in MATERIALS["roofing"] if x["id"] == body.roofing_id)
    kgco2e = fin["embodied_kgco2e_m2"]*body.wall_area_m2 + ins["embodied_kgco2e_m2"]*body.wall_area_m2 + roof["embodied_kgco2e_m2"]*body.roof_area_m2
    return {"embodied_carbon_kgco2e": round(kgco2e,2), "note":"Heuristic; replace with LCA dataset as needed."}

# ---------- RAG Chat Engine ----------
VEC = None
DOCS = None
def build_index():
    global VEC, DOCS
    files = sorted(glob.glob("app/corpus/*.md"))
    texts = []
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            texts.append(fh.read())
    DOCS = texts
    VEC = TfidfVectorizer(stop_words="english")
    if texts:
        VEC.fit(texts)

build_index()

class ChatIn(BaseModel):
    message: str
    region: Optional[str] = None

@app.post("/v1/chat")
async def chat(body: ChatIn):
    if VEC is None or not DOCS:
        return {"answer": "لا توجد معرفة متاحة بعد.", "context": []}
    q = [body.message]
    Xq = VEC.transform(q) if hasattr(VEC, 'transform') and hasattr(VEC, 'vocabulary_') else VEC.fit_transform(DOCS)
    Xd = VEC.transform(DOCS)
    sims = (Xd @ Xq.T).toarray().ravel()
    top = sims.argsort()[::-1][:2]
    ctx = [{"doc": f"doc_{i}", "excerpt": DOCS[i][:160]} for i in top]
    answer = "استنادًا إلى المراجع: " + " | ".join([c["excerpt"] for c in ctx])
    return {"answer": answer, "context": ctx}

@app.post("/v1/admin/retrain")
async def retrain():
    build_index()
    return {"ok": True, "docs": len(DOCS)}
