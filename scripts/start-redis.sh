#!/bin/bash

# Simple script to start Redis locally for development
# This script assumes Redis is installed via package manager

echo "Starting Redis server for development..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "Redis is not installed. Please install Redis first:"
    echo ""
    echo "On macOS:"
    echo "  brew install redis"
    echo ""
    echo "On Ubuntu/Debian:"
    echo "  sudo apt-get install redis-server"
    echo ""
    echo "On Windows:"
    echo "  Download from https://redis.io/download"
    echo ""
    exit 1
fi

# Check if Redis is already running
if pgrep -x "redis-server" > /dev/null; then
    echo "Redis server is already running!"
    echo "You can connect to it at localhost:6379"
    exit 0
fi

# Start Redis server
echo "Starting Redis server on localhost:6379..."
redis-server --daemonize yes --port 6379

if [ $? -eq 0 ]; then
    echo "✅ Redis server started successfully!"
    echo "You can now connect to Redis at localhost:6379"
    echo ""
    echo "To stop Redis server:"
    echo "  redis-cli shutdown"
    echo ""
    echo "To connect with redis-cli:"
    echo "  redis-cli"
else
    echo "❌ Failed to start Redis server"
    exit 1
fi
