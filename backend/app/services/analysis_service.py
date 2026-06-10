"""
OrchaScan 2.0 — Analysis Service
Apple counting using color filtering and DBSCAN clustering on 3D models.
Adapted from the original notebook: tripoai3_nbr_pommes.ipynb
"""

import logging
import tempfile
import os
from typing import Optional

import numpy as np
import trimesh
from sklearn.cluster import DBSCAN

from app.models.schemas import AnalysisParams

logger = logging.getLogger(__name__)


class AnalysisError(Exception):
    """Custom exception for analysis errors."""
    pass


class AnalysisResult:
    """Result of the apple counting analysis."""

    def __init__(
        self,
        apple_count: int,
        detected_points: int,
        eps_value: float,
        cluster_centers: Optional[list] = None,
        cluster_sizes: Optional[list] = None,
    ):
        self.apple_count = apple_count
        self.detected_points = detected_points
        self.eps_value = eps_value
        self.cluster_centers = cluster_centers or []
        self.cluster_sizes = cluster_sizes or []

    def to_dict(self) -> dict:
        """Convert to dictionary for database storage."""
        return {
            "apple_count": self.apple_count,
            "detected_points": self.detected_points,
            "eps_value": self.eps_value,
            "cluster_data": {
                "cluster_centers": [
                    {"x": float(c[0]), "y": float(c[1]), "z": float(c[2])}
                    for c in self.cluster_centers
                ],
                "cluster_sizes": [int(s) for s in self.cluster_sizes],
            },
        }


async def analyze_3d_model(
    glb_data: bytes,
    params: Optional[AnalysisParams] = None,
) -> AnalysisResult:
    """
    Analyze a 3D GLB model to count apples using color filtering and DBSCAN.

    This is a direct adaptation of the algorithm from the notebook:
    - Load the GLB mesh with trimesh
    - Filter vertices by color distance to target RGB (red apples)
    - Cluster filtered points using DBSCAN
    - Each cluster = one apple

    Args:
        glb_data: Raw GLB file bytes
        params: Analysis parameters (color target, tolerance, etc.)

    Returns:
        AnalysisResult with apple count and cluster data
    """
    if params is None:
        params = AnalysisParams()

    # Write GLB to temp file (trimesh requires file path)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".glb", delete=False
        ) as temp_file:
            temp_file.write(glb_data)
            temp_path = temp_file.name

        logger.info(f"Loading 3D model from temp file ({len(glb_data)} bytes)...")

        # 1. Load the model
        scene = trimesh.load(temp_path)
        if isinstance(scene, trimesh.Scene):
            mesh = (
                scene.to_geometry()
                if hasattr(scene, "to_geometry")
                else scene.dump(concatenate=True)
            )
        else:
            mesh = scene

        # Ensure vertex colors are available
        if (
            not hasattr(mesh.visual, "vertex_colors")
            or mesh.visual.vertex_colors is None
        ):
            mesh.visual = mesh.visual.to_color()

        points = mesh.vertices
        colors = mesh.visual.vertex_colors[:, :3]

        logger.info(
            f"Loaded mesh: {len(points)} vertices, "
            f"color target=({params.r_target}, {params.g_target}, {params.b_target}), "
            f"tolerance={params.color_tolerance}"
        )

        # 2. Color filtering
        color_target = np.array([params.r_target, params.g_target, params.b_target])
        color_distance = np.sqrt(
            np.sum((colors.astype(float) - color_target) ** 2, axis=1)
        )
        apple_mask = color_distance < params.color_tolerance
        apple_points = points[apple_mask]

        if len(apple_points) == 0:
            logger.warning("No apple-colored points detected in the model")
            return AnalysisResult(
                apple_count=0,
                detected_points=0,
                eps_value=0.0,
            )

        logger.info(f"Detected {len(apple_points)} apple-colored points")

        # 3. Auto-scale EPS based on point cloud extent
        min_bounds = apple_points.min(axis=0)
        max_bounds = apple_points.max(axis=0)
        dimensions = max_bounds - min_bounds
        max_extent = np.max(dimensions)

        eps_value = max_extent * params.eps_factor
        if eps_value == 0:
            eps_value = 0.05  # Fallback

        logger.info(
            f"DBSCAN params: eps={eps_value:.4f}, "
            f"min_samples={params.min_samples}"
        )

        # 4. DBSCAN Clustering
        db = DBSCAN(eps=eps_value, min_samples=params.min_samples).fit(apple_points)
        labels = db.labels_

        # Count clusters (excluding noise label -1)
        unique_labels = set(labels)
        nb_clusters = len(unique_labels) - (1 if -1 in unique_labels else 0)

        # Compute cluster centers and sizes
        cluster_centers = []
        cluster_sizes = []
        for label in sorted(unique_labels):
            if label == -1:
                continue  # Skip noise
            cluster_mask = labels == label
            cluster_points = apple_points[cluster_mask]
            center = cluster_points.mean(axis=0)
            cluster_centers.append(center)
            cluster_sizes.append(len(cluster_points))

        logger.info(
            f"Analysis complete: {nb_clusters} apples detected "
            f"({len(apple_points)} points)"
        )

        return AnalysisResult(
            apple_count=nb_clusters,
            detected_points=len(apple_points),
            eps_value=eps_value,
            cluster_centers=cluster_centers,
            cluster_sizes=cluster_sizes,
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise AnalysisError(f"Failed to analyze 3D model: {e}")

    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
