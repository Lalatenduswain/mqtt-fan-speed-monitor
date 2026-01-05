/*
 * ESP32 4-Pin Fan Controller
 *
 * Controls a PC-style 4-pin fan via 25kHz PWM
 * Integrates with MQTT-based fan speed monitoring system
 *
 * Hardware:
 *   GPIO18 -> Fan PWM (Pin 4, Blue) via 1K resistor
 *   GPIO19 <- Fan Tach (Pin 3, Green) with 10K pull-up to 3.3V
 *   GND    -- Fan GND (Pin 1, Black)
 *   Fan 12V (Pin 2, Yellow) -> External 12V power supply
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
// WiFi Settings - UPDATE THESE
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Settings
const char* MQTT_BROKER = "fan.lalatendu.info";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_SET = "fan/speed/set";
const char* MQTT_TOPIC_STATUS = "fan/speed/status";

// Pin Definitions
const int PWM_PIN = 18;
const int TACH_PIN = 19;

// PWM Settings (25kHz for PC fans)
const int PWM_CHANNEL = 0;
const int PWM_FREQUENCY = 25000;
const int PWM_RESOLUTION = 8;

// Timing
const unsigned long STATUS_INTERVAL = 5000;   // Publish status every 5 seconds
const unsigned long RPM_SAMPLE_INTERVAL = 1000; // Calculate RPM every 1 second

// Speed to Duty Cycle mapping (index = speed level 1-5)
const uint8_t SPEED_TO_DUTY[] = {0, 51, 89, 127, 178, 255};

// ==================== GLOBAL VARIABLES ====================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

volatile uint32_t tachPulseCount = 0;
uint16_t currentRPM = 0;
uint8_t currentSpeed = 3;  // Default to mid-speed

unsigned long lastStatusTime = 0;
unsigned long lastRPMCalcTime = 0;

// ==================== INTERRUPT HANDLER ====================
void IRAM_ATTR tachISR() {
    tachPulseCount++;
}

// ==================== SETUP FUNCTIONS ====================
void setupWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("Connected! IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi connection failed!");
    }
}

void setupPWM() {
    ledcSetup(PWM_CHANNEL, PWM_FREQUENCY, PWM_RESOLUTION);
    ledcAttachPin(PWM_PIN, PWM_CHANNEL);
    setFanSpeed(currentSpeed);
    Serial.printf("PWM initialized at %d Hz on GPIO%d\n", PWM_FREQUENCY, PWM_PIN);
}

void setupTachometer() {
    pinMode(TACH_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(TACH_PIN), tachISR, FALLING);
    Serial.printf("Tachometer initialized on GPIO%d\n", TACH_PIN);
}

// ==================== MQTT FUNCTIONS ====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return;
    }

    if (doc.containsKey("speed")) {
        int newSpeed = doc["speed"];
        if (newSpeed >= 1 && newSpeed <= 5) {
            setFanSpeed(newSpeed);
            Serial.printf("Speed set to: %d\n", newSpeed);
            publishStatus();  // Immediate feedback
        }
    }
}

void reconnectMQTT() {
    if (mqttClient.connected()) return;

    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32Fan-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
        Serial.println("connected");
        mqttClient.subscribe(MQTT_TOPIC_SET);
        publishStatus();
    } else {
        Serial.printf("failed, rc=%d\n", mqttClient.state());
    }
}

// ==================== CORE FUNCTIONS ====================
void setFanSpeed(uint8_t speed) {
    currentSpeed = constrain(speed, 1, 5);
    uint8_t duty = SPEED_TO_DUTY[currentSpeed];
    ledcWrite(PWM_CHANNEL, duty);
    Serial.printf("Fan speed: %d (duty: %d/255)\n", currentSpeed, duty);
}

void calculateRPM() {
    noInterrupts();
    uint32_t pulses = tachPulseCount;
    tachPulseCount = 0;
    interrupts();

    // PC fans: 2 pulses per revolution
    currentRPM = (pulses * 60000) / (2 * RPM_SAMPLE_INTERVAL);
}

String getISO8601Timestamp() {
    // Simple timestamp based on uptime (for real time, use NTP)
    unsigned long ms = millis();
    unsigned long seconds = ms / 1000;
    unsigned long minutes = seconds / 60;
    unsigned long hours = minutes / 60;

    char buffer[32];
    snprintf(buffer, sizeof(buffer), "2026-01-05T%02lu:%02lu:%02lu.%03luZ",
             hours % 24, minutes % 60, seconds % 60, ms % 1000);
    return String(buffer);
}

void publishStatus() {
    if (!mqttClient.connected()) return;

    StaticJsonDocument<256> doc;
    doc["speed"] = currentSpeed;
    doc["rpm"] = currentRPM;
    doc["status"] = (currentSpeed > 0) ? "running" : "stopped";
    doc["timestamp"] = getISO8601Timestamp();

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC_STATUS, buffer);

    Serial.printf("Published: speed=%d, rpm=%d\n", currentSpeed, currentRPM);
}

// ==================== MAIN ====================
void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n=== ESP32 Fan Controller ===");

    setupWiFi();
    setupPWM();
    setupTachometer();

    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);

    Serial.println("Setup complete!");
}

void loop() {
    // Maintain WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        setupWiFi();
    }

    // Maintain MQTT connection
    if (!mqttClient.connected()) {
        reconnectMQTT();
    }
    mqttClient.loop();

    // Calculate RPM every second
    unsigned long now = millis();
    if (now - lastRPMCalcTime >= RPM_SAMPLE_INTERVAL) {
        calculateRPM();
        lastRPMCalcTime = now;
    }

    // Publish status periodically
    if (now - lastStatusTime >= STATUS_INTERVAL) {
        publishStatus();
        lastStatusTime = now;
    }
}
