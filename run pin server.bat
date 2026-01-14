@echo off
title Pinterest Pin Generator Server
color 0A
echo.
echo ========================================
echo   Pinterest Pin Generator Server
echo ========================================
echo.
echo Starting server on port 3001...
echo.

cd /d "%~dp0"
npm start

echo.
echo ========================================
echo   Server stopped or crashed
echo ========================================
echo.
pause
