import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { SystemDeploymentService } from '../services/systemDeploymentService';
import { LicenseServerService } from '../services/licenseServerService';
import { DeviceService } from '../services/deviceService';

async function runCommercialLicensingAndSaaSTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMMERCIAL DUAL-MODE & LICENSE SERVER TEST SUITE');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_commercial_licensing.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  initDatabase(testDbPath);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ' - ' + detail : ''}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: SaaS Company Isolation (Tenant Isolation)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: SaaS Multi-Tenant Isolation ---');
    const compA = CompanyRepository.create({
      name: 'شركة ليالي الشرق للأفراح',
      owner_name: 'خالد المنصور',
      owner_username: 'khaled_layali',
    });
    const compB = CompanyRepository.create({
      name: 'مؤسسة قمم للمؤتمرات',
      owner_name: 'طارق الزهراني',
      owner_username: 'tariq_qimam',
    });
    assert(compA.success && compB.success, 'Created two distinct SaaS companies');

    const eventA = EventRepository.create({
      name: 'حفل زفاف المنصور',
      date: '2026-11-20',
      capacity: 100,
      company_id: compA.company!.id,
    });
    InvitationRepository.generateBatch(eventA.id, 8);

    const eventB = EventRepository.create({
      name: 'مؤتمر قمم للابتكار 2026',
      date: '2026-12-10',
      capacity: 250,
      company_id: compB.company!.id,
    });
    InvitationRepository.generateBatch(eventB.id, 15);

    const compAEvents = EventRepository.getAll(compA.company!.id);
    const compBEvents = EventRepository.getAll(compB.company!.id);
    assert(compAEvents.length === 1 && compAEvents[0].id === eventA.id, 'Company A only sees its own events');
    assert(compBEvents.length === 1 && compBEvents[0].id === eventB.id, 'Company B only sees its own events');

    const compAInvs = InvitationRepository.getByEventId(eventA.id);
    const compBInvs = InvitationRepository.getByEventId(eventB.id);
    assert(compAInvs.length === 8 && compBInvs.length === 15, 'Tenant invitations isolated by event_id');

    // -----------------------------------------------------------------
    // TEST 2: SaaS Subscription Expiration & Data Retention (No Deletion)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: SaaS Subscription Expiration & Non-Destructive Suspension ---');
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);

    SubscriptionRepository.update(compA.company!.id, {
      status: 'expired',
      expiration_date: pastDate.toISOString(),
    });

    const activeCheck = SubscriptionRepository.isTenantActive(compA.company!.id);
    assert(!activeCheck.active, 'Subscription correctly reported as inactive');

    const loginRes = UserRepository.login('khaled_layali', compA.tempPassword!);
    assert(
      !loginRes.success && Boolean(loginRes.error?.includes('الاشتراك')),
      'Expired tenant login is blocked with polite renewal message'
    );

    // Verify company data is preserved intact
    const preservedEvents = EventRepository.getAll(compA.company!.id);
    const preservedInvs = InvitationRepository.getByEventId(eventA.id);
    assert(
      preservedEvents.length === 1 && preservedInvs.length === 8,
      'Company events and invitations data are 100% preserved (not deleted)'
    );

    // -----------------------------------------------------------------
    // TEST 3: Dedicated License Generation & Device Activation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Dedicated Perpetual License Activation ---');
    const license1Res = LicenseServerService.createLicense({
      company_name: 'شركة رويال للتنظيم',
      max_devices: 1,
      license_type: 'PERPETUAL',
    });
    assert(
      license1Res.success && !!license1Res.plainLicenseKey,
      'Super Admin generated perpetual license with plain key'
    );

    const device1Id = 'DEV-DESKTOP-PC-01';
    const actRes1 = await LicenseServerService.activateLicense({
      licenseKey: license1Res.plainLicenseKey!,
      deviceId: device1Id,
      deviceName: 'جهاز الإدارة 1',
    });

    assert(
      actRes1.success && !!actRes1.token && actRes1.companyName === 'شركة رويال للتنظيم',
      'Device 1 activated successfully and received signed HMAC token'
    );

    // Verify token validity
    const verifyToken = LicenseServerService.verifyActivationToken(actRes1.token!);
    assert(
      verifyToken.valid && verifyToken.payload?.companyName === 'شركة رويال للتنظيم',
      'Signed activation token verified cryptographically'
    );

    // -----------------------------------------------------------------
    // TEST 4: Second Device Activation & Device Limit Enforcement
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Device Limit Enforcement on 1-Device License ---');
    const device2Id = 'DEV-LAPTOP-PC-02';
    const actRes2 = await LicenseServerService.activateLicense({
      licenseKey: license1Res.plainLicenseKey!,
      deviceId: device2Id,
      deviceName: 'جهاز الاستقبال 2',
    });

    assert(
      !actRes2.success && Boolean(actRes2.error?.includes('الحد الأقصى للأجهزة')),
      'Second device blocked when license limit (max_devices = 1) is reached'
    );

    // Create a 2-device license and test multiple activations
    const license2Res = LicenseServerService.createLicense({
      company_name: 'مؤسسة الأفق المتعدد',
      max_devices: 2,
      license_type: 'PERPETUAL',
    });
    const multiDev1 = await LicenseServerService.activateLicense({
      licenseKey: license2Res.plainLicenseKey!,
      deviceId: 'DEV-A1',
    });
    const multiDev2 = await LicenseServerService.activateLicense({
      licenseKey: license2Res.plainLicenseKey!,
      deviceId: 'DEV-A2',
    });
    const multiDev3 = await LicenseServerService.activateLicense({
      licenseKey: license2Res.plainLicenseKey!,
      deviceId: 'DEV-A3',
    });
    assert(
      multiDev1.success && multiDev2.success && !multiDev3.success,
      '2-device license allows exactly 2 devices and blocks the 3rd'
    );

    // -----------------------------------------------------------------
    // TEST 5: License Revocation by Vendor / Super Admin
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: License Revocation ---');
    const revokeRes = LicenseServerService.revokeLicense(license1Res.license!.id);
    assert(revokeRes.success, 'Super Admin revoked license successfully');

    const validateRevoked = await LicenseServerService.validateLicense({
      token: actRes1.token!,
      deviceId: device1Id,
    });
    assert(
      !validateRevoked.valid && validateRevoked.status === 'revoked',
      'Validation fails when license status is revoked'
    );

    // Reactivate license
    const reactivateRes = LicenseServerService.reactivateLicense(license1Res.license!.id);
    assert(reactivateRes.success, 'Super Admin reactivated license');

    // -----------------------------------------------------------------
    // TEST 6: Device Deactivation & Seat Release
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Remote Device Deactivation & Seat Release ---');
    const actsBefore = LicenseServerService.getActivations(license1Res.license!.id);
    const activeAct = actsBefore.find((a) => !a.deactivated_at);
    assert(!!activeAct, 'Found active device activation row');

    const deactRes = LicenseServerService.deactivateDeviceById(activeAct!.id);
    assert(deactRes.success, 'Deactivated device seat');

    // Now device 2 should be able to activate
    const actRes2AfterRelease = await LicenseServerService.activateLicense({
      licenseKey: license1Res.plainLicenseKey!,
      deviceId: device2Id,
      deviceName: 'جهاز الاستقبال 2 الجديد',
    });
    assert(
      actRes2AfterRelease.success && !!actRes2AfterRelease.token,
      'Device 2 successfully activates after previous seat was released'
    );

    // -----------------------------------------------------------------
    // TEST 7: Invalid License Handling
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Invalid License Key Rejection ---');
    const invalidLicRes = await LicenseServerService.activateLicense({
      licenseKey: 'PERPETUAL-FAKE-KEYS-0000-9999',
      deviceId: 'DEV-ANY',
    });
    assert(
      !invalidLicRes.success && Boolean(invalidLicRes.error?.includes('غير صحيح') || invalidLicRes.error?.includes('غير مسجل')),
      'Invalid / fake license key is rejected cleanly'
    );

    // -----------------------------------------------------------------
    // TEST 8: Expired or Tampered Token Detection
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Tampered Token Detection ---');
    // Modify signature of token
    const validToken = actRes2AfterRelease.token!;
    const decoded = JSON.parse(Buffer.from(validToken, 'base64url').toString('utf8'));
    decoded.companyName = 'شركة مقرصنة ومعدلة';
    const tamperedToken = Buffer.from(JSON.stringify(decoded), 'utf8').toString('base64url');

    const tamperCheck = LicenseServerService.verifyActivationToken(tamperedToken);
    assert(
      !tamperCheck.valid && Boolean(tamperCheck.error?.includes('التلاعب') || tamperCheck.error?.includes('غير متطابق')),
      'Tampered payload fails HMAC signature verification'
    );

    // -----------------------------------------------------------------
    // TEST 9: Unauthorized Super Admin Prevention (403 Forbidden)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 9: Unauthorized Super Admin Access Prevention ---');
    const companyOwner = UserRepository.getByUsername('khaled_layali');
    let blockedSuperAdminAction = false;
    try {
      SystemDeploymentService.assertSuperAdmin(companyOwner!.user);
    } catch (err: any) {
      if (err.message.includes('403') || err.message.includes('خاصة بمسؤول النظام')) {
        blockedSuperAdminAction = true;
      }
    }
    assert(blockedSuperAdminAction, 'Company Owner is blocked from Super Admin deployment controls (403)');

    // -----------------------------------------------------------------
    // TEST 10: Company Admin Infrastructure Isolation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 10: Infrastructure & Key Isolation ---');
    const superAdmin = UserRepository.getByUsername('Ryan_osama');
    assert(superAdmin?.user.role === 'SUPER_ADMIN', 'Super Admin user identified');

    const allLicenses = LicenseServerService.listLicenses();
    assert(allLicenses.length >= 2, 'License Server accurately tracks all generated licenses');

    // Ensure license keys are stored as hashes
    for (const lic of allLicenses) {
      assert(
        !lic.license_key_hash.startsWith('LIC-') && lic.license_key_hash.length === 64,
        `License ${lic.id} stores 64-char SHA-256 hash without exposing plain secret`
      );
    }

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    process.exit(1);
  }
}

runCommercialLicensingAndSaaSTests();
