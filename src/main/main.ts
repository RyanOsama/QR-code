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

// Register all IPC Handlers
function registerIpcHandlers() {
  // Events
  ipcMain.handle('events:getAll', () => EventRepository.getAll());
  ipcMain.handle('events:getActive', () => EventRepository.getActive());
  ipcMain.handle('events:create', (_, data) => EventRepository.create(data));
  ipcMain.handle('events:update', (_, id, data) => EventRepository.update(id, data));
  ipcMain.handle('events:setActive', (_, id) => EventRepository.setActive(id));
  ipcMain.handle('events:delete', (_, id) => {
    EventRepository.delete(id);
    return { success: true };
  });
  ipcMain.handle('events:getStats', (_, eventId) => EventRepository.getStats(eventId));

  // Invitations
  ipcMain.handle('invitations:getByEvent', (_, eventId, filter) =>
    InvitationRepository.getByEventId(eventId, filter)
  );
  ipcMain.handle('invitations:generateBatch', (_, eventId, count, guestNames, graduateAllocations) =>
    InvitationRepository.generateBatch(eventId, count, guestNames, graduateAllocations)
  );
  ipcMain.handle('invitations:updateGuestName', (_, invitationId, guestName) =>
    InvitationRepository.updateGuestName(invitationId, guestName)
  );
  ipcMain.handle('invitations:delete', (_, invitationId) =>
    InvitationRepository.delete(invitationId)
  );
  ipcMain.handle('invitations:regenerateToken', (_, invitationId) =>
    InvitationRepository.regenerateToken(invitationId)
  );

  // Atomic Check-in
  ipcMain.handle('checkIn:verify', (_, token, eventId, deviceName) =>
    CheckInService.verifyAndCheckIn(token, eventId, deviceName)
  );

  // Scan Logs
  ipcMain.handle('scanLogs:getByEvent', (_, eventId, limit) =>
    ScanLogRepository.getByEventId(eventId, limit)
  );

  // Database Backup / Restore
  ipcMain.handle('database:backup', () => BackupService.backupDatabase());
  ipcMain.handle('database:restore', () => BackupService.restoreDatabase());

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
