import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Cpu,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Server,
} from 'lucide-react';
import { api } from '../utils/apiBridge';
import { copyToClipboard } from '../utils/clipboard';

interface ActivationModalProps {
  onActivated: (companyName?: string) => void;
  initialError?: string;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ onActivated, initialError }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [deviceName, setDeviceName] = useState('جهاز الإدارة الرئيسي');
  const [deviceId, setDeviceId] = useState('DEV-LOADING...');
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    async function fetchDeviceId() {
      try {
        const id = await api.getDeviceId();
        setDeviceId(id);
      } catch (_) {
        setDeviceId('DEV-DEFAULT-1');
      }
    }
    fetchDeviceId();
  }, []);

  const handleCopyDeviceId = async () => {
    const ok = await copyToClipboard(deviceId);
    if (ok) {
      setCopiedDeviceId(true);
      setTimeout(() => setCopiedDeviceId(false), 2500);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanKey = licenseKey.trim();
    if (!cleanKey) {
      setError('يرجى إدخال مفتاح الترخيص المخصص');
      return;
    }

    setLoading(true);
    try {
      const res = await api.activateDedicatedLicense({
        licenseKey: cleanKey,
        deviceName: deviceName.trim(),
      });

      if (res.success) {
        onActivated(res.companyName);
      } else {
        setError(res.error || 'فشل تفعيل الترخيص. يرجى التحقق من المفتاح وصحة البيانات.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء عملية تفعيل الترخيص');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-arabic selection:bg-amber-500 selection:text-slate-950">
      {/* Dynamic Background Lighting */}
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Activation Card */}
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-xl shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300">
            <ShieldCheck className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>نسخة الشراء الدائم والتثبيت المستقل (Dedicated)</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              تفعيل ترخيص البرنامج
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              يرجى إدخال مفتاح ترخيص الشراء الدائم الممنوح لشركتكم لبدء التثبيت
            </p>
          </div>
        </div>

        {/* Device Identifier Badge */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold">بصمة ومعرّف هذا الجهاز (Device Fingerprint)</div>
              <div className="text-xs font-mono font-bold text-slate-200 tracking-wider" dir="ltr">{deviceId}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyDeviceId}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {copiedDeviceId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>نسخ المعرّف</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          
          {/* License Key */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-end gap-1.5">
              <span>مفتاح الترخيص الدائم (License Key)</span>
              <Key className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="PERPETUAL-XXXX-XXXX-XXXX-XXXX"
              dir="ltr"
              required
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-slate-600 outline-none transition-all duration-200 uppercase"
            />
          </div>

          {/* Device Label */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-end gap-1.5">
              <span>اسم وتسمية هذا الجهاز</span>
              <Server className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="مثال: جهاز استقبال 1 - اللابتوب الرئيسي"
              dir="auto"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.99] cursor-pointer disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>تفعيل الترخيص والمتابعة</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Support */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-between text-xs text-slate-400">
          <span>بحاجة إلى مساعدة في التفعيل؟</span>
          <a
            href="https://wa.me/967780791584"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:text-amber-200 font-bold"
          >
            تواصل مع الدعم الفني
          </a>
        </div>

      </div>
    </div>
  );
};
