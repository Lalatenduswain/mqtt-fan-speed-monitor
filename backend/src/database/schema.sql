-- Home Automation Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'viewer')),
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'home',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('light', 'fan', 'ac', 'tv', 'appliance', 'sensor')),
    control_type TEXT NOT NULL CHECK(control_type IN ('relay', 'ir', 'pwm', 'sensor')),
    gpio_pin INTEGER,
    mqtt_topic_base TEXT,
    ir_codes TEXT,          -- JSON for IR devices
    config TEXT DEFAULT '{}', -- Additional device-specific config
    state TEXT DEFAULT '{}', -- Current state (on/off, speed, temp, etc.)
    is_online INTEGER DEFAULT 0,
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    action TEXT NOT NULL,    -- JSON action to perform
    enabled INTEGER DEFAULT 1,
    last_run DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Scenes (group of actions)
CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'play',
    actions TEXT NOT NULL,   -- JSON array of device actions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Power logs for energy monitoring
CREATE TABLE IF NOT EXISTS power_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    power_watts REAL NOT NULL,
    voltage REAL,
    current_amps REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Environment logs (temperature, humidity)
CREATE TABLE IF NOT EXISTS environment_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- IR code library (pre-defined codes for common devices)
CREATE TABLE IF NOT EXISTS ir_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    device_type TEXT NOT NULL,
    command TEXT NOT NULL,
    protocol TEXT,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_schedules_device ON schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_power_logs_device_time ON power_logs(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_power_logs_timestamp ON power_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_environment_logs_room_time ON environment_logs(room_id, timestamp);
