"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, farm_name: farmName },
      },
    });

    if (error) {
      setError(error.message);
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
          position: "fixed", top: "10%", right: "15%", width: "450px", height: "450px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(136,245,86,0.04) 0%, transparent 70%)",
          filter: "blur(70px)", pointerEvents: "none", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "10%", left: "5%", width: "320px", height: "320px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(94,207,46,0.035) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        }}
      />

      <div
        className="auth-card-shell animate-scale-in"
        style={{ position: "relative", zIndex: 1, maxWidth: "520px" }}
      >
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
              Rejoignez OrchaScan
            </div>
            <h1
              style={{
                fontSize: "var(--fs-2xl)", fontWeight: 800,
                letterSpacing: "-0.03em", marginBottom: "6px",
              }}
            >
              Créer un compte
            </h1>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Analysez votre verger grâce à l&apos;IA en quelques minutes
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
          <form
            onSubmit={handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
          >
            {/* Row: Prénom + Ferme */}
            <div className="form-row" style={{ gap: "var(--space-md)" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-firstname">Prénom / Nom</label>
                <input
                  id="reg-firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jean Dupont"
                  autoComplete="name"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-farm">Verger / Ferme</label>
                <input
                  id="reg-farm"
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="input-field"
                  placeholder="Ferme des Pommiers"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="reg-email">Adresse Email</label>
              <input
                id="reg-email"
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
              <label className="input-label" htmlFor="reg-password">
                Mot de passe
                <span style={{ color: "var(--color-text-muted)", marginLeft: "6px", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  (min. 6 caractères)
                </span>
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1, height: "3px", borderRadius: "99px",
                      background: password.length >= level * 3
                        ? level === 1 ? "var(--color-danger)"
                          : level === 2 ? "var(--color-warning)"
                            : "var(--color-accent)"
                        : "var(--color-bg-surface-3)",
                      transition: "background 300ms var(--ease-out-expo)",
                    }}
                  />
                ))}
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginLeft: "6px", whiteSpace: "nowrap" }}>
                  {password.length < 3 ? "Faible" : password.length < 6 ? "Moyen" : "Fort"}
                </span>
              </div>
            )}

            <button
              id="register-submit"
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
                  Création du compte...
                </>
              ) : (
                <>
                  Créer mon compte
                  <span className="btn-icon-trail">↗</span>
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
              DÉJÀ UN COMPTE ?
            </span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <Link
            href="/login"
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "0.9rem" }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
