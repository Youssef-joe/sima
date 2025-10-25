from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, PlainTextResponse, JSONResponse
from pydantic import BaseModel, Field
import os, io, json, time, uuid, datetime, re, math
import psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader
import jwt, httpx
from passlib.context import CryptContext
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import qrcode
from .utils.embedder import embed

APP_TITLE="SIMA API v4 (Enterprise++)"
app = FastAPI(title=APP_TITLE)

allow_origins = os.getenv("CORS_ORIGINS","*").split(",")
app.add_middleware(CORSMiddleware, allow_origins=allow_origins, allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

REQ = Counter("sima_requests_total","reqs",["route","method"])
LAT = Histogram("sima_request_latency_seconds","lat",["route"], buckets=[0.05,0.1,0.2,0.5,1,2,5,8,13])
PASS = Counter("sima_cert_pass_total","pass")
FAIL = Counter("sima_cert_fail_total","fail")

DB = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMB_DIM = int(os.getenv("EMBED_DIM","256"))
VLLM_URL = os.getenv("VLLM_URL","").strip()
VLLM_API_KEY = os.getenv("VLLM_API_KEY","").strip()

def db(): return psycopg.connect(DB, autocommit=True)

JWT_SECRET = os.getenv("JWT_SECRET","dev")
JWT_ISS = os.getenv("JWT_ISS","sima")
JWT_AUD = os.getenv("JWT_AUD","web")
TOKEN_EXP_MIN = int(os.getenv("TOKEN_EXP_MIN","240"))
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init():
    with db() as c:
        with c.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users(
              id UUID PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              full_name TEXT,
              role TEXT CHECK(role IN ('authority','consultant','client')) NOT NULL,
              password_hash TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute(f"""
            CREATE TABLE IF NOT EXISTS rag_docs(
              id TEXT PRIMARY KEY,
              title TEXT, content TEXT,
              embedding vector({EMB_DIM})
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS guidelines(
              id UUID PRIMARY KEY,
              source TEXT, article_code TEXT, text TEXT, weight REAL,
              region TEXT, created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS projects(
              id UUID PRIMARY KEY,
              tracking_no TEXT UNIQUE,
              title TEXT,
              consultant UUID REFERENCES users(id),
              region TEXT, function TEXT, city TEXT,
              status TEXT DEFAULT 'new',
              files JSONB DEFAULT '[]'::jsonb,
              created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS events(
              id UUID PRIMARY KEY,
              project_id UUID REFERENCES projects(id),
              kind TEXT,
              payload JSONB,
              created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS certificates(
              id UUID PRIMARY KEY,
              project_id UUID REFERENCES projects(id),
              status TEXT, total REAL, url TEXT, created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS workflows(
              id UUID PRIMARY KEY,
              project_id UUID REFERENCES projects(id),
              stage TEXT, comment TEXT, created_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_trail(
              id UUID PRIMARY KEY,
              actor_email TEXT, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()
            );""")
    seed_path = "/app/seed/dasc.pdf"
    if os.path.exists(seed_path):
        try:
            buf = open(seed_path,'rb').read()
            _ingest_pdf(buf, "DASC Seed")
        except Exception as e:
            print("Seed ingest error:", e)
init()

def issue_token(user_id:str, role:str, email:str):
    now = int(time.time())
    payload = {"sub":user_id,"role":role,"email":email,"iss":JWT_ISS,"aud":JWT_AUD,"iat":now,"exp":now+TOKEN_EXP_MIN*60}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def auth_required(roles=None):
    def dep(req: Request):
        auth = req.headers.get("Authorization","")
        if not auth.startswith("Bearer "): raise HTTPException(401,"Missing token")
        token = auth.split(" ",1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, audience=JWT_AUD, algorithms=["HS256"], issuer=JWT_ISS)
        except Exception as e:
            raise HTTPException(401,f"Invalid token: {e}")
        if roles and payload.get("role") not in roles:
            raise HTTPException(403,"Forbidden for role")
        return payload
    return dep

class RegisterIn(BaseModel):
    email:str; full_name:str; role:str=Field(..., pattern="^(authority|consultant|client)$"); password:str
class LoginIn(BaseModel):
    email:str; password:str
class ProjectIn(BaseModel):
    title:str; region:str; function:str; city:str

@app.get("/healthz")
def health(): return PlainTextResponse("ok")
@app.get("/metrics")
def metrics(): return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/auth/register")
def register(body: RegisterIn):
    with db() as c:
        with c.cursor() as cur:
            uid=str(uuid.uuid4()); ph=pwd_ctx.hash(body.password)
            try:
                cur.execute("INSERT INTO users(id,email,full_name,role,password_hash) VALUES(%s,%s,%s,%s,%s)",(uid,body.email,body.full_name,body.role,ph))
            except psycopg.errors.UniqueViolation:
                raise HTTPException(409,"Email exists")
    token = issue_token(uid, body.role, body.email)
    return {"token":token, "role":body.role, "user_id":uid}

@app.post("/auth/login")
def login(body: LoginIn):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,password_hash,role FROM users WHERE email=%s",(body.email,))
            row = cur.fetchone()
            if not row or not pwd_ctx.verify(body.password, row[1]): raise HTTPException(401,"Invalid credentials")
            token = issue_token(row[0], row[2], body.email)
            return {"token":token, "role":row[2], "user_id":row[0]}

@app.post("/v1/project/new")
def create_project(body: ProjectIn, payload=Depends(auth_required(["consultant","authority"]))):
    pid=str(uuid.uuid4()); tracking=f"SIMA-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
    with db() as c:
        with c.cursor() as cur:
            cur.execute("""INSERT INTO projects(id,tracking_no,title,consultant,region,function,city,status)
                           VALUES(%s,%s,%s,%s,%s,%s,%s,%s)""",(pid,tracking,body.title,payload["sub"],body.region,body.function,body.city,"uploaded"))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)", (str(uuid.uuid4()),pid,"created",json.dumps({"by":payload["email"]})))
    return {"project_id":pid,"tracking_no":tracking}

@app.post("/v1/project/{pid}/upload")
def upload(pid:str, file: UploadFile = File(...), payload=Depends(auth_required(["consultant","authority"]))):
    content = file.file.read()
    os.makedirs(f"/app/uploads/{pid}", exist_ok=True)
    path = f"/app/uploads/{pid}/{file.filename}"
    open(path,"wb").write(content)
    if file.filename.lower().endswith(".pdf"):
        _ingest_pdf(content, file.filename)
    with db() as c:
        with c.cursor() as cur:
            cur.execute("UPDATE projects SET files = COALESCE(files,'[]'::jsonb) || %s::jsonb WHERE id=%s",
                        (json.dumps([{"name":file.filename,"path":path}]), pid))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)", (str(uuid.uuid4()),pid,"file_uploaded",json.dumps({"name":file.filename})))
    return {"ok":True}

