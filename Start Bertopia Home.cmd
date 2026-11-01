@echo off
setlocal
title Bertopia Home (adults 18+)
rem Double-click: updates, installs and builds the home game when needed, then starts the server and opens the owner page.
rem Same as: node server\class-room\tools\home-launch.mjs   (options: --no-update --no-build --rebuild)
where node >/dev/null 2>&1 || (echo Node.js is not installed. Get the LTS from https://nodejs.org and run this again. & pause & exit /b 1)
node "%~dp0server\class-room\tools\home-launch.mjs" %*
if errorlevel 1 pause
