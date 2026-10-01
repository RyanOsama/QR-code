import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dns from 'dns';

// Force Node.js/Electron to prioritize IPv4 over IPv6 on Windows to prevent Cloudflare/Supabase ConnectTimeoutError
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (_) {}

import { CloudConfig, Event, Invitation, ScanLog, CheckInResult, EventStats, Company, AppUser, TenantSubscription, BillingCycle } from '../types';
import { generateSecureToken } from './tokenService';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { PasswordService } from './passwordService';

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
  private static isCloudReachable: boolean = true;
  private static lastFailureTime: number = 0;

  static markCloudUnreachable(err?: any): void {
    SupabaseService.isCloudReachable = false;
    SupabaseService.lastFailureTime = Date.now();
  }

  static markCloudHealthy(): void {
    SupabaseService.isCloudReachable = true;
    SupabaseService.lastFailureTime = 0;
  }

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

    // Reset client instance and mark healthy
    supabaseClient = null;
    SupabaseService.markCloudHealthy();

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
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, message: 'رابط المشروع (Project URL) غير صالح. يجب أن يبدأ بـ https://', latencyMs: 0 };
    }

    if (cleanKey.startsWith('sb_publishable_')) {
      return {
        success: false,
        message: 'تنبيه: هذا المفتاح (sb_publishable_...) ليس مفتاح anon العام لقاعدة البيانات. يرجى نسخ مفتاح `anon` `public` الذي يبدأ بـ (eyJhbGciOi...) من لوحة تحكم Supabase > Settings > API.',
        latencyMs: 0,
      };
    }

    try {
      const tempClient = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false },
      });

      // Simple fast health check query
      const { data, error } = await tempClient.from('events').select('id').limit(1);
      const latencyMs = Date.now() - startTime;

      if (error) {
        if (error.code === '42P01') {
          return {
            success: true,
            message: 'تم الاتصال بسوبابيس بنجاح! ولكن الجداول غير منشأة بعد، يرجى تنفيذ ملف schema.sql',
            latencyMs,
          };
        }
        if (error.message?.includes('API key') || error.message?.includes('JWT') || error.code === 'PGRST301') {
          return {
            success: false,
            message: `مفتاح API غير صالح (${error.message}). انسخ مفتاح anon public (يبدأ بـ eyJ...) من Settings > API`,
            latencyMs,
          };
        }
        return {
          success: false,
          message: `خطأ في الوصول للبيانات: ${error.message}`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح!',
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `تعذر الاتصال: ${err.message || 'خطأ غير معروف'}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ==================== EVENTS ====================
  static async getEvents(companyId?: number | null): Promise<Event[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    let query = client.from('events').select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Event[];
  }

  static async getActiveEvent(companyId?: number | null): Promise<Event | null> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    let query = client.from('events').select('*').eq('status', 'ACTIVE');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();

    if (error) throw error;
    if (data) return data as Event;

    // Fallback to most recent
    let qRecent = client.from('events').select('*');
    if (companyId) {
      qRecent = qRecent.eq('company_id', companyId);
    }
    const { data: recent, error: err2 } = await qRecent.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (err2) throw err2;
    return recent ? (recent as Event) : null;
  }

  static async createEvent(data: { name: string; date: string; time?: string; venue?: string; eventType?: string; capacity: number; company_id?: number | null }): Promise<Event> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const now = new Date().toISOString();

    // Archive existing active events for this company (or globally)
    let archiveQuery = client.from('events').update({ status: 'ARCHIVED' }).eq('status', 'ACTIVE');
    if (data.company_id) {
      archiveQuery = archiveQuery.eq('company_id', data.company_id);
    }
    await archiveQuery;

    const { data: created, error } = await client
      .from('events')
      .insert({
        company_id: data.company_id || null,
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
      .select(`
        *,
        scan_logs (
          scanned_at,
          result,
          device_name,
          scanned_by_name
        )
      `)
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

    return (data || []).map((row: any) => {
      const logs = (row.scan_logs || []) as any[];
      const acceptedLog = logs.find((l: any) => l.result === 'ACCEPTED') || (logs.length > 0 ? logs[logs.length - 1] : null);
      return {
        id: row.id,
        event_id: row.event_id,
        invitation_number: row.invitation_number,
        token: row.token,
        guest_name: row.guest_name,
        graduate_name: row.graduate_name,
        has_name: row.has_name,
        status: row.status,
        created_at: row.created_at,
        used_at: row.used_at,
        scan_count: logs.length,
        scanned_by_name: acceptedLog?.scanned_by_name || null,
        scanned_device_name: acceptedLog?.device_name || null,
      };
    }) as Invitation[];
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

  static async resetUsedInvitations(eventId: number): Promise<{ success: boolean; resetCount: number; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    try {
      // 1. Get count of used invitations
      const { count } = await client
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'USED');

      // 2. Update status and used_at
      const { error: updateErr } = await client
        .from('invitations')
        .update({ status: 'UNUSED', used_at: null })
        .eq('event_id', eventId)
        .eq('status', 'USED');

      if (updateErr) throw updateErr;

      // 3. Clear scan logs
      await client.from('scan_logs').delete().eq('event_id', eventId);

      return { success: true, resetCount: count || 0 };
    } catch (err: any) {
      return { success: false, resetCount: 0, error: err.message };
    }
  }

  static async resetSingleInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    try {
      const { error } = await client
        .from('invitations')
        .update({ status: 'UNUSED', used_at: null })
        .eq('id', invitationId);

      if (error) throw error;

      await client.from('scan_logs').delete().eq('invitation_id', invitationId);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ==================== EXPAND CAPACITY & ADD INVITATIONS ====================
  static async addInvitationsToEvent(
    eventId: number,
    additionalCount: number,
    guestNames?: string[]
  ): Promise<{ success: boolean; addedCount: number; newCapacity: number; error?: string }> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    try {
      // 1. Get current event
      const { data: event, error: evErr } = await client.from('events').select('*').eq('id', eventId).single();
      if (evErr || !event) throw new Error('المناسبة غير موجودة');

      const newCapacity = (event.capacity || 0) + additionalCount;

      // 2. Get highest invitation number
      const { data: maxRow } = await client
        .from('invitations')
        .select('invitation_number')
        .eq('event_id', eventId)
        .order('invitation_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNumber = (maxRow?.invitation_number || 0) + 1;
      const now = new Date().toISOString();
      const records: any[] = [];

      for (let i = 0; i < additionalCount; i++) {
        const guestName = guestNames && guestNames[i] && guestNames[i].trim() ? guestNames[i].trim() : null;
        records.push({
          event_id: eventId,
          invitation_number: nextNumber,
          token: generateSecureToken('INV'),
          guest_name: guestName,
          has_name: guestName ? 1 : 0,
          status: 'UNUSED',
          created_at: now,
        });
        nextNumber++;
      }

      // 3. Update event capacity
      await client.from('events').update({ capacity: newCapacity, updated_at: now }).eq('id', eventId);

      // 4. Batch insert new invitations
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const chunk = records.slice(i, i + batchSize);
        const { error: insErr } = await client.from('invitations').insert(chunk);
        if (insErr) throw insErr;
      }

      return { success: true, addedCount: additionalCount, newCapacity };
    } catch (err: any) {
      return { success: false, addedCount: 0, newCapacity: 0, error: err.message || 'فشل في إضافة الدعوات' };
    }
  }

  // ==================== ATOMIC CHECK-IN ====================
  static async checkIn(token: string, eventId: number, deviceName?: string, scannedBy?: string): Promise<CheckInResult> {
    const client = this.getClient();
    if (!client) {
      return { success: false, result: 'INVALID', message: 'السيرفر السحابي غير متصل' };
    }

    const cleanToken = token.trim();
    const devName = deviceName || this.getConfig().deviceName || 'جهاز الدخول';
    const scannerName = scannedBy || 'الموظف المسؤول';

    // 1. Try atomic procedure in Supabase
    try {
      const { data, error } = await client.rpc('check_in_atomic', {
        p_token: cleanToken,
        p_event_id: eventId,
        p_device_name: devName,
        p_scanned_by: scannerName,
      });

      if (!error && data) {
        return {
          success: data.success,
          result: data.result,
          message: data.message,
          guestName: data.guestName,
          invitationNumber: data.invitationNumber,
          previousUsedAt: data.previousUsedAt,
          scannedBy: data.scannedBy,
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
  static async syncLocalToCloud(): Promise<{ success: boolean; companiesSynced?: number; usersSynced?: number; eventsSynced: number; invitationsSynced: number; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, eventsSynced: 0, invitationsSynced: 0, error: 'السيرفر السحابي غير متصل' };

    try {
      const { getDatabase } = require('../database/connection');
      const db = getDatabase();
      let companiesSynced = 0;
      let usersSynced = 0;
      let eventsSynced = 0;
      let invitationsSynced = 0;

      // 1. Sync Companies
      try {
        const localCompanies = db.prepare(`SELECT * FROM companies`).all() as any[];
        for (const comp of localCompanies) {
          const { error: compErr } = await client.from('companies').upsert({
            id: comp.id,
            name: comp.name,
            logo_url: comp.logo_url || null,
            status: comp.status || 'ACTIVE',
            created_at: comp.created_at,
            updated_at: comp.updated_at,
          });
          if (!compErr) companiesSynced++;
        }
      } catch (cErr) {
        console.warn('Companies sync non-fatal err:', cErr);
      }

      // 2. Sync App Users
      try {
        const localUsers = db.prepare(`SELECT * FROM app_users`).all() as any[];
        for (const u of localUsers) {
          const { error: uErr } = await client.from('app_users').upsert({
            id: u.id,
            company_id: u.company_id || null,
            username: u.username,
            password_hash: u.password_hash,
            temp_password: u.temp_password || null,
            full_name: u.full_name,
            role: u.role,
            must_change_password: Boolean(u.must_change_password),
            created_at: u.created_at,
          });
          if (!uErr) usersSynced++;
        }
      } catch (uErr) {
        console.warn('Users sync non-fatal err:', uErr);
      }

      // 3. Get all local events
      const localEvents = EventRepository.getAll();
      for (const ev of localEvents) {
        // Upsert event
        const { data: upsertedEvent, error: evErr } = await client
          .from('events')
          .upsert({
            id: ev.id,
            company_id: (ev as any).company_id || null,
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

        // 4. Get invitations for this event
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

      return { success: true, companiesSynced, usersSynced, eventsSynced, invitationsSynced };
    } catch (err: any) {
      return { success: false, eventsSynced: 0, invitationsSynced: 0, error: err.message };
    }
  }

  // ==================== AUTH & USERS ====================
  static async login(username: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    try {
      // 1. Try login RPC function
      const { data, error } = await client.rpc('login_app_user', {
        p_username: username.trim(),
        p_password: password.trim(),
      });

      if (!error && data) {
        if (!data.success) return { success: false, error: data.error };
        const u = data.user as AppUser;
        // Check if company is suspended
        if (u && u.role !== 'SUPER_ADMIN' && u.company_id) {
          const compStatus = (u as any).company_status || (u as any).comp_status || (u as any).companies?.status;
          if (compStatus === 'SUSPENDED' || compStatus === 'INACTIVE') {
            return { success: false, error: 'يرجى التواصل مع الإدارة' };
          }
        }
        return { success: true, user: u };
      }
    } catch (rpcErr) {
      console.warn('RPC login_app_user fallback to direct query:', rpcErr);
    }

    // 2. Direct query fallback
    const { data: user, error } = await client
      .from('app_users')
      .select('*, companies (name, logo_url, status)')
      .ilike('username', username.trim())
      .maybeSingle();

    if (error) {
      throw new Error(`السيرفر السحابي غير متاح حالياً (${error.message || '503 Service Unavailable'})`);
    }

    if (!user) {
      return { success: false, error: 'اسم المستخدم غير موجود' };
    }

    // If company is suspended, block immediately
    const compStatus = (user as any).companies?.status;
    if (user.role !== 'SUPER_ADMIN' && (compStatus === 'SUSPENDED' || compStatus === 'INACTIVE')) {
      return { success: false, error: 'يرجى التواصل مع الإدارة' };
    }

    const inputHash = PasswordService.hash(password);
    const valid = user.password_hash === inputHash || (user.temp_password && user.temp_password.trim() === password.trim());
    if (!valid) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    // Validate Subscription for SaaS Tenant
    let companySub: TenantSubscription | null = null;
    if (user.role !== 'SUPER_ADMIN' && user.company_id) {
      const { data: subData } = await client
        .from('tenant_subscriptions')
        .select('*')
        .eq('company_id', user.company_id)
        .maybeSingle();

      if (subData) {
        companySub = {
          id: subData.id,
          company_id: subData.company_id,
          plan_name: subData.plan_name || 'Professional',
          billing_cycle: subData.billing_cycle || 'yearly',
          status: subData.status || 'active',
          start_date: subData.start_date,
          renewal_date: subData.renewal_date,
          expiration_date: subData.expiration_date,
          payment_status: subData.payment_status || 'paid',
          created_at: subData.created_at,
          updated_at: subData.updated_at,
        };

        if (companySub.status === 'suspended') {
          return { success: false, error: 'تم تعليق اشتراك المؤسسة. يرجى التواصل مع الإدارة.' };
        }
        if (companySub.status === 'cancelled') {
          return { success: false, error: 'تم إلغاء الاشتراك. يرجى التواصل مع الإدارة لإعادة التفعيل.' };
        }
        if (companySub.status === 'past_due') {
          return { success: false, error: 'اشتراكك يحتاج إلى تجديد (دفعة متأخرة). يرجى التواصل مع الإدارة.' };
        }
        if (companySub.status === 'expired') {
          return { success: false, error: 'انتهت فترة اشتراك المؤسسة. يرجى تجديد الاشتراك للمتابعة.' };
        }

        if (companySub.expiration_date) {
          const exp = new Date(companySub.expiration_date);
          if (exp.getTime() < Date.now()) {
            await client.from('tenant_subscriptions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', companySub.id);
            return { success: false, error: 'انتهت فترة اشتراك المؤسسة. يرجى تجديد الاشتراك للمتابعة.' };
          }
        }
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        company_id: user.company_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        must_change_password: Boolean(user.must_change_password),
        temp_password: user.temp_password,
        created_at: user.created_at,
        company_name: (user as any).companies?.name || null,
        company_logo: (user as any).companies?.logo_url || null,
        company_subscription: companySub,
      },
    };
  }

  static async changePassword(userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    if (newPassword.trim().length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' };
    }

    try {
      const { data, error } = await client.rpc('change_app_user_password', {
        p_user_id: userId,
        p_new_password: newPassword.trim(),
      });
      if (!error && data) {
        if (!data.success) return { success: false, error: data.error };
        return { success: true };
      }
    } catch (_) {}

    const newHash = PasswordService.hash(newPassword);
    const { error: updErr } = await client
      .from('app_users')
      .update({
        password_hash: newHash,
        temp_password: null,
        must_change_password: false,
      })
      .eq('id', userId);

    if (updErr) return { success: false, error: updErr.message };
    return { success: true };
  }

  // ==================== COMPANIES (SUPER ADMIN) ====================
  static async getCompanies(): Promise<Company[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data: companies, error } = await client
      .from('companies')
      .select('*, app_users (id, full_name, username, temp_password, must_change_password, role), tenant_subscriptions (*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (companies || []).map((c: any) => {
      const owner = (c.app_users || []).find((u: any) => u.role === 'COMPANY_OWNER');
      const sub = Array.isArray(c.tenant_subscriptions) ? c.tenant_subscriptions[0] : c.tenant_subscriptions;
      return {
        id: c.id,
        name: c.name,
        logo_url: c.logo_url,
        status: c.status,
        created_at: c.created_at,
        owner_name: owner?.full_name || null,
        owner_username: owner?.username || null,
        temp_password: owner?.temp_password || null,
        must_change_password: owner ? Boolean(owner.must_change_password) : false,
        subscription: sub ? {
          id: sub.id,
          company_id: c.id,
          plan_name: sub.plan_name || 'Professional',
          billing_cycle: sub.billing_cycle || 'yearly',
          status: sub.status || 'active',
          start_date: sub.start_date,
          renewal_date: sub.renewal_date,
          expiration_date: sub.expiration_date,
          payment_status: sub.payment_status || 'paid',
          created_at: sub.created_at,
          updated_at: sub.updated_at,
        } : null,
      };
    });
  }

  static async createCompany(data: {
    name: string;
    logo_url?: string;
    owner_name: string;
    owner_username: string;
    billing_cycle?: BillingCycle;
    start_date?: string;
    expiration_date?: string;
  }): Promise<{ success: boolean; company?: Company; ownerUser?: AppUser; tempPassword?: string; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const cleanUsername = data.owner_username.trim();
    const cleanName = data.name.trim();
    const cleanOwnerName = data.owner_name.trim();
    const billingCycle = data.billing_cycle || 'yearly';

    // Check if username exists
    const { data: existing } = await client.from('app_users').select('id').ilike('username', cleanUsername).maybeSingle();
    if (existing) {
      return { success: false, error: 'اسم المستخدم لصاحب الشركة موجود مسبقاً' };
    }

    const tempPassword = PasswordService.generateTempPassword();
    const passwordHash = PasswordService.hash(tempPassword);
    const now = new Date();
    const startIso = data.start_date || now.toISOString();

    let expiryIso = data.expiration_date;
    if (!expiryIso) {
      const expiry = new Date(startIso);
      if (billingCycle === 'monthly') {
        expiry.setMonth(expiry.getMonth() + 1);
      } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
      }
      expiryIso = expiry.toISOString();
    }
    const nowIso = now.toISOString();

    // 1. Insert company
    const { data: comp, error: compErr } = await client
      .from('companies')
      .insert({ name: cleanName, logo_url: data.logo_url || null, status: 'ACTIVE', created_at: nowIso })
      .select()
      .single();

    if (compErr || !comp) return { success: false, error: compErr?.message || 'فشل في إنشاء الشركة' };

    // 2. Insert owner
    const { data: user, error: userErr } = await client
      .from('app_users')
      .insert({
        company_id: comp.id,
        username: cleanUsername,
        password_hash: passwordHash,
        temp_password: tempPassword,
        full_name: cleanOwnerName,
        role: 'COMPANY_OWNER',
        must_change_password: true,
        created_at: nowIso,
      })
      .select()
      .single();

    if (userErr || !user) return { success: false, error: userErr?.message || 'فشل في إنشاء حساب المالك' };

    // 3. Insert subscription
    let subObj: TenantSubscription = {
      id: 0,
      company_id: comp.id,
      plan_name: 'Professional',
      billing_cycle: billingCycle,
      status: 'active',
      start_date: startIso,
      renewal_date: expiryIso,
      expiration_date: expiryIso,
      payment_status: 'paid',
      created_at: nowIso,
      updated_at: nowIso,
    };

    try {
      const { data: createdSub } = await client.from('tenant_subscriptions').insert({
        company_id: comp.id,
        plan_name: 'Professional',
        billing_cycle: billingCycle,
        status: 'active',
        start_date: startIso,
        renewal_date: expiryIso,
        expiration_date: expiryIso,
        payment_status: 'paid',
        created_at: nowIso,
        updated_at: nowIso,
      }).select().single();
      if (createdSub) {
        subObj = {
          ...subObj,
          id: createdSub.id,
        };
      }
    } catch (_) {}

    const company: Company = {
      id: comp.id,
      name: comp.name,
      logo_url: comp.logo_url,
      status: comp.status,
      created_at: comp.created_at,
      owner_name: cleanOwnerName,
      owner_username: cleanUsername,
      temp_password: tempPassword,
      must_change_password: true,
      subscription: subObj,
    };

    const ownerUser: AppUser = {
      id: user.id,
      company_id: comp.id,
      username: cleanUsername,
      full_name: cleanOwnerName,
      role: 'COMPANY_OWNER',
      must_change_password: true,
      temp_password: tempPassword,
      created_at: nowIso,
      company_name: comp.name,
      company_logo: comp.logo_url,
      company_subscription: subObj,
    };

    return { success: true, company, ownerUser, tempPassword };
  }

  // ==================== TENANT SUBSCRIPTIONS (SUPER ADMIN) ====================
  static async getTenantSubscriptions(): Promise<TenantSubscription[]> {
    const client = this.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('tenant_subscriptions')
      .select('*, companies (name)')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s: any) => ({
      id: s.id,
      company_id: s.company_id,
      plan_name: s.plan_name || 'Professional',
      billing_cycle: s.billing_cycle || 'monthly',
      status: s.status || 'active',
      start_date: s.start_date,
      renewal_date: s.renewal_date,
      expiration_date: s.expiration_date,
      payment_status: s.payment_status || 'paid',
      created_at: s.created_at,
      updated_at: s.updated_at,
      company_name: s.companies?.name || 'شركة',
    }));
  }

  static async getCompanySubscription(companyId: number): Promise<TenantSubscription | null> {
    const client = this.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('tenant_subscriptions')
      .select('*, companies (name)')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      company_id: data.company_id,
      plan_name: data.plan_name || 'Professional',
      billing_cycle: data.billing_cycle || 'yearly',
      status: data.status || 'active',
      start_date: data.start_date,
      renewal_date: data.renewal_date,
      expiration_date: data.expiration_date,
      payment_status: data.payment_status || 'paid',
      created_at: data.created_at,
      updated_at: data.updated_at,
      company_name: data.companies?.name,
    };
  }

  static async updateTenantSubscription(companyId: number, data: Partial<TenantSubscription>): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const updatePayload: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    delete updatePayload.id;
    delete updatePayload.company_name;

    const { error } = await client
      .from('tenant_subscriptions')
      .update(updatePayload)
      .eq('company_id', companyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async renewTenantSubscription(
    companyId: number,
    durationMonths: number,
    billingCycle?: BillingCycle
  ): Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const { data: current } = await client
      .from('tenant_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    const now = new Date();
    let baseDate = now;
    if (current && current.status === 'active' && current.expiration_date) {
      const currentExp = new Date(current.expiration_date);
      if (currentExp > now) {
        baseDate = currentExp;
      }
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    const cycle = billingCycle || (durationMonths >= 12 ? 'yearly' : 'monthly');
    const nowIso = now.toISOString();
    const expiryIso = newExpiry.toISOString();

    const { data: updated, error } = await client
      .from('tenant_subscriptions')
      .upsert({
        company_id: companyId,
        plan_name: 'Professional',
        billing_cycle: cycle,
        status: 'active',
        start_date: current?.start_date || nowIso,
        renewal_date: expiryIso,
        expiration_date: expiryIso,
        payment_status: 'paid',
        updated_at: nowIso,
      })
      .select('*, companies (name)')
      .single();

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      subscription: {
        id: updated.id,
        company_id: updated.company_id,
        plan_name: updated.plan_name,
        billing_cycle: updated.billing_cycle,
        status: updated.status,
        start_date: updated.start_date,
        renewal_date: updated.renewal_date,
        expiration_date: updated.expiration_date,
        payment_status: updated.payment_status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        company_name: updated.companies?.name,
      },
    };
  }

  static async extendTenantSubscription(
    companyId: number,
    durationMonths: number
  ): Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const { data: current } = await client
      .from('tenant_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    const now = new Date();
    let baseDate = now;
    if (current && current.expiration_date) {
      const currentExp = new Date(current.expiration_date);
      if (currentExp > now) {
        baseDate = currentExp;
      }
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    const nowIso = now.toISOString();
    const expiryIso = newExpiry.toISOString();

    const { data: updated, error } = await client
      .from('tenant_subscriptions')
      .update({
        status: 'active',
        renewal_date: expiryIso,
        expiration_date: expiryIso,
        updated_at: nowIso,
      })
      .eq('company_id', companyId)
      .select('*, companies (name)')
      .single();

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      subscription: {
        id: updated.id,
        company_id: updated.company_id,
        plan_name: updated.plan_name,
        billing_cycle: updated.billing_cycle,
        status: updated.status,
        start_date: updated.start_date,
        renewal_date: updated.renewal_date,
        expiration_date: updated.expiration_date,
        payment_status: updated.payment_status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        company_name: updated.companies?.name,
      },
    };
  }

  static async updateCompany(id: number, data: Partial<Company>): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const { error } = await client.from('companies').update(data).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async deleteCompany(id: number): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const { error } = await client.from('companies').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async resetCompanyOwnerPassword(companyId: number): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const newTemp = PasswordService.generateTempPassword();
    const newHash = PasswordService.hash(newTemp);

    const { error } = await client
      .from('app_users')
      .update({ password_hash: newHash, temp_password: newTemp, must_change_password: true })
      .eq('company_id', companyId)
      .eq('role', 'COMPANY_OWNER');

    if (error) return { success: false, error: error.message };
    return { success: true, tempPassword: newTemp };
  }

  // ==================== EMPLOYEES (COMPANY OWNER) ====================
  static async getEmployees(companyId: number): Promise<AppUser[]> {
    const client = this.getClient();
    if (!client) throw new Error('السيرفر السحابي غير متصل');

    const { data, error } = await client
      .from('app_users')
      .select('*, companies (name, logo_url)')
      .eq('company_id', companyId)
      .eq('role', 'EMPLOYEE')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((u: any) => ({
      id: u.id,
      company_id: u.company_id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      must_change_password: Boolean(u.must_change_password),
      temp_password: u.temp_password,
      created_at: u.created_at,
      company_name: u.companies?.name || null,
      company_logo: u.companies?.logo_url || null,
    }));
  }

  static async createEmployee(
    companyId: number,
    data: { full_name: string; username: string }
  ): Promise<{ success: boolean; user?: AppUser; tempPassword?: string; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const cleanUsername = data.username.trim();
    const cleanName = data.full_name.trim();

    const { data: existing } = await client.from('app_users').select('id').ilike('username', cleanUsername).maybeSingle();
    if (existing) {
      return { success: false, error: 'اسم المستخدم موجود بالفعل، يرجى اختيار اسم مستخدم آخر' };
    }

    const tempPassword = PasswordService.generateTempPassword();
    const passwordHash = PasswordService.hash(tempPassword);
    const now = new Date().toISOString();

    const { data: user, error } = await client
      .from('app_users')
      .insert({
        company_id: companyId,
        username: cleanUsername,
        password_hash: passwordHash,
        temp_password: tempPassword,
        full_name: cleanName,
        role: 'EMPLOYEE',
        must_change_password: true,
        created_at: now,
      })
      .select()
      .single();

    if (error || !user) return { success: false, error: error?.message || 'فشل في إضافة الموظف' };

    return {
      success: true,
      user: {
        id: user.id,
        company_id: user.company_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        must_change_password: true,
        temp_password: tempPassword,
        created_at: now,
      },
      tempPassword,
    };
  }

  static async deleteEmployee(userId: number): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const { error } = await client.from('app_users').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  static async resetEmployeePassword(userId: number): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'السيرفر السحابي غير متصل' };

    const newTemp = PasswordService.generateTempPassword();
    const newHash = PasswordService.hash(newTemp);

    const { error } = await client
      .from('app_users')
      .update({ password_hash: newHash, temp_password: newTemp, must_change_password: true })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true, tempPassword: newTemp };
  }
}
