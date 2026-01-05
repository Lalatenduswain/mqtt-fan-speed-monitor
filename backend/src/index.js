import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { initMqttClient, closeMqttClient, isConnected } from './services/mqttService.js';
import { setupWebSocketHandlers } from './websocket/wsHandler.js';
import { initDatabase, closeDb } from './database/db.js';
import { initScheduler, stopScheduler } from './services/schedulerService.js';
import apiRouter from './routes/index.js';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', apiRouter);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server attached to HTTP server
const wsServer = new WebSocketServer({ server, path: '/ws' });
setupWebSocketHandlers(wsServer);

// Initialize services and start server
async function start() {
  try {
    // Initialize database
    console.log('Initializing database...');
    initDatabase(process.env.SEED_DB === 'true');

    // Initialize MQTT
    console.log('Connecting to MQTT broker...');
    await initMqttClient(wsServer);

    // Initialize scheduler
    console.log('Starting scheduler...');
    initScheduler();

    // Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  Home Automation Backend Started');
      console.log('========================================');
      console.log(`  HTTP API:    http://localhost:${PORT}/api`);
      console.log(`  WebSocket:   ws://localhost:${PORT}/ws`);
      console.log(`  Health:      http://localhost:${PORT}/health`);
      console.log('========================================');
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  stopScheduler();
  closeMqttClient();
  closeDb();
  wsServer.close();
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
start();
