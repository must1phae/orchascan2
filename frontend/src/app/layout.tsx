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
        <Navbar user={user} />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}

function Navbar({ user }: { user: any }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand">
          <span className="navbar-brand-icon">🍎</span>
          <span>OrchaScan</span>
        </a>
        <ul className="navbar-nav">
          {user ? (
            <>
              <li>
                <a href="/dashboard" className="navbar-link">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/scan/new" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>
                  + Nouveau Scan
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
                <a href="/register" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>
                  S'inscrire
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
