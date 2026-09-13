import { app, BrowserWindow, ipcMain, session } from 'electron';
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

  // Automatically approve media (camera) permissions for QR Scanner
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
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

// Register all IPC Handlers
function registerIpcHandlers() {
  // Events
  ipcMain.handle('events:getAll', async () => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.getEvents();
    }
    return EventRepository.getAll();
  });

  ipcMain.handle('events:getActive', async () => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.getActiveEvent();
    }
    return EventRepository.getActive();
  });

  ipcMain.handle('events:create', async (_, data) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.createEvent(data);
    }
    return EventRepository.create(data);
  });

  ipcMain.handle('events:update', async (_, id, data) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.updateEvent(id, data);
    }
    return EventRepository.update(id, data);
  });

  ipcMain.handle('events:setActive', async (_, id) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.setActiveEvent(id);
    }
    return EventRepository.setActive(id);
  });

  ipcMain.handle('events:delete', async (_, id) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.deleteEvent(id);
    }
    EventRepository.delete(id);
    return { success: true };
  });

  ipcMain.handle('events:getStats', async (_, eventId) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.getEventStats(eventId);
    }
    return EventRepository.getStats(eventId);
  });

  // Invitations
  ipcMain.handle('invitations:getByEvent', async (_, eventId, filter) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.getInvitations(eventId, filter);
    }
    return InvitationRepository.getByEventId(eventId, filter);
  });

  ipcMain.handle('invitations:generateBatch', async (_, eventId, count, guestNames, graduateAllocations) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.generateBatch(eventId, count, guestNames, graduateAllocations);
    }
    return InvitationRepository.generateBatch(eventId, count, guestNames, graduateAllocations);
  });

  ipcMain.handle('invitations:updateGuestName', async (_, invitationId, guestName) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.updateGuestName(invitationId, guestName);
    }
    return InvitationRepository.updateGuestName(invitationId, guestName);
  });

  ipcMain.handle('invitations:delete', async (_, invitationId) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.deleteInvitation(invitationId);
    }
    return InvitationRepository.delete(invitationId);
  });

  ipcMain.handle('invitations:regenerateToken', async (_, invitationId) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.regenerateToken(invitationId);
    }
    return InvitationRepository.regenerateToken(invitationId);
  });

  // Atomic Check-in
  ipcMain.handle('checkIn:verify', async (_, token, eventId, deviceName) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.checkIn(token, eventId, deviceName);
    }
    return CheckInService.verifyAndCheckIn(token, eventId, deviceName);
  });

  // Scan Logs
  ipcMain.handle('scanLogs:getByEvent', async (_, eventId, limit) => {
    if (SupabaseService.isCloudMode()) {
      return await SupabaseService.getScanLogs(eventId, limit);
    }
    return ScanLogRepository.getByEventId(eventId, limit);
  });

  // Database Backup / Restore (Local SQLite)
  ipcMain.handle('database:backup', () => BackupService.backupDatabase());
  ipcMain.handle('database:restore', () => BackupService.restoreDatabase());

  // Cloud Sync & Configuration
  ipcMain.handle('cloud:getConfig', () => SupabaseService.getConfig());
  ipcMain.handle('cloud:saveConfig', (_, config) => {
    SupabaseService.saveConfig(config);
    return { success: true };
  });
  ipcMain.handle('cloud:testConnection', (_, url, key) => SupabaseService.testConnection(url, key));
  ipcMain.handle('cloud:syncLocalToCloud', () => SupabaseService.syncLocalToCloud());

  // PDF Export and Print
  ipcMain.handle('pdf:export', (_, data) =>
    PdfService.exportToPdf(data.event, data.invitations, data.printSettings)
  );
  ipcMain.handle('pdf:print', (_, data) =>
    PdfService.printDirectly(data.event, data.invitations, data.printSettings)
  );

  // QR generation utility
  ipcMain.handle('qr:generateDataUrl', (_, text) => QrService.generateDataUrl(text));
}


app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
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
