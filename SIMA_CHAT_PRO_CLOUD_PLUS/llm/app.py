from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import time, json, re

app = FastAPI(title="SIMA Local LLM (rule-based demo)", version="0.1")

class Inp(BaseModel):
    prompt: str

def sse(data): return f"event: token\ndata: {json.dumps({'text': data})}\n\n".encode("utf-8")

@app.post("/generate")
async def generate(inp: Inp):
    text = inp.prompt
    # Simple heuristic "generator": rewrite guidance with Saudi-first tone
    answer = "توصية تصميمية سعودية: "
    if "Najdi" in text or "نجد" in text:
        answer += "حافظ على WWR منخفض في الواجهات المشمسة، استخدم تظليل عميق مع ألوان RAL فاتحة (1015/9010)، ونقوش مثلثية خفيفة."
    else:
        answer += "راعِ الظلال والتهوية المتقاطعة، وامزج مواد محلية محايدة مع تفاصيل خشبية."
    answer += "\nخيارات مواد: لياسة بلون RAL 1013، قرميد طيني للسقف، شرائح خشبية للحماية الشمسية."
    answer += "\nتحسين حضري: زيادة التشجير وعمق الرصيف، وتحجيم الفتحات حسب التوجه."
    # stream word by word
    async def gen():
        for w in re.split(r"(\s+)", answer):
            yield sse(w); time.sleep(0.01)
    return StreamingResponse(gen(), media_type="text/event-stream")
