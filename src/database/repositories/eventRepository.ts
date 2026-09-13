import { getDatabase } from '../connection';
import { Event, EventStats } from '../../types';

export class EventRepository {
  static getAll(): Event[] {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM events ORDER BY created_at DESC`);
    return stmt.all() as Event[];
  }

  static getById(id: number): Event | null {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
    const row = stmt.get(id);
    return (row as Event) || null;
  }

  static getActive(): Event | null {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM events WHERE status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 1`);
    const row = stmt.get();
    if (row) return row as Event;

    // Fallback to most recent event if none has ACTIVE status
    const firstStmt = db.prepare(`SELECT * FROM events ORDER BY created_at DESC LIMIT 1`);
    const firstRow = firstStmt.get();
    return (firstRow as Event) || null;
  }

  static create(data: { name: string; date: string; time?: string; venue?: string; eventType?: string; capacity: number }): Event {
    const db = getDatabase();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO events (name, date, time, venue, eventType, capacity, status, created_at, updated_at)
      VALUES (@name, @date, @time, @venue, @eventType, @capacity, 'ACTIVE', @created_at, @updated_at)
    `);

    const transaction = db.transaction(() => {
      db.prepare(`UPDATE events SET status = 'ARCHIVED' WHERE status = 'ACTIVE'`).run();
      const result = insert.run({
        name: data.name.trim(),
        date: data.date,
        time: data.time || null,
        venue: data.venue || null,
        eventType: data.eventType || 'wedding',
        capacity: data.capacity,
        created_at: now,
        updated_at: now,
      });
      return this.getById(Number(result.lastInsertRowid))!;
    });

    return transaction();
  }

  static setActive(id: number): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const transaction = db.transaction(() => {
      db.prepare(`UPDATE events SET status = 'ARCHIVED'`).run();
      db.prepare(`UPDATE events SET status = 'ACTIVE', updated_at = ? WHERE id = ?`).run(now, id);
    });
    transaction();
  }

  static update(id: number, data: Partial<Event>): Event {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name.trim());
    }
    if (data.date !== undefined) {
      fields.push('date = ?');
      values.push(data.date);
    }
    if (data.time !== undefined) {
      fields.push('time = ?');
      values.push(data.time);
    }
    if (data.venue !== undefined) {
      fields.push('venue = ?');
      values.push(data.venue);
    }
    if (data.eventType !== undefined) {
      fields.push('eventType = ?');
      values.push(data.eventType);
    }
    if (data.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(data.capacity);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const query = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.getById(id)!;
  }

  static delete(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM events WHERE id = ?`);
    stmt.run(id);
  }

  static getStats(eventId: number): EventStats {
    const db = getDatabase();

    const invStatsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'USED' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'UNUSED' THEN 1 ELSE 0 END) as unused
      FROM invitations 
      WHERE event_id = ?
    `);
    const invStats = invStatsStmt.get(eventId) as { total: number; used: number | null; unused: number | null };

    const scanStatsStmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN result = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN result = 'ALREADY_USED' THEN 1 ELSE 0 END) as already_used,
        SUM(CASE WHEN result IN ('INVALID', 'WRONG_EVENT') THEN 1 ELSE 0 END) as invalid
      FROM scan_logs 
      WHERE event_id = ?
    `);
    const scanStats = scanStatsStmt.get(eventId) as { accepted: number | null; already_used: number | null; invalid: number | null };

    const total = invStats?.total || 0;
    const used = invStats?.used || 0;
    const unused = invStats?.unused || 0;
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
      totalInvitations: total,
      usedInvitations: used,
      unusedInvitations: unused,
      acceptedScans: scanStats?.accepted || 0,
      alreadyUsedScans: scanStats?.already_used || 0,
      invalidScans: scanStats?.invalid || 0,
      attendancePercentage: percentage,
    };
  }
}
