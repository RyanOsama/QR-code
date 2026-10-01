import { CardTemplateRepository } from '../database/repositories/cardTemplateRepository';
import { SupabaseService } from './supabaseService';
import { CardTemplateItem } from '../types';

export class CardTemplateService {
  /**
   * Retrieves templates with fallback and filtering.
   */
  static async getTemplates(filter?: {
    category?: string;
    companyId?: number | null;
    onlyActive?: boolean;
  }): Promise<CardTemplateItem[]> {
    // 1. If Supabase is configured and connected, try fetching from remote
    const client = SupabaseService.getClient();
    if (client) {
      try {
        let query = client.from('card_templates').select('*');
        if (filter?.category && filter.category !== 'all') {
          query = query.eq('category', filter.category);
        }
        if (filter?.onlyActive) {
          query = query.eq('is_active', true);
        }
        if (filter?.companyId !== undefined) {
          if (filter.companyId === null) {
            query = query.is('company_id', null);
          } else {
            query = query.or(`company_id.is.null,company_id.eq.${filter.companyId}`);
          }
        }
        query = query.order('is_builtin', { ascending: false }).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as CardTemplateItem[];
        }
      } catch (err) {
        console.warn('Supabase card_templates fetch notice, falling back to local SQLite:', err);
      }
    }

    // 2. Return from local SQLite
    return CardTemplateRepository.getAll(filter);
  }

  /**
   * Creates a new template.
   */
  static async createTemplate(
    item: Omit<CardTemplateItem, 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; template?: CardTemplateItem; error?: string }> {
    try {
      const created = CardTemplateRepository.create(item);

      // Attempt Supabase sync in background if available
      const client = SupabaseService.getClient();
      if (client) {
        try {
          await client.from('card_templates').upsert(created);
        } catch (syncErr) {
          console.warn('Supabase card template remote sync warning:', syncErr);
        }
      }

      return { success: true, template: created };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل حفظ القالب الجديد.' };
    }
  }

  /**
   * Updates an existing template.
   */
  static async updateTemplate(
    id: string,
    data: Partial<CardTemplateItem>
  ): Promise<{ success: boolean; template?: CardTemplateItem; error?: string }> {
    try {
      const updated = CardTemplateRepository.update(id, data);
      if (!updated) {
        return { success: false, error: 'القالب غير موجود.' };
      }

      // Attempt Supabase sync
      const client = SupabaseService.getClient();
      if (client) {
        try {
          await client.from('card_templates').update(data).eq('id', id);
        } catch (syncErr) {
          console.warn('Supabase card template update warning:', syncErr);
        }
      }

      return { success: true, template: updated };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تحديث بيانات القالب.' };
    }
  }

  /**
   * Toggles the active status of a template (Enable/Disable).
   */
  static async toggleActive(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const success = CardTemplateRepository.toggleActive(id, isActive);
      if (!success) {
        return { success: false, error: 'القالب غير موجود.' };
      }

      // Sync with Supabase
      const client = SupabaseService.getClient();
      if (client) {
        try {
          await client.from('card_templates').update({ is_active: isActive }).eq('id', id);
        } catch (syncErr) {
          console.warn('Supabase toggle active sync warning:', syncErr);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تغيير حالة تفعيل القالب.' };
    }
  }

  /**
   * Deletes a template.
   */
  static async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = CardTemplateRepository.delete(id);
      if (!success) {
        return { success: false, error: 'تعذر حذف القالب أو أنه غير موجود.' };
      }

      // Sync deletion with Supabase
      const client = SupabaseService.getClient();
      if (client) {
        try {
          await client.from('card_templates').delete().eq('id', id);
        } catch (syncErr) {
          console.warn('Supabase template delete sync warning:', syncErr);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل حذف القالب.' };
    }
  }
}
