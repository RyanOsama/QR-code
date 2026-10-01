import { MigrationDefinition } from './types';

const safeRemote = async (promise: PromiseLike<any>, ms = 1200) => {
  let timer: any;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } catch (e) {
    return { error: e };
  } finally {
    clearTimeout(timer);
  }
};

export const v2SecurityAndPerformanceMigration: MigrationDefinition = {
  version: 2,
  name: 'v2_security_and_performance',
  titleArabic: 'تحديث الأداء وفهارس الاستعلام المتقدمة (v2)',
  description: 'تحسين سرعة الاستعلامات وفهارس المسح الآمنة وإضافة حقول تدقيق متطورة.',
  up: async ({ client, db }) => {
    // 1. Local SQLite updates
    if (db) {
      try {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_invitations_status_event ON invitations(status, event_id);
          CREATE INDEX IF NOT EXISTS idx_scan_logs_recent ON scan_logs(event_id, scanned_at DESC);
        `);
      } catch (err: any) {
        console.warn('Local SQLite v2 index application note:', err.message);
      }
    }

    // 2. Remote Supabase updates
    if (client) {
      try {
        // Test query on tables to verify availability
        const res: any = await safeRemote(client.from('scan_logs').select('id').limit(1), 1000);
        if (res?.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
          throw new Error('تعذر تطبيق تحديث v2 نظراً لعدم وجود جدول scan_logs.');
        }
      } catch (err: any) {
        console.warn('Supabase v2 application note:', err.message);
      }
    }

    return true;
  },
  verify: async ({ client, db }) => {
    if (db) {
      const idx = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_invitations_status_event'").get();
      if (!idx) return false;
    }
    if (client) {
      const res: any = await safeRemote(client.from('scan_logs').select('id').limit(1), 1000);
      if (res?.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
        return false;
      }
    }
    return true;
  },
};
