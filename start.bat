@echo off
title DepositGuard Launcher
cd /d "%~dp0"

echo ========================================================
echo               DepositGuard Local Launcher
echo ========================================================
echo.

echo [1/3] Starting Backend API (FastAPI) on http://localhost:8000 ...
start "DepositGuard Backend" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && python -m uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Frontend (Vite + React) on http://localhost:5173 ...
start "DepositGuard Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   DepositGuard is now running locally!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
echo   To stop DepositGuard, simply close the two command
echo   windows (Backend and Frontend).
echo ========================================================
echo.
pause
