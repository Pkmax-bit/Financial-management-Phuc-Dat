# Fix remaining any types and error handling

$files = Get-ChildItem -Path "src" -Include "*.tsx", "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Fix error handling patterns
    $content = $content -replace 'error\.message', '(error as Error).message'
    $content = $content -replace 'err\.message', '(err as Error).message'
    $content = $content -replace 'e\.message', '(e as Error).message'
    
    # Fix specific patterns in components
    $content = $content -replace 'departments: any\[\]', 'departments: unknown[]'
    $content = $content -replace 'setDepartments<any\[\]>', 'setDepartments<unknown[]>'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "Done fixing remaining issues"