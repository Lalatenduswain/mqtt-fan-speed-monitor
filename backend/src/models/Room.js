import { getDb } from '../database/db.js';

export class Room {
  static getAll() {
    const db = getDb();
    return db.prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM devices WHERE room_id = r.id) as device_count,
        (SELECT COUNT(*) FROM devices WHERE room_id = r.id AND json_extract(state, '$.on') = 1) as devices_on
      FROM rooms r
      ORDER BY r.sort_order, r.name
    `).all();
  }

  static getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  }

  static create({ id, name, icon = 'home', sort_order = 0 }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO rooms (id, name, icon, sort_order)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, icon, sort_order);
    return this.getById(id);
  }

  static update(id, { name, icon, sort_order }) {
    const db = getDb();
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }

    if (updates.length === 0) return this.getById(id);

    params.push(id);
    const stmt = db.prepare(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return this.getById(id);
  }

  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    return stmt.run(id);
  }

  static getWithDevices(id) {
    const db = getDb();
    const room = this.getById(id);
    if (!room) return null;

    const devices = db.prepare(`
      SELECT * FROM devices WHERE room_id = ? ORDER BY type, name
    `).all(id);

    return { ...room, devices };
  }

  static getEnvironment(id) {
    const db = getDb();
    return db.prepare(`
      SELECT temperature, humidity, timestamp
      FROM environment_logs
      WHERE room_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(id);
  }
}
