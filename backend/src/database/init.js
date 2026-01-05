// Database initialization script
// Run with: npm run db:init

import { initDatabase, closeDb } from './db.js';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

console.log('Initializing Home Automation Database...');

try {
  // Initialize with seed data
  initDatabase(true);
  console.log('Database initialization complete!');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
} finally {
  closeDb();
}
