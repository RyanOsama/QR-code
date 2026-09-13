import { getDatabase } from '../connection';
import { Invitation } from '../../types';
import { generateSecureToken } from '../../services/tokenService';
import { EventRepository } from './eventRepository';

export class InvitationRepository {
  static getByEventId(eventId: number, filter?: { search?: string; status?: string; graduateName?: string }): Invitation[] {
    const db = getDatabase();
    let query = `SELECT * FROM invitations WHERE event_id = ?`;
    const params: any[] = [eventId];

    if (filter?.status && filter.status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(filter.status);
    }

    if (filter?.graduateName && filter.graduateName !== 'ALL') {
      query += ` AND graduate_name = ?`;
      params.push(filter.graduateName);
    }

    if (filter?.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      query += ` AND (invitation_number LIKE ? OR guest_name LIKE ? OR graduate_name LIKE ? OR token LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY invitation_number ASC`;
    return db.prepare(query).all(...params) as Invitation[];
  }

  static getById(id: number): Invitation | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM invitations WHERE id = ?`).get(id);
    return (row as Invitation) || null;
  }

  static getByToken(token: string): Invitation | null {
    const db = getDatabase();
    const cleanToken = token.trim();
    const row = db.prepare(`SELECT * FROM invitations WHERE token = ?`).get(cleanToken);
    return (row as Invitation) || null;
  }

  /**
   * Generates batch invitations respecting event capacity,
   * supporting either a simple count, named guests, or allocations per graduate/student.
   */
  static generateBatch(
    eventId: number,
    countToGenerate: number,
    guestNames?: string[],
    graduateAllocations?: Array<{ graduateName: string; count: number }>
  ): { success: boolean; count: number; error?: string } {
    const db = getDatabase();
    const event = EventRepository.getById(eventId);
    if (!event) {
      return { success: false, count: 0, error: 'المناسبة غير موجودة' };
    }

    // Calculate effective count to generate
    let totalCount = countToGenerate;
    if (graduateAllocations && graduateAllocations.length > 0) {
      totalCount = graduateAllocations.reduce((sum, item) => sum + (item.count || 0), 0);
    }

    // Check existing count
    const existingCountRow = db
      .prepare(`SELECT COUNT(*) as count, MAX(invitation_number) as max_num FROM invitations WHERE event_id = ?`)
      .get(eventId) as { count: number; max_num: number | null };

    const currentTotal = existingCountRow.count || 0;
    let nextNumber = (existingCountRow.max_num || 0) + 1;

    if (currentTotal + totalCount > event.capacity) {
      const allowed = Math.max(0, event.capacity - currentTotal);
      return {
        success: false,
        count: 0,
        error: `لا يمكن تجاوز السعة المحددة للمناسبة (${event.capacity}). المتبقي المسموح به: ${allowed} دعوة فقط.`,
      };
    }

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO invitations (event_id, invitation_number, token, guest_name, graduate_name, has_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'UNUSED', ?)
    `);

    const transaction = db.transaction(() => {
      let created = 0;

      // MODE A: Allocations per graduate
      if (graduateAllocations && graduateAllocations.length > 0) {
        for (const alloc of graduateAllocations) {
          const gradName = alloc.graduateName.trim();
          const cardCount = alloc.count;

          for (let c = 0; c < cardCount; c++) {
            let token = generateSecureToken();
            let attempts = 0;
            while (db.prepare(`SELECT 1 FROM invitations WHERE token = ?`).get(token) && attempts < 10) {
              token = generateSecureToken();
              attempts++;
            }

            insertStmt.run(eventId, nextNumber, token, null, gradName, 0, now);
            nextNumber++;
            created++;
          }
        }
        return created;
      }

      // MODE B: Standard batch generation
      for (let i = 0; i < countToGenerate; i++) {
        const guestName = guestNames && guestNames[i] && guestNames[i].trim() ? guestNames[i].trim() : null;
        const hasName = guestName ? 1 : 0;
        
        let token = generateSecureToken();
        let attempts = 0;
        while (db.prepare(`SELECT 1 FROM invitations WHERE token = ?`).get(token) && attempts < 10) {
          token = generateSecureToken();
          attempts++;
        }

        insertStmt.run(eventId, nextNumber, token, guestName, null, hasName, now);
        nextNumber++;
        created++;
      }
      return created;
    });

    const totalCreated = transaction();
    return { success: true, count: totalCreated };
  }

  static updateGuestName(id: number, guestName: string): Invitation {
    const db = getDatabase();
    const trimmed = guestName.trim();
    const hasName = trimmed.length > 0 ? 1 : 0;
    const val = trimmed.length > 0 ? trimmed : null;

    db.prepare(`UPDATE invitations SET guest_name = ?, has_name = ? WHERE id = ?`).run(val, hasName, id);
    return this.getById(id)!;
  }

  static regenerateToken(id: number): { success: boolean; token?: string; error?: string } {
    const db = getDatabase();
    const inv = this.getById(id);
    if (!inv) {
      return { success: false, error: 'الدعوة غير موجودة' };
    }
    if (inv.status === 'USED') {
      return { success: false, error: 'لا يمكن إعادة توليد رمز لدعوة تم استخدامها مسبقاً لحفظ نزاهة السجل!' };
    }

    let newToken = generateSecureToken();
    let attempts = 0;
    while (db.prepare(`SELECT 1 FROM invitations WHERE token = ?`).get(newToken) && attempts < 10) {
      newToken = generateSecureToken();
      attempts++;
    }

    db.prepare(`UPDATE invitations SET token = ? WHERE id = ?`).run(newToken, id);
    return { success: true, token: newToken };
  }

  static delete(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    const inv = this.getById(id);
    if (!inv) {
      return { success: false, error: 'الدعوة غير موجودة' };
    }
    db.prepare(`DELETE FROM invitations WHERE id = ?`).run(id);
    return { success: true };
  }
}
