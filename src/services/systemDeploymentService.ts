import path from 'path';
import fs from 'fs';
import { getDatabase } from '../database/connection';
import { SystemDeploymentConfig, DedicatedLicenseConfig, AppUser, DeploymentMode, CloudConfig } from '../types';
import { SupabaseService } from './supabaseService';

let cachedDeploymentConfig: SystemDeploymentConfig | null = null;

function getSystemConfigPath(): string {
  try {
    if (process.versions && process.versions.electron) {
      const { app } = require('electron');
      const userData = app.getPath('userData');
      const dir = path.join(userData, 'data');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, 'system_deployment.json');
    }
  } catch (_) {}

  const localDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return path.join(localDir, 'system_deployment.json');
}

export class SystemDeploymentService {
  /**
   * Enforce Super Admin permissions for sensitive system and infrastructure mutations.
   */
  static assertSuperAdmin(user: AppUser | null): void {
    if (!user || user.role !== 'SUPER_ADMIN') {
      const error = new Error('غير مصرح لك بتنفيذ هذه العملية. هذه الصلاحية خاصة بمسؤول النظام العام فقط (403 Forbidden).');
      (error as any).status = 403;
      throw error;
    }
  }

  /**
   * Retrieve current system deployment configuration.
   */
  static getConfig(): SystemDeploymentConfig {
    if (cachedDeploymentConfig) return cachedDeploymentConfig;

    // 1. Try file cache
    const configPath = getSystemConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        const data = fs.readFileSync(configPath, 'utf8');
        cachedDeploymentConfig = JSON.parse(data);
        return cachedDeploymentConfig!;
      } catch (err) {
        console.warn('Could not parse system_deployment.json, falling back:', err);
      }
    }

    // 2. Try legacy cloud config for seamless backward-compatibility
    const legacyCloud = SupabaseService.getConfig();
    const isCloud = legacyCloud.mode === 'cloud';

    cachedDeploymentConfig = {
      deployment_mode: isCloud ? 'saas' : 'local_dev',
      database_type: isCloud ? 'hosted_supabase' : 'local_sqlite',
      database_url: legacyCloud.supabaseUrl || '',
      database_anon_key: legacyCloud.supabaseAnonKey || '',
      device_name: legacyCloud.deviceName || 'بوابة 1',
      dedicated_license: null,
    };

    return cachedDeploymentConfig;
  }

  /**
   * Save system deployment configuration (Super Admin only).
   */
  static saveConfig(config: SystemDeploymentConfig): { success: boolean; error?: string } {
    try {
      cachedDeploymentConfig = { ...config };
      const configPath = getSystemConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(cachedDeploymentConfig, null, 2), 'utf8');

      // Keep legacy CloudConfig in sync for backward compatibility
      const legacyCloudMode: 'local' | 'cloud' =
        config.deployment_mode === 'saas' || config.deployment_mode === 'dedicated' ? 'cloud' : 'local';

      SupabaseService.saveConfig({
        mode: legacyCloudMode,
        supabaseUrl: config.database_url,
        supabaseAnonKey: config.database_anon_key,
        deviceName: config.device_name || 'بوابة 1',
      });

      // Also persist to SQLite table if available
      try {
        const db = getDatabase();
        const nowIso = new Date().toISOString();
        db.prepare(`
          INSERT INTO system_deployment_config (id, deployment_mode, database_type, database_url, database_anon_key, device_name, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            deployment_mode = EXCLUDED.deployment_mode,
            database_type = EXCLUDED.database_type,
            database_url = EXCLUDED.database_url,
            database_anon_key = EXCLUDED.database_anon_key,
            device_name = EXCLUDED.device_name,
            updated_at = EXCLUDED.updated_at
        `).run(
          config.deployment_mode,
          config.database_type,
          config.database_url,
          config.database_anon_key,
          config.device_name,
          nowIso
        );
      } catch (dbErr) {
        console.warn('Could not write system_deployment_config to sqlite table:', dbErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error saving system deployment config:', err);
      return { success: false, error: err.message || 'فشل حفظ إعدادات النظام' };
    }
  }

  /**
   * Retrieve dedicated license configuration.
   */
  static getDedicatedLicense(): DedicatedLicenseConfig | null {
    const config = this.getConfig();
    if (config.dedicated_license) return config.dedicated_license;

    try {
      const db = getDatabase();
      const row = db.prepare(`SELECT * FROM dedicated_licenses ORDER BY id DESC LIMIT 1`).get();
      if (row) return row as DedicatedLicenseConfig;
    } catch (_) {}

    return null;
  }

  /**
   * Save dedicated license (Super Admin only).
   */
  static saveDedicatedLicense(license: DedicatedLicenseConfig): { success: boolean; error?: string } {
    try {
      const current = this.getConfig();
      current.dedicated_license = license;
      this.saveConfig(current);

      const db = getDatabase();
      const nowIso = new Date().toISOString();
      db.prepare(`
        INSERT INTO dedicated_licenses (company_id, company_name, license_key, status, issued_at, expires_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(license_key) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          status = EXCLUDED.status,
          expires_at = EXCLUDED.expires_at,
          notes = EXCLUDED.notes
      `).run(
        license.company_id || null,
        license.company_name,
        license.license_key,
        license.status || 'active',
        license.issued_at || nowIso,
        license.expires_at || null,
        license.notes || null
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error saving dedicated license:', err);
      return { success: false, error: err.message || 'فشل حفظ بيانات ترخيص التثبيت المخصص' };
    }
  }
}
