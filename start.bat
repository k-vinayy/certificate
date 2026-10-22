@echo off
echo ============================================================
echo   Starting Certificate Generator (Backend + Frontend)
echo ============================================================

start "Certificate Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

start "Certificate Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers have been launched:
echo   - Backend:  http://localhost:8000 (API docs: http://localhost:8000/docs)
echo   - Frontend: http://localhost:5173
echo ============================================================
