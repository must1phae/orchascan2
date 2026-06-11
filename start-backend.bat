@echo off
echo Lancement du Backend OrchaScan...
cd backend
call venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
