from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel
from typing import Optional
import os, io, json, time, uuid, re, threading, hashlib
import numpy as np
import httpx, psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

APP = FastAPI(title="SIMA AI Unified API", version="1.0.0")
origins = os.getenv("CORS_ORIGINS","http://localhost:3000").split(",")
APP.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in origins],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

REQ_COUNT = Counter("sima_requests_total","Total HTTP Requests",["route","method"])
REQ_LAT = Histogram("sima_request_latency_seconds","Request latency",["route"])

def track(route, method="GET"):
    def deco(fn):
        async def wrap(*a, **kw):
            s=time.time(); REQ_COUNT.labels(route=route, method=method).inc()
            try: return await fn(*a, **kw)
            finally: REQ_LAT.labels(route=route).observe(time.time()-s)
        return wrap
    return deco

DB_DSN = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMBED_DIM = int(os.getenv("EMBED_DIM","384"))
PGVECTOR = os.getenv("PGVECTOR","1") == "1"
MQTT_URL=os.getenv("MQTT_URL","mosquitto"); MQTT_PORT=int(os.getenv("MQTT_PORT","1883"))

def db_init():
    with psycopg.connect(DB_DSN, autocommit=True) as conn:
        with conn.cursor() as cur:
            if PGVECTOR: cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE TABLE IF NOT EXISTS projects(id UUID PRIMARY KEY, consultant TEXT, region TEXT, function TEXT, files JSONB, location TEXT, created_at TIMESTAMP DEFAULT now());")
            cur.execute("CREATE TABLE IF NOT EXISTS guidelines(id TEXT PRIMARY KEY, region TEXT, article_code TEXT, text TEXT, weight REAL);")
            cur.execute("CREATE TABLE IF NOT EXISTS scores(project_id UUID, identity REAL, climate REAL, context REAL, function REAL, human REAL, total REAL, PRIMARY KEY(project_id));")
            cur.execute("CREATE TABLE IF NOT EXISTS violations(project_id UUID, article_code TEXT, severity REAL, evidence TEXT);")
            cur.execute("CREATE TABLE IF NOT EXISTS improvements(project_id UUID, suggestion TEXT, impact REAL, cost_est REAL);")
            cur.execute("CREATE TABLE IF NOT EXISTS certificates(project_id UUID PRIMARY KEY, status TEXT, pdf_url TEXT, qr_hash TEXT);")
            if PGVECTOR: cur.execute(f"CREATE TABLE IF NOT EXISTS rag_docs(id TEXT PRIMARY KEY, title TEXT, content TEXT, embedding vector({EMBED_DIM}));")
            cur.execute("CREATE TABLE IF NOT EXISTS iot_readings(ts TIMESTAMP DEFAULT now(), project_id UUID, type TEXT, value REAL);")
    # seed
    path="app/data/dasc_guidelines.json"
    if os.path.exists(path):
        data=json.load(open(path,"r",encoding="utf-8"))
        with psycopg.connect(DB_DSN) as conn:
            with conn.cursor() as cur:
                for rg in data.get("regions",[]):
                    for art in rg.get("articles",[]):
                        gid=f"{rg['code']}-{art['id']}"
                        cur.execute("INSERT INTO guidelines (id, region, article_code, text, weight) VALUES (%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING;",
                                    (gid, rg["code"], art["id"], art["text"], art["weight"]))
            conn.commit()

db_init()

def hash_embed(text: str, dim: int = 384):
    import hashlib, numpy as np, re
    vec = np.zeros(dim, dtype=np.float32)
    for tok in re.findall(r"\\w+", text.lower()):
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % dim] += 1.0
    n = np.linalg.norm(vec) + 1e-9
    return (vec / n).tolist()

class UploadOut(BaseModel):
    project_id:str

@APP.post("/v1/project/upload", response_model=UploadOut)
@track("/v1/project/upload","POST")
async def project_upload(file: UploadFile = File(...), consultant: str = "unknown", region: str = "Najdi", function: str = "residential", location: str = "KSA"):
    pid = str(uuid.uuid4()); fname = f"uploads/{pid}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    raw = await file.read()
    with open(fname,"wb") as fh: fh.write(raw)
    meta = {}
    if file.filename.lower().endswith(".pdf"):
        try:
            r=PdfReader(io.BytesIO(raw))
            text="\\n".join([p.extract_text() or "" for p in r.pages])[:5000]
            meta["text_sample"]=text
        except Exception as e:
            meta["pdf_error"]=str(e)
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO projects (id, consultant, region, function, files, location) VALUES (%s,%s,%s,%s,%s,%s);",
                        (pid, consultant, region, function, json.dumps({"primary": fname, "meta": meta}), location))
        conn.commit()
    return {"project_id": pid}

