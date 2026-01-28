# Don Louis Snack Bar - Premium PWA

A high-end progressive web app for Don Louis Snack Bar & Grill, built with React, Vite, and Supabase.

## 📱 PWA Features
This app is fully optimized for mobile devices:
- **Installable**: Add to Home Screen on iOS and Android.
- **Offline Capable**: Works without internet via Service Workers.
- **Native UI**: Notched support, Safe Areas, and Status Bar blending.
- **Push Notifications**: Local notifications for order tracking.

## 🚀 Setup Guide

### 1. Supabase Setup
1. Create a new project at [database.new](https://database.new).
2. Go to the **SQL Editor** in the side menu.
3. Open `db_schema.sql` from this project, copy the content, and paste it into the SQL Editor.
4. Click **Run** to create all tables and the storage bucket.

### 2. Connect App
1. Go to **Project Settings** -> **API**.
2. Copy the `URL` and `anon public` key.
3. Open `.env` in this project.
4. Replace the placeholders with your actual keys.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
```

### 3. Run Locally
```bash
npm install
npm run dev
```

## 🐙 Push to GitHub

**Target Repository:** `https://github.com/charbel291291291/donlouis.git`

### Option 1: Double-Click Script (Windows)
Double-click `push.bat` in the project folder, or run in terminal:
```powershell
.\push.bat
```

### Option 2: PowerShell Script
```powershell
.\git_sync.ps1 "My Update Message"
```

### Option 3: Manual Commands (If scripts fail)
Copy and paste these commands into your terminal one by one:

```bash
# 1. Initialize (if needed)
git init
git branch -M main

# 2. Add Remote
git remote add origin https://github.com/charbel291291291/donlouis.git
# If it says 'remote origin already exists', run this instead:
# git remote set-url origin https://github.com/charbel291291291/donlouis.git

# 3. Save & Push
git add .
git commit -m "Update"
git pull origin main --rebase
git push -u origin main
```

## 📱 Features
- **Luxury UI**: Golden gradients and glassmorphism.
- **Realtime Orders**: Kitchen dashboard updates instantly.
- **Offline Menu**: Browse items without internet.
- **Rewards**: Loyalty points system.
- **Admin**: Manage menu items and images with AI background removal.
