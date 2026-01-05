# Home Automation System Architecture

## System Overview

A complete DIY home automation system with centralized control, power monitoring, and PWA interface.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           PWA (Progressive Web App)                            │
│                    React + Vite + Service Worker + IndexedDB                   │
│         Dashboard │ Device Control │ Schedules │ Energy Monitor │ Settings    │
└─────────────────────────────────────┬──────────────────────────────────────────┘
                                      │ WebSocket + REST API
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ WebSocket   │  │ REST API    │  │ MQTT Client │  │ Scheduler (node-cron)│  │
│  │ Server      │  │ /api/*      │  │ Handler     │  │ Automation Engine    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│                            │                                                   │
│                    ┌───────┴───────┐                                          │
│                    │   SQLite DB    │                                          │
│                    │ (devices, logs,│                                          │
│                    │  schedules)    │                                          │
│                    └───────────────┘                                          │
└────────────────────────────────────┬──────────────────────────────────────────┘
                                     │ MQTT Protocol
                                     ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                      MOSQUITTO MQTT BROKER (Docker)                            │
│                    Topics: home/+/+/command, home/+/+/status                  │
└────────────────────────────────────┬──────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  ESP32 Node #1   │    │  ESP32 Node #2   │    │  ESP32 Node #3   │
│  (Living Room)   │    │  (Bedroom)       │    │  (Kitchen)       │
│                  │    │                  │    │                  │
│ • 4-ch Relay     │    │ • 4-ch Relay     │    │ • 4-ch Relay     │
│ • IR Blaster     │    │ • IR Blaster     │    │ • Power Monitor  │
│ • Power Monitor  │    │ • Fan PWM        │    │ • Temp Sensor    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Devices:         │    │ Devices:         │    │ Devices:         │
│ • Lights (2x)    │    │ • Lights (2x)    │    │ • Lights (2x)    │
│ • Ceiling Fan    │    │ • Ceiling Fan    │    │ • Refrigerator   │
│ • TV (IR)        │    │ • AC (IR)        │    │ • Washing Machine│
│ • AC (IR)        │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Hardware Components

### 1. ESP32 Controller Node (Per Room)

| Component | Quantity | Purpose | Approx Cost (INR) |
|-----------|----------|---------|-------------------|
| ESP32 DevKit V1 | 1 | Main controller | ₹350-500 |
| 4-Channel Relay Module (5V) | 1 | Switch appliances | ₹150-200 |
| IR Transmitter LED | 1 | Control AC/TV | ₹10 |
| IR Receiver (TSOP1738) | 1 | Learn IR codes | ₹20 |
| ACS712 Current Sensor (30A) | 2 | Power monitoring | ₹100 each |
| DHT22 Temp/Humidity | 1 | Environment sensing | ₹150 |
| 5V 2A Power Supply | 1 | Power ESP32 + Relays | ₹100 |
| PCB/Breadboard | 1 | Connections | ₹50 |
| **Total per node** | | | **~₹1,100** |

### 2. Wiring Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              ESP32 DevKit               │
                    │                                         │
  5V Power ────────►│ VIN                           GPIO23 ──│───► IR LED (with 100Ω)
  GND ─────────────►│ GND                           GPIO22 ◄─│───► IR Receiver
                    │                                         │
                    │ GPIO18 ──────────────────────────────────│───► Relay CH1 (Light 1)
                    │ GPIO19 ──────────────────────────────────│───► Relay CH2 (Light 2)
                    │ GPIO21 ──────────────────────────────────│───► Relay CH3 (Fan)
                    │ GPIO25 ──────────────────────────────────│───► Relay CH4 (Spare)
                    │                                         │
                    │ GPIO32 ◄────────────────────────────────│─── ACS712 #1 (Analog)
                    │ GPIO33 ◄────────────────────────────────│─── ACS712 #2 (Analog)
                    │ GPIO4  ◄────────────────────────────────│─── DHT22 Data
                    └─────────────────────────────────────────┘

Relay Module Connection:
┌────────────────────────────────────────────────────────────────────────────┐
│                           4-CHANNEL RELAY MODULE                           │
│  VCC ◄── 5V    GND ◄── GND                                                │
│  IN1 ◄── GPIO18   IN2 ◄── GPIO19   IN3 ◄── GPIO21   IN4 ◄── GPIO25       │
│                                                                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                          │
│  │ CH1 │ │ CH2 │ │ CH3 │ │ CH4 │  ◄── Connect to AC load (CAUTION: 220V) │
│  │ NO  │ │ NO  │ │ NO  │ │ NO  │                                          │
│  │ COM │ │ COM │ │ COM │ │ COM │                                          │
│  └─────┘ └─────┘ └─────┘ └─────┘                                          │
└────────────────────────────────────────────────────────────────────────────┘

Power Monitoring (ACS712):
┌────────────────────────────────────────────────────────────────────────────┐
│   AC LINE ──►[ L ]──────────┐                                              │
│                             │                                              │
│                      ┌──────┴──────┐                                       │
│                      │   ACS712    │                                       │
│                      │   30A       │                                       │
│                      │             │                                       │
│                      │ VCC ◄── 5V  │                                       │
│                      │ GND ◄── GND │                                       │
│                      │ OUT ──► GPIO32 (Analog read)                        │
│                      └──────┬──────┘                                       │
│                             │                                              │
│   AC LINE ──►[ L ]──────────┘──► TO APPLIANCE                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## MQTT Topic Structure

```
home/{room}/{device}/command    # Commands TO device
home/{room}/{device}/status     # Status FROM device
home/{room}/power               # Power readings
home/{room}/environment         # Temperature/humidity

Examples:
home/living_room/light1/command     → {"state": "on"} or {"state": "off"}
home/living_room/light1/status      → {"state": "on", "timestamp": "..."}
home/living_room/fan/command        → {"state": "on", "speed": 3}
home/living_room/ac/command         → {"power": "on", "temp": 24, "mode": "cool"}
home/living_room/power              → {"light1": 10.5, "fan": 45.2, "total": 55.7}
home/living_room/environment        → {"temperature": 28.5, "humidity": 65}
```

---

## Database Schema (SQLite)

```sql
-- Rooms
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'home'
);

-- Devices
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'light', 'fan', 'ac', 'tv', 'appliance'
    control_type TEXT,   -- 'relay', 'ir', 'pwm'
    mqtt_topic TEXT,
    ir_codes TEXT,       -- JSON for IR devices
    state TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Schedules
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    name TEXT,
    cron_expression TEXT NOT NULL,  -- e.g., "0 6 * * *" for 6 AM daily
    action TEXT NOT NULL,           -- JSON action to perform
    enabled INTEGER DEFAULT 1,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Power Logs (for energy monitoring)
CREATE TABLE power_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    power_watts REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Index for efficient queries
CREATE INDEX idx_power_logs_timestamp ON power_logs(timestamp);
CREATE INDEX idx_power_logs_device ON power_logs(device_id, timestamp);
```

---

## REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | GET | List all rooms |
| `/api/rooms` | POST | Create a room |
| `/api/rooms/:id/devices` | GET | Get devices in room |
| `/api/devices` | GET | List all devices |
| `/api/devices` | POST | Register a device |
| `/api/devices/:id` | PUT | Update device config |
| `/api/devices/:id/control` | POST | Send command to device |
| `/api/devices/:id/status` | GET | Get device status |
| `/api/schedules` | GET/POST | Manage schedules |
| `/api/schedules/:id` | PUT/DELETE | Update/delete schedule |
| `/api/power/summary` | GET | Energy usage summary |
| `/api/power/:deviceId/history` | GET | Historical power data |
| `/api/ir/learn` | POST | Start IR learning mode |
| `/api/ir/codes/:deviceType` | GET | Get known IR codes |

---

## PWA Features

1. **Installable** - Add to home screen on mobile
2. **Offline Support** - View last known states, queue commands
3. **Push Notifications** - Alerts for device status changes
4. **Responsive Design** - Works on all screen sizes

### Key Screens

```
┌─────────────────────────────────────────────────────────────────┐
│  HOME DASHBOARD                                           ⚙️    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Living Room    │  │    Bedroom      │  │    Kitchen      │ │
│  │  🌡️ 28°C  💧65% │  │  🌡️ 26°C  💧70% │  │  🌡️ 30°C  💧60% │ │
│  │                 │  │                 │  │                 │ │
│  │  💡 2/2 ON      │  │  💡 1/2 ON      │  │  💡 0/2 OFF     │ │
│  │  🌀 Fan: 3      │  │  ❄️ AC: 24°C    │  │  🧊 Fridge: ON  │ │
│  │  📺 TV: ON      │  │  🌀 Fan: OFF    │  │  🧺 Wash: OFF   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ⚡ TODAY'S ENERGY: 12.5 kWh (₹75.00)                           │
├─────────────────────────────────────────────────────────────────┤
│  📊 Dashboard  🏠 Rooms  ⏰ Schedules  ⚡ Energy  ⚙️ Settings   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure (Expanded)

```
home-automation/
├── docker-compose.yml              # MQTT broker + optional services
├── docker/
│   └── mosquitto/
│       └── config/mosquitto.conf
│
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js                # Main entry
│       ├── config/
│       │   ├── mqtt.config.js
│       │   └── database.js         # SQLite setup
│       ├── database/
│       │   ├── schema.sql
│       │   └── seed.sql
│       ├── models/
│       │   ├── Room.js
│       │   ├── Device.js
│       │   ├── Schedule.js
│       │   └── PowerLog.js
│       ├── services/
│       │   ├── mqttService.js      # MQTT handler
│       │   ├── deviceService.js    # Device control logic
│       │   ├── schedulerService.js # Cron-based automation
│       │   └── powerService.js     # Energy monitoring
│       ├── routes/
│       │   ├── rooms.js
│       │   ├── devices.js
│       │   ├── schedules.js
│       │   └── power.js
│       └── websocket/
│           └── wsHandler.js
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── RoomDetail.jsx
│       │   ├── Schedules.jsx
│       │   ├── EnergyMonitor.jsx
│       │   └── Settings.jsx
│       ├── components/
│       │   ├── DeviceCard/
│       │   ├── LightControl/
│       │   ├── FanControl/
│       │   ├── ACControl/
│       │   ├── PowerChart/
│       │   └── common/
│       ├── hooks/
│       │   ├── useWebSocket.js
│       │   └── useDevices.js
│       ├── context/
│       │   └── DeviceContext.jsx
│       └── utils/
│
└── esp32/
    ├── home_controller/            # Main home automation firmware
    │   └── home_controller.ino
    ├── ir_codes/                   # Common IR code database
    │   ├── ac_codes.h
    │   └── tv_codes.h
    └── libraries/                  # Custom libraries
        └── PowerMonitor/
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
- Expand backend with database (SQLite)
- Create device registration API
- Multi-device MQTT topic handling
- Basic PWA with room/device views

### Phase 2: Relay Control
- ESP32 firmware for relay control
- Light on/off control
- Fan on/off (non-PWM ceiling fans)
- Integration with frontend

### Phase 3: IR Control
- IR learning capability on ESP32
- Store IR codes in database
- AC control (power, temp, mode)
- TV control (power, volume, channel)

### Phase 4: Power Monitoring
- ACS712 integration on ESP32
- Real-time power readings via MQTT
- Historical data storage
- Energy dashboard with charts

### Phase 5: Automation & Scheduling
- Cron-based scheduler
- Scene creation (e.g., "Movie Night")
- Sunrise/sunset automation
- Energy-based alerts

---

## Safety Considerations

**IMPORTANT: Working with 220V AC is dangerous!**

1. **Use proper enclosures** - All relay modules must be in electrical boxes
2. **Hire an electrician** - For any permanent AC wiring
3. **Use SSRs for high loads** - Solid State Relays for >10A loads
4. **Add MCBs** - Miniature Circuit Breakers for each circuit
5. **Isolation** - Keep low-voltage (ESP32) separate from high-voltage (relays)
6. **Never work on live circuits** - Always turn off mains before wiring

---

## Getting Started

Ready to begin? The next steps are:

1. **Hardware Shopping** - Get ESP32, relays, sensors
2. **Backend Setup** - Add database, device models
3. **ESP32 Firmware** - Create multi-device controller
4. **Frontend Expansion** - Build room/device dashboard

Let me know which phase you'd like to start with!
