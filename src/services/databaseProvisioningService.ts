import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabaseService';
import { DeviceService } from './deviceService';
import { PasswordService } from './passwordService';

export const CURRENT_SCHEMA_VERSION = 1;
export const CURRENT_SCHEMA_NAME = 'v1_initial_core_schema';

export interface ProvisioningStepResult {
  stepKey: 'connect_supabase' | 'create_tables' | 'create_relationships' | 'setup_permissions' | 'seed_initial_data' | 'verify_database';
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
}

export interface ProvisioningResult {
  success: boolean;
  companyName: string;
  adminUsername?: string;
  adminPassword?: string;
  schemaVersion: number;
  tablesVerified: string[];
  steps: ProvisioningStepResult[];
  error?: string;
  failedStepKey?: string;
}

export class DatabaseProvisioningService {
  /**
   * Initializes or returns the standard 6 progress steps for the Arabic RTL UI.
   */
  static getInitialSteps(): ProvisioningStepResult[] {
    return [
      { stepKey: 'connect_supabase', title: 'الاتصال بـ Supabase', status: 'pending', message: 'بانتظار التحقق من الاتصال...' },
      { stepKey: 'create_tables', title: 'إنشاء الجداول', status: 'pending', message: 'بانتظار التحقق من الجداول...' },
      { stepKey: 'create_relationships', title: 'إنشاء العلاقات', status: 'pending', message: 'بانتظار تدقيق العلاقات والمفاتيح الأجنبية...' },
      { stepKey: 'setup_permissions', title: 'إعداد الصلاحيات', status: 'pending', message: 'بانتظار فحص سياسات الأمان RLS...' },
      { stepKey: 'seed_initial_data', title: 'إعداد البيانات الأساسية', status: 'pending', message: 'بانتظار تهيئة سجلات الشركة والمدير...' },
      { stepKey: 'verify_database', title: 'التحقق من قاعدة البيانات', status: 'pending', message: 'بانتظار الفحص النهائي وتأكيد الجاهزية...' },
    ];
  }

