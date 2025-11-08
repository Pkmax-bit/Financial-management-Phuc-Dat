#!/bin/bash

# Script tự động lấy IP máy ảo Ubuntu và cập nhật NEXT_PUBLIC_API_URL
# Sử dụng: chmod +x update_api_url.sh && ./update_api_url.sh

set -e

# Màu sắc
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "  CẬP NHẬT NEXT_PUBLIC_API_URL"
echo "=========================================="
echo ""

# Lấy IP của máy ảo
IP=$(hostname -I | awk '{print $1}')

if [ -z "$IP" ]; then
    echo -e "${RED}[ERROR]${NC} Không thể lấy IP của máy ảo!"
    exit 1
fi

echo -e "${BLUE}[INFO]${NC} IP của máy ảo: ${GREEN}$IP${NC}"
echo ""

# Đường dẫn file .env.local
ENV_FILE="frontend/.env.local"

# Kiểm tra xem có đang ở thư mục gốc của dự án không
if [ ! -d "frontend" ]; then
    echo -e "${RED}[ERROR]${NC} Không tìm thấy thư mục frontend!"
    echo "Vui lòng chạy script này từ thư mục gốc của dự án."
    exit 1
fi

# Kiểm tra file có tồn tại không
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}[WARNING]${NC} File $ENV_FILE không tồn tại."
    
    if [ -f "frontend/env.local.example" ]; then
        echo -e "${BLUE}[INFO]${NC} Đang tạo file từ env.local.example..."
        cp frontend/env.local.example "$ENV_FILE"
        echo -e "${GREEN}[SUCCESS]${NC} Đã tạo file $ENV_FILE"
    else
        echo -e "${RED}[ERROR]${NC} File env.local.example không tồn tại!"
        exit 1
    fi
fi

# Backup file cũ
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo -e "${BLUE}[INFO]${NC} Đã backup file cũ: $BACKUP_FILE"

# Cập nhật NEXT_PUBLIC_API_URL
NEW_URL="http://$IP:8000"

# Kiểm tra xem dòng NEXT_PUBLIC_API_URL có tồn tại không
if grep -q "NEXT_PUBLIC_API_URL" "$ENV_FILE"; then
    # Cập nhật dòng hiện có
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=\"$NEW_URL\"|g" "$ENV_FILE"
    else
        # Linux
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=\"$NEW_URL\"|g" "$ENV_FILE"
    fi
    echo -e "${GREEN}[SUCCESS]${NC} Đã cập nhật NEXT_PUBLIC_API_URL"
else
    # Thêm dòng mới
    echo "" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_API_URL=\"$NEW_URL\"" >> "$ENV_FILE"
    echo -e "${GREEN}[SUCCESS]${NC} Đã thêm NEXT_PUBLIC_API_URL"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}[SUCCESS]${NC} Hoàn thành!"
echo "=========================================="
echo ""
echo -e "${BLUE}[INFO]${NC} NEXT_PUBLIC_API_URL đã được cập nhật thành:"
echo -e "  ${GREEN}NEXT_PUBLIC_API_URL=\"$NEW_URL\"${NC}"
echo ""
echo -e "${BLUE}[INFO]${NC} Nội dung file $ENV_FILE:"
echo "----------------------------------------"
grep "NEXT_PUBLIC_API_URL" "$ENV_FILE" || echo "Không tìm thấy NEXT_PUBLIC_API_URL"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}[NOTE]${NC} Đảm bảo:"
echo "  1. Backend đang chạy trên port 8000"
echo "  2. Backend bind với --host 0.0.0.0 (không phải localhost)"
echo "  3. Firewall đã mở port 8000 (nếu cần)"
echo "  4. VirtualBox network đã được cấu hình đúng"
echo ""
echo -e "${BLUE}[INFO]${NC} Kiểm tra kết nối:"
echo "  curl http://$IP:8000/docs"
echo ""

