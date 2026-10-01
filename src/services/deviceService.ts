import os from 'os';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { CommercialMode, CommercialAppStatus, SignedActivationToken } from '../types';
import { LicenseServerService } from './licenseServerService';
import { SupabaseService } from './supabaseService';

export interface LocalActivationData {
  commercial_mode: CommercialMode;
  is_activated: boolean;
  is_database_configured?: boolean;
  signed_token?: string;
  company_name?: string;
  customer_supabase_url?: string;
  customer_supabase_anon_key?: string;
  last_validated_at?: string;
  offline_grace_days?: number;
}

let cachedDeviceId: string = '';
let cachedActivationData: LocalActivationData | null = null;

function getActivationFilePath(): string {
  try {
    if (process.versions && process.versions.electron) {
      const { app } = require('electron');
      const userData = app.getPath('userData');
      const dir = path.join(userData, 'data');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, 'app_activation.json');
    }
  } catch (_) {}

  const localDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return path.join(localDir, 'app_activation.json');
}

export class DeviceService {
  /**
   * Default offline grace period in days (30 days).
   */
  static readonly DEFAULT_OFFLINE_GRACE_PERIOD_DAYS = 30;

  /**
   * Check if clock has been manipulated into the future or rolled back
   */
  static isClockTampered(lastValidatedTimeMs: number, currentTimeMs: number = Date.now()): boolean {
    return lastValidatedTimeMs > currentTimeMs + 60000;
  }

