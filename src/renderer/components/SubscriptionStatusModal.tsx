import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  MessageCircle, 
  LogOut, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { TenantSubscription, SubscriptionStatus, BillingCycle } from '../../types';
import { api } from '../utils/apiBridge';

interface SubscriptionStatusModalProps {
  companyName: string;
  subscription?: TenantSubscription | null;
  status?: SubscriptionStatus | null;
  message?: string;
  onRefresh?: () => void;
  onLogout: () => void;
}

export const SubscriptionStatusModal: React.FC<SubscriptionStatusModalProps> = ({
  companyName,
  subscription,
  status = 'expired',
  message,
  onRefresh,
  onLogout,
}) => {
  const [checking, setChecking] = useState(false);

  const subStatus: SubscriptionStatus = subscription?.status || status || 'expired';
  const isPaymentRequired = subStatus === 'expired' || subStatus === 'past_due' || subStatus === 'suspended' || subStatus === 'cancelled';

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

  const getStatusBadge = (st: SubscriptionStatus) => {
    switch (st) {
      case 'active':
        return {
          label: 'نشط (ساري الصلاحية)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
        };
      case 'trial':
        return {
          label: 'فترة تجريبية (Trial)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Clock,
        };
      case 'past_due':
        return {
          label: 'متأخر في السداد (Past Due)',
          color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: AlertTriangle,
        };
      case 'suspended':
        return {
          label: 'معلّق مؤقتاً (Suspended)',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert,
        };
      case 'cancelled':
        return {
          label: 'ملغي (Cancelled)',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          icon: AlertCircle,
        };
      case 'expired':
      default:
        return {
          label: 'منتهي الصلاحية (Expired)',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertCircle,
        };
    }
  };

  const badge = getStatusBadge(subStatus);
  const StatusIcon = badge.icon;

  const handleSupportContact = async () => {
    const messageText = encodeURIComponent(
      `السلام عليكم، أود تجديد وتفعيل اشتراك منصة الدعوات الذكية للشركة: (${companyName})`
    );
    const whatsappUrl = `https://wa.me/967780791584?text=${messageText}`;
    await api.openExternalUrl(whatsappUrl);
  };

  const handleManualRefresh = async () => {
    setChecking(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <div 
      dir="rtl"
      className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden font-arabic selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 space-y-6">
        
        {/* Top Header & Alert Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-xl shadow-amber-500/20 mx-auto">
            <Building2 className="w-8 h-8 text-slate-950 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">
              {companyName || 'منظومة إدارة الدعوات الذكية'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              لوحة فحص ومعلومات اشتراك المنظومة السحابية (SaaS)
            </p>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isPaymentRequired ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border border-rose-500/30 text-rose-200 flex items-start gap-3.5 shadow-lg shadow-rose-950/20">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-100">
                اشتراكك يحتاج إلى تجديد
              </h3>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {message || 'انتهت فترة الاشتراك المحددة لهذه المؤسسة. تم إيقاف الوصول للنظام مؤقتاً مع الحفاظ الكامل على كافة بيانات المناسبات والمدعوين.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 text-emerald-200 flex items-start gap-3.5 shadow-lg shadow-emerald-950/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-100">
                الاشتراك نشط وساري المفعول
              </h3>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                يمكنك الدخول واستخدام كافة ميزات المنظومة وإنشاء المناسبات وطباعة الدعوات.
              </p>
            </div>
          </div>
        )}

        {/* Detailed Subscription Specs Grid */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 md:p-5 space-y-3.5 text-xs">
          
          {/* Company */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>الشركة / المؤسسة:</span>
            </span>
            <span className="font-bold text-white text-sm">{companyName}</span>
          </div>

          {/* Plan Name */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>نوع الباقة (Plan):</span>
            </span>
            <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
              {subscription?.plan_name || 'Professional'}
            </span>
          </div>

          {/* Billing Cycle */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>دورة الفوترة:</span>
            </span>
            <span className="font-semibold text-slate-200">
              {subscription?.billing_cycle === 'monthly' ? 'شهري (Monthly)' : 'سنوي (Yearly)'}
            </span>
          </div>

          {/* Subscription Status */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <StatusIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>حالة الاشتراك:</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badge.color}`}>
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{badge.label}</span>
            </span>
          </div>

          {/* Start Date */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ البدء:</span>
            </span>
            <span className="font-mono text-slate-300">
              {formatDateArabic(subscription?.start_date)}
            </span>
          </div>

          {/* Renewal Date */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ التجديد:</span>
            </span>
            <span className="font-mono text-slate-300">
              {formatDateArabic(subscription?.renewal_date)}
            </span>
          </div>

          {/* Expiration Date */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>تاريخ الانتهاء:</span>
            </span>
            <span className="font-mono font-bold text-rose-300">
              {formatDateArabic(subscription?.expiration_date)}
            </span>
          </div>

        </div>

        {/* Non-destructive guarantee notice */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <b>ضمان أمان البيانات:</b> كافة المناسبات، الدعوات، وسجلات الحضور محفوظة ومحمية تماماً، وتتاح فور تجديد الاشتراك دون الحاجة لإعادة تثبيت البرنامج.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          
          {/* Support WhatsApp Contact Button */}
          <button
            onClick={handleSupportContact}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>التواصل مع الدعم الفني للتجديد [واتساب]</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Refresh & Logout row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={checking}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-amber-400' : ''}`} />
              <span>{checking ? 'جاري التحقق...' : 'إعادة فحص حالة الاشتراك'}</span>
            </button>

            <button
              onClick={onLogout}
              className="py-3 px-5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <p className="mt-6 text-xs text-slate-500 text-center">
        منظومة إدارة الدعوات الذكية — بوابة العميل © 2026
      </p>

    </div>
  );
};
