import { MigrationDefinition } from './types';

export const v1CoreMigration: MigrationDefinition = {
  version: 1,
  name: 'v1_initial_core_schema',
  titleArabic: 'المخطط الأساسي الأولي للنظام (v1)',
  description: 'إنشاء الجداول الأساسية: الشركات، المستخدمين، الفعاليات، الدعوات، سجلات المسح، والاشتراكات.',
  up: async ({ client, db }) => {
    // 1. Remote Supabase validation / schema
    if (client) {
      const { error } = await client.from('companies').select('id').limit(1);
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        throw new Error('الجداول الأساسية غير مهيأة في Supabase. يرجى التأكد من تشغيل ملف supabase_schema.sql.');
      }
    }

    // 2. Local SQLite schema
    if (db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS database_schema_version (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }
    return true;
  },
  verify: async ({ client, db }) => {
    if (client) {
      const { error } = await client.from('companies').select('id').limit(1);
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        return false;
      }
    }
    if (db) {
      const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='companies'").get();
      if (!table) return false;
    }
    return true;
  },
};