  /**
   * Generate or retrieve a stable, unique device identifier based on hardware/OS attributes.
   */
  static getDeviceId(): string {
    if (cachedDeviceId) return cachedDeviceId;

    try {
      const hostname = os.hostname() || 'localhost';
      const platform = os.platform() || 'win32';
      const arch = os.arch() || 'x64';
      const cpus = os.cpus();
      const cpuModel = (cpus && cpus.length > 0 ? cpus[0].model : '') || 'CPU';
      const homeDir = os.homedir() || '';

      const rawFingerprint = `${hostname}#${platform}#${arch}#${cpuModel}#${homeDir}`;
      const hash = crypto.createHash('sha256').update(rawFingerprint).digest('hex').toUpperCase();

      cachedDeviceId = `DEV-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
      return cachedDeviceId;
    } catch (_) {
      cachedDeviceId = 'DEV-STANDARD-DEVICE-1';
      return cachedDeviceId;
    }
  }

  /**
   * Get device user-friendly display name.
   */
  static getDeviceName(): string {
    try {
      return os.hostname() || 'جهاز سطح المكتب';
    } catch (_) {
      return 'جهاز سطح المكتب';
    }
  }

  /**
   * Load local activation and commercial mode data.
   */
  static getLocalActivation(): LocalActivationData {
    if (cachedActivationData) return cachedActivationData;

    const filePath = getActivationFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        cachedActivationData = JSON.parse(raw);
        return cachedActivationData!;
      } catch (err) {
        console.warn('Could not read activation file, resetting:', err);
      }
    }

    // Default to SAAS if not explicitly set to DEDICATED
    cachedActivationData = {
      commercial_mode: 'SAAS',
      is_activated: false,
      is_database_configured: false,
    };
    return cachedActivationData;
  }

  /**
   * Save local activation data securely.
   */
  static saveLocalActivation(data: LocalActivationData): void {
    cachedActivationData = { ...data };
    const filePath = getActivationFilePath();
    fs.writeFileSync(filePath, JSON.stringify(cachedActivationData, null, 2), 'utf8');
  }

  /**
   * Set commercial deployment mode (SAAS vs DEDICATED).
   */
  static setCommercialMode(mode: CommercialMode): void {
    const current = this.getLocalActivation();
    current.commercial_mode = mode;
    this.saveLocalActivation(current);
  }

  /**
   * Check commercial application startup status:
   * - In SAAS mode: Activated by default (uses vendor Supabase and tenant subscription upon login).
   * - In DEDICATED mode: Requires valid device activation token & respects 30-day offline grace period.
   */
  static async checkStartupStatus(options?: {
    forceRevalidate?: boolean;
    allowOfflineGrace?: boolean;
  }): Promise<CommercialAppStatus> {
    const act = this.getLocalActivation();
    const deviceId = this.getDeviceId();

    // Mode 1: SAAS Mode
    if (act.commercial_mode === 'SAAS') {
      return {
        mode: 'SAAS',
        isActivated: true,
        isDatabaseConfigured: true,
        companyName: 'منظومة السحابية (SaaS)',
        deviceId,
      };
    }

    // Mode 2: DEDICATED Full Purchase Mode
    if (!act.signed_token) {
      return {
        mode: 'DEDICATED',
        isActivated: false,
        isDatabaseConfigured: false,
        deviceId,
        error: 'هذه النسخة تتطلب تفعيل ترخيص الشراء الدائم قبل الاستخدام.',
      };
    }

    // Verify local token cryptographic signature & integrity
    const tokenCheck = LicenseServerService.verifyActivationToken(act.signed_token);
    if (!tokenCheck.valid || !tokenCheck.payload) {
      act.is_activated = false;
      act.signed_token = undefined;
      this.saveLocalActivation(act);
      return {
        mode: 'DEDICATED',
        isActivated: false,
        isDatabaseConfigured: false,
        deviceId,
        error: tokenCheck.error || 'رمز تفعيل الترخيص غير صالح أو تم التلاعب به.',
      };
    }

    // Check if device matches token device hash
    const expectedDeviceHash = LicenseServerService.hashSecret(deviceId);
    if (tokenCheck.payload.deviceIdHash !== expectedDeviceHash) {
      act.is_activated = false;
      act.signed_token = undefined;
      this.saveLocalActivation(act);
      return {
        mode: 'DEDICATED',
        isActivated: false,
        isDatabaseConfigured: false,
        deviceId,
        error: 'رمز التفعيل مخصص لجهاز آخر ولا يمكن استخدامه على هذا الجهاز.',
      };
    }

    // Offline Grace Period calculation (Default 30 days)
    const graceDays = act.offline_grace_days || this.DEFAULT_OFFLINE_GRACE_PERIOD_DAYS;
    const gracePeriodMs = graceDays * 24 * 60 * 60 * 1000;
    const lastValidatedTime = act.last_validated_at ? new Date(act.last_validated_at).getTime() : 0;
    const nowTime = Date.now();
    
    // Clock tampering check: if last validated time is in the future (>1 minute), force revalidation
    const isClockTampered = lastValidatedTime > nowTime + 60000;
    const elapsedSinceLastValidation = nowTime - lastValidatedTime;
    const isGracePeriodExpired = isClockTampered || elapsedSinceLastValidation > gracePeriodMs || elapsedSinceLastValidation < 0;

    const shouldRevalidate = options?.forceRevalidate || isGracePeriodExpired;

    if (shouldRevalidate) {
      try {
        const valRes = await LicenseServerService.validateLicense({
          token: act.signed_token,
          deviceId,
        });

        if (!valRes.valid) {
          // Explicit invalidation by server (revoked, suspended, expired, or deactivated seat)
          act.is_activated = false;
          act.signed_token = undefined;
          this.saveLocalActivation(act);

          return {
            mode: 'DEDICATED',
            isActivated: false,
            isDatabaseConfigured: false,
            deviceId,
            error: valRes.error || 'فشل التحقق من صلاحية الترخيص من خادم التراخيص المركزى.',
          };
        }

        // Successful revalidation
        const nowIso = new Date().toISOString();
        act.last_validated_at = nowIso;
        if (valRes.refreshedToken) {
          act.signed_token = valRes.refreshedToken;
        }
        if (valRes.companyName) {
          act.company_name = valRes.companyName;
        }
        this.saveLocalActivation(act);
      } catch (netErr) {
        if (isGracePeriodExpired) {
          return {
            mode: 'DEDICATED',
            isActivated: false,
            isDatabaseConfigured: false,
            deviceId,
            error: `انتهت فترة السماح للاستخدام دون اتصال (${graceDays} يوماً). يرجى الاتصال بالإنترنت للتحقق من صلاحية الترخيص.`,
          };
        }
        // Within grace period: offline usage permitted
      }
    }

    // Check if customer Supabase is configured
    const cloudCfg = SupabaseService.getConfig();
    const isDbConfigured = !!(
      (act.is_database_configured || (cloudCfg.mode === 'cloud' && cloudCfg.supabaseUrl && cloudCfg.supabaseAnonKey)) &&
      (act.customer_supabase_url || cloudCfg.supabaseUrl) &&
      (act.customer_supabase_anon_key || cloudCfg.supabaseAnonKey)
    );

    return {
      mode: 'DEDICATED',
      isActivated: true,
      isDatabaseConfigured: isDbConfigured,
      companyName: act.company_name || tokenCheck.payload.companyName,
      deviceId,
      dedicatedLicense: {
        companyName: act.company_name || tokenCheck.payload.companyName,
        status: 'active',
        licenseType: 'PERPETUAL',
        maxDevices: 1,
      },
    };
  }

  /**
   * Perform Dedicated Full Purchase activation for this desktop device.
   */
  static async activateDedicatedInstallation(data: {
    licenseKey: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    deviceName?: string;
  }): Promise<{ success: boolean; companyName?: string; error?: string }> {
    const deviceId = this.getDeviceId();
    const devName = data.deviceName || this.getDeviceName();

    const res = await LicenseServerService.activateLicense({
      licenseKey: data.licenseKey,
      deviceId,
      deviceName: devName,
    });

    if (!res.success || !res.token) {
      return { success: false, error: res.error || 'فشل تفعيل الترخيص' };
    }

    const hasDbConfig = !!(data.supabaseUrl && data.supabaseAnonKey);

    // Save activation data (secure signed token only, without plain license key on disk)
    const activationData: LocalActivationData = {
      commercial_mode: 'DEDICATED',
      is_activated: true,
      is_database_configured: hasDbConfig,
      signed_token: res.token,
      company_name: res.companyName,
      customer_supabase_url: data.supabaseUrl || undefined,
      customer_supabase_anon_key: data.supabaseAnonKey || undefined,
      last_validated_at: new Date().toISOString(),
      offline_grace_days: this.DEFAULT_OFFLINE_GRACE_PERIOD_DAYS,
    };

    this.saveLocalActivation(activationData);

    // Apply customer-dedicated Supabase configuration if provided
    if (hasDbConfig) {
      SupabaseService.saveConfig({
        mode: 'cloud',
        supabaseUrl: data.supabaseUrl!.trim(),
        supabaseAnonKey: data.supabaseAnonKey!.trim(),
        deviceName: devName,
      });
    }

    return {
      success: true,
      companyName: res.companyName,
    };
  }

  /**
   * Validate dedicated installation with license server revalidation.
   */
  static async validateDedicatedInstallation(): Promise<{
    success: boolean;
    valid: boolean;
    companyName?: string;
    error?: string;
  }> {
    const status = await this.checkStartupStatus({ forceRevalidate: true });
    return {
      success: status.isActivated,
      valid: status.isActivated,
      companyName: status.companyName,
      error: status.error,
    };
  }

  /**
   * Deactivate current device seat.
   */
  static async deactivateDedicatedDevice(): Promise<{ success: boolean; error?: string }> {
    const act = this.getLocalActivation();
    const deviceId = this.getDeviceId();

    if (act.signed_token) {
      await LicenseServerService.deactivateLicense({
        token: act.signed_token,
        deviceId,
      });
    }

    // Reset local activation
    act.is_activated = false;
    act.signed_token = undefined;
    this.saveLocalActivation(act);

    return { success: true };
  }
}

