import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../types';

const api: ElectronAPI = {
  getEvents: () => ipcRenderer.invoke('events:getAll'),
  getActiveEvent: () => ipcRenderer.invoke('events:getActive'),
  createEvent: (data) => ipcRenderer.invoke('events:create', data),
  updateEvent: (id, data) => ipcRenderer.invoke('events:update', id, data),
  setActiveEvent: (id) => ipcRenderer.invoke('events:setActive', id),
  deleteEvent: (id) => ipcRenderer.invoke('events:delete', id),
  getInvitations: (eventId, filter) => ipcRenderer.invoke('invitations:getByEvent', eventId, filter),
  generateInvitations: (eventId, count, guestNames) =>
    ipcRenderer.invoke('invitations:generateBatch', eventId, count, guestNames),
  updateGuestName: (invitationId, guestName) =>
    ipcRenderer.invoke('invitations:updateGuestName', invitationId, guestName),
  deleteInvitation: (invitationId) => ipcRenderer.invoke('invitations:delete', invitationId),
  regenerateToken: (invitationId) => ipcRenderer.invoke('invitations:regenerateToken', invitationId),
  checkIn: (token, eventId, deviceName) => ipcRenderer.invoke('checkIn:verify', token, eventId, deviceName),
  getScanLogs: (eventId, limit) => ipcRenderer.invoke('scanLogs:getByEvent', eventId, limit),
  getEventStats: (eventId) => ipcRenderer.invoke('events:getStats', eventId),
  backupDatabase: () => ipcRenderer.invoke('database:backup'),
  restoreDatabase: () => ipcRenderer.invoke('database:restore'),
  exportPdf: (data) => ipcRenderer.invoke('pdf:export', data),
  printPdf: (data) => ipcRenderer.invoke('pdf:print', data),
  generateQrDataUrl: (text) => ipcRenderer.invoke('qr:generateDataUrl', text),
};

contextBridge.exposeInMainWorld('electronAPI', api);
