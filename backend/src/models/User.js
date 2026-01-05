import bcrypt from 'bcryptjs';
import { getDb } from '../database/db.js';

const SALT_ROUNDS = 10;

export class User {
  static async findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT id, username, email, display_name, role, is_active, last_login, created_at
      FROM users WHERE id = ?
    `).get(id);
  }

  static async findByUsername(username) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static async findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static async getAll() {
    const db = getDb();
    return db.prepare(`
      SELECT id, username, email, display_name, role, is_active, last_login, created_at
      FROM users ORDER BY created_at DESC
    `).all();
  }

  static async create({ username, email, password, display_name, role = 'user' }) {
    const db = getDb();

    // Check if username already exists
    const existing = await this.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await this.findByEmail(email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email || null, password_hash, display_name || username, role);

    return this.findById(result.lastInsertRowid);
  }

  static async verifyPassword(username, password) {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Update last login
    const db = getDb();
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updatePassword(id, newPassword) {
    const db = getDb();
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, id);
    return this.findById(id);
  }

  static async update(id, { display_name, email, role, is_active }) {
    const db = getDb();
    const updates = [];
    const values = [];

    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  static async delete(id) {
    const db = getDb();
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return user;
  }

  static async count() {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return result.count;
  }
}
