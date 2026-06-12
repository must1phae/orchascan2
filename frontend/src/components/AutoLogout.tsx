"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Timeout duration: 15 minutes (in milliseconds)
const TIMEOUT_MS = 15 * 60 * 1000;

export default function AutoLogout({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    // 1. Déconnexion côté client
    await supabase.auth.signOut();
    // 2. Appel de la route côté serveur pour vider les cookies
    await fetch("/auth/logout", { method: "POST" });
    // 3. Redirection vers la page de connexion
    router.push("/login");
    router.refresh();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Si un utilisateur est connecté, on relance le timer d'inactivité
    if (user) {
      timeoutRef.current = setTimeout(handleLogout, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user) return;

    // Initialisation du timer
    resetTimer();

    // Événements d'activité utilisateur
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Écouteur de changement d'état d'authentification Supabase (ex: expiration du token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
        router.push("/login");
        router.refresh();
      }
    });

    // Nettoyage lors du démontage du composant
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      subscription.unsubscribe();
    };
  }, [user, supabase, router]);

  // Ce composant ne rend rien visuellement
  return null;
}