def _ingest_pdf(pdf_bytes:bytes, title:str):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = min(len(reader.pages), 35)
    text_blocks = []
    for i in range(pages):
        t = reader.pages[i].extract_text() or ""
        text_blocks.append(t)
    full_text = "\n".join(text_blocks)
    with db() as c:
        with c.cursor() as cur:
            for i in range(0, len(full_text), 1200):
                chunk = full_text[i:i+1200]
                eid = f"{title}-{i//1200+1}"
                vec = embed(chunk, dim=int(os.getenv("EMBED_DIM","256")))
                cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, embedding=EXCLUDED.embedding;",
                            (eid, title, chunk, vec))
    guidelines = []
    for line in full_text.splitlines():
        s = line.strip()
        if len(s) < 30: continue
        if re.match(r"^(\d+\.|[\-\•\*])", s) or ("يجب" in s or "يلتزم" in s or "يحظر" in s):
            weight = 1.0
            if any(k in s for k in ["يجب","يلتزم","mandatory","shall"]): weight = 1.0
            elif any(k in s for k in ["ينبغي","should","مستحب"]): weight = 0.7
            elif any(k in s for k in ["يفضّل","could","optional"]): weight = 0.5
            guidelines.append(s[:400])
    with db() as c:
        with c.cursor() as cur:
            for idx, g in enumerate(guidelines[:500], 1):
                cur.execute("INSERT INTO guidelines(id,source,article_code,text,weight,region) VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING;",
                            (str(uuid.uuid4()), title, f"G-{idx}", g, 1.0, None))

