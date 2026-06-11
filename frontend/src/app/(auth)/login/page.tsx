"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Ambient orbs */}
      <div
        style={{
          position: "fixed", top: "20%", left: "10%", width: "400px", height: "400px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(136,245,86,0.05) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "15%", right: "10%", width: "300px", height: "300px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(94,207,46,0.04) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        }}
      />

      <div className="auth-card-shell animate-scale-in" style={{ position: "relative", zIndex: 1 }}>
        <div className="auth-card-core">
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <div
              style={{
                width: "52px", height: "52px",
                background: "var(--color-accent)",
                borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem",
                margin: "0 auto var(--space-lg)",
                boxShadow: "0 0 24px var(--color-accent-glow-md)",
              }}
            >
              🍎
            </div>
            <div className="eyebrow" style={{ justifyContent: "center", marginBottom: "var(--space-md)" }}>
              <span className="eyebrow-dot" />
              OrchaScan 2.0
            </div>
            <h1
              style={{
                fontSize: "var(--fs-2xl)", fontWeight: 800,
                letterSpacing: "-0.03em", marginBottom: "6px",
              }}
            >
              Bon retour !
            </h1>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Connectez-vous pour accéder à vos vergers
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error animate-fade-in" style={{ marginBottom: "var(--space-lg)" }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="login-email">Adresse Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="pro@orchascan.io"
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.9rem",
                marginTop: "var(--space-sm)",
                fontSize: "var(--fs-base)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <span className="btn-icon-trail">→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "var(--space-md)",
              margin: "var(--space-xl) 0",
            }}
          >
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
              PAS DE COMPTE ?
            </span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <Link
            href="/register"
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "0.9rem" }}
          >
            Créer un compte gratuitement
          </Link>
        </div>
      </div>
    </div>
  );
}
