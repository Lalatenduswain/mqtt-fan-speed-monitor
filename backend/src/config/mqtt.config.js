export const mqttConfig = {
  broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  options: {
    clientId: `fan-speed-backend-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  },
  topics: {
    speedSet: 'fan/speed/set',
    speedStatus: 'fan/speed/status',
    status: 'fan/status',
  },
};
