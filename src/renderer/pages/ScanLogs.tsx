import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Download,
  Calendar
} from 'lucide-react';
import { Event, ScanLog, ScanResultType } from '../../types';

interface ScanLogsProps {
  activeEvent: Event | null;
  scanLogs: ScanLog[];
  onRefresh: () => void;
}

export const ScanLogsPage: React.FC<ScanLogsProps> = ({ activeEvent, scanLogs, onRefresh }) => {
  const [filterResult, setFilterResult] = useState<'ALL' | ScanResultType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لعرض سجلات المسح.
      </div>
    );
  }

  const filteredLogs = scanLogs.filter((log) => {
    const matchesResult = filterResult === 'ALL' || log.result === filterResult;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (log.guest_name && log.guest_name.toLowerCase().includes(term)) ||
      (log.invitation_number && String(log.invitation_number).includes(term)) ||
      (log.notes && log.notes.toLowerCase().includes(term));

    return matchesResult && matchesSearch;
  });

  const exportLogsAsCsv = () => {
    if (scanLogs.length === 0) return;
    const headers = ['المعرف', 'رقم الدعوة', 'اسم المدعو', 'النتيجة', 'الوقت', 'الجهاز', 'ملاحظات'];
    const rows = scanLogs.map((l) => [
      l.id,
      l.invitation_number ? `#${l.invitation_number}` : '-',
      l.guest_name || 'بدون اسم',
      l.result,
      new Date(l.scanned_at).toLocaleString('ar-SA'),
      l.device_name || '',
      l.notes || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_logs_${activeEvent.name}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>سجل عمليات المسح وتدقيق الدخول</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل تاريخي كامل لكافة محاولات الدخول المقبولة والمرفوضة بالتوقيت الدقيق
          </p>
        </div>

        <button
          onClick={exportLogsAsCsv}
          disabled={scanLogs.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تصدير السجل كملف Excel (CSV)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الدعوة أو الملاحظة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setFilterResult('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterResult === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({scanLogs.length})
          </button>
          <button
            onClick={() => setFilterResult('ACCEPTED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterResult === 'ACCEPTED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مقبول ({scanLogs.filter((l) => l.result === 'ACCEPTED').length})
          </button>
          <button
            onClick={() => setFilterResult('ALREADY_USED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterResult === 'ALREADY_USED' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مكرر ({scanLogs.filter((l) => l.result === 'ALREADY_USED').length})
          </button>
          <button
            onClick={() => setFilterResult('INVALID')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterResult === 'INVALID' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            غير صالح ({scanLogs.filter((l) => l.result === 'INVALID').length})
          </button>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">النتيجة</th>
                <th className="py-3 px-4">رقم الدعوة</th>
                <th className="py-3 px-4">اسم المدعو</th>
                <th className="py-3 px-4">توقيت المسح</th>
                <th className="py-3 px-4">جهاز المسح</th>
                <th className="py-3 px-4">تفاصيل / ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    لا توجد سجلات مسح تطابق الفلتر.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isAccepted = log.result === 'ACCEPTED';
                  const isUsed = log.result === 'ALREADY_USED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isAccepted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isUsed
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isAccepted ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : isUsed ? (
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-amber-400" />
                          )}
                          {log.result}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {log.invitation_number ? `#${String(log.invitation_number).padStart(3, '0')}` : '—'}
                      </td>

                      <td className="py-3 px-4 font-medium">
                        {log.guest_name ? (
                          <span className="text-white">{log.guest_name}</span>
                        ) : log.invitation_number ? (
                          <span className="text-slate-500">غير محدد (بدون اسم)</span>
                        ) : (
                          <span className="text-rose-400 italic">غير معروف</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(log.scanned_at).toLocaleString('ar-SA')}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {log.device_name || 'البوابة الرئيسية'}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
