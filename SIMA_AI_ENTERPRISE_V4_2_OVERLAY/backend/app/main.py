from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, PlainTextResponse
from pydantic import BaseModel, Field
import os, io, json, time, uuid, datetime, re, math
import psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader
import jwt
from passlib.context import CryptContext
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from .utils.embedder import embed

app = FastAPI(title="SIMA API v4.2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

REQ = Counter("sima_requests_total","reqs",["route","method"])
LAT = Histogram("sima_request_latency_seconds","lat",["route"], buckets=[0.05,0.1,0.2,0.5,1,2,5,8,13])
PASS = Counter("sima_cert_pass_total","pass")
FAIL = Counter("sima_cert_fail_total","fail")

DB = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMB_DIM = int(os.getenv("EMBED_DIM","256"))
JWT_SECRET = os.getenv("JWT_SECRET","dev")
JWT_ISS = os.getenv("JWT_ISS","sima")
JWT_AUD = os.getenv("JWT_AUD","web")
TOKEN_EXP_MIN = int(os.getenv("TOKEN_EXP_MIN","240"))
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def db(): return psycopg.connect(DB, autocommit=True)

def init():
    with db() as c:
        with c.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE TABLE IF NOT EXISTS users(id UUID PRIMARY KEY,email TEXT UNIQUE,full_name TEXT,role TEXT,password_hash TEXT,created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute(f"CREATE TABLE IF NOT EXISTS rag_docs(id TEXT PRIMARY KEY,title TEXT,content TEXT,embedding vector({EMB_DIM}));")
            cur.execute("CREATE TABLE IF NOT EXISTS projects(id UUID PRIMARY KEY,tracking_no TEXT UNIQUE,title TEXT,consultant UUID,region TEXT,function TEXT,city TEXT,status TEXT,files JSONB DEFAULT '[]',created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute("CREATE TABLE IF NOT EXISTS models(id UUID PRIMARY KEY,project_id UUID,name TEXT,state JSONB DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute("CREATE TABLE IF NOT EXISTS sensor_data(id UUID PRIMARY KEY,project_id UUID,sensor_type TEXT,val REAL,ts TIMESTAMPTZ DEFAULT now());")
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
                cur.execute("INSERT INTO users(id,email,full_name,role,password_hash) VALUES(%s,%s,%s,%s,%s)",
                            (uid,body.email,body.full_name,body.role,ph))
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
            cur.execute("INSERT INTO projects(id,tracking_no,title,consultant,region,function,city,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
                        (pid,tracking,body.title,payload["sub"],body.region,body.function,body.city,"uploaded"))
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

# ---- RAG ----
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

# ---- IFC model persistence ----
class ModelState(BaseModel): name:str; state:dict
@app.post("/v1/model/{project_id}/save")
def model_save(project_id:str, body: ModelState, payload=Depends(auth_required())):
    mid = str(uuid.uuid4())
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO models(id,project_id,name,state) VALUES(%s,%s,%s,%s)",
                        (mid, project_id, body.name, json.dumps(body.state)))
    return {"model_id": mid}

@app.get("/v1/model/{project_id}/latest")
def model_latest(project_id:str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,name,state FROM models WHERE project_id=%s ORDER BY created_at DESC LIMIT 1",(project_id,))
            row = cur.fetchone()
    if not row: return {"model_id": None, "name": None, "state": {}}
    return {"model_id": row[0], "name": row[1], "state": row[2]}

# ---- Score + 5-language report ----
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

@app.get("/v1/project/{pid}/report.pdf")
def report_multilang(pid:str, lang: str=Query("ar"), payload=Depends(auth_required())):
    tr = {
      "ar":{"title":"تقرير المشروع","project":"المشروع","tracking":"رقم المتابعة","score":"الدرجة الكلية","status":"الحالة","desc":"تقرير امتثال وفق موجهات الهوية السعودية."},
      "en":{"title":"Project Report","project":"Project","tracking":"Tracking No.","score":"Total Score","status":"Status","desc":"Compliance report per Saudi architectural guidelines."},
      "es":{"title":"Informe del Proyecto","project":"Proyecto","tracking":"Nº de Seguimiento","score":"Puntuación Total","status":"Estado","desc":"Informe de cumplimiento según directrices saudíes."},
      "fr":{"title":"Rapport du Projet","project":"Projet","tracking":"N° de Suivi","score":"Score Total","status":"Statut","desc":"Rapport de conformité selon les directives saoudiennes."},
      "zh":{"title":"项目报告","project":"项目","tracking":"跟踪号","score":"总分","status":"状态","desc":"依据沙特建筑指南的合规报告。"}
    }
    T = tr.get(lang, tr["ar"])
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT tracking_no,title FROM projects WHERE id=%s",(pid,))
            row = cur.fetchone()
    if not row: raise HTTPException(404,"project not found")
    tracking, title = row
    sc = score(pid, payload=None)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4); w,h = A4
    c.setFont("Helvetica-Bold", 18); c.drawString(30*mm, (h-30*mm), f"SIMA AI – {T['title']} ({lang})")
    c.setFont("Helvetica", 12); c.drawString(30*mm, h-40*mm, f"{T['project']}: {title}")
    c.drawString(30*mm, h-48*mm, f"{T['tracking']}: {tracking}")
    c.drawString(30*mm, h-56*mm, f"{T['score']}: {sc['total']} – {T['status']}: {sc['status']}")
    c.drawString(30*mm, h-64*mm, T["desc"])
    c.showPage(); c.save(); buf.seek(0)
    return Response(content=buf.getvalue(), media_type="application/pdf")

# ---- City KPI for GIS dashboards ----
@app.get("/v1/metrics/cities")
def metrics_cities(payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT city, id, files FROM projects")
            rows = cur.fetchall()
    data = {}
    for city, pid, files in rows:
        if not city: city="غير محدد"
        d = data.setdefault(city, {"total":0, "with_files":0})
        d["total"] += 1
        if files and len(files)>0: d["with_files"] += 1
    out = []
    for city, d in data.items():
        total = d["total"]; wf = d["with_files"]
        pass_rate = (wf/total)*100 if total else 0
        out.append({"city":city, "projects": total, "pass_rate": round(pass_rate,1)})
    return {"cities": out}

# ---- Chat SSE fallback ----
class ChatIn(BaseModel): message:str
@app.post("/v1/chat/stream")
def chat(body: ChatIn):
    async def generate():
        yield "event: start\ndata: {}\n\n"
        txt = f"[SIMA-SA] {body.message} — تحليل وفق الهوية السعودية."
        for tok in txt.split():
            yield f"event: token\ndata: {{\"text\": \"{tok} \"}}\n\n"
        yield "event: done\ndata: {}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
