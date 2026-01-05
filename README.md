# MQTT Fan Speed Monitor

A real-time IoT fan speed monitoring and control system using MQTT protocol. Control fan speed through a web interface and see visual feedback with color-coded indicators.

![Fan Speed Monitor](https://img.shields.io/badge/MQTT-Fan%20Speed%20Monitor-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![Docker](https://img.shields.io/badge/Docker-Required-blue)

## Features

- **Real-time Speed Control**: Slider and quick-select buttons (1-5 levels)
- **Visual Feedback**: Animated SVG fan that spins faster/slower based on speed
- **Color Indicators**:
  - Speed 1 (Slow): Green
  - Speed 3 (Medium): Yellow
  - Speed 5 (Fast): Red
- **MQTT Integration**: Control fan speed via MQTT commands
- **Multi-client Sync**: All connected browsers update in real-time
- **WebSocket Communication**: Low-latency updates between backend and frontend

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   FanController     │    │       FanDisplay            │ │
│  │   (Slider 1-5)      │    │   (Animated Fan + Color)    │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │ WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Express)                  │
│         WebSocket Server  ◄──►  MQTT Client (mqtt.js)       │
└─────────────────────────────────────────────────────────────┘
                          │ MQTT
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              MOSQUITTO MQTT BROKER (Docker)                  │
│   Topics: fan/speed/set, fan/speed/status                   │
│   Ports: 1883 (MQTT), 9001 (WebSocket)                      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js, Express, WebSocket (ws) |
| MQTT Broker | Eclipse Mosquitto 2.0 |
| ESP32 Device | Arduino, PubSubClient, ArduinoJson |
| Communication | MQTT, WebSocket |
| Containerization | Docker, Docker Compose |

## ESP32 Hardware Controller

Control a real PC-style 4-pin fan using an ESP32 microcontroller.

### Hardware Requirements

- ESP32 development board
- PC 4-pin fan (12V, with PWM and tachometer)
- 12V power supply for fan
- 1K resistor (PWM signal)
- 10K resistor (tachometer pull-up)

### Wiring

```
ESP32                          4-Pin Fan
GPIO18 ---[1K resistor]--->    Pin 4 (PWM - Blue)
GPIO19 <--[10K pull-up]---     Pin 3 (Tach - Green)
GND -----------------------    Pin 1 (GND - Black)
                               Pin 2 (12V - Yellow) --> External 12V PSU
```

### Setup

1. **Install Arduino Libraries**
   - PubSubClient (by Nick O'Leary)
   - ArduinoJson (by Benoit Blanchon)

2. **Configure WiFi and MQTT** in `esp32/fan_controller/fan_controller.ino`:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* MQTT_BROKER = "fan.lalatendu.info";
   ```

3. **Upload** to ESP32 using Arduino IDE or PlatformIO

### Features

- 25kHz PWM output for PC fan control
- Tachometer reading for actual RPM
- MQTT integration with the web interface
- Auto-reconnect for WiFi and MQTT

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mqtt-fan-speed-monitor.git
   cd mqtt-fan-speed-monitor
   ```

2. **Start MQTT Broker**
   ```bash
   docker compose up -d
   ```

3. **Install and start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Install and start Frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

## MQTT Topics

| Topic | Direction | Purpose | Payload Example |
|-------|-----------|---------|-----------------|
| `fan/speed/set` | Publish | Set fan speed | `{"speed": 3}` |
| `fan/speed/status` | Subscribe | Current status | `{"speed": 3, "status": "running"}` |

## Control via MQTT CLI

```bash
# Set speed to 1 (Slow - Green)
docker exec fan-speed-mosquitto mosquitto_pub -t "fan/speed/set" -m '{"speed":1}'

# Set speed to 3 (Medium - Yellow)
docker exec fan-speed-mosquitto mosquitto_pub -t "fan/speed/set" -m '{"speed":3}'

# Set speed to 5 (Fast - Red)
docker exec fan-speed-mosquitto mosquitto_pub -t "fan/speed/set" -m '{"speed":5}'

# Subscribe to status updates
docker exec fan-speed-mosquitto mosquitto_sub -t "fan/speed/status" -v
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/fan/status` | GET | Get current fan status |
| `/ws` | WebSocket | Real-time communication |

## Project Structure

```
mqtt-fan-speed-monitor/
├── docker-compose.yml          # Mosquitto MQTT broker
├── docker/
│   └── mosquitto/
│       └── config/
│           └── mosquitto.conf  # MQTT broker configuration
├── esp32/
│   └── fan_controller/
│       └── fan_controller.ino  # ESP32 Arduino sketch
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js            # Main server entry
│       ├── config/
│       │   └── mqtt.config.js  # MQTT configuration
│       ├── services/
│       │   └── mqttService.js  # MQTT client service
│       └── websocket/
│           └── wsHandler.js    # WebSocket handler
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── FanController/
│       │   ├── FanDisplay/
│       │   └── SpeedIndicator/
│       ├── hooks/
│       │   └── useWebSocket.js
│       └── utils/
│           └── colorUtils.js
└── README.md
```

## Environment Variables

### Backend (.env)
```env
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
```

## Deployment

### Using Cloudflare Tunnel

1. Add your domain to `vite.config.js`:
   ```javascript
   allowedHosts: ['your-domain.com']
   ```

2. Configure tunnel to point to `http://localhost:5173`

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Serve with backend or static server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Eclipse Mosquitto](https://mosquitto.org/) - MQTT Broker
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client for Node.js
- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
