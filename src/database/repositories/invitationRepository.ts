import { getDatabase } from '../connection';
import { Invitation } from '../../types';
import { generateSecureToken } from '../../services/tokenService';
import { EventRepository } from './eventRepository';

export class InvitationRepository {
  static getByEventId(eventId: number, filter?: { search?: string; status?: string; graduateName?: string }): Invitation[] {
    const db = getDatabase();
    let query = `
      SELECT 
        inv.*,
        (SELECT COUNT(*) FROM scan_logs sl WHERE sl.invitation_id = inv.id) as scan_count,
        (SELECT sl.scanned_by_name FROM scan_logs sl WHERE sl.invitation_id = inv.id AND sl.result = 'ACCEPTED' ORDER BY sl.id DESC LIMIT 1) as scanned_by_name,
        (SELECT sl.device_name FROM scan_logs sl WHERE sl.invitation_id = inv.id AND sl.result = 'ACCEPTED' ORDER BY sl.id DESC LIMIT 1) as scanned_device_name
      FROM invitations inv 
      WHERE inv.event_id = ?
    `;
    const params: any[] = [eventId];

    if (filter?.status && filter.status !== 'ALL') {
      query += ` AND inv.status = ?`;
      params.push(filter.status);
    }

    if (filter?.graduateName && filter.graduateName !== 'ALL') {
      query += ` AND inv.graduate_name = ?`;
      params.push(filter.graduateName);
    }

    if (filter?.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      query += ` AND (inv.invitation_number LIKE ? OR inv.guest_name LIKE ? OR inv.graduate_name LIKE ? OR inv.token LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY inv.invitation_number ASC`;
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

  /**
   * Resets all used invitations for a specific event back to UNUSED status,
   * clears their used_at timestamps, and deletes their scan logs so they can be re-scanned.
   */
  static resetUsedByEvent(eventId: number): { success: boolean; resetCount: number; error?: string } {
    const db = getDatabase();
    try {
      const transaction = db.transaction(() => {
        // 1. Find count of used invitations
        const usedRow = db
          .prepare(`SELECT COUNT(*) as count FROM invitations WHERE event_id = ? AND status = 'USED'`)
          .get(eventId) as { count: number };
        const resetCount = usedRow.count || 0;

        // 2. Update status and used_at
        db.prepare(`
          UPDATE invitations 
          SET status = 'UNUSED', used_at = NULL 
          WHERE event_id = ? AND status = 'USED'
        `).run(eventId);

        // 3. Clear scan logs for this event to leave a completely fresh record
        db.prepare(`DELETE FROM scan_logs WHERE event_id = ?`).run(eventId);

        return resetCount;
      });

      const count = transaction();
      return { success: true, resetCount: count };
    } catch (err: any) {
      return { success: false, resetCount: 0, error: err.message || 'فشل في إعادة تعيين الدعوات' };
    }
  }

  /**
   * Resets a single used invitation back to UNUSED.
   */
  static resetSingleInvitation(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    try {
      const inv = this.getById(id);
      if (!inv) {
        return { success: false, error: 'الدعوة غير موجودة' };
      }

      db.prepare(`
        UPDATE invitations 
        SET status = 'UNUSED', used_at = NULL 
        WHERE id = ?
      `).run(id);

      // Remove scan logs for this invitation
      db.prepare(`DELETE FROM scan_logs WHERE invitation_id = ?`).run(id);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل في إعادة تعيين الدعوة' };
    }
  }

  /**
   * Expands event capacity and generates additional invitations
   */
  static addBatch(
    eventId: number,
    additionalCount: number,
    guestNames?: string[]
  ): { success: boolean; addedCount: number; newCapacity: number; error?: string } {
    const db = getDatabase();
    const event = EventRepository.getById(eventId);
    if (!event) {
      return { success: false, addedCount: 0, newCapacity: 0, error: 'المناسبة غير موجودة' };
    }

    if (isNaN(additionalCount) || additionalCount <= 0) {
      return { success: false, addedCount: 0, newCapacity: event.capacity, error: 'يرجى تحديد عدد صحيح موجب' };
    }

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO invitations (event_id, invitation_number, token, guest_name, has_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'UNUSED', ?)
    `);

    try {
      const result = db.transaction(() => {
        // 1. Get max invitation number
        const row = db
          .prepare(`SELECT MAX(invitation_number) as max_num FROM invitations WHERE event_id = ?`)
          .get(eventId) as { max_num: number | null };
        let nextNumber = (row.max_num || 0) + 1;

        // 2. Increase event capacity
        const newCapacity = event.capacity + additionalCount;
        db.prepare(`UPDATE events SET capacity = ?, updated_at = ? WHERE id = ?`).run(newCapacity, now, eventId);

        // 3. Generate new invitations
        for (let i = 0; i < additionalCount; i++) {
          const guestName = guestNames && guestNames[i] && guestNames[i].trim() ? guestNames[i].trim() : null;
          const hasName = guestName ? 1 : 0;
          let token = generateSecureToken();
          let attempts = 0;
          while (db.prepare(`SELECT 1 FROM invitations WHERE token = ?`).get(token) && attempts < 10) {
            token = generateSecureToken();
            attempts++;
          }
          insertStmt.run(eventId, nextNumber, token, guestName, hasName, now);
          nextNumber++;
        }

        return { addedCount: additionalCount, newCapacity };
      })();

      return {
        success: true,
        addedCount: result.addedCount,
        newCapacity: result.newCapacity,
      };
    } catch (err: any) {
      return {
        success: false,
        addedCount: 0,
        newCapacity: event.capacity,
        error: err.message || 'حدث خطأ أثناء إضافة الدعوات الإضافية',
      };
    }
  }
}

