#!/bin/bash
# Script khởi động hệ thống với cấu hình network cho Linux/Mac
# Chạy script này để cho phép các thiết bị khác truy cập qua mạng

echo "========================================"
echo "FINANCIAL MANAGEMENT - NETWORK ACCESS"
echo "========================================"
echo ""

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python chưa được cài đặt!"
    echo "Vui lòng cài đặt Python trước khi chạy script này."
    exit 1
fi

# Chạy script Python
python3 start_network.py

