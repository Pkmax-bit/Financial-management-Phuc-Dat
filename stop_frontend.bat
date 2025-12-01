@echo off
REM Script tắt Frontend Server (Windows)
REM Tắt tất cả các process Node.js đang chạy Next.js

echo ============================================
echo    STOP FRONTEND SERVER
echo ============================================
echo.

echo [1/2] Đang tìm và dừng Frontend Server...
echo.

REM Tìm và dừng các process trên port 3000 (Next.js default)
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :3000') do (
    echo     - Đang dừng process trên port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Dừng tất cả process Node.js
echo [2/2] Đang dừng tất cả process Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo     - Đã dừng tất cả process Node.js
) else (
    echo     - Không tìm thấy process Node.js nào đang chạy
)

echo.
echo ============================================
echo    FRONTEND SERVER ĐÃ ĐƯỢC DỪNG
echo ============================================
echo.
pause

