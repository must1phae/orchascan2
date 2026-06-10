import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* ---- Hero Section ---- */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Intelligence Artificielle × Agriculture
            </div>
            <h1 className="hero-title">
              Comptez vos pommes
              <br />
              <span className="hero-title-accent">en 3D.</span>
            </h1>
            <p className="hero-subtitle">
              Prenez 4 photos de votre pommier, et notre pipeline IA les
              transforme en modèle 3D pour compter automatiquement chaque pomme
              avec une précision remarquable.
            </p>
            <div className="hero-actions">
              <Link href="/scan/new" className="btn btn-primary btn-lg">
                🚀 Lancer un Scan
              </Link>
              <Link href="/dashboard" className="btn btn-secondary btn-lg">
                Voir mes Scans
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative floating elements */}
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "20%",
            fontSize: "8rem",
            opacity: 0.08,
            animation: "float 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          🍎
        </div>
        <div
          style={{
            position: "absolute",
            right: "25%",
            bottom: "15%",
            fontSize: "5rem",
            opacity: 0.05,
            animation: "float 5s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        >
          🌳
        </div>
      </section>

      {/* ---- Pipeline Steps ---- */}
      <section className="pipeline-section">
        <div className="container">
          <div className="section-header animate-fade-in-up">
            <span className="section-tag">Comment ça marche</span>
            <h2 className="section-title">
              De la photo au comptage en 4 étapes
            </h2>
            <p className="section-subtitle">
              Une pipeline complète qui combine vision par ordinateur,
              reconstruction 3D et clustering intelligent.
            </p>
          </div>

          <div className="pipeline-grid">
            <div className="glass-card pipeline-step animate-fade-in-up delay-1">
              <span className="pipeline-step-number">1</span>
              <span className="pipeline-step-icon">📸</span>
              <h3 className="pipeline-step-title">Capture</h3>
              <p className="pipeline-step-desc">
                Prenez 4 photos de votre arbre sous différents angles : face,
                dos, gauche et droite.
              </p>
            </div>

            <div className="glass-card pipeline-step animate-fade-in-up delay-2">
              <span className="pipeline-step-number">2</span>
              <span className="pipeline-step-icon">🧊</span>
              <h3 className="pipeline-step-title">Modélisation 3D</h3>
              <p className="pipeline-step-desc">
                Tripo AI fusionne les 4 vues en un modèle 3D haute fidélité au
                format GLB.
              </p>
            </div>

            <div className="glass-card pipeline-step animate-fade-in-up delay-3">
              <span className="pipeline-step-number">3</span>
              <span className="pipeline-step-icon">🔬</span>
              <h3 className="pipeline-step-title">Analyse DBSCAN</h3>
              <p className="pipeline-step-desc">
                Un algorithme de clustering identifie chaque pomme par filtrage
                couleur et regroupement spatial.
              </p>
            </div>

            <div className="glass-card pipeline-step animate-fade-in-up delay-4">
              <span className="pipeline-step-number">4</span>
              <span className="pipeline-step-icon">📊</span>
              <h3 className="pipeline-step-title">Résultats</h3>
              <p className="pipeline-step-desc">
                Visualisez le modèle 3D interactif et obtenez le comptage précis
                de vos pommes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Stats Section ---- */}
      <section className="section">
        <div className="container">
          <div
            className="glass-card animate-fade-in-up"
            style={{
              padding: "var(--space-3xl)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-xl)",
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-4xl)",
                  fontWeight: "var(--fw-black)",
                  color: "var(--color-accent)",
                  lineHeight: 1,
                }}
              >
                4
              </div>
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-text-muted)",
                  marginTop: "var(--space-sm)",
                }}
              >
                Photos nécessaires
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-4xl)",
                  fontWeight: "var(--fw-black)",
                  color: "var(--color-accent)",
                  lineHeight: 1,
                }}
              >
                3D
              </div>
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-text-muted)",
                  marginTop: "var(--space-sm)",
                }}
              >
                Modèle interactif
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-4xl)",
                  fontWeight: "var(--fw-black)",
                  color: "var(--color-accent)",
                  lineHeight: 1,
                }}
              >
                IA
              </div>
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-text-muted)",
                  marginTop: "var(--space-sm)",
                }}
              >
                Comptage automatique
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className="section" style={{ paddingBottom: "var(--space-5xl)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            className="animate-fade-in-up"
            style={{ fontSize: "var(--fs-3xl)", marginBottom: "var(--space-md)" }}
          >
            Prêt à scanner votre verger ?
          </h2>
          <p
            className="animate-fade-in-up delay-1"
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-2xl)",
              maxWidth: "500px",
              margin: "0 auto var(--space-2xl)",
            }}
          >
            Commencez dès maintenant en uploadant vos premières photos.
          </p>
          <div className="animate-fade-in-up delay-2">
            <Link href="/scan/new" className="btn btn-primary btn-lg">
              Commencer Maintenant →
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          padding: "var(--space-xl) 0",
          textAlign: "center",
          fontSize: "var(--fs-xs)",
          color: "var(--color-text-muted)",
        }}
      >
        <div className="container">
          OrchaScan 2.0 — Stage S4 Génie Informatique · Powered by Tripo AI &
          DBSCAN
        </div>
      </footer>
    </>
  );
}
