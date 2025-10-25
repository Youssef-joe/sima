from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import time, json, re

app = FastAPI(title="SIMA Local LLM")

class Inp(BaseModel):
    prompt: str

def sse(data): return f"event: token\ndata: {json.dumps({'text': data})}\n\n".encode("utf-8")

@app.post("/generate")
async def generate(inp: Inp):
    answer = "سأراجع المشروع وفق الموجهات السعودية وأصدر شهادة PASS/FAIL."
    async def gen():
        for w in re.split(r"(\s+)", answer):
            yield sse(w); time.sleep(0.01)
    return StreamingResponse(gen(), media_type="text/event-stream")
