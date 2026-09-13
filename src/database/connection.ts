import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;
let currentDbPath = '';

export function getDatabasePath(): string {
  if (currentDbPath) return currentDbPath;
  try {
    // Only access electron app if running inside Electron process
    if (process.versions && process.versions.electron) {
      const { app } = require('electron');
      const userData = app.getPath('userData');
      const dbDir = path.join(userData, 'data');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      currentDbPath = path.join(dbDir, 'events_invitations.db');
      return currentDbPath;
    }
  } catch (err) {
    // ignore
  }

  // Fallback for tests or runner environment
  const localDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  currentDbPath = path.join(localDir, 'events_invitations.db');
  return currentDbPath;
}

export function initDatabase(customPath?: string): Database.Database {
  if (dbInstance && !customPath) return dbInstance;

  const dbPath = customPath || getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (_) {}
  }

  dbInstance = new Database(dbPath);
  
  // High performance and safety settings
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');

  // Run schema migration
  runMigrations(dbInstance);

  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      invitation_number INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      guest_name TEXT,
      has_name INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'UNUSED',
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id INTEGER,
      event_id INTEGER NOT NULL,
      scanned_at TEXT NOT NULL,
      result TEXT NOT NULL,
      device_name TEXT,
      notes TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
    CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
    CREATE INDEX IF NOT EXISTS idx_scan_logs_event ON scan_logs(event_id);
    CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
  `);

  // Safe migrations for newly added event columns
  const tableInfo = db.prepare(`PRAGMA table_info(events)`).all() as Array<{ name: string }>;
  const colNames = tableInfo.map((c) => c.name);

  if (!colNames.includes('time')) {
    try { db.exec(`ALTER TABLE events ADD COLUMN time TEXT;`); } catch (_) {}
  }
  if (!colNames.includes('venue')) {
    try { db.exec(`ALTER TABLE events ADD COLUMN venue TEXT;`); } catch (_) {}
  }
  if (!colNames.includes('eventType')) {
    try { db.exec(`ALTER TABLE events ADD COLUMN eventType TEXT DEFAULT 'wedding';`); } catch (_) {}
  }

  // Safe migration for invitations table: graduate_name
  const invTableInfo = db.prepare(`PRAGMA table_info(invitations)`).all() as Array<{ name: string }>;
  const invColNames = invTableInfo.map((c) => c.name);
  if (!invColNames.includes('graduate_name')) {
    try { db.exec(`ALTER TABLE invitations ADD COLUMN graduate_name TEXT;`); } catch (_) {}
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      console.error('Error closing database', e);
    }
    dbInstance = null;
  }
}
