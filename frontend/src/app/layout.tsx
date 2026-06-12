import type { Metadata } from "next";
import "./globals.css";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "OrchaScan 2.0 — Comptage Intelligent de Pommes par Modélisation 3D",
  description:
    "Transformez 4 photos de vos pommiers en modèles 3D et comptez automatiquement les pommes grâce à l'IA et l'analyse DBSCAN.",
  keywords: "pommes, comptage, 3D, IA, agriculture, verger, Tripo AI, DBSCAN",
};

import AutoLogout from "@/components/AutoLogout";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context
          }
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <html lang="fr">
      <body>
        <AutoLogout user={user} />
        <Navbar user={user} />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}

function Navbar({ user }: { user: any }) {
  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        {/* Brand */}
        <a href="/" className="navbar-brand">
          <div className="navbar-brand-icon">🍎</div>
          <span className="navbar-brand-text">OrchaScan</span>
        </a>

        {/* Nav links */}
        <ul className="navbar-nav">
          {user ? (
            <>
              <li>
                <a href="/dashboard" className="navbar-link">
                  Dashboard
                </a>
              </li>
              <li>
                <form action="/auth/logout" method="post" style={{ display: 'inline' }}>
                  <button type="submit" className="navbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Déconnexion
                  </button>
                </form>
              </li>
              <li>
                <a
                  href="/scan/new"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  + Nouveau Scan
                  <span className="btn-icon-trail">↗</span>
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="/login" className="navbar-link">
                  Connexion
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  S&apos;inscrire
                  <span className="btn-icon-trail">→</span>
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}
