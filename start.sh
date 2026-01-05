#!/bin/bash

# Home Automation Start Script
# Starts both backend and frontend services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_DIR="$SCRIPT_DIR/.pids"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create PID directory
mkdir -p "$PID_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Home Automation System - Starting${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if already running
if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
    echo -e "${YELLOW}Backend is already running (PID: $(cat $PID_DIR/backend.pid))${NC}"
    BACKEND_RUNNING=true
else
    BACKEND_RUNNING=false
fi

if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
    echo -e "${YELLOW}Frontend is already running (PID: $(cat $PID_DIR/frontend.pid))${NC}"
    FRONTEND_RUNNING=true
else
    FRONTEND_RUNNING=false
fi

# Start Backend
if [ "$BACKEND_RUNNING" = false ]; then
    echo -e "\n${GREEN}Starting Backend...${NC}"
    cd "$BACKEND_DIR"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi

    # Start backend in background
    nohup npm run dev > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_DIR/backend.pid"
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
fi

# Start Frontend
if [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "\n${GREEN}Starting Frontend...${NC}"
    cd "$FRONTEND_DIR"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    # Start frontend in background
    nohup npm run dev -- --host > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
fi

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Wait a moment for services to start
sleep 2

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Started Successfully${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Backend API:  ${YELLOW}http://localhost:3000/api${NC}"
echo -e "  Frontend:     ${YELLOW}http://localhost:5173${NC}"
echo -e "  WebSocket:    ${YELLOW}ws://localhost:3000/ws${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nLogs available at:"
echo -e "  Backend:  $SCRIPT_DIR/logs/backend.log"
echo -e "  Frontend: $SCRIPT_DIR/logs/frontend.log"
echo -e "\nUse ${YELLOW}./stop.sh${NC} to stop all services"
