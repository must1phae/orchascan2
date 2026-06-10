"""
OrchaScan 2.0 — FastAPI Application
Main entry point with CORS, logging, and router configuration.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, scans

# ============================================
# Logging Configuration
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ============================================
# Application Lifespan
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("OrchaScan 2.0 API starting up...")
    logger.info(f"Frontend URL: {settings.frontend_url}")
    logger.info(f"Supabase URL: {settings.supabase_url[:30]}...")
    logger.info(f"Tripo AI configured: {'Yes' if settings.tripo_api_key else 'No'}")
    logger.info("=" * 60)
    yield
    logger.info("OrchaScan 2.0 API shutting down...")


# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="OrchaScan 2.0 API",
    description=(
        "Pipeline intelligente de comptage de pommes par modélisation 3D. "
        "Transforme 4 images d'un pommier en modèle 3D via Tripo AI, "
        "puis analyse le modèle pour compter les pommes."
    ),
    version="2.0.0",
    lifespan=lifespan,
)


# ============================================
# CORS Middleware
# ============================================
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Include Routers
# ============================================
app.include_router(health.router, prefix="/api")
app.include_router(scans.router, prefix="/api")


# ============================================
# Root Endpoint
# ============================================
@app.get("/")
async def root():
    """Root endpoint — API info."""
    return {
        "service": "OrchaScan 2.0 API",
        "version": "2.0.0",
        "docs": "/docs",
        "description": "Pipeline intelligente de comptage de pommes par modélisation 3D",
    }
