@echo off
setlocal
title Bertopia Home (adults 18+)
rem Double-click: updates, installs and builds the home game when needed, then starts the server and opens the owner page.
rem Same as: node server\class-room\tools\home-launch.mjs   (options: --no-update --no-build --rebuild)
rem Node: from PATH, else the usual install folders, else a copy fetched once from nodejs.org (checksum checked).
set "NODE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE set "NODE=%%N"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE if defined NVM_SYMLINK if exist "%NVM_SYMLINK%\node.exe" set "NODE=%NVM_SYMLINK%\node.exe"
if not defined NODE call :fetched
if defined NODE goto run
echo Node.js was not found on this PC. Fetching the official Node 22 LTS from nodejs.org, one time, about 30 MB.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\class-room\tools\get-node.ps1"
call :fetched
if defined NODE goto run
echo Could not get Node.js. Install the LTS from https://nodejs.org and run this again.
pause
exit /b 1
:run
"%NODE%" "%~dp0server\class-room\tools\home-launch.mjs" %*
if errorlevel 1 pause
exit /b
:fetched
for /d %%D in ("%LOCALAPPDATA%\Bertopia\node-v22*") do if exist "%%D\node.exe" set "NODE=%%D\node.exe"
exit /b 0
