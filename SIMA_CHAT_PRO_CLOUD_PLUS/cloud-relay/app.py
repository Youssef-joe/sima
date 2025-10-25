from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import os, json, httpx

app = FastAPI(title="SIMA Cloud Relay", version="0.1")
# Configure one provider (example)
OPENAI_URL = os.getenv("OPENAI_URL")  # e.g., https://api.openai.com/v1/chat/completions
OPENAI_KEY = os.getenv("OPENAI_KEY")

class Inp(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(inp: Inp):
    if not OPENAI_URL or not OPENAI_KEY:
        # Disabled: return local-looking stream for safety
        async def gen():
            yield f"event: token\ndata: {json.dumps({'text': '⚠️ Cloud provider not configured; using local mode.'})}\n\n".encode('utf-8')
        return StreamingResponse(gen(), media_type="text/event-stream")
    headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type":"application/json"}
    payload={"model":"gpt-4o-mini", "messages":[{"role":"user","content":inp.prompt}], "stream": True}
    client = httpx.AsyncClient(headers=headers, timeout=120)
    r = await client.post(OPENAI_URL, json=payload)
    # Pass-through raw stream (simplified)
    async def gen():
        async with client.stream("POST", OPENAI_URL, json=payload) as resp:
            async for chunk in resp.aiter_raw():
                yield chunk
    return StreamingResponse(gen(), media_type="text/event-stream")
