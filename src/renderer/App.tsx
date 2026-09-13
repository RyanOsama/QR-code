import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Invitations } from './pages/Invitations';
import { Scanner } from './pages/Scanner';
import { PrintSettingsPage } from './pages/PrintSettings';
import { ScanLogsPage } from './pages/ScanLogs';
import { EventsModal } from './pages/EventsModal';
import { BackupModal } from './pages/BackupModal';
import { QrModal } from './components/QrModal';
import { Event, Invitation, ScanLog, EventStats } from '../types';
import { api } from './utils/apiBridge';
import { useTheme } from './context/ThemeContext';

export function App() {
  const { isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
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
  const [isCreateInvModalOpen, setIsCreateInvModalOpen] = useState(false);
  const [selectedInvitationForQr, setSelectedInvitationForQr] = useState<Invitation | null>(null);

  // Load all events and determine active event
  const refreshEvents = useCallback(async () => {
    try {
      const allEvents = await api.getEvents();
      setEvents(allEvents);

      const active = await api.getActiveEvent();
      setActiveEvent(active);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  }, []);

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
  }, [activeEvent]);

  // Initial load
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // When active event changes, reload invitations & stats
  useEffect(() => {
    refreshCurrentEventData();
  }, [activeEvent, refreshCurrentEventData]);

  const handleSelectEvent = async (event: Event) => {
    await api.setActiveEvent(event.id);
    setActiveEvent(event);
    refreshEvents();
  };

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
        onOpenEventsModal={() => setIsEventsModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
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

        {currentTab === 'scanner' && (
          <Scanner
            activeEvent={activeEvent}
            onCheckInSuccess={refreshCurrentEventData}
          />
        )}

        {currentTab === 'printing' && (
          <PrintSettingsPage
            activeEvent={activeEvent}
            invitations={invitations}
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
        <span>منظومة إدارة المناسبات والدخول بالـ QR • نظام محلي (Local-First)</span>
        <span className={`font-mono font-bold ${isDark ? 'text-amber-500/80' : 'text-amber-700'}`}>نسخة سطح المكتب v1.0</span>
      </footer>

      {/* Modals */}
      {isEventsModalOpen && (
        <EventsModal
          events={events}
          activeEvent={activeEvent}
          onClose={() => setIsEventsModalOpen(false)}
          onRefresh={refreshEvents}
          onSelectEvent={handleSelectEvent}
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
