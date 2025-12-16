# Script fix lỗi Next.js build cho Windows PowerShell

Write-Host "🔧 Đang fix lỗi Next.js build..." -ForegroundColor Cyan

Set-Location frontend

# Xóa cache Next.js
Write-Host "📦 Đang xóa .next cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Đã xóa .next cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next folder không tồn tại" -ForegroundColor Gray
}

# Xóa node_modules và reinstall (nếu có flag --full)
if ($args -contains "--full") {
    Write-Host "📦 Đang xóa node_modules..." -ForegroundColor Yellow
    if (Test-Path node_modules) {
        Remove-Item -Recurse -Force node_modules
        Write-Host "✅ Đã xóa node_modules" -ForegroundColor Green
    }
    
    Write-Host "📦 Đang reinstall dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Đã reinstall dependencies" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Hoàn thành! Bây giờ chạy: npm run dev" -ForegroundColor Green
Write-Host "💡 Hoặc chạy: python scripts/auto_run_tests.py" -ForegroundColor Cyan

Set-Location ..






