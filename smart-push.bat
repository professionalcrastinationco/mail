@echo off
echo === Git Push with Actual Useful Commit Messages ===
echo.

echo Current changes:
echo ----------------
git status --short
echo.

echo What did you actually change? (Be specific, future you will thank you)
echo Examples:
echo   - Added Gmail OAuth login flow
echo   - Fixed inbox zero bulk actions not working
echo   - Built email reply AI feature with tone selection
echo   - Updated pricing page with new tiers
echo.
set /p COMMIT_MSG=Your commit message: 

if "%COMMIT_MSG%"=="" (
    echo.
    echo Seriously? No message? Fine, using generic bullshit message...
    set COMMIT_MSG=Update: Changes made on %date%
)

echo.
echo Adding all changes...
git add .

echo Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo === Push failed! ===
    echo Probably need to pull first. Run: git pull origin main
    echo Then try this script again.
) else (
    echo.
    echo === Success! Your code is on GitHub ===
)

pause