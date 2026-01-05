import { Router } from 'express';
import { Schedule } from '../models/Schedule.js';
import { reloadSchedules } from '../services/schedulerService.js';

const router = Router();

// Get all schedules
router.get('/', (req, res) => {
  try {
    const { device } = req.query;
    let schedules;

    if (device) {
      schedules = Schedule.getByDevice(device);
    } else {
      schedules = Schedule.getAll();
    }

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get schedule by ID
router.get('/:id', (req, res) => {
  try {
    const schedule = Schedule.getById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Create a new schedule
router.post('/', (req, res) => {
  try {
    const { device_id, name, cron_expression, action, enabled } = req.body;

    if (!device_id || !name || !cron_expression || !action) {
      return res.status(400).json({
        error: 'device_id, name, cron_expression, and action are required'
      });
    }

    // Validate cron expression
    const cronRegex = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;
    if (!cronRegex.test(cron_expression)) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    const schedule = Schedule.create({ device_id, name, cron_expression, action, enabled });

    // Reload scheduler to pick up new schedule
    reloadSchedules();

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Update a schedule
router.put('/:id', (req, res) => {
  try {
    const schedule = Schedule.update(parseInt(req.params.id), req.body);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Reload scheduler to pick up changes
    reloadSchedules();

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Toggle schedule enabled state
router.post('/:id/toggle', (req, res) => {
  try {
    const current = Schedule.getById(parseInt(req.params.id));
    if (!current) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = Schedule.update(parseInt(req.params.id), { enabled: !current.enabled });

    // Reload scheduler
    reloadSchedules();

    res.json(schedule);
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({ error: 'Failed to toggle schedule' });
  }
});

// Delete a schedule
router.delete('/:id', (req, res) => {
  try {
    const result = Schedule.delete(parseInt(req.params.id));
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Reload scheduler
    reloadSchedules();

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

export default router;
