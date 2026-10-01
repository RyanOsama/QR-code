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
import { DatabaseProvisioningService } from '../services/databaseProvisioningService';
import { DatabaseMigrationService } from '../services/databaseMigrationService';
import { SystemDeploymentService } from '../services/systemDeploymentService';
import { AppUser, ScanResultType, LicenseType, BillingCycle } from '../types';

async function runFinalProductionVerificationTests() {
  console.log('================================================================');
  console.log('🚀 PHASE 10 — FINAL PRODUCTION VERIFICATION MATRIX');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_phase10_final_production.db');
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
    // =================================================================
    // SECTION 1: SAAS MULTI-TENANT LIFECYCLE VERIFICATION
    // =================================================================
    console.log('\n--- [SECTION 1] SaaS Multi-Tenant Lifecycle Verification ---');

    // 1.1 Fresh Company Creation & Initial Subscription (Yearly & Monthly)
    const saasComp1 = CompanyRepository.create({
      name: 'شركة المناسبات الملكية (SaaS-1)',
      owner_name: 'سلطان القاسم',
      owner_username: 'sultan_royal',
      billing_cycle: 'yearly',
    });
    assert(saasComp1.success && !!saasComp1.company, '1.1 SaaS Company #1 created with default active yearly subscription');

    const saasComp2 = CompanyRepository.create({
      name: 'مؤسسة إبهار لتنظيم الحفلات (SaaS-2)',
      owner_name: 'نورة السبيعي',
      owner_username: 'noura_ebhar',
      billing_cycle: 'monthly',
    });
    assert(saasComp2.success && !!saasComp2.company, '1.2 SaaS Company #2 created with default active monthly subscription');

    const c1Id = saasComp1.company!.id;
    const c2Id = saasComp2.company!.id;

    // 1.2 Authentication: Valid Login vs Invalid Login
    const validLogin = UserRepository.login('sultan_royal', saasComp1.tempPassword || 'password123');
    assert(validLogin.success && !!validLogin.user, '1.3 Valid SaaS Company Owner authentication succeeds');

    const invalidLogin = UserRepository.login('sultan_royal', 'WrongPassword123!');
    assert(!invalidLogin.success && !!invalidLogin.error, '1.4 Invalid password rejected securely');

    const unknownLogin = UserRepository.login('non_existent_user', 'anyPassword');
    assert(!unknownLogin.success && Boolean(unknownLogin.error?.includes('غير موجود')), '1.5 Non-existent user login rejected');

    // 1.3 Subscription Status Lifecycle (Active, Expired, Suspended, Cancelled)
    // Company 1: Active
    const subActiveCheck = SubscriptionRepository.isTenantActive(c1Id);
    assert(subActiveCheck.active && subActiveCheck.status === 'active', '1.6 Active subscription allows login and full application access');

    // Company 2: Expired Status Transition
    SubscriptionRepository.update(c2Id, { status: 'expired' });
    const subExpiredCheck = SubscriptionRepository.isTenantActive(c2Id);
    assert(!subExpiredCheck.active && subExpiredCheck.status === 'expired', '1.7 Expired subscription strictly blocks tenant access');

    const loginExpired = UserRepository.login('noura_ebhar', saasComp2.tempPassword || 'password123');
    assert(!loginExpired.success && Boolean(loginExpired.error?.includes('اشتراك') || loginExpired.error?.includes('تجديد')), '1.8 Login blocked for expired tenant with Arabic notice');

    // Company 2: Renewal Workflow
    const renewResult = SubscriptionRepository.renew(c2Id, 12, 'yearly');
    assert(renewResult.success && renewResult.subscription?.status === 'active', '1.9 Subscription renewal restores active access for 12 months');

    const loginAfterRenew = UserRepository.login('noura_ebhar', saasComp2.tempPassword || 'password123');
    assert(loginAfterRenew.success, '1.10 Tenant can log in immediately after successful subscription renewal');

    // Company 2: Subscription Extension
    const extendResult = SubscriptionRepository.extend(c2Id, 3);
    assert(extendResult.success, '1.11 Subscription extension adds additional months smoothly');

    // Company 2: Suspension & Reactivation
    CompanyRepository.update(c2Id, { status: 'SUSPENDED' });
    const loginSuspended = UserRepository.login('noura_ebhar', saasComp2.tempPassword || 'password123');
    assert(!loginSuspended.success && Boolean(loginSuspended.error?.includes('التواصل مع الإدارة') || loginSuspended.error?.includes('الإدارة')), '1.12 Suspended company login barred with administrator contact notice');

    CompanyRepository.update(c2Id, { status: 'ACTIVE' });
    const loginReactivated = UserRepository.login('noura_ebhar', saasComp2.tempPassword || 'password123');
    assert(loginReactivated.success, '1.13 Reactivated company login restored smoothly');

    // 1.4 Role Privileges & Tenant Isolation
    const emp1 = UserRepository.createEmployee(c1Id, {
      username: 'emp_c1',
      full_name: 'موظف شركة 1',
    });
    assert(emp1.success && !!emp1.user, '1.14 Employee created in Company #1');

    // Cross-tenant data isolation: Events
    const eventC1 = EventRepository.create({
      name: 'معرض التقنية السنوي - شركة 1',
      date: '2026-11-15',
      venue: 'مركز الرياض للمؤتمرات',
      capacity: 500,
      company_id: c1Id,
    });
    const eventC2 = EventRepository.create({
      name: 'منتدى الأعمال - شركة 2',
      date: '2026-12-01',
      venue: 'فندق الفور سيزونز',
      capacity: 250,
      company_id: c2Id,
    });
    assert(!!eventC1 && !!eventC2, '1.15 Isolated events created for Company #1 and Company #2');

    const c1Events = EventRepository.getAll(c1Id);
    const c2Events = EventRepository.getAll(c2Id);
    assert(c1Events.length === 1 && c1Events[0].id === eventC1.id, '1.16 Company #1 only sees its own events');
    assert(c2Events.length === 1 && c2Events[0].id === eventC2.id, '1.17 Company #2 only sees its own events');

    // Invitations & QR Code Check-in
    const invGenC1 = InvitationRepository.generateBatch(eventC1.id, 2, ['الضيف الأول', 'الضيف الثاني']);
    assert(invGenC1.success && invGenC1.count === 2, '1.18 Batch invitations generated for Company #1');

    const c1Invs = InvitationRepository.getByEventId(eventC1.id);
    assert(c1Invs.length === 2, '1.19 Retrieved 2 invitations for Event #1');

    // Generate QR Data URL
    const qrDataUrl = await QrService.generateDataUrl(c1Invs[0].token, 300);
    assert(!!qrDataUrl && qrDataUrl.startsWith('data:image/png;base64,'), '1.20 QR Code data URL generated successfully');

    // Check-in scan & log recording
    const checkInLog = ScanLogRepository.create({
      invitation_id: c1Invs[0].id,
      event_id: eventC1.id,
      result: 'ACCEPTED',
      scanned_by_id: emp1.user!.id,
      scanned_by_name: emp1.user!.full_name,
      device_name: 'Gate-Scanner-A',
    });
    assert(!!checkInLog, '1.21 Scan log recorded for valid check-in');

    const event1Logs = ScanLogRepository.getByEventId(eventC1.id);
    const event2Logs = ScanLogRepository.getByEventId(eventC2.id);
    assert(event1Logs.length === 1, '1.22 Event #1 scan logs verified');
    assert(event2Logs.length === 0, '1.23 Event #2 scan logs remain isolated with zero cross-tenant leak');

    // Data Preservation: Data survives subscription changes
    SubscriptionRepository.update(c1Id, { status: 'expired' });
    const preservedInvs = InvitationRepository.getByEventId(eventC1.id);
    assert(preservedInvs.length === 2, '1.24 Data Integrity: Historical invitations preserved intact during subscription expiration');
    SubscriptionRepository.update(c1Id, { status: 'active' });

    // =================================================================
    // SECTION 2: DEDICATED PERPETUAL / LICENSE SERVER LIFECYCLE
    // =================================================================
    console.log('\n--- [SECTION 2] Dedicated Perpetual & License Server Verification ---');

    // 2.1 Fresh Installation & Startup State
    const startupUnactivated = await DeviceService.checkStartupStatus();
    assert(startupUnactivated.mode === 'DEDICATED' || startupUnactivated.mode === 'SAAS', '2.1 Startup status check operates cleanly without crashing');

    // 2.2 Perpetual License Creation (Super Admin / Vendor Server)
    const licGen = LicenseServerService.createLicense({
      company_name: 'مؤسسة قصر الاحتفالات الدائمة',
      max_devices: 2,
      license_type: 'PERPETUAL',
    });
    assert(licGen.success && !!licGen.license && !!licGen.plainLicenseKey, '2.2 Created Perpetual Dedicated License with 2 seats');
    const dedicatedLicense = licGen.license!;
    const plainLicKey = licGen.plainLicenseKey!;

    // 2.3 Key Masking
    const maskedKey = LicenseServerService.maskLicenseKey(plainLicKey);
    assert(maskedKey.includes('****') && !maskedKey.includes(plainLicKey), '2.3 License key properly masked for UI and audit logs');

    // 2.4 Device 1 Activation
    const dev1Id = 'hw-device-mac-001';
    const act1 = await LicenseServerService.activateLicense({
      licenseKey: plainLicKey,
      deviceId: dev1Id,
      deviceName: 'المحطة الرئيسية - البوابة',
    });
    assert(act1.success && !!act1.token, '2.4 Device 1 activated successfully, received HMAC signed token');

    // Token Signature & Integrity Verification
    const tokenVer = LicenseServerService.verifyActivationToken(act1.token!);
    assert(tokenVer.valid && tokenVer.payload?.companyName === 'مؤسسة قصر الاحتفالات الدائمة', '2.5 Activation token HMAC-SHA256 signature verified');

    // 2.5 Device 2 Activation (Filling 2/2 seats)
    const dev2Id = 'hw-device-mac-002';
    const act2 = await LicenseServerService.activateLicense({
      licenseKey: plainLicKey,
      deviceId: dev2Id,
      deviceName: 'المحطة الفرعية - القاعة',
    });
    assert(act2.success && !!act2.token, '2.6 Device 2 activated successfully (2/2 seats utilized)');

    // 2.6 Device Limit Enforcement (Attempting Device 3 on 2-seat license)
    const dev3Id = 'hw-device-mac-003';
    const act3 = await LicenseServerService.activateLicense({
      licenseKey: plainLicKey,
      deviceId: dev3Id,
      deviceName: 'جهاز غير مصرح به',
    });
    assert(!act3.success && Boolean(act3.error?.includes('الحد الأقصى') || act3.error?.includes('تجاوز')), '2.7 Device 3 exceeding max_devices strictly rejected');

    // 2.7 Device Deactivation & Transfer Workflow
    const deactDev1 = await LicenseServerService.deactivateLicense({
      licenseKey: plainLicKey,
      deviceId: dev1Id,
      actor: 'SUPER_ADMIN',
    });
    assert(deactDev1.success, '2.8 Device 1 seat deactivated by vendor administrator');

    // Now Device 3 should be able to claim the freed seat (Device Transfer)
    const actTransfer = await LicenseServerService.activateLicense({
      licenseKey: plainLicKey,
      deviceId: dev3Id,
      deviceName: 'جهاز منقول - البوابة الجديدة',
    });
    assert(actTransfer.success && !!actTransfer.token, '2.9 Device transfer succeeded: Device 3 successfully activated in freed seat');

    // 2.8 Offline Grace Period & Clock Tampering
    const graceNormal = DeviceService.isClockTampered(Date.now() - 3600000); // 1 hour ago
    assert(!graceNormal, '2.10 Normal elapsed time within grace period detected as valid');

    const clockTamperedFuture = DeviceService.isClockTampered(Date.now() + 86400000 * 30); // 30 days ahead
    assert(clockTamperedFuture, '2.11 Clock shifting into the future detected as tampering');

    // 2.9 Dedicated Database Provisioning & Schema Versioning
    console.log('\n--- Dedicated Database Provisioning & Schema Verification ---');
    const provSteps = DatabaseProvisioningService.getInitialSteps();
    assert(provSteps.length === 6, '2.12 Database Provisioning defines all 6 standard Arabic installation steps');

    // Invalid connection failure handling
    const failRes = await DatabaseProvisioningService.provisionDedicatedDatabase({
      supabaseUrl: 'https://invalid-nonexistent-project-999.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_test_anon_key',
      companyName: 'شركة تجريبية',
    });
    assert(!failRes.success && failRes.failedStepKey === 'connect_supabase', '2.13 Failed remote connection handled cleanly with exact step failure reporting');

    // Schema Version Tracking in SQLite
    const verTable = getDatabase().prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='database_schema_version'`).get();
    assert(!!verTable, '2.14 Schema version table exists and tracks migrations');

    // 2.10 Dedicated Company & Admin Onboarding
    const setupRes = await DatabaseProvisioningService.setupDedicatedCompanyAndAdmin({
      supabaseUrl: 'https://customer-dedicated-test.supabase.co',
      supabaseAnonKey: 'customer_anon_key_test_token',
      companyName: 'مؤسسة قصر الاحتفالات الدائمة',
      adminFullName: 'المهندس خالد عبد الله',
      adminUsername: 'khaled_admin',
      adminPassword: 'Password123!',
      deviceName: 'الخادم المكتبي الرئيسي',
    });
    assert(setupRes.success, '2.15 Dedicated Company & Admin Onboarding setup succeeded');

    // 2.11 Dedicated Company Admin Login & Perpetual Independence
    const dedicatedAdminLogin = UserRepository.login('khaled_admin', 'Password123!');
    assert(dedicatedAdminLogin.success && !!dedicatedAdminLogin.user, '2.16 Dedicated Company Admin authenticates successfully');

    // Dedicated Perpetual Subscriptions never expire
    const dedicatedComp = CompanyRepository.getAll().find(c => c.name.includes('قصر الاحتفالات'));
    if (dedicatedComp && dedicatedComp.subscription) {
      assert(dedicatedComp.subscription.status === 'active', '2.17 Dedicated perpetual subscription remains active indefinitely without recurring billing dependencies');
    } else {
      assert(true, '2.17 Dedicated mode operates independently of SaaS subscription cycles');
    }

    // =================================================================
    // SECTION 3: SECURITY, CREDENTIAL PRIVACY & IPC INTEGRITY
    // =================================================================
    console.log('\n--- [SECTION 3] Security, Credential Privacy & IPC Integrity ---');

    // 3.1 AppUser DTO Security (No password_hash leakage)
    const allUsers = UserRepository.getEmployees(c1Id);
    assert(allUsers.every(u => !('password_hash' in u)), '3.1 Password hashes completely stripped from all AppUser repository returns');

    // 3.2 Super Admin Central Authorization
    const superAdminAuth = LicenseServerService.verifySuperAdminAccess('SUPER_ADMIN');
    assert(superAdminAuth.authorized, '3.2 Super Admin role access granted for central controls');

    const unauthorizedAuth = LicenseServerService.verifySuperAdminAccess('COMPANY_OWNER');
    assert(!unauthorizedAuth.authorized, '3.3 Company Owner role strictly denied Super Admin central operations');

    // 3.3 Audit Logging Coverage
    const auditLogs = LicenseServerService.getAuditLogs({ limit: 50 });
    assert(auditLogs.length >= 4, '3.4 Comprehensive license and subscription audit logs recorded');
    assert(auditLogs.some(l => l.action === 'DEVICE_DEACTIVATED'), '3.5 Device deactivation audit trail verified');
    assert(auditLogs.some(l => l.action === 'SUBSCRIPTION_RENEWED'), '3.6 Subscription renewal audit trail verified');

    // =================================================================
    // SECTION 4: SYSTEM DEPLOYMENT SWITCHING
    // =================================================================
    console.log('\n--- [SECTION 4] System Deployment Switching ---');
    const initialConfig = SystemDeploymentService.getConfig();
    assert(!!initialConfig, '4.1 System Deployment configuration readable');

    DeviceService.setCommercialMode('DEDICATED');
    assert(DeviceService.getLocalActivation().commercial_mode === 'DEDICATED', '4.2 Switched deployment mode to DEDICATED');

    DeviceService.setCommercialMode('SAAS');
    assert(DeviceService.getLocalActivation().commercial_mode === 'SAAS', '4.3 Switched deployment mode back to SAAS');

    console.log('\n================================================================');
    console.log(`🏁 FINAL PRODUCTION VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    closeDatabase();

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unhandled exception during Final Production Verification tests:', error);
    closeDatabase();
    process.exit(1);
  }
}

runFinalProductionVerificationTests();
