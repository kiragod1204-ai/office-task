#!/bin/bash

echo "========================================"
echo "   AI Code Agent Backend Server"
echo "========================================"
echo

echo "[1/3] Checking Go installation..."
if ! command -v go &> /dev/null; then
    echo "ERROR: Go is not installed or not in PATH"
    echo "Please install Go from https://golang.org/dl/"
    exit 1
fi

go version
echo

echo "[2/3] Installing dependencies..."
go mod tidy
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "[3/3] Starting server..."
echo "Server will run on http://localhost:9090"
echo "Press Ctrl+C to stop the server"
echo

go run main.go