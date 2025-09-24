#!/bin/bash

echo "========================================"
echo "AI Code Agent - Custom API Build"
echo "========================================"

if [ -z "$1" ]; then
    echo "Usage: ./build-with-api.sh [API_BASE_URL]"
    echo
    echo "Examples:"
    echo "  ./build-with-api.sh /api                           (for nginx proxy)"
    echo "  ./build-with-api.sh http://localhost:8080/api      (for local development)"
    echo "  ./build-with-api.sh https://api.yourdomain.com/api (for external API)"
    echo
    exit 1
fi

export API_BASE_URL="$1"
echo "Building with API_BASE_URL: $API_BASE_URL"
echo

./build-prod-api.sh