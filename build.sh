#!/bin/bash

echo "========================================"
echo "AI Code Agent - Build Script"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BUILD_SUCCESS=true

echo
echo "[1/4] Building Frontend Distribution..."
echo "----------------------------------------"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        BUILD_SUCCESS=false
        exit 1
    fi
fi

echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed"
    BUILD_SUCCESS=false
    exit 1
fi

echo "✓ Frontend build completed successfully"

echo
echo "[2/4] Preparing Backend Build Context..."
echo "----------------------------------------"
cd "$BACKEND_DIR"

echo "✓ Backend build context ready"

echo
echo "[3/4] Building Backend Docker Image..."
echo "----------------------------------------"
echo "Building Docker image: ai-code-agent-backend:latest"
docker build -t ai-code-agent-backend:latest .
if [ $? -ne 0 ]; then
    echo "ERROR: Backend Docker build failed"
    BUILD_SUCCESS=false
    exit 1
fi

echo "✓ Backend Docker image built successfully"

echo
echo "[4/4] Build Summary..."
echo "----------------------------------------"
if [ "$BUILD_SUCCESS" = true ]; then
    echo "✓ All builds completed successfully!"
    echo
    echo "Built artifacts:"
    echo "  - Frontend: $FRONTEND_DIR/dist/"
    echo "  - Backend Docker image: ai-code-agent-backend:latest"
    echo
    echo "To run the application:"
    echo "  1. Start database: cd backend && docker-compose up -d"
    echo "  2. Run backend: docker run -p 8080:8080 --network backend_default ai-code-agent-backend:latest"
    echo "  3. Serve frontend from dist/ directory"
else
    echo "✗ Build failed! Check the error messages above."
    exit 1
fi

cd "$SCRIPT_DIR"
echo
echo "Build script completed."