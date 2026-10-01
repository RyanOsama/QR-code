import { ElectronAPI } from '../../types';

export const api: ElectronAPI = (window as any).electronAPI || {
  login: async () => ({ success: false, error: 'Electron غير متصل' }),
  changePassword: async () => ({ success: false, error: 'Electron غير متصل' }),
  getCurrentUser: async () => null,
  logout: async () => {},

  getAppStatus: async () => ({ mode: 'SAAS', isActivated: true, companyName: 'الوضع الافتراضي' }),
  getDeviceId: async () => 'DEV-WEB-PREVIEW-1',
  activateDedicatedLicense: async () => ({ success: false, error: 'Electron غير متصل' }),
  validateDedicatedLicense: async () => ({ success: true, valid: true }),
  deactivateDedicatedDevice: async () => ({ success: true }),
  provisionDedicatedDatabase: async () => ({ success: false, companyName: '', error: 'Electron غير متصل' }),
  setupDedicatedCompanyAndAdmin: async () => ({ success: false, error: 'Electron غير متصل' }),
  verifyDedicatedInstallation: async () => ({
    success: false,
    checks: {
      licenseValid: false,
      supabaseConnected: false,
      databaseProvisioned: false,
      companyExists: false,
      adminExists: false,
      subscriptionActive: false,
      schemaVersionValid: false,
    },
    error: 'Electron غير متصل',
  }),
  checkDatabaseMigrationStatus: async () => ({
    currentVersion: 1,
    requiredVersion: 1,
    needsMigration: false,
    pendingVersions: [],
    pendingMigrations: [],
  }),
  runDatabaseMigrations: async () => ({
    success: true,
    fromVersion: 1,
    toVersion: 1,
    appliedVersions: [],
    steps: [],
  }),
  openExternalUrl: async (url: string) => {
    try {
      window.open(url, '_blank');
      return true;
    } catch {
      return false;
    }
  },

  getAdminLicenses: async (_filter?: any) => [],
  createAdminLicense: async () => ({ success: false, error: 'Electron غير متصل' }),
  revokeAdminLicense: async () => ({ success: true }),
  reactivateAdminLicense: async () => ({ success: true }),
  updateAdminLicenseStatus: async () => ({ success: true }),
  getAdminLicenseActivations: async () => [],
  deactivateAdminDevice: async () => ({ success: true }),
  getAdminLicenseAuditLogs: async () => [],
  getCompanyAuditLogs: async () => [],


  getCompanies: async () => [],
  createCompany: async () => ({ success: false, error: 'Electron غير متصل' }),
  updateCompany: async () => ({ success: false, error: 'Electron غير متصل' }),
  deleteCompany: async () => ({ success: false, error: 'Electron غير متصل' }),
  resetCompanyOwnerPassword: async () => ({ success: false, error: 'Electron غير متصل' }),

  getEmployees: async () => [],
  createEmployee: async () => ({ success: false, error: 'Electron غير متصل' }),
  deleteEmployee: async () => ({ success: false, error: 'Electron غير متصل' }),
  resetEmployeePassword: async () => ({ success: false, error: 'Electron غير متصل' }),

  getEvents: async () => [],
  getActiveEvent: async (_companyId?: number | null) => null,
  createEvent: async () => ({ id: 1, name: '', date: '', capacity: 100, status: 'ACTIVE', created_at: '', updated_at: '' }),
  updateEvent: async () => ({} as any),
  setActiveEvent: async () => {},
  deleteEvent: async () => ({ success: true }),
  getInvitations: async () => [],
  generateInvitations: async () => ({ success: false, count: 0, error: 'تعذر الاتصال بـ Electron' }),
  addInvitationsToEvent: async () => ({ success: false, addedCount: 0, newCapacity: 0, error: 'تعذر الاتصال بـ Electron' }),
  updateGuestName: async () => ({} as any),
  deleteInvitation: async () => ({ success: true }),
  regenerateToken: async () => ({ success: false }),
  resetUsedInvitations: async () => ({ success: false, resetCount: 0 }),
  resetSingleInvitation: async () => ({ success: false }),
  checkIn: async () => ({ success: false, result: 'INVALID', message: 'Electron IPC غير متاح' }),
  getScanLogs: async () => [],
  getEventStats: async () => ({
    totalInvitations: 0,
    usedInvitations: 0,
    unusedInvitations: 0,
    acceptedScans: 0,
    alreadyUsedScans: 0,
    invalidScans: 0,
    attendancePercentage: 0,
  }),
  backupDatabase: async () => ({ success: false, error: 'غير متاح' }),
  restoreDatabase: async () => ({ success: false, error: 'غير متاح' }),
  exportPdf: async () => ({ success: false, error: 'غير متاح' }),
  printPdf: async () => ({ success: false, error: 'غير متاح' }),
  generateQrDataUrl: async () => '',
  getCloudConfig: async () => ({ mode: 'local', supabaseUrl: '', supabaseAnonKey: '', deviceName: 'بوابة 1' }),
  saveCloudConfig: async () => ({ success: true }),
  testCloudConnection: async () => ({ success: false, message: 'Electron IPC غير متاح' }),
  syncLocalToCloud: async () => ({ success: false, eventsSynced: 0, invitationsSynced: 0, error: 'غير متاح' }),

  getSystemDeploymentConfig: async () => ({
    deployment_mode: 'saas',
    database_type: 'hosted_supabase',
    database_url: '',
    database_anon_key: '',
    device_name: 'بوابة 1',
    dedicated_license: null,
  }),
  saveSystemDeploymentConfig: async () => ({ success: true }),
  getTenantSubscriptions: async () => [],
  getCompanySubscription: async () => null,
  updateTenantSubscription: async () => ({ success: true }),
  renewTenantSubscription: async () => ({ success: true }),
  extendTenantSubscription: async () => ({ success: true }),
  getDedicatedLicense: async () => null,
  saveDedicatedLicense: async () => ({ success: true }),

  copyToClipboard: async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    return false;
  },
  readClipboard: async () => {
    try {
      if (navigator?.clipboard?.readText) {
        return await navigator.clipboard.readText();
      }
    } catch {}
    return '';
  },
};
