        from fastapi import FastAPI
        from fastapi.responses import PlainTextResponse

        app = FastAPI()

        @app.get("/healthz")
        def healthz():
            return PlainTextResponse("ok")

        @app.get("/metrics")
        def metrics():
            return PlainTextResponse("# HELP dummy
# TYPE dummy counter
dummy 1
")
