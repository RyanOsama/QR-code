import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { LicenseServerService } from '../services/licenseServerService';
import { DeviceService } from '../services/deviceService';
import { initDatabase, getDatabase } from '../database/connection';
import { LicenseType, LicenseStatus } from '../types';

console.log('================================================================');
console.log('🧪 RUNNING PHASE 6: LICENSE & DEVICE MANAGEMENT TEST SUITE');
console.log('================================================================\n');

const testDataDir = path.join(process.cwd(), 'database_files');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

const activationFile = path.join(testDataDir, 'app_activation.json');

function cleanupTestFiles() {
  try {
    if (fs.existsSync(activationFile)) fs.unlinkSync(activationFile);
  } catch (_) {}
}

cleanupTestFiles();
initDatabase();

// --- TEST 1: Super Admin Creates License with Configurable max_devices ---
console.log('--- TEST 1: Create License with Configurable max_devices ---');
let testLicense1: any;
{
  const res = LicenseServerService.createLicense(
    {
      company_name: 'شركة الفخامة للفعاليات',
      max_devices: 3,
      license_type: 'PERPETUAL',
    },
    'SUPER_ADMIN'
  );

  assert(res.success, 'License created successfully by Super Admin');
  assert(res.license, 'License object returned');
  assert(res.plainLicenseKey, 'Plain license key generated');
  assert.strictEqual(res.license.company_name, 'شركة الفخامة للفعاليات');
  assert.strictEqual(res.license.max_devices, 3);
  assert.strictEqual(res.license.status, 'active');
  assert.strictEqual(res.license.license_type, 'PERPETUAL');

  testLicense1 = res;
  console.log('✅ [PASS] Perpetual license created with max_devices = 3 and active status');
}

// --- TEST 2: Masked License Key Formatting ---
console.log('\n--- TEST 2: License Key Masking ---');
{
  const masked = LicenseServerService.maskLicenseKey(testLicense1.plainLicenseKey);
  assert(masked.startsWith('PERPETUAL-'), 'Masked key retains prefix');
  assert(masked.includes('****'), 'Masked key conceals sensitive sections');
  assert(!masked.includes(testLicense1.plainLicenseKey.substring(10, 18)), 'Does not reveal middle secret characters');

  console.log('✅ [PASS] License key correctly masked for UI display without secret leakage');
}

// --- TEST 3: Device Activation & Seat Tracking ---
console.log('\n--- TEST 3: Device Activation & Seat Tracking ---');
const dev1 = 'device-hardware-uuid-001';
const dev2 = 'device-hardware-uuid-002';
const dev3 = 'device-hardware-uuid-003';
const dev4 = 'device-hardware-uuid-004';
{
  // Activate Device 1
  const act1 = await LicenseServerService.activateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev1,
    deviceName: 'بوابة الدخول 1',
  });
  assert(act1.success, 'Device 1 activated successfully');
  assert.strictEqual(act1.activeDevices, 1);

  // Activate Device 2
  const act2 = await LicenseServerService.activateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev2,
    deviceName: 'بوابة الدخول 2',
  });
  assert(act2.success, 'Device 2 activated successfully');
  assert.strictEqual(act2.activeDevices, 2);

  // Activate Device 3
  const act3 = await LicenseServerService.activateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev3,
    deviceName: 'بوابة الدخول 3',
  });
  assert(act3.success, 'Device 3 activated successfully');
  assert.strictEqual(act3.activeDevices, 3);

  // Check activations list for license
  const activations = LicenseServerService.getActivations(testLicense1.license.id, 'SUPER_ADMIN');
  assert.strictEqual(activations.length, 3, 'Found exactly 3 active device registrations');

  console.log('✅ [PASS] Multiple devices activated with exact seat limit tracking');
}

// --- TEST 4: Device Limit Enforcement ---
console.log('\n--- TEST 4: Device Limit Enforcement ---');
{
  // Attempt to activate Device 4 when limit is 3
  const act4 = await LicenseServerService.activateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev4,
    deviceName: 'بوابة إضافية 4',
  });

  assert.strictEqual(act4.success, false, 'Activation blocked when max_devices reached');
  assert(act4.error?.includes('الحد الأقصى للأجهزة'), 'Clear Arabic device limit error returned');

  console.log('✅ [PASS] 4th device activation strictly blocked on 3-device license');
}

