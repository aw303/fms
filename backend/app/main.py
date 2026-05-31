from fastapi import FastAPI

app = FastAPI(
    title="Logistics Fleet Management API",
    description="FastAPI backend for the Logistics & Fleet Management platform.",
    version="0.1.0",
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Logistics Fleet Management FastAPI backend is running"}


@app.get("/api")
def api_root() -> dict[str, str]:
    return {"message": "API root"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
