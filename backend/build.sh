#!/bin/bash

echo "========================================"
echo "   Building AI Code Agent Backend"
echo "========================================"
echo

echo "[1/2] Installing dependencies..."
go mod tidy
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "[2/2] Building executable..."
go build -o ai-code-agent-backend main.go
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build executable"
    exit 1
fi

echo
echo "SUCCESS: Built ai-code-agent-backend"
echo "Run ./ai-code-agent-backend to start the server"