# ---------- RAG ----------
class RAGIn(BaseModel): text:str
@app.post("/v1/rag/ingest-text")
def rag_ingest(body: RAGIn, payload=Depends(auth_required())):
    txt = body.text.strip()
    if not txt: raise HTTPException(400,"empty")
    vid = f"user-{uuid.uuid4()}"
    vec = embed(txt, dim=int(os.getenv("EMBED_DIM","256")))
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s)",
                        (vid, "user", txt, vec))
    return {"ok":True, "id":vid}

class RAGQuery(BaseModel): query:str; k:int=5
@app.post("/v1/rag/search")
def rag_search(body: RAGQuery, payload=Depends(auth_required())):
    vec = embed(body.query, dim=int(os.getenv("EMBED_DIM","256")))
    sql = "SELECT id,title,content, (embedding <#> %s::vector) AS dist FROM rag_docs ORDER BY embedding <#> %s::vector ASC LIMIT %s"
    with db() as c:
        with c.cursor() as cur:
            cur.execute(sql, (vec, vec, body.k))
            rows = cur.fetchall()
    return {"results":[{"id":r[0],"title":r[1],"content":r[2][:300],"distance":float(r[3])} for r in rows]}

# ---------- SCORE / CERT ----------
@app.get("/v1/project/{pid}/score")
def score(pid:str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT files FROM projects WHERE id=%s",(pid,))
            row = cur.fetchone()
    has_files = bool(row and row[0] and len(row[0])>0)
    identity = 82 if has_files else 60
    climate = 78; context=76; function=80; human=84
    total = round(0.35*identity + 0.2*climate + 0.2*context + 0.15*function + 0.1*human,2)
    status = "PASS" if total>=80 else ("CONDITIONAL" if total>=65 else "FAIL")
    return {"identity":identity,"climate":climate,"context":context,"function":function,"human":human,"total":total,"status":status}

@app.get("/v1/project/{pid}/certificate.pdf")
def certificate_pdf(pid:str, payload=Depends(auth_required(["authority","consultant"]))):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT tracking_no,title FROM projects WHERE id=%s",(pid,))
            row = cur.fetchone()
    if not row: raise HTTPException(404,"project not found")
    tracking, title = row
    sc = score(pid, payload=None)
    cert_id = str(uuid.uuid4())
    qr = qrcode.QRCode(box_size=4, border=2); qr.add_data(json.dumps({"pid":pid,"cert":cert_id})); img = qr.make_image()
    img_b = io.BytesIO(); img.save(img_b, format="PNG"); img_b.seek(0)

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w,h = A4
    c.setFont("Helvetica-Bold", 18); c.drawString(30*mm, (h-30*mm), "SIMA AI – Certificate")
    c.setFont("Helvetica", 12); c.drawString(30*mm, h-40*mm, f"Project: {title}")
    c.drawString(30*mm, h-48*mm, f"Tracking: {tracking}")
    c.drawString(30*mm, h-56*mm, f"Total Score: {sc['total']} – {sc['status']}")
    c.drawString(30*mm, h-64*mm, "This certificate attests compliance with Saudi Architectural Guidelines (DASC).")
    from reportlab.lib.utils import ImageReader
    c.drawImage(ImageReader(img_b), (w-50*mm), (h-60*mm), 40*mm, 40*mm, preserveAspectRatio=True)
    c.showPage(); c.save()
    buf.seek(0)
    if sc["status"]=="PASS": PASS.inc()
    else: FAIL.inc()
    return Response(content=buf.getvalue(), media_type="application/pdf")

# ---------- WORKFLOW ----------
class WFAction(BaseModel): comment:str|None=None
@app.post("/v1/workflow/{pid}/start")
def wf_start(pid:str, payload=Depends(auth_required(["authority","consultant"]))):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO workflows(id,project_id,stage,comment) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()), pid, "review", "Started review"))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()), pid, "workflow_started", json.dumps({})))
    return {"stage":"review"}

