# ESP32 Home Automation Controller

Multi-purpose ESP32 firmware for controlling lights, fans, AC, TV, and monitoring power consumption.

## Features

- **4-Channel Relay Control** - Lights, fans, and appliances
- **IR Transmitter** - Control AC and TV via infrared
- **IR Receiver** - Learn codes from any remote
- **Power Monitoring** - ACS712 current sensors for energy tracking
- **Environment Sensing** - DHT22 temperature & humidity
- **MQTT Integration** - Real-time control and status updates

## Hardware Requirements

### Per Room Controller

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 DevKit V1 | 1 | Main controller |
| 4-Channel Relay Module (5V) | 1 | Switch appliances |
| IR LED (940nm) | 1 | Send IR commands |
| TSOP1738/38 IR Receiver | 1 | Learn IR codes |
| ACS712 (30A) | 2 | Power monitoring |
| DHT22 | 1 | Temperature/humidity |
| 100Ω Resistor | 1 | IR LED current limiter |
| 10K Resistor | 1 | DHT22 pull-up |

### Wiring Diagram

```
ESP32 DevKit V1
┌──────────────────────────────────────────┐
│                                          │
│  3V3  ─────────────────────────┬── DHT22 VCC
│  GND  ─────────────────────────┼── Common GND
│  VIN  ◄── 5V Power Supply      │
│                                │
│  GPIO18 ──────────────────────────► Relay CH1 (Light 1)
│  GPIO19 ──────────────────────────► Relay CH2 (Light 2)
│  GPIO21 ──────────────────────────► Relay CH3 (Fan)
│  GPIO22 ──────────────────────────► Relay CH4 (Spare)
│                                │
│  GPIO23 ──[100Ω]──────────────────► IR LED Anode
│  GPIO15 ◄─────────────────────────  IR Receiver OUT
│                                │
│  GPIO32 ◄─────────────────────────  ACS712 #1 OUT
│  GPIO33 ◄─────────────────────────  ACS712 #2 OUT
│                                │
│  GPIO4  ◄─────[10K]───────────────  DHT22 DATA
│                                │
└──────────────────────────────────────────┘

Relay Module (4-Channel, Active LOW)
┌─────────────────────────────────┐
│  VCC ◄── ESP32 VIN (5V)         │
│  GND ◄── ESP32 GND              │
│  IN1 ◄── GPIO18                 │
│  IN2 ◄── GPIO19                 │
│  IN3 ◄── GPIO21                 │
│  IN4 ◄── GPIO22                 │
│                                 │
│  ⚠️ HIGH VOLTAGE SIDE ⚠️         │
│  COM ── Live wire (from MCB)    │
│  NO  ── To appliance            │
└─────────────────────────────────┘
```

## Installation

### 1. Install Arduino IDE Libraries

Open Arduino IDE → Sketch → Include Library → Manage Libraries

Install these libraries:
- **PubSubClient** by Nick O'Leary (MQTT)
- **ArduinoJson** by Benoit Blanchon
- **IRremoteESP8266** by David Conran
- **DHT sensor library** by Adafruit

### 2. Configure Your Room

Copy the appropriate config file to `config.h`:

```bash
# For Living Room
cp config_living_room.h config.h

# For Bedroom
cp config_bedroom.h config.h

# For Kitchen
cp config_kitchen.h config.h
```

### 3. Edit Configuration

Open `config.h` and update:

```cpp
// WiFi Settings
#define WIFI_SSID          "YourWiFiName"
#define WIFI_PASSWORD      "YourWiFiPassword"

// MQTT Broker (your server IP)
#define MQTT_BROKER        "192.168.1.100"
#define MQTT_PORT          1883
```

### 4. Upload to ESP32

1. Connect ESP32 via USB
2. Select Board: `ESP32 Dev Module`
3. Select Port: Your ESP32's COM port
4. Click Upload

## MQTT Topics

### Command Topics (Subscribe)

```
home/{room}/{device}/command
```

**Relay Devices:**
```json
// Turn on light
{"on": true}

// Turn off light
{"on": false}

// Fan with speed (1-5)
{"on": true, "speed": 3}
```

