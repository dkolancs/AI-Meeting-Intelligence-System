import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable is required")

    from app.services.session_store import SessionStore

    app.state.store = SessionStore()
    port = os.environ.get("PORT", "8000")
    env = os.environ.get("ENVIRONMENT", "development")
    logger.info(f"Meeting Intelligence API starting — port={port} env={env}")
    yield
    logger.info("Meeting Intelligence API shutting down")


app = FastAPI(
    title="Meeting Intelligence API",
    description="AI-powered real-time meeting intelligence for educational sessions",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",")] if allowed_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import analyze, ingest, websocket

app.include_router(ingest.router)
app.include_router(analyze.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "meeting-intelligence"}
