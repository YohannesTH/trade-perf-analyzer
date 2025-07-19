#!/bin/bash

# Production startup script for Trading Strategy Backtester

echo "Starting Trading Strategy Backtester in production mode..."

# Set production environment
export NODE_ENV=production

# Start Python FastAPI backend in background
echo "Starting Python FastAPI backend on port 8001..."
cd server
python main.py &
PYTHON_PID=$!
cd ..

# Wait a moment for Python backend to initialize
sleep 3

# Start Node.js Express server
echo "Starting Node.js Express server on port 5000..."
node dist/server.js &
NODE_PID=$!

# Function to handle cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "✓ Trading Strategy Backtester is running!"
echo "  - Frontend/Backend: http://localhost:5000"
echo "  - Python API: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes to complete
wait