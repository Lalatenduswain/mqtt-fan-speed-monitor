import { Router } from 'express';
import { Room } from '../models/Room.js';
import { Device } from '../models/Device.js';

const router = Router();

// Get all rooms
router.get('/', (req, res) => {
  try {
    const rooms = Room.getAll();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID with devices
router.get('/:id', (req, res) => {
  try {
    const room = Room.getWithDevices(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Add environment data
    const environment = Room.getEnvironment(req.params.id);
    res.json({ ...room, environment });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create a new room
router.post('/', (req, res) => {
  try {
    const { id, name, icon, sort_order } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }
    const room = Room.create({ id, name, icon, sort_order });
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(409).json({ error: 'Room ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update a room
router.put('/:id', (req, res) => {
  try {
    const room = Room.update(req.params.id, req.body);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete a room
router.delete('/:id', (req, res) => {
  try {
    const result = Room.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get devices in a room
router.get('/:id/devices', (req, res) => {
  try {
    const devices = Device.getByRoom(req.params.id);
    res.json(devices);
  } catch (error) {
    console.error('Error fetching room devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

export default router;
