import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../types';

const api: ElectronAPI = {
  // Auth
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  changePassword: (userId, newPassword) => ipcRenderer.invoke('auth:changePassword', userId, newPassword),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // Commercial Mode & Dedicated License
  getAppStatus: () => ipcRenderer.invoke('app:getStatus'),
  getDeviceId: () => ipcRenderer.invoke('app:getDeviceId'),
  activateDedicatedLicense: (data) => ipcRenderer.invoke('license:activateDedicated', data),
  validateDedicatedLicense: () => ipcRenderer.invoke('license:validateDedicated'),
  deactivateDedicatedDevice: () => ipcRenderer.invoke('license:deactivateDedicated'),
  provisionDedicatedDatabase: (data) => ipcRenderer.invoke('database:provisionDedicated', data),
  setupDedicatedCompanyAndAdmin: (data) => ipcRenderer.invoke('database:setupCompanyAndAdmin', data),
  verifyDedicatedInstallation: (data) => ipcRenderer.invoke('database:verifyDedicated', data),
  checkDatabaseMigrationStatus: (params) => ipcRenderer.invoke('database:checkMigrationStatus', params),
  runDatabaseMigrations: (params) => ipcRenderer.invoke('database:runMigrations', params),
  openExternalUrl: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Super Admin License Management
  getAdminLicenses: (filter) => ipcRenderer.invoke('license:admin:list', filter),
  createAdminLicense: (data) => ipcRenderer.invoke('license:admin:create', data),
  revokeAdminLicense: (licenseId) => ipcRenderer.invoke('license:admin:revoke', licenseId),
  reactivateAdminLicense: (licenseId) => ipcRenderer.invoke('license:admin:reactivate', licenseId),
  updateAdminLicenseStatus: (licenseId, status) => ipcRenderer.invoke('license:admin:updateStatus', licenseId, status),
  getAdminLicenseActivations: (licenseId) => ipcRenderer.invoke('license:admin:getActivations', licenseId),
  deactivateAdminDevice: (activationId) => ipcRenderer.invoke('license:admin:deactivateDevice', activationId),
  getAdminLicenseAuditLogs: (filter) => ipcRenderer.invoke('license:admin:getAuditLogs', filter),
  getCompanyAuditLogs: (filter) => ipcRenderer.invoke('audit:getCompanyLogs', filter),


  // Companies
  getCompanies: () => ipcRenderer.invoke('companies:getAll'),
  createCompany: (data) => ipcRenderer.invoke('companies:create', data),
  updateCompany: (id, data) => ipcRenderer.invoke('companies:update', id, data),
  deleteCompany: (id) => ipcRenderer.invoke('companies:delete', id),
  resetCompanyOwnerPassword: (companyId) => ipcRenderer.invoke('companies:resetOwnerPassword', companyId),

  // Employees
  getEmployees: (companyId) => ipcRenderer.invoke('employees:getAll', companyId),
  createEmployee: (companyId, data) => ipcRenderer.invoke('employees:create', companyId, data),
  deleteEmployee: (userId) => ipcRenderer.invoke('employees:delete', userId),
  resetEmployeePassword: (userId) => ipcRenderer.invoke('employees:resetPassword', userId),

  // Events
  getEvents: (companyId) => ipcRenderer.invoke('events:getAll', companyId),
  getActiveEvent: (companyId) => ipcRenderer.invoke('events:getActive', companyId),
  createEvent: (data) => ipcRenderer.invoke('events:create', data),
  updateEvent: (id, data) => ipcRenderer.invoke('events:update', id, data),
  setActiveEvent: (id) => ipcRenderer.invoke('events:setActive', id),
  deleteEvent: (id) => ipcRenderer.invoke('events:delete', id),

  // Invitations
  getInvitations: (eventId, filter) => ipcRenderer.invoke('invitations:getByEvent', eventId, filter),
  generateInvitations: (eventId, count, guestNames, graduateAllocations) =>
    ipcRenderer.invoke('invitations:generateBatch', eventId, count, guestNames, graduateAllocations),
  addInvitationsToEvent: (eventId, additionalCount, guestNames) =>
    ipcRenderer.invoke('invitations:addBatch', eventId, additionalCount, guestNames),
  updateGuestName: (invitationId, guestName) =>
    ipcRenderer.invoke('invitations:updateGuestName', invitationId, guestName),
  deleteInvitation: (invitationId) => ipcRenderer.invoke('invitations:delete', invitationId),
  regenerateToken: (invitationId) => ipcRenderer.invoke('invitations:regenerateToken', invitationId),
  resetUsedInvitations: (eventId) => ipcRenderer.invoke('invitations:resetUsed', eventId),
  resetSingleInvitation: (invitationId) => ipcRenderer.invoke('invitations:resetSingle', invitationId),

  // Scanner & Logs
  checkIn: (token, eventId, deviceName, scannedBy) =>
    ipcRenderer.invoke('checkIn:verify', token, eventId, deviceName, scannedBy),
  getScanLogs: (eventId, limit) => ipcRenderer.invoke('scanLogs:getByEvent', eventId, limit),
  getEventStats: (eventId) => ipcRenderer.invoke('events:getStats', eventId),

  // DB & PDF
  backupDatabase: () => ipcRenderer.invoke('database:backup'),
  restoreDatabase: () => ipcRenderer.invoke('database:restore'),
  exportPdf: (data) => ipcRenderer.invoke('pdf:export', data),
  printPdf: (data) => ipcRenderer.invoke('pdf:print', data),
  generateQrDataUrl: (text) => ipcRenderer.invoke('qr:generateDataUrl', text),

  // Cloud Config (Legacy)
  getCloudConfig: () => ipcRenderer.invoke('cloud:getConfig'),
  saveCloudConfig: (config) => ipcRenderer.invoke('cloud:saveConfig', config),
  testCloudConnection: (url, key) => ipcRenderer.invoke('cloud:testConnection', url, key),
  syncLocalToCloud: () => ipcRenderer.invoke('cloud:syncLocalToCloud'),

  // System & Deployment
  getSystemDeploymentConfig: () => ipcRenderer.invoke('system:getDeploymentConfig'),
  saveSystemDeploymentConfig: (config) => ipcRenderer.invoke('system:saveDeploymentConfig', config),
  getTenantSubscriptions: () => ipcRenderer.invoke('subscriptions:getAll'),
  getCompanySubscription: (companyId) => ipcRenderer.invoke('subscriptions:getForCompany', companyId),
  updateTenantSubscription: (companyId, data) => ipcRenderer.invoke('subscriptions:update', companyId, data),
  renewTenantSubscription: (companyId, durationMonths, billingCycle) =>
    ipcRenderer.invoke('subscriptions:renew', companyId, durationMonths, billingCycle),
  extendTenantSubscription: (companyId, durationMonths) =>
    ipcRenderer.invoke('subscriptions:extend', companyId, durationMonths),
  getDedicatedLicense: () => ipcRenderer.invoke('license:getDedicated'),
  saveDedicatedLicense: (license) => ipcRenderer.invoke('license:saveDedicated', license),

  // Card Templates Management
  getCardTemplates: (filter) => ipcRenderer.invoke('cardTemplates:getAll', filter),
  createCardTemplate: (data) => ipcRenderer.invoke('cardTemplates:create', data),
  updateCardTemplate: (id, data) => ipcRenderer.invoke('cardTemplates:update', id, data),
  deleteCardTemplate: (id) => ipcRenderer.invoke('cardTemplates:delete', id),
  toggleCardTemplateActive: (id, isActive) => ipcRenderer.invoke('cardTemplates:toggleActive', id, isActive),

  // Clipboard
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  readClipboard: () => ipcRenderer.invoke('clipboard:readText'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
