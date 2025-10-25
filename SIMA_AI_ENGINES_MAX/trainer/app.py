from fastapi import FastAPI
import time, threading, os
app = FastAPI(title="SIMA Trainer 24/7")
STATE = {"iterations":0}
def loop():
    while True:
        time.sleep(2)
        STATE["iterations"] += 1
t = threading.Thread(target=loop, daemon=True); t.start()
@app.get("/") async def root(): return {"ok":True, "iterations": STATE["iterations"]}
