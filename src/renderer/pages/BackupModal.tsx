import React, { useState } from 'react';
import { X, DatabaseBackup, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/apiBridge';

interface BackupModalProps {
  onClose: () => void;
  onRefreshAll: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose, onRefreshAll }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.backupDatabase();
      if (res.success) {
        setStatusMsg({ type: 'success', text: `تم حفظ النسخة الاحتياطية بنجاح في: ${res.filePath}` });
      } else if (res.error && res.error !== 'تم إلغاء عملية الحفظ') {
        setStatusMsg({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل النسخ الاحتياطي' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('تنبيه هام جداً:\nاستعادة نسخة احتياطية سيقوم باستبدال البيانات الحالية بالكامل بالبيانات المستعادة.\n\nهل ترغب بالاستمرار؟')) {
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.restoreDatabase();
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'تمت استعادة قاعدة البيانات بنجاح! يتم الآن تحديث البيانات.' });
        onRefreshAll();
      } else if (res.error && res.error !== 'تم إلغاء الاستعادة') {
        setStatusMsg({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل استعادة النسخة الاحتياطية' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DatabaseBackup className="w-5 h-5 text-amber-400" />
              <span>النسخ الاحتياطي والأمان المحلي</span>
            </h2>
            <p className="text-xs text-slate-400">حفظ أو استعادة بيانات المناسبات والدعوات وسجلات المسح</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4">
          
          {statusMsg && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Backup Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-white">أخذ نسخة احتياطية فورية</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يقوم بحفظ ملف قاعدة البيانات كاملاً بصيغة SQLite (.db) متضمناً جميع المناسبات والدعوات والرموز المشفرة وتوقيتات الدخول.
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'جاري المعالجة...' : 'تصدير نسخة احتياطية الآن'}</span>
            </button>
          </div>

          {/* Restore Section */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Upload className="w-4 h-4" />
              <h3 className="font-bold text-xs text-rose-300">استعادة نسخة سابقة</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اختر ملف نسخة احتياطية (.db) تم حفظه مسبقاً لاستعادة البيانات.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>تحذير: الاستعادة ستستبدل قاعدة البيانات الحالية.</span>
            </div>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'جاري الاستعادة...' : 'استعادة قاعدة بيانات من ملف'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
