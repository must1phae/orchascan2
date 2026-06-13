"""
OrchaScan 2.0 — Pipeline Service
Orchestrates the complete scan pipeline:
Upload images → Tripo AI 3D generation → Analysis → Results storage
"""

import logging
import uuid

from app.models.schemas import AnalysisParams
from app.services import supabase_service, tripo_service, analysis_service

logger = logging.getLogger(__name__)


async def run_scan_pipeline(
    scan_id: str,
    images: list[tuple[bytes, str]],
    analysis_params: AnalysisParams | None = None,
    model_bytes: bytes | None = None,
    model_filename: str | None = None,
) -> None:
    """
    Execute the full scan pipeline as a background task.

    Pipeline stages:
    1. Upload images to Supabase Storage (if images provided)
    2. Send images to Tripo AI for 3D model generation (if images provided)
    3. Download and store the 3D model
    4. Analyze the model to count apples
    5. Save results to database

    Args:
        scan_id: UUID of the scan record
        images: List of (image_bytes, filename) tuples (4 images) or empty if model_bytes provided
        analysis_params: Optional analysis parameters override
        model_bytes: Direct 3D model bytes to skip stages 1 & 2
        model_filename: The filename of the provided 3D model
    """
    if analysis_params is None:
        analysis_params = AnalysisParams()

    try:
        if not model_bytes:
            # ============================================
            # Stage 1: Upload images to Supabase Storage
            # ============================================
            logger.info(f"[{scan_id}] Stage 1: Uploading images to Supabase Storage...")
            await supabase_service.update_scan(scan_id, {"status": "uploading"})

            image_positions = ["front", "back", "left", "right"]
            image_urls = {}

            for i, (image_data, filename) in enumerate(images):
                position = image_positions[i] if i < len(image_positions) else f"extra_{i}"
                ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
                storage_path = f"{scan_id}/{position}.{ext}"

                # Determine content type
                content_type = "image/jpeg"
                if ext.lower() == "png":
                    content_type = "image/png"
                elif ext.lower() == "webp":
                    content_type = "image/webp"

                url = await supabase_service.upload_file_to_storage(
                    supabase_service.IMAGES_BUCKET,
                    storage_path,
                    image_data,
                    content_type,
                )
                image_urls[f"image_{position}_url"] = url

            # Update scan with image URLs
            await supabase_service.update_scan(scan_id, image_urls)
            logger.info(f"[{scan_id}] Uploaded {len(images)} images")

            # ============================================
            # Stage 2: Generate 3D model via Tripo AI
            # ============================================
            logger.info(f"[{scan_id}] Stage 2: Generating 3D model via Tripo AI...")
            await supabase_service.update_scan(scan_id, {"status": "generating_3d"})

            tripo_task_id, generated_model_bytes = await tripo_service.generate_3d_model(images)
            model_bytes = generated_model_bytes

            # Update with Tripo task ID
            await supabase_service.update_scan(
                scan_id, {"tripo_task_id": tripo_task_id}
            )
            logger.info(
                f"[{scan_id}] 3D model generated ({len(model_bytes)} bytes), "
                f"tripo_task={tripo_task_id}"
            )
        else:
            logger.info(f"[{scan_id}] Skipping Stage 1 & 2: 3D model directly provided.")
            await supabase_service.update_scan(scan_id, {"status": "generating_3d"})

        # ============================================
        # Stage 3: Store model in Supabase Storage
        # ============================================
        logger.info(f"[{scan_id}] Stage 3: Storing 3D model...")
        model_storage_path = f"{scan_id}/model.glb"
        model_url = await supabase_service.upload_file_to_storage(
            supabase_service.MODELS_BUCKET,
            model_storage_path,
            model_bytes,
            "model/gltf-binary",
        )
        await supabase_service.update_scan(scan_id, {"model_url": model_url})
        logger.info(f"[{scan_id}] Model stored at {model_url}")

        # ============================================
        # Stage 4: Analyze the 3D model
        # ============================================
        logger.info(f"[{scan_id}] Stage 4: Analyzing 3D model...")
        await supabase_service.update_scan(scan_id, {"status": "analyzing"})

        result = await analysis_service.analyze_3d_model(
            model_bytes, analysis_params
        )
        logger.info(
            f"[{scan_id}] Analysis complete: {result.apple_count} apples detected"
        )

        # ============================================
        # Stage 5: Save results
        # ============================================
        logger.info(f"[{scan_id}] Stage 5: Saving results...")
        result_dict = result.to_dict()
        result_dict.update({
            "r_target": analysis_params.r_target,
            "g_target": analysis_params.g_target,
            "b_target": analysis_params.b_target,
            "color_tolerance": analysis_params.color_tolerance,
            "min_samples": analysis_params.min_samples,
        })

        await supabase_service.create_scan_result(scan_id, result_dict)
        await supabase_service.update_scan(scan_id, {"status": "completed"})

        logger.info(
            f"[{scan_id}] Pipeline complete! "
            f"{result.apple_count} apples detected in model"
        )

    except tripo_service.TripoAPIError as e:
        error_msg = f"Tripo AI error: {str(e)}"
        logger.error(f"[{scan_id}] {error_msg}")
        await supabase_service.update_scan(
            scan_id, {"status": "failed", "error_message": error_msg}
        )

    except analysis_service.AnalysisError as e:
        error_msg = f"Analysis error: {str(e)}"
        logger.error(f"[{scan_id}] {error_msg}")
        await supabase_service.update_scan(
            scan_id, {"status": "failed", "error_message": error_msg}
        )

    except Exception as e:
        error_msg = f"Pipeline error: {str(e)}"
        logger.error(f"[{scan_id}] {error_msg}", exc_info=True)
        await supabase_service.update_scan(
            scan_id, {"status": "failed", "error_message": error_msg}
        )
