@echo off
echo ========================================
echo AI Code Agent - Production Build Script
echo ========================================

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "BUILD_SUCCESS=true"

echo.
echo [1/5] Building Frontend Distribution...
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

echo Building frontend for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    set "BUILD_SUCCESS=false"
    goto :end
)

echo ✓ Frontend production build completed

echo.
echo [2/5] Building Backend Docker Image...
echo ----------------------------------------
cd /d "%BACKEND_DIR%"

echo Building Docker image: ai-code-agent-backend:latest
docker build -t ai-code-agent-backend:latest .
if errorlevel 1 (
    echo ERROR: Backend Docker build failed
    set "BUILD_SUCCESS=false"
    goto :end
)

echo ✓ Backend Docker image built successfully

echo.
echo [3/5] Validating Build Artifacts...
echo ----------------------------------------
cd /d "%SCRIPT_DIR%"

if not exist "%FRONTEND_DIR%\dist\index.html" (
    echo ERROR: Frontend dist/index.html not found
    set "BUILD_SUCCESS=false"
    goto :end
)

docker images ai-code-agent-backend:latest --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | findstr ai-code-agent-backend
if errorlevel 1 (
    echo ERROR: Backend Docker image not found
    set "BUILD_SUCCESS=false"
    goto :end
)

echo ✓ Build artifacts validated

echo.
echo [4/5] Creating Environment Template...
echo ----------------------------------------
if not exist ".env.example" (
    echo Creating .env.example template...
    (
        echo # AI Code Agent - Environment Configuration
        echo # Copy this file to .env and update the values
        echo.
        echo # Database Configuration
        echo POSTGRES_USER=prod_user
        echo POSTGRES_PASSWORD=change-this-secure-password
        echo POSTGRES_PORT=5432
        echo.
        echo # Application Configuration
        echo BACKEND_PORT=8080
        echo FRONTEND_PORT=80
        echo JWT_SECRET=change-this-super-secret-jwt-key-for-production
        echo.
        echo # Optional: Override default database name
        echo # POSTGRES_DB=ai_code_agent
    ) > .env.example
    echo ✓ Environment template created
) else (
    echo ✓ Environment template already exists
)

echo.
echo [5/5] Production Build Summary...
echo ----------------------------------------
if "%BUILD_SUCCESS%"=="true" (
    echo ✓ Production build completed successfully!
    echo.
    echo Built artifacts:
    echo   - Frontend: %FRONTEND_DIR%\dist\
    echo   - Backend Docker image: ai-code-agent-backend:latest
    echo   - Production compose: docker-compose.prod.yml
    echo   - Nginx config: nginx.conf
    echo.
    echo To deploy in production:
    echo   1. Copy .env.example to .env and configure your settings
    echo   2. Run: docker-compose -f docker-compose.prod.yml up -d
    echo.
    echo To stop: docker-compose -f docker-compose.prod.yml down
) else (
    echo ✗ Production build failed! Check the error messages above.
    exit /b 1
)

:end
cd /d "%SCRIPT_DIR%"
echo.
echo Production build script completed.