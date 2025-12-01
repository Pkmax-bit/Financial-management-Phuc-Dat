#!/bin/bash
# Script tắt Backend Server (Linux/Mac)
# Tắt tất cả các process Python đang chạy uvicorn

echo "============================================"
echo "   STOP BACKEND SERVER"
echo "============================================"
echo ""

echo "[1/2] Đang tìm và dừng Backend Server..."
echo ""

# Tìm và dừng process trên port 8000
PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "     - Đang dừng process trên port 8000 (PID: $PID)"
    kill -9 $PID 2>/dev/null
    echo "     - Đã dừng thành công"
else
    echo "     - Không tìm thấy process nào trên port 8000"
fi

echo ""
echo "[2/2] Đang dừng tất cả process uvicorn..."
pkill -f "uvicorn.*main:app" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "     - Đã dừng tất cả process uvicorn"
else
    echo "     - Không tìm thấy process uvicorn nào đang chạy"
fi

echo ""
echo "============================================"
echo "   BACKEND SERVER ĐÃ ĐƯỢC DỪNG"
echo "============================================"
echo ""

