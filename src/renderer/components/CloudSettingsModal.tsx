import React, { useState, useEffect } from 'react';
import { X, Cloud, Server, Wifi, WifiOff, CheckCircle2, AlertTriangle, RefreshCw, Laptop, ShieldCheck, ExternalLink, Upload } from 'lucide-react';
import { api } from '../utils/apiBridge';
import { CloudConfig } from '../../types';

interface CloudSettingsModalProps {
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({ onClose, onConfigUpdated }) => {
  const [config, setConfig] = useState<CloudConfig>({
    mode: 'local',
    supabaseUrl: '',
    supabaseAnonKey: '',
    deviceName: 'بوابة 1',
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await api.getCloudConfig();
      if (cfg) {
        setConfig(cfg);
      }
    } catch (err) {
      console.error('Failed to load cloud config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      setTestResult({
        success: false,
        message: 'يرجى إدخال رابط المشروع (Project URL) ومفتاح API (Anon Key) أولاً.',
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testCloudConnection(config.supabaseUrl, config.supabaseAnonKey);
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'تم الاتصال بنجاح' : 'تعذر الاتصال'),
        latencyMs: res.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'فشل الاتصال بالسيرفر',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.saveCloudConfig(config);
      if (res.success) {
        setSaveSuccess(true);
        onConfigUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الإعدادات: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (config.mode !== 'cloud' || !config.supabaseUrl || !config.supabaseAnonKey) {
      alert('يجب تفعيل الوضع السحابي والتأكد من إدخال الرابط والمفتاح أولاً!');
      return;
    }

    if (!confirm('سيتم رفع ومزامنة جميع المناسبات والدعوات الموجودة على هذا الجهاز إلى السيرفر السحابي.\n\nهل ترغب بالمتابعة؟')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncLocalToCloud();
      if (res.success) {
        setSyncResult({
          success: true,
          message: `تم رفع البيانات بنجاح: تم مزامنة (${res.eventsSynced}) مناسبة و (${res.invitationsSynced}) دعوة!`,
        });
        onConfigUpdated();
      } else {
        setSyncResult({
          success: false,
          message: `فشلت المزامنة: ${res.error || 'تأكد من تطبيق كود SQL في Supabase أولاً'}`,
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `خطأ أثناء المزامنة: ${err.message || ''}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                إعدادات الربط السحابي (Supabase)
              </h2>
              <p className="text-xs text-slate-400">
                مزامنة قراءة الباركود لحظياً عبر أجهزة متعددة لمنع الدخول المكرر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 pl-1 custom-scrollbar text-sm">
          
          {/* Mode Selector */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <label className="block font-bold text-white mb-2">وضع تشغيل قاعدة البيانات:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'cloud' })}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-right ${
                  config.mode === 'cloud'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold shadow-md shadow-amber-500/10'
                    : 'border-slate-700/80 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.mode === 'cloud' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-bold">وضع سحابي مشترك (موصى به)</div>
                  <div className="text-xs opacity-75">ربط فوري لأكثر من جهاز وقفل ذري للباركود</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'local' })}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-right ${
                  config.mode === 'local'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold shadow-md'
                    : 'border-slate-700/80 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.mode === 'local' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-bold">وضع محلي (أوفلاين)</div>
                  <div className="text-xs opacity-75">قاعدة بيانات SQLite محلية لجهاز واحد فقط</div>
                </div>
              </button>
            </div>
          </div>

          {/* Device Name Field */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-amber-400" />
              اسم هذا الجهاز / البوابة:
            </label>
            <input
              type="text"
              value={config.deviceName}
              onChange={(e) => setConfig({ ...config, deviceName: e.target.value })}
              placeholder="مثال: بوابة 1 - قاعة الرجال الرئيسية"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1">
              سيظهر هذا الاسم في سجل المسح الفوري لتعرف من أي جهاز أو بوابة تم قبول الدخول.
            </p>
          </div>

          {/* Supabase Connection Credentials */}
          {config.mode === 'cloud' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  بيانات اتصال Supabase:
                </span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  PostgreSQL مشفرة وآمنة
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط المشروع (Project URL):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مفتاح الوصول العام (Project API Key / anon):
                </label>
                <textarea
                  dir="ltr"
                  rows={2}
                  value={config.supabaseAnonKey}
                  onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !config.supabaseUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {testingConnection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  فحص سرعة الاتصال بالسيرفر
                </button>

                <button
                  type="button"
                  onClick={handleSyncLocalToCloud}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {syncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  رفع البيانات الحالية للسيرفر (Sync)
                </button>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <span className="font-mono text-[11px] font-bold bg-black/40 px-2 py-0.5 rounded border border-current">
                      ⚡ {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              {/* Sync Result Feedback */}
              {syncResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    syncResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}

              {/* Helpful instructions note */}
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold">📌 معلومة هامة:</span>
                <p className="mt-1">
                  تم إنشاء ملف <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-400 font-mono">supabase_schema.sql</code> داخل مجلد المشروع. يمكنك نسخ محتواه ولصقه في <strong className="text-white">SQL Editor</strong> في لوحة تحكم Supabase والضغط على Run لإنشاء الجداول والدالة الذرية في ثوانٍ معدودة.
                </p>
              </div>
            </div>
          )}

          {/* Success Save Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تم حفظ إعدادات الربط بنجاح! يتم الآن تفعيل الإعدادات...
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            حفظ وتفعيل
          </button>
        </div>

      </div>
    </div>
  );
};
