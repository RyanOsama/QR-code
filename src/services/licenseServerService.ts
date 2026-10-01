import crypto from 'crypto';
import { getDatabase } from '../database/connection';
import {
  License,
  LicenseActivation,
  LicenseType,
  LicenseStatus,
  SignedActivationToken,
  LicenseAuditLog,
  LicenseAuditAction,
} from '../types';

const LICENSE_SECRET_KEY = process.env.LICENSE_SERVER_SECRET || 'EVENT_QR_LIC_SERVER_SECURE_HMAC_KEY_2026';

export class LicenseServerService {
  /**
   * Compute standard SHA-256 hash for license keys or device IDs.
   */
  static hashSecret(val: string): string {
    return crypto.createHash('sha256').update(val.trim()).digest('hex');
  }

  /**
   * Mask a license key to protect sensitive key parts (e.g., PERPETUAL-****-****-****-ABCD).
   */
  static maskLicenseKey(key?: string): string {
    if (!key) return 'LIC-****-****-****-****';
    const clean = key.trim();
    const parts = clean.split('-');
    if (parts.length >= 2) {
      const prefix = parts[0];
      const last = parts[parts.length - 1];
      const middle = parts.slice(1, -1).map(() => '****').join('-');
      return middle ? `${prefix}-${middle}-${last}` : `${prefix}-****-${last}`;
    }
    return clean.length > 8 ? `${clean.substring(0, 4)}****${clean.substring(clean.length - 4)}` : '****';
  }

