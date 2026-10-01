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
  // 1. Create base tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      temp_password TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'EMPLOYEE',
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
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
      scanned_by_name TEXT,
      scanned_by_id INTEGER,
      notes TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE SET NULL,
      FOREIGN KEY (scanned_by_id) REFERENCES app_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS system_deployment_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      deployment_mode TEXT NOT NULL DEFAULT 'saas', -- 'saas' | 'dedicated' | 'local_dev'
      database_type TEXT NOT NULL DEFAULT 'hosted_supabase',
      database_url TEXT DEFAULT '',
      database_anon_key TEXT DEFAULT '',
      device_name TEXT DEFAULT 'بوابة 1',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL UNIQUE,
      plan_name TEXT NOT NULL DEFAULT 'Professional',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly'
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled' | 'expired'
      start_date TEXT NOT NULL,
      renewal_date TEXT NOT NULL,
      expiration_date TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dedicated_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      company_name TEXT NOT NULL,
      license_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'suspended'
      issued_at TEXT NOT NULL,
      expires_at TEXT,
      notes TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT,
      license_key_hash TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      license_type TEXT NOT NULL DEFAULT 'PERPETUAL', -- 'PERPETUAL' | 'SUBSCRIPTION'
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked' | 'expired' | 'suspended'
      max_devices INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS license_activations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id INTEGER NOT NULL,
      device_id_hash TEXT NOT NULL,
      device_name TEXT,
      activated_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      deactivated_at TEXT,
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS license_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id INTEGER,
      license_key_masked TEXT,
      company_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      actor TEXT DEFAULT 'SUPER_ADMIN',
      created_at TEXT NOT NULL,
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS database_schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);


  // 2. Safe migrations for events table (columns must exist before creating indexes)
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(events)`).all() as Array<{ name: string }>;
    const colNames = tableInfo.map((c) => c.name);

    if (!colNames.includes('company_id')) {
      try { db.exec(`ALTER TABLE events ADD COLUMN company_id INTEGER;`); } catch (_) {}
    }
    if (!colNames.includes('time')) {
      try { db.exec(`ALTER TABLE events ADD COLUMN time TEXT;`); } catch (_) {}
    }
    if (!colNames.includes('venue')) {
      try { db.exec(`ALTER TABLE events ADD COLUMN venue TEXT;`); } catch (_) {}
    }
    if (!colNames.includes('eventType')) {
      try { db.exec(`ALTER TABLE events ADD COLUMN eventType TEXT DEFAULT 'wedding';`); } catch (_) {}
    }
  } catch (err) {
    console.warn('Events table migration notice:', err);
  }

  // 3. Safe migration for invitations table: graduate_name
  try {
    const invTableInfo = db.prepare(`PRAGMA table_info(invitations)`).all() as Array<{ name: string }>;
    const invColNames = invTableInfo.map((c) => c.name);
    if (!invColNames.includes('graduate_name')) {
      try { db.exec(`ALTER TABLE invitations ADD COLUMN graduate_name TEXT;`); } catch (_) {}
    }
  } catch (err) {
    console.warn('Invitations table migration notice:', err);
  }

  // 4. Safe migration for scan_logs table: scanned_by_name & scanned_by_id
  try {
    const scanTableInfo = db.prepare(`PRAGMA table_info(scan_logs)`).all() as Array<{ name: string }>;
    const scanColNames = scanTableInfo.map((c) => c.name);
    if (!scanColNames.includes('scanned_by_name')) {
      try { db.exec(`ALTER TABLE scan_logs ADD COLUMN scanned_by_name TEXT;`); } catch (_) {}
    }
    if (!scanColNames.includes('scanned_by_id')) {
      try { db.exec(`ALTER TABLE scan_logs ADD COLUMN scanned_by_id INTEGER;`); } catch (_) {}
    }
  } catch (err) {
    console.warn('Scan logs table migration notice:', err);
  }

  // 4b. Safe migration for licenses table: license_key
  try {
    const licTableInfo = db.prepare(`PRAGMA table_info(licenses)`).all() as Array<{ name: string }>;
    const licColNames = licTableInfo.map((c) => c.name);
    if (!licColNames.includes('license_key')) {
      try { db.exec(`ALTER TABLE licenses ADD COLUMN license_key TEXT;`); } catch (_) {}
    }
  } catch (err) {
    console.warn('Licenses table migration notice:', err);
  }


  // 5. Safe index creation (now all columns definitely exist)
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_app_users_company ON app_users(company_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_scan_logs_event ON scan_logs(event_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON tenant_subscriptions(company_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tenant_subscriptions(status);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_licenses_hash ON licenses(license_key_hash);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_license_activations_license ON license_activations(license_id);`); } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_license_activations_device ON license_activations(device_id_hash);`); } catch (_) {}

  // 6. Ensure a default company exists and existing events are assigned to it
  const now = new Date().toISOString();
  let defaultComp: { id: number } | undefined;
  try {
    defaultComp = db.prepare(`SELECT id FROM companies LIMIT 1`).get() as { id: number } | undefined;
    if (!defaultComp) {
      const compRes = db.prepare(`
        INSERT INTO companies (name, status, created_at)
        VALUES (?, ?, ?)
      `).run('الشركة الافتراضية', 'ACTIVE', now);
      defaultComp = { id: Number(compRes.lastInsertRowid) };
    }

    // Associate any events with NULL company_id to default company
    db.prepare(`UPDATE events SET company_id = ? WHERE company_id IS NULL`).run(defaultComp.id);
  } catch (err) {
    console.warn('Default company assignment notice:', err);
  }

  // 7. Ensure active subscription exists for every company
  try {
    const allCompanies = db.prepare(`SELECT id FROM companies`).all() as Array<{ id: number }>;
    for (const comp of allCompanies) {
      const existingSub = db.prepare(`SELECT id FROM tenant_subscriptions WHERE company_id = ?`).get(comp.id);
      if (!existingSub) {
        const start = new Date();
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1); // 1 year active subscription default
        db.prepare(`
          INSERT INTO tenant_subscriptions (company_id, plan_name, billing_cycle, status, start_date, renewal_date, expiration_date, payment_status, created_at, updated_at)
          VALUES (?, 'Professional', 'yearly', 'active', ?, ?, ?, 'paid', ?, ?)
        `).run(comp.id, start.toISOString(), expiry.toISOString(), expiry.toISOString(), now, now);
      }
    }
  } catch (err) {
    console.warn('Subscription migration notice:', err);
  }

  // 8. Seed/ensure default super admin (username: Ryan_osama, password: Ry6298017*)
  try {
    const ryanHash = '4ee8de66d65e2d776b110e2b53bc022e96b26cc90cec659892ddc05cbce0dbad'; // sha256 of 'Ry6298017*'
    const existingRyan = db.prepare(`SELECT id FROM app_users WHERE username = ?`).get('Ryan_osama');
    if (!existingRyan) {
      db.prepare(`
        INSERT INTO app_users (company_id, username, password_hash, temp_password, full_name, role, must_change_password, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(null, 'Ryan_osama', ryanHash, null, 'مدير النظام (Ryan Osama)', 'SUPER_ADMIN', 0, now);
    } else {
      db.prepare(`
        UPDATE app_users 
        SET password_hash = ?, temp_password = NULL, must_change_password = 0, role = 'SUPER_ADMIN' 
        WHERE username = ?
      `).run(ryanHash, 'Ryan_osama');
    }
  } catch (err) {
    console.warn('Super admin seed notice:', err);
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
