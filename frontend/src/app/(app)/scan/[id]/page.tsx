"use client";

import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { getScan, pollScanStatus, deleteScan } from "@/lib/api";
import { STATUS_LABELS } from "@/types";
import type { Scan, ScanStatus } from "@/types";

// Dynamic import for Three.js (no SSR)
const ModelViewer = dynamic(
  () => import("@/components/viewer/ModelViewer"),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

function ViewerSkeleton() {
  return (
    <div
      className="viewer-container"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-md)" }}
    >
      <span className="spinner spinner-lg" />
      <span style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
        Chargement du modèle 3D...
      </span>
    </div>
  );
}

const PIPELINE_STEPS: { status: ScanStatus; label: string; icon: string }[] = [
  { status: "pending",      label: "En attente",          icon: "⏳" },
  { status: "uploading",    label: "Upload des images",   icon: "📤" },
  { status: "generating_3d",label: "Génération 3D",       icon: "🧊" },
  { status: "analyzing",    label: "Analyse DBSCAN",      icon: "🔬" },
  { status: "completed",    label: "Terminé",             icon: "✅" },
];

function getStepState(stepStatus: ScanStatus, currentStatus: ScanStatus): "completed" | "active" | "pending" | "failed" {
  const order = ["pending", "uploading", "generating_3d", "analyzing", "completed"];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);
  if (currentStatus === "failed") return stepIdx <= currentIdx ? "failed" : "pending";
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

function getStatusProgress(status: ScanStatus): number {
  const map: Record<ScanStatus, number> = {
    pending: 5, uploading: 20, generating_3d: 50, analyzing: 80, completed: 100, failed: 0,
  };
  return map[status] ?? 0;
}

function getStatusBadgeClass(status: ScanStatus): string {
  switch (status) {
    case "completed": return "badge badge-success";
    case "failed":    return "badge badge-danger";
    case "pending":   return "badge badge-neutral";
    default:          return "badge badge-active";
  }
}

