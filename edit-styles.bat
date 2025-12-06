@echo off
echo ================================================================
echo Pinterest Styles Quick Editor
echo ================================================================
echo.

echo Opening Pinterest styles configuration file...
echo File: pinterest-styles.json
echo.

start notepad "c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\pinterest-styles.json"

echo.
echo ================================================================
echo INSTRUCTIONS:
echo ================================================================
echo.
echo 1. Edit the styles in the opened Notepad window
echo 2. Save the file (Ctrl+S)
echo 3. Press any key here to restart services
echo.
echo Available themes to edit:
echo - elegant (professional)
echo - bold (eye-catching)
echo - modern (clean)
echo - food (warm colors)
echo - minimalist (simple)
echo.
echo You can also change the defaultTheme in settings!
echo.

pause

echo.
echo Restarting services to apply changes...
echo.

taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo Starting Pinterest Pin Service...
start "Pinterest Service" cmd /k "cd /d \"c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\" && npm start"

timeout /t 3 /nobreak > nul

echo Starting React App...
start "React App" cmd /k "cd /d \"d:\react-app-pintesrt+articles-6-22-AIplus\client\" && npm start"

echo.
echo ================================================================
echo ✅ Services restarted with your new styles!
echo ================================================================
echo.
echo 🎯 Test your changes at:
echo - Pinterest Service: http://localhost:3000
echo - React App: http://localhost:3001
echo.
pause
