# Fix any types to Record<string, unknown>
$filePath = "D:\Project\Financial management Phuc Dat\frontend\src\app\expenses\page.tsx"
$content = Get-Content $filePath -Raw

# Replace all (expensesStats as any) with (expensesStats as Record<string, unknown>)
$content = $content -replace "\(expensesStats as any\)", "(expensesStats as Record<string, unknown>)"

Set-Content $filePath $content -Encoding UTF8
Write-Host "Fixed any types to Record<string, unknown> in expenses page"