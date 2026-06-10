"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createScan } from "@/lib/api";

type ImagePosition = "front" | "back" | "left" | "right";

const POSITIONS: { key: ImagePosition; label: string; icon: string }[] = [
  { key: "front", label: "Face avant", icon: "📷" },
  { key: "back", label: "Face arrière", icon: "📷" },
  { key: "left", label: "Côté gauche", icon: "📷" },
  { key: "right", label: "Côté droit", icon: "📷" },
];

export default function NewScanPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Record<ImagePosition, File | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [previews, setPreviews] = useState<Record<ImagePosition, string | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = useCallback(
    (position: ImagePosition, file: File | null) => {
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
    },
    []
  );

  const handleDrop = useCallback(
    (position: ImagePosition) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/") || f.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|webp)$/)
      );
      if (files.length === 0) return;

      if (files.length === 1) {
        handleImageChange(position, files[0]);
      } else {
        // Distribute to empty slots
        const positions: ImagePosition[] = ["front", "back", "left", "right"];
        let fileIndex = 0;

        // First try to fill the dropped position
        handleImageChange(position, files[fileIndex++]);

        // Then fill remaining empty slots
        for (const p of positions) {
          if (p !== position && !images[p] && fileIndex < files.length) {
            handleImageChange(p, files[fileIndex++]);
          }
        }
      }
    },
    [handleImageChange, images]
  );

  const allImagesUploaded =
    images.front && images.back && images.left && images.right;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Veuillez entrer un nom pour le scan.");
      return;
    }
    if (!allImagesUploaded) {
      setError("Veuillez uploader les 4 images.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const scan = await createScan(name, description, {
        front: images.front!,
        back: images.back!,
        left: images.left!,
        right: images.right!,
      });
      router.push(`/scan/${scan.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création du scan."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      <a href="/dashboard" className="page-back">
        ← Retour au Dashboard
      </a>
      <div className="page-header" style={{ paddingTop: "var(--space-md)" }}>
        <h1 className="page-title">Nouveau Scan</h1>
      </div>

      {/* Scan Info */}
      <div
        className="glass-card animate-fade-in-up"
        style={{ padding: "var(--space-xl)", marginBottom: "var(--space-xl)" }}
      >
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="scan-name">
              Nom du scan *
            </label>
            <input
              id="scan-name"
              className="input-field"
              type="text"
              placeholder="Ex: Pommier Rang A - Parcelle 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="scan-desc">
              Description (optionnel)
            </label>
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

      {/* Upload Grid */}
      <div
        className="animate-fade-in-up delay-1"
        style={{ marginBottom: "var(--space-xl)" }}
      >
        <h2
          style={{
            fontSize: "var(--fs-lg)",
            fontWeight: "var(--fw-semibold)",
            marginBottom: "var(--space-lg)",
          }}
        >
          📸 Uploadez les 4 vues de votre pommier
        </h2>

        <div className="upload-grid">
          {POSITIONS.map((pos) => (
            <div
              key={pos.key}
              className={`upload-zone ${images[pos.key] ? "has-file" : ""}`}
              onDrop={handleDrop(pos.key)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {previews[pos.key] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previews[pos.key]!}
                    alt={pos.label}
                    className="upload-preview"
                  />
                  <div className="upload-preview-overlay">
                    <span style={{ color: "#fff", fontWeight: 600 }}>
                      Changer l&apos;image
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="upload-zone-icon">{pos.icon}</span>
                  <span className="upload-zone-label">{pos.label}</span>
                  <span className="upload-zone-hint">
                    Glissez ou cliquez pour ajouter
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
                    let fileIndex = 0;
                    handleImageChange(pos.key, files[fileIndex++]);
                    for (const p of positions) {
                      if (p !== pos.key && !images[p] && fileIndex < files.length) {
                        handleImageChange(p, files[fileIndex++]);
                      }
                    }
                  }
                  // Reset input so same files can be selected again if needed
                  e.target.value = "";
                }}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
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

      {/* Submit */}
      <div className="animate-fade-in-up delay-2" style={{ display: "flex", gap: "var(--space-md)" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !allImagesUploaded || !name.trim()}
          style={{ minWidth: 220 }}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Lancement en cours...
            </>
          ) : (
            <>🚀 Lancer l&apos;Analyse</>
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

      {/* Info */}
      <div
        className="animate-fade-in-up delay-3"
        style={{
          marginTop: "var(--space-2xl)",
          padding: "var(--space-lg)",
          background: "var(--color-accent-glow)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(132, 240, 84, 0.1)",
          fontSize: "var(--fs-sm)",
          color: "var(--color-text-secondary)",
          lineHeight: "var(--lh-relaxed)",
        }}
      >
        <strong style={{ color: "var(--color-accent)" }}>💡 Conseil :</strong>{" "}
        Pour de meilleurs résultats, prenez vos photos en lumière naturelle, à
        une distance de 2-3 mètres de l&apos;arbre. Assurez-vous que le pommier
        est bien visible et centré dans chaque image.
      </div>
    </div>
  );
}
