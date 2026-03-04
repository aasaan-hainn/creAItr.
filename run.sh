#!/bin/bash
# Script to run both backend and frontend servers for creAItr.

# Start backend (assumes venv is set up and Python 3.13 is installed)
echo "Starting backend server on port 5001..."
cd backend_server
source venv/bin/activate
PORT=5001 python backend.py &
BACKEND_PID=$!
cd ..

# Start frontend (assumes npm dependencies are installed)
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Servers are starting. Backend: http://localhost:5001, Frontend: http://localhost:5173"

echo "To stop both servers, run: kill $BACKEND_PID $FRONTEND_PID"