const PROCESSING_ICONS: Record<string, string> = {
  uploading: "📤", generating_3d: "🧊", analyzing: "🔬", pending: "⏳",
};

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadScan() {
      try {
        const data = await getScan(resolvedParams.id);
        if (!cancelled) {
          setScan(data);
          setLoading(false);
          if (data.status !== "completed" && data.status !== "failed") {
            pollScanStatus(resolvedParams.id, (updated) => {
              if (!cancelled) setScan(updated);
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le scan.");
          setLoading(false);
        }
      }
    }
    loadScan();
    return () => { cancelled = true; };
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!scan) return;
    if (!confirm("Supprimer ce scan et toutes ses données ?")) return;
    try {
      await deleteScan(scan.id);
      window.location.href = "/dashboard";
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-2xl)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "var(--space-md)" }}>
          <span className="spinner spinner-lg" />
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-sm)" }}>Chargement du scan...</span>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !scan) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-2xl)" }}>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h2 className="empty-state-title">Scan introuvable</h2>
          <p className="empty-state-desc">{error || "Ce scan n'existe pas."}</p>
          <a href="/dashboard" className="btn btn-primary">
            Retour au Dashboard
            <span className="btn-icon-trail">←</span>
          </a>
        </div>
      </div>
    );
  }

  const isProcessing = scan.status !== "completed" && scan.status !== "failed";
  const progress = getStatusProgress(scan.status);
  const processingIcon = PROCESSING_ICONS[scan.status] ?? "⏳";

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>

      {/* ── Back + Header ─────────────────────────────────────────────── */}
      <a href="/dashboard" className="page-back animate-fade-in">← Retour au Dashboard</a>

      <div className="page-header animate-fade-in-up" style={{ paddingTop: "var(--space-sm)" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
            <span className="eyebrow-dot" />
            Détail du scan
          </div>
          <h1 className="page-title">{scan.name}</h1>
          {scan.description && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-sm)", marginTop: "6px", fontWeight: 500 }}>
              {scan.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <span className={getStatusBadgeClass(scan.status)}>
            {isProcessing && <span className="spinner spinner-sm" />}
            {STATUS_LABELS[scan.status]}
          </span>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            id="delete-scan-btn"
            style={{ borderRadius: "var(--radius-full)" }}
          >
            🗑 Supprimer
          </button>
        </div>
      </div>

      {/* ── Progress bar (processing only) ──────────────────────────────── */}
      {isProcessing && (
        <div className="card-shell animate-fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-core" style={{ padding: "var(--space-lg) var(--space-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--color-accent)" }}>
                {STATUS_LABELS[scan.status]}...
              </span>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                {progress}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Error message ─────────────────────────────────────────────── */}
      {scan.status === "failed" && scan.error_message && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <span>⚠</span>
          <span>{scan.error_message}</span>
        </div>
      )}

      {/* ── Main detail grid ──────────────────────────────────────────── */}
      <div className="detail-grid">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>

          {/* 3D Viewer or Processing state */}
          {scan.status === "completed" && scan.model_url ? (
            <div className="animate-scale-in">
              <div
                style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--color-text-muted)",
                  marginBottom: "var(--space-md)",
                }}
              >
                Modèle 3D Interactif
              </div>
              <ModelViewer modelUrl={scan.model_url} />
            </div>
          ) : isProcessing ? (
            <div className="card-shell animate-fade-in">
              <div
                className="card-core viewer-container"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: "var(--space-xl)",
                  borderRadius: "calc(var(--radius-xl) - 2px)",
                }}
              >
                {/* Animated processing icon */}
                <div
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {/* Glowing ring */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100px", height: "100px",
                      borderRadius: "50%",
                      border: "1px solid var(--color-accent)",
                      opacity: 0.15,
                      animation: "pulse-glow 2s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: "72px", height: "72px",
                      borderRadius: "var(--radius-xl)",
                      background: "var(--color-bg-surface-3)",
                      border: "1px solid var(--color-border-md)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "2rem",
                      animation: "float 3s ease-in-out infinite",
                      boxShadow: "0 0 32px var(--color-accent-glow)",
                    }}
                  >
                    {processingIcon}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)",
                      fontWeight: 800, color: "var(--color-accent)",
                      letterSpacing: "-0.02em", marginBottom: "8px",
                    }}
                  >
                    {STATUS_LABELS[scan.status]}
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    Veuillez patienter, la page se met à jour automatiquement...
                  </div>
                </div>

                <span className="spinner spinner-lg" />
              </div>
            </div>
          ) : (
            <div className="card-shell">
              <div className="card-core viewer-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "var(--fs-md)", color: "var(--color-text-muted)" }}>
                  Modèle 3D non disponible
                </span>
              </div>
            </div>
          )}

          {/* Source images */}
          <div className="card-shell animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="card-core" style={{ padding: "var(--space-xl)" }}>
              <div
                style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--color-text-muted)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                Images Source
              </div>
              <div className="detail-images">
                {([
                  { url: scan.image_front_url, label: "Face" },
                  { url: scan.image_back_url,  label: "Dos" },
                  { url: scan.image_left_url,  label: "Gauche" },
                  { url: scan.image_right_url, label: "Droite" },
                ] as const).map((img, i) => (
                  <div key={i}>
                    {img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={img.label} />
                    ) : (
                      <div
                        style={{
                          width: "100%", aspectRatio: "1",
                          background: "var(--color-bg-surface-3)",
                          borderRadius: "var(--radius-md)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "var(--fs-sm)", color: "var(--color-text-muted)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        —
                      </div>
                    )}
                    <div className="detail-images-label">{img.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
        <div className="detail-sidebar">

          {/* Apple count result card */}
          {scan.status === "completed" && scan.result && (
            <div className="card-shell animate-scale-in">
              <div className="card-core result-card" style={{ borderRadius: "calc(var(--radius-2xl) - 2px)" }}>
                <div className="result-count-wrapper">
                  <div className="result-count">{scan.result.apple_count}</div>
                  <div className="result-count-label">🍎 Pommes détectées</div>
                </div>

                <div className="result-stats" style={{ marginBottom: "var(--space-lg)" }}>
                  <div className="result-stat">
                    <div className="result-stat-value">
                      {scan.result.detected_points.toLocaleString()}
                    </div>
                    <div className="result-stat-label">Points détectés</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-stat-value">
                      {scan.result.eps_value?.toFixed(4) ?? "—"}
                    </div>
                    <div className="result-stat-label">EPS DBSCAN</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-stat-value">{scan.result.color_tolerance}</div>
                    <div className="result-stat-label">Tolérance</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-stat-value">{scan.result.min_samples}</div>
                    <div className="result-stat-label">Min Samples</div>
                  </div>
                </div>

                {/* Color target */}
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--space-md)",
                    padding: "var(--space-md)", background: "var(--color-bg-surface)",
                    borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "var(--radius-md)", flexShrink: 0,
                      background: `rgb(${scan.result.r_target}, ${scan.result.g_target}, ${scan.result.b_target})`,
                      border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginBottom: "3px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Couleur cible
                    </div>
                    <div style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      rgb({scan.result.r_target}, {scan.result.g_target}, {scan.result.b_target})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline timeline card */}
          <div className="card-shell animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="card-core" style={{ padding: "var(--space-xl)", borderRadius: "calc(var(--radius-2xl) - 2px)" }}>
              <div
                style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--color-text-muted)",
                  marginBottom: "var(--space-xl)",
                }}
              >
                Pipeline de traitement
              </div>

              <div className="timeline">
                {PIPELINE_STEPS.map((step, i) => {
                  const state = getStepState(step.status, scan.status);
                  return (
                    <div className="timeline-step" key={step.status}>
                      <div className="timeline-dot-wrapper">
                        <div className={`timeline-dot ${state}`} />
                        {i < PIPELINE_STEPS.length - 1 && (
                          <div className={`timeline-line ${state === "completed" ? "completed" : ""}`} />
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className={`timeline-label ${state === "active" ? "active" : ""}`}>
                          <span>{step.icon}</span>
                          <span>{step.label}</span>
                          {state === "active" && isProcessing && (
                            <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
                          )}
                          {state === "completed" && (
                            <span style={{ color: "var(--color-accent)", fontSize: "0.7rem", marginLeft: "auto" }}>✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Metadata card */}
          <div className="card-shell animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="card-core" style={{ padding: "var(--space-lg)", borderRadius: "calc(var(--radius-2xl) - 2px)" }}>
              <div
                style={{
                  fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--color-text-muted)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                Informations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "var(--fs-sm)" }}>
                {[
                  { label: "ID", value: scan.id.slice(0, 8) + "…", mono: true },
                  ...(scan.tripo_task_id ? [{ label: "Tripo Task", value: scan.tripo_task_id.slice(0, 12) + "…", mono: true }] : []),
                  {
                    label: "Créé le", mono: false,
                    value: scan.created_at
                      ? new Date(scan.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontFamily: item.mono ? "var(--font-mono)" : undefined, fontSize: item.mono ? "var(--fs-xs)" : undefined, color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
