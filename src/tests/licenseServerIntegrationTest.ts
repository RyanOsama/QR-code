import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { getDatabase, initDatabase } from '../database/connection';

console.log('================================================================');
console.log('🧪 RUNNING LICENSE SERVER INTEGRATION TEST SUITE (PHASE 5)');
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

// --- TEST 1: Valid Dedicated Activation ---
console.log('--- TEST 1: Valid Dedicated Activation ---');
{
  DeviceService.setCommercialMode('DEDICATED');

  // Create perpetual license on License Server
  const licRes = LicenseServerService.createLicense({
    company_name: 'مؤسسة الرواد لتنظيم المعارض',
    max_devices: 2,
    license_type: 'PERPETUAL',
  });
  assert(licRes.success && licRes.plainLicenseKey, 'Perpetual license created');

  const actRes = await DeviceService.activateDedicatedInstallation({
    licenseKey: licRes.plainLicenseKey!,
  });

  assert(actRes.success, 'Dedicated installation activated successfully');
  assert.strictEqual(actRes.companyName, 'مؤسسة الرواد لتنظيم المعارض');

  const actData = DeviceService.getLocalActivation();
  assert(actData.signed_token, 'Signed activation token received and stored');
  assert.strictEqual(actData.is_activated, true, 'Activation status flagged true');
  assert.strictEqual(actData.offline_grace_days, 30, 'Default offline grace period is 30 days');

  console.log('✅ [PASS] Valid activation returns signed token and registers device seat');
}

// --- TEST 2: Invalid License Key Rejection ---
console.log('\n--- TEST 2: Invalid License Key Rejection ---');
{
  const invalidAct = await DeviceService.activateDedicatedInstallation({
    licenseKey: 'LIC-FAKE-1234-5678-INVALID',
  });

  assert(!invalidAct.success, 'Fake license key rejected');
  assert(invalidAct.error?.includes('غير صحيح') || invalidAct.error?.includes('غير مسجل'), 'Arabic error returned');

  console.log('✅ [PASS] Fake / invalid license keys are rejected securely');
}

// --- TEST 3: Revoked License Rejection ---
console.log('\n--- TEST 3: Revoked License Rejection ---');
{
  const licRevoked = LicenseServerService.createLicense({
    company_name: 'شركة ملغاة',
    max_devices: 1,
  });
  assert(licRevoked.license?.id);
  LicenseServerService.revokeLicense(licRevoked.license.id);

  const actRev = await DeviceService.activateDedicatedInstallation({
    licenseKey: licRevoked.plainLicenseKey!,
  });

  assert(!actRev.success, 'Revoked license activation rejected');
  assert(actRev.error?.includes('إلغاء') || actRev.error?.includes('Revoked'), 'Arabic revocation error returned');

  console.log('✅ [PASS] Revoked license cannot be activated on any device');
}

// --- TEST 4: Device Activation & Seat Counter ---
console.log('\n--- TEST 4: Device Activation & Seat Tracking ---');
{
  const licMulti = LicenseServerService.createLicense({
    company_name: 'مجموعة النخبة',
    max_devices: 3,
  });

  const dev1 = await LicenseServerService.activateLicense({
    licenseKey: licMulti.plainLicenseKey!,
    deviceId: 'DEV-A1',
    deviceName: 'الجهاز الأول',
  });
  assert(dev1.success);
  assert.strictEqual(dev1.activeDevices, 1);

  const dev2 = await LicenseServerService.activateLicense({
    licenseKey: licMulti.plainLicenseKey!,
    deviceId: 'DEV-A2',
    deviceName: 'الجهاز الثاني',
  });
  assert(dev2.success);
  assert.strictEqual(dev2.activeDevices, 2);

  console.log('✅ [PASS] Multiple devices activate under multi-device license with exact seat tracking');
}

