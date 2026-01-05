import { getDb } from '../database/db.js';

export class Schedule {
  static getAll() {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, d.name as device_name, d.room_id, r.name as room_name
      FROM schedules s
      LEFT JOIN devices d ON s.device_id = d.id
      LEFT JOIN rooms r ON d.room_id = r.id
      ORDER BY s.enabled DESC, s.name
    `).all().map(this.parseSchedule);
  }

  static getById(id) {
    const db = getDb();
    const schedule = db.prepare(`
      SELECT s.*, d.name as device_name, d.room_id, r.name as room_name
      FROM schedules s
      LEFT JOIN devices d ON s.device_id = d.id
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE s.id = ?
    `).get(id);
    return schedule ? this.parseSchedule(schedule) : null;
  }

  static getByDevice(deviceId) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM schedules WHERE device_id = ? ORDER BY name
    `).all(deviceId).map(this.parseSchedule);
  }

  static getEnabled() {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, d.name as device_name, d.mqtt_topic_base
      FROM schedules s
      LEFT JOIN devices d ON s.device_id = d.id
      WHERE s.enabled = 1
    `).all().map(this.parseSchedule);
  }

  static create({ device_id, name, cron_expression, action, enabled = true }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO schedules (device_id, name, cron_expression, action, enabled)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      device_id,
      name,
      cron_expression,
      JSON.stringify(action),
      enabled ? 1 : 0
    );
    return this.getById(result.lastInsertRowid);
  }

  static update(id, { name, cron_expression, action, enabled }) {
    const db = getDb();
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (cron_expression !== undefined) {
      updates.push('cron_expression = ?');
      params.push(cron_expression);
    }
    if (action !== undefined) {
      updates.push('action = ?');
      params.push(JSON.stringify(action));
    }
    if (enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(enabled ? 1 : 0);
    }

    if (updates.length === 0) return this.getById(id);

    params.push(id);
    const stmt = db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return this.getById(id);
  }

  static setLastRun(id) {
    const db = getDb();
    const stmt = db.prepare('UPDATE schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }

  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    return stmt.run(id);
  }

  static parseSchedule(schedule) {
    if (!schedule) return null;
    return {
      ...schedule,
      action: schedule.action ? JSON.parse(schedule.action) : {},
      enabled: Boolean(schedule.enabled)
    };
  }
}
