@echo off
echo ================================================================
echo FIXING Pinterest Pin Integration
echo ================================================================
echo.

echo 1. Stopping any running services...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo 2. Starting Pinterest Pin Service (Port 3001)...
start "Pinterest Service" cmd /k "cd /d \"c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\" && echo Starting Pinterest Service... && npm start"

echo 3. Waiting for service to start...
timeout /t 8 /nobreak > nul

echo 4. Testing the service...
cd "c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte"
node test-theme-integration.js

echo.
echo ================================================================
echo If the test passed, your integration is working!
echo ================================================================
echo.
echo 🎯 Next steps:
echo 1. Edit pinterest-styles.json to change text styles
echo 2. Restart this script to apply changes
echo 3. Test at: http://localhost:3001
echo.
pause
