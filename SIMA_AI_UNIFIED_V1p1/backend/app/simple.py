from fastapi import FastAPI

app = FastAPI(title="SIMA AI Test", version="1.0.0")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "SIMA AI is running!"}