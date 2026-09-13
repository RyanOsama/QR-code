import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { CloudConfig, Event, Invitation, ScanLog, CheckInResult, EventStats } from '../types';
import { generateSecureToken } from './tokenService';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';

let supabaseClient: SupabaseClient | null = null;
let currentConfig: CloudConfig | null = null;

function getConfigPath(): string {
  try {
    if (process.versions && process.versions.electron) {
      const { app } = require('electron');
      const userData = app.getPath('userData');
      const dir = path.join(userData, 'data');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, 'cloud_config.json');
    }
  } catch (_) {}

  const localDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return path.join(localDir, 'cloud_config.json');
}

export class SupabaseService {
  static getConfig(): CloudConfig {
    if (currentConfig) return currentConfig;

    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        const data = fs.readFileSync(configPath, 'utf8');
        currentConfig = JSON.parse(data);
        return currentConfig!;
      } catch (err) {
        console.error('Error reading cloud config:', err);
      }
    }

    currentConfig = {
      mode: 'local',
      supabaseUrl: '',
      supabaseAnonKey: '',
      deviceName: 'بوابة 1',
    };
    return currentConfig;
  }

  static saveConfig(config: CloudConfig): void {
    currentConfig = { ...config };
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');

    // Reset client instance so it re-initializes on next call
    supabaseClient = null;
    if (config.mode === 'cloud' && config.supabaseUrl && config.supabaseAnonKey) {
      supabaseClient = createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim(), {
        auth: { persistSession: false },
      });
    }
  }

  static isCloudMode(): boolean {
    const config = this.getConfig();
    return config.mode === 'cloud' && !!config.supabaseUrl && !!config.supabaseAnonKey;
  }

  static getClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const config = this.getConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        supabaseClient = createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim(), {
          auth: { persistSession: false },
        });
        return supabaseClient;
      } catch (err) {
        console.error('Failed to create Supabase client:', err);
      }
    }
    return null;
  }

  static async testConnection(url: string, key: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      const tempClient = createClient(url.trim(), key.trim(), {
        auth: { persistSession: false },
      });

      // Simple fast health check query
      const { data, error } = await tempClient.from('events').select('id').limit(1);
      const latencyMs = Date.now() - startTime;

      if (error) {
        // Table might not exist yet, but connection could be successful
        if (error.code === 'PGRST204' || error.message.includes('relation "events" does not exist')) {
          return {
            success: true,
            message: `تم الاتصال بالسيرفر بنجاح (${latencyMs}ms)، ولكن يرجى تشغيل كود SQL لإنشاء الجداول.`,
            latencyMs,
          };
        }
        return {
          success: false,
          message: `خطأ من السيرفر: ${error.message}`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: `تم الاتصال بنجاح وقاعدة البيانات جاهزة! سرعة الاستجابة: ${latencyMs}ms`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `فشل الاتصال: ${err.message || 'تأكد من صحة الرابط ومفتاح API'}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ==================== EVENTS ====================
  static async getEvents(): Promise<Event[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Event[];
  }

  static async getActiveEvent(): Promise<Event | null> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('events')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as Event;

    // Fallback to most recent
    const { data: recent, error: err2 } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (err2) throw err2;
    return recent ? (recent as Event) : null;
  }

  static async createEvent(data: { name: string; date: string; time?: string; venue?: string; eventType?: string; capacity: number }): Promise<Event> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const now = new Date().toISOString();

    // Archive existing active events
    await client.from('events').update({ status: 'ARCHIVED' }).eq('status', 'ACTIVE');

    const { data: created, error } = await client
      .from('events')
      .insert({
        name: data.name.trim(),
        date: data.date,
        time: data.time || null,
        venue: data.venue || null,
        eventType: data.eventType || 'wedding',
        capacity: data.capacity,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return created as Event;
  }

  static async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data: updated, error } = await client
      .from('events')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as Event;
  }

  static async setActiveEvent(id: number): Promise<void> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    await client.from('events').update({ status: 'ARCHIVED' }).neq('id', id);
    await client.from('events').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', id);
  }

  static async deleteEvent(id: number): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client.from('events').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async getEventStats(eventId: number): Promise<EventStats> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    // Total and status counts
    const { count: totalInvitations } = await client
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { count: usedInvitations } = await client
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'USED');

    const { count: acceptedScans } = await client
      .from('scan_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('result', 'ACCEPTED');

    const { count: alreadyUsedScans } = await client
      .from('scan_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('result', 'ALREADY_USED');

    const { count: invalidScans } = await client
      .from('scan_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('result', ['INVALID', 'WRONG_EVENT']);

    const total = totalInvitations || 0;
    const used = usedInvitations || 0;
    const attendancePercentage = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
      totalInvitations: total,
      usedInvitations: used,
      unusedInvitations: Math.max(0, total - used),
      acceptedScans: acceptedScans || 0,
      alreadyUsedScans: alreadyUsedScans || 0,
      invalidScans: invalidScans || 0,
      attendancePercentage,
    };
  }

  // ==================== INVITATIONS ====================
  static async getInvitations(eventId: number, filter?: { search?: string; status?: string; graduateName?: string }): Promise<Invitation[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    let query = client
      .from('invitations')
      .select('*')
      .eq('event_id', eventId);

    if (filter?.status && filter.status !== 'ALL') {
      query = query.eq('status', filter.status);
    }

    if (filter?.graduateName && filter.graduateName !== 'ALL') {
      query = query.eq('graduate_name', filter.graduateName);
    }

    if (filter?.search && filter.search.trim()) {
      const term = filter.search.trim();
      query = query.or(`guest_name.ilike.%${term}%,graduate_name.ilike.%${term}%,token.ilike.%${term}%`);
    }

    const { data, error } = await query.order('invitation_number', { ascending: true });
    if (error) throw error;
    return (data || []) as Invitation[];
  }

  static async generateBatch(
    eventId: number,
    countToGenerate: number,
    guestNames?: string[],
    graduateAllocations?: Array<{ graduateName: string; count: number }>
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    // Get current max invitation_number
    const { data: maxRow } = await client
      .from('invitations')
      .select('invitation_number')
      .eq('event_id', eventId)
      .order('invitation_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const startNumber = (maxRow?.invitation_number || 0) + 1;
    const now = new Date().toISOString();

    const records: any[] = [];
    let currentNum = startNumber;

    if (graduateAllocations && graduateAllocations.length > 0) {
      for (const alloc of graduateAllocations) {
        const gradName = alloc.graduateName.trim();
        for (let i = 0; i < alloc.count; i++) {
          records.push({
            event_id: eventId,
            invitation_number: currentNum++,
            token: generateSecureToken('GRD'),
            guest_name: null,
            graduate_name: gradName,
            has_name: 0,
            status: 'UNUSED',
            created_at: now,
          });
        }
      }
    } else if (guestNames && guestNames.length > 0) {
      for (const name of guestNames) {
        const cleanName = name.trim();
        if (cleanName) {
          records.push({
            event_id: eventId,
            invitation_number: currentNum++,
            token: generateSecureToken('INV'),
            guest_name: cleanName,
            graduate_name: null,
            has_name: 1,
            status: 'UNUSED',
            created_at: now,
          });
        }
      }
    } else {
      for (let i = 0; i < countToGenerate; i++) {
        records.push({
          event_id: eventId,
          invitation_number: currentNum++,
          token: generateSecureToken('INV'),
          guest_name: null,
          graduate_name: null,
          has_name: 0,
          status: 'UNUSED',
          created_at: now,
        });
      }
    }

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      const { error } = await client.from('invitations').insert(chunk);
      if (error) {
        return { success: false, count: i, error: error.message };
      }
    }

    return { success: true, count: records.length };
  }

  static async updateGuestName(invitationId: number, guestName: string): Promise<Invitation> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const clean = guestName.trim();
    const { data, error } = await client
      .from('invitations')
      .update({
        guest_name: clean || null,
        has_name: clean ? 1 : 0,
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw error;
    return data as Invitation;
  }

  static async deleteInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client.from('invitations').delete().eq('id', invitationId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async regenerateToken(invitationId: number): Promise<{ success: boolean; token?: string; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const newToken = generateSecureToken('INV');
    const { error } = await client
      .from('invitations')
      .update({ token: newToken })
      .eq('id', invitationId);

    if (error) return { success: false, error: error.message };
    return { success: true, token: newToken };
  }

  // ==================== ATOMIC CHECK-IN ====================
  static async checkIn(token: string, eventId: number, deviceName?: string): Promise<CheckInResult> {
    const client = this.getClient();
    if (!client) {
      return { success: false, result: 'INVALID', message: 'السيرفر السحابي غير متصل' };
    }

    const cleanToken = token.trim();
    const devName = deviceName || this.getConfig().deviceName || 'جهاز الدخول';

    // 1. Try atomic procedure in Supabase
    try {
      const { data, error } = await client.rpc('check_in_atomic', {
        p_token: cleanToken,
        p_event_id: eventId,
        p_device_name: devName,
      });

      if (!error && data) {
        return {
          success: data.success,
          result: data.result,
          message: data.message,
          guestName: data.guestName,
          invitationNumber: data.invitationNumber,
          previousUsedAt: data.previousUsedAt,
        };
      }
    } catch (rpcErr) {
      console.warn('RPC check_in_atomic not available or errored, falling back to direct query:', rpcErr);
    }

    // 2. Direct Query Fallback if RPC procedure has not been added yet
    const now = new Date().toISOString();
    const { data: invitation } = await client
      .from('invitations')
      .select('*')
      .eq('token', cleanToken)
      .maybeSingle();

    if (!invitation) {
      await client.from('scan_logs').insert({
        event_id: eventId,
        result: 'INVALID',
        device_name: devName,
        notes: `رمز QR غير معروف: ${cleanToken.substring(0, 15)}`,
      });
      return {
        success: false,
        result: 'INVALID',
        message: 'رمز الدعوة غير صالح أو غير موجود في النظام!',
      };
    }

    if (invitation.event_id !== eventId) {
      await client.from('scan_logs').insert({
        invitation_id: invitation.id,
        event_id: eventId,
        result: 'WRONG_EVENT',
        device_name: devName,
        notes: 'دعوة تابعة لمناسبة أخرى',
      });
      return {
        success: false,
        result: 'WRONG_EVENT',
        message: 'هذه الدعوة مخصصة لمناسبة أخرى ولا تتبع هذه المناسبة!',
        guestName: invitation.guest_name,
        invitationNumber: invitation.invitation_number,
      };
    }

    if (invitation.status === 'USED') {
      await client.from('scan_logs').insert({
        invitation_id: invitation.id,
        event_id: eventId,
        result: 'ALREADY_USED',
        device_name: devName,
        notes: 'محاولة دخول مكررة لدعوة مستخدمة مسبقاً',
      });
      return {
        success: false,
        result: 'ALREADY_USED',
        message: 'تم استخدام هذه الدعوة مسبقاً! يرجى منع الدخول.',
        previousUsedAt: invitation.used_at,
        guestName: invitation.guest_name,
        invitationNumber: invitation.invitation_number,
      };
    }

    // Atomic update
    const { data: updated, error: updateErr } = await client
      .from('invitations')
      .update({ status: 'USED', used_at: now })
      .eq('id', invitation.id)
      .eq('status', 'UNUSED')
      .select()
      .maybeSingle();

    if (updateErr || !updated) {
      // Race condition occurred - another device updated it first!
      return {
        success: false,
        result: 'ALREADY_USED',
        message: 'تم استخدام هذه الدعوة للتو من جهاز آخر! يرجى منع الدخول.',
        guestName: invitation.guest_name,
        invitationNumber: invitation.invitation_number,
      };
    }

    // Log success
    await client.from('scan_logs').insert({
      invitation_id: invitation.id,
      event_id: eventId,
      result: 'ACCEPTED',
      device_name: devName,
      notes: `دخول مصرح - الدعوة #${invitation.invitation_number}`,
    });

    return {
      success: true,
      result: 'ACCEPTED',
      message: 'تم قبول الدخول بنجاح. أهلاً وسهلاً!',
      guestName: invitation.guest_name,
      invitationNumber: invitation.invitation_number,
      invitation: updated as Invitation,
    };
  }

  // ==================== SCAN LOGS ====================
  static async getScanLogs(eventId: number, limit: number = 100): Promise<ScanLog[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('scan_logs')
      .select(`
        *,
        invitations (
          guest_name,
          graduate_name,
          invitation_number
        )
      `)
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      invitation_id: row.invitation_id,
      event_id: row.event_id,
      scanned_at: row.scanned_at,
      result: row.result,
      device_name: row.device_name,
      notes: row.notes,
      guest_name: row.invitations?.guest_name || null,
      graduate_name: row.invitations?.graduate_name || null,
      invitation_number: row.invitations?.invitation_number || null,
    }));
  }

  // ==================== SYNC LOCAL TO CLOUD ====================
  static async syncLocalToCloud(): Promise<{ success: boolean; eventsSynced: number; invitationsSynced: number; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, eventsSynced: 0, invitationsSynced: 0, error: 'السيرفر السحابي غير متصل' };

    try {
      // 1. Get all local events
      const localEvents = EventRepository.getAll();
      let eventsSynced = 0;
      let invitationsSynced = 0;

      for (const ev of localEvents) {
        // Upsert event
        const { data: upsertedEvent, error: evErr } = await client
          .from('events')
          .upsert({
            id: ev.id,
            name: ev.name,
            date: ev.date,
            time: ev.time || null,
            venue: ev.venue || null,
            eventType: ev.eventType || 'wedding',
            capacity: ev.capacity,
            status: ev.status,
            created_at: ev.created_at,
            updated_at: ev.updated_at,
          })
          .select()
          .single();

        if (evErr) throw evErr;
        eventsSynced++;

        // 2. Get invitations for this event
        const localInvs = InvitationRepository.getByEventId(ev.id);
        if (localInvs.length > 0) {
          const invBatch = localInvs.map((inv) => ({
            id: inv.id,
            event_id: inv.event_id,
            invitation_number: inv.invitation_number,
            token: inv.token,
            guest_name: inv.guest_name,
            graduate_name: inv.graduate_name,
            has_name: inv.has_name,
            status: inv.status,
            created_at: inv.created_at,
            used_at: inv.used_at,
          }));

          const batchSize = 100;
          for (let i = 0; i < invBatch.length; i += batchSize) {
            const chunk = invBatch.slice(i, i + batchSize);
            const { error: invErr } = await client.from('invitations').upsert(chunk);
            if (invErr) throw invErr;
            invitationsSynced += chunk.length;
          }
        }
      }

      return { success: true, eventsSynced, invitationsSynced };
    } catch (err: any) {
      return { success: false, eventsSynced: 0, invitationsSynced: 0, error: err.message };
    }
  }
}
