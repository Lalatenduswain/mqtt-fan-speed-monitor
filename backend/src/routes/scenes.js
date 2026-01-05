import { Router } from 'express';
import { Scene } from '../models/Scene.js';
import { Device } from '../models/Device.js';
import { sendDeviceCommand } from '../services/mqttService.js';

const router = Router();

// Get all scenes
router.get('/', (req, res) => {
  try {
    const scenes = Scene.getAll();
    res.json(scenes);
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

// Get scene by ID
router.get('/:id', (req, res) => {
  try {
    const scene = Scene.getById(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    res.json(scene);
  } catch (error) {
    console.error('Error fetching scene:', error);
    res.status(500).json({ error: 'Failed to fetch scene' });
  }
});

// Create a new scene
router.post('/', (req, res) => {
  try {
    const { id, name, icon, actions } = req.body;

    if (!id || !name || !actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'id, name, and actions array are required' });
    }

    const scene = Scene.create({ id, name, icon, actions });
    res.status(201).json(scene);
  } catch (error) {
    console.error('Error creating scene:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(409).json({ error: 'Scene ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

// Update a scene
router.put('/:id', (req, res) => {
  try {
    const scene = Scene.update(req.params.id, req.body);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    res.json(scene);
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// Delete a scene
router.delete('/:id', (req, res) => {
  try {
    const result = Scene.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    res.json({ message: 'Scene deleted' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

// Execute a scene
router.post('/:id/execute', async (req, res) => {
  try {
    const scene = Scene.getById(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const results = [];

    for (const action of scene.actions) {
      // Handle "all devices" action
      if (action.device_id === '*') {
        const devices = Device.getAll();
        for (const device of devices) {
          try {
            await sendDeviceCommand(device, action.action);
            Device.updateState(device.id, action.action);
            results.push({ device_id: device.id, status: 'success' });
          } catch (err) {
            results.push({ device_id: device.id, status: 'failed', error: err.message });
          }
        }
      } else {
        const device = Device.getById(action.device_id);
        if (device) {
          try {
            await sendDeviceCommand(device, action.action);
            Device.updateState(device.id, action.action);
            results.push({ device_id: action.device_id, status: 'success' });
          } catch (err) {
            results.push({ device_id: action.device_id, status: 'failed', error: err.message });
          }
        } else {
          results.push({ device_id: action.device_id, status: 'not_found' });
        }
      }
    }

    res.json({
      message: `Scene "${scene.name}" executed`,
      results
    });
  } catch (error) {
    console.error('Error executing scene:', error);
    res.status(500).json({ error: 'Failed to execute scene' });
  }
});

export default router;
