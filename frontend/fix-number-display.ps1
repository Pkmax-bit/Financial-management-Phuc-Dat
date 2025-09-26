# Fix number casting for display
$filePath = "D:\Project\Financial management Phuc Dat\frontend\src\app\expenses\page.tsx"
$content = Get-Content $filePath -Raw

# Fix number displays
$content = $content -replace "\{\(expensesStats as Record<string, unknown>\)\.([a-zA-Z_][a-zA-Z0-9_]*) \|\| 0\}", "{((expensesStats as Record<string, unknown>).`$1 as number) || 0}"

Set-Content $filePath $content -Encoding UTF8
Write-Host "Fixed number casting for display"