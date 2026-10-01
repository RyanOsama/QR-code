import { getDatabase } from '../connection';
import { Company, AppUser } from '../../types';
import { PasswordService } from '../../services/passwordService';
import { SubscriptionRepository } from './subscriptionRepository';
import { LicenseServerService } from '../../services/licenseServerService';

export class CompanyRepository {
  static getAll(): Company[] {
    const db = getDatabase();
    SubscriptionRepository.checkAndExpireOverdueSubscriptions();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        u.full_name as owner_name,
        u.username as owner_username,
        u.temp_password as temp_password,
        u.must_change_password as must_change_password,
        (SELECT COUNT(*) FROM app_users WHERE company_id = c.id AND role = 'EMPLOYEE') as employees_count,
        (SELECT COUNT(*) FROM events WHERE company_id = c.id) as events_count,
        s.id as sub_id,
        s.plan_name as sub_plan,
        s.billing_cycle as sub_cycle,
        s.status as sub_status,
        s.start_date as sub_start,
        s.renewal_date as sub_renewal,
        s.expiration_date as sub_expiration,
        s.payment_status as sub_payment
      FROM companies c
      LEFT JOIN app_users u ON u.company_id = c.id AND u.role = 'COMPANY_OWNER'
      LEFT JOIN tenant_subscriptions s ON s.company_id = c.id
      ORDER BY c.created_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      logo_url: r.logo_url,
      status: r.status,
      created_at: r.created_at,
      owner_name: r.owner_name,
      owner_username: r.owner_username,
      temp_password: r.temp_password,
      must_change_password: Boolean(r.must_change_password),
      employees_count: r.employees_count,
      events_count: r.events_count,
      subscription: r.sub_id ? {
        id: r.sub_id,
        company_id: r.id,
        plan_name: r.sub_plan || 'Professional',
        billing_cycle: r.sub_cycle || 'yearly',
        status: r.sub_status || 'active',
        start_date: r.sub_start,
        renewal_date: r.sub_renewal,
        expiration_date: r.sub_expiration,
        payment_status: r.sub_payment || 'paid',
        created_at: r.created_at,
        updated_at: r.created_at,
      } : null,
    }));
  }

  static getById(id: number): Company | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        u.full_name as owner_name,
        u.username as owner_username,
        u.temp_password as temp_password,
        u.must_change_password as must_change_password,
        s.id as sub_id,
        s.plan_name as sub_plan,
        s.billing_cycle as sub_cycle,
        s.status as sub_status,
        s.start_date as sub_start,
        s.renewal_date as sub_renewal,
        s.expiration_date as sub_expiration,
        s.payment_status as sub_payment
      FROM companies c
      LEFT JOIN app_users u ON u.company_id = c.id AND u.role = 'COMPANY_OWNER'
      LEFT JOIN tenant_subscriptions s ON s.company_id = c.id
      WHERE c.id = ?
    `);
    const r = stmt.get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      logo_url: r.logo_url,
      status: r.status,
      created_at: r.created_at,
      owner_name: r.owner_name,
      owner_username: r.owner_username,
      temp_password: r.temp_password,
      must_change_password: Boolean(r.must_change_password),
      subscription: r.sub_id ? {
        id: r.sub_id,
        company_id: r.id,
        plan_name: r.sub_plan || 'Professional',
        billing_cycle: r.sub_cycle || 'yearly',
        status: r.sub_status || 'active',
        start_date: r.sub_start,
        renewal_date: r.sub_renewal,
        expiration_date: r.sub_expiration,
        payment_status: r.sub_payment || 'paid',
        created_at: r.created_at,
        updated_at: r.created_at,
      } : null,
    };
  }

  static create(data: {
    name: string;
    logo_url?: string;
    owner_name: string;
    owner_username: string;
    billing_cycle?: 'monthly' | 'yearly';
    start_date?: string;
    expiration_date?: string;
  }): { success: boolean; company?: Company; ownerUser?: AppUser; tempPassword?: string; error?: string } {
    const db = getDatabase();
    const cleanUsername = data.owner_username.trim();
    const cleanName = data.name.trim();
    const cleanOwnerName = data.owner_name.trim();
    const billingCycle = data.billing_cycle || 'yearly';

    // Check if username already exists
    const existing = db.prepare(`SELECT id FROM app_users WHERE LOWER(username) = LOWER(?)`).get(cleanUsername);
    if (existing) {
      return { success: false, error: 'اسم المستخدم لصاحب الشركة مستخدم مسبقاً' };
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

    const result = db.transaction(() => {
      // 1. Insert company
      const compInsert = db.prepare(`
        INSERT INTO companies (name, logo_url, status, created_at)
        VALUES (?, ?, 'ACTIVE', ?)
      `).run(cleanName, data.logo_url || null, nowIso);

      const companyId = Number(compInsert.lastInsertRowid);

      // 2. Insert owner user
      const userInsert = db.prepare(`
        INSERT INTO app_users (company_id, username, password_hash, temp_password, full_name, role, must_change_password, created_at)
        VALUES (?, ?, ?, ?, ?, 'COMPANY_OWNER', 1, ?)
      `).run(companyId, cleanUsername, passwordHash, tempPassword, cleanOwnerName, nowIso);

      const userId = Number(userInsert.lastInsertRowid);

      // 3. Insert subscription
      db.prepare(`
        INSERT INTO tenant_subscriptions (
          company_id, plan_name, billing_cycle, status, start_date, renewal_date, expiration_date, payment_status, created_at, updated_at
        )
        VALUES (?, 'Professional', ?, 'active', ?, ?, ?, 'paid', ?, ?)
      `).run(companyId, billingCycle, startIso, expiryIso, expiryIso, nowIso, nowIso);

      const sub = SubscriptionRepository.getByCompanyId(companyId);

      const company: Company = {
        id: companyId,
        name: cleanName,
        logo_url: data.logo_url || null,
        status: 'ACTIVE',
        created_at: nowIso,
        owner_name: cleanOwnerName,
        owner_username: cleanUsername,
        temp_password: tempPassword,
        must_change_password: true,
        subscription: sub,
      };

      const ownerUser: AppUser = {
        id: userId,
        company_id: companyId,
        username: cleanUsername,
        full_name: cleanOwnerName,
        role: 'COMPANY_OWNER',
        must_change_password: true,
        temp_password: tempPassword,
        created_at: nowIso,
        company_name: cleanName,
        company_logo: data.logo_url || null,
        company_subscription: sub,
      };

      return { company, ownerUser, tempPassword };
    })();

    // Record audit logs
    LicenseServerService.recordAuditLog({
      companyName: cleanName,
      action: 'COMPANY_CREATED',
      details: `تم إنشاء شركة جديدة بنجاح مع حساب مالك (${cleanUsername}) وخطة اشتراك (${billingCycle})`,
      actor: 'SUPER_ADMIN',
    });

    LicenseServerService.recordAuditLog({
      companyName: cleanName,
      action: 'SUBSCRIPTION_CREATED',
      details: `تم إنشاء اشتراك جديد للباقة Professional بدورة فوترة ${billingCycle}`,
      actor: 'SUPER_ADMIN',
    });

    return {
      success: true,
      company: result.company,
      ownerUser: result.ownerUser,
      tempPassword: result.tempPassword,
    };
  }

  static update(id: number, data: Partial<Company>): { success: boolean; error?: string } {
    const db = getDatabase();
    const existing = this.getById(id);
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name.trim());
    }
    if (data.logo_url !== undefined) {
      fields.push('logo_url = ?');
      values.push(data.logo_url);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return { success: true };

    values.push(id);
    db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // Audit status changes
    if (existing && data.status && data.status !== existing.status) {
      const compName = existing.name;
      if (data.status === 'SUSPENDED') {
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action: 'COMPANY_SUSPENDED',
          details: `تم إيقاف/تعليق شركة "${compName}"`,
          actor: 'SUPER_ADMIN',
        });
      } else if (data.status === 'ACTIVE') {
        const action = existing.status === 'SUSPENDED' ? 'COMPANY_REACTIVATED' : 'COMPANY_ACTIVATED';
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action,
          details: `تم تفعيل شركة "${compName}"`,
          actor: 'SUPER_ADMIN',
        });
      }
    }

    return { success: true };
  }

  static delete(id: number): { success: boolean; error?: string } {
    const db = getDatabase();
    db.prepare(`DELETE FROM companies WHERE id = ?`).run(id);
    return { success: true };
  }

  static resetOwnerPassword(companyId: number): { success: boolean; tempPassword?: string; error?: string } {
    const db = getDatabase();
    const owner = db.prepare(`SELECT id FROM app_users WHERE company_id = ? AND role = 'COMPANY_OWNER'`).get(companyId) as { id: number } | undefined;
    if (!owner) {
      return { success: false, error: 'لم يتم العثور على حساب المالك لهذه الشركة' };
    }

    const newTemp = PasswordService.generateTempPassword();
    const newHash = PasswordService.hash(newTemp);

    db.prepare(`
      UPDATE app_users 
      SET password_hash = ?, temp_password = ?, must_change_password = 1 
      WHERE id = ?
    `).run(newHash, newTemp, owner.id);

    return { success: true, tempPassword: newTemp };
  }
}
