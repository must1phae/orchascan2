# 🎨 PROMPT UI/UX PRO — OrchaScan 2.0

> **App :** OrchaScan 2.0 — Pipeline IA de comptage de pommes par reconstruction 3D  
> **Stack :** Next.js 14 · FastAPI · Supabase · React Three Fiber · Tripo AI · DBSCAN  
> **Auteur du prompt :** Expert Designer UI/UX

---

## 🔷 VISION GLOBALE

```
Design a complete, production-grade UI/UX system for "OrchaScan 2.0" —
an AI-powered agricultural SaaS that reconstructs apple trees in 3D from
4 photos and automatically counts apples using DBSCAN clustering + Tripo AI.

The aesthetic direction: "AgriTech meets deep-tech" — think Vercel meets
Precision Agriculture. Dark-first interface. Scientific precision.
Living organic warmth. Not a farming app — a mission-critical AI instrument.

Design language: Obsidian dark glass / bioluminescent accents /
soft volumetric glows / data-dense but breathable /
inspired by Linear, Resend, Raycast, and Luma AI's interfaces.
```

---

## 🎨 SYSTÈME DE DESIGN (TOKENS)

### Couleurs

```
Background:     #0A0C0F  (base canvas, near-black avec blue undertone)
Surface L1:     #0F1114  (cards, panels)
Surface L2:     #141820  (elevated modals, drawers)
Border:         rgba(255,255,255,0.06)  (ultra-subtle glass separators)

Primary Accent: #4ADE80  (emerald green — apple life, AI active state)
Accent Glow:    #22C55E  avec 0.3 blur spread derrière les éléments actifs
Warn/Progress:  #F59E0B  (amber — processing, uploading states)
Danger:         #F43F5E  (rose-red — errors, failed scans)
Info:           #60A5FA  (sky blue — 3D model info, metadata)

Text Primary:   #F1F5F9
Text Secondary: #94A3B8
Text Muted:     #475569
```

### Typographie

```
Display:  "Geist" ou "Cal Sans"     — weight 600-700, tight letter-spacing
Body:     "Inter" ou "Geist"        — 14-15px, 1.6 line-height
Mono:     "JetBrains Mono"          — scan IDs, coordonnées, valeurs RGB

Échelle : 11 / 13 / 15 / 18 / 24 / 32 / 48 / 64px
```

### Espace & Forme

```
Spacing:   Grille de base 4px | Composants : 16/24/32/48px padding
Radius:    Cards 12px | Buttons 8px | Tags 6px | Inputs 8px | Modal 16px
Shadow:    0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)
```

### Glassmorphisme

```css
backdrop-filter: blur(12px) saturate(180%);
background: rgba(255,255,255,0.03);
border: 1px solid rgba(255,255,255,0.08);
```

---

## 📄 PAGE 1 — LANDING PAGE