**IR Devices (AC/TV):**
```json
// Send IR code
{
  "code": "0x10AF8877",
  "protocol": "NEC",
  "bits": 32
}
```

### Status Topics (Publish)

```
home/{room}/{device}/status  → Device state
home/{room}/power            → Power readings
home/{room}/environment      → Temperature/humidity
```

**Device Status:**
```json
{
  "on": true,
  "speed": 3,
  "timestamp": 12345678
}
```

**Power Readings:**
```json
{
  "sensor1": {"power": 45.5, "current": 0.2},
  "sensor2": {"power": 120.0, "current": 0.52},
  "total": 165.5,
  "voltage": 230,
  "timestamp": 12345678
}
```

**Environment:**
```json
{
  "temperature": 28.5,
  "humidity": 65,
  "timestamp": 12345678
}
```

## IR Learning Mode

To learn IR codes from your remotes:

### 1. Enable Learning Mode

Publish to MQTT:
```
Topic: home/living_room/ir_learn/command
Payload: {"enable": true}
```

### 2. Press Remote Button

Point your remote at the ESP32's IR receiver and press a button.

### 3. Receive Learned Code

The code will be published to:
```
Topic: home/living_room/ir_learned/status
Payload: {
  "protocol": "NEC",
  "code": "0xE0E040BF",
  "bits": 32,
  "raw_length": 68
}
```

### 4. Use the Code

Save the code and use it in your automations:
```json
{"code": "0xE0E040BF", "protocol": "NEC", "bits": 32}
```

## Testing

### Test via MQTT CLI

```bash
# Subscribe to all status updates
mosquitto_sub -h localhost -t "home/#" -v

# Turn on living room light
mosquitto_pub -h localhost -t "home/living_room/light1/command" \
  -m '{"on": true}'

# Set fan speed
mosquitto_pub -h localhost -t "home/living_room/fan/command" \
  -m '{"on": true, "speed": 3}'

# Send AC power command
mosquitto_pub -h localhost -t "home/living_room/ac/command" \
  -m '{"code": "0x10AF8877", "protocol": "NEC", "bits": 32}'
```

## Safety Warnings

⚠️ **DANGER: High Voltage**

- Relay module handles 230V AC mains
- **ALWAYS disconnect mains before wiring**
- Use proper electrical enclosures
- Install MCB (circuit breaker) for each circuit
- **Hire a qualified electrician for AC wiring**

⚠️ **Isolation**

- Keep low-voltage (ESP32, sensors) separate from high-voltage (relays)
- Use proper terminal blocks
- Never expose bare wires

## Troubleshooting

### ESP32 Won't Connect to WiFi
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength (try closer to router)

### MQTT Not Connecting
- Verify broker IP address
- Check if Mosquitto is running: `docker ps`
- Test broker: `mosquitto_sub -h localhost -t "test"`

### Relays Not Switching
- Check `RELAY_ACTIVE_LOW` setting (most modules are active LOW)
- Verify GPIO pin assignments
- Test with Serial monitor for debug output

### IR Not Working
- IR LED needs 100Ω current limiting resistor
- Point directly at device (IR is directional)
- Check protocol and code format
- Use learning mode to capture correct codes

### Power Readings Incorrect
- Calibrate `ACS712_SENSITIVITY` for your module
- 5A module: 185 mV/A
- 20A module: 100 mV/A
- 30A module: 66 mV/A

## Project Structure

```
esp32/
├── home_controller/
│   ├── home_controller.ino    # Main firmware
│   ├── config.h               # Active configuration
│   ├── config_living_room.h   # Living room preset
│   ├── config_bedroom.h       # Bedroom preset
│   └── config_kitchen.h       # Kitchen preset
├── ir_codes/
│   ├── ac_codes.h             # AC IR code library
│   └── tv_codes.h             # TV IR code library
└── README.md                  # This file
```

## Future Enhancements

- [ ] PWM fan speed control (for regulator fans)
- [ ] RGB LED strip control
- [ ] Dimmer support for lights
- [ ] Motion sensor integration
- [ ] Door/window sensors
- [ ] OTA (Over-the-Air) firmware updates
