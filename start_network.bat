@echo off
REM Script khởi động hệ thống với cấu hình network cho Windows
REM Chạy script này để cho phép các thiết bị khác truy cập qua mạng

echo ========================================
echo FINANCIAL MANAGEMENT - NETWORK ACCESS
echo ========================================
echo.

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python chua duoc cai dat!
    echo Vui long cai dat Python truoc khi chay script nay.
    pause
    exit /b 1
)

REM Chạy script Python
python start_network.py

pause

