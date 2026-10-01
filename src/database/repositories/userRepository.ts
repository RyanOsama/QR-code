import { getDatabase } from '../connection';
import { AppUser } from '../../types';
import { PasswordService } from '../../services/passwordService';
import { SubscriptionRepository } from './subscriptionRepository';

interface RateLimitEntry {
  attempts: number;
  lockoutStage: number; // 1 = 60s, 2 = 5m, 3 = 2 days
  lockUntil: number;
}
const loginAttemptsMap = new Map<string, RateLimitEntry>();

function formatRemainingArabic(seconds: number): string {
  if (seconds >= 86400) {
    const days = Math.ceil(seconds / 86400);
    return days === 2 ? 'يومين كاملين' : `${days} أيام`;
  }
  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} ساعة`;
  }
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} دقائق`;
  }
  return `${seconds} ثانية`;
}

export class UserRepository {
  static getById(id: number): AppUser | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.company_id,
        u.username,
        u.full_name,
        u.role,
        u.must_change_password,
        u.temp_password,
        u.created_at,
        c.name as company_name,
        c.logo_url as company_logo
      FROM app_users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      must_change_password: Boolean(row.must_change_password),
      company_subscription: row.company_id ? SubscriptionRepository.getByCompanyId(row.company_id) : null,
    };
  }

  static getByUsername(username: string): { user: AppUser; password_hash: string; temp_password?: string | null; company_status?: string | null } | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        u.*,
        c.name as company_name,
        c.logo_url as company_logo,
        c.status as company_status
      FROM app_users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE LOWER(u.username) = LOWER(?)
    `);
    const row = stmt.get(username.trim()) as any;
    if (!row) return null;

    const user: AppUser = {
      id: row.id,
      company_id: row.company_id,
      username: row.username,
      full_name: row.full_name,
      role: row.role,
      must_change_password: Boolean(row.must_change_password),
      temp_password: row.temp_password,
      created_at: row.created_at,
      company_name: row.company_name,
      company_logo: row.company_logo,
      company_subscription: row.company_id ? SubscriptionRepository.getByCompanyId(row.company_id) : null,
    };

    return {
      user,
      password_hash: row.password_hash,
      temp_password: row.temp_password,
      company_status: row.company_status,
    };
  }

  static login(username: string, password: string): { success: boolean; user?: AppUser; error?: string } {
    const key = username.toLowerCase().trim();
    const now = Date.now();
    const attemptEntry = loginAttemptsMap.get(key);

    // 1. Check if user is currently locked out
    if (attemptEntry && now < attemptEntry.lockUntil) {
      const remainingSec = Math.ceil((attemptEntry.lockUntil - now) / 1000);
      const timeStr = formatRemainingArabic(remainingSec);
      return {
        success: false,
        error: `تم قفل محاولات الدخول مؤقتاً لحماية الحساب. يرجى الانتظار (${remainingSec}) [${timeStr}].`,
      };
    }

    const found = this.getByUsername(username);
    if (!found) {
      return { success: false, error: 'اسم المستخدم غير موجود' };
    }

    // 2. If company is suspended, block login immediately with clear notice
    if (found.user.role !== 'SUPER_ADMIN') {
      if (found.company_status === 'SUSPENDED' || found.company_status === 'INACTIVE') {
        return { success: false, error: 'يرجى التواصل مع الإدارة' };
      }

      if (found.user.company_id) {
        const subCheck = SubscriptionRepository.isTenantActive(found.user.company_id);
        if (!subCheck.active) {
          return { success: false, error: subCheck.reason || 'اشتراكك يحتاج إلى تجديد. يرجى التواصل مع الإدارة.' };
        }
        found.user.company_subscription = subCheck.subscription || SubscriptionRepository.getByCompanyId(found.user.company_id);
      }
    }

    const isValid = PasswordService.verify(password, found.password_hash, found.temp_password);
    if (!isValid) {
      let currentStage = attemptEntry?.lockoutStage || 0;
      let currentAttempts = (attemptEntry && now >= attemptEntry.lockUntil ? 0 : attemptEntry?.attempts || 0) + 1;

      if (currentAttempts >= 5) {
        currentStage += 1;
        let lockDurationMs = 60 * 1000; // المرحلة 1: 60 ثانية
        let stageLabel = '60 ثانية';

        if (currentStage === 2) {
          lockDurationMs = 5 * 60 * 1000; // المرحلة 2: 5 دقائق
          stageLabel = '5 دقائق';
        } else if (currentStage >= 3) {
          lockDurationMs = 2 * 24 * 60 * 60 * 1000; // المرحلة 3: يومين كاملين
          stageLabel = 'يومين كاملين';
        }

        const lockUntil = now + lockDurationMs;
        const totalSec = Math.ceil(lockDurationMs / 1000);
        loginAttemptsMap.set(key, { attempts: 0, lockoutStage: currentStage, lockUntil });

        return {
          success: false,
          error: `تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل تسجيل الدخول مؤقتاً لمدة (${totalSec}) [${stageLabel}] لحماية الحساب.`,
        };
      } else {
        loginAttemptsMap.set(key, { attempts: currentAttempts, lockoutStage: currentStage, lockUntil: 0 });
        const remaining = 5 - currentAttempts;
        return {
          success: false,
          error: `كلمة المرور غير صحيحة (متبقي ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'} قبل القفل المؤقت).`,
        };
      }
    }

    // Reset failed attempts on success
    loginAttemptsMap.delete(key);

    return {
      success: true,
      user: found.user,
    };
  }

  static changePassword(userId: number, newPassword: string): { success: boolean; error?: string } {
    if (newPassword.trim().length < 4) {
      return { success: false, error: 'يجب أن لا تقل كلمة المرور عن 4 أحرف أو أرقام' };
    }

    const db = getDatabase();
    const newHash = PasswordService.hash(newPassword);

    const res = db.prepare(`
      UPDATE app_users 
      SET password_hash = ?, temp_password = NULL, must_change_password = 0
      WHERE id = ?
    `).run(newHash, userId);

    if (res.changes === 0) {
      return { success: false, error: 'لم يتم العثور على المستخدم' };
    }

    return { success: true };
  }

  static getEmployees(companyId: number): AppUser[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.company_id,
        u.username,
        u.full_name,
        u.role,
        u.must_change_password,
        u.temp_password,
        u.created_at,
        c.name as company_name,
        c.logo_url as company_logo
      FROM app_users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      ORDER BY u.created_at DESC
    `);
    const rows = stmt.all(companyId) as any[];
    return rows.map((r) => ({
      ...r,
      must_change_password: Boolean(r.must_change_password),
    }));
  }

  static createEmployee(
    companyId: number,
    data: { full_name: string; username: string }
  ): { success: boolean; user?: AppUser; tempPassword?: string; error?: string } {
    const db = getDatabase();
    const cleanUsername = data.username.trim();
    const cleanName = data.full_name.trim();

    const existing = db.prepare(`SELECT id FROM app_users WHERE LOWER(username) = LOWER(?)`).get(cleanUsername);
    if (existing) {
      return { success: false, error: 'اسم المستخدم موجود بالفعل، يرجى اختيار اسم مستخدم آخر' };
    }

    const tempPassword = PasswordService.generateTempPassword();
    const passwordHash = PasswordService.hash(tempPassword);
    const now = new Date().toISOString();

    const res = db.prepare(`
      INSERT INTO app_users (company_id, username, password_hash, temp_password, full_name, role, must_change_password, created_at)
      VALUES (?, ?, ?, ?, ?, 'EMPLOYEE', 1, ?)
    `).run(companyId, cleanUsername, passwordHash, tempPassword, cleanName, now);

    const user = this.getById(Number(res.lastInsertRowid));
    if (!user) {
      return { success: false, error: 'فشل استرجاع بيانات الموظف بعد الإضافة' };
    }

    return {
      success: true,
      user,
      tempPassword,
    };
  }

  static deleteEmployee(userId: number): { success: boolean; error?: string } {
    const db = getDatabase();
    db.prepare(`DELETE FROM app_users WHERE id = ? AND role = 'EMPLOYEE'`).run(userId);
    return { success: true };
  }

  static resetEmployeePassword(userId: number): { success: boolean; tempPassword?: string; error?: string } {
    const db = getDatabase();
    const user = db.prepare(`SELECT id FROM app_users WHERE id = ?`).get(userId);
    if (!user) {
      return { success: false, error: 'لم يتم العثور على الموظف' };
    }

    const newTemp = PasswordService.generateTempPassword();
    const newHash = PasswordService.hash(newTemp);

    db.prepare(`
      UPDATE app_users 
      SET password_hash = ?, temp_password = ?, must_change_password = 1 
      WHERE id = ?
    `).run(newHash, newTemp, userId);

    return { success: true, tempPassword: newTemp };
  }
}
