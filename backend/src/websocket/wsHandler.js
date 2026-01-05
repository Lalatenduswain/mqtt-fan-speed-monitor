import { setSpeed, getCurrentSpeed } from '../services/mqttService.js';

export function setupWebSocketHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    // Send current state to new client
    ws.send(JSON.stringify({
      type: 'initial_state',
      speed: getCurrentSpeed(),
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'set_speed':
            console.log(`Received set_speed command: ${message.speed}`);
            setSpeed(message.speed);
            break;
          case 'get_status':
            ws.send(JSON.stringify({
              type: 'status',
              speed: getCurrentSpeed(),
            }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}
