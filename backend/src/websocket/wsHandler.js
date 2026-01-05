import { sendDeviceCommand } from '../services/mqttService.js';
import { Device } from '../models/Device.js';
import { Room } from '../models/Room.js';
import { Scene } from '../models/Scene.js';

export function setupWebSocketHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    // Send initial state to new client
    sendInitialState(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
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

function sendInitialState(ws) {
  try {
    const rooms = Room.getAll();
    const devices = Device.getAll();
    const scenes = Scene.getAll();

    ws.send(JSON.stringify({
      type: 'initial_state',
      data: {
        rooms,
        devices,
        scenes
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error sending initial state:', error);
  }
}

async function handleWebSocketMessage(ws, message) {
  const { type, ...payload } = message;

  switch (type) {
    case 'get_state':
      sendInitialState(ws);
      break;

    case 'control_device':
      await handleDeviceControl(ws, payload);
      break;

    case 'toggle_device':
      await handleDeviceToggle(ws, payload);
      break;

    case 'execute_scene':
      await handleSceneExecution(ws, payload);
      break;

    case 'get_room':
      handleGetRoom(ws, payload);
      break;

    case 'get_device':
      handleGetDevice(ws, payload);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      console.log('Unknown WebSocket message type:', type);
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
  }
}

async function handleDeviceControl(ws, { device_id, command }) {
  try {
    const device = Device.getById(device_id);
    if (!device) {
      ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
      return;
    }

    await sendDeviceCommand(device, command);
    const updatedDevice = Device.updateState(device_id, command);

    ws.send(JSON.stringify({
      type: 'control_response',
      success: true,
      device: updatedDevice
    }));
  } catch (error) {
    console.error('Device control error:', error);
    ws.send(JSON.stringify({
      type: 'control_response',
      success: false,
      error: error.message
    }));
  }
}

async function handleDeviceToggle(ws, { device_id }) {
  try {
    const device = Device.getById(device_id);
    if (!device) {
      ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
      return;
    }

    const newState = !device.state.on;
    const command = { on: newState };

    await sendDeviceCommand(device, command);
    const updatedDevice = Device.updateState(device_id, command);

    ws.send(JSON.stringify({
      type: 'toggle_response',
      success: true,
      device: updatedDevice
    }));
  } catch (error) {
    console.error('Device toggle error:', error);
    ws.send(JSON.stringify({
      type: 'toggle_response',
      success: false,
      error: error.message
    }));
  }
}

async function handleSceneExecution(ws, { scene_id }) {
  try {
    const scene = Scene.getById(scene_id);
    if (!scene) {
      ws.send(JSON.stringify({ type: 'error', message: 'Scene not found' }));
      return;
    }

    const results = [];
    for (const action of scene.actions) {
      if (action.device_id === '*') {
        const devices = Device.getAll();
        for (const device of devices) {
          try {
            await sendDeviceCommand(device, action.action);
            Device.updateState(device.id, action.action);
            results.push({ device_id: device.id, success: true });
          } catch (err) {
            results.push({ device_id: device.id, success: false, error: err.message });
          }
        }
      } else {
        const device = Device.getById(action.device_id);
        if (device) {
          try {
            await sendDeviceCommand(device, action.action);
            Device.updateState(device.id, action.action);
            results.push({ device_id: action.device_id, success: true });
          } catch (err) {
            results.push({ device_id: action.device_id, success: false, error: err.message });
          }
        }
      }
    }

    ws.send(JSON.stringify({
      type: 'scene_response',
      success: true,
      scene_id,
      results
    }));
  } catch (error) {
    console.error('Scene execution error:', error);
    ws.send(JSON.stringify({
      type: 'scene_response',
      success: false,
      error: error.message
    }));
  }
}

function handleGetRoom(ws, { room_id }) {
  try {
    const room = Room.getWithDevices(room_id);
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      return;
    }

    const environment = Room.getEnvironment(room_id);

    ws.send(JSON.stringify({
      type: 'room_data',
      room: { ...room, environment }
    }));
  } catch (error) {
    console.error('Get room error:', error);
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

function handleGetDevice(ws, { device_id }) {
  try {
    const device = Device.getById(device_id);
    if (!device) {
      ws.send(JSON.stringify({ type: 'error', message: 'Device not found' }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'device_data',
      device
    }));
  } catch (error) {
    console.error('Get device error:', error);
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}
