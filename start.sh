#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on ports 8000 and 3001
echo "Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Install dependencies if needed
echo "Installing dependencies..."
python -m pip install -e .
cd "$SCRIPT_DIR/app/frontend" && npm install --legacy-peer-deps

# Start the FastAPI backend
echo "Starting backend server..."
cd "$SCRIPT_DIR"
PYTHONPATH=$SCRIPT_DIR uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start the React frontend
echo "Starting frontend server..."
cd "$SCRIPT_DIR/app/frontend"
PORT=3001 npm start &
FRONTEND_PID=$!

# Function to cleanup background processes
cleanup() {
    echo "Cleaning up..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Setup cleanup on script exit
trap cleanup EXIT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 