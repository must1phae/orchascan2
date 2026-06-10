"""
OrchaScan 2.0 — Utility Helpers
"""

import mimetypes


def get_content_type(filename: str) -> str:
    """Guess content type from filename."""
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or "application/octet-stream"


def format_file_size(size_bytes: int) -> str:
    """Format bytes into human-readable string."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
