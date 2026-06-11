"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function HomePage() {
  // IntersectionObserver for scroll reveals
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        {/* Animated ambient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="container">
          <div className="hero-content">
            {/* Eyebrow tag */}
            <div
              className="eyebrow animate-fade-in"
              style={{ marginBottom: "var(--space-xl)" }}
            >
              <span className="eyebrow-dot" />
              Intelligence Artificielle × Agriculture de Précision
            </div>

            {/* H1 */}
            <h1
              className="hero-title animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Comptez vos pommes
              <br />
              <span className="hero-title-accent">en 3D, automatiquement.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="hero-subtitle animate-fade-in-up"
              style={{ animationDelay: "0.22s" }}
            >
              Prenez 4 photos de votre pommier. Notre pipeline IA les transforme
              en modèle 3D haute fidélité, puis compte chaque pomme avec une
              précision remarquable grâce au clustering DBSCAN.
            </p>

            {/* CTAs */}
            <div
              className="hero-actions animate-fade-in-up"
              style={{ animationDelay: "0.34s" }}
            >
              <Link href="/scan/new" className="btn btn-primary btn-lg">
                Lancer un Scan
                <span className="btn-icon-trail">↗</span>
              </Link>
              <Link href="/dashboard" className="btn btn-secondary btn-lg">
                Voir mes Scans
              </Link>
            </div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "25%",
            fontSize: "6rem",
            opacity: 0.06,
            animation: "float 6s ease-in-out infinite",
            pointerEvents: "none",
            filter: "blur(1px)",
          }}
        >
          🍎
        </div>
        <div
          style={{
            position: "absolute",
            right: "22%",
            bottom: "18%",
            fontSize: "4rem",
            opacity: 0.04,
            animation: "float 8s ease-in-out infinite 2s",
            pointerEvents: "none",
            filter: "blur(2px)",
          }}
        >
          🌳
        </div>
      </section>

      {/* ============ PIPELINE STEPS ============ */}
      <section className="pipeline-section">
        <div className="container">
          {/* Section header */}
          <div className="section-header reveal">
            <div className="eyebrow">Comment ça marche</div>
            <h2 className="section-title">
              De la photo au comptage<br />en 4 étapes simples
            </h2>
            <p className="section-subtitle">
              Une pipeline complète qui combine vision par ordinateur,
              reconstruction 3D et clustering intelligent.
            </p>
          </div>

          {/* Steps grid — asymmetric sizes via inline grid */}
          <div className="pipeline-grid">
            {[
              {
                num: "1",
                icon: "📸",
                title: "Capture",
                desc: "Prenez 4 photos de votre arbre sous différents angles : face, dos, gauche et droite.",
              },
              {
                num: "2",
                icon: "🧊",
                title: "Modélisation 3D",
                desc: "Tripo AI fusionne les 4 vues en un modèle 3D haute fidélité au format GLB.",
              },
              {
                num: "3",
                icon: "🔬",
                title: "Analyse DBSCAN",
                desc: "Un algorithme de clustering identifie chaque pomme par filtrage couleur et regroupement spatial.",
              },
              {
                num: "4",
                icon: "📊",
                title: "Résultats",
                desc: "Visualisez le modèle 3D interactif et obtenez le comptage précis de vos pommes.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="card-shell reveal"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="card-core pipeline-step">
                  <span className="pipeline-step-number">{step.num}</span>
                  <span className="pipeline-step-icon">{step.icon}</span>
                  <h3 className="pipeline-step-title">{step.title}</h3>
                  <p className="pipeline-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS BENTO ============ */}
      <section className="section">
        <div className="container">
          <div className="stats-bento reveal">
            {[
              { val: "4", label: "Photos nécessaires" },
              { val: "3D", label: "Modèle interactif GLB" },
              { val: "IA", label: "Comptage automatique" },
            ].map((stat, i) => (
              <div
                key={stat.val}
                className="card-shell"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="card-core stat-card">
                  <div className="stat-value">{stat.val}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section
        className="section"
        style={{ paddingBottom: "var(--space-5xl)" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <div className="reveal">
            <div className="eyebrow" style={{ marginBottom: "var(--space-xl)" }}>
              Commencez maintenant
            </div>
            <h2
              style={{
                fontSize: "var(--fs-3xl)",
                letterSpacing: "-0.03em",
                marginBottom: "var(--space-md)",
              }}
            >
              Prêt à scanner votre verger ?
            </h2>
            <p
              style={{
                fontSize: "var(--fs-base)",
                color: "var(--color-text-secondary)",
                marginBottom: "var(--space-2xl)",
                maxWidth: "440px",
                margin: "0 auto var(--space-2xl)",
                lineHeight: "var(--lh-relaxed)",
              }}
            >
              Commencez dès maintenant en uploadant vos premières photos.
              Résultats en quelques minutes.
            </p>
            <Link href="/scan/new" className="btn btn-primary btn-lg">
              Commencer Maintenant
              <span className="btn-icon-trail">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          padding: "var(--space-xl) 0",
          textAlign: "center",
          fontSize: "var(--fs-xs)",
          color: "var(--color-text-muted)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="container">
          OrchaScan 2.0 — Stage S4 Génie Informatique ·{" "}
          <span style={{ color: "var(--color-accent)", opacity: 0.7 }}>
            Powered by Tripo AI & DBSCAN
          </span>
        </div>
      </footer>
    </>
  );
}
