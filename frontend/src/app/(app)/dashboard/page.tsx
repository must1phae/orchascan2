"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getScans, deleteScan } from "@/lib/api";
import { STATUS_LABELS } from "@/types";
import type { Scan, ScanStatus } from "@/types";

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScanCard({
  scan,
  onDelete,
}: {
  scan: Scan;
  onDelete: (id: string) => void;
}) {
  const imageUrls = [
    scan.image_front_url,
    scan.image_back_url,
    scan.image_left_url,
    scan.image_right_url,
  ];
  const hasImages = imageUrls.some(Boolean);
  const isProcessing =
    scan.status !== "completed" && scan.status !== "failed";

  return (
    <div className="glass-card scan-card animate-fade-in-up">
      <Link
        href={`/scan/${scan.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div className="scan-card-header">
          <div>
            <div className="scan-card-title">{scan.name}</div>
            <div className="scan-card-date">{formatDate(scan.created_at)}</div>
          </div>
          <span className={getStatusBadgeClass(scan.status)}>
            {isProcessing && (
              <span
                className="spinner"
                style={{ width: 10, height: 10, borderWidth: 1.5 }}
              />
            )}
            {STATUS_LABELS[scan.status]}
          </span>
        </div>

        {/* Image thumbnails */}
        {hasImages && (
          <div className="scan-card-images">
            {imageUrls.map((url, i) => (
              <div key={i}>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Vue ${i + 1}`} />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      background: "var(--color-bg-surface-hover)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {scan.status === "completed" && scan.result && (
          <div className="scan-card-result">
            <div className="scan-card-result-count">
              {scan.result.apple_count}
            </div>
            <div>
              <div className="scan-card-result-label">
                🍎 Pommes détectées
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                {scan.result.detected_points.toLocaleString()} points analysés
              </div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div
            className="scan-card-result"
            style={{ justifyContent: "center" }}
          >
            <span
              className="spinner"
              style={{ width: 16, height: 16, borderWidth: 2 }}
            />
            <span
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {STATUS_LABELS[scan.status]}...
            </span>
          </div>
        )}

        {/* Failed indicator */}
        {scan.status === "failed" && (
          <div
            className="scan-card-result"
            style={{
              borderColor: "rgba(230, 57, 70, 0.2)",
              background: "rgba(230, 57, 70, 0.05)",
            }}
          >
            <span style={{ color: "var(--color-danger)", fontSize: "var(--fs-sm)" }}>
              ⚠️ {scan.error_message || "Échec du traitement"}
            </span>
          </div>
        )}
      </Link>

      {/* Delete button */}
      <button
        className="btn btn-ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm("Supprimer ce scan ?")) {
            onDelete(scan.id);
          }
        }}
        style={{
          position: "absolute",
          top: "var(--space-md)",
          right: "var(--space-md)",
          fontSize: "var(--fs-xs)",
          padding: "0.25rem 0.5rem",
          opacity: 0.5,
          zIndex: 2,
        }}
        title="Supprimer"
      >
        🗑️
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ScanStatus>("all");

  const loadScans = async () => {
    try {
      const data = await getScans();
      setScans(data.scans);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les scans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
    // Auto-refresh every 10s if any scans are processing
    const interval = setInterval(() => {
      if (
        scans.some(
          (s) => s.status !== "completed" && s.status !== "failed"
        )
      ) {
        loadScans();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [scans.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    try {
      await deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredScans =
    filter === "all" ? scans : scans.filter((s) => s.status === filter);

  const counts = {
    all: scans.length,
    completed: scans.filter((s) => s.status === "completed").length,
    failed: scans.filter((s) => s.status === "failed").length,
    processing: scans.filter(
      (s) => s.status !== "completed" && s.status !== "failed"
    ).length,
  };

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--fs-sm)",
              marginTop: "var(--space-xs)",
            }}
          >
            {counts.all} scan{counts.all !== 1 ? "s" : ""} au total
            {counts.processing > 0 && (
              <span style={{ color: "var(--color-accent)" }}>
                {" "}
                · {counts.processing} en cours
              </span>
            )}
          </p>
        </div>
        <Link href="/scan/new" className="btn btn-primary">
          + Nouveau Scan
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { key: "all" as const, label: "Tous", count: counts.all },
            {
              key: "completed" as const,
              label: "Terminés",
              count: counts.completed,
            },
            { key: "failed" as const, label: "Échecs", count: counts.failed },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            className={`btn ${filter === f.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f.key)}
            style={{ fontSize: "var(--fs-sm)", padding: "0.4rem 1rem" }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
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
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <span className="spinner spinner-lg" />
          <span style={{ color: "var(--color-text-muted)" }}>
            Chargement des scans...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredScans.length === 0 && (
        <div className="empty-state animate-fade-in-up">
          <div className="empty-state-icon">🌳</div>
          <h2 className="empty-state-title">
            {filter === "all"
              ? "Aucun scan pour le moment"
              : "Aucun résultat"}
          </h2>
          <p className="empty-state-desc">
            {filter === "all"
              ? "Commencez par créer votre premier scan en uploadant 4 photos de votre pommier."
              : "Aucun scan ne correspond à ce filtre."}
          </p>
          {filter === "all" && (
            <Link href="/scan/new" className="btn btn-primary btn-lg">
              🚀 Lancer mon premier Scan
            </Link>
          )}
        </div>
      )}

      {/* Scan grid */}
      {!loading && filteredScans.length > 0 && (
        <div className="scan-grid">
          {filteredScans.map((scan, i) => (
            <div key={scan.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <ScanCard scan={scan} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
