import sys, requests, textwrap, os, math

API = os.environ.get("API","http://localhost:8080")
title = sys.argv[1] if len(sys.argv)>1 else "DASC"
text_path = sys.argv[2] if len(sys.argv)>2 else "dasc_sample.txt"

with open(text_path,"r",encoding="utf-8") as f:
    t = f.read()

chunk = 1100
parts = [t[i:i+chunk] for i in range(0,len(t),chunk)]
for i,p in enumerate(parts,1):
    r = requests.post(f"{API}/v1/rag/upload", json={"title": f"{title}-{i}", "content": p})
    print(i, r.status_code, r.text)
