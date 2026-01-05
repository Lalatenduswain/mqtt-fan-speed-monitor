import { Router } from 'express';
import { PowerLog } from '../models/PowerLog.js';

const router = Router();

// Get power summary
router.get('/summary', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const totalPower = PowerLog.getTotalPower();
    const summary = PowerLog.getSummary(hours);

    // Calculate estimated daily cost (assuming ₹6 per kWh)
    const ratePerKwh = parseFloat(req.query.rate) || 6;
    const totalWatts = totalPower.reduce((sum, d) => sum + (d.power_watts || 0), 0);
    const estimatedDailyKwh = (totalWatts * 24) / 1000;
    const estimatedDailyCost = estimatedDailyKwh * ratePerKwh;

    res.json({
      current_power_watts: totalWatts,
      device_count: totalPower.length,
      devices: totalPower,
      estimated_daily_kwh: estimatedDailyKwh.toFixed(2),
      estimated_daily_cost: estimatedDailyCost.toFixed(2),
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error fetching power summary:', error);
    res.status(500).json({ error: 'Failed to fetch power summary' });
  }
});

// Get power history for a device
router.get('/:deviceId/history', (req, res) => {
  try {
    const { hours, limit } = req.query;
    const history = PowerLog.getHistory(req.params.deviceId, {
      hours: parseInt(hours) || 24,
      limit: parseInt(limit) || 1000
    });
    res.json(history);
  } catch (error) {
    console.error('Error fetching power history:', error);
    res.status(500).json({ error: 'Failed to fetch power history' });
  }
});

// Get hourly averages for a device
router.get('/:deviceId/hourly', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const hourly = PowerLog.getHourlyAverage(req.params.deviceId, hours);
    res.json(hourly);
  } catch (error) {
    console.error('Error fetching hourly data:', error);
    res.status(500).json({ error: 'Failed to fetch hourly data' });
  }
});

// Get daily totals for a device
router.get('/:deviceId/daily', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const daily = PowerLog.getDailyTotal(req.params.deviceId, days);

    // Add cost estimates
    const ratePerKwh = parseFloat(req.query.rate) || 6;
    const dailyWithCost = daily.map(d => ({
      ...d,
      cost: (d.kwh_estimated * ratePerKwh).toFixed(2)
    }));

    res.json(dailyWithCost);
  } catch (error) {
    console.error('Error fetching daily data:', error);
    res.status(500).json({ error: 'Failed to fetch daily data' });
  }
});

// Get power for a specific room
router.get('/room/:roomId', (req, res) => {
  try {
    const roomPower = PowerLog.getRoomPower(req.params.roomId);
    const totalWatts = roomPower.reduce((sum, d) => sum + (d.current_power || 0), 0);

    res.json({
      room_id: req.params.roomId,
      total_power_watts: totalWatts,
      devices: roomPower
    });
  } catch (error) {
    console.error('Error fetching room power:', error);
    res.status(500).json({ error: 'Failed to fetch room power' });
  }
});

// Get latest power reading for a device
router.get('/:deviceId/latest', (req, res) => {
  try {
    const latest = PowerLog.getLatest(req.params.deviceId);
    if (!latest) {
      return res.status(404).json({ error: 'No power data found for device' });
    }
    res.json(latest);
  } catch (error) {
    console.error('Error fetching latest power:', error);
    res.status(500).json({ error: 'Failed to fetch latest power' });
  }
});

export default router;
