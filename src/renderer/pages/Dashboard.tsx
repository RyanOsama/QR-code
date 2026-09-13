import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  PlusCircle, 
  Printer, 
  FileDown, 
  Camera, 
  Settings2, 
  Eye, 
  AlertCircle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Event, EventStats, Invitation, ScanLog } from '../../types';

interface DashboardProps {
  activeEvent: Event | null;
  stats: EventStats;
  invitations: Invitation[];
  scanLogs: ScanLog[];
  onNavigate: (tab: string) => void;
  onSelectInvitationForQr: (invitation: Invitation) => void;
  onOpenCreateInvitations: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeEvent,
  stats,
  invitations,
  scanLogs,
  onNavigate,
  onSelectInvitationForQr,
  onOpenCreateInvitations,
}) => {
  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">أهلاً بك في نظام إدارة دعوات المناسبات</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          ابدأ بإنشاء مناسبتك الأولى أو تفعيل مناسبة موجودة لتوليد رموز الـ QR وإدارة الحضور.
        </p>
        <button
          onClick={() => onNavigate('events')}
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>إنشاء مناسبة جديدة الآن</span>
        </button>
      </div>
    );
  }

  const previewInvitations = invitations.slice(0, 7);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>المناسبة النشطة: {activeEvent.date}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {activeEvent.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              السعة المحددة: <span className="text-amber-300 font-bold">{activeEvent.capacity}</span> شخص
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCreateInvitations}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء دعوات</span>
            </button>
            <button
              onClick={() => onNavigate('scanner')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-700/30 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>الماسح (كاميرا)</span>
            </button>
            <button
              onClick={() => onNavigate('printing')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة A4</span>
            </button>
            <button
              onClick={() => onNavigate('printing')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>تحميل PDF</span>
            </button>
            <button
              onClick={() => onNavigate('invitations')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Settings2 className="w-4 h-4" />
              <span>إدارة الدعوات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Invitations */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>إجمالي الدعوات</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalInvitations}</div>
          <div className="text-[11px] text-slate-500 mt-1">من أصل {activeEvent.capacity} مسموح</div>
        </div>

        {/* Used Invitations */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-950/60 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>تم الحضور (مستخدمة)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{stats.usedInvitations}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            نسبة الحضور: {stats.attendancePercentage}%
          </div>
        </div>

        {/* Unused Invitations */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>المتبقية (غير مستخدمة)</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-200">{stats.unusedInvitations}</div>
          <div className="text-[11px] text-slate-500 mt-1">في انتظار الحضور</div>
        </div>

        {/* Scan Log summary */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>عمليات المسح المرفوضة</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {stats.alreadyUsedScans + stats.invalidScans}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.alreadyUsedScans} مكررة • {stats.invalidScans} غير صالحة
          </div>
        </div>

      </div>

      {/* Main Content Layout: Table & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invitations Table Preview (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>جدول الدعوات الأخيرة</span>
              </h2>
              <p className="text-[11px] text-slate-400">عرض سريع لأحدث الدعوات المسجلة في النظام</p>
            </div>
            <button
              onClick={() => onNavigate('invitations')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              عرض الكل ({invitations.length}) ←
            </button>
          </div>

          {previewInvitations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              لم يتم إنشاء أي دعوات لهذه المناسبة بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">رقم الدعوة</th>
                    <th className="py-2.5 px-3">اسم المدعو</th>
                    <th className="py-2.5 px-3">الحالة</th>
                    <th className="py-2.5 px-3">وقت الاستخدام</th>
                    <th className="py-2.5 px-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {previewInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        #{String(inv.invitation_number).padStart(3, '0')}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {inv.guest_name ? (
                          <span className="text-white">{inv.guest_name}</span>
                        ) : (
                          <span className="text-slate-500">— (بدون اسم)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'USED'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {inv.status === 'USED' ? 'مستخدم' : 'غير مستخدم'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {inv.used_at ? new Date(inv.used_at).toLocaleTimeString('ar-SA') : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectInvitationForQr(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors inline-flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Recent Scans Log (1 Col) */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>آخر عمليات المسح</span>
            </h2>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              السجل كامل
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[340px] flex-1">
            {scanLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                لا توجد عمليات مسح مسجلة بعد.
              </div>
            ) : (
              scanLogs.slice(0, 8).map((log) => {
                const isAccepted = log.result === 'ACCEPTED';
                const isUsed = log.result === 'ALREADY_USED';

                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isAccepted
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                        : isUsed
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>
                          {log.guest_name
                            ? log.guest_name
                            : log.invitation_number
                            ? `دعوة #${String(log.invitation_number).padStart(3, '0')}`
                            : 'رمز غير معروف'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.scanned_at).toLocaleTimeString('ar-SA')}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        isAccepted
                          ? 'bg-emerald-500 text-slate-950'
                          : isUsed
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {log.result}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
