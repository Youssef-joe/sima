from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import time, json, re

app = FastAPI(title="SIMA Local LLM (heuristic)", version="0.2")

class Inp(BaseModel):
    prompt: str

def sse(data): return f"event: token\ndata: {json.dumps({'text': data})}\n\n".encode("utf-8")

@app.post("/generate")
async def generate(inp: Inp):
    text = inp.prompt
    answer = "توصية تصميمية سعودية: "
    if "Najdi" in text or "نجد" in text:
        answer += "حافظ على WWR منخفض، استخدم ظلال عميقة، ألوان RAL 1015/9010، وعناصر مثلثية خفيفة."
    else:
        answer += "راعِ الهوية المحلية والتهوية المتقاطعة واستخدم خامات مريحة بصريًا."
    answer += "\nمواد: لياسة RAL 1013، قرميد طيني، شرائح خشبية."
    answer += "\nتحسين: زوايا فتحات محسوبة حسب التوجه + تشجير الواجهة."
    async def gen():
        for w in re.split(r"(\s+)", answer):
            yield sse(w); time.sleep(0.008)
    return StreamingResponse(gen(), media_type="text/event-stream")
