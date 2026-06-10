"""
OrchaScan 2.0 — Pydantic Models / Schemas
Request and response schemas for the API.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class ScanStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    GENERATING_3D = "generating_3d"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================
# Request Schemas
# ============================================

class ScanCreateRequest(BaseModel):
    """Request body for creating a new scan."""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the scan")
    description: Optional[str] = Field(None, description="Optional description")


class AnalysisParams(BaseModel):
    """Parameters for the apple counting analysis."""
    r_target: int = Field(180, ge=0, le=255, description="Target red channel value")
    g_target: int = Field(20, ge=0, le=255, description="Target green channel value")
    b_target: int = Field(20, ge=0, le=255, description="Target blue channel value")
    color_tolerance: int = Field(70, ge=1, le=255, description="Color distance tolerance")
    min_samples: int = Field(5, ge=1, description="DBSCAN min_samples parameter")
    eps_factor: float = Field(0.045, gt=0, description="EPS factor for auto-scaling")


# ============================================
# Response Schemas
# ============================================

class ScanResultResponse(BaseModel):
    """Response schema for scan analysis results."""
    id: str
    scan_id: str
    apple_count: int
    detected_points: int
    r_target: int
    g_target: int
    b_target: int
    color_tolerance: int
    eps_value: Optional[float] = None
    min_samples: int
    cluster_data: Optional[dict] = None
    created_at: Optional[str] = None


class ScanResponse(BaseModel):
    """Response schema for a scan."""
    id: str
    name: str
    description: Optional[str] = None
    status: ScanStatus
    image_front_url: Optional[str] = None
    image_back_url: Optional[str] = None
    image_left_url: Optional[str] = None
    image_right_url: Optional[str] = None
    model_url: Optional[str] = None
    tripo_task_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    result: Optional[ScanResultResponse] = None


class ScanListResponse(BaseModel):
    """Response schema for list of scans."""
    scans: list[ScanResponse]
    total: int


class PipelineStatusResponse(BaseModel):
    """Response for pipeline progress updates."""
    scan_id: str
    status: ScanStatus
    message: str
    progress: int = Field(ge=0, le=100)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str = "2.0.0"
    service: str = "orchascan-api"
