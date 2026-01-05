/*
 * Home Automation Controller - ESP32 Firmware
 *
 * Features:
 * - 4-channel relay control (lights, fans, appliances)
 * - IR transmitter for AC/TV control
 * - IR receiver for learning remote codes
 * - Power monitoring via ACS712 current sensors
 * - Temperature & humidity via DHT22
 * - MQTT integration with home automation backend
 *
 * Hardware:
 * - ESP32 DevKit V1
 * - 4-channel relay module (5V, active LOW)
 * - IR LED + TSOP1738 receiver
 * - ACS712 current sensors (30A)
 * - DHT22 temperature/humidity sensor
 *
 * MQTT Topics:
 * - home/{room}/{device}/command  <- Receive commands
 * - home/{room}/{device}/status   -> Publish status
 * - home/{room}/power             -> Publish power readings
 * - home/{room}/environment       -> Publish temp/humidity
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

#if ENABLE_IR
  #include <IRremoteESP8266.h>
  #include <IRsend.h>
  #include <IRrecv.h>
  #include <IRutils.h>
#endif

#if ENABLE_DHT_SENSOR
  #include <DHT.h>
#endif

// ============================================================
// GLOBAL OBJECTS
// ============================================================

WiFiClient espClient;
PubSubClient mqtt(espClient);

#if ENABLE_IR
  IRsend irSend(IR_SEND_PIN);
  IRrecv irRecv(IR_RECV_PIN);
  decode_results irResults;
  bool irLearningMode = false;
#endif

#if ENABLE_DHT_SENSOR
  DHT dht(DHT_PIN, DHT_TYPE);
#endif

// ============================================================
// RELAY STATE
// ============================================================

struct RelayDevice {
  uint8_t pin;
  const char* name;
  const char* type;
  bool state;
  uint8_t speed;  // For fans (1-5, 0 = off)
};

RelayDevice relays[NUM_RELAYS] = {
  {RELAY_1_PIN, RELAY_1_NAME, RELAY_1_TYPE, false, 0},
  {RELAY_2_PIN, RELAY_2_NAME, RELAY_2_TYPE, false, 0},
  {RELAY_3_PIN, RELAY_3_NAME, RELAY_3_TYPE, false, 0},
  {RELAY_4_PIN, RELAY_4_NAME, RELAY_4_TYPE, false, 0}
};

// ============================================================
// POWER MONITORING STATE
// ============================================================

#if ENABLE_POWER_MONITOR
  float powerReadings[NUM_POWER_SENSORS] = {0};
  float currentReadings[NUM_POWER_SENSORS] = {0};
  const uint8_t powerPins[NUM_POWER_SENSORS] = {POWER_SENSOR_1_PIN, POWER_SENSOR_2_PIN};
#endif

// ============================================================
// ENVIRONMENT STATE
// ============================================================

#if ENABLE_DHT_SENSOR
  float temperature = 0;
  float humidity = 0;
#endif

// ============================================================
// TIMING
// ============================================================

unsigned long lastStatusPublish = 0;
unsigned long lastPowerPublish = 0;
unsigned long lastEnvPublish = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastMqttCheck = 0;

// ============================================================
// SETUP FUNCTIONS
// ============================================================

void setupWiFi() {
  DEBUG_PRINTLN("\n=== WiFi Setup ===");
  DEBUG_PRINTF("Connecting to %s", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    DEBUG_PRINT(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    DEBUG_PRINTLN("\nWiFi Connected!");
    DEBUG_PRINTF("IP Address: %s\n", WiFi.localIP().toString().c_str());
    DEBUG_PRINTF("Signal Strength: %d dBm\n", WiFi.RSSI());
  } else {
    DEBUG_PRINTLN("\nWiFi Connection Failed!");
  }
}

void setupRelays() {
  DEBUG_PRINTLN("\n=== Relay Setup ===");

  for (int i = 0; i < NUM_RELAYS; i++) {
    pinMode(relays[i].pin, OUTPUT);
    // Initialize to OFF state
    digitalWrite(relays[i].pin, RELAY_ACTIVE_LOW ? HIGH : LOW);
    relays[i].state = false;
    DEBUG_PRINTF("Relay %d (%s) on GPIO%d initialized\n", i + 1, relays[i].name, relays[i].pin);
  }
}

void setupMQTT() {
  DEBUG_PRINTLN("\n=== MQTT Setup ===");
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  mqtt.setBufferSize(512);  // Increase buffer for JSON payloads
  DEBUG_PRINTF("MQTT Broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
}

#if ENABLE_IR
void setupIR() {
  DEBUG_PRINTLN("\n=== IR Setup ===");
  irSend.begin();
  irRecv.enableIRIn();
  DEBUG_PRINTF("IR Send on GPIO%d, Receive on GPIO%d\n", IR_SEND_PIN, IR_RECV_PIN);
}
#endif

#if ENABLE_DHT_SENSOR
void setupDHT() {
  DEBUG_PRINTLN("\n=== DHT Sensor Setup ===");
  dht.begin();
  DEBUG_PRINTF("DHT%d on GPIO%d\n", DHT_TYPE == DHT22 ? 22 : 11, DHT_PIN);
}
#endif

#if ENABLE_POWER_MONITOR
void setupPowerMonitor() {
  DEBUG_PRINTLN("\n=== Power Monitor Setup ===");
  for (int i = 0; i < NUM_POWER_SENSORS; i++) {
    pinMode(powerPins[i], INPUT);
    DEBUG_PRINTF("Power sensor %d on GPIO%d\n", i + 1, powerPins[i]);
  }
}
#endif

// ============================================================
// MQTT FUNCTIONS
// ============================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    DEBUG_PRINTF("JSON parse error: %s\n", error.c_str());
    return;
  }

  DEBUG_PRINTF("MQTT [%s]: ", topic);
  serializeJson(doc, Serial);
  DEBUG_PRINTLN();

  // Parse topic: home/{room}/{device}/command
  String topicStr = String(topic);
  int lastSlash = topicStr.lastIndexOf('/');
  int secondLastSlash = topicStr.lastIndexOf('/', lastSlash - 1);
  String deviceName = topicStr.substring(secondLastSlash + 1, lastSlash);

  // Handle relay commands
  for (int i = 0; i < NUM_RELAYS; i++) {
    if (deviceName == relays[i].name) {
      handleRelayCommand(i, doc);
      return;
    }
  }

  #if ENABLE_IR
  // Handle IR commands
  if (deviceName == "ac" || deviceName == "tv") {
    handleIRCommand(deviceName, doc);
    return;
  }

  // Handle IR learning mode
  if (deviceName == "ir_learn") {
    irLearningMode = doc["enable"] | false;
    DEBUG_PRINTF("IR Learning Mode: %s\n", irLearningMode ? "ON" : "OFF");
    return;
  }
  #endif
}

void handleRelayCommand(int relayIndex, JsonDocument& doc) {
  bool stateChanged = false;

  // Handle on/off
  if (doc.containsKey("on")) {
    bool newState = doc["on"];
    if (relays[relayIndex].state != newState) {
      relays[relayIndex].state = newState;
      stateChanged = true;
    }
  }

  // Handle speed for fans
  if (doc.containsKey("speed") && strcmp(relays[relayIndex].type, "fan") == 0) {
    uint8_t speed = doc["speed"];
    relays[relayIndex].speed = constrain(speed, 0, 5);
    if (speed > 0) {
      relays[relayIndex].state = true;
    }
    stateChanged = true;
  }

  // Apply relay state
  if (stateChanged) {
    setRelayState(relayIndex, relays[relayIndex].state);
    publishDeviceStatus(relayIndex);
  }
}

void setRelayState(int relayIndex, bool state) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(relays[relayIndex].pin, state ? LOW : HIGH);
  } else {
    digitalWrite(relays[relayIndex].pin, state ? HIGH : LOW);
  }
  DEBUG_PRINTF("Relay %s: %s\n", relays[relayIndex].name, state ? "ON" : "OFF");
}

#if ENABLE_IR
void handleIRCommand(String deviceName, JsonDocument& doc) {
  // Get IR code from payload
  if (!doc.containsKey("code")) {
    DEBUG_PRINTLN("IR command missing 'code' field");
    return;
  }

  uint64_t code = 0;
  if (doc["code"].is<const char*>()) {
    // Hex string format
    code = strtoull(doc["code"], NULL, 16);
  } else {
    code = doc["code"];
  }

  // Get protocol (default to NEC)
  String protocol = doc["protocol"] | "NEC";
  uint16_t bits = doc["bits"] | 32;

  DEBUG_PRINTF("Sending IR: protocol=%s, code=0x%llX, bits=%d\n",
               protocol.c_str(), code, bits);

  // Send IR code based on protocol
  if (protocol == "NEC") {
    irSend.sendNEC(code, bits);
  } else if (protocol == "SAMSUNG") {
    irSend.sendSAMSUNG(code, bits);
  } else if (protocol == "LG") {
    irSend.sendLG(code, bits);
  } else if (protocol == "SONY") {
    irSend.sendSony(code, bits);
  } else if (protocol == "RAW") {
    // Handle raw codes if needed
  }

  // Publish confirmation
  publishIRStatus(deviceName, doc);
}
#endif

void connectMQTT() {
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  String clientId = "ESP32-" + String(ROOM_ID) + "-" + String(random(0xffff), HEX);
  DEBUG_PRINTF("Connecting to MQTT as %s...", clientId.c_str());

  bool connected;
  if (strlen(MQTT_USER) > 0) {
    connected = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD);
  } else {
    connected = mqtt.connect(clientId.c_str());
  }

  if (connected) {
    DEBUG_PRINTLN("connected!");

    // Subscribe to command topics for all devices
    String baseTopic = "home/" + String(ROOM_ID) + "/+/command";
    mqtt.subscribe(baseTopic.c_str());
    DEBUG_PRINTF("Subscribed to: %s\n", baseTopic.c_str());

    // Publish initial status for all devices
    for (int i = 0; i < NUM_RELAYS; i++) {
      publishDeviceStatus(i);
    }
  } else {
    DEBUG_PRINTF("failed, rc=%d\n", mqtt.state());
  }
}

// ============================================================
// PUBLISH FUNCTIONS
// ============================================================

void publishDeviceStatus(int relayIndex) {
  if (!mqtt.connected()) return;

  StaticJsonDocument<128> doc;
  doc["on"] = relays[relayIndex].state;

  if (strcmp(relays[relayIndex].type, "fan") == 0) {
    doc["speed"] = relays[relayIndex].speed;
  }

  doc["timestamp"] = millis();

  char topic[64];
  snprintf(topic, sizeof(topic), "home/%s/%s/status", ROOM_ID, relays[relayIndex].name);

  char payload[128];
  serializeJson(doc, payload);

  mqtt.publish(topic, payload, true);  // Retained message
  DEBUG_PRINTF("Published: %s -> %s\n", topic, payload);
}

void publishAllDeviceStatus() {
  for (int i = 0; i < NUM_RELAYS; i++) {
    publishDeviceStatus(i);
  }
}

#if ENABLE_IR
void publishIRStatus(String deviceName, JsonDocument& command) {
  if (!mqtt.connected()) return;

  StaticJsonDocument<128> doc;
  doc["command_received"] = true;
  doc["timestamp"] = millis();

  char topic[64];
  snprintf(topic, sizeof(topic), "home/%s/%s/status", ROOM_ID, deviceName.c_str());

  char payload[128];
  serializeJson(doc, payload);

  mqtt.publish(topic, payload);
}

void publishLearnedIRCode(decode_results* results) {
  if (!mqtt.connected()) return;

  StaticJsonDocument<256> doc;
  doc["protocol"] = typeToString(results->decode_type);
  doc["code"] = resultToHexidecimal(results);
  doc["bits"] = results->bits;
  doc["raw_length"] = results->rawlen;
  doc["timestamp"] = millis();

  char topic[64];
  snprintf(topic, sizeof(topic), "home/%s/ir_learned/status", ROOM_ID);

  char payload[256];
  serializeJson(doc, payload);

  mqtt.publish(topic, payload);
  DEBUG_PRINTF("IR Learned: %s\n", payload);
}
#endif

#if ENABLE_POWER_MONITOR
void readPowerSensors() {
  for (int i = 0; i < NUM_POWER_SENSORS; i++) {
    // Read RMS current using multiple samples
    float sumSquares = 0;
    int zeroPoint = 2048;  // ADC midpoint for ESP32 (12-bit)

    for (int s = 0; s < POWER_SAMPLE_COUNT; s++) {
      int raw = analogRead(powerPins[i]);
      int shifted = raw - zeroPoint;
      sumSquares += shifted * shifted;
    }

    float rmsADC = sqrt(sumSquares / POWER_SAMPLE_COUNT);

    // Convert to voltage (ESP32: 3.3V / 4096 levels)
    float voltage = (rmsADC * 3.3) / 4096.0;

    // Convert to current (ACS712 sensitivity)
    float current = (voltage * 1000.0) / ACS712_SENSITIVITY;

    // Calculate power
    float power = current * ACS712_VOLTAGE;

    currentReadings[i] = current;
    powerReadings[i] = power;
  }
}

void publishPowerReadings() {
  if (!mqtt.connected()) return;

  readPowerSensors();

  StaticJsonDocument<256> doc;

  float totalPower = 0;
  for (int i = 0; i < NUM_POWER_SENSORS; i++) {
    String key = "sensor" + String(i + 1);
    doc[key]["power"] = round(powerReadings[i] * 10) / 10.0;
    doc[key]["current"] = round(currentReadings[i] * 100) / 100.0;
    totalPower += powerReadings[i];
  }

  doc["total"] = round(totalPower * 10) / 10.0;
  doc["voltage"] = ACS712_VOLTAGE;
  doc["timestamp"] = millis();

  char topic[64];
  snprintf(topic, sizeof(topic), "home/%s/power", ROOM_ID);

  char payload[256];
  serializeJson(doc, payload);

  mqtt.publish(topic, payload);
  DEBUG_PRINTF("Power: %.1fW (%.2fA)\n", totalPower, currentReadings[0] + currentReadings[1]);
}
#endif

#if ENABLE_DHT_SENSOR
void readEnvironmentSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    humidity = h;
    temperature = t;
  }
}

void publishEnvironment() {
  if (!mqtt.connected()) return;

  readEnvironmentSensor();

  if (isnan(temperature) || isnan(humidity)) {
    DEBUG_PRINTLN("DHT read failed");
    return;
  }

  StaticJsonDocument<128> doc;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity);
  doc["timestamp"] = millis();

  char topic[64];
  snprintf(topic, sizeof(topic), "home/%s/environment", ROOM_ID);

  char payload[128];
  serializeJson(doc, payload);

  mqtt.publish(topic, payload);
  DEBUG_PRINTF("Environment: %.1f°C, %.0f%%\n", temperature, humidity);
}
#endif

// ============================================================
// MAIN LOOP FUNCTIONS
// ============================================================

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiCheck > WIFI_RECONNECT_INTERVAL) {
      DEBUG_PRINTLN("WiFi disconnected, reconnecting...");
      WiFi.reconnect();
      lastWifiCheck = millis();
    }
  }
}

void checkMQTT() {
  if (!mqtt.connected() && WiFi.status() == WL_CONNECTED) {
    if (millis() - lastMqttCheck > MQTT_RECONNECT_INTERVAL) {
      connectMQTT();
      lastMqttCheck = millis();
    }
  }
}

#if ENABLE_IR
void checkIRLearning() {
  if (irLearningMode && irRecv.decode(&irResults)) {
    publishLearnedIRCode(&irResults);
    irRecv.resume();
  }
}
#endif

// ============================================================
// ARDUINO SETUP & LOOP
// ============================================================

void setup() {
  #if DEBUG_SERIAL
    Serial.begin(SERIAL_BAUD);
    delay(100);
  #endif

  DEBUG_PRINTLN("\n");
  DEBUG_PRINTLN("============================================");
  DEBUG_PRINTLN("  Home Automation Controller");
  DEBUG_PRINTF("  Room: %s\n", ROOM_ID);
  DEBUG_PRINTLN("============================================");

  setupWiFi();

  #if ENABLE_RELAYS
    setupRelays();
  #endif

  #if ENABLE_IR
    setupIR();
  #endif

  #if ENABLE_POWER_MONITOR
    setupPowerMonitor();
  #endif

  #if ENABLE_DHT_SENSOR
    setupDHT();
  #endif

  setupMQTT();
  connectMQTT();

  DEBUG_PRINTLN("\n=== Setup Complete ===\n");
}

void loop() {
  unsigned long now = millis();

  // Maintain connections
  checkWiFi();
  checkMQTT();
  mqtt.loop();

  // Publish device status periodically
  if (now - lastStatusPublish >= STATUS_PUBLISH_INTERVAL) {
    publishAllDeviceStatus();
    lastStatusPublish = now;
  }

  // Publish power readings
  #if ENABLE_POWER_MONITOR
    if (now - lastPowerPublish >= POWER_PUBLISH_INTERVAL) {
      publishPowerReadings();
      lastPowerPublish = now;
    }
  #endif

  // Publish environment data
  #if ENABLE_DHT_SENSOR
    if (now - lastEnvPublish >= ENV_PUBLISH_INTERVAL) {
      publishEnvironment();
      lastEnvPublish = now;
    }
  #endif

  // Check IR learning mode
  #if ENABLE_IR
    checkIRLearning();
  #endif
}
