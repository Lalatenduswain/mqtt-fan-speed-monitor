import { getDb } from '../database/db.js';

export class Scene {
  static getAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM scenes ORDER BY name').all().map(this.parseScene);
  }

  static getById(id) {
    const db = getDb();
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
    return scene ? this.parseScene(scene) : null;
  }

  static create({ id, name, icon = 'play', actions }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO scenes (id, name, icon, actions)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, icon, JSON.stringify(actions));
    return this.getById(id);
  }

  static update(id, { name, icon, actions }) {
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
    if (actions !== undefined) {
      updates.push('actions = ?');
      params.push(JSON.stringify(actions));
    }

    if (updates.length === 0) return this.getById(id);

    params.push(id);
    const stmt = db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return this.getById(id);
  }

  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM scenes WHERE id = ?');
    return stmt.run(id);
  }

  static parseScene(scene) {
    if (!scene) return null;
    return {
      ...scene,
      actions: scene.actions ? JSON.parse(scene.actions) : []
    };
  }
}