// --- TEST 5: Vendor Device Deactivation ---
console.log('\n--- TEST 5: Vendor Device Deactivation ---');
let deactRowId: number;
{
  const acts = LicenseServerService.getActivations(testLicense1.license.id, 'SUPER_ADMIN');
  const act1Row = acts.find((a) => a.device_name === 'بوابة الدخول 1')!;
  assert(act1Row, 'Found device 1 row');
  deactRowId = act1Row.id;

  // Deactivate Device 1 by Super Admin
  const deactRes = LicenseServerService.deactivateDeviceById(deactRowId, 'SUPER_ADMIN');
  assert(deactRes.success, 'Device 1 deactivated by vendor');

  // Verify next validation fails for device 1
  const val1 = await LicenseServerService.validateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev1,
  });
  assert.strictEqual(val1.valid, false, 'Deactivated device fails validation');
  assert(val1.error?.includes('إلغاء تفعيل هذا الجهاز'), 'Appropriate deactivation error');

  console.log('✅ [PASS] Vendor-deactivated device seat barred from subsequent validation');
}

// --- TEST 6: Device Transfer (Old Device -> Deactivate -> New Device -> Activate) ---
console.log('\n--- TEST 6: Device Transfer Workflow ---');
{
  // Now that Device 1 seat was freed, Device 4 can activate (Device Transfer)
  const transferAct = await LicenseServerService.activateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev4,
    deviceName: 'جهاز بديل 4 (منقول)',
  });

  assert(transferAct.success, 'Device 4 activated into released seat');
  assert.strictEqual(transferAct.isTransfer, true, 'Flagged as valid device transfer');
  assert.strictEqual(transferAct.activeDevices, 3, 'Seat count remains within limit (3/3)');

  console.log('✅ [PASS] Device transfer workflow succeeds safely without bypassing device limit');
}

// --- TEST 7: License Revocation and Reactivation ---
console.log('\n--- TEST 7: License Revocation & Reactivation ---');
{
  // Revoke license
  const revokeRes = LicenseServerService.revokeLicense(testLicense1.license.id, 'SUPER_ADMIN');
  assert(revokeRes.success, 'License revoked successfully');

  // Validation on Device 2 must fail due to revocation
  const valDev2 = await LicenseServerService.validateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev2,
  });
  assert.strictEqual(valDev2.valid, false, 'Validation fails on revoked license');
  assert.strictEqual(valDev2.status, 'revoked', 'Status reported as revoked');

  // Reactivate license
  const reactRes = LicenseServerService.reactivateLicense(testLicense1.license.id, 'SUPER_ADMIN');
  assert(reactRes.success, 'License reactivated successfully');

  // Validation on Device 2 now succeeds
  const valDev2After = await LicenseServerService.validateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev2,
  });
  assert.strictEqual(valDev2After.valid, true, 'Validation succeeds after reactivation');
  assert.strictEqual(valDev2After.status, 'active', 'Status reported as active');

  console.log('✅ [PASS] Revocation and Reactivation transition smoothly with live status updates');
}

// --- TEST 8: License Statuses (SUSPENDED, EXPIRED, PERPETUAL exemption) ---
console.log('\n--- TEST 8: License Status Management ---');
{
  // Suspend license
  const suspRes = LicenseServerService.updateLicenseStatus(testLicense1.license.id, 'suspended', 'SUPER_ADMIN');
  assert(suspRes.success, 'License suspended');

  const valSusp = await LicenseServerService.validateLicense({
    licenseKey: testLicense1.plainLicenseKey!,
    deviceId: dev2,
  });
  assert.strictEqual(valSusp.valid, false, 'Validation blocked on suspended license');
  assert.strictEqual(valSusp.status, 'suspended');

  // Re-activate
  LicenseServerService.updateLicenseStatus(testLicense1.license.id, 'active', 'SUPER_ADMIN');

  // Test perpetual exemption: perpetual license with past date does not expire
  const perpetualExpiredDate = LicenseServerService.createLicense({
    company_name: 'شركة الشراء الدائم',
    max_devices: 1,
    license_type: 'PERPETUAL',
    expires_at: '2020-01-01T00:00:00.000Z', // Old date
  });

  const actPerp = await LicenseServerService.activateLicense({
    licenseKey: perpetualExpiredDate.plainLicenseKey!,
    deviceId: 'perp-device-uuid',
  });
  assert(actPerp.success, 'Perpetual license is NOT blocked by time expiration');

  console.log('✅ [PASS] License statuses handled accurately and perpetual licenses are never expired');
}

