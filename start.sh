#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install dependencies if needed
echo "Installing dependencies..."
python -m pip install -e .
cd "$SCRIPT_DIR/app/frontend" && npm install

# Start the FastAPI backend
echo "Starting backend server..."
cd "$SCRIPT_DIR"
PYTHONPATH=$SCRIPT_DIR uvicorn app.api.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start the React frontend
echo "Starting frontend server..."
cd "$SCRIPT_DIR/app/frontend"
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 