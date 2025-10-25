from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, Response, PlainTextResponse, FileResponse
from pydantic import BaseModel, Field
import os, io, json, time, uuid, hashlib, datetime
import psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader
import jwt
from passlib.context import CryptContext

APP_TITLE="SIMA API v2 (Enterprise)"
app = FastAPI(title=APP_TITLE)

allow_origins = os.getenv("CORS_ORIGINS","*").split(",")
app.add_middleware(CORSMiddleware, allow_origins=allow_origins, allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

REQ = Counter("sima_requests_total","reqs",["route","method"])
LAT = Histogram("sima_request_latency_seconds","lat",["route"], buckets=[0.05,0.1,0.2,0.5,1,2,5,8,13])
PASS = Counter("sima_cert_pass_total","pass")
FAIL = Counter("sima_cert_fail_total","fail")

DB = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMB_DIM = int(os.getenv("EMBED_DIM","384"))

def db():
    return psycopg.connect(DB, autocommit=True)

JWT_SECRET = os.getenv("JWT_SECRET","dev")
JWT_ISS = os.getenv("JWT_ISS","sima")
JWT_AUD = os.getenv("JWT_AUD","web")
TOKEN_EXP_MIN = int(os.getenv("TOKEN_EXP_MIN","120"))
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init():
    with db() as c:
        with c.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users(
              id UUID PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              full_name TEXT,
              role TEXT CHECK(role IN ('authority','consultant','client')) NOT NULL,
              password_hash TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now()
            );
            """)
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
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS events(
              id UUID PRIMARY KEY,
              project_id UUID REFERENCES projects(id),
              kind TEXT,
              payload JSONB,
              created_at TIMESTAMPTZ DEFAULT now()
            );
            """)
            cur.execute(f"""
            CREATE TABLE IF NOT EXISTS rag_docs(
              id TEXT PRIMARY KEY,
              title TEXT, content TEXT,
              embedding vector({EMB_DIM})
            );""")
    seed_path = "app/data/seed_rag.txt"
    if os.path.exists(seed_path):
        text = open(seed_path,"r",encoding="utf-8",errors="ignore").read()
        for i, chunk in enumerate([text[j:j+1200] for j in range(0,len(text),1200)],1):
            with db() as c:
                with c.cursor() as cur:
                    cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING;",
                                (f"seed-{i}", f"DASC-{i}", chunk, [0.0]*EMB_DIM))
init()

def issue_token(user_id:str, role:str, email:str):
    now = int(time.time())
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "iss": JWT_ISS,
        "aud": JWT_AUD,
        "iat": now,
        "exp": now + TOKEN_EXP_MIN*60
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def auth_required(roles=None):
    def dep(req: Request):
        auth = req.headers.get("Authorization","")
        if not auth.startswith("Bearer "):
            raise HTTPException(401, "Missing token")
        token = auth.split(" ",1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, audience=JWT_AUD, algorithms=["HS256"], issuer=JWT_ISS)
        except Exception as e:
            raise HTTPException(401, f"Invalid token: {e}")
        if roles and payload.get("role") not in roles:
            raise HTTPException(403, "Forbidden for role")
        return payload
    return dep

class RegisterIn(BaseModel):
    email:str; full_name:str; role:str=Field(..., pattern="^(authority|consultant|client)$"); password:str
class LoginIn(BaseModel):
    email:str; password:str
class ProjectIn(BaseModel):
    title:str; region:str; function:str; city:str

@app.get("/healthz")
def h(): return PlainTextResponse("ok")

@app.get("/metrics")
def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

@app.post("/auth/register")
def register(body: RegisterIn):
    with db() as c:
        with c.cursor() as cur:
            uid = str(uuid.uuid4())
            ph = pwd_ctx.hash(body.password)
            try:
                cur.execute("INSERT INTO users(id,email,full_name,role,password_hash) VALUES(%s,%s,%s,%s,%s)",
                            (uid,body.email,body.full_name,body.role,ph))
            except psycopg.errors.UniqueViolation:
                raise HTTPException(409,"Email exists")
            token = issue_token(uid, body.role, body.email)
            return {"token": token, "role": body.role, "user_id": uid}

