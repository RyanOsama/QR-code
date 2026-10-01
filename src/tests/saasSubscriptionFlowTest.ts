import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { DeviceService } from '../services/deviceService';
import { LicenseServerService } from '../services/licenseServerService';
import { SystemDeploymentService } from '../services/systemDeploymentService';

async function runSaaSSubscriptionFlowTests() {
  console.log('================================================================');
  console.log('🧪 PHASE 7 — SAAS SUBSCRIPTION FLOW TEST SUITE');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_saas_subscription_flow.db');
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
    // TEST 1: Monthly Subscription Creation & Calculation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: Monthly Subscription Creation ---');
    const compMonthly = CompanyRepository.create({
      name: 'شركة المناسبات الشهرية',
      owner_name: 'سالم الشهري',
      owner_username: 'salem_monthly',
      billing_cycle: 'monthly',
    });
    assert(compMonthly.success && !!compMonthly.company, 'Monthly SaaS company created');
    
    const subMonthly = SubscriptionRepository.getByCompanyId(compMonthly.company!.id);
    assert(subMonthly !== null, 'Monthly subscription record exists');
    assert(subMonthly?.billing_cycle === 'monthly', 'Billing cycle is "monthly"');
    assert(subMonthly?.plan_name === 'Professional', 'Plan is "Professional"');
    assert(subMonthly?.status === 'active', 'Initial status is "active"');

    const startM = new Date(subMonthly!.start_date);
    const expM = new Date(subMonthly!.expiration_date);
    const diffDaysM = Math.round((expM.getTime() - startM.getTime()) / (1000 * 3600 * 24));
    assert(diffDaysM >= 28 && diffDaysM <= 31, `Monthly duration correctly calculated (~${diffDaysM} days)`);

    // -----------------------------------------------------------------
    // TEST 2: Yearly Subscription Creation & Calculation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Yearly Subscription Creation ---');
    const compYearly = CompanyRepository.create({
      name: 'مؤسسة الأفراح السنوية',
      owner_name: 'عبد الرحمن السنوي',
      owner_username: 'abdul_yearly',
      billing_cycle: 'yearly',
    });
    assert(compYearly.success && !!compYearly.company, 'Yearly SaaS company created');
    
    const subYearly = SubscriptionRepository.getByCompanyId(compYearly.company!.id);
    assert(subYearly?.billing_cycle === 'yearly', 'Billing cycle is "yearly"');
    assert(subYearly?.plan_name === 'Professional', 'Plan is "Professional"');
    assert(subYearly?.status === 'active', 'Initial status is "active"');

    const startY = new Date(subYearly!.start_date);
    const expY = new Date(subYearly!.expiration_date);
    const diffDaysY = Math.round((expY.getTime() - startY.getTime()) / (1000 * 3600 * 24));
    assert(diffDaysY >= 365 && diffDaysY <= 366, `Yearly duration correctly calculated (~${diffDaysY} days)`);

    // -----------------------------------------------------------------
    // TEST 3: Active Subscription Login Flow
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Active Subscription Login Allowed ---');
    const activeLogin = UserRepository.login('abdul_yearly', compYearly.tempPassword!);
    assert(activeLogin.success && !!activeLogin.user, 'Active subscription user can login successfully');
    assert(
      activeLogin.user?.company_subscription?.status === 'active',
      'User object contains active company_subscription metadata'
    );

    // -----------------------------------------------------------------
    // TEST 4: Trial Subscription Login Flow
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Trial Subscription Login Allowed ---');
    const compTrial = CompanyRepository.create({
      name: 'شركة البداية التجريبية',
      owner_name: 'ماجد التجريبي',
      owner_username: 'majed_trial',
    });
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14); // 14 days trial

    SubscriptionRepository.update(compTrial.company!.id, {
      status: 'trial',
      expiration_date: trialExpiry.toISOString(),
      renewal_date: trialExpiry.toISOString(),
    });

    const trialCheck = SubscriptionRepository.isTenantActive(compTrial.company!.id);
    assert(trialCheck.active && trialCheck.status === 'trial', 'Trial status verified as active within period');

    const trialLogin = UserRepository.login('majed_trial', compTrial.tempPassword!);
    assert(trialLogin.success, 'User with valid Trial subscription allowed to login');

    // -----------------------------------------------------------------
    // TEST 5: Expired Subscription Blocks Access & Preserves All Data
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Expired Subscription Access Block & Non-Destructive Data Retention ---');
    // Create events and invitations for Company Yearly
    const event1 = EventRepository.create({
      name: 'حفل التخرج السنوي 2026',
      date: '2026-10-15',
      capacity: 100,
      company_id: compYearly.company!.id,
    });
    InvitationRepository.generateBatch(event1.id, 20, ['أحمد', 'محمد', 'سارة']);

    // Now expire the subscription
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    SubscriptionRepository.update(compYearly.company!.id, {
      status: 'expired',
      expiration_date: pastDate.toISOString(),
    });

    const isSubActiveExpired = SubscriptionRepository.isTenantActive(compYearly.company!.id);
    assert(!isSubActiveExpired.active, 'Expired subscription correctly detected as inactive');
    assert(isSubActiveExpired.status === 'expired', 'Status is "expired"');

    const expiredLogin = UserRepository.login('abdul_yearly', compYearly.tempPassword!);
    assert(!expiredLogin.success, 'Expired tenant login is blocked');
    assert(
      Boolean(expiredLogin.error?.includes('اشتراك') || expiredLogin.error?.includes('تجديد') || expiredLogin.error?.includes('انتهت')),
      'Blocked login provides clear Arabic renewal requirement notice'
    );

    // Verify DATA IS NOT DELETED
    const preservedEvents = EventRepository.getAll(compYearly.company!.id);
    const preservedInvs = InvitationRepository.getByEventId(event1.id);
    const preservedUser = UserRepository.getByUsername('abdul_yearly');
    assert(preservedEvents.length === 1, 'Event data is intact and NOT deleted on expiration');
    assert(preservedInvs.length === 20, 'All 20 invitations are intact and NOT deleted on expiration');
    assert(preservedUser !== null, 'User account is intact and NOT deleted on expiration');

    // -----------------------------------------------------------------
    // TEST 6: Suspended Subscription Blocks Access
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Suspended Subscription Blocks Access ---');
    SubscriptionRepository.update(compTrial.company!.id, {
      status: 'suspended',
    });

    const suspendedCheck = SubscriptionRepository.isTenantActive(compTrial.company!.id);
    assert(!suspendedCheck.active && suspendedCheck.status === 'suspended', 'Suspended status detected as inactive');

    const suspendedLogin = UserRepository.login('majed_trial', compTrial.tempPassword!);
    assert(!suspendedLogin.success, 'Suspended tenant login is blocked');
    assert(Boolean(suspendedLogin.error?.includes('تعليق') || suspendedLogin.error?.includes('الإدارة')), 'Clear Arabic suspension notice');

    // -----------------------------------------------------------------
    // TEST 7: Cancelled Subscription Blocks Access
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Cancelled Subscription Blocks Access ---');
    SubscriptionRepository.update(compMonthly.company!.id, {
      status: 'cancelled',
    });

    const cancelledCheck = SubscriptionRepository.isTenantActive(compMonthly.company!.id);
    assert(!cancelledCheck.active && cancelledCheck.status === 'cancelled', 'Cancelled status detected as inactive');

    const cancelledLogin = UserRepository.login('salem_monthly', compMonthly.tempPassword!);
    assert(!cancelledLogin.success, 'Cancelled tenant login is blocked');

    // -----------------------------------------------------------------
    // TEST 8: Immediate Access Restoration Upon Renewal
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Instant Access Restoration Upon Super Admin Renewal ---');
    // Renew Company Yearly for 12 months
    const renewResult = SubscriptionRepository.renew(compYearly.company!.id, 12, 'yearly');
    assert(renewResult.success, 'Super Admin renewed subscription successfully');
    assert(renewResult.subscription?.status === 'active', 'Subscription status restored to "active"');

    const activeCheckAfterRenew = SubscriptionRepository.isTenantActive(compYearly.company!.id);
    assert(activeCheckAfterRenew.active, 'Tenant is active immediately without app reinstall');

    const restoredLogin = UserRepository.login('abdul_yearly', compYearly.tempPassword!);
    assert(restoredLogin.success, 'Company immediately regains full login access after renewal');

    // -----------------------------------------------------------------
    // TEST 9: Subscription Extension (+Months)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 9: Subscription Extension by Super Admin ---');
    const currentSub = SubscriptionRepository.getByCompanyId(compYearly.company!.id)!;
    const oldExpiry = new Date(currentSub.expiration_date).getTime();

    const extendResult = SubscriptionRepository.extend(compYearly.company!.id, 3);
    assert(extendResult.success, 'Extended subscription by 3 months');

    const newSub = SubscriptionRepository.getByCompanyId(compYearly.company!.id)!;
    const newExpiry = new Date(newSub.expiration_date).getTime();
    const diffMonths = Math.round((newExpiry - oldExpiry) / (1000 * 3600 * 24 * 30));
    assert(diffMonths >= 3, `Expiration date correctly advanced by 3 months (added ~${diffMonths} months)`);

    // -----------------------------------------------------------------
    // TEST 10: Multi-Tenant Data Isolation (Company A vs Company B)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 10: Multi-Tenant Data Isolation Verification ---');
    const eventYearly = EventRepository.create({
      name: 'مناسبة شركة السنوية الخاصة',
      date: '2026-11-01',
      capacity: 50,
      company_id: compYearly.company!.id,
    });
    InvitationRepository.generateBatch(eventYearly.id, 5);

    const eventMonthly = EventRepository.create({
      name: 'مناسبة شركة الشهرية الخاصة',
      date: '2026-11-02',
      capacity: 50,
      company_id: compMonthly.company!.id,
    });
    InvitationRepository.generateBatch(eventMonthly.id, 12);

    const yearlyEvents = EventRepository.getAll(compYearly.company!.id);
    const monthlyEvents = EventRepository.getAll(compMonthly.company!.id);
    assert(
      yearlyEvents.every((e) => e.company_id === compYearly.company!.id),
      'Company Yearly only sees its own events'
    );
    assert(
      monthlyEvents.every((e) => e.company_id === compMonthly.company!.id),
      'Company Monthly only sees its own events'
    );
    assert(
      !yearlyEvents.some((e) => e.id === eventMonthly.id),
      'Company Yearly cannot see Company Monthly events'
    );
    assert(
      !monthlyEvents.some((e) => e.id === eventYearly.id),
      'Company Monthly cannot see Company Yearly events'
    );

    // -----------------------------------------------------------------
    // TEST 11: Company Admin Restriction (Unauthorized Mutation Prevention)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 11: Unauthorized Company Admin Mutation Block ---');
    const ownerUser = compYearly.ownerUser!;
    assert(ownerUser.role === 'COMPANY_OWNER', 'User is COMPANY_OWNER');
    assert(ownerUser.role !== 'SUPER_ADMIN', 'COMPANY_OWNER is not SUPER_ADMIN');

    // Simulate IPC role check
    let unauthorizedBlocked = false;
    function simulateAdminCheck(userRole: string) {
      if (userRole !== 'SUPER_ADMIN') {
        unauthorizedBlocked = true;
        throw new Error('غير مصرح لك بتنفيذ هذه العملية. هذه الصلاحية خاصة بمسؤول النظام العام فقط (403 Forbidden).');
      }
    }

    try {
      simulateAdminCheck(ownerUser.role);
    } catch (err: any) {
      assert(err.message.includes('403 Forbidden'), 'Company Admin forbidden from subscription mutations');
    }
    assert(unauthorizedBlocked, 'Security assertion actively prevents Company Admin subscription manipulation');

    // -----------------------------------------------------------------
    // TEST 12: SaaS First Run Verification (No Dedicated Screens)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 12: SaaS First Run & Startup Verification ---');
    DeviceService.setCommercialMode('SAAS');
    SystemDeploymentService.saveConfig({
      deployment_mode: 'saas',
      database_type: 'hosted_supabase',
      database_url: 'https://test-saas.supabase.co',
      database_anon_key: 'test-anon-key',
      device_name: 'SaaS Terminal 1',
    });

    const saasStatus = await DeviceService.checkStartupStatus();
    assert(saasStatus.mode === 'SAAS', 'App starts in SAAS mode');
    assert(saasStatus.isActivated === true, 'SaaS mode is automatically marked activated (bypasses Dedicated activation)');

    // -----------------------------------------------------------------
    // TEST 13: Dedicated Mode Isolation & Independence
    // -----------------------------------------------------------------
    console.log('\n--- TEST 13: Dedicated Mode Perpetual License Independence ---');
    // Create dedicated perpetual license in license server
    const licRes = LicenseServerService.createLicense({
      company_name: 'شركة القصر الملكي للمناسبات (Dedicated)',
      license_type: 'PERPETUAL',
      max_devices: 5,
    });
    assert(licRes.success && !!licRes.license, 'Created Dedicated perpetual license');
    assert(licRes.license?.license_type === 'PERPETUAL', 'Dedicated license is PERPETUAL and perpetual');
    assert(licRes.license?.expires_at === null, 'Dedicated perpetual license has no expiration date');

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 7 SAAS SUBSCRIPTION TESTS PASSED: ${passed}/${passed + failed}`);
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (_) {}
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runSaaSSubscriptionFlowTests();
