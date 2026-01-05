#!/bin/bash

# Home Automation Stop Script
# Stops both backend and frontend services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}  Home Automation System - Stopping${NC}"
echo -e "${RED}========================================${NC}"

# Stop Backend
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "\n${YELLOW}Stopping Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        # Wait for process to stop
        sleep 1
        # Force kill if still running
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend not running${NC}"
    fi
    rm -f "$PID_DIR/backend.pid"
else
    echo -e "${YELLOW}No backend PID file found${NC}"
fi

# Stop Frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "\n${YELLOW}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        # Wait for process to stop
        sleep 1
        # Force kill if still running
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend not running${NC}"
    fi
    rm -f "$PID_DIR/frontend.pid"
else
    echo -e "${YELLOW}No frontend PID file found${NC}"
fi

# Also kill any remaining node processes on the ports (cleanup)
echo -e "\n${YELLOW}Cleaning up ports...${NC}"

# Kill processes on port 3000 (backend)
BACKEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$BACKEND_PORT_PID" ]; then
    kill $BACKEND_PORT_PID 2>/dev/null
    echo -e "${GREEN}✓ Freed port 3000${NC}"
fi

# Kill processes on port 5173 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:5173 2>/dev/null)
if [ -n "$FRONTEND_PORT_PID" ]; then
    kill $FRONTEND_PORT_PID 2>/dev/null
    echo -e "${GREEN}✓ Freed port 5173${NC}"
fi

# Also check 5174 (vite alternate port)
FRONTEND_ALT_PID=$(lsof -ti:5174 2>/dev/null)
if [ -n "$FRONTEND_ALT_PID" ]; then
    kill $FRONTEND_ALT_PID 2>/dev/null
    echo -e "${GREEN}✓ Freed port 5174${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  All Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}"
