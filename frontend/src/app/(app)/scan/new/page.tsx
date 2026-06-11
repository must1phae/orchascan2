"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createScan } from "@/lib/api";

type ImagePosition = "front" | "back" | "left" | "right";

const POSITIONS: { key: ImagePosition; label: string; icon: string; hint: string }[] = [
  { key: "front", label: "Face avant",    icon: "⬆", hint: "Vue de devant" },
  { key: "back",  label: "Face arrière",  icon: "⬇", hint: "Vue de derrière" },
  { key: "left",  label: "Côté gauche",   icon: "⬅", hint: "Vue de gauche" },
  { key: "right", label: "Côté droit",    icon: "➡", hint: "Vue de droite" },
];

export default function NewScanPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Record<ImagePosition, File | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [previews, setPreviews] = useState<Record<ImagePosition, string | null>>({
    front: null, back: null, left: null, right: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = useCallback((position: ImagePosition, file: File | null) => {
    setImages((prev) => ({ ...prev, [position]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => {
        if (prev[position]) URL.revokeObjectURL(prev[position]!);
        return { ...prev, [position]: url };
      });
    } else {
      setPreviews((prev) => {
        if (prev[position]) URL.revokeObjectURL(prev[position]!);
        return { ...prev, [position]: null };
      });
    }
  }, []);

  const handleDrop = useCallback(
    (position: ImagePosition) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|webp)$/)
      );
      if (files.length === 0) return;
      if (files.length === 1) {
        handleImageChange(position, files[0]);
      } else {
        const positions: ImagePosition[] = ["front", "back", "left", "right"];
        let idx = 0;
        handleImageChange(position, files[idx++]);
        for (const p of positions) {
          if (p !== position && !images[p] && idx < files.length) handleImageChange(p, files[idx++]);
        }
      }
    },
    [handleImageChange, images]
  );

  const allImagesUploaded = images.front && images.back && images.left && images.right;
  const uploadedCount = Object.values(images).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Veuillez entrer un nom pour le scan."); return; }
    if (!allImagesUploaded) { setError("Veuillez uploader les 4 images."); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const scan = await createScan(name, description, {
        front: images.front!, back: images.back!, left: images.left!, right: images.right!,
      });
      router.push(`/scan/${scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du scan.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      {/* Back link */}
      <a href="/dashboard" className="page-back animate-fade-in">
        ← Retour au Dashboard
      </a>

      {/* Page header */}
      <div className="page-header" style={{ paddingTop: "var(--space-sm)" }}>
        <div className="animate-fade-in-up">
          <div className="eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
            <span className="eyebrow-dot" />
            Nouveau scan
          </div>
          <h1 className="page-title">Analyser un pommier</h1>
        </div>

        {/* Progress indicator */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            padding: "0.5rem 1rem",
            background: "var(--color-bg-surface-2)",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--color-border-subtle)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: uploadedCount === 4 ? "var(--color-accent)" : "var(--color-text-secondary)",
          }}
        >
          <span>{uploadedCount}/4 photos</span>
          <div style={{ width: 48, height: 5 }}>
            <div style={{
              height: "100%",
              borderRadius: "99px",
              background: "var(--color-bg-surface-3)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${(uploadedCount / 4) * 100}%`,
                background: "var(--color-accent)",
                borderRadius: "99px",
                transition: "width 400ms var(--ease-out-expo)",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Scan Info card */}
      <div className="card-shell animate-fade-in-up" style={{ marginBottom: "var(--space-xl)", animationDelay: "0.1s" }}>
        <div className="card-core" style={{ padding: "var(--space-xl)" }}>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Informations du scan
          </div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="scan-name">Nom du scan *</label>
              <input
                id="scan-name"
                className="input-field"
                type="text"
                placeholder="Ex: Pommier Rang A — Parcelle 3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="scan-desc">Description (optionnel)</label>
              <input
                id="scan-desc"
                className="input-field"
                type="text"
                placeholder="Notes supplémentaires..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Grid */}
      <div className="animate-fade-in-up" style={{ marginBottom: "var(--space-xl)", animationDelay: "0.2s" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-lg)",
          }}
        >
          <h2 style={{ fontSize: "var(--fs-lg)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Uploadez les 4 vues de votre pommier
          </h2>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
            JPG, PNG, WEBP, HEIC
          </span>
        </div>

        <div className="upload-grid">
          {POSITIONS.map((pos, i) => (
            <div
              key={pos.key}
              className={`card-shell`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`upload-zone ${images[pos.key] ? "has-file" : ""}`}
                onDrop={handleDrop(pos.key)}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{
                  borderRadius: "calc(var(--radius-2xl) - 2px)",
                  border: "none",
                  background: "transparent",
                }}
              >
                {previews[pos.key] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[pos.key]!} alt={pos.label} className="upload-preview" />
                    <div className="upload-preview-overlay">
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1.4rem" }}>✏️</span>
                        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600 }}>Changer</span>
                      </div>
                    </div>
                    {/* Checkmark overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "var(--color-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-text-inverse)",
                        zIndex: 3,
                        boxShadow: "0 0 10px var(--color-accent-glow)",
                        animation: "scaleIn 0.3s var(--ease-spring) both",
                      }}
                    >
                      ✓
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-lg)",
                        background: "var(--color-bg-surface-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem",
                        marginBottom: "var(--space-sm)",
                        border: "1px solid var(--color-border)",
                        transition: "transform 300ms var(--ease-spring)",
                      }}
                    >
                      {pos.icon}
                    </div>
                    <span className="upload-zone-label">{pos.label}</span>
                    <span className="upload-zone-hint">{pos.hint}</span>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      Glissez ou cliquez
                    </span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    if (files.length === 1) {
                      handleImageChange(pos.key, files[0]);
                    } else {
                      const positions: ImagePosition[] = ["front", "back", "left", "right"];
                      let idx = 0;
                      handleImageChange(pos.key, files[idx++]);
                      for (const p of positions) {
                        if (p !== pos.key && !images[p] && idx < files.length) handleImageChange(p, files[idx++]);
                      }
                    }
                    e.target.value = "";
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.3s", display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !allImagesUploaded || !name.trim()}
          id="submit-scan"
          style={{ minWidth: 220 }}
        >
          {isSubmitting ? (
            <>
              <span className="spinner spinner-sm" />
              Lancement en cours...
            </>
          ) : (
            <>
              Lancer l&apos;Analyse
              <span className="btn-icon-trail">↗</span>
            </>
          )}
        </button>
        <button
          className="btn btn-ghost btn-lg"
          onClick={() => router.push("/dashboard")}
          disabled={isSubmitting}
        >
          Annuler
        </button>
      </div>

      {/* Info tip */}
      <div
        className="animate-fade-in-up alert alert-info"
        style={{ marginTop: "var(--space-2xl)", animationDelay: "0.4s" }}
      >
        <span style={{ fontSize: "1.1rem" }}>💡</span>
        <span>
          <strong style={{ color: "var(--color-accent)", display: "block", marginBottom: "4px" }}>Conseil pour de meilleurs résultats</strong>
          Prenez vos photos en lumière naturelle, à 2-3 mètres de l&apos;arbre. Assurez-vous que le pommier est bien visible et centré dans chaque image.
        </span>
      </div>
    </div>
  );
}
