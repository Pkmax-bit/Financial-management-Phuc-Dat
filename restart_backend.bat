@echo off
echo ========================================
echo    RESTART BACKEND - Excel Nhan Vien V2
echo ========================================
echo.

echo [1/3] Stopping all Python processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✓ Stopped

echo.
echo [2/3] Starting backend...
cd /d "%~dp0backend"
start "FastAPI Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo ✓ Started

echo.
echo [3/3] Testing connection...
timeout /t 2 /nobreak >nul
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Backend is online!
    echo.
    echo ========================================
    echo    SUCCESS!
    echo ========================================
    echo.
    echo Backend running on: http://localhost:8000
    echo.
    echo Next steps:
    echo 1. Open test_employee_excel.html
    echo 2. Or visit: http://localhost:3000/employees
    echo.
) else (
    echo × Backend not responding yet...
    echo   Please wait a few seconds and check the terminal window.
    echo.
)

echo Press any key to exit...
pause >nul

