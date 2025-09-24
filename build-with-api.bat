@echo off
echo ========================================
echo AI Code Agent - Custom API Build
echo ========================================

if "%1"=="" (
    echo Usage: build-with-api.bat [API_BASE_URL]
    echo.
    echo Examples:
    echo   build-with-api.bat /api                           ^(for nginx proxy^)
    echo   build-with-api.bat http://localhost:8080/api      ^(for local development^)
    echo   build-with-api.bat https://api.yourdomain.com/api ^(for external API^)
    echo.
    exit /b 1
)

set "API_BASE_URL=%1"
echo Building with API_BASE_URL: %API_BASE_URL%
echo.

call build-prod-api.bat