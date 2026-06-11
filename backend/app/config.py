"""
OrchaScan 2.0 — Configuration
Centralized settings using Pydantic Settings with environment variable support.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Tripo AI
    tripo_api_key: str = ""
    tripo_api_base_url: str = "https://api.tripo3d.ai/v2/openapi"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # Service role key (for backend operations)
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""  # Project Settings → API → JWT Secret

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    # Analysis defaults
    default_r_target: int = 180
    default_g_target: int = 20
    default_b_target: int = 20
    default_color_tolerance: int = 70
    default_min_samples: int = 5
    default_eps_factor: float = 0.045

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
