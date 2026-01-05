/*
 * Kitchen Configuration Example
 *
 * Devices:
 * - 2 lights (main + counter)
 * - Exhaust fan
 * - Power monitoring for refrigerator & washing machine
 * - Temperature sensor
 *
 * Copy this to config.h and adjust WiFi/MQTT settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
// NETWORK CONFIGURATION
// ============================================================

#define WIFI_SSID          "YOUR_WIFI_SSID"
#define WIFI_PASSWORD      "YOUR_WIFI_PASSWORD"
#define MQTT_BROKER        "192.168.1.100"
#define MQTT_PORT          1883
#define MQTT_USER          ""
#define MQTT_PASSWORD      ""

// ============================================================
// ROOM CONFIGURATION
// ============================================================

#define ROOM_ID            "kitchen"

// ============================================================
// DEVICE CONFIGURATION
// ============================================================

#define ENABLE_RELAYS      true
#define NUM_RELAYS         4
#define RELAY_ACTIVE_LOW   true

#define RELAY_1_PIN        18
#define RELAY_2_PIN        19
#define RELAY_3_PIN        21
#define RELAY_4_PIN        22

#define RELAY_1_NAME       "light1"      // Main ceiling light
#define RELAY_2_NAME       "light2"      // Counter/work light
#define RELAY_3_NAME       "exhaust"     // Exhaust fan
#define RELAY_4_NAME       "washer"      // Washing machine power

#define RELAY_1_TYPE       "light"
#define RELAY_2_TYPE       "light"
#define RELAY_3_TYPE       "fan"
#define RELAY_4_TYPE       "appliance"

// ============================================================
// IR CONFIGURATION (Disabled for kitchen)
// ============================================================

#define ENABLE_IR          false
#define IR_SEND_PIN        23
#define IR_RECV_PIN        15

// ============================================================
// POWER MONITORING (Monitor fridge and washer)
// ============================================================

#define ENABLE_POWER_MONITOR   true
#define NUM_POWER_SENSORS      2
#define POWER_SENSOR_1_PIN     32    // Refrigerator circuit
#define POWER_SENSOR_2_PIN     33    // Washing machine circuit
#define ACS712_SENSITIVITY     66.0
#define ACS712_VOLTAGE         230.0
#define POWER_SAMPLE_COUNT     1000

// ============================================================
// ENVIRONMENT SENSORS
// ============================================================

#define ENABLE_DHT_SENSOR      true
#define DHT_PIN                4
#define DHT_TYPE               DHT22

// ============================================================
// TIMING
// ============================================================

#define STATUS_PUBLISH_INTERVAL    5000
#define POWER_PUBLISH_INTERVAL     10000
#define ENV_PUBLISH_INTERVAL       30000
#define MQTT_RECONNECT_INTERVAL    5000
#define WIFI_RECONNECT_INTERVAL    10000

// ============================================================
// DEBUG
// ============================================================

#define DEBUG_SERIAL           true
#define SERIAL_BAUD            115200

#if DEBUG_SERIAL
  #define DEBUG_PRINT(x)       Serial.print(x)
  #define DEBUG_PRINTLN(x)     Serial.println(x)
  #define DEBUG_PRINTF(...)    Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(...)
#endif

#endif