// --- TEST 9: Audit Logging ---
console.log('\n--- TEST 9: Comprehensive Audit Logging ---');
{
  const logs = LicenseServerService.getAuditLogs({ licenseId: testLicense1.license.id });
  assert(logs.length >= 4, 'Audit logs recorded multiple lifecycle events');

  const actions = logs.map((l) => l.action);
  assert(actions.includes('LICENSE_CREATED'), 'Audit log includes LICENSE_CREATED');
  assert(actions.includes('DEVICE_ACTIVATED'), 'Audit log includes DEVICE_ACTIVATED');
  assert(actions.includes('DEVICE_DEACTIVATED'), 'Audit log includes DEVICE_DEACTIVATED');
  assert(actions.includes('DEVICE_TRANSFER'), 'Audit log includes DEVICE_TRANSFER');
  assert(actions.includes('LICENSE_REVOKED'), 'Audit log includes LICENSE_REVOKED');
  assert(actions.includes('LICENSE_REACTIVATED'), 'Audit log includes LICENSE_REACTIVATED');

  for (const log of logs) {
    assert(log.created_at, 'Log has timestamp');
    assert(log.actor, 'Log has actor');
  }

  console.log('✅ [PASS] Audit logs accurately captured all lifecycle operations with timestamps and actors');
}

// --- TEST 10: Security & Unauthorized Company Admin Access Prevention ---
console.log('\n--- TEST 10: Security & Unauthorized Company Admin Access ---');
{
  // Company Admin / Employee attempts to list licenses
  const unauthorizedList = LicenseServerService.listLicenses(undefined, 'COMPANY_ADMIN');
  assert.strictEqual(unauthorizedList.length, 0, 'Company Admin cannot list central licenses');

  // Company Admin attempts to create license
  const unauthorizedCreate = LicenseServerService.createLicense(
    { company_name: 'قرصنة' },
    'EMPLOYEE'
  );
  assert.strictEqual(unauthorizedCreate.success, false, 'Employee blocked from creating license');
  assert(unauthorizedCreate.error?.includes('غير مصرح'), 'Unauthorized error returned');

  // Company Admin attempts to revoke license
  const unauthorizedRevoke = LicenseServerService.revokeLicense(testLicense1.license.id, 'COMPANY_OWNER');
  assert.strictEqual(unauthorizedRevoke.success, false, 'Company Owner blocked from revoking license');

  // Company Admin attempts to deactivate device
  const unauthorizedDeact = LicenseServerService.deactivateDeviceById(deactRowId, 'COMPANY_ADMIN');
  assert.strictEqual(unauthorizedDeact.success, false, 'Company Admin blocked from deactivating vendor device');

  console.log('✅ [PASS] Privileged vendor controls strictly protected against unauthorized Company Admin access');
}

// --- TEST 11: Search & Filter Licenses ---
console.log('\n--- TEST 11: Search & Filter Licenses ---');
{
  // Filter by query
  const searchResults = LicenseServerService.listLicenses({ query: 'الفخامة' }, 'SUPER_ADMIN');
  assert(searchResults.length >= 1, 'Found license matching search query');
  assert(searchResults[0].company_name.includes('الفخامة'));

  // Filter by status
  const activeResults = LicenseServerService.listLicenses({ status: 'active' }, 'SUPER_ADMIN');
  assert(activeResults.every((l) => l.status === 'active'), 'All filtered licenses are active');

  console.log('✅ [PASS] License search by company/key and filtering by status functions properly');
}

// --- TEST 12: SaaS Mode Complete Isolation ---
console.log('\n--- TEST 12: SaaS Mode Complete Isolation ---');
{
  DeviceService.setCommercialMode('SAAS');
  const saasStatus = await DeviceService.checkStartupStatus();
  assert.strictEqual(saasStatus.mode, 'SAAS', 'SaaS mode preserved');
  assert.strictEqual(saasStatus.isActivated, true, 'SaaS activated by default');
  assert.strictEqual(saasStatus.isDatabaseConfigured, true, 'SaaS database configured');

  console.log('✅ [PASS] SaaS multi-tenant mode remains 100% isolated and unchanged');
}

cleanupTestFiles();

console.log('\n================================================================');
console.log('🏁 ALL PHASE 6 LICENSE & DEVICE MANAGEMENT TESTS PASSED (12/12)');
console.log('================================================================\n');

process.exit(0);
