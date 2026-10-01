export type EventStatus = 'ACTIVE' | 'ARCHIVED';
export type EventType = 'wedding' | 'graduation' | 'dinner' | 'celebration' | 'custom';

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'EMPLOYEE';

export interface Company {
  id: number;
  name: string;
  logo_url?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  // joined fields
  owner_name?: string | null;
  owner_username?: string | null;
  temp_password?: string | null;
  must_change_password?: boolean;
  employees_count?: number;
  events_count?: number;
  subscription?: TenantSubscription | null;
}

export interface AppUser {
  id: number;
  company_id: number | null;
  username: string;
  full_name: string;
  role: UserRole;
  must_change_password: boolean;
  temp_password?: string | null;
  created_at: string;
  // joined fields
  company_name?: string | null;
  company_logo?: string | null;
  company_subscription?: TenantSubscription | null;
}

export interface Event {
  id: number;
  company_id?: number | null;
  name: string;
  date: string;
  time?: string;
  venue?: string;
  eventType?: EventType;
  capacity: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export type InvitationStatus = 'UNUSED' | 'USED' | 'CANCELLED';

export interface Invitation {
  id: number;
  event_id: number;
  invitation_number: number;
  token: string;
  guest_name: string | null;
  graduate_name?: string | null;
  has_name: number; // 0 or 1
  status: InvitationStatus;
  created_at: string;
  used_at: string | null;
  scan_count?: number;
  scanned_by_name?: string | null;
  scanned_device_name?: string | null;
}

export type ScanResultType = 'ACCEPTED' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT';

export interface ScanLog {
  id: number;
  invitation_id: number | null;
  event_id: number;
  scanned_at: string;
  result: ScanResultType;
  device_name: string | null;
  scanned_by_name?: string | null;
  scanned_by_id?: number | null;
  notes: string | null;
  // Joined fields for display
  guest_name?: string | null;
  graduate_name?: string | null;
  invitation_number?: number | null;
}

export interface CheckInResult {
  success: boolean;
  result: ScanResultType;
  message: string;
  invitation?: Invitation;
  previousUsedAt?: string;
  scannedBy?: string | null;
  guestName?: string | null;
  graduateName?: string | null;
  invitationNumber?: number;
}

export type CardTemplateType = 
  | 'wedding_golden_floral'
  | 'wedding' 
  | 'wedding_botanical_purple'
  | 'wedding_royal_burgundy'
  | 'wedding_calla_sage'
  | 'wedding_sculpted_ivory'
  | 'wedding_andalusian' 
  | 'wedding_damask' 
  | 'wedding_imperial' 
  | 'wedding_minimal_luxury'
  | 'graduation' 
  | 'graduation_royal' 
  | 'graduation_classic'
  | 'dinner' 
  | 'dinner_royal' 
  | 'dinner_classic'
  | 'royal_graduation' 
  | 'celebration' 
  | 'minimal' 
  | 'custom';

export type QrPositionType = 'center' | 'left' | 'right' | 'bottom' | 'custom';
export type CardColorScheme = 'default' | 'black_white' | 'blue_white' | 'emerald_white' | 'burgundy' | 'violet' | 'custom';

export interface CardTemplateItem {
  id: string;
  name: string;
  category: 'graduation' | 'wedding' | 'dinner' | 'celebration' | 'general' | 'custom' | string;
  front_image: string; // Data URL or Image URL
  back_image?: string | null; // Data URL or Image URL
  thumbnail_url?: string | null;
  text_color_scheme?: 'gold' | 'light' | 'dark' | 'custom';
  default_primary_color?: string;
  default_accent_color?: string;
  default_qr_position?: QrPositionType;
  is_active: boolean;
  is_builtin: boolean;
  company_id?: number | null;
  created_at: string;
  updated_at: string;
}

export type CardShapeType = 'rectangle';

export interface PrintSettings {
  paperSize: 'A4' | 'A5' | 'CUSTOM';
  columns: number;
  rows: number;
  cardWidth: number; // in mm
  cardHeight: number; // in mm
  cardShape?: CardShapeType; // 'rectangle' (landscape)
  gapX: number; // in mm
  gapY: number; // in mm
  marginX: number; // in mm
  marginY: number; // in mm
  showEventName: boolean;
  showGuestName: boolean;
  showInvitationNumber: boolean;
  showCropMarks: boolean;
  showVenue: boolean;
  showTime: boolean;
  showDate: boolean;
  venueText?: string;
  timeText?: string;
  dateText?: string;
  welcomeText: string;
  customSubtitle?: string;
  // Wedding specific fields: Couple names vs Event name vs Family title
  weddingTitleType?: 'couple_names' | 'event_name' | 'family_title' | 'custom_title'; // نوع العنوان: أسماء العروسين أو اسم المناسبة أو دعوة عائلية
  familyTitleText?: string; // نص الدعوة العائلية: مثل "تتشرف أسرة أحمد سالم بدعوتكم لحضور زفاف..."
  groomName?: string; // اسم العريس
  brideName?: string; // اسم العروسة
  weddingHijriDate?: string; // التاريخ الهجري للزفاف
  showEtiquetteIcons?: boolean; // إظهار أيقونات ممنوع التصوير والأطفال
  // Monogram customization
  monogramEnabled?: boolean; // إظهار/إخفاء مونوغرام الحرفين
  monogramGroomInitial?: string; // الحرف الأول للعريس (مثلاً A)
  monogramBrideInitial?: string; // الحرف الأول للعروسة (مثلاً M)
  showHeartIcon?: boolean; // إظهار أيقونة القلب الصغير
  // Full text customization for ready-made templates
  guestPrefixText?: string; // مقدمة اسم المدعو (مثل "الأستاذ/" أو "المكرم/")
  guestPrefixEnabled?: boolean; // تفعيل/إلغاء مقدمة اسم المدعو
  generalCardNotice?: string; // عبارة الكرت العام بدون اسم
  qrInstructionText?: string; // نص تعليمات الباركود (مثل "يرجى إبراز الكود للدخول")
  footerNoteText?: string; // عبارة التذييل أسفل الكرت (مثل "بحضوركم تكتمل فرحتنا")
  showFooterDivider?: boolean; // إظهار/إلغاء الفاصل السفلي والعبارة
  footerDividerText?: string; // نص الفاصل السفلي
  backTitleText?: string; // عنوان الوجه الخلفي
  backHeaderText?: string; // العبارة العلوية للوجه الخلفي
  backMessageText?: string; // رسالة الوجه الخلفي
  backBadgeText?: string; // شارة الوجه الخلفي
  showBackEnglishNote?: boolean; // إظهار/إلغاء الملاحظة الإنجليزية في الوجه الخلفي
  backEnglishNoteText?: string; // نص العبارة الإنجليزية (مثل "A Special Day / A Lasting Memory")
  cardTheme: CardTemplateType;
  colorScheme?: CardColorScheme;
  customPrimaryColor?: string; // hex
  customAccentColor?: string; // hex
  customBgColor?: string; // hex
  qrPosition: QrPositionType;
  // Custom uploaded design properties (single or double-sided)
  designSource?: 'system_templates' | 'custom_images'; // المصدر: قوالب النظام أو صور مخصصة
  customCardImage?: string | null; // Data URL of Front uploaded image
  customCardBackImage?: string | null; // Data URL of Back uploaded image (optional)
  customImageWidth?: number; // Detected width of uploaded image in px
  customImageHeight?: number; // Detected height of uploaded image in px
  customAspectRatio?: number; // Detected aspect ratio (width / height)
  customQrSide?: 'front' | 'back'; // Which side receives the QR code
  customQrX?: number; // X position percentage 0 - 100
  customQrY?: number; // Y position percentage 0 - 100
  customQrSize?: number; // Size percentage or mm
  customQrBg?: boolean; // White background box behind QR code
  customShowTextOverlay?: boolean; // Whether to overlay text on top of custom image
  doubleSidedMode?: 'duplex' | 'front_only' | 'back_only'; // Printing mode for 2-sided cards
  // Pure QR Stickers (High density labels for cutting & pasting)
  printMode?: 'cards' | 'pure_qr_stickers';
  stickerPreset?: '24' | '30' | '35' | '40' | '48' | '60' | 'custom';
  stickerShowNumber?: boolean;
  stickerShowName?: boolean;
  stickerShowCutMarks?: boolean;
  isGeneralInvitation?: boolean;
}

export interface EventStats {
  totalInvitations: number;
  usedInvitations: number;
  unusedInvitations: number;
  acceptedScans: number;
  alreadyUsedScans: number;
  invalidScans: number;
  attendancePercentage: number;
}

export interface CloudConfig {
  mode: 'local' | 'cloud';
  supabaseUrl: string;
  supabaseAnonKey: string;
  deviceName: string;
}

export type DeploymentMode = 'saas' | 'dedicated' | 'local_dev';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
export type BillingCycle = 'monthly' | 'yearly';

export interface TenantSubscription {
  id: number;
  company_id: number;
  plan_name: 'Professional' | string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  start_date: string;
  renewal_date: string;
  expiration_date: string;
  payment_status: 'paid' | 'pending' | 'failed' | string;
  created_at: string;
  updated_at: string;
  // joined fields
  company_name?: string;
}

export type CommercialMode = 'SAAS' | 'DEDICATED';
export type LicenseType = 'PERPETUAL' | 'SUBSCRIPTION';
export type LicenseStatus = 'active' | 'revoked' | 'expired' | 'suspended';

export type LicenseAuditAction =
  | 'LICENSE_CREATED'
  | 'LICENSE_REVOKED'
  | 'LICENSE_REACTIVATED'
  | 'DEVICE_ACTIVATED'
  | 'DEVICE_DEACTIVATED'
  | 'DEVICE_TRANSFER'
  | 'LICENSE_STATUS_UPDATED'
  | 'COMPANY_CREATED'
  | 'COMPANY_ACTIVATED'
  | 'COMPANY_SUSPENDED'
  | 'COMPANY_REACTIVATED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_REACTIVATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXTENDED';

export type SystemAuditAction = LicenseAuditAction;

export interface LicenseAuditLog {
  id: number;
  license_id?: number | null;
  license_key_masked?: string | null;
  company_name?: string | null;
  action: LicenseAuditAction;
  details?: string | null;
  actor?: string;
  created_at: string;
}

export interface License {
  id: number;
  license_key?: string;
  license_key_hash: string;
  company_name: string;
  license_type: LicenseType;
  status: LicenseStatus;
  max_devices: number;
  expires_at?: string | null;
  created_at: string;
  activations_count?: number;
  activations?: LicenseActivation[];
}

export interface LicenseActivation {
  id: number;
  license_id: number;
  device_id_hash: string;
  device_name?: string | null;
  activated_at: string;
  last_seen_at: string;
  deactivated_at?: string | null;
}

export interface SignedActivationToken {
  licenseId: number;
  companyName: string;
  deviceIdHash: string;
  issuedAt: string;
  validUntil: string;
  signature: string;
}

export interface CommercialAppStatus {
  mode: CommercialMode;
  isActivated: boolean;
  isDatabaseConfigured?: boolean;
  companyName?: string;
  deviceId?: string;
  dedicatedLicense?: {
    companyName: string;
    status: LicenseStatus;
    licenseType: LicenseType;
    maxDevices: number;
    expiresAt?: string | null;
  } | null;
  subscriptionStatus?: SubscriptionStatus | null;
  error?: string;
}

export interface DedicatedLicenseConfig {
  company_id?: number | null;
  company_name: string;
  license_key: string;
  status: 'active' | 'expired' | 'suspended';
  issued_at: string;
  expires_at?: string | null;
  notes?: string | null;
}

export interface SystemDeploymentConfig {
  deployment_mode: DeploymentMode;
  database_type: 'hosted_supabase' | 'hosted_postgres' | 'local_sqlite';
  database_url: string;
  database_anon_key: string;
  device_name: string;
  dedicated_license?: DedicatedLicenseConfig | null;
}

export interface DedicatedProvisioningStep {
  stepKey?: string;
  title?: string;
  step?: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped' | string;
  message?: string;
  error?: string;
}

export interface ElectronAPI {
  // Auth
  login: (username: string, password: string) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  changePassword: (userId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getCurrentUser: () => Promise<AppUser | null>;
  logout: () => Promise<void>;

  // Commercial Mode & License Activation
  getAppStatus: () => Promise<CommercialAppStatus>;
  getDeviceId: () => Promise<string>;
  activateDedicatedLicense: (data: { licenseKey: string; supabaseUrl?: string; supabaseAnonKey?: string; deviceName?: string }) => Promise<{ success: boolean; companyName?: string; error?: string }>;
  validateDedicatedLicense: () => Promise<{ success: boolean; valid: boolean; error?: string }>;
  deactivateDedicatedDevice: () => Promise<{ success: boolean; error?: string }>;
  provisionDedicatedDatabase: (data: { supabaseUrl: string; supabaseAnonKey: string; companyName: string; deviceName?: string }) => Promise<{
    success: boolean;
    companyName: string;
    adminUsername?: string;
    adminPassword?: string;
    schemaVersion?: number;
    tablesVerified?: string[];
    steps?: DedicatedProvisioningStep[];
    error?: string;
    failedStepKey?: string;
  }>;
  setupDedicatedCompanyAndAdmin: (data: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    companyName: string;
    logoUrl?: string | null;
    adminFullName: string;
    adminUsername: string;
    adminPassword: string;
    deviceName?: string;
  }) => Promise<{
    success: boolean;
    companyId?: number;
    companyName?: string;
    adminUsername?: string;
    error?: string;
  }>;
  verifyDedicatedInstallation: (data?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }) => Promise<{
    success: boolean;
    checks: {
      licenseValid: boolean;
      supabaseConnected: boolean;
      databaseProvisioned: boolean;
      companyExists: boolean;
      adminExists: boolean;
      subscriptionActive: boolean;
      schemaVersionValid: boolean;
    };
    companyName?: string;
    adminUsername?: string;
    error?: string;
  }>;
  checkDatabaseMigrationStatus: (params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }) => Promise<{
    currentVersion: number;
    requiredVersion: number;
    needsMigration: boolean;
    pendingVersions: number[];
    pendingMigrations: Array<{
      version: number;
      name: string;
      titleArabic: string;
      description: string;
    }>;
  }>;
  runDatabaseMigrations: (params?: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }) => Promise<{
    success: boolean;
    fromVersion: number;
    toVersion: number;
    appliedVersions: number[];
    steps: Array<{
      stepKey: string;
      title: string;
      status: string;
      message?: string;
      error?: string;
    }>;
    error?: string;
    failedVersion?: number;
  }>;
  openExternalUrl: (url: string) => Promise<boolean>;

  // Super Admin License Management (Vendor side)
  getAdminLicenses: (filter?: { query?: string; status?: LicenseStatus | 'all'; licenseType?: LicenseType | 'all' }) => Promise<License[]>;
  createAdminLicense: (data: { company_name: string; max_devices?: number; expires_at?: string | null; license_type?: LicenseType }) => Promise<{ success: boolean; license?: License; plainLicenseKey?: string; error?: string }>;
  revokeAdminLicense: (licenseId: number) => Promise<{ success: boolean; error?: string }>;
  reactivateAdminLicense: (licenseId: number) => Promise<{ success: boolean; error?: string }>;
  updateAdminLicenseStatus: (licenseId: number, status: LicenseStatus) => Promise<{ success: boolean; error?: string }>;
  getAdminLicenseActivations: (licenseId: number) => Promise<LicenseActivation[]>;
  deactivateAdminDevice: (activationId: number) => Promise<{ success: boolean; error?: string }>;
  getAdminLicenseAuditLogs: (filter?: { licenseId?: number; limit?: number }) => Promise<LicenseAuditLog[]>;
  getCompanyAuditLogs: (filter?: { companyName?: string; limit?: number }) => Promise<LicenseAuditLog[]>;

  // Companies (Super Admin)
  getCompanies: () => Promise<Company[]>;
  createCompany: (data: {
    name: string;
    logo_url?: string;
    owner_name: string;
    owner_username: string;
    billing_cycle?: BillingCycle;
    start_date?: string;
    expiration_date?: string;
  }) => Promise<{ success: boolean; company?: Company; ownerUser?: AppUser; tempPassword?: string; error?: string }>;
  updateCompany: (id: number, data: Partial<Company>) => Promise<{ success: boolean; error?: string }>;
  deleteCompany: (id: number) => Promise<{ success: boolean; error?: string }>;
  resetCompanyOwnerPassword: (companyId: number) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;

  // Employees (Company Owner)
  getEmployees: (companyId: number) => Promise<AppUser[]>;
  createEmployee: (companyId: number, data: { full_name: string; username: string }) => Promise<{ success: boolean; user?: AppUser; tempPassword?: string; error?: string }>;
  deleteEmployee: (userId: number) => Promise<{ success: boolean; error?: string }>;
  resetEmployeePassword: (userId: number) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;

  // Events
  getEvents: (companyId?: number | null) => Promise<Event[]>;
  getActiveEvent: (companyId?: number | null) => Promise<Event | null>;
  createEvent: (data: { name: string; date: string; time?: string; venue?: string; eventType?: EventType; capacity: number; company_id?: number | null }) => Promise<Event>;
  updateEvent: (id: number, data: Partial<Event>) => Promise<Event>;
  setActiveEvent: (id: number) => Promise<void>;
  deleteEvent: (id: number) => Promise<{ success: boolean; error?: string }>;

  // Invitations
  getInvitations: (eventId: number, filter?: { search?: string; status?: string }) => Promise<Invitation[]>;
  generateInvitations: (
    eventId: number,
    count: number,
    guestNames?: string[],
    graduateAllocations?: Array<{ graduateName: string; count: number }>
  ) => Promise<{ success: boolean; count: number; error?: string }>;
  addInvitationsToEvent: (
    eventId: number,
    additionalCount: number,
    guestNames?: string[]
  ) => Promise<{ success: boolean; addedCount: number; newCapacity: number; error?: string }>;
  updateGuestName: (invitationId: number, guestName: string) => Promise<Invitation>;
  deleteInvitation: (invitationId: number) => Promise<{ success: boolean; error?: string }>;
  regenerateToken: (invitationId: number) => Promise<{ success: boolean; token?: string; error?: string }>;
  resetUsedInvitations: (eventId: number) => Promise<{ success: boolean; resetCount: number; error?: string }>;
  resetSingleInvitation: (invitationId: number) => Promise<{ success: boolean; error?: string }>;

  // Scanning & Check-in
  checkIn: (token: string, eventId: number, deviceName?: string, scannedBy?: string) => Promise<CheckInResult>;
  getScanLogs: (eventId: number, limit?: number) => Promise<ScanLog[]>;
  getEventStats: (eventId: number) => Promise<EventStats>;

  // Database & PDF
  backupDatabase: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  restoreDatabase: () => Promise<{ success: boolean; error?: string }>;
  exportPdf: (data: { event: Event; invitations: Invitation[]; printSettings: PrintSettings }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  printPdf: (data: { event: Event; invitations: Invitation[]; printSettings: PrintSettings }) => Promise<{ success: boolean; error?: string }>;
  generateQrDataUrl: (text: string) => Promise<string>;

  // Cloud Config (Legacy & Internal Compatibility)
  getCloudConfig: () => Promise<CloudConfig>;
  saveCloudConfig: (config: CloudConfig) => Promise<{ success: boolean; error?: string }>;
  testCloudConnection: (url: string, key: string) => Promise<{ success: boolean; message?: string; latencyMs?: number }>;
  syncLocalToCloud: () => Promise<{ success: boolean; eventsSynced: number; invitationsSynced: number; error?: string }>;

  // System & Deployment
  getSystemDeploymentConfig: () => Promise<SystemDeploymentConfig>;
  saveSystemDeploymentConfig: (config: SystemDeploymentConfig) => Promise<{ success: boolean; error?: string }>;
  getTenantSubscriptions: () => Promise<TenantSubscription[]>;
  getCompanySubscription: (companyId?: number) => Promise<TenantSubscription | null>;
  updateTenantSubscription: (companyId: number, data: Partial<TenantSubscription>) => Promise<{ success: boolean; error?: string }>;
  renewTenantSubscription: (companyId: number, durationMonths: number, billingCycle?: BillingCycle) => Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }>;
  extendTenantSubscription: (companyId: number, durationMonths: number) => Promise<{ success: boolean; subscription?: TenantSubscription; error?: string }>;
  getDedicatedLicense: () => Promise<DedicatedLicenseConfig | null>;
  saveDedicatedLicense: (license: DedicatedLicenseConfig) => Promise<{ success: boolean; error?: string }>;

  // Card Templates Management
  getCardTemplates: (filter?: { category?: string; companyId?: number | null; onlyActive?: boolean }) => Promise<CardTemplateItem[]>;
  createCardTemplate: (data: Omit<CardTemplateItem, 'created_at' | 'updated_at'>) => Promise<{ success: boolean; template?: CardTemplateItem; error?: string }>;
  updateCardTemplate: (id: string, data: Partial<CardTemplateItem>) => Promise<{ success: boolean; template?: CardTemplateItem; error?: string }>;
  deleteCardTemplate: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleCardTemplateActive: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;

  // System Clipboard
  copyToClipboard: (text: string) => Promise<boolean>;
  readClipboard?: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}


