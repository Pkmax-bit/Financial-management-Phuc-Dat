#!/bin/bash
# Script fix lỗi Next.js build (Windows/Linux/Mac)

echo "🔧 Đang fix lỗi Next.js build..."

cd frontend || exit 1

# Xóa cache Next.js
echo "📦 Đang xóa .next cache..."
rm -rf .next
echo "✅ Đã xóa .next cache"

# Xóa node_modules và reinstall (tùy chọn)
if [ "$1" == "--full" ]; then
    echo "📦 Đang xóa node_modules..."
    rm -rf node_modules
    echo "✅ Đã xóa node_modules"
    
    echo "📦 Đang reinstall dependencies..."
    npm install
    echo "✅ Đã reinstall dependencies"
fi

echo ""
echo "✅ Hoàn thành! Bây giờ chạy: npm run dev"





