import React, { useState, useEffect, useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Invitations } from './pages/Invitations';
import { PrintSettingsPage } from './pages/PrintSettings';
import { ScanLogsPage } from './pages/ScanLogs';
import { EventsModal } from './pages/EventsModal';
import { BackupModal } from './pages/BackupModal';
import { CloudSettingsModal } from './components/CloudSettingsModal';
import { QrModal } from './components/QrModal';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ActivationModal } from './components/ActivationModal';
import { DatabaseSetupWizard } from './components/DatabaseSetupWizard';
import { DatabaseUpdateScreen } from './components/DatabaseUpdateScreen';
import { SubscriptionStatusModal } from './components/SubscriptionStatusModal';
import { CompanySubscriptionViewModal } from './components/CompanySubscriptionViewModal';
import { CompaniesPage } from './pages/CompaniesPage';
import { SystemDeploymentPage } from './pages/SystemDeploymentPage';
import { EmployeesModal } from './pages/EmployeesModal';
import { Event, Invitation, ScanLog, EventStats, CloudConfig, AppUser, CommercialAppStatus, TenantSubscription } from '../types';
import { api } from './utils/apiBridge';
import { useTheme } from './context/ThemeContext';

export function App() {
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [companySubscription, setCompanySubscription] = useState<TenantSubscription | null>(null);
  const [isCompanySubModalOpen, setIsCompanySubModalOpen] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<CommercialAppStatus | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{
    currentVersion: number;
    requiredVersion: number;
    needsMigration: boolean;
    pendingMigrations: Array<{
      version: number;
      name: string;
      titleArabic: string;
      description: string;
    }>;
  } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);
  const [stats, setStats] = useState<EventStats>({
    totalInvitations: 0,
    usedInvitations: 0,
    unusedInvitations: 0,
    acceptedScans: 0,
    alreadyUsedScans: 0,
    invalidScans: 0,
    attendancePercentage: 0,
  });

  // Modals state
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isCreateInvModalOpen, setIsCreateInvModalOpen] = useState(false);
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
  const [selectedInvitationForQr, setSelectedInvitationForQr] = useState<Invitation | null>(null);

  // Load cloud configuration
  const refreshCloudConfig = useCallback(async () => {
    try {
      const cfg = await api.getCloudConfig();
      setCloudConfig(cfg);
    } catch (err) {
      console.error('Error loading cloud config:', err);
    }
  }, []);

  // Load all events and determine active event
  const refreshEvents = useCallback(async (userOverride?: AppUser | null) => {
    try {
      const user = userOverride !== undefined ? userOverride : currentUser;
      const companyId = (user && user.role !== 'SUPER_ADMIN') ? (user.company_id || undefined) : undefined;
      const allEvents = await api.getEvents(companyId);
      setEvents(allEvents);

      const active = await api.getActiveEvent(companyId);
      setActiveEvent(active);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  }, [currentUser]);

  // Initial load: check commercial mode, activation, auth, migration and load cloud config
  const initApp = useCallback(async () => {
    try {
      setIsAuthChecking(true);
      const status = await api.getAppStatus().catch(() => ({ mode: 'SAAS', isActivated: true } as CommercialAppStatus));
      setAppStatus(status);

      if (status.mode === 'DEDICATED' && !status.isActivated) {
        setIsAuthChecking(false);
        return;
      }

      // Check migration status in Dedicated Mode when database is configured
      if (status.mode === 'DEDICATED' && status.isDatabaseConfigured) {
        try {
          const migRes = await api.checkDatabaseMigrationStatus();
          if (migRes && migRes.needsMigration) {
            setMigrationStatus(migRes);
            setIsAuthChecking(false);
            return;
          } else {
            setMigrationStatus(null);
          }
        } catch (_) {}
      }

      const [cfg, user] = await Promise.all([
        api.getCloudConfig().catch(() => null),
        api.getCurrentUser().catch(() => null),
      ]);

      if (cfg) setCloudConfig(cfg);
      setCurrentUser(user);

      if (user) {
        if (user.role === 'SUPER_ADMIN') {
          setCurrentTab('companies');
          setCompanySubscription(null);
        } else {
          if (user.company_id) {
            const sub = user.company_subscription || await api.getCompanySubscription(user.company_id).catch(() => null);
            setCompanySubscription(sub);
          }
        }
        const companyId = (user.role !== 'SUPER_ADMIN') ? (user.company_id || undefined) : undefined;
        const [allEvents, active] = await Promise.all([
          api.getEvents(companyId).catch(() => []),
          api.getActiveEvent(companyId).catch(() => null),
        ]);
        setEvents(allEvents);
        setActiveEvent(active);
      }
    } catch (err) {
      console.error('Initial auth/config check failed:', err);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);


  // Refresh active event's data (invitations, stats, logs)
  const refreshCurrentEventData = useCallback(async () => {
    if (!activeEvent) {
      setInvitations([]);
      setScanLogs([]);
      setStats({
        totalInvitations: 0,
        usedInvitations: 0,
        unusedInvitations: 0,
        acceptedScans: 0,
        alreadyUsedScans: 0,
        invalidScans: 0,
        attendancePercentage: 0,
      });
      return;
    }

    try {
      const [invs, logs, eventStats] = await Promise.all([
        api.getInvitations(activeEvent.id),
        api.getScanLogs(activeEvent.id, 100),
        api.getEventStats(activeEvent.id),
      ]);

      setInvitations(invs);
      setScanLogs(logs);
      setStats(eventStats);
    } catch (err) {
      console.error('Error loading event data:', err);
    }
  }, [activeEvent?.id]);

  // When active event changes, reload invitations & stats
  useEffect(() => {
    refreshCurrentEventData();
  }, [activeEvent?.id]);

  // Real-time synchronization interval (optimized for low Disk IO usage)
  useEffect(() => {
    if (cloudConfig?.mode !== 'cloud' || !activeEvent) return;

    let isPolling = false;
    const interval = setInterval(async () => {
      // Skip polling if window/tab is hidden/minimized to save Disk IO budget
      if (document.hidden || isPolling) return;

      if (['dashboard', 'logs'].includes(currentTab)) {
        isPolling = true;
        try {
          // Lightweight poll: only stats and recent logs, without re-fetching entire invitations list
          const [logs, eventStats] = await Promise.all([
            api.getScanLogs(activeEvent.id, 50),
            api.getEventStats(activeEvent.id),
          ]);
          setScanLogs(logs);
          setStats(eventStats);
        } catch (_) {
        } finally {
          isPolling = false;
        }
      }
    }, 25000); // 25 seconds interval

    return () => clearInterval(interval);
  }, [cloudConfig?.mode, activeEvent?.id, currentTab]);

  const handleSelectEvent = async (event: Event) => {
    await api.setActiveEvent(event.id);
    setActiveEvent(event);
    refreshEvents();
  };

  const handleCloudConfigUpdated = () => {
    refreshCloudConfig();
    refreshEvents();
    refreshCurrentEventData();
  };

  const handleLoginSuccess = async (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setCurrentTab('companies');
      setCompanySubscription(null);
    } else {
      setCurrentTab('dashboard');
      if (user.company_id) {
        const sub = user.company_subscription || await api.getCompanySubscription(user.company_id).catch(() => null);
        setCompanySubscription(sub);
      }
    }
    await refreshEvents(user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setCurrentUser(null);
    setCompanySubscription(null);
    setIsCompanySubModalOpen(false);
    setActiveEvent(null);
    setEvents([]);
    setInvitations([]);
    setScanLogs([]);
    setCurrentTab('dashboard');
  };

  // If checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-arabic">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4 animate-pulse">
          <QrCode className="w-9 h-9 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="text-sm font-bold text-slate-300 animate-pulse">جاري التحقق من حالة الترخيص والصلاحيات...</div>
      </div>
    );
  }

  // If in Dedicated mode:
  // 1. If not yet activated, show License Activation screen
  if (appStatus && appStatus.mode === 'DEDICATED' && !appStatus.isActivated) {
    return (
      <ActivationModal
        onActivated={(companyName) => {
          setAppStatus((prev) =>
            prev
              ? {
                  ...prev,
                  isActivated: true,
                  isDatabaseConfigured: false,
                  companyName: companyName || prev.companyName,
                }
              : null
          );
        }}
        initialError={appStatus.error}
      />
    );
  }

  // 2. If activated in Dedicated mode but database is not configured or missing, show Database Setup Wizard
  if (appStatus && appStatus.mode === 'DEDICATED' && !appStatus.isDatabaseConfigured) {
    return (
      <DatabaseSetupWizard
        companyName={appStatus.companyName || 'الشركة'}
        onSetupComplete={() => {
          initApp();
        }}
      />
    );
  }

  // 3. If in Dedicated mode and database needs migration to a newer version, show Database Update Screen
  if (appStatus && appStatus.mode === 'DEDICATED' && migrationStatus && migrationStatus.needsMigration) {
    return (
      <DatabaseUpdateScreen
        companyName={appStatus.companyName || 'الشركة'}
        currentVersion={migrationStatus.currentVersion}
        requiredVersion={migrationStatus.requiredVersion}
        pendingMigrations={migrationStatus.pendingMigrations}
        onMigrationComplete={() => {
          setMigrationStatus(null);
          initApp();
        }}
      />
    );
  }

  // If not logged in, show Login modal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }


  // If forced password change is required
  if (currentUser.must_change_password) {
    return (
      <ChangePasswordModal
        user={currentUser}
        onSuccess={() => {
          setCurrentUser({
            ...currentUser,
            must_change_password: false,
            temp_password: null,
          });
        }}
      />
    );
  }

  // If in SaaS mode with an expired / suspended / cancelled / past_due subscription
  if (currentUser && currentUser.role !== 'SUPER_ADMIN' && companySubscription) {
    const isSubBlocked =
      companySubscription.status === 'expired' ||
      companySubscription.status === 'suspended' ||
      companySubscription.status === 'cancelled' ||
      companySubscription.status === 'past_due' ||
      (companySubscription.expiration_date && new Date(companySubscription.expiration_date).getTime() < Date.now());

    if (isSubBlocked) {
      return (
        <SubscriptionStatusModal
          companyName={currentUser.company_name || 'الشركة'}
          subscription={companySubscription}
          status={companySubscription.status}
          onRefresh={initApp}
          onLogout={handleLogout}
        />
      );
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-arabic ${
      isDark 
        ? 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950' 
        : 'bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-900'
    }`}>
      
      {/* Sticky Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeEvent={activeEvent}
        cloudConfig={cloudConfig}
        currentUser={currentUser}
        onOpenEventsModal={() => setIsEventsModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenEmployeesModal={() => setIsEmployeesModalOpen(true)}
        onOpenSubscriptionModal={() => setIsCompanySubModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'companies' && (
          <CompaniesPage onLogout={handleLogout} />
        )}

        {currentTab === 'system_deployment' && (
          <SystemDeploymentPage onRefreshGlobal={handleCloudConfigUpdated} />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            activeEvent={activeEvent}
            stats={stats}
            invitations={invitations}
            scanLogs={scanLogs}
            onNavigate={(tab) => {
              if (tab === 'events') setIsEventsModalOpen(true);
              else setCurrentTab(tab);
            }}
            onSelectInvitationForQr={setSelectedInvitationForQr}
            onOpenCreateInvitations={() => {
              setCurrentTab('invitations');
              setIsCreateInvModalOpen(true);
            }}
          />
        )}

        {currentTab === 'invitations' && (
          <Invitations
            activeEvent={activeEvent}
            invitations={invitations}
            onRefresh={refreshCurrentEventData}
            onSelectForQr={setSelectedInvitationForQr}
            isCreateModalOpen={isCreateInvModalOpen}
            setIsCreateModalOpen={setIsCreateInvModalOpen}
          />
        )}

        {currentTab === 'printing' && (
          <PrintSettingsPage
            activeEvent={activeEvent}
            invitations={invitations}
            onRefreshInvitations={refreshCurrentEventData}
          />
        )}

        {currentTab === 'logs' && (
          <ScanLogsPage
            activeEvent={activeEvent}
            scanLogs={scanLogs}
            onRefresh={refreshCurrentEventData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t px-6 py-3 text-center text-[11px] flex items-center justify-between max-w-7xl mx-auto w-full transition-colors ${
        isDark 
          ? 'border-slate-900 text-slate-500' 
          : 'border-slate-200 text-slate-600'
      }`}>
        <span>
          منظومة إدارة المناسبات والدخول بالـ QR •{' '}
          {cloudConfig?.mode === 'cloud' ? (
            <span className="text-emerald-400 font-bold">🟢 متصل بالسحابة ({cloudConfig.deviceName || 'متصل'})</span>
          ) : (
            <span>وضع محلي (Local-First)</span>
          )}
        </span>
        <span className={`font-mono font-bold ${isDark ? 'text-amber-500/80' : 'text-amber-700'}`}>نسخة سطح المكتب v1.0</span>
      </footer>

      {/* Modals */}
      {isEventsModalOpen && (
        <EventsModal
          events={events}
          activeEvent={activeEvent}
          currentUser={currentUser}
          onClose={() => setIsEventsModalOpen(false)}
          onRefresh={() => refreshEvents()}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {isEmployeesModalOpen && currentUser && currentUser.company_id && (
        <EmployeesModal
          companyId={currentUser.company_id}
          companyName={currentUser.company_name || 'الشركة'}
          isOpen={isEmployeesModalOpen}
          onClose={() => setIsEmployeesModalOpen(false)}
        />
      )}

      {isCompanySubModalOpen && currentUser && (
        <CompanySubscriptionViewModal
          companyName={currentUser.company_name || 'الشركة'}
          subscription={companySubscription}
          isOpen={isCompanySubModalOpen}
          onClose={() => setIsCompanySubModalOpen(false)}
        />
      )}

      {isBackupModalOpen && (
        <BackupModal
          onClose={() => setIsBackupModalOpen(false)}
          onRefreshAll={() => {
            refreshEvents();
            refreshCurrentEventData();
          }}
        />
      )}

      {isCloudModalOpen && (
        <CloudSettingsModal
          onClose={() => setIsCloudModalOpen(false)}
          onConfigUpdated={handleCloudConfigUpdated}
        />
      )}

      {selectedInvitationForQr && (
        <QrModal
          invitation={selectedInvitationForQr}
          event={activeEvent}
          onClose={() => setSelectedInvitationForQr(null)}
        />
      )}

    </div>
  );
}
export default App;
