param (
    [string]$Message = ""
)

# Configuration
$RepoUrl = "https://github.com/charbel291291291/donlouis.git"

Write-Host "🚀 Starting Don Louis System Check..." -ForegroundColor Cyan

# 0. Fix Missing Public Folder Structure
if (-not (Test-Path "public")) {
    Write-Host "🛠️ Creating missing 'public' folder..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "public" | Out-Null
}

$LogoPath = "public/logo.svg"
if (-not (Test-Path $LogoPath)) {
    Write-Host "🎨 Generating default Luxury Logo..." -ForegroundColor Yellow
    $SvgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#171717"/>
  <circle cx="256" cy="256" r="210" stroke="url(#grad1)" stroke-width="16" fill="none" />
  <circle cx="256" cy="256" r="180" stroke="#262626" stroke-width="4" fill="none" />
  <text x="256" y="290" text-anchor="middle" fill="url(#grad1)" font-family="Georgia, serif" font-weight="bold" font-size="240" font-style="italic">DL</text>
  <text x="256" y="420" text-anchor="middle" fill="#F59E0B" font-family="sans-serif" font-size="30" letter-spacing="6" font-weight="bold">EST. 2025</text>
</svg>
"@
    Set-Content -Path $LogoPath -Value $SvgContent
}

# 1. Initialize Git if missing
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing new Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# 2. Configure Remote
$remotes = git remote
if ($remotes -contains "origin") {
    $currentUrl = git remote get-url origin
    if ($currentUrl -ne $RepoUrl) {
        Write-Host "🔗 Updating remote URL to $RepoUrl..." -ForegroundColor Yellow
        git remote set-url origin $RepoUrl
    }
} else {
    Write-Host "🔗 Linking to $RepoUrl..." -ForegroundColor Yellow
    git remote add origin $RepoUrl
}

# 3. Add and Commit
Write-Host "📂 Staging files..." -ForegroundColor Cyan
git add .

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "💾 Enter a commit message (Press Enter for 'Update')"
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "Update"
}

git commit -m "$Message"

# 4. Pull Rebase
Write-Host "🔄 Pulling latest changes..." -ForegroundColor Cyan
git pull origin main --rebase

# 5. Push
Write-Host "☁️  Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "✅ Done! Your project is synced." -ForegroundColor Green
