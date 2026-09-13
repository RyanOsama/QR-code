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
  Moon,
  Cloud,
  Server
} from 'lucide-react';
import { Event, CloudConfig } from '../../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeEvent: Event | null;
  cloudConfig: CloudConfig | null;
  onOpenEventsModal: () => void;
  onOpenBackupModal: () => void;
  onOpenCloudModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeEvent,
  cloudConfig,
  onOpenEventsModal,
  onOpenBackupModal,
  onOpenCloudModal,
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
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b px-4 lg:px-8 py-2.5 ${
      isDark 
        ? 'bg-slate-950/90 backdrop-blur-md border-slate-800/80 text-white' 
        : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-sm text-slate-900'
    }`}>
      <div className="w-full flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Logo & Brand (Right side in RTL) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <QrCode className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`font-bold text-base leading-tight tracking-tight ${
              isDark
                ? 'bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent'
                : 'text-amber-800 font-extrabold'
            }`}>
              منظومة دعوات المناسبات
            </h1>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              إدارة وتأكيد الدخول عبر الرموز الذكية
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Center) */}
        <nav className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors shrink-0 ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800/90' 
            : 'bg-slate-100/90 border-slate-200'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/30 font-bold'
                      : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : item.highlight
                    ? isDark ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-emerald-700 hover:bg-emerald-100/60'
                    : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.highlight && !isActive ? 'animate-pulse' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Left Controls: Event Selector, Cloud Sync, Theme & Backup */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Active Event Selector */}
          <button
            onClick={onOpenEventsModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-right transition-all group ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800/80 border-amber-500/30'
                : 'bg-white hover:bg-slate-50 border-amber-400/50 shadow-sm'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <div className="text-right">
              <div className={`text-[9px] font-medium leading-none mb-0.5 ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                المناسبة الحالية
              </div>
              <div className={`text-xs font-bold truncate max-w-[120px] transition-colors leading-tight ${
                isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
              }`}>
                {activeEvent ? activeEvent.name : 'لا توجد مناسبة نشطة'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'} group-hover:text-amber-500 shrink-0`} />
          </button>

          {/* Cloud Sync / Mode Badge Button */}
          <button
            onClick={onOpenCloudModal}
            title="إعدادات الربط السحابي ومزامنة الأجهزة"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              cloudConfig?.mode === 'cloud'
                ? isDark
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                : isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {cloudConfig?.mode === 'cloud' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold whitespace-nowrap">سحابي ({cloudConfig.deviceName || 'متصل'})</span>
              </>
            ) : (
              <>
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span className="whitespace-nowrap">محلي (SQLite)</span>
              </>
            )}
          </button>

          {/* Vertical Separator */}
          <div className={`h-6 w-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Day / Night Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'التبديل إلى الوضع الصباحي' : 'التبديل إلى الوضع الليلي'}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 shadow-sm'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackupModal}
            title="النسخ الاحتياطي لقاعدة البيانات"
            className={`p-2 rounded-xl border transition-colors ${
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
