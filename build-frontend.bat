@echo off
echo ========================================
echo AI Code Agent - Frontend Build Script
echo ========================================

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

echo.
echo Building Frontend Distribution...
echo ----------------------------------------
cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        exit /b 1
    )
)

echo Building frontend for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    exit /b 1
)

echo ✓ Frontend build completed successfully!
echo.
echo Built artifacts:
echo   - Frontend: %FRONTEND_DIR%\dist\

cd /d "%SCRIPT_DIR%"
echo.
echo Frontend build script completed.