@app.post("/auth/login")
def login(body: LoginIn):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT id,password_hash,role FROM users WHERE email=%s",(body.email,))
            row = cur.fetchone()
            if not row or not pwd_ctx.verify(body.password, row[1]):
                raise HTTPException(401,"Invalid credentials")
            token = issue_token(row[0], row[2], body.email)
            return {"token": token, "role": row[2], "user_id": row[0]}

@app.get("/auth/me")
def me(payload=Depends(auth_required())):
    return {"email": payload["email"], "role": payload["role"], "user_id": payload["sub"]}

@app.post("/v1/project/new")
def create_project(body: ProjectIn, payload=Depends(auth_required(["consultant","authority"]))):
    pid = str(uuid.uuid4())
    tracking = f"SIMA-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
    with db() as c:
        with c.cursor() as cur:
            cur.execute("""INSERT INTO projects(id,tracking_no,title,consultant,region,function,city,status)
                        VALUES(%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (pid,tracking,body.title,payload["sub"],body.region,body.function,body.city,"uploaded"))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()),pid,"created",json.dumps({"by":payload["email"]})))
    return {"project_id": pid, "tracking_no": tracking}

@app.post("/v1/project/{pid}/upload")
def upload_files(pid:str, file: UploadFile = File(...), payload=Depends(auth_required(["consultant","authority"]))):
    content = file.file.read()
    os.makedirs(f"/app/uploads/{pid}", exist_ok=True)
    path = f"/app/uploads/{pid}/{file.filename}"
    with open(path,"wb") as f: f.write(content)
    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            chunks = [(reader.pages[i].extract_text() or "")[:2000] for i in range(min(len(reader.pages), 25))]
            with db() as c:
                with c.cursor() as cur:
                    for i,ch in enumerate(chunks,1):
                        cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content;",
                                    (f"{pid}-{i}", f"{file.filename}-{i}", ch, [0.0]*EMB_DIM))
        except Exception:
            pass
    with db() as c:
        with c.cursor() as cur:
            cur.execute("UPDATE projects SET files = COALESCE(files,'[]'::jsonb) || %s::jsonb WHERE id=%s",
                        (json.dumps([{"name":file.filename,"path":path}]), pid))
            cur.execute("INSERT INTO events(id,project_id,kind,payload) VALUES(%s,%s,%s,%s)",
                        (str(uuid.uuid4()),pid,"file_uploaded",json.dumps({"name":file.filename})))
    return {"ok": True}

@app.get("/v1/project/{pid}/timeline")
def timeline(pid:str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT kind, payload, created_at FROM events WHERE project_id=%s ORDER BY created_at ASC",(pid,))
            items = [{"kind":k, "payload":p, "at":str(at)} for (k,p,at) in cur.fetchall()]
    return {"events": items}

@app.get("/v1/project/{pid}/score")
def score(pid:str, payload=Depends(auth_required())):
    with db() as c:
        with c.cursor() as cur:
            cur.execute("SELECT files FROM projects WHERE id=%s",(pid,))
            row = cur.fetchone()
    has_files = bool(row and row[0] and len(row[0])>0)
    identity = 78 if has_files else 60
    climate = 75; context=74; function=80; human=82
    total = round(0.35*identity + 0.2*climate + 0.2*context + 0.15*function + 0.1*human,2)
    status = "PASS" if total>=80 else ("CONDITIONAL" if total>=65 else "FAIL")
    return {"identity":identity,"climate":climate,"context":context,"function":function,"human":human,"total":total,"status":status}

@app.get("/v1/project/{pid}/certificate")
def certificate(pid:str, payload=Depends(auth_required(["authority","consultant"]))):
    import qrcode, base64
    cert_id = str(uuid.uuid4())
    qr_payload = {"pid": pid, "cert": cert_id, "iss":"SIMA"}
    img = qrcode.make(json.dumps(qr_payload))
    b = io.BytesIO(); img.save(b, format="PNG"); b.seek(0)
    return Response(content=b.getvalue(), media_type="image/png")

class ChatIn(BaseModel): message:str
@app.post("/v1/chat/stream")
def chat(body: ChatIn):
    def it():
        yield f"event: start\\ndata: {{}}\\n\\n"
        for t in ("تحليل سعودي: "+body.message).split():
            yield f"event: token\\ndata: {{\\"text\\": \\"{t} \\"}}\\n\\n"
            time.sleep(0.02)
        yield f"event: done\\ndata: {{}}\\n\\n"
    return StreamingResponse(it(), media_type="text/event-stream")
