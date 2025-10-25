from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, Response, PlainTextResponse
from pydantic import BaseModel
import os, io, json, time, uuid, hashlib
import psycopg
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pypdf import PdfReader

app = FastAPI(title="SIMA API v1.2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

REQ = Counter("sima_requests_total","reqs",["route","method"])
LAT = Histogram("sima_request_latency_seconds","lat",["route"], buckets=[0.05,0.1,0.2,0.5,1,2,5,8,13])
PASS = Counter("sima_cert_pass_total","pass"); FAIL = Counter("sima_cert_fail_total","fail")

DB = os.getenv("DB_DSN","postgresql://postgres:postgres@db:5432/sima")
EMB_DIM = int(os.getenv("EMBED_DIM","384"))

def db():
    return psycopg.connect(DB)

def init():
    with db() as c:
        with c.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE TABLE IF NOT EXISTS rag_docs(id TEXT PRIMARY KEY, title TEXT, content TEXT, embedding vector(%s));",(EMB_DIM,))
    seed_path = "app/data/seed_rag.txt"
    if os.path.exists(seed_path):
        text = open(seed_path,"r",encoding="utf-8",errors="ignore").read()
        for i, chunk in enumerate([text[j:j+1100] for j in range(0,len(text),1100)],1):
            with db() as c:
                with c.cursor() as cur:
                    cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING;",
                                (f"seed-{i}", f"DASC-{i}", chunk, [0.0]*EMB_DIM))
                c.commit()
init()

@app.get("/metrics")
def metrics(): return StreamingResponse(io.BytesIO(generate_latest()), media_type=CONTENT_TYPE_LATEST)

class Up(BaseModel):
    message:str
@app.post("/v1/chat/stream")
def chat(body: Up):
    def it():
        yield f"event: start\ndata: {{}}\n\n"
        for t in ("تحليل سعودي: "+body.message).split(): yield f"event: token\ndata: {{\"text\": \"{t} \"}}\n\n"
        yield f"event: done\ndata: {{}}\n\n"
    return StreamingResponse(it(), media_type="text/event-stream")

@app.post("/v1/rag/ingest-pdf")
def ingest(file: UploadFile = File(...), title: str = Form("DASC")):
    raw = file.file.read()
    r = PdfReader(io.BytesIO(raw))
    chunks = []
    for p in r.pages:
        chunks.append((p.extract_text() or "")[:2000])
    n=0
    with db() as c:
        with c.cursor() as cur:
            for i,ch in enumerate(chunks,1):
                cur.execute("INSERT INTO rag_docs (id,title,content,embedding) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content;",
                            (f"{title}-{i}", f"{title}-{i}", ch, [0.0]*EMB_DIM))
                n+=1
        c.commit()
    return {"ok": True, "chunks": n}

@app.get("/healthz")
def h(): return PlainTextResponse("ok")
