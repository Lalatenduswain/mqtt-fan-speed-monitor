import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db = null;

export function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || join(__dirname, '../../data/home_automation.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(seed = false) {
  const database = getDb();

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
  console.log('Database schema initialized');

  // Optionally seed with sample data
  if (seed) {
    const seedPath = join(__dirname, 'seed.sql');
    const seedSql = readFileSync(seedPath, 'utf-8');
    database.exec(seedSql);
    console.log('Database seeded with sample data');
  }

  return database;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}
