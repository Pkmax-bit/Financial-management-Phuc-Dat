#!/bin/bash
# Script tắt cả Backend và Frontend Server (Linux/Mac)

echo "============================================"
echo "   STOP ALL SERVERS"
echo "============================================"
echo ""

echo "[1/3] Đang tắt Backend Server..."
bash stop_backend.sh
echo ""

echo "[2/3] Đang tắt Frontend Server..."
bash stop_frontend.sh
echo ""

echo "[3/3] Kiểm tra lại các port..."
echo ""

# Kiểm tra port 8000
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "     - Port 8000 vẫn đang được sử dụng"
else
    echo "     - Port 8000 đã được giải phóng"
fi

# Kiểm tra port 3000
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "     - Port 3000 vẫn đang được sử dụng"
else
    echo "     - Port 3000 đã được giải phóng"
fi

echo ""
echo "============================================"
echo "   TẤT CẢ SERVERS ĐÃ ĐƯỢC DỪNG"
echo "============================================"
echo ""

