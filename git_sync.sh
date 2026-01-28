#!/bin/bash

# Configuration
REPO_URL="https://github.com/charbel291291291/donlouis.git"

echo "🚀 Starting GitHub Sync..."

# 0. Fix Missing Public Folder Structure
if [ ! -d "public" ]; then
    echo "🛠️ Creating missing 'public' folder..."
    mkdir -p public
fi

if [ ! -f "public/logo.svg" ]; then
    echo "🎨 Generating default Luxury Logo..."
    cat <<EOF > public/logo.svg
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
EOF
fi

# 1. Initialize Git if missing
if [ ! -d ".git" ]; then
    echo "📦 Initializing new Git repository..."
    git init
    git branch -M main
fi

# 2. Configure Remote
# Check if origin exists, if not add it, if different update it
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)

if [ -z "$CURRENT_REMOTE" ]; then
    echo "🔗 Linking to $REPO_URL..."
    git remote add origin $REPO_URL
elif [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
    echo "🔗 Updating remote URL to $REPO_URL..."
    git remote set-url origin $REPO_URL
fi

# 3. Add and Commit
echo "📂 Staging files..."
git add .

# Use argument if provided, otherwise prompt
if [ -n "$1" ]; then
  msg="$1"
else
  echo "💾 Enter a commit message (Press Enter for 'Update'):"
  read msg
fi

if [ -z "$msg" ]; then
    msg="Update"
fi

git commit -m "$msg"

# 4. Pull Rebase (Safety Check)
echo "🔄 Pulling latest changes to avoid conflicts..."
git pull origin main --rebase || echo "⚠️  Pull failed or repo empty, proceeding to force push if needed..."

# 5. Push
echo "☁️  Pushing to GitHub..."
git push -u origin main

echo "✅ Done! Your project is synced to $REPO_URL"
