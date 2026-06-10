"use client";

import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { getScan, pollScanStatus, deleteScan } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      <span className="spinner spinner-lg" />
      <span style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
        Chargement du modèle 3D...
      </span>
    </div>
  );
}

const PIPELINE_STEPS: { status: ScanStatus; label: string; icon: string }[] = [
  { status: "pending", label: "En attente", icon: "⏳" },
  { status: "uploading", label: "Upload des images", icon: "📤" },
  { status: "generating_3d", label: "Génération du modèle 3D", icon: "🧊" },
  { status: "analyzing", label: "Analyse DBSCAN", icon: "🔬" },
  { status: "completed", label: "Terminé", icon: "✅" },
];

function getStepState(
  stepStatus: ScanStatus,
  currentStatus: ScanStatus
): "completed" | "active" | "pending" | "failed" {
  const order = ["pending", "uploading", "generating_3d", "analyzing", "completed"];
  const stepIdx = order.indexOf(stepStatus);
  const currentIdx = order.indexOf(currentStatus);

  if (currentStatus === "failed") {
    return stepIdx <= currentIdx ? "failed" : "pending";
  }
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

function getStatusProgress(status: ScanStatus): number {
  const map: Record<ScanStatus, number> = {
    pending: 5,
    uploading: 20,
    generating_3d: 50,
    analyzing: 80,
    completed: 100,
    failed: 0,
  };
  return map[status] ?? 0;
}

function getStatusBadgeClass(status: ScanStatus): string {
  switch (status) {
    case "completed":
      return "badge badge-success";
    case "failed":
      return "badge badge-danger";
    case "pending":
      return "badge badge-neutral";
    default:
      return "badge badge-active";
  }
}

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

          // If still processing, start polling
          if (
            data.status !== "completed" &&
            data.status !== "failed"
          ) {
            pollScanStatus(resolvedParams.id, (updated) => {
              if (!cancelled) setScan(updated);
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger le scan."
          );
          setLoading(false);
        }
      }
    }

    loadScan();
    return () => {
      cancelled = true;
    };
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

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-2xl)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <span className="spinner spinner-lg" />
          <span style={{ color: "var(--color-text-muted)" }}>
            Chargement du scan...
          </span>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="container" style={{ paddingTop: "var(--space-2xl)" }}>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h2 className="empty-state-title">Scan introuvable</h2>
          <p className="empty-state-desc">{error || "Ce scan n'existe pas."}</p>
          <a href="/dashboard" className="btn btn-primary">
            Retour au Dashboard
          </a>
        </div>
      </div>
    );
  }

  const isProcessing =
    scan.status !== "completed" && scan.status !== "failed";
  const progress = getStatusProgress(scan.status);

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      {/* Header */}
      <a href="/dashboard" className="page-back">
        ← Retour au Dashboard
      </a>
      <div className="page-header" style={{ paddingTop: "var(--space-md)" }}>
        <div>
          <h1 className="page-title">{scan.name}</h1>
          {scan.description && (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--fs-sm)",
                marginTop: "var(--space-xs)",
              }}
            >
              {scan.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <span className={getStatusBadgeClass(scan.status)}>
            {STATUS_LABELS[scan.status]}
          </span>
          <button className="btn btn-danger" onClick={handleDelete} style={{ fontSize: "var(--fs-xs)", padding: "0.4rem 0.8rem" }}>
            Supprimer
          </button>
        </div>
      </div>

      {/* Progress bar for processing scans */}
      {isProcessing && (
        <div
          className="animate-fade-in"
          style={{ marginBottom: "var(--space-xl)" }}
        >
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--space-sm)",
              fontSize: "var(--fs-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            <span>{STATUS_LABELS[scan.status]}...</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {scan.status === "failed" && scan.error_message && (
        <div
          style={{
            padding: "var(--space-md) var(--space-lg)",
            background: "rgba(230, 57, 70, 0.1)",
            border: "1px solid rgba(230, 57, 70, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-danger)",
            fontSize: "var(--fs-sm)",
            marginBottom: "var(--space-xl)",
          }}
        >
          ⚠️ {scan.error_message}
        </div>
      )}

      <div className="detail-grid">
        {/* Left: 3D Viewer / Processing State */}
        <div>
          {scan.status === "completed" && scan.model_url ? (
            <div className="animate-fade-in">
              <ModelViewer modelUrl={scan.model_url} />
            </div>
          ) : isProcessing ? (
            <div
              className="viewer-container"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "var(--space-lg)",
              }}
            >
              <div style={{ fontSize: "4rem", animation: "float 3s ease-in-out infinite" }}>
                {scan.status === "uploading"
                  ? "📤"
                  : scan.status === "generating_3d"
                    ? "🧊"
                    : scan.status === "analyzing"
                      ? "🔬"
                      : "⏳"}
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-lg)",
                    fontWeight: "var(--fw-semibold)",
                    color: "var(--color-accent)",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  {STATUS_LABELS[scan.status]}
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
                  Veuillez patienter, le traitement est en cours...
                </div>
              </div>
              <span className="spinner spinner-lg" />
            </div>
          ) : (
            <div
              className="viewer-container"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "var(--fs-lg)", color: "var(--color-text-muted)" }}>
                Modèle 3D non disponible
              </span>
            </div>
          )}

          {/* Source images */}
          <div style={{ marginTop: "var(--space-xl)" }}>
            <h3
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: "var(--fw-semibold)",
                marginBottom: "var(--space-md)",
              }}
            >
              Images source
            </h3>
            <div className="detail-images">
              {(
                [
                  { url: scan.image_front_url, label: "Face" },
                  { url: scan.image_back_url, label: "Dos" },
                  { url: scan.image_left_url, label: "Gauche" },
                  { url: scan.image_right_url, label: "Droite" },
                ] as const
              ).map((img, i) => (
                <div key={i}>
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt={img.label} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        background: "var(--color-bg-surface)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--fs-sm)",
                        color: "var(--color-text-muted)",
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

        {/* Right: Results & Timeline Sidebar */}
        <div className="detail-sidebar">
          {/* Apple Count Result */}
          {scan.status === "completed" && scan.result && (
            <div className="glass-card result-card animate-fade-in-up">
              <div className="result-count-wrapper">
                <div className="result-count">{scan.result.apple_count}</div>
                <div className="result-count-label">🍎 Pommes détectées</div>
              </div>

              <div className="result-stats">
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
                  <div className="result-stat-label">EPS (DBSCAN)</div>
                </div>
                <div className="result-stat">
                  <div className="result-stat-value">
                    {scan.result.color_tolerance}
                  </div>
                  <div className="result-stat-label">Tolérance</div>
                </div>
                <div className="result-stat">
                  <div className="result-stat-value">
                    {scan.result.min_samples}
                  </div>
                  <div className="result-stat-label">Min Samples</div>
                </div>
              </div>

              {/* Color target */}
              <div
                style={{
                  marginTop: "var(--space-lg)",
                  padding: "var(--space-md)",
                  background: "var(--color-bg-surface)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                    background: `rgb(${scan.result.r_target}, ${scan.result.g_target}, ${scan.result.b_target})`,
                    border: "1px solid var(--color-border)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
                    Couleur cible
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", fontFamily: "var(--font-display)" }}>
                    RGB({scan.result.r_target}, {scan.result.g_target},{" "}
                    {scan.result.b_target})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Timeline */}
          <div className="glass-card animate-fade-in-up delay-1" style={{ padding: "var(--space-xl)" }}>
            <h3
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: "var(--fw-semibold)",
                marginBottom: "var(--space-lg)",
              }}
            >
              Pipeline
            </h3>
            <div className="timeline">
              {PIPELINE_STEPS.map((step, i) => {
                const state = getStepState(step.status, scan.status);
                return (
                  <div className="timeline-step" key={step.status}>
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${state}`} />
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div
                          className={`timeline-line ${state === "completed" ? "completed" : ""
                            }`}
                        />
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className={`timeline-label ${state === "active" ? "active" : ""}`}>
                        {step.icon} {step.label}
                        {state === "active" && isProcessing && (
                          <span
                            className="spinner"
                            style={{
                              width: 12,
                              height: 12,
                              borderWidth: 1.5,
                              marginLeft: 8,
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div
            className="glass-card animate-fade-in-up delay-2"
            style={{ padding: "var(--space-lg)" }}
          >
            <h3
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: "var(--fw-semibold)",
                marginBottom: "var(--space-md)",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Informations
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
                fontSize: "var(--fs-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>ID</span>
                <span style={{ fontFamily: "monospace", fontSize: "var(--fs-xs)" }}>
                  {scan.id.slice(0, 8)}...
                </span>
              </div>
              {scan.tripo_task_id && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Tripo Task
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: "var(--fs-xs)" }}>
                    {scan.tripo_task_id.slice(0, 12)}...
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Créé le</span>
                <span>
                  {scan.created_at
                    ? new Date(scan.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
