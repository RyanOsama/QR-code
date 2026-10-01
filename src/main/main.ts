import dns from 'dns';
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (_) {}

import { app, BrowserWindow, ipcMain, session, clipboard, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { DatabaseDriver } from '../services/databaseDriver';
import { EnvService } from '../services/envService';
import { BackupService } from '../database/backupService';
import { PdfService } from '../services/pdfService';
import { QrService } from '../services/qrService';
import { DatabaseProvisioningService } from '../services/databaseProvisioningService';
import { DatabaseMigrationService } from '../services/databaseMigrationService';
import { SupabaseService } from '../services/supabaseService';
import { SystemDeploymentService } from '../services/systemDeploymentService';
import { LicenseServerService } from '../services/licenseServerService';
import { DeviceService } from '../services/deviceService';
import { AppUser, SystemDeploymentConfig, DedicatedLicenseConfig, BillingCycle, TenantSubscription, LicenseType, LicenseStatus } from '../types';

let mainWindow: BrowserWindow | null = null;
let currentUser: AppUser | null = null;

function createWindow() {
  const iconPath = path.join(process.cwd(), 'public', 'icon.png');

  if (process.platform === 'win32') {
    app.setAppUserModelId('com.event.qrmanager');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'نظام إدارة دعوات المناسبات والتحقق عبر QR',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (fs.existsSync(iconPath)) {
    mainWindow.setIcon(iconPath);
  }

  // Navigation Security: Prevent renderer from navigating to unauthorized external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      if (process.env.VITE_DEV_SERVER_URL) {
        const devUrl = new URL(process.env.VITE_DEV_SERVER_URL);
        if (parsedUrl.origin === devUrl.origin) return;
      }
      if (parsedUrl.protocol === 'file:') return;
    } catch (_) {}
    event.preventDefault();
  });

  // Window Security: Block new window creation and delegate external links safely to OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        shell.openExternal(url);
      }
    } catch (_) {}
    return { action: 'deny' };
  });

  // Automatically approve media (camera) and clipboard permissions, strictly deny others
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (
      permission === 'media' ||
      permission === 'clipboard-read' ||
      permission === 'clipboard-sanitized-write'
    ) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Load URL or File
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(import.meta.dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function assertAuthenticated(): AppUser {
  if (!currentUser) {
    throw new Error('يجب تسجيل الدخول أولاً لتنفيذ هذه العملية (401 Unauthorized).');
  }
  return currentUser;
}

function assertSuperAdmin(): void {
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    throw new Error('غير مصرح لك بتنفيذ هذه العملية. هذه الصلاحية خاصة بمسؤول النظام العام فقط (403 Forbidden).');
  }
}

function assertTenantAccess(companyId?: number | null): number {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') {
    return companyId || user.company_id || 1;
  }
  if (!user.company_id) {
    throw new Error('حسابك غير مرتبط بأي شركة مسجلة (403 Forbidden).');
  }
  if (companyId && companyId !== user.company_id) {
    throw new Error('غير مصرح لك بالوصول لبيانات شركة أخرى (403 Forbidden).');
  }
  return user.company_id;
}

async function assertEventTenantAccess(eventId: number): Promise<void> {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const event = await DatabaseDriver.getEventById(eventId);
  if (!event) throw new Error('المناسبة المطلوبة غير موجودة');
  if (event.company_id && event.company_id !== user.company_id) {
    throw new Error('غير مصرح لك بالوصول لمناسبات شركة أخرى (403 Forbidden).');
  }
}

async function assertInvitationTenantAccess(invitationId: number): Promise<void> {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const inv = await DatabaseDriver.getInvitationById(invitationId);
  if (!inv) throw new Error('الدعوة المطلوبة غير موجودة');
  await assertEventTenantAccess(inv.event_id);
}

async function assertUserTenantAccess(targetUserId: number): Promise<void> {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const targetUser = await DatabaseDriver.getUserById(targetUserId);
  if (!targetUser) throw new Error('المستخدم المطلوب غير موجود');
  if (targetUser.company_id && targetUser.company_id !== user.company_id) {
    throw new Error('غير مصرح لك بإدارة مستخدمي شركة أخرى (403 Forbidden).');
  }
}

