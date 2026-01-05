import mqtt from 'mqtt';
import { mqttConfig } from '../config/mqtt.config.js';

let client = null;
let wsServer = null;
let currentSpeed = 1;

export function initMqttClient(webSocketServer) {
  wsServer = webSocketServer;

  return new Promise((resolve, reject) => {
    client = mqtt.connect(mqttConfig.broker, mqttConfig.options);

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe([mqttConfig.topics.speedSet, mqttConfig.topics.speedStatus], (err) => {
        if (err) {
          console.error('Subscribe error:', err);
        } else {
          console.log('Subscribed to fan topics');
        }
      });
      publishStatus();
      resolve();
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        handleMessage(topic, payload);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      reject(err);
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });
  });
}

function handleMessage(topic, payload) {
  if (topic === mqttConfig.topics.speedSet) {
    currentSpeed = payload.speed;
    console.log(`Speed set to: ${currentSpeed}`);
    publishStatus();
    broadcastToClients({ type: 'speed_update', speed: currentSpeed });
  }
}

export function setSpeed(speed) {
  if (speed >= 1 && speed <= 5) {
    const payload = { speed, timestamp: new Date().toISOString() };
    client.publish(mqttConfig.topics.speedSet, JSON.stringify(payload), { qos: 1 });
  }
}

function publishStatus() {
  const status = {
    speed: currentSpeed,
    status: 'running',
    timestamp: new Date().toISOString(),
  };
  client.publish(mqttConfig.topics.speedStatus, JSON.stringify(status), { qos: 1 });
}

function broadcastToClients(message) {
  if (!wsServer) return;
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

export function getCurrentSpeed() {
  return currentSpeed;
}

export function closeMqttClient() {
  if (client) {
    client.end();
    console.log('MQTT client closed');
  }
}
