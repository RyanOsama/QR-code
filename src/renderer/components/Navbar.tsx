import React from 'react';
import { 
  QrCode, 
  LayoutDashboard, 
  Users, 
  Camera, 
  Printer, 
  History, 
  Calendar, 
  DatabaseBackup,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { Event } from '../../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeEvent: Event | null;
  onOpenEventsModal: () => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeEvent,
  onOpenEventsModal,
  onOpenBackupModal,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'invitations', label: 'إدارة الدعوات', icon: Users },
    { id: 'scanner', label: 'قارئ الـ QR', icon: Camera, highlight: true },
    { id: 'printing', label: 'الطباعة و PDF', icon: Printer },
    { id: 'logs', label: 'سجل المسح', icon: History },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b px-6 py-3 ${
      isDark 
        ? 'bg-slate-950/80 backdrop-blur-md border-slate-800/80 text-white' 
        : 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <QrCode className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${
              isDark
                ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent'
                : 'text-amber-800 font-extrabold'
            }`}>
              منظومة دعوات المناسبات
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              إدارة وتأكيد الدخول عبر الرموز الذكية
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className={`flex items-center gap-1 p-1.5 rounded-2xl border transition-colors ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-slate-100/90 border-slate-200'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30'
                      : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : item.highlight
                    ? isDark ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-emerald-700 hover:bg-emerald-100/60'
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.highlight && !isActive ? 'animate-pulse' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Theme Switcher, Event Selector & Backup */}
        <div className="flex items-center gap-2.5">
          
          {/* Day / Night Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'التبديل إلى الوضع الصباحي' : 'التبديل إلى الوضع الليلي'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 shadow-sm'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-slate-200">الصباحي</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline text-slate-800">الليلي</span>
              </>
            )}
          </button>

          {/* Active Event Selector */}
          <button
            onClick={onOpenEventsModal}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-right transition-all group ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800/80 border-amber-500/30'
                : 'bg-white hover:bg-slate-50 border-amber-400/50 shadow-sm'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div>
              <div className={`text-[10px] font-medium ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                المناسبة الحالية
              </div>
              <div className={`text-xs font-bold truncate max-w-[140px] transition-colors ${
                isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
              }`}>
                {activeEvent ? activeEvent.name : 'لا توجد مناسبة نشطة'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} group-hover:text-amber-500`} />
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackupModal}
            title="النسخ الاحتياطي لقاعدة البيانات"
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-amber-400'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-amber-600 shadow-sm'
            }`}
          >
            <DatabaseBackup className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