function assertDedicatedOrSuperAdmin(): void {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const act = DeviceService.getLocalActivation();
  if (act.commercial_mode === 'DEDICATED' && user.role === 'COMPANY_OWNER') {
    return;
  }
  throw new Error('هذه العملية مخصصة لمسؤول النظام العام أو المشرف على النسخة المخصصة فقط (403 Forbidden).');
}

// Register all IPC Handlers using single-source DatabaseDriver
function registerIpcHandlers() {
  // Auth
  ipcMain.handle('auth:login', async (_, username, password) => {
    const cleanUsername = (username || '').trim();
    const res = await DatabaseDriver.login(cleanUsername, password);
    if (res.success && res.user) {
      currentUser = res.user;
    }
    return res;
  });

  ipcMain.handle('auth:changePassword', async (_, userId, newPassword) => {
    assertAuthenticated();
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.id !== userId) {
      throw new Error('غير مصرح لك بتغيير كلمة المرور لمستخدم آخر (403 Forbidden).');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' };
    }
    const res = await DatabaseDriver.changePassword(userId, newPassword);
    if (res.success && currentUser && currentUser.id === userId) {
      currentUser.must_change_password = false;
      currentUser.temp_password = null;
    }
    return res;
  });

  ipcMain.handle('auth:getCurrentUser', () => currentUser);

  ipcMain.handle('auth:logout', () => {
    currentUser = null;
    return { success: true };
  });

  // Companies (Super Admin Only)
  ipcMain.handle('companies:getAll', async () => {
    assertSuperAdmin();
    return DatabaseDriver.getCompanies();
  });

  ipcMain.handle('companies:create', async (_, data) => {
    assertSuperAdmin();
    return DatabaseDriver.createCompany(data);
  });

  ipcMain.handle('companies:update', async (_, id, data) => {
    assertSuperAdmin();
    return DatabaseDriver.updateCompany(id, data);
  });

  ipcMain.handle('companies:delete', async (_, id) => {
    assertSuperAdmin();
    return DatabaseDriver.deleteCompany(id);
  });

  ipcMain.handle('companies:resetOwnerPassword', async (_, companyId) => {
    assertSuperAdmin();
    return DatabaseDriver.resetCompanyOwnerPassword(companyId);
  });

  // Employees (Company Owner / Super Admin)
  ipcMain.handle('employees:getAll', async (_, companyId) => {
    const validCompanyId = assertTenantAccess(companyId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإدارة قائمة الموظفين (403 Forbidden).');
    }
    return DatabaseDriver.getEmployees(validCompanyId);
  });

  ipcMain.handle('employees:create', async (_, companyId, data) => {
    const validCompanyId = assertTenantAccess(companyId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإنشاء حسابات موظفين جديدة (403 Forbidden).');
    }
    if (!data?.username || !data?.full_name) {
      return { success: false, error: 'يرجى تزويد اسم المستخدم والاسم الكامل' };
    }
    return DatabaseDriver.createEmployee(validCompanyId, data);
  });

  ipcMain.handle('employees:delete', async (_, userId) => {
    await assertUserTenantAccess(userId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف الموظفين (403 Forbidden).');
    }
    return DatabaseDriver.deleteEmployee(userId);
  });

  ipcMain.handle('employees:resetPassword', async (_, userId) => {
    await assertUserTenantAccess(userId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإعادة تعيين كلمات المرور (403 Forbidden).');
    }
    return DatabaseDriver.resetEmployeePassword(userId);
  });

  // Events
  ipcMain.handle('events:getAll', async (_, companyId) => {
    const validCompanyId = currentUser ? assertTenantAccess(companyId) : companyId;
    return DatabaseDriver.getEvents(validCompanyId);
  });

  ipcMain.handle('events:getActive', async (_, companyId) => {
    const validCompanyId = currentUser ? assertTenantAccess(companyId) : companyId;
    return DatabaseDriver.getActiveEvent(validCompanyId);
  });

  ipcMain.handle('events:create', async (_, data) => {
    assertAuthenticated();
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإنشاء مناسبات جديدة (403 Forbidden).');
    }
    const scopedData = {
      ...data,
      company_id: currentUser?.role === 'SUPER_ADMIN' ? (data.company_id || currentUser.company_id) : currentUser?.company_id,
    };
    return DatabaseDriver.createEvent(scopedData);
  });

  ipcMain.handle('events:update', async (_, id, data) => {
    await assertEventTenantAccess(id);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتعديل بيانات المناسبات (403 Forbidden).');
    }
    return DatabaseDriver.updateEvent(id, data);
  });

  ipcMain.handle('events:setActive', async (_, id) => {
    await assertEventTenantAccess(id);
    return DatabaseDriver.setActiveEvent(id);
  });

  ipcMain.handle('events:delete', async (_, id) => {
    await assertEventTenantAccess(id);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف المناسبات (403 Forbidden).');
    }
    return DatabaseDriver.deleteEvent(id);
  });

  ipcMain.handle('events:getStats', async (_, eventId) => {
    await assertEventTenantAccess(eventId);
    return DatabaseDriver.getEventStats(eventId);
  });

  // Invitations
  ipcMain.handle('invitations:getByEvent', async (_, eventId, filter) => {
    await assertEventTenantAccess(eventId);
    return DatabaseDriver.getInvitations(eventId, filter);
  });

  ipcMain.handle('invitations:generateBatch', async (_, eventId, count, guestNames, graduateAllocations) => {
    await assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتوليد دفعات دعوات جديدة (403 Forbidden).');
    }
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10000));
    return DatabaseDriver.generateBatch(eventId, safeCount, guestNames, graduateAllocations);
  });

  ipcMain.handle('invitations:addBatch', async (_, eventId, count, guestNames) => {
    await assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بزيادة سعة المناسبة وتوليد دعوات (403 Forbidden).');
    }
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10000));
    return DatabaseDriver.addBatch(eventId, safeCount, guestNames);
  });

  ipcMain.handle('invitations:updateGuestName', async (_, invitationId, guestName) => {
    await assertInvitationTenantAccess(invitationId);
    return DatabaseDriver.updateGuestName(invitationId, guestName);
  });

  ipcMain.handle('invitations:delete', async (_, invitationId) => {
    await assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف الدعوات الفردية (403 Forbidden).');
    }
    return DatabaseDriver.deleteInvitation(invitationId);
  });

  ipcMain.handle('invitations:regenerateToken', async (_, invitationId) => {
    await assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإعادة توليد رموز الدعوات (403 Forbidden).');
    }
    return DatabaseDriver.regenerateToken(invitationId);
  });

  ipcMain.handle('invitations:resetUsed', async (_, eventId) => {
    await assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتصفير سجلات الدخول (403 Forbidden).');
    }
    return DatabaseDriver.resetUsedInvitations(eventId);
  });

  ipcMain.handle('invitations:resetSingle', async (_, invitationId) => {
    await assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتصفير حالة الدعوة (403 Forbidden).');
    }
    return DatabaseDriver.resetSingleInvitation(invitationId);
  });

  // Atomic Check-in
  ipcMain.handle('checkIn:verify', async (_, token, eventId, deviceName, scannedBy) => {
    await assertEventTenantAccess(eventId);
    const scannerName = scannedBy || currentUser?.full_name || 'مسؤول البوابة';
    return DatabaseDriver.checkIn(token, eventId, deviceName, scannerName);
  });

  // Scan Logs
  ipcMain.handle('scanLogs:getByEvent', async (_, eventId, limit) => {
    await assertEventTenantAccess(eventId);
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 5000));
    return DatabaseDriver.getScanLogs(eventId, safeLimit);
  });

  // Database Backup / Restore (Local SQLite)
  ipcMain.handle('database:backup', () => {
    assertDedicatedOrSuperAdmin();
    return BackupService.backupDatabase();
  });
  ipcMain.handle('database:restore', () => {
    assertDedicatedOrSuperAdmin();
    return BackupService.restoreDatabase();
  });

  // Cloud Sync & Configuration
  ipcMain.handle('cloud:getConfig', () => {
    return SupabaseService.getConfig();
  });
  ipcMain.handle('cloud:saveConfig', (_, config) => {
    assertSuperAdmin();
    SupabaseService.saveConfig(config);
    return { success: true };
  });
  ipcMain.handle('cloud:testConnection', (_, url, key) => {
    assertSuperAdmin();
    return SupabaseService.testConnection(url, key);
  });
  ipcMain.handle('cloud:syncLocalToCloud', () => {
    assertSuperAdmin();
    return SupabaseService.syncLocalToCloud();
  });

  // System Deployment & Licensing (Super Admin Only)
  ipcMain.handle('system:getDeploymentConfig', () => {
    assertSuperAdmin();
    return SystemDeploymentService.getConfig();
  });

  ipcMain.handle('system:saveDeploymentConfig', (_, config: SystemDeploymentConfig) => {
    assertSuperAdmin();
    return SystemDeploymentService.saveConfig(config);
  });

  ipcMain.handle('subscriptions:getAll', async () => {
    assertSuperAdmin();
    return DatabaseDriver.getTenantSubscriptions();
  });

  ipcMain.handle('subscriptions:getForCompany', async (_, companyId?: number) => {
    const targetCompanyId = companyId || currentUser?.company_id;
    if (!targetCompanyId) return null;

    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.company_id !== targetCompanyId) {
      throw new Error('غير مصرح لك بعرض بيانات اشتراك شركة أخرى (403 Forbidden).');
    }

    return DatabaseDriver.getCompanySubscription(targetCompanyId);
  });

  ipcMain.handle('subscriptions:update', async (_, companyId: number, data: Partial<TenantSubscription>) => {
    assertSuperAdmin();
    return DatabaseDriver.updateTenantSubscription(companyId, data);
  });

  ipcMain.handle('subscriptions:renew', async (_, companyId: number, durationMonths: number, billingCycle?: BillingCycle) => {
    assertSuperAdmin();
    return DatabaseDriver.renewTenantSubscription(companyId, durationMonths, billingCycle);
  });

  ipcMain.handle('subscriptions:extend', async (_, companyId: number, durationMonths: number) => {
    assertSuperAdmin();
    return DatabaseDriver.extendTenantSubscription(companyId, durationMonths);
  });

  // Commercial Mode & Dedicated License Activation
  ipcMain.handle('app:getStatus', async () => {
    return DeviceService.checkStartupStatus();
  });

  ipcMain.handle('app:getDeviceId', async () => {
    return DeviceService.getDeviceId();
  });

  ipcMain.handle('license:activateDedicated', async (_, data) => {
    return DeviceService.activateDedicatedInstallation(data);
  });

  ipcMain.handle('license:validateDedicated', async () => {
    const status = await DeviceService.checkStartupStatus();
    return { success: status.isActivated, valid: status.isActivated, error: status.error };
  });

  ipcMain.handle('license:deactivateDedicated', async () => {
    return DeviceService.deactivateDedicatedDevice();
  });

  ipcMain.handle('database:provisionDedicated', async (_, data) => {
    return DatabaseProvisioningService.provisionDedicatedDatabase(data);
  });

  ipcMain.handle('database:setupCompanyAndAdmin', async (_, data) => {
    return DatabaseProvisioningService.setupDedicatedCompanyAndAdmin(data);
  });

  ipcMain.handle('database:verifyDedicated', async (_, data) => {
    return DatabaseProvisioningService.verifyDedicatedInstallation(data);
  });

  ipcMain.handle('database:checkMigrationStatus', async (_, data) => {
    return DatabaseMigrationService.checkMigrationStatus(data);
  });

  ipcMain.handle('database:runMigrations', async (_, data) => {
    return DatabaseMigrationService.runPendingMigrations(data);
  });

  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    try {
      if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        await shell.openExternal(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to open external url:', err);
      return false;
    }
  });

  // Super Admin License Management (Vendor Side)
  ipcMain.handle('license:admin:list', async (_, filter) => {
    assertSuperAdmin();
    return LicenseServerService.listLicenses(filter, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:create', async (_, data: { company_name: string; max_devices?: number; expires_at?: string | null; license_type?: LicenseType }) => {
    assertSuperAdmin();
    return LicenseServerService.createLicense(data, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:revoke', async (_, licenseId: number) => {
    assertSuperAdmin();
    return LicenseServerService.revokeLicense(licenseId, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:reactivate', async (_, licenseId: number) => {
    assertSuperAdmin();
    return LicenseServerService.reactivateLicense(licenseId, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:updateStatus', async (_, licenseId: number, status: LicenseStatus) => {
    assertSuperAdmin();
    return LicenseServerService.updateLicenseStatus(licenseId, status, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:getActivations', async (_, licenseId: number) => {
    assertSuperAdmin();
    return LicenseServerService.getActivations(licenseId, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:deactivateDevice', async (_, activationId: number) => {
    assertSuperAdmin();
    return LicenseServerService.deactivateDeviceById(activationId, currentUser?.role || 'SUPER_ADMIN');
  });

  ipcMain.handle('license:admin:getAuditLogs', async (_, filter) => {
    assertSuperAdmin();
    return LicenseServerService.getAuditLogs(filter);
  });

  ipcMain.handle('audit:getCompanyLogs', async (_, filter) => {
    assertSuperAdmin();
    return LicenseServerService.getAuditLogs(filter);
  });

  ipcMain.handle('license:getDedicated', () => {
    assertSuperAdmin();
    return SystemDeploymentService.getDedicatedLicense();
  });

  ipcMain.handle('license:saveDedicated', (_, license: DedicatedLicenseConfig) => {
    assertSuperAdmin();
    return SystemDeploymentService.saveDedicatedLicense(license);
  });

  // PDF Export and Print
  ipcMain.handle('pdf:export', (_, data) =>
    PdfService.exportToPdf(data.event, data.invitations, data.printSettings)
  );
  ipcMain.handle('pdf:print', (_, data) =>
    PdfService.printDirectly(data.event, data.invitations, data.printSettings)
  );

  // QR generation utility
  ipcMain.handle('qr:generateDataUrl', (_, text) => QrService.generateDataUrl(text));

  // System Clipboard
  ipcMain.handle('clipboard:writeText', (_, text: string) => {
    try {
      clipboard.writeText(text || '');
      return true;
    } catch (err) {
      console.error('Failed to write to clipboard:', err);
      return false;
    }
  });
  ipcMain.handle('clipboard:readText', () => {
    try {
      return clipboard.readText();
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
      return '';
    }
  });

  // Card Templates Management (Delegates cleanly to DatabaseDriver)
  ipcMain.handle('cardTemplates:getAll', async (_, filter) => {
    return DatabaseDriver.getCardTemplates(filter);
  });

  ipcMain.handle('cardTemplates:create', async (_, data) => {
    assertSuperAdmin();
    return DatabaseDriver.createCardTemplate(data);
  });

  ipcMain.handle('cardTemplates:update', async (_, id: string, data) => {
    assertSuperAdmin();
    return DatabaseDriver.updateCardTemplate(id, data);
  });

  ipcMain.handle('cardTemplates:delete', async (_, id: string) => {
    assertSuperAdmin();
    return DatabaseDriver.deleteCardTemplate(id);
  });

  ipcMain.handle('cardTemplates:toggleActive', async (_, id: string, isActive: boolean) => {
    assertSuperAdmin();
    return DatabaseDriver.toggleCardTemplateActive(id, isActive);
  });
}

app.whenReady().then(async () => {
  try {
    initDatabase();
  } catch (dbErr) {
    console.error('Failed to initialize local SQLite database:', dbErr);
  }

  // Initialize and identify the active database driver (Cloud vs Local) on startup
  try {
    const dbStatus = await DatabaseDriver.init();
    console.log(`🚀 [App Startup] Database Initialized: ${dbStatus.statusMessage} (Mode: ${dbStatus.activeSource})`);
  } catch (err) {
    console.error('DatabaseDriver init error:', err);
  }

  try {
    registerIpcHandlers();
  } catch (ipcErr) {
    console.error('Failed to register IPC handlers:', ipcErr);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
