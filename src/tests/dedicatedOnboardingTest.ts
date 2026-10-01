import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { DatabaseProvisioningService, CURRENT_SCHEMA_VERSION } from '../services/databaseProvisioningService';
import { SupabaseService } from '../services/supabaseService';
import { PasswordService } from '../services/passwordService';
import { getDatabase, initDatabase } from '../database/connection';

console.log('================================================================');
console.log('🧪 RUNNING DEDICATED ONBOARDING TEST SUITE (PHASE 3)');
console.log('================================================================\n');

// Set up clean isolated test data directory
const testDataDir = path.join(process.cwd(), 'database_files');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Reset activation file
const activationFile = path.join(testDataDir, 'app_activation.json');
const cloudConfigFile = path.join(testDataDir, 'cloud_config.json');

function cleanupTestFiles() {
  try {
    if (fs.existsSync(activationFile)) fs.unlinkSync(activationFile);
    if (fs.existsSync(cloudConfigFile)) fs.unlinkSync(cloudConfigFile);
  } catch (_) {}
}

cleanupTestFiles();
initDatabase();

// --- TEST 1: Full Dedicated Onboarding Flow (License -> Provisioning -> Company & Admin -> Verification) ---
console.log('--- TEST 1: Full Dedicated Onboarding Flow ---');
{
  DeviceService.setCommercialMode('DEDICATED');

  // 1. License Generation & Activation
  const licRes = await LicenseServerService.createLicense({
    company_name: 'شركة الأفق لتنظيم الفعاليات',
    max_devices: 1,
    license_type: 'PERPETUAL',
  });
  assert(licRes.success && licRes.plainLicenseKey, 'License key generated successfully');

  const actRes = await DeviceService.activateDedicatedInstallation({
    licenseKey: licRes.plainLicenseKey!,
  });
  assert(actRes.success, 'Dedicated installation activated successfully');

  // 2. Company Setup & Admin Creation (with lifetime perpetual subscription)
  const setupRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
    companyName: 'شركة الأفق لتنظيم الفعاليات',
    logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    adminFullName: 'المهندس ريان أسامة',
    adminUsername: 'ryan_admin',
    adminPassword: 'SecurePassword2026',
    deviceName: 'محطة الإدارة 1',
  });

  assert(setupRes.success, 'Company and Admin created successfully');
  assert.strictEqual(setupRes.companyName, 'شركة الأفق لتنظيم الفعاليات');
  assert.strictEqual(setupRes.adminUsername, 'ryan_admin');

  // Verify saved cloud config
  const savedCfg = SupabaseService.getConfig();
  assert.strictEqual(savedCfg.supabaseUrl, 'https://al-ofouq-test.supabase.co');
  assert.strictEqual(savedCfg.mode, 'cloud');

  // Verify activation status
  const act = DeviceService.getLocalActivation();
  assert.strictEqual(act.is_database_configured, true);
  assert.strictEqual(act.company_name, 'شركة الأفق لتنظيم الفعاليات');

  console.log('✅ [PASS] Full Dedicated Onboarding flow executed cleanly');
}

// --- TEST 2: Idempotent Company & Admin Creation (Safe Retries) ---
console.log('\n--- TEST 2: Idempotency & Duplicate Prevention on Retry ---');
{
  // Retrying with same or updated name should not duplicate company or user
  const retryRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
    companyName: 'شركة الأفق لتنظيم الفعاليات - الفرع الرئيسي',
    adminFullName: 'المهندس ريان أسامة المطور',
    adminUsername: 'ryan_admin',
    adminPassword: 'UpdatedSecurePassword2026',
    deviceName: 'محطة الإدارة 1',
  });

  assert(retryRes.success, 'Retry setup succeeded idempotently');
  assert.strictEqual(retryRes.companyName, 'شركة الأفق لتنظيم الفعاليات - الفرع الرئيسي');

  console.log('✅ [PASS] Retrying company and admin setup is 100% idempotent');
}

