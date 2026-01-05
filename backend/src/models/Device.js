import { getDb } from '../database/db.js';

export class Device {
  static getAll() {
    const db = getDb();
    return db.prepare(`
      SELECT d.*, r.name as room_name
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      ORDER BY r.sort_order, d.type, d.name
    `).all().map(this.parseDevice);
  }

  static getById(id) {
    const db = getDb();
    const device = db.prepare(`
      SELECT d.*, r.name as room_name
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.id = ?
    `).get(id);
    return device ? this.parseDevice(device) : null;
  }

  static getByRoom(roomId) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM devices WHERE room_id = ? ORDER BY type, name
    `).all(roomId).map(this.parseDevice);
  }

  static getByType(type) {
    const db = getDb();
    return db.prepare(`
      SELECT d.*, r.name as room_name
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.type = ?
      ORDER BY r.sort_order, d.name
    `).all(type).map(this.parseDevice);
  }

  static create({ id, room_id, name, type, control_type, gpio_pin, mqtt_topic_base, ir_codes, config, state }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO devices (id, room_id, name, type, control_type, gpio_pin, mqtt_topic_base, ir_codes, config, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      room_id,
      name,
      type,
      control_type,
      gpio_pin || null,
      mqtt_topic_base || `home/${room_id}/${id}`,
      ir_codes ? JSON.stringify(ir_codes) : null,
      config ? JSON.stringify(config) : '{}',
      state ? JSON.stringify(state) : '{}'
    );
    return this.getById(id);
  }

  static update(id, updates) {
    const db = getDb();
    const device = this.getById(id);
    if (!device) return null;

    const allowedFields = ['name', 'room_id', 'type', 'control_type', 'gpio_pin', 'mqtt_topic_base', 'ir_codes', 'config', 'is_online'];
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        if (['ir_codes', 'config'].includes(key) && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
      }
    }

    if (setClauses.length === 0) return device;

    params.push(id);
    const stmt = db.prepare(`UPDATE devices SET ${setClauses.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return this.getById(id);
  }

  static updateState(id, state) {
    const db = getDb();
    const device = this.getById(id);
    if (!device) return null;

    const newState = { ...device.state, ...state };
    const stmt = db.prepare(`
      UPDATE devices SET state = ?, last_seen = CURRENT_TIMESTAMP, is_online = 1 WHERE id = ?
    `);
    stmt.run(JSON.stringify(newState), id);
    return this.getById(id);
  }

  static setOnlineStatus(id, isOnline) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE devices SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(isOnline ? 1 : 0, id);
  }

  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
    return stmt.run(id);
  }

  static parseDevice(device) {
    if (!device) return null;
    return {
      ...device,
      state: device.state ? JSON.parse(device.state) : {},
      config: device.config ? JSON.parse(device.config) : {},
      ir_codes: device.ir_codes ? JSON.parse(device.ir_codes) : null,
      is_online: Boolean(device.is_online)
    };
  }

  // Get all devices with power monitoring
  static getWithPowerMonitoring() {
    const db = getDb();
    return db.prepare(`
      SELECT d.*, r.name as room_name,
        (SELECT power_watts FROM power_logs WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1) as current_power
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      WHERE d.control_type IN ('relay', 'sensor')
      ORDER BY r.sort_order, d.name
    `).all().map(this.parseDevice);
  }
}
