@echo off
title Installing Campus AI Supercomputer VS Code Extension...
echo ========================================================
echo ⚡ CAMPUS AI SUPERCOMPUTER - VS CODE EXTENSION INSTALLER
echo Created by Nandhakumar M. • Head of KGiSL Campus Google Community
echo ========================================================
echo.

set EXT_DIR=%USERPROFILE%\.vscode\extensions\nandhakumar-murugan.campus-ai-copilot-1.0.0

echo [+] Creating VS Code Extension Directory...
if not exist "%EXT_DIR%" mkdir "%EXT_DIR%"

echo [+] Copying Extension Files to VS Code...
copy /Y "%~dp0package.json" "%EXT_DIR%\"
copy /Y "%~dp0extension.js" "%EXT_DIR%\"

if exist "%~dp0media" (
    if not exist "%EXT_DIR%\media" mkdir "%EXT_DIR%\media"
    copy /Y "%~dp0media\*.*" "%EXT_DIR%\media\"
)

echo.
echo ========================================================
echo ✅ SUCCESS! CAMPUS AI EXTENSION INSTALLED SUCCESSFULLY!
echo ========================================================
echo.
echo Instructions to test inside VS Code:
echo 1. Open VS Code (or restart VS Code if already open)
echo 2. Look at the bottom-right status bar for:
echo    "⚡ Campus AI: Connected (172.16.110.12:3000)"
echo 3. Click the new "⚡ Campus AI" icon in the left activity sidebar!
echo 4. Highlight any code, right-click, and select:
echo    "Campus AI: Run Security Audit & Code Check"
echo.
pause
