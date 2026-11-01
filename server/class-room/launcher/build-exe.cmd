@echo off
setlocal
title Build Bertopia Launcher.exe
rem Builds dist\Bertopia Launcher.exe from this folder with PyInstaller (installed for your user only), then puts a
rem "Bertopia Launcher" shortcut on your desktop. Run it again after a launcher change if you want the .exe itself
rem rebuilt; you do not have to: the .exe runs the newer launcher from the repo by itself.
cd /d "%~dp0"
set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY goto nopy
echo Installing or updating PyInstaller for your user ...
%PY% -m pip install --user --upgrade --disable-pip-version-check pyinstaller
if errorlevel 1 goto fail
echo Building ...
%PY% -m PyInstaller --noconfirm --clean --onefile --windowed --name "Bertopia Launcher" --icon "%~dp0..\tools\pack\bertopia.ico" --distpath "%~dp0..\..\..\dist" --workpath "%TEMP%\bertopia-launcher-build" --specpath "%TEMP%\bertopia-launcher-build" --hidden-import bertopia_core --hidden-import bertopia_gui "%~dp0bertopia_launcher.py"
if errorlevel 1 goto fail
set "EXE=%~dp0..\..\..\dist\Bertopia Launcher.exe"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'Bertopia Launcher.lnk')); $s.TargetPath=(Resolve-Path $env:EXE).Path; $s.WorkingDirectory=(Split-Path (Resolve-Path $env:EXE).Path); $s.Description='Bertopia Home launcher (adults 18+)'; $s.Save()"
echo.
echo Done: dist\Bertopia Launcher.exe, and a "Bertopia Launcher" shortcut on your desktop.
echo Windows may warn the first time you open it (it is not code-signed): More info, then Run anyway.
pause
exit /b 0
:nopy
echo Python was not found. Install Python 3 from https://www.python.org (tick "Add python.exe to PATH") and run this again.
pause
exit /b 1
:fail
echo The build failed: the lines above say why.
pause
exit /b 1
