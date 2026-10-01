import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { SystemDeploymentService } from '../services/systemDeploymentService';
import { AppUser } from '../types';

async function runDeploymentAndLicensingTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PRODUCTION DEPLOYMENT & LICENSING TEST SUITE');
  console.log('====================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_deployment.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  initDatabase(testDbPath);
  const db = getDatabase();

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
    // -------------------------------------------------------------
    // TEST 1: Default Super Admin Seeding & Access
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Super Admin Seeding & Permissions ---');
    const superAdminUser = UserRepository.getByUsername('Ryan_osama');
    assert(!!superAdminUser && superAdminUser.user.role === 'SUPER_ADMIN', 'Super Admin exists with role SUPER_ADMIN');

    let superAdminCheckPassed = false;
    try {
      SystemDeploymentService.assertSuperAdmin(superAdminUser!.user);
      superAdminCheckPassed = true;
    } catch (_) {
      superAdminCheckPassed = false;
    }
    assert(superAdminCheckPassed, 'Super Admin passes system assertion check');

    // -------------------------------------------------------------
    // TEST 2: Company Admin & Employee Backend Authorization Block
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Non-Super-Admin Permission Block (403 Forbidden) ---');
    const companyA = CompanyRepository.create({
      name: 'شركة النخبة لتنظيم المؤتمرات',
      owner_name: 'أحمد السعيد',
      owner_username: 'ahmed_elite',
    });
    assert(companyA.success, 'Created Company A successfully');

    const companyAOwner = UserRepository.getByUsername('ahmed_elite');
    assert(!!companyAOwner && companyAOwner.user.role === 'COMPANY_OWNER', 'Company A Owner created with role COMPANY_OWNER');

    let nonAdminBlocked = false;
    try {
      SystemDeploymentService.assertSuperAdmin(companyAOwner!.user);
    } catch (err: any) {
      if (err.message.includes('403') || err.message.includes('خاصة بمسؤول النظام')) {
        nonAdminBlocked = true;
      }
    }
    assert(nonAdminBlocked, 'Company Admin attempting system configuration is rejected with 403 Forbidden error');

    // -------------------------------------------------------------
    // TEST 3: System Deployment Configuration Management
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: SaaS Deployment Configuration ---');
    const saasConfig = {
      deployment_mode: 'saas' as const,
      database_type: 'hosted_supabase' as const,
      database_url: 'https://central-saas.supabase.co',
      database_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey',
      device_name: 'بوابة الإدارة الرئيسية',
      dedicated_license: null,
    };
    const saveRes = SystemDeploymentService.saveConfig(saasConfig);
    assert(saveRes.success, 'Super Admin successfully saved SaaS deployment configuration');

    const loadedConfig = SystemDeploymentService.getConfig();
    assert(
      loadedConfig.deployment_mode === 'saas' && loadedConfig.database_url === 'https://central-saas.supabase.co',
      'Loaded system deployment config matches saved SaaS parameters'
    );

    // -------------------------------------------------------------
    // TEST 4: SaaS Multi-Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Multi-Tenant Data Isolation ---');
    const companyB = CompanyRepository.create({
      name: 'شركة الفخامة للأفراح',
      owner_name: 'سلطان المطيري',
      owner_username: 'sultan_fakhamah',
    });
    assert(companyB.success, 'Created Company B successfully');

    // Create Event for Company A
    const eventA = EventRepository.create({
      name: 'مؤتمر التقنية 2026',
      date: '2026-11-15',
      capacity: 50,
      company_id: companyA.company!.id,
    });
    InvitationRepository.generateBatch(eventA.id, 5);

    // Create Event for Company B
    const eventB = EventRepository.create({
      name: 'حفل زفاف سلطان',
      date: '2026-12-01',
      capacity: 100,
      company_id: companyB.company!.id,
    });
    InvitationRepository.generateBatch(eventB.id, 10);

    // Verify tenant query isolation
    const compAEvents = EventRepository.getAll(companyA.company!.id);
    const compBEvents = EventRepository.getAll(companyB.company!.id);

    assert(
      compAEvents.length === 1 && compAEvents[0].id === eventA.id,
      'Company A query returns only Company A events (tenant isolation)'
    );
    assert(
      compBEvents.length === 1 && compBEvents[0].id === eventB.id,
      'Company B query returns only Company B events (tenant isolation)'
    );

    const compAInvs = InvitationRepository.getByEventId(eventA.id);
    const compBInvs = InvitationRepository.getByEventId(eventB.id);
    assert(compAInvs.length === 5, 'Company A event contains exactly 5 invitations');
    assert(compBInvs.length === 10, 'Company B event contains exactly 10 invitations');

    // -------------------------------------------------------------
    // TEST 5: Automatic Subscription Provisioning & Tracking
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: SaaS Subscription Provisioning (Professional Plan) ---');
    const subA = SubscriptionRepository.getByCompanyId(companyA.company!.id);
    assert(
      !!subA && subA.plan_name === 'Professional' && subA.status === 'active',
      'Company A has auto-provisioned active "Professional" subscription'
    );

    const allSubs = SubscriptionRepository.getAll();
    assert(allSubs.length >= 2, 'SubscriptionRepository.getAll returns all tenant subscriptions');

    // -------------------------------------------------------------
    // TEST 6: Subscription Expiration & Graceful Suspension
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Subscription Expiration, Access Block & Data Preservation ---');
    // Set Company A subscription to expired
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);
    SubscriptionRepository.update(companyA.company!.id, {
      status: 'expired',
      expiration_date: pastDate.toISOString(),
    });

    const isSubActive = SubscriptionRepository.isTenantActive(companyA.company!.id);
    assert(!isSubActive.active, 'Expired subscription correctly detected as inactive');

    // Attempt login as Company A Owner
    const loginAttemptExpired = UserRepository.login('ahmed_elite', companyA.tempPassword!);
    assert(
      !loginAttemptExpired.success && Boolean(loginAttemptExpired.error?.includes('الاشتراك')),
      'Expired tenant login is blocked with Arabic subscription renewal error message'
    );

    // Verify all data is preserved (not deleted)
    const preservedEvents = EventRepository.getAll(companyA.company!.id);
    const preservedInvs = InvitationRepository.getByEventId(eventA.id);
    assert(
      preservedEvents.length === 1 && preservedInvs.length === 5,
      'Tenant data (events, invitations) is fully intact and preserved during subscription suspension'
    );

    // -------------------------------------------------------------
    // TEST 7: Super Admin Subscription Reactivation & Extension
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Subscription Reactivation by Super Admin ---');
    const renewRes = SubscriptionRepository.renew(companyA.company!.id, 12, 'yearly');
    assert(renewRes.success && renewRes.subscription?.status === 'active', 'Super Admin renewed subscription for 1 year');

    const loginAfterRenew = UserRepository.login('ahmed_elite', companyA.tempPassword!);
    assert(loginAfterRenew.success && loginAfterRenew.user?.id === companyAOwner?.user.id, 'Company A Owner can log in immediately after renewal');

    // -------------------------------------------------------------
    // TEST 8: Dedicated / Self-Hosted Mode & Independent License
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Dedicated / Self-Hosted Mode & Licensing ---');
    const dedicatedLicense = {
      company_id: companyB.company!.id,
      company_name: 'شركة الفخامة للأفراح',
      license_key: 'DEDICATED-FAKHAMAH-2026-XYZ987',
      status: 'active' as const,
      issued_at: new Date().toISOString(),
      expires_at: null,
      notes: 'تثبيت مخصص على سيرفر العميل المستقل',
    };

    const dedicatedSave = SystemDeploymentService.saveDedicatedLicense(dedicatedLicense);
    assert(dedicatedSave.success, 'Dedicated installation license saved successfully');

    const loadedLicense = SystemDeploymentService.getDedicatedLicense();
    assert(
      !!loadedLicense && loadedLicense.license_key === 'DEDICATED-FAKHAMAH-2026-XYZ987',
      'Dedicated license details retrieved accurately without affecting SaaS database'
    );

    // -------------------------------------------------------------
    // TEST 9: Local Development Mode (SQLite Fallback)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Local Development Mode Compatibility ---');
    SystemDeploymentService.saveConfig({
      deployment_mode: 'local_dev',
      database_type: 'local_sqlite',
      database_url: '',
      database_anon_key: '',
      device_name: 'جهاز التطوير المحلي',
      dedicated_license: null,
    });

    const devConfig = SystemDeploymentService.getConfig();
    assert(devConfig.deployment_mode === 'local_dev', 'System runs in local_dev mode with SQLite storage');

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

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

runDeploymentAndLicensingTests();
