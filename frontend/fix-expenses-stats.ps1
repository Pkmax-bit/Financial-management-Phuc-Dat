# Fix expensesStats type in expenses page
$filePath = "D:\Project\Financial management Phuc Dat\frontend\src\app\expenses\page.tsx"
$content = Get-Content $filePath -Raw

# Replace all expensesStats.property with (expensesStats as any).property
$content = $content -replace "expensesStats\.([a-zA-Z_][a-zA-Z0-9_]*)", "(expensesStats as any).`$1"

Set-Content $filePath $content -Encoding UTF8
Write-Host "Fixed expensesStats types in expenses page"