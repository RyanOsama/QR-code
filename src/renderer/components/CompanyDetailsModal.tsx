import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  User, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Activity, 
  Users, 
  PartyPopper
} from 'lucide-react';
import { Company, LicenseAuditLog } from '../../types';
import { api } from '../utils/apiBridge';

interface CompanyDetailsModalProps {
  company: Company | null;
  onClose: () => void;
  onOpenManageSub?: (company: Company) => void;
  onToggleSuspend?: (company: Company) => void;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  company,
  onClose,
  onOpenManageSub,
  onToggleSuspend,
}) => {
  const [auditLogs, setAuditLogs] = useState<LicenseAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!company) return;

    let isMounted = true;
    const loadAuditLogs = async () => {
      try {
        setLoadingLogs(true);
        const logs = await api.getCompanyAuditLogs({ companyName: company.name, limit: 20 });
        if (isMounted) {
          setAuditLogs(logs || []);
        }
      } catch (err) {
        console.error('Error fetching company audit logs:', err);
      } finally {
        if (isMounted) {
          setLoadingLogs(false);
        }
      }
    };

    loadAuditLogs();
    return () => {
      isMounted = false;
    };
  }, [company]);

  if (!company) return null;

  const sub = company.subscription;
  const isSubExpired = sub?.status === 'expired' || (sub?.expiration_date && new Date(sub.expiration_date).getTime() < Date.now());

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'COMPANY_CREATED':
        return { label: 'إنشاء الشركة', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'COMPANY_ACTIVATED':
      case 'COMPANY_REACTIVATED':
        return { label: 'تفعيل الشركة', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'COMPANY_SUSPENDED':
        return { label: 'تعليق الشركة', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
      case 'SUBSCRIPTION_CREATED':
        return { label: 'إنشاء اشتراك', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
      case 'SUBSCRIPTION_UPDATED':
        return { label: 'تحديث اشتراك', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
      case 'SUBSCRIPTION_SUSPENDED':
        return { label: 'تعليق اشتراك', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
      case 'SUBSCRIPTION_REACTIVATED':
        return { label: 'إعادة تفعيل اشتراك', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'SUBSCRIPTION_CANCELLED':
        return { label: 'إلغاء اشتراك', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
      case 'SUBSCRIPTION_RENEWED':
        return { label: 'تجديد اشتراك', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'SUBSCRIPTION_EXTENDED':
        return { label: 'تمديد اشتراك', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: action, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-arabic">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold overflow-hidden shadow-inner">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{company.name}</h3>
                <span className="text-xs font-mono text-slate-500">#{company.id}</span>
                {company.status === 'SUSPENDED' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    <Ban className="w-3 h-3" /> موقوفة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" /> نشطة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تاريخ التسجيل: {formatDate(company.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSuspend && (
              <button
                onClick={() => onToggleSuspend(company)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  company.status === 'SUSPENDED'
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {company.status === 'SUSPENDED' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تفعيل الشركة</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>تعليق الشركة</span>
                  </>
                )}
              </button>
            )}

            {onOpenManageSub && (
              <button
                onClick={() => onOpenManageSub(company)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إدارة الاشتراك</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">الموظفون المسجلون</p>
                <p className="text-base font-bold text-white mt-0.5">{company.employees_count || 0} موظف</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">إجمالي المناسبات</p>
                <p className="text-base font-bold text-white mt-0.5">{company.events_count || 0} مناسبة</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">نوع الباقة والنظام</p>
                <p className="text-base font-bold text-amber-300 mt-0.5">SaaS Professional</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Owner / Admin Information */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-amber-400" />
                <span>بيانات مالك الحساب / المدير</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">الاسم الكامل:</span>
                  <span className="font-bold text-slate-200">{company.owner_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">اسم المستخدم:</span>
                  <span className="font-mono font-bold text-amber-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {company.owner_username || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">الدور والصلاحيات:</span>
                  <span className="text-slate-300 font-medium">COMPANY_OWNER (مدير الشركة)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حالة إعداد كلمة المرور:</span>
                  {company.temp_password ? (
                    <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      <span>في انتظار تغيير كلمة المرور عند أول دخول</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>مكتمل ومؤمن</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Specifications */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>تفاصيل الاشتراك والفوترة</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حالة الاشتراك:</span>
                  {sub?.status === 'suspended' ? (
                    <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">معلّق</span>
                  ) : sub?.status === 'cancelled' ? (
                    <span className="text-slate-400 font-bold bg-slate-500/10 border border-slate-500/30 px-2 py-0.5 rounded">ملغي</span>
                  ) : sub?.status === 'past_due' ? (
                    <span className="text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded">متأخر في السداد</span>
                  ) : sub?.status === 'trial' ? (
                    <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">فترة تجريبية</span>
                  ) : isSubExpired ? (
                    <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">منتهي الصلاحية</span>
                  ) : (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">نشط ومفعل</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">دورة الفوترة:</span>
                  <span className="font-bold text-amber-300">
                    {sub?.billing_cycle === 'monthly' ? 'شهري (Monthly)' : 'سنوي (Yearly)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">تاريخ بدء الاشتراك:</span>
                  <span className="text-slate-300">{formatDate(sub?.start_date)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">تاريخ التجديد القادم:</span>
                  <span className="text-slate-300">{formatDate(sub?.renewal_date)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">تاريخ انتهاء الصلاحية:</span>
                  <span className={`font-mono ${isSubExpired ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                    {formatDate(sub?.expiration_date)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Audit & Activity Trail */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>سجل النشاطات والأحداث الإدارية (Audit Trail)</span>
              </div>
              <span className="text-xs text-slate-500">{auditLogs.length} عملية مسجلة</span>
            </div>

            {loadingLogs ? (
              <div className="py-8 text-center text-xs text-slate-400">
                جاري تحميل سجل الأحداث...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                لا توجد سجلات أحداث مسبقة لهذه الشركة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/60">
                      <th className="pb-2 font-semibold">الحدث</th>
                      <th className="pb-2 font-semibold">التفاصيل</th>
                      <th className="pb-2 font-semibold">المنفذ</th>
                      <th className="pb-2 font-semibold">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {auditLogs.map((log) => {
                      const badge = getActionBadge(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 pl-2">
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-300 max-w-xs truncate" title={log.details || ''}>
                            {log.details || '—'}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-400">
                            {log.actor || 'SUPER_ADMIN'}
                          </td>
                          <td className="py-2.5 pr-2 font-mono text-slate-400 whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
