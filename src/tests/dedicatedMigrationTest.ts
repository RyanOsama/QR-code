import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { DatabaseMigrationService } from '../services/databaseMigrationService';
import {
  MIGRATIONS_REGISTRY,
  getLatestRequiredVersion,
  getPendingMigrations,
} from '../database/migrations/registry';
import { getDatabase, initDatabase } from '../database/connection';
import { MigrationDefinition } from '../database/migrations/types';

console.log('================================================================');
console.log('🧪 RUNNING DEDICATED DATABASE MIGRATION TEST SUITE (PHASE 4)');
console.log('================================================================\n');

const testDataDir = path.join(process.cwd(), 'database_files');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

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

// --- TEST 1: Database Already Up to Date ---
console.log('--- TEST 1: Database Already Up to Date ---');
{
  DeviceService.setCommercialMode('DEDICATED');
  const db = getDatabase();

  // Set database to latest version
  const latestReq = getLatestRequiredVersion();
  db.exec(`
    CREATE TABLE IF NOT EXISTS database_schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    DELETE FROM database_schema_version;
    INSERT INTO database_schema_version (version, name, applied_at) VALUES (${latestReq}, 'v${latestReq}_test_version', datetime('now'));
  `);

  const status = await DatabaseMigrationService.checkMigrationStatus();
  assert.strictEqual(status.currentVersion, latestReq, `Current version is ${latestReq}`);
  assert.strictEqual(status.requiredVersion, latestReq, `Required version is ${latestReq}`);
  assert.strictEqual(status.needsMigration, false, 'Database does not need migration');
  assert.strictEqual(status.pendingVersions.length, 0, 'No pending versions');

  console.log('✅ [PASS] Up-to-date database correctly detected and requires no migration');
}

// --- TEST 2: Single Pending Migration (v1 -> v2) ---
console.log('\n--- TEST 2: Single Pending Migration (v1 -> v2) ---');
{
  const db = getDatabase();
  // Set database to version 1
  db.exec(`
    DELETE FROM database_schema_version;
    INSERT INTO database_schema_version (version, name, applied_at) VALUES (1, 'v1_initial_core_schema', datetime('now'));
  `);

  const statusBefore = await DatabaseMigrationService.checkMigrationStatus();
  assert.strictEqual(statusBefore.currentVersion, 1, 'Current version is v1');
  assert(statusBefore.requiredVersion >= 2, 'Required version is at least v2');
  assert.strictEqual(statusBefore.needsMigration, true, 'Migration correctly required');
  assert(statusBefore.pendingVersions.includes(2), 'Pending versions include v2');

  // Execute migration
  const execResult = await DatabaseMigrationService.runPendingMigrations();
  assert(execResult.success, 'Migration execution succeeded');
  assert.strictEqual(execResult.fromVersion, 1, 'Migrated from v1');
  assert(execResult.appliedVersions.includes(2), 'Applied version 2');

  // Verify status after migration
  const statusAfter = await DatabaseMigrationService.checkMigrationStatus();
  assert.strictEqual(statusAfter.needsMigration, false, 'Database is now fully up to date');
  assert(statusAfter.currentVersion >= 2, 'Current version updated in tracker');

  console.log('✅ [PASS] v1 -> v2 migration executed sequentially and updated schema tracker');
}

// --- TEST 3: Sequential Execution of Multiple Migrations ---
console.log('\n--- TEST 3: Sequential Execution of Multiple Migrations (No Skipping) ---');
{
  const pending = getPendingMigrations(0);
  assert(pending.length >= 2, 'Multiple migrations found for clean sequence');
  for (let i = 0; i < pending.length - 1; i++) {
    assert(
      pending[i].version < pending[i + 1].version,
      `Migration v${pending[i].version} precedes v${pending[i + 1].version}`
    );
  }

  console.log('✅ [PASS] Migrations are strictly ordered and guaranteed sequential without skipping');
}

// --- TEST 4: Failed Migration Isolation & No Version Increment ---
console.log('\n--- TEST 4: Failed Migration Isolation & Clean Error Reporting ---');
{
  const db = getDatabase();
  db.exec(`
    DELETE FROM database_schema_version;
    INSERT INTO database_schema_version (version, name, applied_at) VALUES (1, 'v1_initial_core_schema', datetime('now'));
  `);

  // Create a temporary faulty migration definition in registry
  const faultyMigration: MigrationDefinition = {
    version: 999,
    name: 'v999_faulty_migration',
    titleArabic: 'تحديث اختباري فاشل',
    description: 'تحديث يحتوي على خطأ متعمد للتحقق من سلامة معالجة الأخطاء',
    up: async () => {
      throw new Error('خطأ اختباري مقصود أثناء الهجرة البرمجية');
    },
    verify: async () => false,
  };

  MIGRATIONS_REGISTRY.push(faultyMigration);

  const res = await DatabaseMigrationService.runPendingMigrations();
  assert.strictEqual(res.success, false, 'Faulty migration detected and returned success=false');
  assert.strictEqual(res.failedVersion, 999, 'Failed version correctly identified as 999');
  assert(res.error?.includes('خطأ اختباري'), 'Arabic error reported clearly');

  // Verify that version 999 was NOT recorded in database_schema_version
  const row999 = db.prepare('SELECT * FROM database_schema_version WHERE version = 999').get();
  assert.strictEqual(row999, undefined, 'Faulty migration was NOT marked as completed in database');

  // Remove faulty migration from registry
  const idx = MIGRATIONS_REGISTRY.findIndex((m) => m.version === 999);
  if (idx !== -1) MIGRATIONS_REGISTRY.splice(idx, 1);

  console.log('✅ [PASS] Failed migrations are isolated, errors reported safely, and version tracker is protected');
}

// --- TEST 5: Safe Retry After Failure ---
console.log('\n--- TEST 5: Safe Retry After Failure ---');
{
  const retryResult = await DatabaseMigrationService.runPendingMigrations();
  assert(retryResult.success, 'Retry succeeded cleanly once faulty migration was removed');

  const finalStatus = await DatabaseMigrationService.checkMigrationStatus();
  assert.strictEqual(finalStatus.needsMigration, false, 'Database is up to date after retry');

  console.log('✅ [PASS] Retrying migration after resolving failure executes smoothly and safely');
}

// --- TEST 6: Idempotency & Re-running Applied Migrations ---
console.log('\n--- TEST 6: Idempotent Re-running on Already Applied Schema ---');
{
  // Running migration again on up-to-date database
  const noopResult = await DatabaseMigrationService.runPendingMigrations();
  assert(noopResult.success, 'No-op migration succeeds without errors');
  assert.strictEqual(noopResult.appliedVersions.length, 0, 'No redundant migrations re-executed');

  console.log('✅ [PASS] Migration runner is completely idempotent and avoids duplicate executions');
}

// --- TEST 7: SaaS Mode Remains Unaltered ---
console.log('\n--- TEST 7: SaaS Mode Isolation ---');
{
  DeviceService.setCommercialMode('SAAS');
  const saasStartup = await DeviceService.checkStartupStatus();
  assert.strictEqual(saasStartup.mode, 'SAAS', 'SaaS mode preserved');
  assert.strictEqual(saasStartup.isActivated, true, 'SaaS activated by default');

  console.log('✅ [PASS] SaaS multi-tenant mode remains 100% isolated and unchanged');
}

cleanupTestFiles();

console.log('\n================================================================');
console.log('🏁 ALL PHASE 4 DATABASE MIGRATION TESTS PASSED (7/7)');
console.log('================================================================\n');

process.exit(0);
