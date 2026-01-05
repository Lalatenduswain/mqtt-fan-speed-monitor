/*
 * Home Automation Controller - Configuration
 *
 * Edit this file to configure your ESP32 node for a specific room.
 * Each ESP32 acts as a room controller with relays, IR, and sensors.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
// NETWORK CONFIGURATION
// ============================================================

// WiFi Settings
#define WIFI_SSID          "YOUR_WIFI_SSID"
#define WIFI_PASSWORD      "YOUR_WIFI_PASSWORD"

// MQTT Settings
#define MQTT_BROKER        "192.168.1.100"  // Your MQTT broker IP
#define MQTT_PORT          1883
#define MQTT_USER          ""               // Leave empty if no auth
#define MQTT_PASSWORD      ""               // Leave empty if no auth

// ============================================================
// ROOM CONFIGURATION
// ============================================================

// Room identifier (used in MQTT topics: home/{ROOM_ID}/...)
#define ROOM_ID            "living_room"    // Change per room: bedroom, kitchen, etc.

// ============================================================
// DEVICE CONFIGURATION
// ============================================================

// Relay Configuration (accent lights, fans, appliances)
#define ENABLE_RELAYS      true
#define NUM_RELAYS         4

// Relay pin assignments (active LOW for most relay modules)
#define RELAY_ACTIVE_LOW   true
#define RELAY_1_PIN        18    // Light 1
#define RELAY_2_PIN        19    // Light 2
#define RELAY_3_PIN        21    // Fan / Appliance
#define RELAY_4_PIN        22    // Spare

// Device names for each relay (used in MQTT topics)
#define RELAY_1_NAME       "light1"
#define RELAY_2_NAME       "light2"
#define RELAY_3_NAME       "fan"
#define RELAY_4_NAME       "appliance"

// Device types: "light", "fan", "appliance"
#define RELAY_1_TYPE       "light"
#define RELAY_2_TYPE       "light"
#define RELAY_3_TYPE       "fan"
#define RELAY_4_TYPE       "appliance"

// ============================================================
// IR CONFIGURATION (for AC, TV control)
// ============================================================

#define ENABLE_IR          true
#define IR_SEND_PIN        23    // IR LED pin
#define IR_RECV_PIN        15    // IR receiver pin (for learning)

// ============================================================
// POWER MONITORING (ACS712 Current Sensors)
// ============================================================

#define ENABLE_POWER_MONITOR   true
#define NUM_POWER_SENSORS      2

// ACS712 pin assignments (analog inputs)
#define POWER_SENSOR_1_PIN     32    // Monitors relay 1 & 2 circuit
#define POWER_SENSOR_2_PIN     33    // Monitors relay 3 & 4 circuit

// ACS712 calibration (30A module: 66mV/A, 20A: 100mV/A, 5A: 185mV/A)
#define ACS712_SENSITIVITY     66.0   // mV per Amp for 30A module
#define ACS712_VOLTAGE         230.0  // Mains voltage (India: 230V)
#define POWER_SAMPLE_COUNT     1000   // Samples for RMS calculation

// ============================================================
// ENVIRONMENT SENSORS
// ============================================================

#define ENABLE_DHT_SENSOR      true
#define DHT_PIN                4
#define DHT_TYPE               DHT22  // DHT11 or DHT22

// ============================================================
// TIMING CONFIGURATION
// ============================================================

#define STATUS_PUBLISH_INTERVAL    5000    // Publish device status every 5 sec
#define POWER_PUBLISH_INTERVAL     10000   // Publish power readings every 10 sec
#define ENV_PUBLISH_INTERVAL       30000   // Publish temp/humidity every 30 sec
#define MQTT_RECONNECT_INTERVAL    5000    // MQTT reconnect delay
#define WIFI_RECONNECT_INTERVAL    10000   // WiFi reconnect delay

// ============================================================
// DEBUG CONFIGURATION
// ============================================================

#define DEBUG_SERIAL           true
#define SERIAL_BAUD            115200

// Debug print macros
#if DEBUG_SERIAL
  #define DEBUG_PRINT(x)       Serial.print(x)
  #define DEBUG_PRINTLN(x)     Serial.println(x)
  #define DEBUG_PRINTF(...)    Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(...)
#endif

#endif // CONFIG_H
