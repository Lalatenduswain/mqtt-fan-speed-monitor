import { getDb } from '../database/db.js';

export class PowerLog {
  static log({ device_id, power_watts, voltage, current_amps }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO power_logs (device_id, power_watts, voltage, current_amps)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(device_id, power_watts, voltage || null, current_amps || null);
  }

  static getLatest(deviceId) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM power_logs
      WHERE device_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(deviceId);
  }

  static getHistory(deviceId, { hours = 24, limit = 1000 } = {}) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM power_logs
      WHERE device_id = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(deviceId, `-${hours} hours`, limit);
  }

  static getHourlyAverage(deviceId, hours = 24) {
    const db = getDb();
    return db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
        AVG(power_watts) as avg_power,
        MAX(power_watts) as max_power,
        MIN(power_watts) as min_power,
        COUNT(*) as samples
      FROM power_logs
      WHERE device_id = ? AND timestamp >= datetime('now', ?)
      GROUP BY hour
      ORDER BY hour
    `).all(deviceId, `-${hours} hours`);
  }

  static getDailyTotal(deviceId, days = 30) {
    const db = getDb();
    return db.prepare(`
      SELECT
        date(timestamp) as date,
        SUM(power_watts) / COUNT(*) * 24 / 1000 as kwh_estimated,
        AVG(power_watts) as avg_power,
        MAX(power_watts) as max_power
      FROM power_logs
      WHERE device_id = ? AND timestamp >= datetime('now', ?)
      GROUP BY date
      ORDER BY date
    `).all(deviceId, `-${days} days`);
  }

  static getTotalPower() {
    const db = getDb();
    return db.prepare(`
      SELECT
        d.id as device_id,
        d.name as device_name,
        r.name as room_name,
        p.power_watts,
        p.timestamp
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      LEFT JOIN (
        SELECT device_id, power_watts, timestamp,
          ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
        FROM power_logs
      ) p ON d.id = p.device_id AND p.rn = 1
      WHERE d.control_type IN ('relay', 'sensor')
      ORDER BY r.sort_order, d.name
    `).all();
  }

  static getSummary(hours = 24) {
    const db = getDb();
    return db.prepare(`
      SELECT
        SUM(p.power_watts) / COUNT(DISTINCT p.device_id) as total_power,
        COUNT(DISTINCT p.device_id) as device_count
      FROM power_logs p
      WHERE p.timestamp >= datetime('now', ?)
    `).get(`-${hours} hours`);
  }

  static getRoomPower(roomId) {
    const db = getDb();
    return db.prepare(`
      SELECT
        d.id as device_id,
        d.name as device_name,
        (SELECT power_watts FROM power_logs WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1) as current_power
      FROM devices d
      WHERE d.room_id = ? AND d.control_type IN ('relay', 'sensor')
    `).all(roomId);
  }

  // Cleanup old logs (keep last N days)
  static cleanup(days = 90) {
    const db = getDb();
    const stmt = db.prepare(`
      DELETE FROM power_logs WHERE timestamp < datetime('now', ?)
    `);
    return stmt.run(`-${days} days`);
  }
}
