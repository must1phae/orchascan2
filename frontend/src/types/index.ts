/**
 * OrchaScan 2.0 — TypeScript Type Definitions
 */

export type ScanStatus =
  | "pending"
  | "uploading"
  | "generating_3d"
  | "analyzing"
  | "completed"
  | "failed";

export interface ScanResult {
  id: string;
  scan_id: string;
  apple_count: number;
  detected_points: number;
  r_target: number;
  g_target: number;
  b_target: number;
  color_tolerance: number;
  eps_value: number | null;
  min_samples: number;
  cluster_data: {
    cluster_centers: { x: number; y: number; z: number }[];
    cluster_sizes: number[];
  } | null;
  created_at: string | null;
}

export interface Scan {
  id: string;
  name: string;
  description: string | null;
  status: ScanStatus;
  image_front_url: string | null;
  image_back_url: string | null;
  image_left_url: string | null;
  image_right_url: string | null;
  model_url: string | null;
  tripo_task_id: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  result: ScanResult | null;
}

export interface ScanListResponse {
  scans: Scan[];
  total: number;
}

export interface AnalysisParams {
  r_target: number;
  g_target: number;
  b_target: number;
  color_tolerance: number;
}

export const STATUS_LABELS: Record<ScanStatus, string> = {
  pending: "En attente",
  uploading: "Upload en cours",
  generating_3d: "Génération 3D",
  analyzing: "Analyse en cours",
  completed: "Terminé",
  failed: "Échec",
};

export const STATUS_COLORS: Record<ScanStatus, string> = {
  pending: "var(--color-text-muted)",
  uploading: "var(--color-accent)",
  generating_3d: "var(--color-accent)",
  analyzing: "var(--color-accent)",
  completed: "var(--color-success)",
  failed: "var(--color-danger)",
};
