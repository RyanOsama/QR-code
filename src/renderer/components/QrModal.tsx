import React, { useEffect, useState } from 'react';
import { X, Download, Printer, Copy, Check, ShieldCheck, User } from 'lucide-react';
import { Invitation, Event } from '../../types';
import { api } from '../utils/apiBridge';

interface QrModalProps {
  invitation: Invitation | null;
  event: Event | null;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ invitation, event, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (invitation) {
      api.generateQrDataUrl(invitation.token).then(setQrUrl);
    }
  }, [invitation]);

  if (!invitation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(invitation.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    const targetName = invitation.graduate_name || invitation.guest_name;
    const safeEvent = (event?.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeTarget = targetName ? targetName.replace(/[\\/:*?"<>|]/g, '_').trim() : 'عامة';
    a.download = `${safeEvent} - ${safeTarget} - كرت #${invitation.invitation_number}.png`;
    a.click();
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    const targetName = invitation.graduate_name || invitation.guest_name;
    const safeEvent = (event?.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeTarget = targetName ? targetName.replace(/[\\/:*?"<>|]/g, '_').trim() : 'عامة';
    document.title = `${safeEvent} - ${safeTarget}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            بطاقة دعوة رسمية
          </span>
          <h2 className="text-xl font-bold text-white">{event?.name || 'المناسبة'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">الدعوة رقم #{String(invitation.invitation_number).padStart(3, '0')}</p>
        </div>

        {/* Card Mockup */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden mb-6">
          <div className="text-amber-300/90 text-sm font-semibold mb-2">مرحبًا بكم</div>
          
          {invitation.guest_name ? (
            <div className="flex items-center justify-center gap-2 text-slate-100 font-bold text-base mb-3">
              <User className="w-4 h-4 text-amber-400" />
              <span>{invitation.guest_name}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mb-3">ضيف غير محدد</div>
          )}

          {/* QR Image */}
          <div className="inline-block p-3 bg-white rounded-xl shadow-lg shadow-black/40">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">جاري التحميل...</div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              invitation.status === 'USED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {invitation.status === 'USED' ? 'مستخدمة' : 'صالحة للدخول (غير مستخدمة)'}
            </span>
          </div>
        </div>

        {/* Token info */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between mb-5">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">رمز الأمان (Token)</span>
            <code className="text-xs font-mono text-amber-400 select-all">{invitation.token}</code>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>حفظ كصورة</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة البطاقة</span>
          </button>
        </div>

      </div>
    </div>
  );
};