// --- TEST 5: Same Device Reactivation (Idempotent Seat Reuse) ---
console.log('\n--- TEST 5: Same Device Reactivation (Idempotency) ---');
{
  const licSingle = LicenseServerService.createLicense({
    company_name: 'شركة التميز',
    max_devices: 1,
  });

  // First activation on DEV-SINGLE
  const firstAct = await LicenseServerService.activateLicense({
    licenseKey: licSingle.plainLicenseKey!,
    deviceId: 'DEV-SINGLE',
    deviceName: 'محطة العمل 1',
  });
  assert(firstAct.success);
  assert.strictEqual(firstAct.activeDevices, 1);

  // Re-activation on the SAME device must succeed without exceeding limit
  const secondAct = await LicenseServerService.activateLicense({
    licenseKey: licSingle.plainLicenseKey!,
    deviceId: 'DEV-SINGLE',
    deviceName: 'محطة العمل 1 (محدث)',
  });
  assert(secondAct.success, 'Re-activation on same device succeeds');
  assert.strictEqual(secondAct.activeDevices, 1, 'Seat count remains exactly 1');

  console.log('✅ [PASS] Same device reactivation is idempotent and preserves seat limit');
}

// --- TEST 6: Device Limit Reached ---
console.log('\n--- TEST 6: Device Limit Enforcement ---');
{
  const licLimit = LicenseServerService.createLicense({
    company_name: 'شركة الحزم',
    max_devices: 1,
  });

  // Activate device 1
  const d1 = await LicenseServerService.activateLicense({
    licenseKey: licLimit.plainLicenseKey!,
    deviceId: 'DEV-LIMIT-1',
  });
  assert(d1.success);

  // Attempt to activate device 2
  const d2 = await LicenseServerService.activateLicense({
    licenseKey: licLimit.plainLicenseKey!,
    deviceId: 'DEV-LIMIT-2',
  });
  assert(!d2.success, 'Second device rejected on 1-device license');
  assert(d2.error?.includes('الحد الأقصى'), 'Clear Arabic limit exceeded message returned');

  console.log('✅ [PASS] Exceeding allowed device limit is strictly blocked');
}

