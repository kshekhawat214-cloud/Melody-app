@echo off
echo Initializing Git...
git init
git branch -M main

echo Configuring User...
git config user.name "kshekhawat214-cloud"
git config user.email "kshekhawat214@gmail.com"

echo Adding files...
git add .

echo Committing...
git commit -m "Initial commit of Melody App"

echo.
echo ========================================================
echo CRITICAL STEP:
echo 1. Go to https://github.com/new
echo 2. Name your repository "Melody-app" (or similar)
echo 3. Click "Create repository"
echo 4. Copy the HTTPS URL (e.g., https://github.com/kshekhawat214-cloud/Melody-app.git)
echo.
echo Then run this command:
echo git remote add origin [YOUR_URL]
echo git push -u origin main
echo ========================================================
pause
