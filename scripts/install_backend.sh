#!/bin/bash

# Script cài đặt backend dependencies với virtual environment
# Sử dụng: chmod +x scripts/install_backend.sh && ./scripts/install_backend.sh

set -e

cd "$(dirname "$0")/../backend" || exit 1

echo "📦 Đang cài đặt backend dependencies..."

# Kiểm tra và tạo virtual environment
if [ ! -d "venv" ]; then
    echo "🔧 Đang tạo virtual environment..."
    
    # Thử các phiên bản Python
    if command -v python3.11 &> /dev/null; then
        python3.11 -m venv venv
    elif command -v python3 &> /dev/null; then
        python3 -m venv venv
    elif command -v python &> /dev/null; then
        python -m venv venv
    else
        echo "❌ Không tìm thấy Python! Vui lòng cài đặt Python 3.11+"
        exit 1
    fi
    echo "✅ Đã tạo virtual environment"
else
    echo "✅ Virtual environment đã tồn tại"
fi

# Kích hoạt virtual environment
echo "🔌 Đang kích hoạt virtual environment..."
source venv/bin/activate

# Cài đặt dependencies
echo "📥 Đang cài đặt Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Đã cài đặt backend dependencies thành công!"

