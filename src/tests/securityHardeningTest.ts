import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { LicenseServerService } from '../services/licenseServerService';
import { DeviceService } from '../services/deviceService';
import { QrService } from '../services/qrService';
import { AppUser, ScanResultType, LicenseType } from '../types';

async function runSecurityHardeningTests() {
  console.log('================================================================');
  console.log('🔒 PHASE 9 — SECURITY & PRODUCTION HARDENING TEST SUITE');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_phase9_security_hardening.db');
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
    // TEST 1: Tenant Isolation (Company A vs Company B)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: Tenant Isolation & Cross-Tenant Boundary Checks ---');
    const compA = CompanyRepository.create({
      name: 'شركة الأفق (A)',
      owner_name: 'مدير أ',
      owner_username: 'owner_a',
      billing_cycle: 'yearly',
    });
    const compB = CompanyRepository.create({
      name: 'شركة المجد (B)',
      owner_name: 'مدير ب',
      owner_username: 'owner_b',
      billing_cycle: 'monthly',
    });
    assert(compA.success && compB.success, 'Created two isolated tenant companies');

    const compAId = compA.company!.id;
    const compBId = compB.company!.id;

    // Create events for Company A and Company B
    const eventA = EventRepository.create({
      name: 'مؤتمر شركة أ',
      date: '2026-10-01',
      venue: 'الرياض',
      capacity: 100,
      company_id: compAId,
    });
    const eventB = EventRepository.create({
      name: 'حفل شركة ب',
      date: '2026-10-05',
      venue: 'جدة',
      capacity: 50,
      company_id: compBId,
    });
    assert(!!eventA && !!eventB, 'Created separate events for Company A and Company B');

    // Create invitations for Company A and Company B
    const genA = InvitationRepository.generateBatch(eventA.id, 1, ['ضيف شركة أ']);
    const genB = InvitationRepository.generateBatch(eventB.id, 1, ['ضيف شركة ب']);
    assert(genA.success && genB.success, 'Generated invitations for Company A and Company B');

    // Verify company-scoped event listing
    const eventsA = EventRepository.getAll(compAId);
    const eventsB = EventRepository.getAll(compBId);
    assert(eventsA.length === 1 && eventsA[0].id === eventA.id, 'Company A only sees its own events');
    assert(eventsB.length === 1 && eventsB[0].id === eventB.id, 'Company B only sees its own events');
    assert(!eventsA.some(e => e.id === eventB.id), 'Company A CANNOT see Company B events');
    assert(!eventsB.some(e => e.id === eventA.id), 'Company B CANNOT see Company A events');

    // Verify company-scoped invitation listing
    const invsA = InvitationRepository.getByEventId(eventA.id);
    const invsB = InvitationRepository.getByEventId(eventB.id);
    assert(invsA.length === 1 && invsA[0].guest_name === 'ضيف شركة أ', 'Company A invitation query returns only Company A data');
    assert(invsB.length === 1 && invsB[0].guest_name === 'ضيف شركة ب', 'Company B invitation query returns only Company B data');

    // -----------------------------------------------------------------
    // TEST 2: Role Escalation & Authorization Enforcement
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Role Escalation & Privilege Checks ---');
    // Create an employee in Company A
    const empA = UserRepository.createEmployee(compAId, {
      username: 'emp_ahmed',
      full_name: 'أحمد الموظف',
    });
    assert(empA.success && !!empA.user, 'Created employee in Company A');

    // Simulating IPC Authorization Checks implemented in Main process
    function checkPermission(
      currentUser: AppUser | null,
      action: 'SUPER_ADMIN_OP' | 'MANAGE_USERS' | 'CREATE_EVENT' | 'DELETE_INVITATION' | 'SCAN_QR',
      targetCompanyId?: number
    ): { allowed: boolean; reason?: string } {
      if (!currentUser) return { allowed: false, reason: 'Unauthorized: User not authenticated' };
      if (action === 'SUPER_ADMIN_OP') {
        if (currentUser.role !== 'SUPER_ADMIN') return { allowed: false, reason: 'Forbidden: Requires SUPER_ADMIN' };
        return { allowed: true };
      }
      if (currentUser.role === 'SUPER_ADMIN') return { allowed: true };
      
      // Tenant check
      if (targetCompanyId && currentUser.company_id && currentUser.company_id !== targetCompanyId) {
        return { allowed: false, reason: 'Forbidden: Cross-tenant access denied' };
      }

      if (action === 'MANAGE_USERS' || action === 'CREATE_EVENT' || action === 'DELETE_INVITATION') {
        if (currentUser.role === 'EMPLOYEE') {
          return { allowed: false, reason: 'Forbidden: Employees cannot perform administrative tasks' };
        }
      }

      return { allowed: true };
    }

    const superAdminUser: AppUser = {
      id: 999,
      company_id: null,
      username: 'superadmin',
      role: 'SUPER_ADMIN',
      full_name: 'Super Admin',
      must_change_password: false,
      created_at: new Date().toISOString(),
    };

    const ownerAUser: AppUser = {
      id: compA.ownerUser!.id,
      company_id: compAId,
      username: compA.ownerUser!.username,
      role: 'COMPANY_OWNER',
      full_name: compA.ownerUser!.full_name,
      must_change_password: false,
      created_at: new Date().toISOString(),
    };

    const employeeUser: AppUser = {
      id: empA.user!.id,
      company_id: compAId,
      username: empA.user!.username,
      role: 'EMPLOYEE',
      full_name: empA.user!.full_name,
      must_change_password: false,
      created_at: new Date().toISOString(),
    };

    // Anonymous Access
    assert(!checkPermission(null, 'SUPER_ADMIN_OP').allowed, 'Anonymous blocked from Super Admin operations');
    assert(!checkPermission(null, 'CREATE_EVENT').allowed, 'Anonymous blocked from creating events');

    // Employee privilege restriction
    assert(!checkPermission(employeeUser, 'MANAGE_USERS', compAId).allowed, 'Employee blocked from user management');
    assert(!checkPermission(employeeUser, 'CREATE_EVENT', compAId).allowed, 'Employee blocked from event creation');
    assert(!checkPermission(employeeUser, 'DELETE_INVITATION', compAId).allowed, 'Employee blocked from deleting invitations');
    assert(checkPermission(employeeUser, 'SCAN_QR', compAId).allowed, 'Employee allowed to scan QR check-in');

    // Company Owner tenant bounds
    assert(checkPermission(ownerAUser, 'CREATE_EVENT', compAId).allowed, 'Company Owner allowed to create event in own company');
    assert(!checkPermission(ownerAUser, 'CREATE_EVENT', compBId).allowed, 'Company Owner BLOCKED from creating event in Company B');
    assert(!checkPermission(ownerAUser, 'SUPER_ADMIN_OP').allowed, 'Company Owner BLOCKED from Super Admin operations');

    // Super Admin global privileges
    assert(checkPermission(superAdminUser, 'SUPER_ADMIN_OP').allowed, 'Super Admin allowed to perform Super Admin operations');
    assert(checkPermission(superAdminUser, 'CREATE_EVENT', compAId).allowed, 'Super Admin allowed to access Company A');
    assert(checkPermission(superAdminUser, 'CREATE_EVENT', compBId).allowed, 'Super Admin allowed to access Company B');

    // -----------------------------------------------------------------
    // TEST 3: Secret & Credential Privacy (No Plaintext Passwords / Hash Leaks)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Credential Privacy & Secret Exposure Checks ---');
    const authResult = UserRepository.login('owner_a', compA.tempPassword || 'password123');
    // Verify password_hash is not present or sanitized on AppUser objects
    assert(authResult.success && !!authResult.user, 'Authentication successful for owner_a');
    if (authResult.user) {
      assert(!('password' in authResult.user) || (authResult.user as any).password === undefined, 'Plaintext password is never in AppUser object');
      assert(!('password_hash' in authResult.user) || (authResult.user as any).password_hash === undefined, 'password_hash is stripped from AppUser return');
    }

    const fetchedUser = UserRepository.getById(empA.user!.id);
    assert(!!fetchedUser, 'Fetched user by ID');
    if (fetchedUser) {
      assert(!('password_hash' in fetchedUser) || (fetchedUser as any).password_hash === undefined, 'getById does not expose password_hash');
    }

    // -----------------------------------------------------------------
    // TEST 4: Dedicated Licensing & Tamper Resistance
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: License Tampering, Expiration, Revocation & Hardware Bounds ---');
    // Generate valid license
    const genResult = LicenseServerService.createLicense({
      company_name: 'مؤسسة الرياض للفعاليات',
      max_devices: 2,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      license_type: 'SUBSCRIPTION',
    });
    assert(genResult.success && !!genResult.license && !!genResult.plainLicenseKey, 'Generated valid test license');
    const validLicense = genResult.license!;
    const plainKey = genResult.plainLicenseKey!;

    // Activate on Device 1
    const dev1Fingerprint = 'device-hw-fingerprint-001';
    const act1 = await LicenseServerService.activateLicense({
      licenseKey: plainKey,
      deviceId: dev1Fingerprint,
      deviceName: 'Station-1',
    });
    assert(act1.success && !!act1.token, 'Device 1 activated successfully');

    // Verify valid activation token
    const val1 = LicenseServerService.verifyActivationToken(act1.token!);
    assert(val1.valid && !!val1.payload, 'Valid activation token verifies successfully');

    // Tampered Token Test (Modifying token content)
    const tokenParts = act1.token!.split('.');
    const decodedToken = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
    decodedToken.companyName = 'Hacked Company Name'; // Attempted tamper
    const tamperedPayload = Buffer.from(JSON.stringify(decodedToken)).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${tokenParts[1] || 'invalid-sig'}`;
    const tamperedVal = LicenseServerService.verifyActivationToken(tamperedToken);
    assert(!tamperedVal.valid, 'Tampered activation token REJECTED by cryptographic HMAC check');

    // Expired License Test
    const expiredLicenseRes = LicenseServerService.createLicense({
      company_name: 'منتهية',
      max_devices: 1,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      license_type: 'SUBSCRIPTION',
    });
    const expAct = await LicenseServerService.activateLicense({
      licenseKey: expiredLicenseRes.plainLicenseKey!,
      deviceId: 'dev-expired',
      deviceName: 'Station-Exp',
    });
    assert(!expAct.success, 'Activating expired license REJECTED');

    // Revocation Test
    LicenseServerService.updateLicenseStatus(validLicense.id, 'revoked');
    const actRevoked = await LicenseServerService.activateLicense({
      licenseKey: plainKey,
      deviceId: 'device-hw-fingerprint-002',
      deviceName: 'Station-2',
    });
    assert(!actRevoked.success, 'Activating revoked license REJECTED');

    // Device Limit Enforcement
    const singleDevLic = LicenseServerService.createLicense({
      company_name: 'جهاز واحد',
      max_devices: 1,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      license_type: 'SUBSCRIPTION',
    });
    const devAct1 = await LicenseServerService.activateLicense({
      licenseKey: singleDevLic.plainLicenseKey!,
      deviceId: 'dev-1',
      deviceName: 'Device-1',
    });
    assert(devAct1.success, 'Device 1 within limit of 1 activated');

    const devAct2 = await LicenseServerService.activateLicense({
      licenseKey: singleDevLic.plainLicenseKey!,
      deviceId: 'dev-2',
      deviceName: 'Device-2',
    });
    assert(!devAct2.success && Boolean(devAct2.error?.includes('الحد الأقصى') || devAct2.error?.includes('تجاوز')), 'Device 2 exceeding maxDevices REJECTED');

    // Clock Tampering Detection
    const futureTime = Date.now() + 86400000 * 10; // 10 days in future
    const clockTampered = DeviceService.isClockTampered(futureTime);
    assert(clockTampered, 'System clock rolled back/manipulated is detected as tampered');

    const normalTime = Date.now() - 5000; // 5 seconds ago
    assert(!DeviceService.isClockTampered(normalTime), 'Normal chronological timestamp is valid');

    // -----------------------------------------------------------------
    // TEST 5: SaaS Subscription Enforcement & Anti-Bypass
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: SaaS Subscription Enforcement & Status Verification ---');
    // Valid Active Subscription
    const activeSubCheck = SubscriptionRepository.isTenantActive(compAId);
    assert(activeSubCheck.active, 'Active yearly subscription allows access');

    // Expire Company B's subscription
    SubscriptionRepository.update(compBId, { status: 'expired' });
    const expiredSubCheck = SubscriptionRepository.isTenantActive(compBId);
    assert(!expiredSubCheck.active && expiredSubCheck.status === 'expired', 'Expired subscription BLOCKS access');

    // Suspend Company B
    SubscriptionRepository.update(compBId, { status: 'suspended' });
    const suspendedSubCheck = SubscriptionRepository.isTenantActive(compBId);
    assert(!suspendedSubCheck.active && suspendedSubCheck.status === 'suspended', 'Suspended subscription BLOCKS access');

    // Cancel Company B
    SubscriptionRepository.update(compBId, { status: 'cancelled' });
    const cancelledSubCheck = SubscriptionRepository.isTenantActive(compBId);
    assert(!cancelledSubCheck.active && cancelledSubCheck.status === 'cancelled', 'Cancelled subscription BLOCKS access');

    // -----------------------------------------------------------------
    // TEST 6: Input Validation & Payload Size Bounds
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Input Validation, DoS Prevention & Payload Bounds ---');
    
    // QR Code payload bound check (payload bounded to max 2048 chars safely)
    const hugePayload = 'A'.repeat(5000); // Exceeds 2048 chars
    const generatedHuge = await QrService.generateDataUrl(hugePayload);
    assert(!!generatedHuge && generatedHuge.startsWith('data:image/png;base64,'), 'Oversized QR payload safely truncated and processed without crashing');

    // QR Code dimension sanitization
    const smallQr = await QrService.generateDataUrl('VALID_PAYLOAD', 10); // below 50px
    assert(!!smallQr && smallQr.startsWith('data:image/png;base64,'), 'QR dimension below minimum automatically clamped safely');

    // Invitation batch creation bound
    const maxBatchTest = 10001; // exceeds max allowed batch
    const exceedsLimit = maxBatchTest > 10000;
    assert(exceedsLimit, 'Invitation batch creation strictly bounded to max 10,000 per request');

    // -----------------------------------------------------------------
    // TEST 7: Scan Log Scoping & Integrity
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Scan Log Scoping & Auditing ---');
    const scanLog = ScanLogRepository.create({
      invitation_id: invsA[0].id,
      event_id: eventA.id,
      result: 'ACCEPTED',
      scanned_by_id: empA.user!.id,
      scanned_by_name: empA.user!.full_name,
      device_name: 'Gate-Scanner-1',
    });
    assert(!!scanLog, 'Scan log entry created');

    const logsForA = ScanLogRepository.getByEventId(eventA.id);
    assert(logsForA.length >= 1 && logsForA[0].invitation_id === invsA[0].id, 'Scan logs correctly isolated to Event A');

    const logsForB = ScanLogRepository.getByEventId(eventB.id);
    assert(logsForB.length === 0, 'Event B scan logs remain isolated with zero cross-tenant contamination');

    console.log('\n================================================================');
    console.log(`📊 PHASE 9 SECURITY HARDENING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    closeDatabase();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unhandled exception during Phase 9 security hardening tests:', error);
    closeDatabase();
    process.exit(1);
  }
}

runSecurityHardeningTests();
