#!/bin/bash

# Home Automation Status Script
# Shows the status of backend and frontend services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Home Automation System - Status${NC}"
echo -e "${BLUE}========================================${NC}"

# Check Backend
echo -e "\n${YELLOW}Backend:${NC}"
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "  Status: ${GREEN}● Running${NC} (PID: $BACKEND_PID)"
        echo -e "  URL:    http://localhost:3000/api"
    else
        echo -e "  Status: ${RED}● Stopped${NC} (stale PID file)"
    fi
else
    # Check if running on port anyway
    PORT_PID=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        echo -e "  Status: ${GREEN}● Running${NC} (PID: $PORT_PID, no PID file)"
        echo -e "  URL:    http://localhost:3000/api"
    else
        echo -e "  Status: ${RED}● Stopped${NC}"
    fi
fi

# Check Frontend
echo -e "\n${YELLOW}Frontend:${NC}"
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "  Status: ${GREEN}● Running${NC} (PID: $FRONTEND_PID)"
        echo -e "  URL:    http://localhost:5173"
    else
        echo -e "  Status: ${RED}● Stopped${NC} (stale PID file)"
    fi
else
    # Check if running on port anyway
    PORT_PID=$(lsof -ti:5173 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        echo -e "  Status: ${GREEN}● Running${NC} (PID: $PORT_PID, no PID file)"
        echo -e "  URL:    http://localhost:5173"
    else
        PORT_PID=$(lsof -ti:5174 2>/dev/null)
        if [ -n "$PORT_PID" ]; then
            echo -e "  Status: ${GREEN}● Running${NC} (PID: $PORT_PID, no PID file)"
            echo -e "  URL:    http://localhost:5174"
        else
            echo -e "  Status: ${RED}● Stopped${NC}"
        fi
    fi
fi

# Check MQTT
echo -e "\n${YELLOW}MQTT Broker:${NC}"
MQTT_PID=$(pgrep -x mosquitto 2>/dev/null)
if [ -n "$MQTT_PID" ]; then
    echo -e "  Status: ${GREEN}● Running${NC} (PID: $MQTT_PID)"
    echo -e "  URL:    mqtt://localhost:1883"
else
    echo -e "  Status: ${RED}● Not detected${NC}"
fi

# Show logs info
echo -e "\n${YELLOW}Logs:${NC}"
if [ -f "$SCRIPT_DIR/logs/backend.log" ]; then
    echo -e "  Backend:  $SCRIPT_DIR/logs/backend.log"
    echo -e "            ($(wc -l < "$SCRIPT_DIR/logs/backend.log") lines)"
fi
if [ -f "$SCRIPT_DIR/logs/frontend.log" ]; then
    echo -e "  Frontend: $SCRIPT_DIR/logs/frontend.log"
    echo -e "            ($(wc -l < "$SCRIPT_DIR/logs/frontend.log") lines)"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "Commands: ${YELLOW}./start.sh${NC} | ${YELLOW}./stop.sh${NC} | ${YELLOW}./status.sh${NC}"
echo -e "${BLUE}========================================${NC}"
