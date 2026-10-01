import { getDatabase } from '../connection';
import { TenantSubscription, BillingCycle, SubscriptionStatus } from '../../types';
import { LicenseServerService } from '../../services/licenseServerService';

export class SubscriptionRepository {
  static getAll(): TenantSubscription[] {
    const db = getDatabase();
    this.checkAndExpireOverdueSubscriptions();
    const stmt = db.prepare(`
      SELECT 
        s.*,
        c.name as company_name
      FROM tenant_subscriptions s
      JOIN companies c ON s.company_id = c.id
      ORDER BY s.updated_at DESC
    `);
    return stmt.all() as TenantSubscription[];
  }

  static getByCompanyId(companyId: number): TenantSubscription | null {
    const db = getDatabase();
    this.checkAndExpireOverdueSubscriptions();
    const stmt = db.prepare(`
      SELECT 
        s.*,
        c.name as company_name
      FROM tenant_subscriptions s
      JOIN companies c ON s.company_id = c.id
      WHERE s.company_id = ?
    `);
    const row = stmt.get(companyId);
    return (row as TenantSubscription) || null;
  }

  static createDefault(
    companyId: number,
    billingCycle: BillingCycle = 'yearly',
    startDate?: string,
    expirationDate?: string,
    status: SubscriptionStatus = 'active'
  ): TenantSubscription {
    const db = getDatabase();
    const now = new Date();
    const startIso = startDate || now.toISOString();

    let expiryIso = expirationDate;
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

    db.prepare(`
      INSERT INTO tenant_subscriptions (
        company_id, plan_name, billing_cycle, status, start_date, renewal_date, expiration_date, payment_status, created_at, updated_at
      )
      VALUES (?, 'Professional', ?, ?, ?, ?, ?, 'paid', ?, ?)
      ON CONFLICT(company_id) DO UPDATE SET
        plan_name = 'Professional',
        billing_cycle = EXCLUDED.billing_cycle,
        status = EXCLUDED.status,
        start_date = EXCLUDED.start_date,
        renewal_date = EXCLUDED.renewal_date,
        expiration_date = EXCLUDED.expiration_date,
        payment_status = 'paid',
        updated_at = EXCLUDED.updated_at
    `).run(companyId, billingCycle, status, startIso, expiryIso, expiryIso, nowIso, nowIso);

    const sub = this.getByCompanyId(companyId)!;
    LicenseServerService.recordAuditLog({
      companyName: sub.company_name || `Company #${companyId}`,
      action: 'SUBSCRIPTION_CREATED',
      details: `تم إنشاء اشتراك جديد (دورة: ${billingCycle}، الحالة: ${status})`,
      actor: 'SUPER_ADMIN',
    });

    return sub;
  }

