@echo off
rem Bertopia local host (non-school): starts the server on this PC and opens the host menu in your browser.
rem Needs Node 22 or newer (https://nodejs.org). Nothing is installed; no internet is needed.
cd /d "%~dp0.."
node -v >nul 2>&1 || (echo Node is not installed. Get the LTS from https://nodejs.org and run this again. & pause & exit /b 1)
set "DATA=%USERPROFILE%\Documents\Bertopia Local"
if not exist "%DATA%" mkdir "%DATA%"
echo Starting Bertopia local host. Keep this window open while people play; close it to stop.
echo Worlds and backups are saved in: %DATA%
echo.
node --no-warnings --import ./host/register.mjs host/host.mjs --lan --data "%DATA%" --open
pause
