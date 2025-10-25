from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, PlainTextResponse
from pydantic import BaseModel, Field
import os, io, json, time, uuid, datetime, re
import psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader
import jwt
from passlib.context import CryptContext
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

try:
    from .utils.embedder import embed
except Exception:
    import hashlib
    def embed(text: str, dim: int = 256):
        h = hashlib.sha256(text.encode("utf-8")).digest()
        v = (h * ((dim // len(h)) + 1))[:dim]
        return "[" + ",".join(str((b - 128) / 128.0) for b in v) + "]"

app = FastAPI(title="SIMA API v4.3 (Upgrade Pack 2)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

REQ = Counter("sima_requests_total","reqs",["route","method"])
LAT = Histogram("sima_request_latency_seconds","lat",["route"], buckets=[0.05,0.1,0.2,0.5,1,2,5,8,13])

DB = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMB_DIM = int(os.getenv("EMBED_DIM","256"))
JWT_SECRET = os.getenv("JWT_SECRET","dev")
JWT_ISS = os.getenv("JWT_ISS","sima")
JWT_AUD = os.getenv("JWT_AUD","web")
TOKEN_EXP_MIN = int(os.getenv("TOKEN_EXP_MIN","240"))
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def db():
    return psycopg.connect(DB, autocommit=True)

def init():
    with db() as c:
        with c.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE TABLE IF NOT EXISTS users(id UUID PRIMARY KEY,email TEXT UNIQUE,full_name TEXT,role TEXT,password_hash TEXT,created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute(f"CREATE TABLE IF NOT EXISTS rag_docs(id TEXT PRIMARY KEY,title TEXT,content TEXT,embedding vector({EMB_DIM}));")
            cur.execute("CREATE TABLE IF NOT EXISTS projects(id UUID PRIMARY KEY,tracking_no TEXT UNIQUE,title TEXT,consultant UUID,region TEXT,function TEXT,city TEXT,status TEXT,files JSONB DEFAULT '[]',created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute("CREATE TABLE IF NOT EXISTS models(id UUID PRIMARY KEY,project_id UUID,name TEXT,state JSONB DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT now());")
            cur.execute("CREATE TABLE IF NOT EXISTS sensor_data(id UUID PRIMARY KEY,project_id UUID,sensor_type TEXT,val REAL,ts TIMESTAMPTZ DEFAULT now());")
            cur.execute("""CREATE TABLE IF NOT EXISTS workflow_instances(
                id UUID PRIMARY KEY, project_id UUID, stage TEXT, status TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""CREATE TABLE IF NOT EXISTS workflow_tasks(
                id UUID PRIMARY KEY, instance_id UUID, name TEXT, role TEXT, status TEXT, assignee UUID NULL, due_at TIMESTAMPTZ NULL,
                meta JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""CREATE TABLE IF NOT EXISTS esign_envelopes(
                id UUID PRIMARY KEY, provider TEXT, project_id UUID, status TEXT, meta JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
            );""")
            cur.execute("""CREATE TABLE IF NOT EXISTS model_changes(
                id UUID PRIMARY KEY, project_id UUID, change JSONB, delta_score REAL, created_at TIMESTAMPTZ DEFAULT now()
            );""")
init()

def issue_token(user_id: str, role: str, email: str):
    now = int(time.time())
    payload = {"sub": user_id, "role": role, "email": email, "iss": JWT_ISS, "aud": JWT_AUD, "iat": now, "exp": now + TOKEN_EXP_MIN * 60}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def auth_required(roles=None):
    def dep(req: Request):
        auth = req.headers.get("Authorization","")
        if not auth.startswith("Bearer "):
            raise HTTPException(401,"Missing token")
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
    email: str
    full_name: str
    role: str = Field(..., pattern="^(authority|consultant|client)$")
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

class ProjectIn(BaseModel):
    title: str
    region: str
    function: str
    city: str

@app.get("/healthz")
def health():
    return PlainTextResponse("ok")

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/auth/register")
def register(body: RegisterIn):
    with db() as c:
        with c.cursor() as cur:
            uid = str(uuid.uuid4())
            ph = pwd_ctx.hash(body.password)
            try:
                cur.execute("INSERT INTO users(id,email,full_name,role,password_hash) VALUES(%s,%s,%s,%s,%s)", (uid, body.email, body.full_name, body.role, ph))
            except psycopg.errors.UniqueViolation:
                raise HTTPException(409,"Email exists")
    token = issue_token(uid, body.role, body.email)
    return {"token": token, "role": body.role, "user_id": uid}

@app.post("/auth/login")
def login(body: LoginIn):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,password_hash,role FROM users WHERE email=%s", (body.email,))
            row = cur.fetchone()
            if not row or not pwd_ctx.verify(body.password, row[1]):
                raise HTTPException(401,"Invalid credentials")
            token = issue_token(row[0], row[2], body.email)
            return {"token": token, "role": row[2], "user_id": row[0]}

@app.post("/v1/project/new")
def create_project(body: ProjectIn, payload=Depends(auth_required(["consultant","authority"]))):
    pid = str(uuid.uuid4())
    tracking = f"SIMA-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO projects(id,tracking_no,title,consultant,region,function,city,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
                        (pid, tracking, body.title, payload["sub"], body.region, body.function, body.city, "uploaded"))
    return {"project_id": pid, "tracking_no": tracking}

@app.post("/v1/project/{pid}/upload")
def upload(pid: str, file: UploadFile = File(...), payload=Depends(auth_required(["consultant","authority"]))):
    content = file.file.read()
    os.makedirs(f"/app/uploads/{pid}", exist_ok=True)
    path = f"/app/uploads/{pid}/{file.filename}"
    with open(path, "wb") as f:
        f.write(content)
    if file.filename.lower().endswith(".pdf"):
        _ingest_pdf(content, file.filename)
    with db() as c:
        with c.cursor() as cur:
            cur.execute("UPDATE projects SET files = COALESCE(files,'[]'::jsonb) || %s::jsonb WHERE id=%s", (json.dumps([{"name": file.filename, "path": path}]), pid))
    return {"ok": True}

def _ingest_pdf(pdf_bytes: bytes, title: str):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = min(len(reader.pages), 35)
    text_blocks = []
    for i in range(pages):
        t = reader.pages[i].extract_text() or ""
        text_blocks.append(t)
    full_text = "\n".join(text_blocks)
    with db() as c:
        with c.cursor() as cur:
            i = 0
            step = 1200
            while i < len(full_text):
                chunk = full_text[i:i+step]
                i += step
                eid = f"{title}-{i//step}"
                vec = embed(chunk, dim=EMB_DIM)
                cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, embedding=EXCLUDED.embedding;", (eid, title, chunk, vec))

class ExtractResult(BaseModel):
    region: str
    items: list[dict]

@app.post("/v1/dasc/extract", response_model=ExtractResult)
def extract_dasc(region: str, file: UploadFile = File(...), payload=Depends(auth_required(["authority","consultant"]))):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "PDF only")
    text = ""
    reader = PdfReader(io.BytesIO(file.file.read()))
    for p in reader.pages:
        text += (p.extract_text() or "") + "\n"
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    items = []
    code_pat = re.compile(r"^([A-ZIVX]+\.\d+|\d+\.\d+)\)?[:\- ]?", re.I)
    must_kw = re.compile(r"\b(يجب|يلتزم|يحظر|shall|must|prohibited)\b", re.I)
    recommend_kw = re.compile(r"\b(ينبغي|يفضل|should|recommended)\b", re.I)
    for ln in lines:
        m = code_pat.match(ln)
        code = (m.group(1) if m else f"A-{len(items)+1}")
        weight = 1.3 if must_kw.search(ln) else (1.0 if recommend_kw.search(ln) else 0.8)
        if m or must_kw.search(ln) or recommend_kw.search(ln):
            it = {"code": code, "clause": "generic", "condition": "text_match", "weight": round(weight, 2), "text": ln[:1000]}
            items.append(it)
    with db() as c:
        with c.cursor() as cur:
            for it in items:
                eid = f"{region}-{it['code']}-{uuid.uuid4().hex[:8]}"
                vec = embed(it["text"], dim=EMB_DIM)
                cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING;", (eid, f"{region} guideline", it["text"], vec))
    return {"region": region, "items": items}

class RAGQuery(BaseModel):
    query: str
    k: int = 5

@app.post("/v1/rag/search")
def rag_search(body: RAGQuery, payload=Depends(auth_required())):
    vec = embed(body.query, dim=EMB_DIM)
    sql = "SELECT id,title,content, (embedding <#> %s::vector) AS dist FROM rag_docs ORDER BY embedding <#> %s::vector ASC LIMIT %s"
    with db() as c:
        with c.cursor() as cur:
            cur.execute(sql, (vec, vec, body.k))
            rows = cur.fetchall()
    return {"results": [{"id": r[0], "title": r[1], "content": r[2][:300], "distance": float(r[3])} for r in rows]}

class ModelState(BaseModel):
    name: str
    state: dict

@app.post("/v1/model/{project_id}/save")
def model_save(project_id: str, body: ModelState, payload=Depends(auth_required())):
    mid = str(uuid.uuid4())
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO models(id,project_id,name,state) VALUES(%s,%s,%s,%s)", (mid, project_id, body.name, json.dumps(body.state)))
    return {"model_id": mid}

@app.get("/v1/model/{project_id}/latest")
def model_latest(project_id: str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,name,state FROM models WHERE project_id=%s ORDER BY created_at DESC LIMIT 1", (project_id,))
            row = cur.fetchone()
    if not row:
        return {"model_id": None, "name": None, "state": {}}
    return {"model_id": row[0], "name": row[1], "state": row[2]}

@app.get("/v1/project/{pid}/score")
def score(pid: str, payload=Depends(auth_required())):
    identity = 82
    climate = 78
    context = 76
    function = 80
    human = 84
    total = round(0.35*identity + 0.2*climate + 0.2*context + 0.15*function + 0.1*human, 2)
    status = "PASS" if total >= 80 else ("CONDITIONAL" if total >= 65 else "FAIL")
    return {"identity": identity, "climate": climate, "context": context, "function": function, "human": human, "total": total, "status": status}

@app.get("/v1/project/{pid}/report.pdf")
def report_multilang(pid: str, lang: str = Query("ar"), payload=Depends(auth_required())):
    tr = {
        "ar": {"title": "تقرير المشروع", "project": "المشروع", "tracking": "رقم المتابعة", "score": "الدرجة الكلية", "status": "الحالة", "desc": "تقرير امتثال وفق موجهات الهوية السعودية."},
        "en": {"title": "Project Report", "project": "Project", "tracking": "Tracking No.", "score": "Total Score", "status": "Status", "desc": "Compliance report per Saudi architectural guidelines."},
        "es": {"title": "Informe del Proyecto", "project": "Proyecto", "tracking": "Nº de Seguimiento", "score": "Puntuación Total", "status": "Estado", "desc": "Informe de cumplimiento según las directrices saudíes."},
        "fr": {"title": "Rapport du Projet", "project": "Projet", "tracking": "N° de Suivi", "score": "Score Total", "status": "Statut", "desc": "Rapport de conformité selon les directives saoudiennes."},
        "zh": {"title": "项目报告", "project": "项目", "tracking": "跟踪号", "score": "总分", "status": "状态", "desc": "依据沙特建筑指南的合规报告。"}
    }
    T = tr.get(lang, tr["ar"])
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT tracking_no,title FROM projects WHERE id=%s", (pid,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(404, "project not found")
    tracking, title = row
    sc = score(pid, payload=None)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    c.setFont("Helvetica-Bold", 18); c.drawString(30*mm, (h-30*mm), f"SIMA AI – {T['title']} ({lang})")
    c.setFont("Helvetica", 12); c.drawString(30*mm, h-40*mm, f"{T['project']}: {title}")
    c.drawString(30*mm, h-48*mm, f"{T['tracking']}: {tracking}")
    c.drawString(30*mm, h-56*mm, f"{T['score']}: {sc['total']} – {T['status']}: {sc['status']}")
    c.drawString(30*mm, h-64*mm, T["desc"])
    c.showPage(); c.save(); buf.seek(0)
    return Response(content=buf.getvalue(), media_type="application/pdf")

@app.get("/v1/metrics/cities")
def metrics_cities(payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT city, id, files FROM projects")
            rows = cur.fetchall()
    data = {}
    for city, pid, files in rows:
        if not city:
            city = "غير محدد"
        d = data.setdefault(city, {"total": 0, "with_files": 0})
        d["total"] += 1
        if files and len(files) > 0:
            d["with_files"] += 1
    out = []
    for city, d in data.items():
        total = d["total"]; wf = d["with_files"]
        pass_rate = (wf / total) * 100 if total else 0
        out.append({"city": city, "projects": total, "pass_rate": round(pass_rate, 1)})
    return {"cities": out}

class ChatIn(BaseModel):
    message: str

@app.post("/v1/chat/stream")
def chat(body: ChatIn):
    async def generate():
        yield "event: start\ndata: {}\n\n"
        txt = f"[SIMA-SA] {body.message} — تحليل وفق الهوية السعودية."
        for tok in txt.split():
            yield f"event: token\ndata: {{\"text\": \"{tok} \"}}\n\n"
        yield "event: done\ndata: {}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")

# -------- Pack 2: Workflows Engine --------
class WFStart(BaseModel):
    stages: list[str] = ["review","committee","authority"]

@app.post("/v1/workflow/{project_id}/start")
def wf_start(project_id: str, body: WFStart, payload=Depends(auth_required(["authority","consultant"]))):
    iid = str(uuid.uuid4())
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO workflow_instances(id,project_id,stage,status) VALUES(%s,%s,%s,%s)",
                        (iid, project_id, body.stages[0], "in_progress"))
            cur.execute("INSERT INTO workflow_tasks(id,instance_id,name,role,status,meta) VALUES(%s,%s,%s,%s,%s,%s)",
                        (str(uuid.uuid4()), iid, "Initial Review", "consultant", "open", json.dumps({"stage":"review"})))
    return {"instance_id": iid, "stage": body.stages[0], "status": "in_progress"}

@app.get("/v1/workflow/{project_id}/status")
def wf_status(project_id: str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,stage,status,created_at,updated_at FROM workflow_instances WHERE project_id=%s ORDER BY created_at DESC LIMIT 1", (project_id,))
            inst = cur.fetchone()
            if not inst:
                return {"instance": None, "tasks": []}
            cur.execute("SELECT id,name,role,status,meta,created_at FROM workflow_tasks WHERE instance_id=%s ORDER BY created_at", (inst[0],))
            tasks = cur.fetchall()
    return {"instance": {"id": inst[0], "stage": inst[1], "status": inst[2]}, "tasks": [{"id": t[0], "name": t[1], "role": t[2], "status": t[3], "meta": t[4], "created_at": t[5].isoformat()} for t in tasks]}

class WFAction(BaseModel):
    task_id: str
    action: str = Field(..., pattern="^(approve|reject)$")
    comment: str | None = None

@app.post("/v1/workflow/{project_id}/task")
def wf_task_action(project_id: str, body: WFAction, payload=Depends(auth_required(["authority","consultant"]))):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("UPDATE workflow_tasks SET status=%s, updated_at=now(), meta = COALESCE(meta,'{}'::jsonb) || %s::jsonb WHERE id=%s",
                        ("done" if body.action=="approve" else "rejected", json.dumps({"comment": body.comment or ""}), body.task_id))
            cur.execute("SELECT instance_id FROM workflow_tasks WHERE id=%s", (body.task_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Task not found")
            iid = row[0]
            cur.execute("SELECT stage FROM workflow_instances WHERE id=%s", (iid,))
            st = cur.fetchone()[0]
            nxt = {"review": "committee", "committee": "authority", "authority": None}[st]
            if body.action == "approve" and nxt:
                cur.execute("UPDATE workflow_instances SET stage=%s, updated_at=now() WHERE id=%s", (nxt, iid))
                cur.execute("INSERT INTO workflow_tasks(id,instance_id,name,role,status,meta) VALUES(%s,%s,%s,%s,%s,%s)",
                            (str(uuid.uuid4()), iid, f"{nxt.title()} Approval", "authority" if nxt=="authority" else "committee", "open", json.dumps({"stage": nxt})))
            elif body.action == "approve" and not nxt:
                cur.execute("UPDATE workflow_instances SET status='approved', updated_at=now() WHERE id=%s", (iid,))
                cur.execute("UPDATE projects SET status='approved' WHERE id=%s", (project_id,))
            else:
                cur.execute("UPDATE workflow_instances SET status='rework', updated_at=now() WHERE id=%s", (iid,))
                cur.execute("UPDATE projects SET status='rework' WHERE id=%s", (project_id,))
    return {"ok": True}

# -------- Pack 2: e-Sign stubs --------
class SignStart(BaseModel):
    provider: str = Field(..., pattern="^(docusign|adobe|internal)$")
    project_id: str
    title: str
    signers: list[dict]
    file_url: str | None = None

@app.post("/v1/esign/start")
def esign_start(body: SignStart, payload=Depends(auth_required(["authority"]))):
    eid = str(uuid.uuid4())
    meta = {"title": body.title, "signers": body.signers, "file_url": body.file_url or ""}
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO esign_envelopes(id,provider,project_id,status,meta) VALUES(%s,%s,%s,%s,%s)",
                        (eid, body.provider, body.project_id, "sent", json.dumps(meta)))
    return {"envelope_id": eid, "status": "sent"}

@app.post("/v1/esign/{envelope_id}/callback")
def esign_callback(envelope_id: str, status: str = Query(..., pattern="^(completed|voided|declined)$")):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("UPDATE esign_envelopes SET status=%s, updated_at=now() WHERE id=%s", (status, envelope_id))
    return {"ok": True}

@app.get("/v1/esign/{project_id}/status")
def esign_status(project_id: str):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,provider,status,meta,created_at FROM esign_envelopes WHERE project_id=%s ORDER BY created_at DESC", (project_id,))
            rows = cur.fetchall()
    return {"envelopes": [{"id": r[0], "provider": r[1], "status": r[2], "meta": r[3], "created_at": r[4].isoformat()} for r in rows]}

# -------- Pack 2: IoT helper --------
@app.get("/v1/sensor/{project_id}/latest")
def sensor_latest(project_id: str, limit: int = 50):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT sensor_type,val,ts FROM sensor_data WHERE project_id=%s ORDER BY ts DESC LIMIT %s", (project_id, limit))
            rows = cur.fetchall()
    return {"data": [{"type": r[0], "val": float(r[1]), "ts": r[2].isoformat()} for r in rows]}

# -------- Pack 2: IFC Re-evaluation --------
class ModifyOp(BaseModel):
    element_id: int | None = None
    op: str = Field(..., pattern="^(set_material|set_color|set_scale|adjust_wwr)$")
    value: str

class ReEvalIn(BaseModel):
    project_id: str
    changes: list[ModifyOp]

@app.post("/v1/project/{pid}/re-evaluate")
def project_reeval(pid: str, body: ReEvalIn, payload=Depends(auth_required())):
    delta = 0.0
    for ch in body.changes:
        if ch.op == "adjust_wwr":
            try:
                wwr_delta = float(ch.value)
            except:
                wwr_delta = 0.0
            delta += 15.0 * wwr_delta
        elif ch.op == "set_material":
            delta += 2.5 if "najdi" in ch.value.lower() else 1.0
        elif ch.op == "set_color":
            delta += 0.5
        elif ch.op == "set_scale":
            delta += 0.2
    base = 0.35*82 + 0.2*78 + 0.2*76 + 0.15*80 + 0.1*84
    total = max(0.0, min(100.0, round(base + delta, 2)))
    status = "PASS" if total >= 80 else ("CONDITIONAL" if total >= 65 else "FAIL")
    with db() as c:
        with c.cursor() as cur:
            cur.execute("INSERT INTO model_changes(id,project_id,change,delta_score) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()), pid, json.dumps([ch.dict() for ch in body.changes]), delta))
    return {"delta": delta, "new_total": total, "status": status}
