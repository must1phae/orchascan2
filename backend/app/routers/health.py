"""
OrchaScan 2.0 — Health Check Router
"""

from fastapi import APIRouter
from app.models.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse()
