import fs from 'fs';
import path from 'path';

export interface EnvConfig {
  databaseMode: 'cloud' | 'local';
  supabaseUrl: string;
  supabaseAnonKey: string;
  localSqlitePath: string;
}

let cachedEnv: EnvConfig | null = null;

export class EnvService {
  /**
   * Load and parse .env file from project root or userData directory.
   */
  static getEnv(): EnvConfig {
    if (cachedEnv) return cachedEnv;

    const envFiles = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '..', '.env'),
    ];

    let parsed: Record<string, string> = {};

    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
              const key = trimmed.substring(0, eqIndex).trim();
              let val = trimmed.substring(eqIndex + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
              }
              parsed[key] = val;
            }
          }
          break;
        } catch (_) {}
      }
    }

    const mode = (
      parsed['DATABASE_MODE'] ||
      process.env.DATABASE_MODE ||
      parsed['VITE_DATABASE_MODE'] ||
      process.env.VITE_DATABASE_MODE ||
      'cloud'
    ).toLowerCase() === 'local' ? 'local' : 'cloud';

    cachedEnv = {
      databaseMode: mode,
      supabaseUrl: parsed['SUPABASE_URL'] || process.env.SUPABASE_URL || parsed['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: parsed['SUPABASE_ANON_KEY'] || process.env.SUPABASE_ANON_KEY || parsed['VITE_SUPABASE_ANON_KEY'] || process.env.VITE_SUPABASE_ANON_KEY || '',
      localSqlitePath: parsed['LOCAL_SQLITE_PATH'] || process.env.LOCAL_SQLITE_PATH || path.join(process.cwd(), 'database_files', 'events_invitations.db'),
    };

    return cachedEnv;
  }

  /**
   * Update .env file with new values.
   */
  static saveEnv(config: Partial<EnvConfig>): void {
    const current = this.getEnv();
    const updated: EnvConfig = { ...current, ...config };
    cachedEnv = updated;

    const envPath = path.join(process.cwd(), '.env');
    const content = `# ===================================================================
# DATABASE CONFIGURATION (SINGLE SOURCE OF TRUTH)
# ===================================================================
# Active database mode: 'cloud' (Supabase) OR 'local' (SQLite)
DATABASE_MODE=${updated.databaseMode}

# 1. Hosted Supabase Database (Cloud)
SUPABASE_URL=${updated.supabaseUrl}
SUPABASE_ANON_KEY=${updated.supabaseAnonKey}

# 2. Local SQLite Database (Local)
LOCAL_SQLITE_PATH=${updated.localSqlitePath}
`;
    try {
      fs.writeFileSync(envPath, content, 'utf8');
    } catch (err) {
      console.warn('Could not write to .env file:', err);
    }
  }
}
