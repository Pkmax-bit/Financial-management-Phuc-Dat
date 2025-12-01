@echo off
REM Script tắt Backend Server (Windows)
REM Tắt tất cả các process Python đang chạy uvicorn

echo ============================================
echo    STOP BACKEND SERVER
echo ============================================
echo.

echo [1/2] Đang tìm và dừng Backend Server...
echo.

REM Tìm và dừng các process uvicorn
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :8000') do (
    echo     - Đang dừng process trên port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Dừng tất cả process Python (nếu cần)
echo [2/2] Đang dừng tất cả process Python...
taskkill /F /IM python.exe 2>nul
if %errorlevel% == 0 (
    echo     - Đã dừng tất cả process Python
) else (
    echo     - Không tìm thấy process Python nào đang chạy
)

echo.
echo ============================================
echo    BACKEND SERVER ĐÃ ĐƯỢC DỪNG
echo ============================================
echo.
pause

