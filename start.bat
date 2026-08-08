@echo off
title Douala Travel Assistant - Launcher
cd /d "%~dp0"

echo ============================================
echo   Douala Travel Assistant - Starting up...
echo ============================================
echo.

if not exist "server\node_modules" (
    echo First-time setup: installing server dependencies...
    cd server
    if not exist ".env" copy .env.example .env >nul
    call npm install
    cd ..
    echo.
)

if not exist "client\node_modules" (
    echo First-time setup: installing client dependencies...
    cd client
    if not exist ".env.local" copy .env.example .env.local >nul
    call npm install
    cd ..
    echo.
)

echo Starting the backend server...
start "Douala Travel Assistant - Server" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Starting the website...
start "Douala Travel Assistant - Website" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Waiting for everything to boot up...
timeout /t 8 /nobreak >nul

echo Opening the site in your browser...
start http://localhost:5173

echo.
echo Done! Two black windows just opened - leave them open while you use the site.
echo You can close THIS window now.
pause
