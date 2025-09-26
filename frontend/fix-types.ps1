# Fix TypeScript any types and unused imports

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Include "*.tsx", "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace common any patterns
    $content = $content -replace 'useState<any>', 'useState<unknown>'
    $content = $content -replace ': any\b', ': unknown'
    $content = $content -replace 'catch \(error: any\)', 'catch (error: unknown)'
    $content = $content -replace 'catch \(err: any\)', 'catch (err: unknown)'
    $content = $content -replace 'catch \(e: any\)', 'catch (e: unknown)'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "Done fixing TypeScript files"