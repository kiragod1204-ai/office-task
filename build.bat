@echo off
echo ========================================
echo AI Code Agent - Build Script
echo ========================================

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "BUILD_SUCCESS=true"

echo.
echo [1/4] Building Frontend Distribution...
echo ----------------------------------------
cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        set "BUILD_SUCCESS=false"
        goto :end
    )
)

echo Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    set "BUILD_SUCCESS=false"
    goto :end
)

echo ✓ Frontend build completed successfully

echo.
echo [2/4] Preparing Backend Build Context...
echo ----------------------------------------
cd /d "%BACKEND_DIR%"

echo ✓ Backend build context ready

echo.
echo [3/4] Building Backend Docker Image...
echo ----------------------------------------
echo Building Docker image: ai-code-agent-backend:latest
docker build -t ai-code-agent-backend:latest .
if errorlevel 1 (
    echo ERROR: Backend Docker build failed
    set "BUILD_SUCCESS=false"
    goto :end
)

echo ✓ Backend Docker image built successfully

echo.
echo [4/4] Build Summary...
echo ----------------------------------------
if "%BUILD_SUCCESS%"=="true" (
    echo ✓ All builds completed successfully!
    echo.
    echo Built artifacts:
    echo   - Frontend: %FRONTEND_DIR%\dist\
    echo   - Backend Docker image: ai-code-agent-backend:latest
    echo.
    echo To run the application:
    echo   1. Start database: cd backend ^&^& docker-compose up -d
    echo   2. Run backend: docker run -p 8080:8080 --network backend_default ai-code-agent-backend:latest
    echo   3. Serve frontend from dist/ directory
) else (
    echo ✗ Build failed! Check the error messages above.
    exit /b 1
)

:end
cd /d "%SCRIPT_DIR%"
echo.
echo Build script completed.