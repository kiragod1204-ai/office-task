@echo off
echo ========================================
echo   PostgreSQL Database Setup
echo ========================================
echo.

echo [1/2] Starting PostgreSQL with Docker...
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo ERROR: Failed to start PostgreSQL container
    echo Make sure Docker is installed and running
    pause
    exit /b 1
)

echo.
echo [2/2] Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo SUCCESS: PostgreSQL is running on localhost:5433
echo Database: ai_code_agent
echo Username: dev_user
echo Password: dev_password
echo.
echo You can now run the backend server with run.bat
echo Server will be available at http://localhost:9090
pause