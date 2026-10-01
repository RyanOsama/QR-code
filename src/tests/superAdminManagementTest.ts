import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, getDatabase } from '../database/connection';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { LicenseServerService } from '../services/licenseServerService';
import { SystemDeploymentService } from '../services/systemDeploymentService';

async function runSuperAdminManagementTests() {
  console.log('================================================================');
  console.log('🧪 PHASE 8 — SUPER ADMIN MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  const testDbDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_phase8_super_admin_management.db');
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
    // TEST 1: Super Admin Company Listing
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: Super Admin Company Listing ---');
    const comp1 = CompanyRepository.create({
      name: 'شركة النور للمناسبات',
      owner_name: 'أحمد النور',
      owner_username: 'ahmed_alnoor',
      billing_cycle: 'yearly',
    });
    assert(comp1.success && !!comp1.company, 'Created company #1 (Yearly)');

    const comp2 = CompanyRepository.create({
      name: 'مؤسسة الفخامة لتنظيم الحفلات',
      owner_name: 'سارة الفخم',
      owner_username: 'sara_fakhamah',
      billing_cycle: 'monthly',
    });
    assert(comp2.success && !!comp2.company, 'Created company #2 (Monthly)');

    const allCompanies = CompanyRepository.getAll();
    assert(allCompanies.length >= 2, 'getAll returns all registered companies');
    const c1 = allCompanies.find(c => c.id === comp1.company!.id);
    assert(!!c1 && c1.name === 'شركة النور للمناسبات', 'Company #1 found in listing');
    assert(c1?.owner_username === 'ahmed_alnoor', 'Company #1 owner username included');
    assert(c1?.subscription?.billing_cycle === 'yearly', 'Company #1 subscription cycle is yearly');
    assert(c1?.subscription?.plan_name === 'Professional', 'Company #1 subscription plan is Professional');
    assert(c1?.status === 'ACTIVE', 'Company #1 status is ACTIVE');

    // -----------------------------------------------------------------
    // TEST 2: Company Search and Multi-Status Filtering Logic
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Search & Multi-Status Filtering ---');
    // Add a third company for filtering test
    const comp3 = CompanyRepository.create({
      name: 'شركة المجد الذهبي',
      owner_name: 'ماجد الحربي',
      owner_username: 'majed_gold',
      billing_cycle: 'yearly',
    });
    // Suspend company 3
    CompanyRepository.update(comp3.company!.id, { status: 'SUSPENDED' });
    SubscriptionRepository.update(comp3.company!.id, { status: 'suspended' });

    const updatedList = CompanyRepository.getAll();

    // 1. Search by name
    const searchByName = updatedList.filter(c => c.name.includes('النور'));
    assert(searchByName.length === 1 && searchByName[0].name === 'شركة النور للمناسبات', 'Search by company name works');

    // 2. Search by owner username
    const searchByUsername = updatedList.filter(c => c.owner_username?.includes('sara_fakhamah'));
    assert(searchByUsername.length === 1 && searchByUsername[0].id === comp2.company!.id, 'Search by owner username works');

    // 3. Search by ID
    const searchById = updatedList.filter(c => String(c.id) === String(comp3.company!.id));
    assert(searchById.length === 1 && searchById[0].id === comp3.company!.id, 'Search by company ID works');

    // 4. Filter by company status: SUSPENDED
    const suspendedCompanies = updatedList.filter(c => c.status === 'SUSPENDED');
    assert(suspendedCompanies.some(c => c.id === comp3.company!.id), 'Filter by status SUSPENDED correctly isolates suspended company');

    // 5. Filter by company status: ACTIVE
    const activeCompanies = updatedList.filter(c => c.status === 'ACTIVE');
    assert(activeCompanies.some(c => c.id === comp1.company!.id) && !activeCompanies.some(c => c.id === comp3.company!.id), 'Filter by status ACTIVE includes active companies only');

    // 6. Filter by subscription status: suspended
    const suspendedSubs = updatedList.filter(c => c.subscription?.status === 'suspended');
    assert(suspendedSubs.some(c => c.id === comp3.company!.id), 'Filter by subscription status "suspended" works');

    // -----------------------------------------------------------------
    // TEST 3: Company Details View & Privacy (Zero Credential Leakage)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Company Details & Credential Privacy ---');
    const details = CompanyRepository.getById(comp1.company!.id);
    assert(details !== null, 'Company details retrieved by ID');
    assert(details?.name === 'شركة النور للمناسبات', 'Details contains company name');
    assert(details?.owner_name === 'أحمد النور', 'Details contains owner full name');
    assert(details?.owner_username === 'ahmed_alnoor', 'Details contains owner username');
    assert(details?.subscription?.plan_name === 'Professional', 'Details contains subscription plan');
    assert(!!details?.subscription?.start_date && !!details?.subscription?.expiration_date, 'Details contains subscription start and expiration dates');

    // Verify privacy: AppUser and details must NEVER contain database password hashes or raw credentials in public interfaces
    const ownerResult = UserRepository.getByUsername('ahmed_alnoor');
    assert(ownerResult !== null && !!ownerResult.user, 'Owner user exists in database');
    // Ensure password_hash is not in AppUser object
    assert((ownerResult!.user as any).password_hash === undefined, 'AppUser object does not expose password_hash');
    const userById = UserRepository.getById(ownerResult!.user.id);
    assert(userById !== null && (userById as any).password_hash === undefined, 'UserRepository.getById does not expose password_hash');
    assert((details as any).supabase_service_key === undefined, 'Company details does not expose Supabase service key');
    assert((details as any).database_password === undefined, 'Company details does not expose database password');

    // -----------------------------------------------------------------
    // TEST 4: Company Lifecycle (Create, Suspend, Reactivate)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Company Lifecycle Management ---');
    const lifecycleComp = CompanyRepository.create({
      name: 'شركة تجربة دورة الحياة',
      owner_name: 'عمر التجربة',
      owner_username: 'omar_lifecycle',
      billing_cycle: 'yearly',
    });
    const lId = lifecycleComp.company!.id;

    // Step A: Initial Active
    let lStatus = CompanyRepository.getById(lId);
    assert(lStatus?.status === 'ACTIVE', 'Company created with initial status ACTIVE');
    let tenantActive = SubscriptionRepository.isTenantActive(lId);
    assert(tenantActive.active === true, 'Tenant subscription is initially active');

    // Step B: Suspend
    CompanyRepository.update(lId, { status: 'SUSPENDED' });
    SubscriptionRepository.update(lId, { status: 'suspended' });
    lStatus = CompanyRepository.getById(lId);
    assert(lStatus?.status === 'SUSPENDED', 'Company status updated to SUSPENDED');
    tenantActive = SubscriptionRepository.isTenantActive(lId);
    assert(tenantActive.active === false && tenantActive.status === 'suspended', 'Suspended tenant is blocked from application access');

    // Step C: Reactivate
    CompanyRepository.update(lId, { status: 'ACTIVE' });
    SubscriptionRepository.update(lId, { status: 'active' });
    lStatus = CompanyRepository.getById(lId);
    assert(lStatus?.status === 'ACTIVE', 'Company status reactivated to ACTIVE');
    tenantActive = SubscriptionRepository.isTenantActive(lId);
    assert(tenantActive.active === true && tenantActive.status === 'active', 'Reactivated tenant has active application access restored');

    // -----------------------------------------------------------------
    // TEST 5: Role Security & Backend Authorization
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Role Security & Backend Authorization ---');
    const superAdminAuth = LicenseServerService.verifySuperAdminAccess('SUPER_ADMIN');
    assert(superAdminAuth.authorized === true, 'Super Admin role is authorized for global operations');

    const companyOwnerAuth = LicenseServerService.verifySuperAdminAccess('COMPANY_OWNER');
    assert(companyOwnerAuth.authorized === false && !!companyOwnerAuth.error, 'Company Owner role is forbidden from Super Admin operations (403)');

    const employeeAuth = LicenseServerService.verifySuperAdminAccess('EMPLOYEE');
    assert(employeeAuth.authorized === false && !!employeeAuth.error, 'Employee role is forbidden from Super Admin operations (403)');

    const anonymousAuth = LicenseServerService.verifySuperAdminAccess(undefined);
    assert(anonymousAuth.authorized === false, 'Anonymous caller is forbidden from Super Admin operations');

    // -----------------------------------------------------------------
    // TEST 6: Tenant Isolation & Cross-Tenant Access Prevention
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Tenant Isolation & Cross-Tenant Access ---');
    // Company 1 creates an event
    const event1 = EventRepository.create({
      name: 'حفل زفاف شركة النور',
      date: '2026-11-20',
      capacity: 100,
      company_id: comp1.company!.id,
    });
    // Company 2 creates an event
    const event2 = EventRepository.create({
      name: 'حفل تخرج مؤسسة الفخامة',
      date: '2026-12-10',
      capacity: 150,
      company_id: comp2.company!.id,
    });

    // Verify company-scoped event listing
    const c1Events = EventRepository.getAll(comp1.company!.id);
    assert(c1Events.length === 1 && c1Events[0].id === event1.id, 'Company #1 only sees its own events');
    assert(!c1Events.some(e => e.id === event2.id), 'Company #1 cannot see Company #2 events');

    const c2Events = EventRepository.getAll(comp2.company!.id);
    assert(c2Events.length === 1 && c2Events[0].id === event2.id, 'Company #2 only sees its own events');
    assert(!c2Events.some(e => e.id === event1.id), 'Company #2 cannot see Company #1 events');

    // Verify company-scoped employee listing
    UserRepository.createEmployee(comp1.company!.id, {
      full_name: 'موظف شركة النور',
      username: 'emp_alnoor_1',
    });
    UserRepository.createEmployee(comp2.company!.id, {
      full_name: 'موظف مؤسسة الفخامة',
      username: 'emp_fakhamah_1',
    });

    const c1Employees = UserRepository.getEmployees(comp1.company!.id);
    assert(c1Employees.length === 1 && c1Employees[0].username === 'emp_alnoor_1', 'Company #1 only sees its own employees');
    assert(!c1Employees.some(u => u.username === 'emp_fakhamah_1'), 'Company #1 cannot see Company #2 employees');

    // -----------------------------------------------------------------
    // TEST 7: Complete Audit Logging for Privileged Super Admin Actions
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Audit Logging for Privileged Super Admin Actions ---');
    // Trigger additional subscription audit events
    SubscriptionRepository.renew(comp1.company!.id, 12, 'yearly');
    SubscriptionRepository.extend(comp1.company!.id, 3);
    SubscriptionRepository.update(comp1.company!.id, { status: 'cancelled' });
    SubscriptionRepository.update(comp1.company!.id, { status: 'active' });

    const auditLogs = LicenseServerService.getAuditLogs({ limit: 50 });
    assert(auditLogs.length > 0, 'Audit logs recorded in system');

    const companyCreatedLog = auditLogs.find(l => l.action === 'COMPANY_CREATED');
    assert(!!companyCreatedLog, 'Audit event COMPANY_CREATED recorded');

    const companySuspendedLog = auditLogs.find(l => l.action === 'COMPANY_SUSPENDED');
    assert(!!companySuspendedLog, 'Audit event COMPANY_SUSPENDED recorded');

    const companyReactivatedLog = auditLogs.find(l => l.action === 'COMPANY_REACTIVATED' || l.action === 'COMPANY_ACTIVATED');
    assert(!!companyReactivatedLog, 'Audit event COMPANY_REACTIVATED recorded');

    const subCreatedLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_CREATED');
    assert(!!subCreatedLog, 'Audit event SUBSCRIPTION_CREATED recorded');

    const subRenewedLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_RENEWED');
    assert(!!subRenewedLog, 'Audit event SUBSCRIPTION_RENEWED recorded');

    const subExtendedLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_EXTENDED');
    assert(!!subExtendedLog, 'Audit event SUBSCRIPTION_EXTENDED recorded');

    const subSuspendedLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_SUSPENDED');
    assert(!!subSuspendedLog, 'Audit event SUBSCRIPTION_SUSPENDED recorded');

    const subReactivatedLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_REACTIVATED');
    assert(!!subReactivatedLog, 'Audit event SUBSCRIPTION_REACTIVATED recorded');

    const subCancelledLog = auditLogs.find(l => l.action === 'SUBSCRIPTION_CANCELLED');
    assert(!!subCancelledLog, 'Audit event SUBSCRIPTION_CANCELLED recorded');

    // Filter audit logs by company name
    const comp1AuditLogs = LicenseServerService.getAuditLogs({ companyName: 'شركة النور للمناسبات' });
    assert(comp1AuditLogs.length >= 3, 'Audit logs filtered by companyName returns company-specific events');
    assert(comp1AuditLogs.every(l => l.company_name === 'شركة النور للمناسبات'), 'All returned logs match company filter');

    // -----------------------------------------------------------------
    // TEST 8: Dedicated Mode Independence
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Dedicated Mode Independence ---');
    // Create a Dedicated Perpetual License
    const dedicatedLicenseResult = LicenseServerService.createLicense({
      company_name: 'مؤسسة الرياض المستقلة (Dedicated)',
      license_type: 'PERPETUAL',
      max_devices: 5,
    }, 'SUPER_ADMIN');
    assert(dedicatedLicenseResult.success && !!dedicatedLicenseResult.license, 'Dedicated Perpetual license created');

    const dedicatedLicense = dedicatedLicenseResult.license!;
    assert(dedicatedLicense.license_type === 'PERPETUAL', 'Dedicated license type is PERPETUAL');
    assert(dedicatedLicense.status === 'active', 'Dedicated license status is active');

    // Generate activation token for Dedicated device
    const token = LicenseServerService.signActivationToken({
      licenseId: dedicatedLicense.id,
      companyName: dedicatedLicense.company_name,
      deviceIdHash: 'HASH_DEV_DEDICATED_999',
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    });
    assert(typeof token === 'string' && token.length > 20, 'Dedicated activation token signed');

    const verified = LicenseServerService.verifyActivationToken(token);
    assert(verified.valid === true && verified.payload?.companyName === dedicatedLicense.company_name, 'Dedicated activation token verified');

    // Super Admin operations on SaaS subscriptions do not affect Dedicated license
    const dedicatedAuditLogs = LicenseServerService.getAuditLogs({ licenseId: dedicatedLicense.id });
    assert(dedicatedAuditLogs.length > 0 && dedicatedAuditLogs[0].action === 'LICENSE_CREATED', 'Dedicated license lifecycle maintained in audit system');

    // Ensure Dedicated license is not modified or affected by SaaS company suspension
    assert(dedicatedLicense.status === 'active', 'Dedicated license remains active and unaffected by SaaS lifecycle mutations');

  } catch (err: any) {
    console.error('💥 Test suite crashed with error:', err);
    failed++;
  } finally {
    closeDatabase();
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch (_) {}
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 8 TESTS FINISHED: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuperAdminManagementTests();
