import hashlib, math, re
def embed(text: str, dim: int=256) -> list[float]:
    vec = [0.0]*dim
    for tok in re.findall(r"[\w\-]+", (text or "").lower()):
        h = int(hashlib.sha256(tok.encode()).hexdigest(), 16)
        idx = h % dim
        sign = -1.0 if (h>>8) & 1 else 1.0
        vec[idx] += sign * ((h % 1000)/1000.0)
    norm = math.sqrt(sum(x*x for x in vec)) or 1.0
    return [x/norm for x in vec]
