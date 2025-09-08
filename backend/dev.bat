@echo off
echo ========================================
echo   AI Code Agent Backend - Development
echo ========================================
echo.

echo Installing Air for hot reload...
go install github.com/cosmtrek/air@latest
if %errorlevel% neq 0 (
    echo WARNING: Failed to install Air, using regular go run
    echo.
    echo Starting server in development mode...
    echo Server will run on http://localhost:9090
    go run main.go
) else (
    echo.
    echo Starting server with hot reload...
    echo Server will run on http://localhost:9090
    echo Server will restart automatically on file changes
    echo Press Ctrl+C to stop
    echo.
    air
)