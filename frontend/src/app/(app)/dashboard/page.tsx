"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getScans, deleteScan } from "@/lib/api";
import { STATUS_LABELS } from "@/types";
import type { Scan, ScanStatus } from "@/types";

function getStatusBadgeClass(status: ScanStatus): string {
  switch (status) {
    case "completed": return "badge badge-success";
    case "failed":    return "badge badge-danger";
    case "pending":   return "badge badge-neutral";
    default:          return "badge badge-active";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ScanCard({ scan, onDelete }: { scan: Scan; onDelete: (id: string) => void }) {
  const imageUrls = [scan.image_front_url, scan.image_back_url, scan.image_left_url, scan.image_right_url];
  const hasImages = imageUrls.some(Boolean);
  const isProcessing = scan.status !== "completed" && scan.status !== "failed";

  return (
    <div className="card-shell scan-card animate-fade-in-up" style={{ cursor: "default" }}>
      <div className="card-core" style={{ padding: "var(--space-xl)", borderRadius: "calc(var(--radius-xl) - 2px)" }}>
        <Link
          href={`/scan/${scan.id}`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          {/* Header */}
          <div className="scan-card-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="scan-card-title">{scan.name}</div>
              <div className="scan-card-date">{formatDate(scan.created_at)}</div>
            </div>
            <span className={getStatusBadgeClass(scan.status)}>
              {isProcessing && (
                <span className="spinner spinner-sm" style={{ borderTopColor: "var(--color-accent)" }} />
              )}
              {STATUS_LABELS[scan.status]}
            </span>
          </div>

          {/* Image thumbnails */}
          {hasImages && (
            <div className="scan-card-images" style={{ borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "var(--space-md)" }}>
              {imageUrls.map((url, i) => (
                <div key={i} style={{ aspectRatio: "1", overflow: "hidden", background: "var(--color-bg-surface-3)" }}>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Vue ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 400ms var(--ease-out-expo)" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--color-bg-surface-3)" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {scan.status === "completed" && scan.result && (
            <div className="scan-card-result">
              <div className="scan-card-result-count">{scan.result.apple_count}</div>
              <div>
                <div className="scan-card-result-label">🍎 Pommes détectées</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {scan.result.detected_points.toLocaleString()} points analysés
                </div>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="scan-card-result" style={{ justifyContent: "center", gap: "var(--space-sm)" }}>
              <span className="spinner spinner-sm" />
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
                {STATUS_LABELS[scan.status]}...
              </span>
            </div>
          )}

          {/* Failed */}
          {scan.status === "failed" && (
            <div
              className="scan-card-result"
              style={{ borderColor: "var(--color-danger-border)", background: "var(--color-danger-bg)" }}
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
            if (confirm("Supprimer ce scan définitivement ?")) onDelete(scan.id);
          }}
          style={{
            position: "absolute", top: "14px", right: "14px",
            fontSize: "var(--fs-xs)", padding: "0.25rem 0.5rem",
            opacity: 0.4, zIndex: 2, borderRadius: "var(--radius-md)",
            transition: "opacity var(--transition-fast)",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
          title="Supprimer"
          aria-label="Supprimer ce scan"
        >
          🗑
        </button>
      </div>
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
      setError(err instanceof Error ? err.message : "Impossible de charger les scans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
    const interval = setInterval(() => {
      if (scans.some((s) => s.status !== "completed" && s.status !== "failed")) {
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

  const filteredScans = filter === "all" ? scans : scans.filter((s) => s.status === filter);

  const counts = {
    all: scans.length,
    completed: scans.filter((s) => s.status === "completed").length,
    failed: scans.filter((s) => s.status === "failed").length,
    processing: scans.filter((s) => s.status !== "completed" && s.status !== "failed").length,
  };

  const filterTabs = [
    { key: "all" as const,       label: "Tous",     count: counts.all },
    { key: "completed" as const, label: "Terminés", count: counts.completed },
    { key: "failed" as const,    label: "Échecs",   count: counts.failed },
  ];

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      {/* Page header */}
      <div className="page-header animate-fade-in">
        <div>
          <div className="eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
            <span className="eyebrow-dot" />
            Vue d&apos;ensemble
          </div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-sm)", marginTop: "6px", fontWeight: 500 }}>
            {counts.all} scan{counts.all !== 1 ? "s" : ""} au total
            {counts.processing > 0 && (
              <span style={{ color: "var(--color-accent)", marginLeft: "8px" }}>
                · {counts.processing} en cours
              </span>
            )}
          </p>
        </div>
        <Link href="/scan/new" className="btn btn-primary">
          + Nouveau Scan
          <span className="btn-icon-trail">↗</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "var(--space-xl)",
          padding: "4px",
          background: "var(--color-bg-surface)",
          borderRadius: "var(--radius-full)",
          width: "fit-content",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        {filterTabs.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
            style={{
              borderRadius: "var(--radius-full)",
              transition: "all 250ms var(--ease-out-expo)",
            }}
            id={`filter-${f.key}`}
          >
            {f.label}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "var(--radius-full)",
                background: filter === f.key ? "rgba(0,0,0,0.15)" : "var(--color-bg-surface-2)",
                fontSize: "var(--fs-xs)",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "40vh", flexDirection: "column", gap: "var(--space-md)",
          }}
        >
          <span className="spinner spinner-lg" />
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-sm)" }}>
            Chargement des scans...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredScans.length === 0 && (
        <div className="empty-state animate-fade-in-up">
          <div className="empty-state-icon">🌳</div>
          <h2 className="empty-state-title">
            {filter === "all" ? "Aucun scan pour le moment" : "Aucun résultat"}
          </h2>
          <p className="empty-state-desc">
            {filter === "all"
              ? "Commencez par créer votre premier scan en uploadant 4 photos de votre pommier."
              : "Aucun scan ne correspond à ce filtre."}
          </p>
          {filter === "all" && (
            <Link href="/scan/new" className="btn btn-primary btn-lg">
              🚀 Lancer mon premier Scan
              <span className="btn-icon-trail">↗</span>
            </Link>
          )}
        </div>
      )}

      {/* Scan grid */}
      {!loading && filteredScans.length > 0 && (
        <div className="scan-grid">
          {filteredScans.map((scan, i) => (
            <div key={scan.id} style={{ animationDelay: `${i * 0.06}s` }}>
              <ScanCard scan={scan} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
