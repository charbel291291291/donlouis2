Write-Host "🚀 Deploying Don Louis App..." -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    git remote add origin https://github.com/charbel291291291/donlouis.git
}

# Add all files
git add .

# Commit
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Fix html and deploy $timestamp"

# Pull first to avoid conflicts, then push
Write-Host "☁️  Pushing to GitHub..." -ForegroundColor Cyan
git pull origin main --rebase
git push -u origin main

Write-Host "✅ Code pushed!" -ForegroundColor Green
Write-Host "👉 Now go to GitHub > Actions tab to watch the build." -ForegroundColor Yellow
Start-Sleep -Seconds 5
