from typing import Dict, Any, List

def score_identity(identities: Dict[str, Any], payload: Dict[str, Any]):
    region = payload.get("region_hint")
    wwr = float(payload.get("wwr", 0))
    height_ratio = float(payload.get("height_ratio", 1.5))
    colors = [c.lower() for c in payload.get("colors", [])]
    features = [f.lower() for f in payload.get("features", [])]

    score = 50.0
    used = "unknown"
    if region and region in identities:
        used = region
        r = identities[region]
        wmin, wmax = r.get("wwr_range", [10,40])
        if wmin <= wwr <= wmax: score += 15
        else: score -= min(10, abs((wwr - (wmin+wmax)/2) / 5))

        hmin, hmax = r.get("height_to_width_ratio", [1.2, 2.7])
        if hmin <= height_ratio <= hmax: score += 10
        else: score -= min(8, abs(height_ratio - (hmin+hmax)/2))

        pal = set([c.lower() for c in r.get("colors_ral", [])])
        if any(c in pal for c in colors): score += 10

        need = set([x.lower() for x in r.get("key_features", [])])
        overlap = len(need.intersection(set(features)))
        score += min(15, overlap*5)
    return {"region": used, "authenticity_score": round(max(0, min(100, score)),2)}

def load_identities(path: str) -> Dict[str, Any]:
    import json, os
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
