@echo off
echo ========================================
echo   Building AI Code Agent Backend
echo ========================================
echo.

echo [1/2] Installing dependencies...
go mod tidy
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/2] Building executable...
go build -o ai-code-agent-backend.exe main.go
if %errorlevel% neq 0 (
    echo ERROR: Failed to build executable
    pause
    exit /b 1
)

echo.
echo SUCCESS: Built ai-code-agent-backend.exe
echo Run the executable to start the server
pause