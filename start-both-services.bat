@echo off
echo ================================================================
echo Starting Pinterest Pin Generator Integration
echo ================================================================
echo.

echo Starting Pinterest Pin Generator Service...
echo Location: c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte
echo.

start "Pinterest Service" cmd /k "cd /d \"c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\" & npm start"

echo Waiting 5 seconds for service to start...
timeout /t 5 /nobreak > nul

echo.
echo ================================================================
echo Starting Your React App...
echo Location: d:\react-app-pintesrt+articles-6-22-AIplus
echo ================================================================
echo.

start "React App Server" cmd /k "cd /d \"d:\react-app-pintesrt+articles-6-22-AIplus\" & npm start"

timeout /t 3 /nobreak > nul

start "React App Client" cmd /k "cd /d \"d:\react-app-pintesrt+articles-6-22-AIplus\client\" & npm start"

echo.
echo ================================================================
echo ✅ Both services are starting!
echo ================================================================
echo.
echo 📋 Your services:
echo 🎯 Pinterest Pin Service: http://localhost:3000
echo 🎯 React App: http://localhost:3001 (or whatever port shows)
echo.
echo 📝 Keep all terminal windows open while working
echo 🔧 Check the integration guide: INTEGRATION_STEPS.md
echo.
pause
