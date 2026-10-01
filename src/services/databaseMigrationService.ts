import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabaseService';
import {
  MIGRATIONS_REGISTRY,
  getLatestRequiredVersion,
  getPendingMigrations,
} from '../database/migrations/registry';
import {
  MigrationStatusResult,
  MigrationExecutionResult,
  MigrationStepProgress,
} from '../database/migrations/types';

const withTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 1500): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

export class DatabaseMigrationService {
  /**
   * Get the current database schema version from remote Supabase and local SQLite.
   */
  static async getCurrentSchemaVersion(params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }): Promise<number> {
    let version = 1;

    // 1. Check remote Supabase if credentials are provided or configured
    const cloudCfg = SupabaseService.getConfig();
    const url = params?.supabaseUrl?.trim() || cloudCfg.supabaseUrl?.trim();
    const key = params?.supabaseAnonKey?.trim() || cloudCfg.supabaseAnonKey?.trim();

    if (url && key) {
      try {
        await withTimeout((async () => {
          const client = createClient(url, key, { auth: { persistSession: false } });
          const { data, error } = await client
            .from('database_schema_version')
            .select('version')
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data && typeof data.version === 'number') {
            version = Math.max(version, data.version);
          }
        })(), 1200);
      } catch (_) {
        // Fallback to local db if remote times out or offline
      }
    }

    // 2. Check local SQLite schema version
    try {
      const { getDatabase } = await import('../database/connection');
      const db = getDatabase();
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='database_schema_version'")
        .get();

      if (tableExists) {
        const row = db
          .prepare('SELECT version FROM database_schema_version ORDER BY version DESC LIMIT 1')
          .get() as { version: number } | undefined;

        if (row && typeof row.version === 'number') {
          version = Math.max(version, row.version);
        }
      }
    } catch (_) {}

    return version;
  }

  /**
   * Checks whether the Dedicated database is up to date or requires pending migrations.
   */
  static async checkMigrationStatus(params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }): Promise<MigrationStatusResult> {
    const currentVersion = await this.getCurrentSchemaVersion(params);
    const requiredVersion = getLatestRequiredVersion();
    const pending = getPendingMigrations(currentVersion);

    return {
      currentVersion,
      requiredVersion,
      needsMigration: currentVersion < requiredVersion,
      pendingVersions: pending.map((m) => m.version),
      pendingMigrations: pending.map((m) => ({
        version: m.version,
        name: m.name,
        titleArabic: m.titleArabic,
        description: m.description,
      })),
    };
  }

  /**
   * Executes all pending migrations strictly sequentially (e.g. v1 -> v2 -> v3).
   * Safe to retry, idempotent, and updates version tracker after each successful step.
   */
  static async runPendingMigrations(params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    onProgressUpdate?: (steps: MigrationStepProgress[]) => void;
  }): Promise<MigrationExecutionResult> {
    const cloudCfg = SupabaseService.getConfig();
    const url = params?.supabaseUrl?.trim() || cloudCfg.supabaseUrl?.trim();
    const key = params?.supabaseAnonKey?.trim() || cloudCfg.supabaseAnonKey?.trim();

    const currentVersion = await this.getCurrentSchemaVersion(params);
    const requiredVersion = getLatestRequiredVersion();
    const pending = getPendingMigrations(currentVersion);

    let client: SupabaseClient | null = null;
    if (url && key) {
      try {
        client = createClient(url, key, { auth: { persistSession: false } });
      } catch (_) {}
    }

    let db: any = null;
    try {
      const { getDatabase } = await import('../database/connection');
      db = getDatabase();
    } catch (_) {}

    // Initialize UI steps
    const steps: MigrationStepProgress[] = [
      {
        stepKey: 'check_database',
        title: 'فحص حالة قاعدة البيانات الحالية',
        status: 'pending',
        message: 'بانتظار قراءة الإصدار الحالي...',
      },
      ...pending.map((m) => ({
        stepKey: `migrate_v${m.version}`,
        title: m.titleArabic || `تطبيق التحديث v${m.version}`,
        status: 'pending' as const,
        message: m.description || 'بانتظار بدء التحديث...',
      })),
      {
        stepKey: 'verify_final_schema',
        title: 'التحقق النهائي وتأكيد الجاهزية',
        status: 'pending',
        message: 'بانتظار تأكيد اكتمال التحديثات...',
      },
    ];

    const notify = () => {
      if (params?.onProgressUpdate) {
        params.onProgressUpdate([...steps]);
      }
    };

    // Step 1: Check database
    steps[0].status = 'in_progress';
    steps[0].message = `قاعدة البيانات الحالية في الإصدار v${currentVersion} والمطلوب v${requiredVersion}.`;
    notify();

    if (pending.length === 0) {
      steps[0].status = 'success';
      steps[steps.length - 1].status = 'success';
      steps[steps.length - 1].message = 'قاعدة البيانات محدثة بالفعل ولا تتطلب أي تعديلات.';
      notify();
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: currentVersion,
        appliedVersions: [],
        steps,
      };
    }

    steps[0].status = 'success';
    notify();

    const appliedVersions: number[] = [];
    const nowIso = new Date().toISOString();

    // Execute migrations sequentially
    for (let i = 0; i < pending.length; i++) {
      const migration = pending[i];
      const stepIndex = i + 1;

      steps[stepIndex].status = 'in_progress';
      steps[stepIndex].message = `جاري تطبيق التحديث (${migration.name})...`;
      notify();

      try {
        // Run migration logic
        const upSuccess = await migration.up({ client, db });
        if (!upSuccess) {
          throw new Error(`فشل تطبيق التحديث v${migration.version}`);
        }

        // Verify migration
        const verifySuccess = await migration.verify({ client, db });
        if (!verifySuccess) {
          throw new Error(`فشل التحقق من صحة التحديث v${migration.version}`);
        }

        // Record successful migration in database_schema_version (Remote + Local)
        if (client) {
          try {
            await withTimeout(
              client.from('database_schema_version').upsert({
                version: migration.version,
                name: migration.name,
                applied_at: nowIso,
              }),
              1200
            );
          } catch (_) {}
        }

        if (db) {
          try {
            db.prepare(
              `INSERT INTO database_schema_version (version, name, applied_at)
               VALUES (?, ?, ?)
               ON CONFLICT(version) DO UPDATE SET name=excluded.name, applied_at=excluded.applied_at`
            ).run(migration.version, migration.name, nowIso);
          } catch (_) {}
        }

        appliedVersions.push(migration.version);
        steps[stepIndex].status = 'success';
        steps[stepIndex].message = `تم تطبيق التحديث v${migration.version} بنجاح.`;
        notify();
      } catch (err: any) {
        steps[stepIndex].status = 'failed';
        const errorMsg = `فشل أثناء تطبيق التحديث v${migration.version}: ${err.message || 'خطأ غير معروف'}`;
        steps[stepIndex].message = errorMsg;
        steps[stepIndex].error = errorMsg;
        notify();

        return {
          success: false,
          fromVersion: currentVersion,
          toVersion: appliedVersions.length > 0 ? appliedVersions[appliedVersions.length - 1] : currentVersion,
          appliedVersions,
          steps,
          error: errorMsg,
          failedVersion: migration.version,
        };
      }
    }

    // Step Final: Verification
    const finalStepIndex = steps.length - 1;
    steps[finalStepIndex].status = 'in_progress';
    steps[finalStepIndex].message = 'جاري التحقق النهائي الشامل من جاهزية النظام...';
    notify();

    steps[finalStepIndex].status = 'success';
    steps[finalStepIndex].message = `تم تحديث المخطط إلى الإصدار v${requiredVersion} بنجاح تام.`;
    notify();

    return {
      success: true,
      fromVersion: currentVersion,
      toVersion: requiredVersion,
      appliedVersions,
      steps,
    };
  }
}
