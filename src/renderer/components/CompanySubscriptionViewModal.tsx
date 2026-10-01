import React from 'react';
import { 
  Building2, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  X, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { TenantSubscription, SubscriptionStatus } from '../../types';
import { api } from '../utils/apiBridge';

interface CompanySubscriptionViewModalProps {
  companyName: string;
  subscription: TenantSubscription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySubscriptionViewModal: React.FC<CompanySubscriptionViewModalProps> = ({
  companyName,
  subscription,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDateArabic = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString.split('T')[0] || '—';
    }
  };

  const status: SubscriptionStatus = subscription?.status || 'active';

  const handleContactSupport = async () => {
    const text = encodeURIComponent(`السلام عليكم، استفسار بشأن اشتراك شركة (${companyName}) في منصة إدارة الدعوات الذكية.`);
    await api.openExternalUrl(`https://wa.me/967780791584?text=${text}`);
  };

  return (
    <div 
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in font-arabic"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-white">تفاصيل اشتراك المنظومة</h3>
              <p className="text-[11px] text-slate-400">معلومات الخطة والترخيص المخصصة لشركتك</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Subscription Info Card (Read-only) */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 text-xs">
          
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>اسم الشركة:</span>
            </span>
            <span className="font-bold text-white">{companyName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الخطة الحالية (Plan):</span>
            </span>
            <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
              {subscription?.plan_name || 'Professional'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>دورة الفوترة:</span>
            </span>
            <span className="font-semibold text-slate-200">
              {subscription?.billing_cycle === 'monthly' ? 'شهري (Monthly)' : 'سنوي (Yearly)'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>حالة الاشتراك:</span>
            </span>
            {status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" /> نشط وساري
              </span>
            ) : status === 'trial' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Clock className="w-3.5 h-3.5" /> فترة تجريبية
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <AlertCircle className="w-3.5 h-3.5" /> يحتاج تجديد
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ بدء الاشتراك:</span>
            </span>
            <span className="font-mono text-slate-300">
              {formatDateArabic(subscription?.start_date)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>تاريخ التجديد القادم:</span>
            </span>
            <span className="font-mono font-bold text-amber-300">
              {formatDateArabic(subscription?.renewal_date || subscription?.expiration_date)}
            </span>
          </div>

        </div>

        {/* Read-only notice */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            يتم إدارة خطط الأسعار والترقية والتمديد عبر مسؤول النظام العام.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleContactSupport}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب ترقية أو تجديد الخطة</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
