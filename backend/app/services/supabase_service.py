"""
OrchaScan 2.0 — Supabase Service
Handles all interactions with Supabase (database + storage).
"""

import logging
from typing import Optional
from supabase import create_client, Client

from app.config import get_settings

logger = logging.getLogger(__name__)

# Singleton Supabase client
_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


# ============================================
# Storage Operations
# ============================================

IMAGES_BUCKET = "scan-images"
MODELS_BUCKET = "scan-models"


async def upload_file_to_storage(
    bucket: str, path: str, file_data: bytes, content_type: str
) -> str:
    """Upload a file to Supabase Storage and return the public URL."""
    client = get_supabase()
    try:
        client.storage.from_(bucket).upload(
            path=path,
            file=file_data,
            file_options={"content-type": content_type},
        )
        # Get public URL
        public_url = client.storage.from_(bucket).get_public_url(path)
        logger.info(f"Uploaded file to {bucket}/{path}")
        return public_url
    except Exception as e:
        logger.error(f"Failed to upload file to {bucket}/{path}: {e}")
        raise


async def download_file_from_storage(bucket: str, path: str) -> bytes:
    """Download a file from Supabase Storage."""
    client = get_supabase()
    try:
        data = client.storage.from_(bucket).download(path)
        logger.info(f"Downloaded file from {bucket}/{path}")
        return data
    except Exception as e:
        logger.error(f"Failed to download file from {bucket}/{path}: {e}")
        raise


# ============================================
# Database Operations — Scans
# ============================================

async def create_scan(name: str, user_id: str, description: Optional[str] = None) -> dict:
    """Create a new scan record in the database."""
    client = get_supabase()
    data = {"name": name, "status": "pending", "user_id": user_id}
    if description:
        data["description"] = description

    result = client.table("scans").insert(data).execute()
    logger.info(f"Created scan: {result.data[0]['id']} for user: {user_id}")
    return result.data[0]


async def update_scan(scan_id: str, updates: dict) -> dict:
    """Update a scan record."""
    client = get_supabase()
    result = client.table("scans").update(updates).eq("id", scan_id).execute()
    logger.info(f"Updated scan {scan_id}: {list(updates.keys())}")
    return result.data[0] if result.data else {}


async def get_scan(scan_id: str, user_id: str) -> Optional[dict]:
    """Get a scan by ID, including its results."""
    client = get_supabase()
    result = client.table("scans").select("*").eq("id", scan_id).eq("user_id", user_id).execute()
    if not result.data:
        return None

    scan = result.data[0]

    # Fetch associated results
    results = (
        client.table("scan_results")
        .select("*")
        .eq("scan_id", scan_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if results.data:
        scan["result"] = results.data[0]

    return scan


async def get_all_scans(user_id: str) -> list[dict]:
    """Get all scans ordered by creation date."""
    client = get_supabase()
    result = (
        client.table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    scans = result.data or []

    # Fetch results for completed scans
    for scan in scans:
        if scan.get("status") == "completed":
            results = (
                client.table("scan_results")
                .select("*")
                .eq("scan_id", scan["id"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if results.data:
                scan["result"] = results.data[0]

    return scans


async def delete_scan(scan_id: str, user_id: str) -> bool:
    """Delete a scan and its associated storage files."""
    client = get_supabase()
    scan = await get_scan(scan_id, user_id)
    if not scan:
        return False

    # Delete storage files
    try:
        # Delete images
        image_paths = []
        for key in ["image_front_url", "image_back_url", "image_left_url", "image_right_url"]:
            if scan.get(key):
                # Extract path from URL
                path = _extract_storage_path(scan[key], IMAGES_BUCKET)
                if path:
                    image_paths.append(path)
        if image_paths:
            client.storage.from_(IMAGES_BUCKET).remove(image_paths)

        # Delete model
        if scan.get("model_url"):
            model_path = _extract_storage_path(scan["model_url"], MODELS_BUCKET)
            if model_path:
                client.storage.from_(MODELS_BUCKET).remove([model_path])
    except Exception as e:
        logger.warning(f"Error cleaning up storage for scan {scan_id}: {e}")

    # Delete database record (cascade will delete results)
    client.table("scans").delete().eq("id", scan_id).execute()
    logger.info(f"Deleted scan {scan_id}")
    return True


# ============================================
# Database Operations — Scan Results
# ============================================

async def create_scan_result(scan_id: str, result_data: dict) -> dict:
    """Create a scan result record."""
    client = get_supabase()
    result_data["scan_id"] = scan_id
    result = client.table("scan_results").insert(result_data).execute()
    logger.info(f"Created scan result for scan {scan_id}")
    return result.data[0]


# ============================================
# Helpers
# ============================================

def _extract_storage_path(public_url: str, bucket: str) -> Optional[str]:
    """Extract the storage path from a Supabase public URL."""
    try:
        marker = f"/storage/v1/object/public/{bucket}/"
        idx = public_url.index(marker)
        return public_url[idx + len(marker):]
    except (ValueError, IndexError):
        return None