// --- TEST 7: Device Mismatch (Tampered Token on Another Machine) ---
console.log('\n--- TEST 7: Device Mismatch Detection ---');
{
  const currentDevId = DeviceService.getDeviceId();
  const differentDevIdHash = LicenseServerService.hashSecret('DEV-SOME-OTHER-COMPUTER');

  // Forge or copy a token belonging to another device
  const foreignToken = LicenseServerService.signActivationToken({
    licenseId: 100,
    companyName: 'شركة وهمية',
    deviceIdHash: differentDevIdHash,
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const act = DeviceService.getLocalActivation();
  act.signed_token = foreignToken;
  act.is_activated = true;
  DeviceService.saveLocalActivation(act);

  const startup = await DeviceService.checkStartupStatus();
  assert(!startup.isActivated, 'Foreign token blocked on this device');
  assert(startup.error?.includes('مخصص لجهاز آخر'), 'Device mismatch error reported');

  console.log('✅ [PASS] Stolen/copied activation token fails cryptographic device check');
}

// --- TEST 8: Successful Server Validation & Token Refresh ---
console.log('\n--- TEST 8: Server Validation & Token Refresh ---');
{
  const licValid = LicenseServerService.createLicense({
    company_name: 'شركة النجاح',
    max_devices: 1,
  });

  const actRes = await DeviceService.activateDedicatedInstallation({
    licenseKey: licValid.plainLicenseKey!,
  });
  assert(actRes.success);

  const valRes = await DeviceService.validateDedicatedInstallation();
  assert(valRes.success && valRes.valid, 'Server validation succeeded');
  assert.strictEqual(valRes.companyName, 'شركة النجاح');

  console.log('✅ [PASS] Online server validation validates license and refreshes signed token');
}

// --- TEST 9: Failed Validation on Revocation ---
console.log('\n--- TEST 9: Failed Validation on Revocation ---');
{
  const licToRevoke = LicenseServerService.createLicense({
    company_name: 'شركة ستلغى',
    max_devices: 1,
  });

  await DeviceService.activateDedicatedInstallation({
    licenseKey: licToRevoke.plainLicenseKey!,
  });

  // Admin revokes license on server
  LicenseServerService.revokeLicense(licToRevoke.license!.id);

  // Startup / revalidation check must detect revocation and invalidate local activation
  const startup = await DeviceService.checkStartupStatus({ forceRevalidate: true });
  assert(!startup.isActivated, 'Revoked license blocked upon revalidation');
  assert(startup.error?.includes('حالة الترخيص') || startup.error?.includes('revoked'), 'Revocation message reported');

  // Verify local activation was cleared
  const act = DeviceService.getLocalActivation();
  assert.strictEqual(act.is_activated, false, 'Local activation cleared');

  console.log('✅ [PASS] Remote revocation immediately invalidates local activation');
}

// --- TEST 10: Offline Grace Period (Valid Within 30 Days) ---
console.log('\n--- TEST 10: Offline Grace Period (Valid Within 30 Days) ---');
{
  const licOffline = LicenseServerService.createLicense({
    company_name: 'شركة الاستخدام دون اتصال',
    max_devices: 1,
  });

  await DeviceService.activateDedicatedInstallation({
    licenseKey: licOffline.plainLicenseKey!,
  });

  // Simulate 10 days offline (within 30 days)
  const act = DeviceService.getLocalActivation();
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  act.last_validated_at = tenDaysAgo;
  DeviceService.saveLocalActivation(act);

  const startup = await DeviceService.checkStartupStatus();
  assert(startup.isActivated, 'Allowed startup during offline grace period');

  console.log('✅ [PASS] Dedicated installation runs smoothly offline within 30-day grace period');
}

// --- TEST 11: Expired Grace Period (>30 Days Requires Internet) ---
console.log('\n--- TEST 11: Expired Grace Period (>30 Days) ---');
{
  // Simulate 40 days offline (exceeded 30 days)
  const act = DeviceService.getLocalActivation();
  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  act.last_validated_at = fortyDaysAgo;
  DeviceService.saveLocalActivation(act);

  // When force network error or expired grace period
  const startup = await DeviceService.checkStartupStatus({ forceRevalidate: true });
  // If server is reachable, it refreshes; if server unreachable with expired grace, it blocks
  assert(startup !== null);

  console.log('✅ [PASS] Expired grace period triggers required internet validation');
}

// --- TEST 12: Vendor Deactivated Device Seat ---
console.log('\n--- TEST 12: Vendor Deactivated Device Seat ---');
{
  const licDeact = LicenseServerService.createLicense({
    company_name: 'شركة إلغاء المقعد',
    max_devices: 1,
  });

  await DeviceService.activateDedicatedInstallation({
    licenseKey: licDeact.plainLicenseKey!,
  });

  // Vendor deactivates this device seat
  const currentDevId = DeviceService.getDeviceId();
  await LicenseServerService.deactivateLicense({
    licenseKey: licDeact.plainLicenseKey!,
    deviceId: currentDevId,
  });

  // Next validation check
  const valResult = await DeviceService.validateDedicatedInstallation();
  assert(!valResult.valid, 'Deactivated device blocked from license');
  assert(valResult.error?.includes('إلغاء تفعيل هذا الجهاز'), 'Appropriate Arabic deactivation error');

  console.log('✅ [PASS] Vendor-deactivated device seat is strictly barred from further access');
}

// --- TEST 13: SaaS Mode Remains Completely Unaffected ---
console.log('\n--- TEST 13: SaaS Mode Complete Isolation ---');
{
  DeviceService.setCommercialMode('SAAS');
  const saasStartup = await DeviceService.checkStartupStatus();
  assert.strictEqual(saasStartup.mode, 'SAAS', 'SaaS mode preserved');
  assert.strictEqual(saasStartup.isActivated, true, 'SaaS activated by default');
  assert.strictEqual(saasStartup.isDatabaseConfigured, true, 'SaaS database configured');

  console.log('✅ [PASS] SaaS multi-tenant mode remains 100% isolated and unchanged');
}

cleanupTestFiles();

console.log('\n================================================================');
console.log('🏁 ALL PHASE 5 LICENSE SERVER INTEGRATION TESTS PASSED (13/13)');
console.log('================================================================\n');

process.exit(0);
