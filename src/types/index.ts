export type EventStatus = 'ACTIVE' | 'ARCHIVED';
export type EventType = 'wedding' | 'graduation' | 'dinner' | 'celebration' | 'custom';

export interface Event {
  id: number;
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
}

export type ScanResultType = 'ACCEPTED' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT';

export interface ScanLog {
  id: number;
  invitation_id: number | null;
  event_id: number;
  scanned_at: string;
  result: ScanResultType;
  device_name: string | null;
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
  guestName?: string | null;
  graduateName?: string | null;
  invitationNumber?: number;
}

export type CardTemplateType = 'royal_graduation' | 'graduation' | 'wedding' | 'dinner' | 'celebration' | 'minimal' | 'custom';
export type QrPositionType = 'center' | 'left' | 'right' | 'bottom' | 'custom';
export type CardColorScheme = 'default' | 'black_white' | 'blue_white' | 'emerald_white' | 'burgundy' | 'violet' | 'custom';

export interface PrintSettings {
  paperSize: 'A4' | 'A5' | 'CUSTOM';
  columns: number;
  rows: number;
  cardWidth: number; // in mm
  cardHeight: number; // in mm
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
  cardTheme: CardTemplateType;
  colorScheme?: CardColorScheme;
  customPrimaryColor?: string; // hex
  customAccentColor?: string; // hex
  customBgColor?: string; // hex
  qrPosition: QrPositionType;
  // Custom uploaded design properties
  customCardImage?: string | null; // Data URL of uploaded image
  customQrX?: number; // X position percentage 0 - 100
  customQrY?: number; // Y position percentage 0 - 100
  customQrSize?: number; // Size percentage or mm
  customShowTextOverlay?: boolean; // Whether to overlay text on top of custom image
  isGeneralInvitation?: boolean; // When true, prints as a general attendance invitation without individual student names
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

export interface ElectronAPI {
  getEvents: () => Promise<Event[]>;
  getActiveEvent: () => Promise<Event | null>;
  createEvent: (data: { name: string; date: string; time?: string; venue?: string; eventType?: EventType; capacity: number }) => Promise<Event>;
  updateEvent: (id: number, data: Partial<Event>) => Promise<Event>;
  setActiveEvent: (id: number) => Promise<void>;
  deleteEvent: (id: number) => Promise<{ success: boolean; error?: string }>;
  getInvitations: (eventId: number, filter?: { search?: string; status?: string }) => Promise<Invitation[]>;
  generateInvitations: (
    eventId: number,
    count: number,
    guestNames?: string[],
    graduateAllocations?: Array<{ graduateName: string; count: number }>
  ) => Promise<{ success: boolean; count: number; error?: string }>;
  updateGuestName: (invitationId: number, guestName: string) => Promise<Invitation>;
  deleteInvitation: (invitationId: number) => Promise<{ success: boolean; error?: string }>;
  regenerateToken: (invitationId: number) => Promise<{ success: boolean; token?: string; error?: string }>;
  checkIn: (token: string, eventId: number, deviceName?: string) => Promise<CheckInResult>;
  getScanLogs: (eventId: number, limit?: number) => Promise<ScanLog[]>;
  getEventStats: (eventId: number) => Promise<EventStats>;
  backupDatabase: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  restoreDatabase: () => Promise<{ success: boolean; error?: string }>;
  exportPdf: (data: { event: Event; invitations: Invitation[]; printSettings: PrintSettings }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  printPdf: (data: { event: Event; invitations: Invitation[]; printSettings: PrintSettings }) => Promise<{ success: boolean; error?: string }>;
  generateQrDataUrl: (text: string) => Promise<string>;
  getCloudConfig: () => Promise<CloudConfig>;
  saveCloudConfig: (config: CloudConfig) => Promise<{ success: boolean; error?: string }>;
  testCloudConnection: (url: string, key: string) => Promise<{ success: boolean; message?: string; latencyMs?: number }>;
  syncLocalToCloud: () => Promise<{ success: boolean; eventsSynced: number; invitationsSynced: number; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

