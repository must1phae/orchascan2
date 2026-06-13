"""
OrchaScan 2.0 — Scans Router
API endpoints for scan CRUD operations and pipeline management.
"""

import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.core.security import get_current_user

from app.models.schemas import (
    AnalysisParams,
    ScanListResponse,
    ScanResponse,
    ScanResultResponse,
    ScanStatus,
)
from app.services import pipeline_service, supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scans", tags=["scans"])


def _format_scan_response(scan: dict) -> ScanResponse:
    """Format a database scan record into a ScanResponse."""
    result = None
    if scan.get("result"):
        r = scan["result"]
        result = ScanResultResponse(
            id=r["id"],
            scan_id=r["scan_id"],
            apple_count=r.get("apple_count", 0),
            detected_points=r.get("detected_points", 0),
            r_target=r.get("r_target", 180),
            g_target=r.get("g_target", 20),
            b_target=r.get("b_target", 20),
            color_tolerance=r.get("color_tolerance", 70),
            eps_value=r.get("eps_value"),
            min_samples=r.get("min_samples", 5),
            cluster_data=r.get("cluster_data"),
            created_at=r.get("created_at"),
        )

    return ScanResponse(
        id=scan["id"],
        name=scan["name"],
        description=scan.get("description"),
        status=ScanStatus(scan["status"]),
        image_front_url=scan.get("image_front_url"),
        image_back_url=scan.get("image_back_url"),
        image_left_url=scan.get("image_left_url"),
        image_right_url=scan.get("image_right_url"),
        model_url=scan.get("model_url"),
        tripo_task_id=scan.get("tripo_task_id"),
        error_message=scan.get("error_message"),
        created_at=scan.get("created_at"),
        updated_at=scan.get("updated_at"),
        result=result,
    )


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image_front: Optional[UploadFile] = File(None),
    image_back: Optional[UploadFile] = File(None),
    image_left: Optional[UploadFile] = File(None),
    image_right: Optional[UploadFile] = File(None),
    model_obj: Optional[UploadFile] = File(None),
    r_target: int = Form(180),
    g_target: int = Form(20),
    b_target: int = Form(20),
    color_tolerance: int = Form(70),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new scan and launch the processing pipeline.

    Accepts 4 images (front, back, left, right) OR a 3D model (model_obj) via multipart form upload.
    The pipeline runs in the background.
    """
    has_images = all([image_front, image_back, image_left, image_right])
    
    if not has_images and not model_obj:
        raise HTTPException(
            status_code=400,
            detail="You must provide either 4 images (front, back, left, right) or a 3D model (.obj, .glb).",
        )

    images = []
    model_bytes = None
    model_filename = None

    if model_obj:
        # Validate 3D model
        allowed_model_types = {".obj", ".glb", ".gltf"}
        ext = ""
        if model_obj.filename and "." in model_obj.filename:
            ext = "." + model_obj.filename.rsplit(".", 1)[-1].lower()
            
        if ext not in allowed_model_types and model_obj.content_type not in {"model/obj", "model/gltf-binary", "application/octet-stream"}:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid 3D model file type. Allowed extensions: {', '.join(allowed_model_types)}",
            )
        model_bytes = await model_obj.read()
        model_filename = model_obj.filename or "model.obj"
    else:
        # Validate images
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
        for img in [image_front, image_back, image_left, image_right]:
            if img.content_type and img.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type for {img.filename}: {img.content_type}. "
                    f"Allowed: {', '.join(allowed_types)}",
                )
        # Read image data
        for img in [image_front, image_back, image_left, image_right]:
            data = await img.read()
            images.append((data, img.filename or "image.jpg"))

    # Create scan record
    user_id = current_user.id
    scan = await supabase_service.create_scan(name, user_id, description)
    scan_id = scan["id"]

    logger.info(f"Created scan {scan_id}, launching pipeline...")

    # Prepare analysis params
    analysis_params = AnalysisParams(
        r_target=r_target,
        g_target=g_target,
        b_target=b_target,
        color_tolerance=color_tolerance,
    )

    # Launch pipeline in background
    background_tasks.add_task(
        pipeline_service.run_scan_pipeline,
        scan_id=scan_id,
        images=images,
        analysis_params=analysis_params,
        model_bytes=model_bytes,
        model_filename=model_filename,
    )

    return _format_scan_response(scan)


@router.get("", response_model=ScanListResponse)
async def list_scans(current_user: dict = Depends(get_current_user)):
    """Get all scans ordered by creation date."""
    scans = await supabase_service.get_all_scans(current_user.id)
    formatted = [_format_scan_response(s) for s in scans]
    return ScanListResponse(scans=formatted, total=len(formatted))


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific scan by ID including its results."""
    scan = await supabase_service.get_scan(scan_id, current_user.id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _format_scan_response(scan)


@router.delete("/{scan_id}", status_code=204)
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a scan and all associated data (images, model, results)."""
    deleted = await supabase_service.delete_scan(scan_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found")
