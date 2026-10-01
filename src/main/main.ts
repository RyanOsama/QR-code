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
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { CheckInService } from '../services/checkInService';
import { BackupService } from '../database/backupService';
import { PdfService } from '../services/pdfService';
import { QrService } from '../services/qrService';
import { DatabaseProvisioningService } from '../services/databaseProvisioningService';
import { DatabaseMigrationService } from '../services/databaseMigrationService';

let mainWindow: BrowserWindow | null = null;

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

import { SupabaseService } from '../services/supabaseService';
import { CompanyRepository } from '../database/repositories/companyRepository';
import { UserRepository } from '../database/repositories/userRepository';
import { SubscriptionRepository } from '../database/repositories/subscriptionRepository';
import { SystemDeploymentService } from '../services/systemDeploymentService';
import { LicenseServerService } from '../services/licenseServerService';
import { DeviceService } from '../services/deviceService';
import { AppUser, SystemDeploymentConfig, DedicatedLicenseConfig, BillingCycle, TenantSubscription, LicenseType, LicenseStatus } from '../types';

let currentUser: AppUser | null = null;

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

function assertEventTenantAccess(eventId: number): void {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const event = EventRepository.getById(eventId);
  if (!event) throw new Error('المناسبة المطلوبة غير موجودة');
  if (event.company_id && event.company_id !== user.company_id) {
    throw new Error('غير مصرح لك بالوصول لمناسبات شركة أخرى (403 Forbidden).');
  }
}

function assertInvitationTenantAccess(invitationId: number): void {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const inv = InvitationRepository.getById(invitationId);
  if (!inv) throw new Error('الدعوة المطلوبة غير موجودة');
  assertEventTenantAccess(inv.event_id);
}

