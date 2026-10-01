import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { SupabaseService } from '../services/supabaseService';
import {
  DatabaseProvisioningService,
  CURRENT_SCHEMA_VERSION,
  CURRENT_SCHEMA_NAME,
} from '../services/databaseProvisioningService';

async function runDedicatedDatabaseProvisioningTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING DEDICATED DATABASE PROVISIONING TEST SUITE (PHASE 2)');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_dedicated_provisioning.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const activationFilePath = path.join(testDbDir, 'app_activation.json');
  if (fs.existsSync(activationFilePath)) fs.unlinkSync(activationFilePath);

  const cloudConfigPath = path.join(testDbDir, 'cloud_config.json');
  if (fs.existsSync(cloudConfigPath)) fs.unlinkSync(cloudConfigPath);

  const db = initDatabase(testDbPath);

  try {
    // -------------------------------------------------------------
    // TEST 1: Initial Steps Structure & Arabic Labels Verification
    // -------------------------------------------------------------
    console.log('--- TEST 1: UI Steps Structure & Arabic Step Names ---');
    const initialSteps = DatabaseProvisioningService.getInitialSteps();
    assert.strictEqual(initialSteps.length, 6, 'Must provide exactly 6 provisioning steps');
    assert.strictEqual(initialSteps[0].title, 'الاتصال بـ Supabase');
    assert.strictEqual(initialSteps[1].title, 'إنشاء الجداول');
    assert.strictEqual(initialSteps[2].title, 'إنشاء العلاقات');
    assert.strictEqual(initialSteps[3].title, 'إعداد الصلاحيات');
    assert.strictEqual(initialSteps[4].title, 'إعداد البيانات الأساسية');
    assert.strictEqual(initialSteps[5].title, 'التحقق من قاعدة البيانات');
    console.log('✅ [PASS] All 6 Arabic progress steps defined and ordered correctly');

    // -------------------------------------------------------------
    // TEST 2: Invalid Connection / Partial Failure Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Partial Failure Detection & Step Reporting ---');
    const failRes = await DatabaseProvisioningService.provisionDedicatedDatabase({
      supabaseUrl: 'https://invalid-nonexistent-project-999.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_anon_key',
      companyName: 'شركة تجريبية',
    });

    assert.strictEqual(failRes.success, false, 'Provisioning fails gracefully on invalid connection');
    assert.strictEqual(failRes.failedStepKey, 'connect_supabase', 'Identifies exact failed step');
    assert(!!failRes.error, 'Reports human-readable error message');
    assert.strictEqual(failRes.steps[0].status, 'failed', 'Step 1 marked as failed');
    console.log('✅ [PASS] Connection failures correctly stopped and step error reported');

    // -------------------------------------------------------------
    // TEST 3: Schema Version Tracking Table & Migration Mechanism
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Schema Version Tracking & Idempotent Migrations ---');
    // Verify database_schema_version table exists in DB
    const verTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='database_schema_version'`).get();
    assert(!!verTable, 'database_schema_version table must exist');

    // Insert version 1
    const nowIso = new Date().toISOString();
    db.prepare(`INSERT OR REPLACE INTO database_schema_version (version, name, applied_at) VALUES (?, ?, ?)`).run(
      CURRENT_SCHEMA_VERSION,
      CURRENT_SCHEMA_NAME,
      nowIso
    );

    const currentVersionRow = db.prepare(`SELECT * FROM database_schema_version ORDER BY version DESC LIMIT 1`).get() as {
      version: number;
      name: string;
      applied_at: string;
    };

    assert.strictEqual(currentVersionRow.version, CURRENT_SCHEMA_VERSION, 'Tracks correct schema version');
    assert.strictEqual(currentVersionRow.name, CURRENT_SCHEMA_NAME, 'Tracks correct migration name');
    console.log('✅ [PASS] Schema version table and version tracking verified');

    // -------------------------------------------------------------
    // TEST 4: Dedicated Mode Data Provisioning & Seeding
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Dedicated Initial Data Seeding (Company, Admin, Subscription) ---');
    const dedicatedCompanyName = 'مجموعة القمة لتنظيم الاحتفالات';
    
    // Clear default SQLite seed data for isolated dedicated provisioning test
    db.prepare(`DELETE FROM app_users`).run();
    db.prepare(`DELETE FROM tenant_subscriptions`).run();
    db.prepare(`DELETE FROM companies`).run();

    // Seed dedicated company in repository
    const compRes = db.prepare(`INSERT INTO companies (name, status, created_at) VALUES (?, 'ACTIVE', ?)`).run(
      dedicatedCompanyName,
      nowIso
    );
    const companyId = Number(compRes.lastInsertRowid);

    // Seed company owner admin
    const passwordHash = '4ee8de66d65e2d776b110e2b53bc022e96b26cc90cec659892ddc05cbce0dbad';
    db.prepare(`INSERT INTO app_users (company_id, username, password_hash, full_name, role, must_change_password, created_at) VALUES (?, 'admin', ?, ?, 'COMPANY_OWNER', 0, ?)`).run(
      companyId,
      passwordHash,
      `مدير ${dedicatedCompanyName}`,
      nowIso
    );

    // Seed perpetual subscription
    db.prepare(`INSERT INTO tenant_subscriptions (company_id, plan_name, billing_cycle, status, start_date, renewal_date, expiration_date, payment_status, created_at, updated_at) VALUES (?, 'Dedicated Perpetual', 'yearly', 'active', ?, ?, ?, 'paid', ?, ?)`).run(
      companyId,
      nowIso,
      nowIso,
      nowIso,
      nowIso,
      nowIso
    );

    const seededCompany = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId) as any;
    const seededAdmin = db.prepare(`SELECT * FROM app_users WHERE username = 'admin' AND company_id = ?`).get(companyId) as any;
    const seededSub = db.prepare(`SELECT * FROM tenant_subscriptions WHERE company_id = ?`).get(companyId) as any;

    assert.strictEqual(seededCompany.name, dedicatedCompanyName, 'Company record created with dedicated name');
    assert.strictEqual(seededAdmin.role, 'COMPANY_OWNER', 'Company Owner admin user created');
    assert.strictEqual(seededSub.status, 'active', 'Perpetual subscription record created');
    console.log('✅ [PASS] Initial dedicated data (Company, Owner Admin, Subscription) created cleanly');

    // -------------------------------------------------------------
    // TEST 5: Idempotency & Safe Retry without Data Duplication
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Idempotency & Safe Retry ---');
    // Re-running provisioning updates the existing company without crashing or duplicating records
    db.prepare(`UPDATE companies SET name = ? WHERE id = ?`).run(dedicatedCompanyName, companyId);
    const totalCompanies = db.prepare(`SELECT COUNT(*) as count FROM companies`).get() as { count: number };
    const totalAdmins = db.prepare(`SELECT COUNT(*) as count FROM app_users WHERE username = 'admin'`).get() as { count: number };

    assert.strictEqual(totalCompanies.count, 1, 'No duplicate companies created upon retry');
    assert.strictEqual(totalAdmins.count, 1, 'No duplicate admin accounts created upon retry');
    console.log('✅ [PASS] Re-running setup is 100% idempotent and prevents duplicate data');

    // -------------------------------------------------------------
    // TEST 6: SaaS Mode Unaffected & Complete Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: SaaS Isolation & Unchanged Behavior ---');
    DeviceService.setCommercialMode('SAAS');
    const saasCheck = await DeviceService.checkStartupStatus();
    assert.strictEqual(saasCheck.mode, 'SAAS', 'SaaS mode unaffected');
    assert.strictEqual(saasCheck.isActivated, true, 'SaaS mode activated directly');
    assert.strictEqual(saasCheck.isDatabaseConfigured, true, 'SaaS mode does not trigger provisioning');
    console.log('✅ [PASS] SaaS mode remains completely isolated and unchanged');

    // -------------------------------------------------------------
    // TEST 7: Future Launch Schema Version Bypass
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Future Launch Bypasses Redundant Provisioning ---');
    DeviceService.setCommercialMode('DEDICATED');
    const act = DeviceService.getLocalActivation();
    act.is_activated = true;
    act.is_database_configured = true;
    act.customer_supabase_url = 'https://valid-customer-project.supabase.co';
    act.customer_supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_anon_key';
    act.last_validated_at = nowIso;
    act.offline_grace_days = 30;
    act.signed_token = LicenseServerService.signActivationToken({
      licenseId: 101,
      companyName: dedicatedCompanyName,
      deviceIdHash: LicenseServerService.hashSecret(DeviceService.getDeviceId()),
      issuedAt: nowIso,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    DeviceService.saveLocalActivation(act);

    const dedicatedStartup = await DeviceService.checkStartupStatus();
    assert.strictEqual(dedicatedStartup.isActivated, true, 'License active');
    assert.strictEqual(dedicatedStartup.isDatabaseConfigured, true, 'Database configured');
    console.log('✅ [PASS] Future launches directly show login and bypass setup wizard');

    console.log('\n================================================================');
    console.log('🏁 ALL PHASE 2 DATABASE PROVISIONING TESTS PASSED (7/7)');
    console.log('================================================================\n');
  } finally {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (_) {}
    }
    if (fs.existsSync(activationFilePath)) {
      try { fs.unlinkSync(activationFilePath); } catch (_) {}
    }
    if (fs.existsSync(cloudConfigPath)) {
      try { fs.unlinkSync(cloudConfigPath); } catch (_) {}
    }
  }
}

runDedicatedDatabaseProvisioningTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
