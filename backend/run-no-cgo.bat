@echo off
echo ========================================
echo   AI Code Agent Backend (No CGO)
echo ========================================
echo.

echo [1/3] Checking Go installation...
go version
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies...
go mod tidy
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting server without CGO...
echo Server will run on http://localhost:9090
echo Press Ctrl+C to stop the server
echo.
set CGO_ENABLED=0
go run main.go