@APP.get("/v1/project/{pid}/analysis")
@track("/v1/project/{pid}/analysis","GET")
async def project_analysis(pid: str):
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT region, files FROM projects WHERE id=%s;", (pid,))
            row = cur.fetchone()
            if not row: raise HTTPException(404, "project not found")
            region, files = row[0], row[1]
            cur.execute("SELECT article_code, text, weight FROM guidelines WHERE region=%s;", (region,))
            arts = cur.fetchall()
    violations=[{"article_code":a[0], "text":a[1], "severity": round(max(0.1, 1.0 - a[2]*2),2)} for a in arts[:3]]
    return {"project_id": pid, "region": region, "violations": violations, "files": files}

@APP.get("/v1/project/{pid}/score")
@track("/v1/project/{pid}/score","GET")
async def project_score(pid: str):
    import random
    identity, climate, context, function, human = [round(random.uniform(0.6,0.95)*100,2) for _ in range(5)]
    total = round(0.35*identity + 0.2*climate + 0.2*context + 0.15*function + 0.1*human, 2)
    status = "PASS" if total>=80 else ("CONDITIONAL" if total>=65 else "FAIL")
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO scores (project_id, identity, climate, context, function, human, total) VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (project_id) DO UPDATE SET identity=EXCLUDED.identity, climate=EXCLUDED.climate, context=EXCLUDED.context, function=EXCLUDED.function, human=EXCLUDED.human, total=EXCLUDED.total;",
                        (pid, identity, climate, context, function, human, total))
        conn.commit()
    return {"project_id": pid, "identity":identity, "climate":climate, "context":context, "function":function, "human":human, "total":total, "status":status}

class ImproveIn(BaseModel):
    target:str="identity"; budget: float=100.0
@APP.post("/v1/project/{pid}/improve")
@track("/v1/project/{pid}/improve","POST")
async def project_improve(pid: str, body: ImproveIn):
    suggestions=[
        {"suggestion":"تخفيض WWR في الواجهة الجنوبية إلى 22%", "impact":9.0, "cost_est":body.budget*0.15},
        {"suggestion":"استخدام ألوان RAL 1015/9010 ومواد محلية", "impact":6.5, "cost_est":body.budget*0.1},
        {"suggestion":"إضافة مشربيات خشبية للواجهة الغربية", "impact":5.0, "cost_est":body.budget*0.2}
    ]
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            for s in suggestions:
                cur.execute("INSERT INTO improvements (project_id, suggestion, impact, cost_est) VALUES (%s,%s,%s,%s);",(pid, s["suggestion"], s["impact"], s["cost_est"]))
        conn.commit()
    return {"project_id": pid, "suggestions": suggestions}

@APP.get("/v1/project/{pid}/certificate")
@track("/v1/project/{pid}/certificate","GET")
async def project_certificate(pid: str):
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT total FROM scores WHERE project_id=%s;", (pid,))
            row = cur.fetchone()
            if not row: raise HTTPException(404, "score first")
            total=row[0]
    status = "PASS" if total>=80 else ("CONDITIONAL" if total>=65 else "FAIL")
    qr_hash = hashlib.sha256(f"{pid}:{total}".encode()).hexdigest()[:16]
    os.makedirs("certificates", exist_ok=True)
    qr_path=f"certificates/{pid}_qr.png"
    qrcode.make(f"https://verify.sima.ai/{qr_hash}").save(qr_path)
    pdf_path=f"certificates/{pid}.pdf"
    c = canvas.Canvas(pdf_path, pagesize=A4)
    c.setFont("Helvetica-Bold", 20); c.drawString(40*mm, 270*mm, "SIMA AI Accreditation")
    c.setFont("Helvetica", 12); c.drawString(40*mm, 260*mm, f"Project: {pid}")
    c.drawString(40*mm, 253*mm, f"Status: {status}  |  Score: {total}")
    c.drawImage(qr_path, 160*mm, 240*mm, width=30*mm, height=30*mm)
    c.setFont("Helvetica", 9); c.drawString(40*mm, 20*mm, "Scan QR to verify")
    c.showPage(); c.save()
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO certificates (project_id, status, pdf_url, qr_hash) VALUES (%s,%s,%s,%s) ON CONFLICT (project_id) DO UPDATE SET status=EXCLUDED.status, pdf_url=EXCLUDED.pdf_url, qr_hash=EXCLUDED.qr_hash;", (pid, status, pdf_path, qr_hash))
        conn.commit()
    with open(pdf_path,"rb") as fh: data = fh.read()
    return Response(content=data, media_type="application/pdf")

