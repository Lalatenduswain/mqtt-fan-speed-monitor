import { Router } from 'express';
import { Device } from '../models/Device.js';
import { sendDeviceCommand } from '../services/mqttService.js';

const router = Router();

// Get all devices
router.get('/', (req, res) => {
  try {
    const { type, room } = req.query;
    let devices;

    if (type) {
      devices = Device.getByType(type);
    } else if (room) {
      devices = Device.getByRoom(room);
    } else {
      devices = Device.getAll();
    }

    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/:id', (req, res) => {
  try {
    const device = Device.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Create a new device
router.post('/', (req, res) => {
  try {
    const { id, room_id, name, type, control_type, gpio_pin, mqtt_topic_base, ir_codes, config } = req.body;

    if (!id || !room_id || !name || !type || !control_type) {
      return res.status(400).json({ error: 'id, room_id, name, type, and control_type are required' });
    }

    const device = Device.create({
      id,
      room_id,
      name,
      type,
      control_type,
      gpio_pin,
      mqtt_topic_base,
      ir_codes,
      config,
      state: { on: false }
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(409).json({ error: 'Device ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Update a device
router.put('/:id', (req, res) => {
  try {
    const device = Device.update(req.params.id, req.body);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete a device
router.delete('/:id', (req, res) => {
  try {
    const result = Device.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Get device status
router.get('/:id/status', (req, res) => {
  try {
    const device = Device.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({
      id: device.id,
      state: device.state,
      is_online: device.is_online,
      last_seen: device.last_seen
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

// Control a device (send command)
router.post('/:id/control', async (req, res) => {
  try {
    const device = Device.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const command = req.body;

    // Send command via MQTT
    await sendDeviceCommand(device, command);

    // Optimistically update state
    const updatedDevice = Device.updateState(device.id, command);

    res.json({
      message: 'Command sent',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Error controlling device:', error);
    res.status(500).json({ error: 'Failed to control device' });
  }
});

// Toggle device (shortcut for on/off)
router.post('/:id/toggle', async (req, res) => {
  try {
    const device = Device.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const newState = !device.state.on;
    const command = { on: newState };

    await sendDeviceCommand(device, command);
    const updatedDevice = Device.updateState(device.id, command);

    res.json({
      message: `Device turned ${newState ? 'on' : 'off'}`,
      device: updatedDevice
    });
  } catch (error) {
    console.error('Error toggling device:', error);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

export default router;
