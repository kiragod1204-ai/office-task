#!/bin/bash

echo "========================================"
echo "   PostgreSQL Database Setup"
echo "========================================"
echo

echo "[1/2] Starting PostgreSQL with Docker..."
docker-compose up -d postgres
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start PostgreSQL container"
    echo "Make sure Docker is installed and running"
    exit 1
fi

echo
echo "[2/2] Waiting for database to be ready..."
sleep 10

echo
echo "SUCCESS: PostgreSQL is running on localhost:5433"
echo "Database: ai_code_agent"
echo "Username: dev_user"
echo "Password: dev_password"
echo
echo "You can now run the backend server with ./run.sh"
echo "Server will be available at http://localhost:9090"