function assertUserTenantAccess(targetUserId: number): void {
  const user = assertAuthenticated();
  if (user.role === 'SUPER_ADMIN') return;
  const targetUser = UserRepository.getById(targetUserId);
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

let lastFallbackLogTime = 0;
function logCloudFallback(operation: string, err: any) {
  SupabaseService.markCloudUnreachable(err);
  const now = Date.now();
  if (now - lastFallbackLogTime > 15000) {
    const msg = err?.message || (typeof err === 'string' ? err : 'Connection error');
    console.warn(`[Cloud Notice] ${operation} (${msg}) - Switched to local SQLite instantly.`);
    lastFallbackLogTime = now;
  }
}

// Register all IPC Handlers
function registerIpcHandlers() {
  // Auth
  ipcMain.handle('auth:login', async (_, username, password) => {
    const cleanUsername = (username || '').trim();
    const isSuperAdminUser = cleanUsername.toLowerCase() === 'ryan_osama' || cleanUsername.toLowerCase() === 'admin';

    // 1. If in cloud mode, authenticate with Supabase
    if (SupabaseService.isCloudMode()) {
      try {
        const res = await SupabaseService.login(cleanUsername, password);
        if (res.success && res.user) {
          currentUser = res.user;
          return res;
        }
        // If Supabase returned an explicit failure message and it's not the Super Admin account, return Supabase result
        if (res && !res.success && !isSuperAdminUser) {
          return res;
        }
      } catch (cloudErr) {
        logCloudFallback('auth:login', cloudErr);
      }
    }

    // 2. Local fallback (e.g. for Super Admin or local offline mode)
    const localRes = UserRepository.login(cleanUsername, password);
    if (localRes.success && localRes.user) {
      currentUser = localRes.user;
      return localRes;
    }

    if (localRes && !localRes.success && localRes.error) {
      return localRes;
    }

    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  });

  ipcMain.handle('auth:changePassword', async (_, userId, newPassword) => {
    assertAuthenticated();
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.id !== userId) {
      throw new Error('غير مصرح لك بتغيير كلمة المرور لمستخدم آخر (403 Forbidden).');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' };
    }
    if (SupabaseService.isCloudMode()) {
      try {
        const res = await SupabaseService.changePassword(userId, newPassword);
        if (res.success) {
          if (currentUser && currentUser.id === userId) {
            currentUser.must_change_password = false;
            currentUser.temp_password = null;
          }
          return res;
        }
      } catch (_) {}
    }
    const res = UserRepository.changePassword(userId, newPassword);
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
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getCompanies();
      } catch (err) {
        logCloudFallback('companies:getAll', err);
      }
    }
    return CompanyRepository.getAll();
  });

  ipcMain.handle('companies:create', async (_, data) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.createCompany(data);
      } catch (err) {
        logCloudFallback('companies:create', err);
      }
    }
    return CompanyRepository.create(data);
  });

  ipcMain.handle('companies:update', async (_, id, data) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.updateCompany(id, data);
      } catch (err) {
        logCloudFallback('companies:update', err);
      }
    }
    return CompanyRepository.update(id, data);
  });

  ipcMain.handle('companies:delete', async (_, id) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.deleteCompany(id);
      } catch (err) {
        logCloudFallback('companies:delete', err);
      }
    }
    return CompanyRepository.delete(id);
  });

  ipcMain.handle('companies:resetOwnerPassword', async (_, companyId) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.resetCompanyOwnerPassword(companyId);
      } catch (err) {
        logCloudFallback('companies:resetOwnerPassword', err);
      }
    }
    return CompanyRepository.resetOwnerPassword(companyId);
  });

  // Employees (Company Owner / Super Admin)
  ipcMain.handle('employees:getAll', async (_, companyId) => {
    const validCompanyId = assertTenantAccess(companyId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإدارة قائمة الموظفين (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getEmployees(validCompanyId);
      } catch (err) {
        logCloudFallback('employees:getAll', err);
      }
    }
    return UserRepository.getEmployees(validCompanyId);
  });

  ipcMain.handle('employees:create', async (_, companyId, data) => {
    const validCompanyId = assertTenantAccess(companyId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإنشاء حسابات موظفين جديدة (403 Forbidden).');
    }
    if (!data?.username || !data?.full_name) {
      return { success: false, error: 'يرجى تزويد اسم المستخدم والاسم الكامل' };
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.createEmployee(validCompanyId, data);
      } catch (err) {
        logCloudFallback('employees:create', err);
      }
    }
    return UserRepository.createEmployee(validCompanyId, data);
  });

  ipcMain.handle('employees:delete', async (_, userId) => {
    assertUserTenantAccess(userId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف الموظفين (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.deleteEmployee(userId);
      } catch (err) {
        logCloudFallback('employees:delete', err);
      }
    }
    return UserRepository.deleteEmployee(userId);
  });

  ipcMain.handle('employees:resetPassword', async (_, userId) => {
    assertUserTenantAccess(userId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإعادة تعيين كلمات المرور (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.resetEmployeePassword(userId);
      } catch (err) {
        logCloudFallback('employees:resetPassword', err);
      }
    }
    return UserRepository.resetEmployeePassword(userId);
  });

  // Events
  ipcMain.handle('events:getAll', async (_, companyId) => {
    const validCompanyId = currentUser ? assertTenantAccess(companyId) : companyId;
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getEvents(validCompanyId);
      } catch (err) {
        logCloudFallback('events:getAll', err);
      }
    }
    return EventRepository.getAll(validCompanyId);
  });

  ipcMain.handle('events:getActive', async (_, companyId) => {
    const validCompanyId = currentUser ? assertTenantAccess(companyId) : companyId;
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getActiveEvent(validCompanyId);
      } catch (err) {
        logCloudFallback('events:getActive', err);
      }
    }
    return EventRepository.getActive(validCompanyId);
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
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.createEvent(scopedData);
      } catch (err) {
        logCloudFallback('events:create', err);
      }
    }
    return EventRepository.create(scopedData);
  });

  ipcMain.handle('events:update', async (_, id, data) => {
    assertEventTenantAccess(id);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتعديل بيانات المناسبات (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.updateEvent(id, data);
      } catch (err) {
        logCloudFallback('events:update', err);
      }
    }
    return EventRepository.update(id, data);
  });

  ipcMain.handle('events:setActive', async (_, id) => {
    assertEventTenantAccess(id);
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.setActiveEvent(id);
      } catch (err) {
        logCloudFallback('events:setActive', err);
      }
    }
    return EventRepository.setActive(id);
  });

  ipcMain.handle('events:delete', async (_, id) => {
    assertEventTenantAccess(id);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف المناسبات (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.deleteEvent(id);
      } catch (err) {
        logCloudFallback('events:delete', err);
      }
    }
    EventRepository.delete(id);
    return { success: true };
  });

  ipcMain.handle('events:getStats', async (_, eventId) => {
    assertEventTenantAccess(eventId);
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getEventStats(eventId);
      } catch (err) {
        logCloudFallback('events:getStats', err);
      }
    }
    return EventRepository.getStats(eventId);
  });

  // Invitations
  ipcMain.handle('invitations:getByEvent', async (_, eventId, filter) => {
    assertEventTenantAccess(eventId);
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getInvitations(eventId, filter);
      } catch (err) {
        logCloudFallback('invitations:getByEvent', err);
      }
    }
    return InvitationRepository.getByEventId(eventId, filter);
  });

  ipcMain.handle('invitations:generateBatch', async (_, eventId, count, guestNames, graduateAllocations) => {
    assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتوليد دفعات دعوات جديدة (403 Forbidden).');
    }
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10000));
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.generateBatch(eventId, safeCount, guestNames, graduateAllocations);
      } catch (err) {
        logCloudFallback('invitations:generateBatch', err);
      }
    }
    return InvitationRepository.generateBatch(eventId, safeCount, guestNames, graduateAllocations);
  });

  ipcMain.handle('invitations:addBatch', async (_, eventId, count, guestNames) => {
    assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بزيادة سعة المناسبة وتوليد دعوات (403 Forbidden).');
    }
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10000));
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.addInvitationsToEvent(eventId, safeCount, guestNames);
      } catch (err) {
        logCloudFallback('invitations:addBatch', err);
      }
    }
    return InvitationRepository.addBatch(eventId, safeCount, guestNames);
  });

  ipcMain.handle('invitations:updateGuestName', async (_, invitationId, guestName) => {
    assertInvitationTenantAccess(invitationId);
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.updateGuestName(invitationId, guestName);
      } catch (err) {
        logCloudFallback('invitations:updateGuestName', err);
      }
    }
    return InvitationRepository.updateGuestName(invitationId, guestName);
  });

  ipcMain.handle('invitations:delete', async (_, invitationId) => {
    assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بحذف الدعوات الفردية (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.deleteInvitation(invitationId);
      } catch (err) {
        logCloudFallback('invitations:delete', err);
      }
    }
    return InvitationRepository.delete(invitationId);
  });

  ipcMain.handle('invitations:regenerateToken', async (_, invitationId) => {
    assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بإعادة توليد رموز الدعوات (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.regenerateToken(invitationId);
      } catch (err) {
        logCloudFallback('invitations:regenerateToken', err);
      }
    }
    return InvitationRepository.regenerateToken(invitationId);
  });

  ipcMain.handle('invitations:resetUsed', async (_, eventId) => {
    assertEventTenantAccess(eventId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتصفير سجلات الدخول (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.resetUsedInvitations(eventId);
      } catch (err) {
        logCloudFallback('invitations:resetUsed', err);
      }
    }
    return InvitationRepository.resetUsedByEvent(eventId);
  });

  ipcMain.handle('invitations:resetSingle', async (_, invitationId) => {
    assertInvitationTenantAccess(invitationId);
    if (currentUser?.role === 'EMPLOYEE') {
      throw new Error('غير مصرح للموظفين بتصفير حالة الدعوة (403 Forbidden).');
    }
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.resetSingleInvitation(invitationId);
      } catch (err) {
        logCloudFallback('invitations:resetSingle', err);
      }
    }
    return InvitationRepository.resetSingleInvitation(invitationId);
  });

  // Atomic Check-in
  ipcMain.handle('checkIn:verify', async (_, token, eventId, deviceName, scannedBy) => {
    assertEventTenantAccess(eventId);
    const scannerName = scannedBy || currentUser?.full_name || 'مسؤول البوابة';
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.checkIn(token, eventId, deviceName, scannerName);
      } catch (err) {
        logCloudFallback('checkIn:verify', err);
      }
    }
    return CheckInService.verifyAndCheckIn(token, eventId, deviceName, scannerName);
  });

  // Scan Logs
  ipcMain.handle('scanLogs:getByEvent', async (_, eventId, limit) => {
    assertEventTenantAccess(eventId);
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 5000));
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getScanLogs(eventId, safeLimit);
      } catch (err) {
        logCloudFallback('scanLogs:getByEvent', err);
      }
    }
    return ScanLogRepository.getByEventId(eventId, safeLimit);
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

  // Cloud Sync & Legacy Configuration (Protected)
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
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getTenantSubscriptions();
      } catch (err) {
        logCloudFallback('subscriptions:getAll', err);
      }
    }
    return SubscriptionRepository.getAll();
  });

  ipcMain.handle('subscriptions:getForCompany', async (_, companyId?: number) => {
    const targetCompanyId = companyId || currentUser?.company_id;
    if (!targetCompanyId) return null;

    // Enforce tenant isolation: non-super-admins can only view their own company's subscription
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.company_id !== targetCompanyId) {
      throw new Error('غير مصرح لك بعرض بيانات اشتراك شركة أخرى (403 Forbidden).');
    }

    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.getCompanySubscription(targetCompanyId);
      } catch (err) {
        logCloudFallback('subscriptions:getForCompany', err);
      }
    }
    return SubscriptionRepository.getByCompanyId(targetCompanyId);
  });

  ipcMain.handle('subscriptions:update', async (_, companyId: number, data: Partial<TenantSubscription>) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.updateTenantSubscription(companyId, data);
      } catch (err) {
        logCloudFallback('subscriptions:update', err);
      }
    }
    return SubscriptionRepository.update(companyId, data);
  });

  ipcMain.handle('subscriptions:renew', async (_, companyId: number, durationMonths: number, billingCycle?: BillingCycle) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.renewTenantSubscription(companyId, durationMonths, billingCycle);
      } catch (err) {
        logCloudFallback('subscriptions:renew', err);
      }
    }
    return SubscriptionRepository.renew(companyId, durationMonths, billingCycle);
  });

  ipcMain.handle('subscriptions:extend', async (_, companyId: number, durationMonths: number) => {
    assertSuperAdmin();
    if (SupabaseService.isCloudMode()) {
      try {
        return await SupabaseService.extendTenantSubscription(companyId, durationMonths);
      } catch (err) {
        logCloudFallback('subscriptions:extend', err);
      }
    }
    return SubscriptionRepository.extend(companyId, durationMonths);
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
}


app.whenReady().then(() => {
  try {
    initDatabase();
  } catch (dbErr) {
    console.error('Failed to initialize local SQLite database:', dbErr);
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