class RAGIn(BaseModel):
    title:str; content:str
@APP.post("/v1/rag/upload")
async def rag_upload(body: RAGIn):
    if not PGVECTOR: return {"ok":False, "msg":"pgvector off"}
    emb = hash_embed(body.content, EMBED_DIM)
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO rag_docs (id, title, content, embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content, embedding=EXCLUDED.embedding;",
                        (body.title, body.title, body.content, emb))
        conn.commit()
    return {"ok":True}

class RAGQuery(BaseModel):
    query:str; k:int=4
@APP.post("/v1/rag/search")
async def rag_search(body: RAGQuery):
    if not PGVECTOR: return {"hits":[]}
    qv = hash_embed(body.query, EMBED_DIM)
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, 1 - (embedding <=> %s) AS sim FROM rag_docs ORDER BY embedding <=> %s LIMIT %s;", (qv, qv, body.k))
            rows = cur.fetchall()
    return {"hits":[{"id":r[0], "title":r[1], "score": float(r[2])} for r in rows]}

class ChatIn(BaseModel):
    message:str; mode: Optional[str] = None
def sse_pack(event, data): return f"event: {event}\\ndata: {json.dumps(data, ensure_ascii=False)}\\n\\n".encode("utf-8")
async def stream_local(prompt: str):
    for w in ("تحليل سعودي: " + prompt[:120] + " — سيتم مراجعة الهوية والبيئة والوظيفة ثم إصدار شهادة.").split():
        yield sse_pack("token", {"text": w + " "}); time.sleep(0.01)
@APP.post("/v1/chat/stream")
async def chat_stream(body: ChatIn):
    async def gen():
        yield sse_pack("start", {"ok": True})
        async for chunk in stream_local(body.message): yield chunk
        yield sse_pack("done", {"finished": True})
    return StreamingResponse(gen(), media_type="text/event-stream")

# MQTT ingest
def mqtt_loop():
    try:
        import paho.mqtt.client as mqtt
    except Exception as e:
        print("MQTT import error:", e); return
    def on_connect(client, userdata, flags, rc, properties=None):
        client.subscribe("sensors/+/+")
    def on_message(client, userdata, msg):
        try:
            parts = msg.topic.split("/")
            _type = parts[-1]; pid = parts[-2]
            val = float(msg.payload.decode("utf-8").strip())
            with psycopg.connect(DB_DSN) as conn:
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO iot_readings (project_id, type, value) VALUES (%s,%s,%s);",(pid, _type, val))
                conn.commit()
        except Exception as e:
            print("MQTT ingest error:", e)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect; client.on_message = on_message
    client.connect(os.getenv("MQTT_URL","mosquitto"), int(os.getenv("MQTT_PORT","1883")), 60)
    client.loop_forever()

MQTT_STARTED=False
@APP.on_event("startup")
def start_mqtt():
    global MQTT_STARTED
    if not MQTT_STARTED:
        t = threading.Thread(target=mqtt_loop, daemon=True); t.start()
        MQTT_STARTED=True

@APP.get("/v1/iot/latest/{pid}")
async def iot_latest(pid: str):
    with psycopg.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT type, value, ts FROM iot_readings WHERE project_id=%s ORDER BY ts DESC LIMIT 20;", (pid,))
            rows = cur.fetchall()
    return {"project_id": pid, "readings":[{"type":r[0], "value":float(r[1]), "ts": r[2].isoformat()} for r in rows]}

@APP.get("/healthz")
async def healthz(): return PlainTextResponse("ok")

@APP.get("/metrics")
async def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)