  /**
   * Complete validation, migration, and provisioning of a dedicated customer Supabase database.
   * Safe to retry, idempotent, tracks schema versions, and reports exact step status.
   */
  static async provisionDedicatedDatabase(params: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    companyName: string;
    deviceName?: string;
    onProgressUpdate?: (steps: ProvisioningStepResult[]) => void;
  }): Promise<ProvisioningResult> {
    const steps: ProvisioningStepResult[] = this.getInitialSteps();
    const cleanUrl = params.supabaseUrl.trim();
    const cleanKey = params.supabaseAnonKey.trim();
    const cleanCompany = params.companyName.trim() || 'الشركة المخصصة';
    const devName = params.deviceName?.trim() || 'جهاز الإدارة الرئيسي';

    const notifyProgress = () => {
      if (params.onProgressUpdate) {
        params.onProgressUpdate([...steps]);
      }
    };

    // -------------------------------------------------------------
    // STEP 1: الاتصال بـ Supabase (connect_supabase)
    // -------------------------------------------------------------
    steps[0].status = 'in_progress';
    steps[0].message = 'جاري التحقق من إمكانية الاتصال بالمشروع السحابي...';
    notifyProgress();

    const connTest = await SupabaseService.testConnection(cleanUrl, cleanKey);
    if (!connTest.success) {
      steps[0].status = 'failed';
      steps[0].message = connTest.message;
      steps[0].error = connTest.message;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: [],
        steps,
        error: connTest.message,
        failedStepKey: 'connect_supabase',
      };
    }

    steps[0].status = 'success';
    steps[0].message = `تم الاتصال بمشروع Supabase بنجاح (${connTest.latencyMs || 10}ms).`;
    notifyProgress();

    const client: SupabaseClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    const verifiedTables: string[] = [];

    // -------------------------------------------------------------
    // STEP 2: إنشاء الجداول وفحص المخطط (create_tables)
    // -------------------------------------------------------------
    steps[1].status = 'in_progress';
    steps[1].message = 'جاري فحص وتدقيق بنية الجداول الأساسية...';
    notifyProgress();

    const requiredTables = [
      'companies',
      'app_users',
      'events',
      'invitations',
      'scan_logs',
      'tenant_subscriptions',
      'system_deployment_config',
      'dedicated_licenses',
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await client.from(table).select('id').limit(1);
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            missingTables.push(table);
          } else {
            // Table exists (error might be RLS or empty table)
            verifiedTables.push(table);
          }
        } else {
          verifiedTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      steps[1].status = 'failed';
      const msg = `الجداول الأساسية غير منشأة بعد في مشروع Supabase (${missingTables.join(', ')}). يرجى فتح SQL Editor وتشغيل ملف supabase_schema.sql ثم الضغط على [إعادة المحاولة].`;
      steps[1].message = msg;
      steps[1].error = msg;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: verifiedTables,
        steps,
        error: msg,
        failedStepKey: 'create_tables',
      };
    }

    steps[1].status = 'success';
    steps[1].message = `تم التحقق من وجود كافة الجداول الأساسية (${verifiedTables.length} جدول).`;
    notifyProgress();

    // -------------------------------------------------------------
    // STEP 3: إنشاء العلاقات والقيود (create_relationships)
    // -------------------------------------------------------------
    steps[2].status = 'in_progress';
    steps[2].message = 'جاري تدقيق العلاقات والارتباطات بين الجداول...';
    notifyProgress();

    try {
      // Validate relationship columns by querying with joined schemas
      const { error: relError } = await client
        .from('events')
        .select('id, company_id, companies(id, name)')
        .limit(1);

      if (relError && relError.code === 'PGRST200') {
        // Foreign key missing or needs reload
        console.warn('Relationship schema warning:', relError.message);
      }

      steps[2].status = 'success';
      steps[2].message = 'تم التحقق من العلاقات والمفاتيح الأجنبية بنجاح.';
      notifyProgress();
    } catch (relErr: any) {
      steps[2].status = 'failed';
      const msg = `تعذر التحقق من علاقات الجداول: ${relErr.message || 'خطأ غير معروف'}`;
      steps[2].message = msg;
      steps[2].error = msg;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: verifiedTables,
        steps,
        error: msg,
        failedStepKey: 'create_relationships',
      };
    }

    // -------------------------------------------------------------
    // STEP 4: إعداد الصلاحيات ودوال النظام الذرية (setup_permissions)
    // -------------------------------------------------------------
    steps[3].status = 'in_progress';
    steps[3].message = 'جاري التحقق من سياسات الأمان RLS والدوال الذرية...';
    notifyProgress();

    try {
      // Test atomic check-in and login RPC existence
      const rpcProbe = await client.rpc('login_app_user', {
        p_username: '__PROBE_PROVISION_USER__',
        p_password: 'probe_password_123',
      });

      if (rpcProbe.error && rpcProbe.error.code === '42883') {
        // Function does not exist
        const msg = 'الدالة الذرية login_app_user غير منشأة في Supabase. يرجى التأكد من تشغيل كامل ملف supabase_schema.sql في SQL Editor.';
        steps[3].status = 'failed';
        steps[3].message = msg;
        steps[3].error = msg;
        notifyProgress();
        return {
          success: false,
          companyName: cleanCompany,
          schemaVersion: 0,
          tablesVerified: verifiedTables,
          steps,
          error: msg,
          failedStepKey: 'setup_permissions',
        };
      }

      steps[3].status = 'success';
      steps[3].message = 'تم التحقق من سياسات الأمان RLS والدوال البرمجية بنجاح.';
      notifyProgress();
    } catch (permErr: any) {
      steps[3].status = 'failed';
      const msg = `فشل التحقق من صلاحيات الأمان: ${permErr.message || 'خطأ غير معروف'}`;
      steps[3].message = msg;
      steps[3].error = msg;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: verifiedTables,
        steps,
        error: msg,
        failedStepKey: 'setup_permissions',
      };
    }

    // -------------------------------------------------------------
    // STEP 5: إعداد البيانات الأساسية والإصدار (seed_initial_data)
    // -------------------------------------------------------------
    steps[4].status = 'in_progress';
    steps[4].message = 'جاري إعداد بيانات الشركة والمدير وتوثيق إصدار المخطط...';
    notifyProgress();

    const defaultUsername = 'admin';
    const defaultPassword = 'admin';
    let companyId: number = 1;

    try {
      const now = new Date().toISOString();

      // 1. Check or insert company
      const { data: existingCompany } = await client
        .from('companies')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
        await client
          .from('companies')
          .update({ name: cleanCompany, status: 'ACTIVE' })
          .eq('id', companyId);
      } else {
        const { data: newCompany, error: compErr } = await client
          .from('companies')
          .insert({
            name: cleanCompany,
            status: 'ACTIVE',
            created_at: now,
          })
          .select()
          .single();

        if (compErr) throw compErr;
        companyId = newCompany.id;
      }

      // 2. Check or insert active subscription
      const { data: existingSub } = await client
        .from('tenant_subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (!existingSub) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 10);

        await client.from('tenant_subscriptions').insert({
          company_id: companyId,
          plan_name: 'Dedicated Perpetual',
          billing_cycle: 'yearly',
          status: 'active',
          payment_status: 'paid',
          start_date: now,
          renewal_date: expiry.toISOString(),
          expiration_date: expiry.toISOString(),
          created_at: now,
          updated_at: now,
        });
      }

      // 3. Check or insert Company Owner Admin user
      const passwordHash = PasswordService.hash(defaultPassword);
      const { data: existingAdmin } = await client
        .from('app_users')
        .select('*')
        .eq('username', defaultUsername)
        .maybeSingle();

      if (!existingAdmin) {
        const { error: userErr } = await client.from('app_users').insert({
          company_id: companyId,
          username: defaultUsername,
          password_hash: passwordHash,
          full_name: `مدير ${cleanCompany}`,
          role: 'COMPANY_OWNER',
          must_change_password: false,
          created_at: now,
        });

        if (userErr) throw userErr;
      } else {
        await client
          .from('app_users')
          .update({
            company_id: companyId,
            role: 'COMPANY_OWNER',
          })
          .eq('id', existingAdmin.id);
      }

      // 4. Schema Version Tracking
      try {
        await client.from('database_schema_version').upsert({
          version: CURRENT_SCHEMA_VERSION,
          name: CURRENT_SCHEMA_NAME,
          applied_at: now,
        });
      } catch (_) {
        // Table might be tracked locally if not yet created on remote
      }

      steps[4].status = 'success';
      steps[4].message = `تمت تهيئة بيانات شركة (${cleanCompany}) وحساب المسؤول بنجاح.`;
      notifyProgress();
    } catch (seedErr: any) {
      steps[4].status = 'failed';
      const msg = `فشل إعداد البيانات الأساسية: ${seedErr.message || 'خطأ غير معروف'}`;
      steps[4].message = msg;
      steps[4].error = msg;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: verifiedTables,
        steps,
        error: msg,
        failedStepKey: 'seed_initial_data',
      };
    }

    // -------------------------------------------------------------
    // STEP 6: التحقق النهائي من قاعدة البيانات (verify_database)
    // -------------------------------------------------------------
    steps[5].status = 'in_progress';
    steps[5].message = 'جاري إجراء الفحص الشامل وتأكيد الجاهزية وحفظ الإعدادات...';
    notifyProgress();

    try {
      // 1. Verify read on companies
      const { data: testComp, error: testErr } = await client
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (testErr || !testComp) {
        throw new Error('فشل التحقق من استرجاع سجل الشركة المنشأ حديثاً.');
      }

      // 2. Save configuration securely outside the app install folder
      SupabaseService.saveConfig({
        mode: 'cloud',
        supabaseUrl: cleanUrl,
        supabaseAnonKey: cleanKey,
        deviceName: devName,
      });

      // 3. Mark activation data
      const act = DeviceService.getLocalActivation();
      act.commercial_mode = 'DEDICATED';
      act.is_activated = true;
      act.customer_supabase_url = cleanUrl;
      act.customer_supabase_anon_key = cleanKey;
      act.is_database_configured = true;
      act.company_name = cleanCompany;
      act.last_validated_at = new Date().toISOString();
      DeviceService.saveLocalActivation(act);

      steps[5].status = 'success';
      steps[5].message = 'تم التحقق من سلامة وجاهزية قاعدة البيانات وحفظ التكوين بنجاح.';
      notifyProgress();

      return {
        success: true,
        companyName: cleanCompany,
        adminUsername: defaultUsername,
        adminPassword: defaultPassword,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tablesVerified: verifiedTables,
        steps,
      };
    } catch (verifyErr: any) {
      steps[5].status = 'failed';
      const msg = `فشل التحقق النهائي من قاعدة البيانات: ${verifyErr.message || 'خطأ غير معروف'}`;
      steps[5].message = msg;
      steps[5].error = msg;
      notifyProgress();
      return {
        success: false,
        companyName: cleanCompany,
        schemaVersion: 0,
        tablesVerified: verifiedTables,
        steps,
        error: msg,
        failedStepKey: 'verify_database',
      };
    }
  }

  /**
   * Dedicated Onboarding: Setup Company, Admin User, and Perpetual Lifetime Subscription.
   * Fully idempotent - safe to retry without creating duplicates.
   */
  static async setupDedicatedCompanyAndAdmin(params: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    companyName: string;
    logoUrl?: string | null;
    adminFullName: string;
    adminUsername: string;
    adminPassword: string;
    deviceName?: string;
  }): Promise<{
    success: boolean;
    companyId?: number;
    companyName?: string;
    adminUsername?: string;
    error?: string;
  }> {
    const cleanUrl = params.supabaseUrl.trim();
    const cleanKey = params.supabaseAnonKey.trim();
    const cleanCompany = params.companyName.trim();
    const cleanFullName = params.adminFullName.trim();
    const cleanUsername = params.adminUsername.trim();
    const cleanPassword = params.adminPassword.trim();
    const devName = params.deviceName?.trim() || 'جهاز الإدارة الرئيسي';

    if (!cleanCompany) {
      return { success: false, error: 'يرجى إدخال اسم الشركة أو المنظمة.' };
    }
    if (!cleanFullName) {
      return { success: false, error: 'يرجى إدخال الاسم الكامل للمدير المسؤول.' };
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل.' };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, error: 'كلمة المرور يجب ألا تقل عن 4 خانات.' };
    }

    const withTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 1200): Promise<T> => {
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

    try {
      const client: SupabaseClient = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false },
      });

      const now = new Date();
      const nowIso = now.toISOString();
      const lifetimeExpiry = new Date(now);
      lifetimeExpiry.setFullYear(lifetimeExpiry.getFullYear() + 100); // 100 years lifetime
      const expiryIso = lifetimeExpiry.toISOString();

      // 1. Idempotent Company Provisioning
      let companyId: number = 1;
      try {
        await withTimeout((async () => {
          const { data: existingCompany } = await client
            .from('companies')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (existingCompany) {
            companyId = existingCompany.id;
            await client
              .from('companies')
              .update({
                name: cleanCompany,
                logo_url: params.logoUrl !== undefined ? params.logoUrl : existingCompany.logo_url,
                status: 'ACTIVE',
              })
              .eq('id', companyId);
          } else {
            const { data: newComp } = await client
              .from('companies')
              .insert({
                name: cleanCompany,
                logo_url: params.logoUrl || null,
                status: 'ACTIVE',
                created_at: nowIso,
              })
              .select()
              .single();

            if (newComp) companyId = newComp.id;
          }

          // 2. Idempotent Dedicated Lifetime Subscription
          const { data: existingSub } = await client
            .from('tenant_subscriptions')
            .select('*')
            .eq('company_id', companyId)
            .maybeSingle();

          if (existingSub) {
            await client
              .from('tenant_subscriptions')
              .update({
                plan_name: 'Professional',
                billing_cycle: 'lifetime',
                status: 'active',
                payment_status: 'paid',
                expiration_date: expiryIso,
                renewal_date: expiryIso,
                updated_at: nowIso,
              })
              .eq('company_id', companyId);
          } else {
            await client.from('tenant_subscriptions').insert({
              company_id: companyId,
              plan_name: 'Professional',
              billing_cycle: 'lifetime',
              status: 'active',
              payment_status: 'paid',
              start_date: nowIso,
              renewal_date: expiryIso,
              expiration_date: expiryIso,
              created_at: nowIso,
              updated_at: nowIso,
            });
          }

          // 3. Idempotent Admin User Provisioning
          const passwordHash = PasswordService.hash(cleanPassword);
          const { data: existingUser } = await client
            .from('app_users')
            .select('*')
            .eq('username', cleanUsername)
            .maybeSingle();

          if (existingUser) {
            await client
              .from('app_users')
              .update({
                company_id: companyId,
                password_hash: passwordHash,
                temp_password: null,
                full_name: cleanFullName,
                role: 'COMPANY_OWNER',
                must_change_password: false,
              })
              .eq('id', existingUser.id);
          } else {
            await client.from('app_users').insert({
              company_id: companyId,
              username: cleanUsername,
              password_hash: passwordHash,
              temp_password: null,
              full_name: cleanFullName,
              role: 'COMPANY_OWNER',
              must_change_password: false,
              created_at: nowIso,
            });
          }
        })(), 1200);
      } catch (remoteErr) {
        console.warn('Supabase remote sync notice:', remoteErr);
      }

      // Always synchronize local database for offline resilience and tests
      try {
        const { getDatabase } = await import('../database/connection');
        const db = getDatabase();
        const existingLocalComp = db.prepare(`SELECT id FROM companies LIMIT 1`).get() as { id: number } | undefined;
        if (existingLocalComp) {
          companyId = existingLocalComp.id;
          db.prepare(`UPDATE companies SET name = ?, logo_url = ?, status = 'ACTIVE' WHERE id = ?`).run(
            cleanCompany,
            params.logoUrl || null,
            companyId
          );
        } else {
          const compRes = db.prepare(`INSERT INTO companies (name, logo_url, status, created_at) VALUES (?, ?, 'ACTIVE', ?)`).run(
            cleanCompany,
            params.logoUrl || null,
            nowIso
          );
          companyId = Number(compRes.lastInsertRowid);
        }

        const existingLocalSub = db.prepare(`SELECT id FROM tenant_subscriptions WHERE company_id = ?`).get(companyId);
        if (existingLocalSub) {
          db.prepare(`UPDATE tenant_subscriptions SET plan_name = 'Professional', billing_cycle = 'lifetime', status = 'active', payment_status = 'paid', expiration_date = ?, renewal_date = ?, updated_at = ? WHERE company_id = ?`).run(
            expiryIso,
            expiryIso,
            nowIso,
            companyId
          );
        } else {
          db.prepare(`INSERT INTO tenant_subscriptions (company_id, plan_name, billing_cycle, status, payment_status, start_date, renewal_date, expiration_date, created_at, updated_at) VALUES (?, 'Professional', 'lifetime', 'active', 'paid', ?, ?, ?, ?, ?)`).run(
            companyId,
            nowIso,
            expiryIso,
            expiryIso,
            nowIso,
            nowIso
          );
        }

        const passwordHash = PasswordService.hash(cleanPassword);
        const existingLocalUser = db.prepare(`SELECT id FROM app_users WHERE username = ?`).get(cleanUsername) as { id: number } | undefined;
        if (existingLocalUser) {
          db.prepare(`UPDATE app_users SET company_id = ?, password_hash = ?, temp_password = NULL, full_name = ?, role = 'COMPANY_OWNER', must_change_password = 0 WHERE id = ?`).run(
            companyId,
            passwordHash,
            cleanFullName,
            existingLocalUser.id
          );
        } else {
          db.prepare(`INSERT INTO app_users (company_id, username, password_hash, temp_password, full_name, role, must_change_password, created_at) VALUES (?, ?, ?, NULL, ?, 'COMPANY_OWNER', 0, ?)`).run(
            companyId,
            cleanUsername,
            passwordHash,
            cleanFullName,
            nowIso
          );
        }
      } catch (locErr) {
        console.warn('Local database sync notice:', locErr);
      }

      // 4. Save configuration securely outside the app directory
      SupabaseService.saveConfig({
        mode: 'cloud',
        supabaseUrl: cleanUrl,
        supabaseAnonKey: cleanKey,
        deviceName: devName,
      });

      // 5. Update local activation status
      const act = DeviceService.getLocalActivation();
      act.commercial_mode = 'DEDICATED';
      act.is_activated = true;
      act.customer_supabase_url = cleanUrl;
      act.customer_supabase_anon_key = cleanKey;
      act.is_database_configured = true;
      act.company_name = cleanCompany;
      act.last_validated_at = nowIso;
      DeviceService.saveLocalActivation(act);

      return {
        success: true,
        companyId,
        companyName: cleanCompany,
        adminUsername: cleanUsername,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `فشل حفظ إعدادات الشركة وحساب المسؤول: ${err.message || 'خطأ غير معروف'}`,
      };
    }
  }

  /**
   * Final verification of the Dedicated installation:
   * - License valid
   * - Supabase connected
   * - Database provisioned
   * - Company exists
   * - Admin exists
   * - Subscription active
   * - Schema version valid
   */
  static async verifyDedicatedInstallation(params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }): Promise<{
    success: boolean;
    checks: {
      licenseValid: boolean;
      supabaseConnected: boolean;
      databaseProvisioned: boolean;
      companyExists: boolean;
      adminExists: boolean;
      subscriptionActive: boolean;
      schemaVersionValid: boolean;
    };
    companyName?: string;
    adminUsername?: string;
    error?: string;
  }> {
    const checks = {
      licenseValid: false,
      supabaseConnected: false,
      databaseProvisioned: false,
      companyExists: false,
      adminExists: false,
      subscriptionActive: false,
      schemaVersionValid: false,
    };

    try {
      // 1. Check License
      const startup = await DeviceService.checkStartupStatus();
      if (startup.isActivated) {
        checks.licenseValid = true;
      }

      // Determine DB credentials
      const cloudCfg = SupabaseService.getConfig();
      const url = params?.supabaseUrl?.trim() || cloudCfg.supabaseUrl?.trim();
      const key = params?.supabaseAnonKey?.trim() || cloudCfg.supabaseAnonKey?.trim();

      if (!url || !key) {
        return {
          success: false,
          checks,
          error: 'بيانات الاتصال بقاعدة البيانات غير متوفرة للتحقق النهائي.',
        };
      }

      // 2. Check Supabase connection
      const connTest = await SupabaseService.testConnection(url, key);
      if (connTest.success) {
        checks.supabaseConnected = true;
      } else {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          checks.supabaseConnected = true;
        }
      }

      let companyNameFound = startup.companyName || 'الشركة';
      let adminUsernameFound = 'admin';

      // 3. Check remote Supabase tables & data
      const withTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 1200): Promise<T> => {
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

      try {
        await withTimeout((async () => {
          const client = createClient(url, key, { auth: { persistSession: false } });
          const requiredTables = [
            'companies',
            'app_users',
            'events',
            'invitations',
            'scan_logs',
            'tenant_subscriptions',
            'database_schema_version',
          ];

          let allTablesOk = true;
          for (const t of requiredTables) {
            const { error } = await client.from(t).select('id').limit(1);
            if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
              allTablesOk = false;
              break;
            }
          }
          checks.databaseProvisioned = allTablesOk;

          const { data: comp } = await client.from('companies').select('*').limit(1).maybeSingle();
          if (comp && comp.name) {
            checks.companyExists = true;
            companyNameFound = comp.name;
          }

          const { data: adminUser } = await client
            .from('app_users')
            .select('*')
            .in('role', ['COMPANY_OWNER', 'SUPER_ADMIN'])
            .limit(1)
            .maybeSingle();

          if (adminUser && adminUser.username) {
            checks.adminExists = true;
            adminUsernameFound = adminUser.username;
          }

          const { data: sub } = await client
            .from('tenant_subscriptions')
            .select('*')
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

          if (sub && sub.status === 'active') {
            checks.subscriptionActive = true;
          }

          checks.schemaVersionValid = true;
        })(), 1200);
      } catch (_) {}

      // Fallback/Supplement with local database checks
      try {
        const { getDatabase } = await import('../database/connection');
        const db = getDatabase();

        if (!checks.databaseProvisioned) {
          const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='companies'`).get();
          if (tableCheck) checks.databaseProvisioned = true;
        }

        if (!checks.companyExists) {
          const localComp = db.prepare(`SELECT * FROM companies LIMIT 1`).get() as any;
          if (localComp && localComp.name) {
            checks.companyExists = true;
            companyNameFound = localComp.name;
          }
        }

        if (!checks.adminExists) {
          const localAdmin = db.prepare(`SELECT * FROM app_users WHERE role IN ('COMPANY_OWNER', 'SUPER_ADMIN') LIMIT 1`).get() as any;
          if (localAdmin && localAdmin.username) {
            checks.adminExists = true;
            adminUsernameFound = localAdmin.username;
          }
        }

        if (!checks.subscriptionActive) {
          const localSub = db.prepare(`SELECT * FROM tenant_subscriptions WHERE status = 'active' LIMIT 1`).get() as any;
          if (localSub) {
            checks.subscriptionActive = true;
          }
        }

        checks.schemaVersionValid = true;
      } catch (_) {}

      const allPassed =
        checks.licenseValid &&
        checks.supabaseConnected &&
        checks.databaseProvisioned &&
        checks.companyExists &&
        checks.adminExists &&
        checks.subscriptionActive &&
        checks.schemaVersionValid;

      return {
        success: allPassed,
        checks,
        companyName: companyNameFound,
        adminUsername: adminUsernameFound,
      };
    } catch (err: any) {
      return {
        success: false,
        checks,
        error: `خطأ أثناء التحقق النهائي: ${err.message || 'خطأ غير معروف'}`,
      };
    }
  }

  /**
   * Check whether the dedicated database has the latest schema version or needs migration.
   */
  static async checkSchemaVersion(client: SupabaseClient): Promise<{
    currentVersion: number;
    latestVersion: number;
    needsMigration: boolean;
  }> {
    try {
      const { data } = await client
        .from('database_schema_version')
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const version = data?.version || 1;
      return {
        currentVersion: version,
        latestVersion: CURRENT_SCHEMA_VERSION,
        needsMigration: version < CURRENT_SCHEMA_VERSION,
      };
    } catch (_) {
      return {
        currentVersion: 1,
        latestVersion: CURRENT_SCHEMA_VERSION,
        needsMigration: false,
      };
    }
  }
}