  /**
   * Generate a readable, secure license key formatted as LIC-XXXX-XXXX-XXXX-XXXX
   */
  static generatePlainLicenseKey(prefix = 'LIC'): string {
    const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
    const part1 = raw.substring(0, 4);
    const part2 = raw.substring(4, 8);
    const part3 = raw.substring(8, 12);
    const part4 = raw.substring(12, 16) || crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${part1}-${part2}-${part3}-${part4}`;
  }

  /**
   * Record a structured audit log entry for license and device lifecycle events.
   */
  static recordAuditLog(entry: {
    licenseId?: number | null;
    licenseKeyMasked?: string | null;
    companyName?: string | null;
    action: LicenseAuditAction;
    details?: string | null;
    actor?: string;
  }): void {
    try {
      const db = getDatabase();
      const nowIso = new Date().toISOString();
      db.prepare(`
        INSERT INTO license_audit_logs (license_id, license_key_masked, company_name, action, details, actor, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.licenseId || null,
        entry.licenseKeyMasked || null,
        entry.companyName || null,
        entry.action,
        entry.details || null,
        entry.actor || 'SUPER_ADMIN',
        nowIso
      );
    } catch (err: any) {
      console.warn('Failed to record license audit log:', err.message);
    }
  }

  /**
   * Retrieve audit logs, optionally filtered by licenseId, companyName, or action.
   */
  static getAuditLogs(filter?: { licenseId?: number; companyName?: string; action?: string; limit?: number }): LicenseAuditLog[] {
    try {
      const db = getDatabase();
      const limit = filter?.limit && filter.limit > 0 ? filter.limit : 100;
      const conditions: string[] = [];
      const params: any[] = [];

      if (filter?.licenseId) {
        conditions.push('license_id = ?');
        params.push(filter.licenseId);
      }
      if (filter?.companyName) {
        conditions.push('company_name = ?');
        params.push(filter.companyName);
      }
      if (filter?.action) {
        conditions.push('action = ?');
        params.push(filter.action);
      }

      let query = 'SELECT * FROM license_audit_logs';
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      query += ' ORDER BY id DESC LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params) as LicenseAuditLog[];
    } catch (_) {
      return [];
    }
  }

  /**
   * Verify whether the executing user has Super Admin permissions.
   */
  static verifySuperAdminAccess(actorRole?: string): { authorized: boolean; error?: string } {
    const role = (actorRole || '').trim().toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'SUPERADMIN' || role === 'OWNER') {
      return { authorized: true };
    }
    return {
      authorized: false,
      error: 'غير مصرح لك بالوصول إلى لوحة إدارة التراخيص المركزية. هذه العمليات مخصصة للمسؤول الرئيسي فقط (Super Admin).',
    };
  }

  /**
   * Sign activation payload using HMAC-SHA256.
   */
  static signActivationToken(payload: Omit<SignedActivationToken, 'signature'>): string {
    const dataStr = JSON.stringify({
      l: payload.licenseId,
      c: payload.companyName,
      d: payload.deviceIdHash,
      i: payload.issuedAt,
      v: payload.validUntil,
    });
    const signature = crypto.createHmac('sha256', LICENSE_SECRET_KEY).update(dataStr).digest('hex');
    const tokenObj: SignedActivationToken = {
      ...payload,
      signature,
    };
    return Buffer.from(JSON.stringify(tokenObj), 'utf8').toString('base64url');
  }

  /**
   * Verify signed activation token authenticity and freshness.
   */
  static verifyActivationToken(tokenString: string): { valid: boolean; payload?: SignedActivationToken; error?: string } {
    try {
      const decoded = Buffer.from(tokenString, 'base64url').toString('utf8');
      const token: SignedActivationToken = JSON.parse(decoded);

      if (!token || !token.signature || !token.licenseId || !token.deviceIdHash) {
        return { valid: false, error: 'رمز التفعيل تالف أو غير صالح' };
      }

      const expectedDataStr = JSON.stringify({
        l: token.licenseId,
        c: token.companyName,
        d: token.deviceIdHash,
        i: token.issuedAt,
        v: token.validUntil,
      });

      const expectedSig = crypto.createHmac('sha256', LICENSE_SECRET_KEY).update(expectedDataStr).digest('hex');

      // Timing-safe signature comparison
      const sigBuffer = Buffer.from(token.signature, 'hex');
      const expBuffer = Buffer.from(expectedSig, 'hex');
      if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
        return { valid: false, error: 'توقيع رمز التفعيل غير متطابق - تم التلاعب بالبيانات' };
      }

      // Check expiry
      if (token.validUntil) {
        const expiryTime = new Date(token.validUntil).getTime();
        if (Date.now() > expiryTime) {
          return { valid: false, error: 'انتهت صلاحية رمز التفعيل المؤقت، يتطلب إعادة التحقق' };
        }
      }

      return { valid: true, payload: token };
    } catch (err: any) {
      return { valid: false, error: 'فشل فك تشفير وتدقيق رمز التفعيل: ' + (err.message || 'خطأ غير معروف') };
    }
  }

  // ==========================================
  // LICENSE SERVER API ENDPOINTS IMPLEMENTATION
  // ==========================================

  /**
   * POST /api/licenses/activate
   */
  static async activateLicense(data: {
    licenseKey: string;
    deviceId: string;
    deviceName?: string;
    appVersion?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    companyName?: string;
    licenseType?: LicenseType;
    maxDevices?: number;
    activeDevices?: number;
    expiresAt?: string | null;
    isTransfer?: boolean;
    error?: string;
  }> {
    const cleanKey = (data.licenseKey || '').trim();
    const cleanDeviceId = (data.deviceId || '').trim();

    if (!cleanKey) {
      return { success: false, error: 'يرجى إدخال مفتاح الترخيص' };
    }
    if (!cleanDeviceId) {
      return { success: false, error: 'تعذر تحديد معرّف الجهاز' };
    }

    const keyHash = this.hashSecret(cleanKey);
    const deviceIdHash = this.hashSecret(cleanDeviceId);
    const nowIso = new Date().toISOString();

    const db = getDatabase();

    // 1. Check license exists
    const license = db.prepare(`SELECT * FROM licenses WHERE license_key_hash = ?`).get(keyHash) as License | undefined;

    if (!license) {
      return { success: false, error: 'مفتاح الترخيص غير صحيح أو غير مسجل في خادم التراخيص' };
    }

    // 2. Check license status
    if (license.status === 'revoked') {
      return { success: false, error: 'تم إلغاء هذا الترخيص من قبل الشركة المزودة (Revoked License)' };
    }
    if (license.status === 'suspended') {
      return { success: false, error: 'هذا الترخيص معلق حالياً، يرجى التواصل مع الدعم الفني' };
    }
    // Perpetual licenses never expire based on date
    if (license.license_type !== 'PERPETUAL') {
      if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at).getTime() < Date.now())) {
        return { success: false, error: 'انتهت صلاحية هذا الترخيص' };
      }
    }

    // 3. Check device limits and previous activations
    const allActivations = db.prepare(`
      SELECT * FROM license_activations 
      WHERE license_id = ?
    `).all(license.id) as LicenseActivation[];

    const activeActivations = allActivations.filter((a) => !a.deactivated_at);
    const deactivatedActivations = allActivations.filter((a) => Boolean(a.deactivated_at));

    const existingThisDevice = activeActivations.find((a) => a.device_id_hash === deviceIdHash);

    if (!existingThisDevice && activeActivations.length >= license.max_devices) {
      return {
        success: false,
        error: `تم الوصول إلى الحد الأقصى للأجهزة المسموح بها لهذا الترخيص (${license.max_devices} أجهزة). يرجى إلغاء تفعيل أحد الأجهزة السابقة أو ترقية الترخيص.`,
      };
    }

    // 4. Check if this is a device transfer (new device activating on a license that had previous deactivated seats)
    const isTransfer = !existingThisDevice && deactivatedActivations.length > 0;

    // 5. Record or update activation
    const deviceName = data.deviceName || 'جهاز مكتبي';
    if (existingThisDevice) {
      db.prepare(`
        UPDATE license_activations 
        SET last_seen_at = ?, device_name = COALESCE(?, device_name) 
        WHERE id = ?
      `).run(nowIso, data.deviceName || null, existingThisDevice.id);
    } else {
      db.prepare(`
        INSERT INTO license_activations (license_id, device_id_hash, device_name, activated_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(license.id, deviceIdHash, deviceName, nowIso, nowIso);
    }

    // 6. Generate signed activation token (valid for 30 days before requiring background revalidation)
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const token = this.signActivationToken({
      licenseId: license.id,
      companyName: license.company_name,
      deviceIdHash: deviceIdHash,
      issuedAt: nowIso,
      validUntil: validUntil,
    });

    const totalActive = existingThisDevice ? activeActivations.length : activeActivations.length + 1;
    const maskedKey = this.maskLicenseKey(cleanKey);

    // 7. Audit log recording
    if (isTransfer) {
      this.recordAuditLog({
        licenseId: license.id,
        licenseKeyMasked: maskedKey,
        companyName: license.company_name,
        action: 'DEVICE_TRANSFER',
        details: `تم نقل الترخيص وتفعيل جهاز جديد: "${deviceName}" بعد إلغاء جهاز سابق (Hash: ${deviceIdHash.substring(0, 12)}...)`,
        actor: 'CLIENT_SYSTEM',
      });
    }

    this.recordAuditLog({
      licenseId: license.id,
      licenseKeyMasked: maskedKey,
      companyName: license.company_name,
      action: 'DEVICE_ACTIVATED',
      details: `تفعيل جهاز: "${deviceName}" (الأجهزة النشطة: ${totalActive}/${license.max_devices})`,
      actor: 'CLIENT_SYSTEM',
    });

    return {
      success: true,
      token,
      companyName: license.company_name,
      licenseType: license.license_type,
      maxDevices: license.max_devices,
      activeDevices: totalActive,
      expiresAt: license.expires_at,
      isTransfer,
    };
  }

  /**
   * POST /api/licenses/validate
   */
  static async validateLicense(data: {
    token?: string;
    licenseKey?: string;
    deviceId: string;
  }): Promise<{
    valid: boolean;
    status?: LicenseStatus;
    companyName?: string;
    licenseType?: LicenseType;
    refreshedToken?: string;
    maxDevices?: number;
    error?: string;
  }> {
    const cleanDeviceId = (data.deviceId || '').trim();
    const deviceIdHash = this.hashSecret(cleanDeviceId);
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    let licenseId: number | null = null;

    if (data.token) {
      const verifyRes = this.verifyActivationToken(data.token);
      if (!verifyRes.valid || !verifyRes.payload) {
        return { valid: false, error: verifyRes.error || 'رمز التفعيل غير صالح' };
      }
      if (verifyRes.payload.deviceIdHash !== deviceIdHash) {
        return { valid: false, error: 'رمز التفعيل غير مخصص لهذا الجهاز' };
      }
      licenseId = verifyRes.payload.licenseId;
    } else if (data.licenseKey) {
      const keyHash = this.hashSecret(data.licenseKey);
      const lic = db.prepare(`SELECT id FROM licenses WHERE license_key_hash = ?`).get(keyHash) as { id: number } | undefined;
      if (lic) licenseId = lic.id;
    }

    if (!licenseId) {
      return { valid: false, error: 'لم يتم العثور على الترخيص' };
    }

    const license = db.prepare(`SELECT * FROM licenses WHERE id = ?`).get(licenseId) as License | undefined;
    if (!license) {
      return { valid: false, error: 'الترخيص غير موجود في قاعدة بيانات التراخيص' };
    }

    if (license.status !== 'active') {
      return { valid: false, status: license.status, error: `حالة الترخيص الحالية: ${license.status}` };
    }

    // Perpetual licenses do not expire
    if (license.license_type !== 'PERPETUAL') {
      if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
        return { valid: false, status: 'expired', error: 'انتهت صلاحية الترخيص' };
      }
    }

    // Check device activation is still active
    const activation = db.prepare(`
      SELECT * FROM license_activations 
      WHERE license_id = ? AND device_id_hash = ? AND deactivated_at IS NULL
    `).get(license.id, deviceIdHash) as LicenseActivation | undefined;

    if (!activation) {
      return { valid: false, error: 'تم إلغاء تفعيل هذا الجهاز من قبل المسؤول' };
    }

    // Update last seen
    db.prepare(`UPDATE license_activations SET last_seen_at = ? WHERE id = ?`).run(nowIso, activation.id);

    // Refresh token
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const refreshedToken = this.signActivationToken({
      licenseId: license.id,
      companyName: license.company_name,
      deviceIdHash: deviceIdHash,
      issuedAt: nowIso,
      validUntil: validUntil,
    });

    return {
      valid: true,
      status: 'active',
      companyName: license.company_name,
      licenseType: license.license_type,
      maxDevices: license.max_devices,
      refreshedToken,
    };
  }

  /**
   * POST /api/licenses/deactivate
   */
  static async deactivateLicense(data: {
    token?: string;
    licenseKey?: string;
    deviceId: string;
    actor?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanDeviceId = (data.deviceId || '').trim();
    const deviceIdHash = this.hashSecret(cleanDeviceId);
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    let licenseId: number | null = null;
    let companyName: string | null = null;

    if (data.token) {
      const verifyRes = this.verifyActivationToken(data.token);
      if (verifyRes.valid && verifyRes.payload) {
        licenseId = verifyRes.payload.licenseId;
        companyName = verifyRes.payload.companyName;
      }
    }

    if (!licenseId && data.licenseKey) {
      const keyHash = this.hashSecret(data.licenseKey);
      const lic = db.prepare(`SELECT * FROM licenses WHERE license_key_hash = ?`).get(keyHash) as License | undefined;
      if (lic) {
        licenseId = lic.id;
        companyName = lic.company_name;
      }
    }

    if (licenseId) {
      db.prepare(`
        UPDATE license_activations 
        SET deactivated_at = ? 
        WHERE license_id = ? AND device_id_hash = ? AND deactivated_at IS NULL
      `).run(nowIso, licenseId, deviceIdHash);
    } else {
      const act = db.prepare(`
        SELECT la.*, l.company_name 
        FROM license_activations la
        JOIN licenses l ON l.id = la.license_id
        WHERE la.device_id_hash = ? AND la.deactivated_at IS NULL
      `).get(deviceIdHash) as (LicenseActivation & { company_name: string }) | undefined;

      if (act) {
        licenseId = act.license_id;
        companyName = act.company_name;
      }

      db.prepare(`
        UPDATE license_activations 
        SET deactivated_at = ? 
        WHERE device_id_hash = ? AND deactivated_at IS NULL
      `).run(nowIso, deviceIdHash);
    }

    this.recordAuditLog({
      licenseId,
      companyName,
      action: 'DEVICE_DEACTIVATED',
      details: `تم إلغاء تفعيل الجهاز (Hash: ${deviceIdHash.substring(0, 12)}...)`,
      actor: data.actor || 'SUPER_ADMIN',
    });

    return { success: true };
  }

  // ==========================================
  // SUPER ADMIN MANAGEMENT METHODS
  // ==========================================

  /**
   * Create a new perpetual or subscription license (Super Admin only).
   */
  static createLicense(
    data: {
      company_name: string;
      max_devices?: number;
      expires_at?: string | null;
      license_type?: LicenseType;
    },
    actorRole = 'SUPER_ADMIN'
  ): { success: boolean; license?: License; plainLicenseKey?: string; error?: string } {
    try {
      const auth = this.verifySuperAdminAccess(actorRole);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }

      const cleanCompany = (data.company_name || '').trim();
      if (!cleanCompany) {
        return { success: false, error: 'اسم الشركة مطلوب لإنشاء الترخيص' };
      }

      const licType = data.license_type || 'PERPETUAL';
      const prefix = licType === 'PERPETUAL' ? 'PERPETUAL' : 'LIC';
      const plainKey = this.generatePlainLicenseKey(prefix);
      const keyHash = this.hashSecret(plainKey);
      const maxDev = data.max_devices && data.max_devices > 0 ? data.max_devices : 1;
      const nowIso = new Date().toISOString();

      const db = getDatabase();
      const res = db.prepare(`
        INSERT INTO licenses (license_key, license_key_hash, company_name, license_type, status, max_devices, expires_at, created_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
      `).run(plainKey, keyHash, cleanCompany, licType, maxDev, data.expires_at || null, nowIso);

      const license: License = {
        id: Number(res.lastInsertRowid),
        license_key: plainKey,
        license_key_hash: keyHash,
        company_name: cleanCompany,
        license_type: licType,
        status: 'active',
        max_devices: maxDev,
        expires_at: data.expires_at || null,
        created_at: nowIso,
        activations_count: 0,
      };

      this.recordAuditLog({
        licenseId: license.id,
        licenseKeyMasked: this.maskLicenseKey(plainKey),
        companyName: cleanCompany,
        action: 'LICENSE_CREATED',
        details: `إنشاء ترخيص ${licType} لشركة "${cleanCompany}" بعدد أجهزة ${maxDev}`,
        actor: actorRole,
      });

      return {
        success: true,
        license,
        plainLicenseKey: plainKey,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل إنشاء الترخيص' };
    }
  }

  /**
   * List and search licenses with activations count and search filtering (Super Admin only).
   */
  static listLicenses(
    filter?: {
      query?: string;
      status?: LicenseStatus | 'all';
      licenseType?: LicenseType | 'all';
    },
    actorRole = 'SUPER_ADMIN'
  ): License[] {
    const auth = this.verifySuperAdminAccess(actorRole);
    if (!auth.authorized) {
      return [];
    }

    const db = getDatabase();
    let sql = `
      SELECT l.*, 
        (SELECT COUNT(*) FROM license_activations a WHERE a.license_id = l.id AND a.deactivated_at IS NULL) as activations_count
      FROM licenses l
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.status && filter.status !== 'all') {
      sql += ` AND l.status = ?`;
      params.push(filter.status);
    }

    if (filter?.licenseType && filter.licenseType !== 'all') {
      sql += ` AND l.license_type = ?`;
      params.push(filter.licenseType);
    }

    if (filter?.query && filter.query.trim()) {
      const q = `%${filter.query.trim()}%`;
      sql += ` AND (l.company_name LIKE ? OR l.license_key LIKE ?)`;
      params.push(q, q);
    }

    sql += ` ORDER BY l.id DESC`;

    const licenses = db.prepare(sql).all(...params) as License[];

    return licenses.map((l) => {
      const activations = db.prepare(`
        SELECT * FROM license_activations WHERE license_id = ? ORDER BY id DESC
      `).all(l.id) as LicenseActivation[];
      return {
        ...l,
        license_key: l.license_key || `LIC-${l.license_key_hash.substring(0, 4)}-${l.license_key_hash.substring(4, 8)}-${l.license_key_hash.substring(8, 12)}`.toUpperCase(),
        activations,
      };
    });
  }

  /**
   * Update license status (ACTIVE, REVOKED, SUSPENDED, EXPIRED).
   */
  static updateLicenseStatus(
    licenseId: number,
    newStatus: LicenseStatus,
    actorRole = 'SUPER_ADMIN'
  ): { success: boolean; error?: string } {
    try {
      const auth = this.verifySuperAdminAccess(actorRole);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }

      const db = getDatabase();
      const lic = db.prepare(`SELECT * FROM licenses WHERE id = ?`).get(licenseId) as License | undefined;
      if (!lic) {
        return { success: false, error: 'الترخيص غير موجود' };
      }

      db.prepare(`UPDATE licenses SET status = ? WHERE id = ?`).run(newStatus, licenseId);

      const action: LicenseAuditAction =
        newStatus === 'revoked'
          ? 'LICENSE_REVOKED'
          : newStatus === 'active'
          ? 'LICENSE_REACTIVATED'
          : 'LICENSE_STATUS_UPDATED';

      this.recordAuditLog({
        licenseId: lic.id,
        licenseKeyMasked: this.maskLicenseKey(lic.license_key),
        companyName: lic.company_name,
        action,
        details: `تحديث حالة الترخيص من "${lic.status}" إلى "${newStatus}"`,
        actor: actorRole,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Revoke license.
   */
  static revokeLicense(licenseId: number, actorRole = 'SUPER_ADMIN'): { success: boolean; error?: string } {
    return this.updateLicenseStatus(licenseId, 'revoked', actorRole);
  }

  /**
   * Reactivate license.
   */
  static reactivateLicense(licenseId: number, actorRole = 'SUPER_ADMIN'): { success: boolean; error?: string } {
    return this.updateLicenseStatus(licenseId, 'active', actorRole);
  }

  /**
   * Get activations for a specific license.
   */
  static getActivations(licenseId: number, actorRole = 'SUPER_ADMIN'): LicenseActivation[] {
    const auth = this.verifySuperAdminAccess(actorRole);
    if (!auth.authorized) {
      return [];
    }
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM license_activations 
      WHERE license_id = ? 
      ORDER BY id DESC
    `).all(licenseId) as LicenseActivation[];
  }

  /**
   * Deactivate a specific device activation row by ID.
   */
  static deactivateDeviceById(activationId: number, actorRole = 'SUPER_ADMIN'): { success: boolean; error?: string } {
    try {
      const auth = this.verifySuperAdminAccess(actorRole);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }

      const db = getDatabase();
      const act = db.prepare(`
        SELECT la.*, l.company_name, l.license_key 
        FROM license_activations la
        JOIN licenses l ON l.id = la.license_id
        WHERE la.id = ?
      `).get(activationId) as (LicenseActivation & { company_name: string; license_key?: string }) | undefined;

      if (!act) {
        return { success: false, error: 'سجل التفعيل غير موجود' };
      }

      const nowIso = new Date().toISOString();
      db.prepare(`
        UPDATE license_activations 
        SET deactivated_at = ? 
        WHERE id = ?
      `).run(nowIso, activationId);

      this.recordAuditLog({
        licenseId: act.license_id,
        licenseKeyMasked: this.maskLicenseKey(act.license_key),
        companyName: act.company_name,
        action: 'DEVICE_DEACTIVATED',
        details: `إلغاء تفعيل الجهاز: "${act.device_name || 'جهاز مكتبي'}" (Hash: ${act.device_id_hash.substring(0, 12)}...) بواسطة مسؤول النظام`,
        actor: actorRole,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
