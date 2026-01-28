# Don Louis Auto-Sync Script
Write-Host "🚀 Starting Don Louis Sync..." -ForegroundColor Cyan

# 1. Initialize Git if needed
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# 2. Add Remote if missing
$RepoUrl = "https://github.com/charbel291291291/donlouis.git"
$remotes = git remote
if ($remotes -contains "origin") {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

# 3. Add & Commit
Write-Host "📂 Staging files..." -ForegroundColor Cyan
git add .
git commit -m "Auto-update via sync script"

# 4. Pull & Push
Write-Host "☁️  Syncing with GitHub..." -ForegroundColor Cyan
git pull origin main --rebase
git push -u origin main

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Start-Sleep -Seconds 3
