import { getDatabase } from '../connection';
import { ScanLog, ScanResultType } from '../../types';

export class ScanLogRepository {
  static create(data: {
    invitation_id: number | null;
    event_id: number;
    result: ScanResultType;
    device_name?: string | null;
    scanned_by_name?: string | null;
    scanned_by_id?: number | null;
    notes?: string | null;
  }): ScanLog {
    const db = getDatabase();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO scan_logs (invitation_id, event_id, scanned_at, result, device_name, scanned_by_name, scanned_by_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      data.invitation_id,
      data.event_id,
      now,
      data.result,
      data.device_name || 'البوابة الرئيسية',
      data.scanned_by_name || 'الموظف المسؤول',
      data.scanned_by_id || null,
      data.notes || null
    );

    return {
      id: Number(res.lastInsertRowid),
      invitation_id: data.invitation_id,
      event_id: data.event_id,
      scanned_at: now,
      result: data.result,
      device_name: data.device_name || 'البوابة الرئيسية',
      scanned_by_name: data.scanned_by_name || 'الموظف المسؤول',
      scanned_by_id: data.scanned_by_id || null,
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

  static getLastAcceptedScan(invitationId: number): { scanned_by_name?: string | null; scanned_at: string } | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT scanned_by_name, scanned_at 
      FROM scan_logs 
      WHERE invitation_id = ? AND result = 'ACCEPTED' 
      ORDER BY id DESC LIMIT 1
    `);
    const row = stmt.get(invitationId) as any;
    return row || null;
  }

  static clearByEventId(eventId: number): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM scan_logs WHERE event_id = ?`).run(eventId);
  }

  static clearByInvitationId(invitationId: number): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM scan_logs WHERE invitation_id = ?`).run(invitationId);
  }
}
