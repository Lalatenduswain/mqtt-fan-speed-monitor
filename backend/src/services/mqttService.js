import mqtt from 'mqtt';
import { mqttConfig } from '../config/mqtt.config.js';
import { Device } from '../models/Device.js';
import { PowerLog } from '../models/PowerLog.js';

let client = null;
let wsServer = null;

// Topic patterns for home automation
const TOPIC_BASE = 'home';
const TOPICS = {
  command: `${TOPIC_BASE}/+/+/command`,     // home/{room}/{device}/command
  status: `${TOPIC_BASE}/+/+/status`,       // home/{room}/{device}/status
  power: `${TOPIC_BASE}/+/power`,           // home/{room}/power
  environment: `${TOPIC_BASE}/+/environment` // home/{room}/environment
};

export function initMqttClient(webSocketServer) {
  wsServer = webSocketServer;

  return new Promise((resolve, reject) => {
    client = mqtt.connect(mqttConfig.broker, mqttConfig.options);

    client.on('connect', () => {
      console.log('Connected to MQTT broker');

      // Subscribe to all home automation topics
      const topicsToSubscribe = Object.values(TOPICS);
      client.subscribe(topicsToSubscribe, { qos: 1 }, (err) => {
        if (err) {
          console.error('Subscribe error:', err);
        } else {
          console.log('Subscribed to home automation topics:', topicsToSubscribe);
        }
      });

      resolve();
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        handleMessage(topic, payload);
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      reject(err);
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });

    client.on('offline', () => {
      console.log('MQTT broker offline');
    });
  });
}

function handleMessage(topic, payload) {
  const parts = topic.split('/');

  // home/{room}/{device}/status
  if (parts.length === 4 && parts[3] === 'status') {
    handleDeviceStatus(parts[1], parts[2], payload);
  }
  // home/{room}/power
  else if (parts.length === 3 && parts[2] === 'power') {
    handlePowerReading(parts[1], payload);
  }
  // home/{room}/environment
  else if (parts.length === 3 && parts[2] === 'environment') {
    handleEnvironmentReading(parts[1], payload);
  }

  // Log for debugging
  console.log(`MQTT [${topic}]:`, JSON.stringify(payload));
}

function handleDeviceStatus(roomId, deviceName, payload) {
  // Find device by room and name pattern
  const deviceId = `${roomId}_${deviceName}`;
  const device = Device.getById(deviceId);

  if (device) {
    // Update device state in database
    Device.updateState(deviceId, payload);

    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'device_update',
      device_id: deviceId,
      state: payload,
      timestamp: new Date().toISOString()
    });
  }
}

function handlePowerReading(roomId, payload) {
  // payload: { device1: 10.5, device2: 45.2, total: 55.7 }
  for (const [deviceName, power] of Object.entries(payload)) {
    if (deviceName === 'total') continue;

    const deviceId = `${roomId}_${deviceName}`;
    const device = Device.getById(deviceId);

    if (device && typeof power === 'number') {
      PowerLog.log({
        device_id: deviceId,
        power_watts: power,
        voltage: payload.voltage,
        current_amps: payload.current
      });
    }
  }

  // Broadcast power update
  broadcastToClients({
    type: 'power_update',
    room_id: roomId,
    power: payload,
    timestamp: new Date().toISOString()
  });
}

async function handleEnvironmentReading(roomId, payload) {
  // payload: { temperature: 28.5, humidity: 65 }
  const { getDb } = await import('../database/db.js');
  const db = getDb();

  db.prepare(`
    INSERT INTO environment_logs (room_id, temperature, humidity)
    VALUES (?, ?, ?)
  `).run(roomId, payload.temperature, payload.humidity);

  // Broadcast environment update
  broadcastToClients({
    type: 'environment_update',
    room_id: roomId,
    temperature: payload.temperature,
    humidity: payload.humidity,
    timestamp: new Date().toISOString()
  });
}

// Send command to a device
export function sendDeviceCommand(device, command) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      return reject(new Error('MQTT client not connected'));
    }

    const topic = `${device.mqtt_topic_base}/command`;
    const payload = {
      ...command,
      timestamp: new Date().toISOString()
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
        reject(err);
      } else {
        console.log(`Published to ${topic}:`, payload);

        // Broadcast command sent to WebSocket clients
        broadcastToClients({
          type: 'command_sent',
          device_id: device.id,
          command: command,
          timestamp: payload.timestamp
        });

        resolve();
      }
    });
  });
}

// Publish to a specific topic
export function publishToTopic(topic, payload) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      return reject(new Error('MQTT client not connected'));
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function broadcastToClients(message) {
  if (!wsServer) return;

  const messageStr = JSON.stringify(message);
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(messageStr);
    }
  });
}

export function getClient() {
  return client;
}

export function isConnected() {
  return client && client.connected;
}

export function closeMqttClient() {
  if (client) {
    client.end();
    console.log('MQTT client closed');
  }
}