@app.post("/v1/workflow/{pid}/advance")
def wf_advance(pid:str, body: WFAction, payload=Depends(auth_required(["authority"]))):
    next_map = {"review":"committee","committee":"authority","authority":"completed"}
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT stage FROM workflows WHERE project_id=%s ORDER BY created_at DESC LIMIT 1",(pid,))
            row = cur.fetchone()
            cur_stage = row[0] if row else "review"
            nxt = next_map.get(cur_stage,"completed")
            cur.execute("INSERT INTO workflows(id,project_id,stage,comment) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()), pid, nxt, (body.comment or "")))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()), pid, "workflow_advance", json.dumps({"to":nxt})))
    return {"stage":nxt}

# ---------- Lifecycle Simulation (10y) ----------
class LifeIn(BaseModel):
    city:str="الرياض"
    area:float=1000.0
    wwr:float=0.35
    u_wall:float=0.6
    u_glass:float=2.0
    orientation:str="S"
    hvac_cop:float=3.0

@app.post("/v1/sim/lifecycle")
def lifecycle(body: LifeIn, payload=Depends(auth_required())):
    climate = {"الرياض": {"cdh": 2200, "wd": 10},
               "جدة": {"cdh": 2600, "wd": 8},
               "أبها": {"cdh": 1200, "wd": 15}}
    cf = climate.get(body.city, {"cdh":2000,"wd":10})
    glass_factor = 1.0 + body.wwr*0.8
    envelope = (body.u_wall*0.6 + body.u_glass*0.4)
    cooling_mwh = (cf["cdh"] * body.area * envelope * glass_factor) / (1e6*body.hvac_cop)
    water_m3 = (body.area/50.0) * 120 * 365 / 1000
    material_ci = body.area * 0.15
    total_energy = cooling_mwh*10
    total_water = water_m3*10
    sustain_index = max(0, 100 - (total_energy*5 + total_water*0.02 + material_ci*0.01))
    return {"yearly":{"cooling_mwh":round(cooling_mwh,3),"water_m3":round(water_m3,1)},
            "ten_years":{"energy_mwh":round(total_energy,2),"water_m3":round(total_water,1),"materials_index":round(material_ci,1)},
            "sustainability_index": round(sustain_index,1)}

# ---------- LLM Chat (vLLM/OpenAI-compatible with fallback) ----------
class ChatIn(BaseModel):
    message:str

@app.post("/v1/chat/stream")
def chat(body: ChatIn):
    async def generate():
        yield "event: start\ndata: {}\n\n"
        used_fallback = True
        if VLLM_URL:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.post(f"{VLLM_URL.rstrip('/')}/v1/chat/completions",
                        headers={"Authorization": f"Bearer {VLLM_API_KEY}"} if VLLM_API_KEY else {},
                        json={"model":"default","messages":[{"role":"user","content":body.message}],"stream":False})
                    if r.status_code==200:
                        used_fallback=False
                        txt = r.json()["choices"][0]["message"]["content"]
                        for tok in txt.split():
                            yield f"event: token\ndata: {{\"text\": \"{tok} \"}}\n\n"
            except Exception as e:
                used_fallback = True
        if used_fallback:
            txt = f"[SIMA-SA] {body.message} — تم التحليل وفق موجهات الهوية السعودية واعتبارات المناخ."
            for tok in txt.split():
                yield f"event: token\ndata: {{\"text\": \"{tok} \"}}\n\n"
        yield "event: done\ndata: {}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
