import { EnvService } from './envService';
import { SupabaseService } from './supabaseService';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { CardTemplateRepository } from '../database/repositories/cardTemplateRepository';
import { CheckInService } from './checkInService';
import { 
  AppUser, 
  Event, 
  Invitation, 
  ScanLog, 
  CheckInResult, 
  EventStats, 
  Company, 
  TenantSubscription, 
  BillingCycle, 
  CardTemplateItem 
} from '../types';

export type ActiveDbSource = 'cloud' | 'local';

export class DatabaseDriver {
  private static activeSource: ActiveDbSource = 'cloud';
  private static initialized: boolean = false;

  /**
   * Initializes and detects which database link is active on startup.
   */
  static async init(): Promise<{ activeSource: ActiveDbSource; statusMessage: string }> {
    const env = EnvService.getEnv();

    if (env.databaseMode === 'local' || !env.supabaseUrl || !env.supabaseAnonKey) {
      this.activeSource = 'local';
      this.initialized = true;
      console.log('📦 [DatabaseDriver] Active Database Source: LOCAL (SQLite)');
      return {
        activeSource: 'local',
        statusMessage: 'العمل على قاعدة البيانات المحلية (SQLite)',
      };
    }

    // Check Cloud reachability
    try {
      const test = await SupabaseService.testConnection(env.supabaseUrl, env.supabaseAnonKey);
      if (test.success) {
        this.activeSource = 'cloud';
        this.initialized = true;
        console.log(`☁️ [DatabaseDriver] Active Database Source: CLOUD (Supabase: ${env.supabaseUrl})`);
        return {
          activeSource: 'cloud',
          statusMessage: `متصل بالاستضافة السحابية (${env.supabaseUrl})`,
        };
      } else {
        console.warn(`⚠️ [DatabaseDriver] Cloud connection failed: ${test.message}. Operating in CLOUD mode.`);
        this.activeSource = 'cloud';
        this.initialized = true;
        return {
          activeSource: 'cloud',
          statusMessage: test.message,
        };
      }
    } catch (err: any) {
      this.activeSource = 'cloud';
      this.initialized = true;
      return {
        activeSource: 'cloud',
        statusMessage: `خطأ الاتصال بالسحابة: ${err.message}`,
      };
    }
  }

  static getActiveSource(): ActiveDbSource {
    if (!this.initialized) {
      const env = EnvService.getEnv();
      this.activeSource = env.databaseMode;
    }
    return this.activeSource;
  }

  static isCloud(): boolean {
    return this.getActiveSource() === 'cloud';
  }

  // =========================================================================
  // AUTH & USERS
  // =========================================================================

