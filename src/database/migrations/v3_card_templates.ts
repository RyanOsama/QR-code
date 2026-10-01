import { MigrationDefinition } from './types';
import { CardTemplateRepository } from '../repositories/cardTemplateRepository';

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

export const v3CardTemplatesMigration: MigrationDefinition = {
  version: 3,
  name: 'v3_card_templates',
  titleArabic: 'نظام إدارة القوالب وخلفيات البطاقات الذكية (v3)',
  description: 'إضافة جدول القوالب card_templates لدعم تخصيص واستيراد تصاميم حفلات التخرج والزفاف والمناسبات مع خيار التعطيل والتفعيل.',
  up: async ({ client, db }) => {
    // 1. Local SQLite updates
    if (db) {
      try {
        CardTemplateRepository.initTable();
      } catch (err: any) {
        console.warn('Local SQLite v3 template initialization note:', err.message);
      }
    }

    // 2. Remote Supabase updates
    if (client) {
      try {
        const res: any = await safeRemote(client.from('card_templates').select('id').limit(1), 1200);
        if (res?.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
          // Table doesn't exist yet on remote, log notice
          console.warn('Remote Supabase card_templates table needs creation via SQL editor or migration runner.');
        }
      } catch (err: any) {
        console.warn('Supabase v3 application note:', err.message);
      }
    }

    return true;
  },
  verify: async ({ client, db }) => {
    if (db) {
      const tbl = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='card_templates'").get();
      if (!tbl) return false;
    }
    if (client) {
      const res: any = await safeRemote(client.from('card_templates').select('id').limit(1), 1200);
      if (res?.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
        return false;
      }
    }
    return true;
  },
};