  static update(companyId: number, data: Partial<TenantSubscription>): { success: boolean; error?: string } {
    const db = getDatabase();
    const existing = this.getByCompanyId(companyId);
    const fields: string[] = [];
    const values: any[] = [];

    if (data.plan_name !== undefined) {
      fields.push('plan_name = ?');
      values.push(data.plan_name);
    }
    if (data.billing_cycle !== undefined) {
      fields.push('billing_cycle = ?');
      values.push(data.billing_cycle);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.renewal_date !== undefined) {
      fields.push('renewal_date = ?');
      values.push(data.renewal_date);
    }
    if (data.expiration_date !== undefined) {
      fields.push('expiration_date = ?');
      values.push(data.expiration_date);
    }
    if (data.payment_status !== undefined) {
      fields.push('payment_status = ?');
      values.push(data.payment_status);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(companyId);

    db.prepare(`UPDATE tenant_subscriptions SET ${fields.join(', ')} WHERE company_id = ?`).run(...values);

    const compName = existing?.company_name || `Company #${companyId}`;
    if (data.status && existing && data.status !== existing.status) {
      if (data.status === 'suspended') {
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action: 'SUBSCRIPTION_SUSPENDED',
          details: `تم تعليق اشتراك شركة "${compName}"`,
          actor: 'SUPER_ADMIN',
        });
      } else if (data.status === 'active' && (existing.status === 'suspended' || existing.status === 'cancelled')) {
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action: 'SUBSCRIPTION_REACTIVATED',
          details: `تمت إعادة تفعيل اشتراك شركة "${compName}"`,
          actor: 'SUPER_ADMIN',
        });
      } else if (data.status === 'cancelled') {
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action: 'SUBSCRIPTION_CANCELLED',
          details: `تم إلغاء اشتراك شركة "${compName}"`,
          actor: 'SUPER_ADMIN',
        });
      } else {
        LicenseServerService.recordAuditLog({
          companyName: compName,
          action: 'SUBSCRIPTION_UPDATED',
          details: `تم تغيير حالة الاشتراك إلى ${data.status}`,
          actor: 'SUPER_ADMIN',
        });
      }
    } else {
      LicenseServerService.recordAuditLog({
        companyName: compName,
        action: 'SUBSCRIPTION_UPDATED',
        details: `تم تحديث بيانات الاشتراك`,
        actor: 'SUPER_ADMIN',
      });
    }

    return { success: true };
  }

  static renew(
    companyId: number,
    durationMonths: number,
    billingCycle?: BillingCycle
  ): { success: boolean; subscription?: TenantSubscription; error?: string } {
    const current = this.getByCompanyId(companyId);
    const now = new Date();

    let baseDate = now;
    if (current && current.status === 'active' && current.expiration_date) {
      const currentExpiry = new Date(current.expiration_date);
      if (currentExpiry > now) {
        baseDate = currentExpiry;
      }
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    const cycle = billingCycle || (durationMonths >= 12 ? 'yearly' : 'monthly');
    const nowIso = now.toISOString();
    const expiryIso = newExpiry.toISOString();

    const db = getDatabase();
    db.prepare(`
      INSERT INTO tenant_subscriptions (
        company_id, plan_name, billing_cycle, status, start_date, renewal_date, expiration_date, payment_status, created_at, updated_at
      )
      VALUES (?, 'Professional', ?, 'active', ?, ?, ?, 'paid', ?, ?)
      ON CONFLICT(company_id) DO UPDATE SET
        plan_name = 'Professional',
        billing_cycle = EXCLUDED.billing_cycle,
        status = 'active',
        renewal_date = EXCLUDED.renewal_date,
        expiration_date = EXCLUDED.expiration_date,
        payment_status = 'paid',
        updated_at = EXCLUDED.updated_at
    `).run(companyId, cycle, current?.start_date || nowIso, expiryIso, expiryIso, nowIso, nowIso);

    const updated = this.getByCompanyId(companyId);
    const compName = updated?.company_name || current?.company_name || `Company #${companyId}`;
    LicenseServerService.recordAuditLog({
      companyName: compName,
      action: 'SUBSCRIPTION_RENEWED',
      details: `تم تجديد الاشتراك بنجاح لمدة ${durationMonths} شهر (${cycle}) حتى ${expiryIso.split('T')[0]}`,
      actor: 'SUPER_ADMIN',
    });

    return { success: true, subscription: updated || undefined };
  }

  static extend(
    companyId: number,
    durationMonths: number
  ): { success: boolean; subscription?: TenantSubscription; error?: string } {
    const current = this.getByCompanyId(companyId);
    if (!current) {
      return this.renew(companyId, durationMonths);
    }

    const now = new Date();
    let baseDate = now;
    if (current.expiration_date) {
      const currentExpiry = new Date(current.expiration_date);
      if (currentExpiry > now) {
        baseDate = currentExpiry;
      }
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    const nowIso = now.toISOString();
    const expiryIso = newExpiry.toISOString();

    const db = getDatabase();
    db.prepare(`
      UPDATE tenant_subscriptions
      SET status = 'active',
          renewal_date = ?,
          expiration_date = ?,
          updated_at = ?
      WHERE company_id = ?
    `).run(expiryIso, expiryIso, nowIso, companyId);

    const updated = this.getByCompanyId(companyId);
    const compName = updated?.company_name || current?.company_name || `Company #${companyId}`;
    LicenseServerService.recordAuditLog({
      companyName: compName,
      action: 'SUBSCRIPTION_EXTENDED',
      details: `تم تمديد الاشتراك بنجاح لمدة ${durationMonths} شهر إضافي حتى ${expiryIso.split('T')[0]}`,
      actor: 'SUPER_ADMIN',
    });

    return { success: true, subscription: updated || undefined };
  }

  static isTenantActive(companyId: number): {
    active: boolean;
    reason?: string;
    status?: SubscriptionStatus;
    subscription?: TenantSubscription;
  } {
    let sub = this.getByCompanyId(companyId);
    if (!sub) {
      // Auto-provision default subscription
      sub = this.createDefault(companyId);
      return { active: true, status: 'active', subscription: sub };
    }

    if (sub.status === 'suspended') {
      return {
        active: false,
        reason: 'تم تعليق اشتراك المؤسسة. يرجى التواصل مع الإدارة.',
        status: 'suspended',
        subscription: sub,
      };
    }
    if (sub.status === 'cancelled') {
      return {
        active: false,
        reason: 'تم إلغاء الاشتراك. يرجى التواصل مع الإدارة لإعادة التفعيل.',
        status: 'cancelled',
        subscription: sub,
      };
    }
    if (sub.status === 'past_due') {
      return {
        active: false,
        reason: 'اشتراكك يحتاج إلى تجديد (دفعة متأخرة). يرجى التواصل مع الإدارة.',
        status: 'past_due',
        subscription: sub,
      };
    }
    if (sub.status === 'expired') {
      return {
        active: false,
        reason: 'انتهت فترة اشتراك المؤسسة. يرجى تجديد الاشتراك للمتابعة.',
        status: 'expired',
        subscription: sub,
      };
    }

    if (sub.expiration_date) {
      const exp = new Date(sub.expiration_date);
      if (exp.getTime() < Date.now()) {
        this.update(companyId, { status: 'expired' });
        const updatedSub = this.getByCompanyId(companyId);
        return {
          active: false,
          reason: 'انتهت فترة اشتراك المؤسسة. يرجى تجديد الاشتراك للمتابعة.',
          status: 'expired',
          subscription: updatedSub || sub,
        };
      }
    }

    return {
      active: true,
      status: sub.status,
      subscription: sub,
    };
  }

  static checkAndExpireOverdueSubscriptions(): void {
    try {
      const db = getDatabase();
      const nowIso = new Date().toISOString();
      db.prepare(`
        UPDATE tenant_subscriptions
        SET status = 'expired', updated_at = ?
        WHERE status IN ('active', 'trial') AND expiration_date < ?
      `).run(nowIso, nowIso);
    } catch (_) {}
  }
}
