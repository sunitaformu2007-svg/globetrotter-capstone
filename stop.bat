@echo off
title Douala Travel Assistant - Stopping
echo Stopping the Douala Travel Assistant servers...
taskkill /FI "WindowTitle eq Douala Travel Assistant - Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Douala Travel Assistant - Website*" /T /F >nul 2>&1
echo Done. You can close this window.
pause
