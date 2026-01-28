@echo off
echo ==========================================
echo      Don Louis App - GitHub Sync
echo ==========================================
echo.

:: 1. Initialize if needed
if not exist .git (
    echo [!] Initializing Git...
    git init
    git branch -M main
)

:: 2. Configure Remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Adding remote origin...
    git remote add origin https://github.com/charbel291291291/donlouis.git
) else (
    echo [!] Updating remote URL...
    git remote set-url origin https://github.com/charbel291291291/donlouis.git
)

:: 3. Stage and Commit
echo.
echo [1/4] Staging files...
git add .

echo.
set /p commitmsg="[2/4] Enter commit message (Press Enter for 'Update'): "
if "%commitmsg%"=="" set commitmsg="Update"
git commit -m "%commitmsg%"

:: 4. Pull and Push
echo.
echo [3/4] Pulling latest changes (Rebase)...
git pull origin main --rebase

echo.
echo [4/4] Pushing to GitHub...
git push -u origin main

echo.
echo [SUCCESS] Done!
pause
