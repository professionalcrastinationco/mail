@echo off
echo Pushing latest code to GitHub...
echo.

echo Step 1: Adding all changes...
git add .

echo.
echo Step 2: Creating commit...
git commit -m "Update: Email management features, UI improvements, and bug fixes - %date%"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo Done! Your code is now on GitHub.
pause