#!/bin/bash
# Script tắt Frontend Server (Linux/Mac)
# Tắt tất cả các process Node.js đang chạy Next.js

echo "============================================"
echo "   STOP FRONTEND SERVER"
echo "============================================"
echo ""

echo "[1/2] Đang tìm và dừng Frontend Server..."
echo ""

# Tìm và dừng process trên port 3000
PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "     - Đang dừng process trên port 3000 (PID: $PID)"
    kill -9 $PID 2>/dev/null
    echo "     - Đã dừng thành công"
else
    echo "     - Không tìm thấy process nào trên port 3000"
fi

echo ""
echo "[2/2] Đang dừng tất cả process Next.js..."
pkill -f "next.*dev" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "     - Đã dừng tất cả process Next.js"
else
    echo "     - Không tìm thấy process Next.js nào đang chạy"
fi

# Dừng tất cả process Node.js (nếu cần)
pkill -f "node.*next" 2>/dev/null

echo ""
echo "============================================"
echo "   FRONTEND SERVER ĐÃ ĐƯỢC DỪNG"
echo "============================================"
echo ""

