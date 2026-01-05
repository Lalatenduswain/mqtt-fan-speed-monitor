import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { initMqttClient, closeMqttClient, getCurrentSpeed } from './services/mqttService.js';
import { setupWebSocketHandlers } from './websocket/wsHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current fan status
app.get('/api/fan/status', (req, res) => {
  res.json({ speed: getCurrentSpeed(), status: 'running' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server attached to HTTP server (same port)
const wsServer = new WebSocketServer({ server, path: '/ws' });
setupWebSocketHandlers(wsServer);

// Initialize MQTT and start server
initMqttClient(wsServer)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`HTTP + WebSocket Server running on http://localhost:${PORT}`);
      console.log(`WebSocket path: ws://localhost:${PORT}/ws`);
      console.log('Fan Speed Monitor Backend is ready!');
    });
  })
  .catch((err) => {
    console.error('Failed to initialize MQTT:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  closeMqttClient();
  wsServer.close();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeMqttClient();
  wsServer.close();
  server.close();
  process.exit(0);
});
