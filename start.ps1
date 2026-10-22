$backendScript = {
    Set-Location "$PSScriptRoot\backend"
    & ".\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

$frontendScript = {
    Set-Location "$PSScriptRoot\frontend"
    npm run dev
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "Both Backend (http://localhost:8000) and Frontend (http://localhost:5173) are starting up!" -ForegroundColor Green
