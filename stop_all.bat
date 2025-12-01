@echo off
REM Script tắt cả Backend và Frontend Server (Windows)

echo ============================================
echo    STOP ALL SERVERS
echo ============================================
echo.

echo [1/3] Đang tắt Backend Server...
call stop_backend.bat
echo.

echo [2/3] Đang tắt Frontend Server...
call stop_frontend.bat
echo.

echo [3/3] Kiểm tra lại các port...
echo.

REM Kiểm tra port 8000
netstat -ano | findstr :8000 >nul
if %errorlevel% == 0 (
    echo     - Port 8000 vẫn đang được sử dụng
) else (
    echo     - Port 8000 đã được giải phóng
)

REM Kiểm tra port 3000
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo     - Port 3000 vẫn đang được sử dụng
) else (
    echo     - Port 3000 đã được giải phóng
)

echo.
echo ============================================
echo    TẤT CẢ SERVERS ĐÃ ĐƯỢC DỪNG
echo ============================================
echo.
pause

