"""
OrchaScan 2.0 — Tripo AI Service
Handles integration with Tripo AI API for multiview-to-3D-model generation.
"""

import asyncio
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# Constants
POLL_INTERVAL = 5  # seconds between status checks
MAX_POLL_ATTEMPTS = 120  # max ~10 minutes of polling


class TripoAPIError(Exception):
    """Custom exception for Tripo AI API errors."""
    pass


def _get_headers() -> dict:
    """Get authorization headers for Tripo AI API."""
    settings = get_settings()
    return {
        "Authorization": f"Bearer {settings.tripo_api_key}",
    }


async def upload_image_to_tripo(image_data: bytes, filename: str) -> str:
    """
    Upload a single image to Tripo AI and return the file_token.

    Args:
        image_data: Raw image bytes
        filename: Original filename for content-type detection

    Returns:
        file_token string from Tripo AI
    """
    settings = get_settings()
    url = f"{settings.tripo_api_base_url}/upload"

    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"file": (filename, image_data)}
        response = await client.post(url, headers=_get_headers(), files=files)

        if response.status_code != 200:
            raise TripoAPIError(
                f"Upload failed ({response.status_code}): {response.text}"
            )

        data = response.json()
        if data.get("code") != 0:
            raise TripoAPIError(
                f"Upload error: {data.get('message', 'Unknown error')}"
            )

        file_token = data["data"]["image_token"]
        logger.info(f"Uploaded image to Tripo AI: {filename} → {file_token[:20]}...")
        return file_token


async def create_multiview_task(file_tokens: list[str]) -> str:
    """
    Create a multiview-to-model task on Tripo AI.

    Args:
        file_tokens: List of file tokens from uploaded images

    Returns:
        task_id string
    """
    settings = get_settings()
    url = f"{settings.tripo_api_base_url}/task"

    payload = {
        "type": "multiview_to_model",
        "files": [{"type": "jpg", "file_token": token} for token in file_tokens],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url, headers={**_get_headers(), "Content-Type": "application/json"},
            json=payload,
        )

        if response.status_code != 200:
            raise TripoAPIError(
                f"Task creation failed ({response.status_code}): {response.text}"
            )

        data = response.json()
        if data.get("code") != 0:
            raise TripoAPIError(
                f"Task creation error: {data.get('message', 'Unknown error')}"
            )

        task_id = data["data"]["task_id"]
        logger.info(f"Created Tripo AI multiview task: {task_id}")
        return task_id


async def poll_task_status(task_id: str) -> dict:
    """
    Poll the Tripo AI task status until it completes or fails.

    Args:
        task_id: The task ID to poll

    Returns:
        Task result data containing model_url on success

    Raises:
        TripoAPIError: If task fails or timeout
    """
    settings = get_settings()
    url = f"{settings.tripo_api_base_url}/task/{task_id}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(MAX_POLL_ATTEMPTS):
            response = await client.get(url, headers=_get_headers())

            if response.status_code != 200:
                raise TripoAPIError(
                    f"Status check failed ({response.status_code}): {response.text}"
                )

            data = response.json()
            if data.get("code") != 0:
                raise TripoAPIError(
                    f"Status check error: {data.get('message', 'Unknown error')}"
                )

            task_data = data["data"]
            status = task_data.get("status")

            logger.info(
                f"Tripo AI task {task_id}: status={status} "
                f"(attempt {attempt + 1}/{MAX_POLL_ATTEMPTS})"
            )

            if status == "success":
                output = task_data.get("output") or task_data.get("result") or {}
                
                # Check for various formats: output.model, output.model.url, output.pbr_model.url, etc.
                model_obj = output.get("model") or output.get("pbr_model") or output.get("model_url")
                
                model_url = ""
                if isinstance(model_obj, str):
                    model_url = model_obj
                elif isinstance(model_obj, dict):
                    model_url = model_obj.get("url", "")
                
                if not model_url:
                    logger.error(f"Tripo API returned success but no model URL. Full task_data: {task_data}")
                    raise TripoAPIError(
                        f"Task succeeded but no model URL found in response: {output}"
                    )
                return {"model_url": model_url, "task_data": task_data}

            elif status == "failed":
                raise TripoAPIError(
                    f"Task failed: {task_data.get('message', 'Unknown error')}"
                )

            elif status in ("queued", "running"):
                await asyncio.sleep(POLL_INTERVAL)
            else:
                # Unknown status, keep polling
                await asyncio.sleep(POLL_INTERVAL)

    raise TripoAPIError(
        f"Task {task_id} timed out after {MAX_POLL_ATTEMPTS * POLL_INTERVAL}s"
    )


async def download_model(model_url: str) -> bytes:
    """
    Download the generated 3D model (GLB) from the given URL.

    Args:
        model_url: URL to download the GLB file from

    Returns:
        Raw GLB file bytes
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(model_url)

        if response.status_code != 200:
            raise TripoAPIError(
                f"Model download failed ({response.status_code})"
            )

        logger.info(f"Downloaded 3D model ({len(response.content)} bytes)")
        return response.content


async def generate_3d_model(images: list[tuple[bytes, str]]) -> tuple[str, bytes]:
    """
    Full pipeline: upload images → create task → poll → download model.

    Args:
        images: List of (image_bytes, filename) tuples (4 images)

    Returns:
        Tuple of (tripo_task_id, glb_model_bytes)
    """
    # Step 1: Upload all images
    logger.info(f"Uploading {len(images)} images to Tripo AI...")
    file_tokens = []
    for image_data, filename in images:
        token = await upload_image_to_tripo(image_data, filename)
        file_tokens.append(token)

    # Step 2: Create multiview-to-model task
    logger.info("Creating multiview-to-model task...")
    task_id = await create_multiview_task(file_tokens)

    # Step 3: Poll for completion
    logger.info(f"Polling task {task_id} for completion...")
    result = await poll_task_status(task_id)

    # Step 4: Download the model
    logger.info("Downloading generated 3D model...")
    model_bytes = await download_model(result["model_url"])

    return task_id, model_bytes
