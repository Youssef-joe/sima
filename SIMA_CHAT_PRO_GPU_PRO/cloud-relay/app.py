from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os, json, httpx

app = FastAPI(title="SIMA Cloud Relay")
OPENAI_URL = os.getenv("OPENAI_URL")
OPENAI_KEY = os.getenv("OPENAI_KEY")

class Inp(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(inp: Inp):
    if not OPENAI_URL or not OPENAI_KEY:
        async def gen():
            yield f"event: token\ndata: {json.dumps({'text': '⚠️ Cloud disabled; set OPENAI_URL/KEY'})}\n\n".encode('utf-8')
        return StreamingResponse(gen(), media_type="text/event-stream")
    headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type":"application/json"}
    payload={"model":"gpt-4o-mini", "messages":[{"role":"user","content":inp.prompt}], "stream": True}
    async with httpx.AsyncClient(headers=headers, timeout=120) as client:
        async with client.stream("POST", OPENAI_URL, json=payload) as resp:
            async def gen():
                async for chunk in resp.aiter_raw():
                    yield chunk
            return StreamingResponse(gen(), media_type="text/event-stream")
