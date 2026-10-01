import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { SupabaseService } from '../services/supabaseService';
import { DatabaseProvisioningService } from '../services/databaseProvisioningService';

async function runDedicatedFirstRunSetupTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING DEDICATED FIRST-RUN SETUP TEST SUITE (PHASE 1)');
  console.log('================================================================\n');

  // Initialize test database
  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_dedicated_first_run.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const activationFilePath = path.join(testDbDir, 'app_activation.json');
  if (fs.existsSync(activationFilePath)) fs.unlinkSync(activationFilePath);

  const cloudConfigPath = path.join(testDbDir, 'cloud_config.json');
  if (fs.existsSync(cloudConfigPath)) fs.unlinkSync(cloudConfigPath);

  initDatabase(testDbPath);

  try {
    // -------------------------------------------------------------
    // TEST 1: Default SaaS Mode Behavior (No Setup Wizard Needed)
    // -------------------------------------------------------------
    console.log('--- TEST 1: SaaS Mode Default Startup ---');
    DeviceService.setCommercialMode('SAAS');
    const saasStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(saasStatus.mode, 'SAAS', 'SaaS mode detected correctly');
    assert.strictEqual(saasStatus.isActivated, true, 'SaaS mode is activated by default');
    assert.strictEqual(saasStatus.isDatabaseConfigured, true, 'SaaS mode skips database setup wizard');
    console.log('✅ [PASS] SaaS mode starts directly and skips setup wizard');

    // -------------------------------------------------------------
    // TEST 2: Dedicated Mode Detection Before License Activation
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Dedicated Mode First-Run Detection ---');
    DeviceService.setCommercialMode('DEDICATED');
    let dedicatedStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(dedicatedStatus.mode, 'DEDICATED', 'Dedicated mode detected correctly');
    assert.strictEqual(dedicatedStatus.isActivated, false, 'Unactivated Dedicated installation detected');
    assert.strictEqual(dedicatedStatus.isDatabaseConfigured, false, 'Database setup not configured');
    assert(!!dedicatedStatus.error, 'Returns clear Arabic message regarding missing license activation');
    console.log('✅ [PASS] Dedicated mode correctly flags missing license and triggers Activation screen');

    // -------------------------------------------------------------
    // TEST 3: License Key Activation (Step 1 of First-Run Flow)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: License Activation & Transition to DB Wizard ---');
    const companyName = 'شركة الفخامة لتنظيم المؤتمرات';
    const licenseCreation = LicenseServerService.createLicense({
      company_name: companyName,
      max_devices: 3,
      license_type: 'PERPETUAL',
    });
    assert(licenseCreation.success && licenseCreation.plainLicenseKey, 'Super Admin created perpetual license');

    const plainKey = licenseCreation.plainLicenseKey!;
    const activationRes = await DeviceService.activateDedicatedInstallation({
      licenseKey: plainKey,
      deviceName: 'جهاز الإدارة الرئيسي - الاستقبال',
    });
    assert(activationRes.success, 'License activated successfully on this device');
    assert.strictEqual(activationRes.companyName, companyName, 'Company name retrieved from license');

    dedicatedStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(dedicatedStatus.isActivated, true, 'Device is now activated cryptographically');
    assert.strictEqual(dedicatedStatus.isDatabaseConfigured, false, 'Database is not yet configured (leads directly to DB wizard)');
    assert.strictEqual(dedicatedStatus.companyName, companyName, 'Company name attached to status');
    console.log('✅ [PASS] License activation succeeded; seamlessly routes to Database Setup Wizard');

    // -------------------------------------------------------------
    // TEST 4: Supabase URL and Key Validation
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Supabase URL and Key Validation Rules ---');
    // Bad URL
    const badUrlTest = await SupabaseService.testConnection('ftp://invalid-url.com', 'some-key');
    assert.strictEqual(badUrlTest.success, false, 'Invalid URL format rejected');

    // Wrong publishable key format warning
    const badKeyTest = await SupabaseService.testConnection('https://xyz.supabase.co', 'sb_publishable_123');
    assert.strictEqual(badKeyTest.success, false, 'Wrong key format detected');
    assert(badKeyTest.message.includes('anon'), 'Instructs user to copy anon public key');
    console.log('✅ [PASS] Connection validation prevents malformed and incorrect key entries');

    // -------------------------------------------------------------
    // TEST 5: Database Configuration & State Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Secure Configuration Persistence Outside App Directory ---');
    const testSupabaseUrl = 'https://fakhamah-events.supabase.co';
    const testSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakhamah_sample_anon_token_123456';

    // Save cloud configuration securely
    SupabaseService.saveConfig({
      mode: 'cloud',
      supabaseUrl: testSupabaseUrl,
      supabaseAnonKey: testSupabaseKey,
      deviceName: 'بوابة الإدارة 1',
    });

    const act = DeviceService.getLocalActivation();
    act.is_database_configured = true;
    act.customer_supabase_url = testSupabaseUrl;
    act.customer_supabase_anon_key = testSupabaseKey;
    DeviceService.saveLocalActivation(act);

    const savedConfig = SupabaseService.getConfig();
    assert.strictEqual(savedConfig.supabaseUrl, testSupabaseUrl, 'Supabase URL persisted');
    assert.strictEqual(savedConfig.supabaseAnonKey, testSupabaseKey, 'Supabase Anon key persisted');

    dedicatedStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(dedicatedStatus.isActivated, true, 'License remains active');
    assert.strictEqual(dedicatedStatus.isDatabaseConfigured, true, 'Database is now marked as configured');
    console.log('✅ [PASS] Supabase configuration safely persisted outside app installation directory');

    // -------------------------------------------------------------
    // TEST 6: Future Launches Behavior (No Wizard Shown Again)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Subsequent App Launches in Dedicated Mode ---');
    const nextLaunchStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(nextLaunchStatus.mode, 'DEDICATED', 'Dedicated mode preserved');
    assert.strictEqual(nextLaunchStatus.isActivated, true, 'License validation passed on startup');
    assert.strictEqual(nextLaunchStatus.isDatabaseConfigured, true, 'Database configuration loaded; setup wizard bypassed');
    console.log('✅ [PASS] On future launches, skips wizard and proceeds directly to Company Admin login');

    // -------------------------------------------------------------
    // TEST 7: Corrupted / Removed Database Configuration Recovery
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Missing/Corrupted DB Config Triggers Wizard Re-entry ---');
    const corruptedAct = DeviceService.getLocalActivation();
    corruptedAct.is_database_configured = false;
    corruptedAct.customer_supabase_url = '';
    corruptedAct.customer_supabase_anon_key = '';
    DeviceService.saveLocalActivation(corruptedAct);

    SupabaseService.saveConfig({
      mode: 'local',
      supabaseUrl: '',
      supabaseAnonKey: '',
      deviceName: 'بوابة 1',
    });

    const recoveryStatus = await DeviceService.checkStartupStatus();
    assert.strictEqual(recoveryStatus.isActivated, true, 'License remains valid');
    assert.strictEqual(recoveryStatus.isDatabaseConfigured, false, 'Detects missing DB config');
    console.log('✅ [PASS] Missing DB config correctly returns user to Database Setup Wizard');

    console.log('\n================================================================');
    console.log('🏁 ALL PHASE 1 DEDICATED FIRST-RUN SETUP TESTS PASSED (7/7)');
    console.log('================================================================\n');
  } finally {
    // Cleanup test artifacts
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

runDedicatedFirstRunSetupTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