  static async login(username: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.login(username, password);
    }
    return UserRepository.login(username, password);
  }

  static async changePassword(userId: number, newPass: string): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.changePassword(userId, newPass);
    }
    return UserRepository.changePassword(userId, newPass);
  }

  static async getUserById(id: number): Promise<AppUser | null> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (!client) return null;
      try {
        const { data } = await client.from('users').select('*').eq('id', id).maybeSingle();
        return (data as AppUser) || null;
      } catch (_) {
        return null;
      }
    }
    return UserRepository.getById(id);
  }

  // =========================================================================
  // COMPANIES
  // =========================================================================

  static async getCompanies(): Promise<Company[]> {
    if (this.isCloud()) {
      return SupabaseService.getCompanies();
    }
    return CompanyRepository.getAll();
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
    if (this.isCloud()) {
      return SupabaseService.createCompany(data);
    }
    return CompanyRepository.create(data);
  }

  static async updateCompany(id: number, data: Partial<Company>): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.updateCompany(id, data);
    }
    return CompanyRepository.update(id, data);
  }

  static async deleteCompany(id: number): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.deleteCompany(id);
    }
    return CompanyRepository.delete(id);
  }

  static async resetCompanyOwnerPassword(companyId: number): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.resetCompanyOwnerPassword(companyId);
    }
    return CompanyRepository.resetOwnerPassword(companyId);
  }

  // =========================================================================
  // EMPLOYEES
  // =========================================================================

  static async getEmployees(companyId: number): Promise<AppUser[]> {
    if (this.isCloud()) {
      return SupabaseService.getEmployees(companyId);
    }
    return UserRepository.getEmployees(companyId);
  }

  static async createEmployee(companyId: number, data: { full_name: string; username: string }): Promise<{ success: boolean; user?: AppUser; tempPassword?: string; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.createEmployee(companyId, data);
    }
    return UserRepository.createEmployee(companyId, data);
  }

  static async deleteEmployee(userId: number): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.deleteEmployee(userId);
    }
    return UserRepository.deleteEmployee(userId);
  }

  static async resetEmployeePassword(userId: number): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.resetEmployeePassword(userId);
    }
    return UserRepository.resetEmployeePassword(userId);
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  static async getEvents(companyId?: number | null): Promise<Event[]> {
    if (this.isCloud()) {
      return SupabaseService.getEvents(companyId);
    }
    return EventRepository.getAll(companyId);
  }

  static async getActiveEvent(companyId?: number | null): Promise<Event | null> {
    if (this.isCloud()) {
      return SupabaseService.getActiveEvent(companyId);
    }
    return EventRepository.getActive(companyId);
  }

  static async getEventById(id: number): Promise<Event | null> {
    if (this.isCloud()) {
      return SupabaseService.getEventById(id);
    }
    return EventRepository.getById(id);
  }

  static async createEvent(data: {
    name: string;
    date: string;
    time?: string;
    venue?: string;
    eventType?: string;
    capacity: number;
    company_id?: number | null;
  }): Promise<Event> {
    if (this.isCloud()) {
      return SupabaseService.createEvent(data);
    }
    return EventRepository.create(data);
  }

  static async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    if (this.isCloud()) {
      return SupabaseService.updateEvent(id, data);
    }
    return EventRepository.update(id, data);
  }

  static async setActiveEvent(id: number): Promise<void> {
    if (this.isCloud()) {
      return SupabaseService.setActiveEvent(id);
    }
    return EventRepository.setActive(id);
  }

  static async deleteEvent(id: number): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.deleteEvent(id);
    }
    EventRepository.delete(id);
    return { success: true };
  }

  static async getEventStats(eventId: number): Promise<EventStats> {
    if (this.isCloud()) {
      return SupabaseService.getEventStats(eventId);
    }
    return EventRepository.getStats(eventId);
  }

  // =========================================================================
  // INVITATIONS
  // =========================================================================

  static async getInvitations(eventId: number, filter?: { search?: string; status?: string }): Promise<Invitation[]> {
    if (this.isCloud()) {
      return SupabaseService.getInvitations(eventId, filter);
    }
    return InvitationRepository.getByEventId(eventId, filter);
  }

  static async getInvitationById(id: number): Promise<Invitation | null> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (!client) return null;
      const { data } = await client.from('invitations').select('*').eq('id', id).maybeSingle();
      return (data as Invitation) || null;
    }
    return InvitationRepository.getById(id);
  }

  static async generateBatch(
    eventId: number,
    count: number,
    guestNames?: string[],
    graduateAllocations?: Array<{ graduateName: string; count: number }>
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.generateBatch(eventId, count, guestNames, graduateAllocations);
    }
    return InvitationRepository.generateBatch(eventId, count, guestNames, graduateAllocations);
  }

  static async addBatch(
    eventId: number,
    additionalCount: number,
    guestNames?: string[]
  ): Promise<{ success: boolean; addedCount: number; newCapacity: number; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.addInvitationsToEvent(eventId, additionalCount, guestNames);
    }
    return InvitationRepository.addBatch(eventId, additionalCount, guestNames);
  }

  static async updateGuestName(invitationId: number, guestName: string): Promise<Invitation> {
    if (this.isCloud()) {
      return SupabaseService.updateGuestName(invitationId, guestName);
    }
    return InvitationRepository.updateGuestName(invitationId, guestName);
  }

  static async deleteInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.deleteInvitation(invitationId);
    }
    return InvitationRepository.delete(invitationId);
  }

  static async regenerateToken(invitationId: number): Promise<{ success: boolean; token?: string; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.regenerateToken(invitationId);
    }
    return InvitationRepository.regenerateToken(invitationId);
  }

  static async resetUsedInvitations(eventId: number): Promise<{ success: boolean; resetCount: number; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.resetUsedInvitations(eventId);
    }
    return InvitationRepository.resetUsedByEvent(eventId);
  }

  static async resetSingleInvitation(invitationId: number): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.resetSingleInvitation(invitationId);
    }
    return InvitationRepository.resetSingleInvitation(invitationId);
  }

  // =========================================================================
  // CHECK-IN & SCAN LOGS
  // =========================================================================

  static async checkIn(token: string, eventId: number, deviceName?: string, scannedBy?: string): Promise<CheckInResult> {
    if (this.isCloud()) {
      return SupabaseService.checkIn(token, eventId, deviceName, scannedBy);
    }
    return CheckInService.verifyAndCheckIn(token, eventId, deviceName, scannedBy);
  }

  static async getScanLogs(eventId: number, limit?: number): Promise<ScanLog[]> {
    if (this.isCloud()) {
      return SupabaseService.getScanLogs(eventId, limit);
    }
    return ScanLogRepository.getByEventId(eventId, limit);
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  static async getTenantSubscriptions(): Promise<TenantSubscription[]> {
    if (this.isCloud()) {
      return SupabaseService.getTenantSubscriptions();
    }
    return SubscriptionRepository.getAll();
  }

  static async getCompanySubscription(companyId?: number): Promise<TenantSubscription | null> {
    const validId = companyId || 1;
    if (this.isCloud()) {
      return SupabaseService.getCompanySubscription(validId);
    }
    return SubscriptionRepository.getByCompanyId(validId);
  }

  static async updateTenantSubscription(companyId: number, data: Partial<TenantSubscription>): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.updateTenantSubscription(companyId, data);
    }
    return SubscriptionRepository.update(companyId, data);
  }

  static async renewTenantSubscription(companyId: number, durationMonths: number, billingCycle?: BillingCycle): Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.renewTenantSubscription(companyId, durationMonths, billingCycle);
    }
    return SubscriptionRepository.renew(companyId, durationMonths, billingCycle);
  }

  static async extendTenantSubscription(companyId: number, durationMonths: number): Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }> {
    if (this.isCloud()) {
      return SupabaseService.extendTenantSubscription(companyId, durationMonths);
    }
    return SubscriptionRepository.extend(companyId, durationMonths);
  }

  // =========================================================================
  // CARD TEMPLATES
  // =========================================================================

  static async getCardTemplates(filter?: { category?: string; companyId?: number | null; onlyActive?: boolean }): Promise<CardTemplateItem[]> {
    if (this.isCloud()) {
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
        } catch (_) {}
      }
    }
    return CardTemplateRepository.getAll(filter);
  }

  static async createCardTemplate(item: Omit<CardTemplateItem, 'created_at' | 'updated_at'>): Promise<{ success: boolean; template?: CardTemplateItem; error?: string }> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (client) {
        try {
          const now = new Date().toISOString();
          const { data, error } = await client.from('card_templates').insert({
            ...item,
            created_at: now,
            updated_at: now,
          }).select().single();
          if (!error && data) return { success: true, template: data as CardTemplateItem };
        } catch (_) {}
      }
    }
    try {
      const tpl = CardTemplateRepository.create(item);
      return { success: true, template: tpl };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async updateCardTemplate(id: string, data: Partial<CardTemplateItem>): Promise<{ success: boolean; template?: CardTemplateItem; error?: string }> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (client) {
        try {
          const { data: updated, error } = await client.from('card_templates').update({
            ...data,
            updated_at: new Date().toISOString(),
          }).eq('id', id).select().single();
          if (!error && updated) return { success: true, template: updated as CardTemplateItem };
        } catch (_) {}
      }
    }
    try {
      const tpl = CardTemplateRepository.update(id, data);
      return { success: true, template: tpl || undefined };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async toggleCardTemplateActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (client) {
        try {
          const { error } = await client.from('card_templates').update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          }).eq('id', id);
          if (!error) return { success: true };
        } catch (_) {}
      }
    }
    try {
      const ok = CardTemplateRepository.toggleActive(id, isActive);
      return { success: ok };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async deleteCardTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    if (this.isCloud()) {
      const client = SupabaseService.getClient();
      if (client) {
        try {
          const { error } = await client.from('card_templates').delete().eq('id', id);
          if (!error) return { success: true };
        } catch (_) {}
      }
    }
    try {
      const ok = CardTemplateRepository.delete(id);
      return { success: ok };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
