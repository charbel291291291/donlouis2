Write-Host "🔧 Fixing GitHub Deployment..." -ForegroundColor Cyan

# 1. Ensure git is ready
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    git remote add origin https://github.com/charbel291291291/donlouis.git
}

# 2. Force add the hidden .github folder
# Sometimes standard 'git add .' misses hidden folders if not previously tracked
Write-Host "📂 Force adding workflow files..." -ForegroundColor Yellow
git add .github -f
git add .

# 3. Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Fix deployment config $timestamp"

# 4. Push
Write-Host "☁️  Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "✅ Done! Go to GitHub Actions tab now." -ForegroundColor Green
Start-Sleep -Seconds 5