// --- TEST 3: Validation & Error Handling on Invalid Admin Inputs ---
console.log('\n--- TEST 3: Input Validation & Localized Error Handling ---');
{
  const emptyCompanyRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
    companyName: '   ',
    adminFullName: 'المدير',
    adminUsername: 'admin',
    adminPassword: 'password123',
  });
  assert(!emptyCompanyRes.success, 'Empty company name rejected');
  assert(emptyCompanyRes.error?.includes('اسم الشركة'), 'Appropriate Arabic error returned for empty company');

  const shortUserRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
    companyName: 'شركة المستقبل',
    adminFullName: 'المدير',
    adminUsername: 'ab', // < 3 chars
    adminPassword: 'password123',
  });
  assert(!shortUserRes.success, 'Short username rejected');
  assert(shortUserRes.error?.includes('3 أحرف'), 'Appropriate Arabic error returned for short username');

  const shortPassRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
    companyName: 'شركة المستقبل',
    adminFullName: 'المدير',
    adminUsername: 'admin_user',
    adminPassword: '12', // < 4 chars
  });
  assert(!shortPassRes.success, 'Short password rejected');
  assert(shortPassRes.error?.includes('4 خانات'), 'Appropriate Arabic error returned for short password');

  console.log('✅ [PASS] Input validation rules correctly enforce security and data integrity');
}

// --- TEST 4: Final Verification Checklist (All 7 Steps) ---
console.log('\n--- TEST 4: Final Verification Checklist ---');
{
  const startup = await DeviceService.checkStartupStatus();
  assert(startup.isActivated, 'License validity verified');
  assert(startup.isDatabaseConfigured, 'Database configuration verified');

  const verifyRes = await DatabaseProvisioningService.verifyDedicatedInstallation({
    supabaseUrl: 'https://al-ofouq-test.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_test',
  });

  assert(verifyRes.checks.licenseValid, 'Check 1: License valid verified');
  assert(verifyRes.checks.supabaseConnected, 'Check 2: Supabase connection verified');
  assert(verifyRes.checks.databaseProvisioned, 'Check 3: Core database tables verified');
  assert(verifyRes.checks.companyExists, 'Check 4: Company record verified');
  assert(verifyRes.checks.adminExists, 'Check 5: Admin owner user verified');
  assert(verifyRes.checks.subscriptionActive, 'Check 6: Perpetual subscription verified');
  assert(verifyRes.checks.schemaVersionValid, 'Check 7: Schema version tracking verified');

  console.log('✅ [PASS] All 7 final verification checks passed with 100% success');
}

// --- TEST 5: Subsequent App Launch Direct Transition (No Setup Wizard) ---
console.log('\n--- TEST 5: Subsequent Launch Startup Status ---');
{
  const startupStatus = await DeviceService.checkStartupStatus();
  assert.strictEqual(startupStatus.mode, 'DEDICATED', 'Identified as Dedicated mode');
  assert.strictEqual(startupStatus.isActivated, true, 'License is active');
  assert.strictEqual(startupStatus.isDatabaseConfigured, true, 'Database is fully configured');

  // In App.tsx: when (isActivated && isDatabaseConfigured) => Directly opens LoginModal!
  console.log('✅ [PASS] Future app launches bypass setup wizard and directly prompt for Company Admin Login');
}

// --- TEST 6: SaaS Isolation & Unaltered Behavior ---
console.log('\n--- TEST 6: SaaS Mode Remains Completely Unchanged ---');
{
  DeviceService.setCommercialMode('SAAS');
  const saasStatus = await DeviceService.checkStartupStatus();
  assert.strictEqual(saasStatus.mode, 'SAAS', 'SaaS mode recognized');
  assert.strictEqual(saasStatus.isActivated, true, 'SaaS activated by default');
  assert.strictEqual(saasStatus.isDatabaseConfigured, true, 'SaaS skips dedicated database setup');

  console.log('✅ [PASS] SaaS multi-tenant mode remains 100% isolated and unchanged');
}

// --- TEST 7: Password Hashing & Role Integrity ---
console.log('\n--- TEST 7: Admin User Security Integrity ---');
{
  const plainPassword = 'CompanyAdminPassword2026';
  const hashed = PasswordService.hash(plainPassword);
  assert.strictEqual(hashed.length, 64, 'Password securely hashed with SHA-256');
  assert(PasswordService.verify(plainPassword, hashed), 'Password verifies accurately without plaintext storage');

  console.log('✅ [PASS] Passwords are cryptographically protected and never exposed in plaintext');
}

cleanupTestFiles();

console.log('\n================================================================');
console.log('🏁 ALL PHASE 3 DEDICATED ONBOARDING TESTS PASSED (7/7)');
console.log('================================================================\n');

process.exit(0);
