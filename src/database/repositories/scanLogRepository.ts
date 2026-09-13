import { getDatabase } from '../connection';
import { ScanLog, ScanResultType } from '../../types';

export class ScanLogRepository {
  static create(data: {
    invitation_id: number | null;
    event_id: number;
    result: ScanResultType;
    device_name?: string | null;
    notes?: string | null;
  }): ScanLog {
    const db = getDatabase();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO scan_logs (invitation_id, event_id, scanned_at, result, device_name, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      data.invitation_id,
      data.event_id,
      now,
      data.result,
      data.device_name || 'البوابة الرئيسية',
      data.notes || null
    );

    return {
      id: Number(res.lastInsertRowid),
      invitation_id: data.invitation_id,
      event_id: data.event_id,
      scanned_at: now,
      result: data.result,
      device_name: data.device_name || 'البوابة الرئيسية',
      notes: data.notes || null,
    };
  }

  static getByEventId(eventId: number, limit: number = 100): ScanLog[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        sl.*,
        inv.guest_name,
        inv.invitation_number
      FROM scan_logs sl
      LEFT JOIN invitations inv ON sl.invitation_id = inv.id
      WHERE sl.event_id = ?
      ORDER BY sl.scanned_at DESC
      LIMIT ?
    `);

    return stmt.all(eventId, limit) as ScanLog[];
  }
}
