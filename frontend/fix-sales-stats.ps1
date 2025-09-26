# Fix all salesStats type casting in sales page
$filePath = "D:\Project\Financial management Phuc Dat\frontend\src\app\sales\page.tsx"
$content = Get-Content $filePath -Raw

# Replace all revenue.property
$content = $content -replace "revenue\.([a-zA-Z_][a-zA-Z0-9_]*)", "(revenue as Record<string, unknown>).`$1 as number"

# Replace all invoicesStats.property 
$content = $content -replace "invoicesStats\.([a-zA-Z_][a-zA-Z0-9_]*)", "(invoicesStats as Record<string, unknown>).`$1 as number"

# Replace all quotesStats.property except by_status
$content = $content -replace "quotesStats\.total", "(quotesStats as Record<string, unknown>).total as number"

# Replace by_status specifically
$content = $content -replace "quotesStats\.by_status", "(quotesStats as Record<string, unknown>).by_status"

Set-Content $filePath $content -Encoding UTF8
Write-Host "Fixed all salesStats type casting in sales page"