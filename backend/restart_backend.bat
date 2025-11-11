@echo off
echo ============================================
echo    RESTART BACKEND SERVER
echo ============================================
echo.
echo [1/3] Stopping all Python processes...
taskkill /F /IM python.exe 2>nul
if %errorlevel% == 0 (
    echo     - Stopped successfully
) else (
    echo     - No Python process found
)
echo.
echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo.
echo [3/3] Starting backend server...
echo     - Host: http://localhost:8000
echo     - Docs: http://localhost:8000/docs
echo.
echo ============================================
echo    BACKEND SERVER STARTING...
echo    Press Ctrl+C to stop
echo ============================================
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