### Hero Section
- Full-viewport. Layout split : **GAUCHE** texte + CTA / **DROITE** modèle 3D live (arbre en point cloud rotatif, React Three Fiber, style wireframe low-poly)
- Headline : `"Comptez chaque pomme. Automatiquement."` (64px display, saut de ligne après "pomme")
- Sous-titre : `"4 photos → modèle 3D → comptage IA. En moins de 2 minutes."`
- 2 CTAs : `[Lancer un Scan →]` (filled green) + `[Voir une démo]` (ghost)
- Tag animé au-dessus du headline : pulsing green dot + `"Tripo AI × DBSCAN"`
- Background : texture noise subtile + radial gradient glow bas-gauche (#4ADE80 à 3% opacity sur fond noir)
- Particules/dots flottants sur le canvas (CSS animation, low opacity)

### Social Proof Bar
Bande horizontale fine sous le hero :
```
Précision >94%  |  Modèles 3D en <90s  |  Pipeline fully automated
```
Séparateurs verticaux subtils. Police mono.

### Pipeline en 4 étapes — "Comment ça marche"
Stepper horizontal. Chaque étape = carte numérotée :

| # | Icône | Titre | Description |
|---|-------|-------|-------------|
| 1 | 📸 | Upload 4 photos | Front / Back / Left / Right |
| 2 | 🤖 | Génération 3D | Tripo AI multiview_to_model |
| 3 | 🔬 | Analyse couleur | Filtrage RGB + DBSCAN clustering |
| 4 | 📊 | Résultats | Comptage + Visualisation interactive |

Cards : style glass. Numéro de l'étape = grand texte de fond estompé (style "01").  
Ligne de connexion entre cards avec tirets animés au scroll.

### Feature Grid (3 colonnes)
| Feature | Icône | Couleur |
|---------|-------|---------|
| Reconstruction 3D multiview | Cube wireframe | Green |
| Comptage par clustering | Scatter plot dots | Amber |
| Visualisation interactive | Orbit/rotate icon | Blue |
| Historique des scans | List/timeline | Green |
| Export des résultats | Download arrow | Blue |
| Pipeline asynchrone | Flow arrows | Amber |

Chaque card : glass bg, icône colorée, titre, description 1 ligne.

### Demo Preview Section
Mockup plein-largeur — le dashboard dans un frame navigateur sombre.  
Légère perspective CSS 3D (tilt). Gradient fade en bas.  
Label : `"Interface de gestion des scans"`

### Final CTA Section
Centré. Fond sombre avec radial glow vert.  
`"Prêt à compter vos pommes ?"`  
Large button. Champ email optionnel (mode pre-launch/waitlist).

### Footer
4 colonnes : Logo + tagline | Navigation | Stack technique | Contact  
Ultra-minimal. Texte muted. Règle horizontale en haut.

---

## 📄 PAGE 2 — DASHBOARD (Main App)

### Layout
**Sidebar fixe** (240px) + **Zone contenu principal** + panel droit optionnel

### Sidebar
- Top : Logo `"OrchaScan"` + badge version `"2.0"`
- Nav avec icônes Lucide :
  - 🏠 Accueil
  - 📊 Dashboard ← *état actif : bordure gauche verte + bg highlight*
  - 🔍 Mes Scans
  - ➕ Nouveau Scan
  - ⚙️ Paramètres
- Bottom : Avatar utilisateur + email + lien logout
- Item actif : bordure gauche verte 3px + tinte verte subtile en bg

### Header Bar
Titre `"Dashboard"` (gauche) + sélecteur de plage de dates + `[+ Nouveau Scan]` (droite)

### KPI Cards (4 cards, largeur égale)
| Card | Contenu | Couleur |
|------|---------|---------|
| Total Scans | Nombre + sparkline tendance | Neutre |
| Scans Complétés | Nombre + pill verte "↑ +12%" | Vert |
| Pommes Comptées | Total cumulé + tree icon | Amber |
| Précision Moyenne | Pourcentage + arc de progression | Bleu |

Style : glass bg, bordure top colorée 2px, effet lift au hover.

### Graphique Statuts des Scans (plein largeur)
Donut/ring chart : répartition pending / processing / completed / failed  
Labels extérieurs. Centre : total. Légende droite avec dots colorés.  
Librairie : **Recharts** ou D3.

### Tableau Scans Récents
| Colonne | Détail |
|---------|--------|
| Nom du scan | Texte cliquable |
| Date | formatDate fr-FR |
| Statut | Badge coloré |
| Pommes comptées | Nombre ou "—" |
| Actions | 👁️ voir + 🗑️ supprimer (avec tooltip de confirmation) |

Badges statut :
- `completed` → pill verte ✓
- `processing` → pill amber avec spinner animé
- `failed` → pill rouge ✗
- `pending` → pill grise

Empty state : illustration centrée (tree icon + `"Aucun scan pour le moment"`) + CTA `[Créer votre premier scan]`

### Scan Progress Card (si scan actif)
Bandeau collapsible en haut. Étapes pipeline en temps réel :
```
[Upload ✓] → [Génération 3D ⟳] → [Analyse ·] → [Résultats ·]
```
Barre de progression avec shimmer animé sur l'étape active.

---

## 📄 PAGE 3 — NOUVEAU SCAN

### Layout
Conteneur centré (max-width 680px) — formulaire single-column.

### Indicateur d'étapes
```
1 Informations  →  2 Photos  →  3 Lancement
```
Étapes complétées : vert + checkmark. Courante : blanc. Futures : muted.

### Étape 1 — Informations
- Input : `"Nom du scan"` (placeholder : `"Verger Nord — Rangée 4"`)
- Textarea : `"Description (optionnel)"`
- Card glass englobante. Style floating label.

### Étape 2 — Upload 4 Photos
Grille 2×2 avec zones d'upload labellisées :
```
┌──────────┬──────────┐
│  FRONT   │  BACK    │
├──────────┼──────────┤
│  LEFT    │  RIGHT   │
└──────────┴──────────┘
```

Design de chaque zone :
- Bordure en tirets animée au hover (2px dashed rgba(green, 0.3))
- Icône + label + `"Glisser-déposer ou cliquer"`
- Succès upload : preview thumbnail + badge checkmark vert
- Nom du fichier en bas. Bouton ✕ supprimer en haut-droite
- Progression : barre verte fine en bas de la zone

Compteur sous la grille : `"3/4 photos"`. Toutes les 4 requises.

### Étape 3 — Paramètres Avancés (collapsible)
Accordéon `"⚙️ Paramètres d'analyse (avancé)"` :
- Color picker : cible RGB (preview swatch + inputs R/G/B en mono)
- Color Tolerance : slider avec barre de prévisualisation live

Par défaut fermé. Pour power users uniquement.

### CTA
Bouton plein largeur, grand format : `"🚀 Lancer l'analyse"`  
- Désactivé si moins de 4 photos
- État loading : spinner + `"Envoi en cours..."`

---

## 📄 PAGE 4 — DÉTAIL SCAN (Résultats)

### Layout
**60% gauche** (viewer 3D) / **40% droite** (panel résultats)  
Mobile : empilé vertical.

### Gauche — Viewer 3D
- Canvas React Three Fiber. Hauteur totale du panel.
- Contrôles : OrbitControls (rotate / zoom / pan)
- Rendu : modèle GLB texturé (arbre pommier)
- Overlay haut-gauche : `[Réinitialiser la vue]`
- Overlay haut-droite : `[⛶ Plein écran]`
- Sphères colorées aux centres des clusters détectés (vertes, semi-transparentes, taille proportionnelle au cluster_size)
- État loading : cube wireframe 3D tournant + `"Chargement du modèle 3D..."`
- Barre bas : toggle overlay clusters / toggle wireframe

### Droite — Panel Résultats

**Si completed :**
- Grand nombre : `"🍎 47 pommes"` (vert, 48px, bold)
- Sous-titre : `"Détectées par DBSCAN clustering"`

Metrics 2×2 :
| Métrique | Valeur |
|----------|--------|
| Points détectés | `detected_points` |
| Clusters trouvés | nb de clusters |
| Tolérance couleur | `color_tolerance` |
| Min. samples | `min_samples` |

Calibration couleur :
- Label `"Couleur cible"` + preview swatch (grand carré avec couleur exacte)
- Valeurs : `R: 210  G: 45  B: 38` (police mono)

Détail clusters (si cluster_data présent) :
- Liste : index + taille avec barre horizontale inline (sparkbar)

Actions :
```
[📥 Exporter JSON]   [🔁 Re-analyser]   [🗑️ Supprimer]
```

**Si failed :**  
Card rouge avec message d'erreur. Bouton `[🔁 Réessayer l'analyse]`.

**Si en cours :**  
Stepper pipeline animé (polling API toutes les 3s). Chaque étape s'allume à la complétion.

### Navigation
Breadcrumb haut : `"← Retour au Dashboard"`

---

## 📄 PAGES ADDITIONNELLES

### Page Paramètres
- Section Account : nom, email (read-only)
- Section API Keys : clé Tripo AI (masquée, boutons show/copy/régénérer)
- Préférences : langue, toggle thème dark/light
- Danger zone : `"Supprimer toutes les données"` — rouge, derrière modal de confirmation

### Page 404
- Centré. Grand `"404"` en mono muted.
- Headline : `"Ce scan s'est perdu dans l'espace 3D"`
- Sub : `"La page que vous cherchez n'existe pas."`
- Button : `[← Retour à l'accueil]`
- Background : animation point cloud dérivant (canvas, dots verts, lent)

### Loading / Splash
Page entière. Logo OrchaScan centré avec animation (pulse + effet scan line).  
`"Initialisation du pipeline..."`

### Modals
- **Confirmation suppression** : backdrop blur, card centré, bouton confirm rouge
- **Re-analyser** : formulaire avec color picker, slider tolérance, CTA `[Lancer]`

---

## 🎭 MICRO-INTERACTIONS & ANIMATIONS

| Élément | Animation |
|---------|-----------|
| Boutons | `scale(0.97)` au press + collapse shadow |
| Cards | `translateY(-2px)` + shadow augmenté au hover |
| Badges statut actif | Pulsing dot vert (CSS keyframe, infinite) |
| Upload zones | Transition couleur bordure verte au dragover |
| Chargement modèle 3D | Fade in depuis opacity 0 sur 0.8s |
| Transitions de pages | Fade + subtle slide-up (0.2s) |
| KPI counters | Count-up animation au mount |
| Étapes pipeline | Déverrouillage gauche → droite animé |
| Toast notifications | Slide depuis haut-droite, auto-dismiss 4s |
| Sidebar nav | Glissement fluide de la bordure active entre items |
| Lignes du tableau | Fade-in échelonné au chargement initial |

Types de toasts :
- ✅ Succès → vert
- ❌ Erreur → rouge
- ℹ️ Info → bleu
- ⏳ Loading → amber

---

## 📱 RESPONSIVE

### Mobile (< 768px)
- Sidebar → tab bar bas (5 icônes, labels masqués)
- KPI cards → grille 2×2 → puis 1 colonne
- Détail scan → viewer plein-largeur, résultats en dessous (accordion)
- Grille upload → 2×2 maintenu, zones plus petites
- Hero → empilé, viewer 3D remplacé par screenshot statique

### Tablet (768–1024px)
- Sidebar collapsed (icon-only 56px) + labels en tooltip au hover
- Détail scan → split 50/50 maintenu

---

## ⚙️ STACK D'IMPLÉMENTATION RECOMMANDÉ

| Rôle | Outil |
|------|-------|
| Framework | Next.js 14 App Router *(déjà utilisé)* |
| Styling | Tailwind CSS v4 + CSS Variables |
| Composants base | shadcn/ui + overrides custom |
| 3D | React Three Fiber + @react-three/drei |
| Charts | Recharts (KPIs + donut) |
| Icônes | Lucide React |
| Animations | Framer Motion (transitions + micro-interactions) |
| State | Zustand *(déjà utilisé)* |
| Upload | react-dropzone |
| Toasts | Sonner |
| Formulaires | React Hook Form + Zod |
| Police | Geist (Vercel, next/font) |

---

## 🚀 OUTILS POUR GÉNÉRER L'UI

Ce prompt est compatible avec :
- **[v0.dev](https://v0.dev)** — Génération de composants React/Tailwind
- **[Bolt.new](https://bolt.new)** — App complète from scratch
- **[Lovable.dev](https://lovable.dev)** — Full-stack avec Supabase
- **[Gamma](https://gamma.app)** — Présentation du design system
- Un développeur frontend senior pour intégration directe

---

*Prompt généré par analyse experte du code source OrchaScan 2.0*  
*Inspiré par : Linear · Resend · Raycast · Luma AI · Vercel*
