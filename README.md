# 🍎 OrchaScan 2.0

**Pipeline intelligente de comptage de pommes par modélisation 3D**

Application full-stack qui transforme 4 images d'un pommier (prises sous différents angles) en un modèle 3D via l'API Tripo AI, puis analyse automatiquement le modèle pour compter les pommes à l'aide du clustering DBSCAN.

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 + TypeScript + React Three Fiber |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| API 3D | Tripo AI (multiview_to_model) |
| Analyse | Trimesh + DBSCAN (scikit-learn) |

## Lancement

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
copy .env.example .env      # Configurer les clés API
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cd frontend
npm run dev
```

## Configuration

Créer un fichier `.env` dans `/backend` avec :

```env
TRIPO_API_KEY=your_tripo_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Pipeline

1. **Upload** — 4 images (front, arrière, gauche, droite)
2. **Génération 3D** — Tripo AI `multiview_to_model`
3. **Analyse** — Filtrage couleur + DBSCAN clustering
4. **Résultats** — Nombre de pommes + Visualisation 3D interactive
