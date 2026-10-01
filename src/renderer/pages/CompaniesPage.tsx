import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Trash2, 
  RefreshCw, 
  X, 
  AlertTriangle,
  Upload,
  User,
  Users,
  Calendar,
  Sparkles,
  LogOut,
  Ban,
  PlayCircle,
  CreditCard,
  Clock,
  ArrowRight,
  Sliders,
  CheckCircle2,
  CalendarDays,
  Eye,
  Filter,
  Layers,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { Company, TenantSubscription, SubscriptionStatus, BillingCycle } from '../../types';
import { api } from '../utils/apiBridge';
import { copyToClipboard } from '../utils/clipboard';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal';

interface CompaniesPageProps {
  onLogout?: () => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ onLogout }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ALL');
  const [subStatusFilter, setSubStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<Company | null>(null);

  // Form State for Adding Company
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Success Created Modal
  const [newCompanyCredentials, setNewCompanyCredentials] = useState<{
    companyName: string;
    ownerName: string;
    username: string;
    tempPassword: string;
    billingCycle?: string;
  } | null>(null);

  // Manage Subscription Modal State
  const [selectedCompanyForSub, setSelectedCompanyForSub] = useState<Company | null>(null);
  const [subEditStatus, setSubEditStatus] = useState<SubscriptionStatus>('active');
  const [subEditCycle, setSubEditCycle] = useState<BillingCycle>('yearly');
  const [subEditStartDate, setSubEditStartDate] = useState('');
  const [subEditRenewalDate, setSubEditRenewalDate] = useState('');
  const [subEditExpirationDate, setSubEditExpirationDate] = useState('');
  const [updatingSub, setUpdatingSub] = useState(false);

  // Automatically update default expiration date when billing cycle changes in add modal
  useEffect(() => {
    const start = new Date(startDate || Date.now());
    const exp = new Date(start);
    if (billingCycle === 'monthly') {
      exp.setMonth(exp.getMonth() + 1);
    } else {
      exp.setFullYear(exp.getFullYear() + 1);
    }
    setExpirationDate(exp.toISOString().split('T')[0]);
  }, [billingCycle, startDate]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCopy = async (text: string, id: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanOwnerName = ownerName.trim();
    const cleanUsername = ownerUsername.trim();

    if (!cleanName || !cleanOwnerName || !cleanUsername) {
      setFormError('يرجى تعبئة جميع الحقول الأساسية المطلوبة');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createCompany({
        name: cleanName,
        logo_url: logoUrl || undefined,
        owner_name: cleanOwnerName,
        owner_username: cleanUsername,
        billing_cycle: billingCycle,
        start_date: new Date(startDate).toISOString(),
        expiration_date: new Date(expirationDate).toISOString(),
      });

      if (res.success && res.tempPassword) {
        setIsAddModalOpen(false);
        setName('');
        setOwnerName('');
        setOwnerUsername('');
        setLogoUrl('');
        setNewCompanyCredentials({
          companyName: cleanName,
          ownerName: cleanOwnerName,
          username: cleanUsername,
          tempPassword: res.tempPassword,
          billingCycle: billingCycle === 'monthly' ? 'شهري' : 'سنوي',
        });
        fetchCompanies();
      } else {
        setFormError(res.error || 'تعذر إنشاء الشركة');
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الشركة');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCompany = async (id: number, compName: string) => {
    if (!confirm(`هل أنت متأكد من حذف شركة "${compName}" بالكامل؟ سيتم حذف كافة مناسباتها ومستخدميها!`)) {
      return;
    }
    try {
      const res = await api.deleteCompany(id);
      if (res.success) {
        fetchCompanies();
      } else {
        alert(res.error || 'تعذر حذف الشركة');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (companyId: number, ownerName: string) => {
    if (!confirm(`إعادة تعيين كلمة المرور لحساب المالك (${ownerName}) وتوليد رقم سري مؤقت جديد؟`)) {
      return;
    }
    try {
      const res = await api.resetCompanyOwnerPassword(companyId);
      if (res.success && res.tempPassword) {
        alert(`تم بنجاح توليد كلمة مرور مؤقتة جديدة:\n\n${res.tempPassword}\n\nيرجى تسليمها لمالك الشركة لتسجيل الدخول.`);
        fetchCompanies();
      } else {
        alert(res.error || 'فشلت إعادة التعيين');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleSuspend = async (comp: Company) => {
    const isSuspended = comp.status === 'SUSPENDED';
    const actionText = isSuspended ? 'تفعيل' : 'إيقاف';
    const confirmMsg = isSuspended
      ? `هل ترغب في إعادة تفعيل شركة "${comp.name}"؟\nسيتمكن المالك والموظفون من الدخول للنظام وتطبيق المسح مجدداً.`
      : `هل أنت متأكد من إيقاف شركة "${comp.name}"؟\n\nعند إيقاف الشركة، لن يتمكن المالك أو أي من الموظفين من تسجيل الدخول للنظام أو لتطبيق الجوال وستظهر لهم رسالة: "يرجى التواصل مع الإدارة".`;

    if (!confirm(confirmMsg)) return;

    try {
      const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
      const res = await api.updateCompany(comp.id, { status: newStatus });
      if (res.success) {
        fetchCompanies();
      } else {
        alert(res.error || `تعذر ${actionText} الشركة`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Manage Subscription Modal
  const handleOpenManageSub = (comp: Company) => {
    setSelectedCompanyForSub(comp);
    const sub = comp.subscription;
    setSubEditStatus(sub?.status || 'active');
    setSubEditCycle(sub?.billing_cycle || 'yearly');
    setSubEditStartDate(sub?.start_date ? sub.start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setSubEditRenewalDate(sub?.renewal_date ? sub.renewal_date.split('T')[0] : '');
    setSubEditExpirationDate(sub?.expiration_date ? sub.expiration_date.split('T')[0] : '');
  };

  // Save manual subscription changes
  const handleSaveSubChanges = async () => {
    if (!selectedCompanyForSub) return;
    setUpdatingSub(true);
    try {
      const payload: Partial<TenantSubscription> = {
        status: subEditStatus,
        billing_cycle: subEditCycle,
        start_date: subEditStartDate ? new Date(subEditStartDate).toISOString() : undefined,
        renewal_date: subEditRenewalDate ? new Date(subEditRenewalDate).toISOString() : undefined,
        expiration_date: subEditExpirationDate ? new Date(subEditExpirationDate).toISOString() : undefined,
      };

      const res = await api.updateTenantSubscription(selectedCompanyForSub.id, payload);
      if (res.success) {
        setSelectedCompanyForSub(null);
        fetchCompanies();
      } else {
        alert(res.error || 'تعذر تحديث الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في تحديث الاشتراك');
    } finally {
      setUpdatingSub(false);
    }
  };

  // Quick Action: Renew Subscription (1 Month / 12 Months)
  const handleQuickRenew = async (months: number, cycle: BillingCycle) => {
    if (!selectedCompanyForSub) return;
    setUpdatingSub(true);
    try {
      const res = await api.renewTenantSubscription(selectedCompanyForSub.id, months, cycle);
      if (res.success) {
        setSelectedCompanyForSub(null);
        fetchCompanies();
      } else {
        alert(res.error || 'فشل تجديد الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء التجديد');
    } finally {
      setUpdatingSub(false);
    }
  };

  // Quick Action: Extend Subscription (+Months)
  const handleQuickExtend = async (months: number) => {
    if (!selectedCompanyForSub) return;
    setUpdatingSub(true);
    try {
      const res = await api.extendTenantSubscription(selectedCompanyForSub.id, months);
      if (res.success) {
        setSelectedCompanyForSub(null);
        fetchCompanies();
      } else {
        alert(res.error || 'فشل تمديد الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء التمديد');
    } finally {
      setUpdatingSub(false);
    }
  };

  // Quick Action: Change Status
  const handleQuickSetStatus = async (status: SubscriptionStatus) => {
    if (!selectedCompanyForSub) return;
    setUpdatingSub(true);
    try {
      const res = await api.updateTenantSubscription(selectedCompanyForSub.id, { status });
      if (res.success) {
        setSelectedCompanyForSub(null);
        fetchCompanies();
      } else {
        alert(res.error || 'تعذر تغيير حالة الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في تحديث الحالة');
    } finally {
      setUpdatingSub(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(term)) ||
      (c.owner_username && c.owner_username.toLowerCase().includes(term)) ||
      String(c.id).includes(term);

    const matchesCompanyStatus =
      companyStatusFilter === 'ALL' ||
      c.status === companyStatusFilter;

    const sub = c.subscription;
    const isSubExpired = sub?.status === 'expired' || (sub?.expiration_date && new Date(sub.expiration_date).getTime() < Date.now());
    const effectiveSubStatus = isSubExpired ? 'EXPIRED' : (sub?.status || 'ACTIVE').toUpperCase();

    const matchesSubStatus =
      subStatusFilter === 'ALL' ||
      effectiveSubStatus === subStatusFilter;

    return matchesSearch && matchesCompanyStatus && matchesSubStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-arabic">
      
      {/* Top Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة الشركات والجهات المستفيدة (SaaS Hub)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة شركات جديدة، إدارة دورة الحياة والاشتراكات (تفعيل، تعليق، تجديد، تمديد)، واستعراض سجل الأحداث
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white font-bold text-xs shadow-sm shadow-rose-950/20 transition-all cursor-pointer"
              title="تسجيل الخروج والعودة لشاشة الدخول"
            >
              <LogOut className="w-4 h-4 stroke-[2.2]" />
              <span>تسجيل خروج</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة شركة جديدة</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Status Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-md">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، المالك، اسم المستخدم، أو الرقم..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Status Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          
          {/* Company Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">حالة الشركة:</span>
            <select
              value={companyStatusFilter}
              onChange={(e) => setCompanyStatusFilter(e.target.value as any)}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">الكل (All)</option>
              <option value="ACTIVE" className="bg-slate-900 text-emerald-400">نشطة (Active)</option>
              <option value="SUSPENDED" className="bg-slate-900 text-rose-400">موقوفة (Suspended)</option>
              <option value="INACTIVE" className="bg-slate-900 text-slate-400">غير نشطة (Inactive)</option>
            </select>
          </div>

          {/* Subscription Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px]">الاشتراك:</span>
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value as any)}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">الكل (All)</option>
              <option value="ACTIVE" className="bg-slate-900 text-emerald-400">نشط (Active)</option>
              <option value="TRIAL" className="bg-slate-900 text-amber-400">تجريبي (Trial)</option>
              <option value="PAST_DUE" className="bg-slate-900 text-orange-400">متأخر (Past Due)</option>
              <option value="SUSPENDED" className="bg-slate-900 text-rose-400">معلق (Suspended)</option>
              <option value="CANCELLED" className="bg-slate-900 text-slate-400">ملغي (Cancelled)</option>
              <option value="EXPIRED" className="bg-slate-900 text-rose-400">منتهي (Expired)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض الشبكة (Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض الجدول (Table)"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Companies Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <span>جاري تحميل بيانات الشركات والاشتراكات...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 text-xs space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">لا توجد شركات مسجلة مطابقة للبحث والفلاتر المحددة</p>
          <p className="text-slate-500">جرب تعديل خيارات الفلترة أو إضافة شركة جديدة</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">الشركة</th>
                  <th className="py-3 px-4 font-bold">المالك / المدير</th>
                  <th className="py-3 px-4 font-bold">حالة الشركة</th>
                  <th className="py-3 px-4 font-bold">الباقة والدورة</th>
                  <th className="py-3 px-4 font-bold">حالة الاشتراك</th>
                  <th className="py-3 px-4 font-bold">تاريخ الانتهاء</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCompanies.map((comp) => {
                  const sub = comp.subscription;
                  const isSubExpired = sub?.status === 'expired' || (sub?.expiration_date && new Date(sub.expiration_date).getTime() < Date.now());

                  return (
                    <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 font-bold shrink-0 overflow-hidden">
                            {comp.logo_url ? (
                              <img src={comp.logo_url} alt={comp.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{comp.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: #{comp.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{comp.owner_name || '—'}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{comp.owner_username || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {comp.status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                            <Ban className="w-3 h-3" /> موقوفة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            <Check className="w-3 h-3" /> نشطة
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-amber-300">{sub?.plan_name || 'Professional'}</div>
                        <div className="text-slate-400 text-[11px]">{sub?.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {sub?.status === 'suspended' ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px]">معلّق</span>
                        ) : sub?.status === 'cancelled' ? (
                          <span className="text-slate-400 font-bold bg-slate-500/10 border border-slate-500/30 px-2 py-0.5 rounded text-[11px]">ملغي</span>
                        ) : sub?.status === 'past_due' ? (
                          <span className="text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded text-[11px]">متأخر</span>
                        ) : sub?.status === 'trial' ? (
                          <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">تجريبي</span>
                        ) : isSubExpired ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px]">منتهي</span>
                        ) : (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">نشط</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {sub?.expiration_date ? sub.expiration_date.split('T')[0] : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCompanyForDetails(comp)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700"
                            title="عرض التفاصيل وسجل الأحداث"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل</span>
                          </button>
                          <button
                            onClick={() => handleOpenManageSub(comp)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1"
                            title="إدارة وتعديل الاشتراك"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>الاشتراك</span>
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(comp)}
                            className={`p-1.5 rounded-xl transition-colors ${
                              comp.status === 'SUSPENDED'
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                            title={comp.status === 'SUSPENDED' ? 'تفعيل الشركة' : 'تعليق الشركة'}
                          >
                            {comp.status === 'SUSPENDED' ? <PlayCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleResetPassword(comp.id, comp.owner_name || comp.name)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                            title="إعادة تعيين كلمة المرور"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(comp.id, comp.name)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="حذف الشركة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => {
            const hasTempPassword = Boolean(comp.temp_password);
            const sub = comp.subscription;
            const isSubExpired = sub?.status === 'expired' || (sub?.expiration_date && new Date(sub.expiration_date).getTime() < Date.now());

            return (
              <div
                key={comp.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Header: Logo & Company Name */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden text-amber-400 font-bold">
                    {comp.logo_url ? (
                      <img src={comp.logo_url} alt={comp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-white truncate">{comp.name}</h3>
                      {comp.status === 'SUSPENDED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Ban className="w-3 h-3" /> موقوفة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Check className="w-3 h-3" /> نشطة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <User className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                      <span className="truncate">{comp.owner_name || 'بدون مالك'}</span>
                    </div>
                  </div>
                </div>

                {/* Company Owner & Password Status Card */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">اسم المستخدم للمالك:</span>
                    <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg">
                      {comp.owner_username || '—'}
                    </span>
                  </div>

                  {/* Password Status Logic */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">حالة كلمة المرور:</span>
                    {hasTempPassword ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold">
                          {comp.temp_password}
                        </span>
                        <button
                          onClick={() => handleCopy(comp.temp_password!, comp.id)}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                          title="نسخ كلمة المرور المؤقتة"
                        >
                          {copiedId === comp.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>مؤمن (تم التغيير)</span>
                      </span>
                    )}
                  </div>

                  {/* Subscription Summary Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>الاشتراك:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-300">
                        {sub?.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                      </span>
                      {sub?.status === 'suspended' ? (
                        <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">معلّق</span>
                      ) : sub?.status === 'cancelled' ? (
                        <span className="text-slate-400 font-bold bg-slate-500/10 border border-slate-500/30 px-1.5 py-0.5 rounded text-[10px]">ملغي</span>
                      ) : sub?.status === 'past_due' ? (
                        <span className="text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded text-[10px]">متأخر</span>
                      ) : sub?.status === 'trial' ? (
                        <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px]">تجريبي</span>
                      ) : isSubExpired ? (
                        <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">منتهي</span>
                      ) : (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">نشط</span>
                      )}

                      <button
                        onClick={() => handleOpenManageSub(comp)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/80 transition-colors"
                        title="إدارة وتعديل الاشتراك"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Suspension Warning Banner if suspended */}
                {comp.status === 'SUSPENDED' && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>حساب موقوف: يُمنع تسجيل الدخول وتظهر رسالة "يرجى التواصل مع الإدارة"</span>
                  </div>
                )}

                {/* Footer Controls & Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{comp.events_count ?? 0} مناسبة</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{comp.employees_count ?? 0} موظف</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedCompanyForDetails(comp)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="عرض التفاصيل وسجل الأحداث"
                    >
                      <Eye className="w-3 h-3" />
                      <span>تفاصيل</span>
                    </button>

                    <button
                      onClick={() => handleOpenManageSub(comp)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="إدارة الاشتراك"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>الاشتراك</span>
                    </button>

                    <button
                      onClick={() => handleToggleSuspend(comp)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        comp.status === 'SUSPENDED'
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                      title={comp.status === 'SUSPENDED' ? 'تفعيل الشركة (إلغاء الإيقاف)' : 'إيقاف الشركة (تجميد الحساب)'}
                    >
                      {comp.status === 'SUSPENDED' ? <PlayCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleResetPassword(comp.id, comp.owner_name || comp.name)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                      title="توليد كلمة مرور مؤقتة جديدة للمالك"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCompany(comp.id, comp.name)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="حذف الشركة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedCompanyForDetails && (
        <CompanyDetailsModal
          company={selectedCompanyForDetails}
          onClose={() => setSelectedCompanyForDetails(null)}
          onOpenManageSub={(c) => {
            setSelectedCompanyForDetails(null);
            handleOpenManageSub(c);
          }}
          onToggleSuspend={(c) => {
            setSelectedCompanyForDetails(null);
            handleToggleSuspend(c);
          }}
        />
      )}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden text-right space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">إضافة شركة جديدة للنظام</h3>
                  <p className="text-[11px] text-slate-400">إنشاء حساب الشركة والاشتراك وتوليد كلمة مرور المالك المؤقتة</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  اسم الشركة / المؤسسة *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شركة الصفوة لتنظيم الفعاليات"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  شعار الشركة (اختياري)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة الشعار</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoUrl && (
                    <div className="w-9 h-9 rounded-xl border border-amber-400/40 overflow-hidden bg-slate-800">
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  اسم صاحب الشركة / المدير المسؤول *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="مثال: عبد الله أحمد السعيد"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Owner Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  اسم مستخدم المالك (عربي أو إنجليزي للدخول) *
                </label>
                <input
                  type="text"
                  value={ownerUsername}
                  onChange={(e) => setOwnerUsername(e.target.value)}
                  placeholder="مثال: عبدالله_السعيد أو abdullah_al"
                  dir="auto"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-sans"
                />
              </div>

              {/* Subscription Options */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>إعدادات باقة واشتراك SaaS (Professional)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">دورة الفوترة</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="yearly">سنوي (Yearly - 12 شهر)</option>
                      <option value="monthly">شهري (Monthly - شهر واحد)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">تاريخ انتهاء الاشتراك</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  سيقوم النظام بتوليد <b>رقم سري مؤقت تلقائي قوي</b>، وتفعيل اشتراك Professional تلقائياً للشركة.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                  <span>إنشاء الشركة والاشتراك</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Super Admin Manage Subscription Modal */}
      {selectedCompanyForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden text-right space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setSelectedCompanyForSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">إدارة اشتراك شركة: {selectedCompanyForSub.name}</h3>
                  <p className="text-[11px] text-slate-400">التحكم الكامل في الخطة، دورة الفوترة، التجديد، التمديد، والإيقاف</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">إجراءات التجديد والتمديد السريعة:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={updatingSub}
                  onClick={() => handleQuickRenew(1, 'monthly')}
                  className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تجديد (1 شهر)</span>
                </button>

                <button
                  type="button"
                  disabled={updatingSub}
                  onClick={() => handleQuickRenew(12, 'yearly')}
                  className="p-2.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تجديد (1 سنة)</span>
                </button>

                <button
                  type="button"
                  disabled={updatingSub}
                  onClick={() => handleQuickExtend(1)}
                  className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>تمديد +1 شهر</span>
                </button>

                <button
                  type="button"
                  disabled={updatingSub}
                  onClick={() => handleQuickExtend(12)}
                  className="p-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/50 text-amber-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>تمديد +1 سنة</span>
                </button>
              </div>
            </div>

            {/* Quick Status Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">تغيير حالة الاشتراك مباشرة:</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('active')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer"
                >
                  تفعيل (ACTIVE)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('trial')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                >
                  فترة تجريبية (TRIAL)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('past_due')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold cursor-pointer"
                >
                  متأخر في السداد (PAST_DUE)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('suspended')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer"
                >
                  تعليق الاشتراك (SUSPENDED)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('cancelled')}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 text-xs font-bold cursor-pointer"
                >
                  إلغاء الاشتراك (CANCELLED)
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSetStatus('expired')}
                  className="px-3 py-1.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700 text-xs font-bold cursor-pointer"
                >
                  إنهاء الاشتراك (EXPIRED)
                </button>
              </div>
            </div>

            {/* Manual Form Controls */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
              <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>تعديل تفاصيل وتواريخ الاشتراك يدوياً</span>
                <span className="text-[11px] text-amber-400">باقة Professional</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">حالة الاشتراك</label>
                  <select
                    value={subEditStatus}
                    onChange={(e) => setSubEditStatus(e.target.value as SubscriptionStatus)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="active">نشط (ACTIVE)</option>
                    <option value="trial">تجريبي (TRIAL)</option>
                    <option value="past_due">متأخر في السداد (PAST_DUE)</option>
                    <option value="suspended">معلق (SUSPENDED)</option>
                    <option value="cancelled">ملغي (CANCELLED)</option>
                    <option value="expired">منتهي (EXPIRED)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">دورة الفوترة</label>
                  <select
                    value={subEditCycle}
                    onChange={(e) => setSubEditCycle(e.target.value as BillingCycle)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="monthly">شهري (Monthly)</option>
                    <option value="yearly">سنوي (Yearly)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">تاريخ بدء الاشتراك</label>
                  <input
                    type="date"
                    value={subEditStartDate}
                    onChange={(e) => setSubEditStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">تاريخ الانتهاء / التجديد</label>
                  <input
                    type="date"
                    value={subEditExpirationDate}
                    onChange={(e) => {
                      setSubEditExpirationDate(e.target.value);
                      setSubEditRenewalDate(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none font-bold text-amber-300"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCompanyForSub(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={updatingSub}
                onClick={handleSaveSubChanges}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updatingSub ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                <span>حفظ تعديلات الاشتراك</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Created Credentials Modal */}
      {newCompanyCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-right space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">تم إنشاء الشركة والاشتراك بنجاح!</h3>
              <p className="text-xs text-slate-400">
                يرجى نسخ بيانات الدخول المؤقتة وتسليمها لمالك الشركة:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الشركة:</span>
                <span className="font-bold text-white">{newCompanyCredentials.companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">اسم المالك:</span>
                <span className="font-bold text-slate-200">{newCompanyCredentials.ownerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">اسم المستخدم:</span>
                <span className="font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded-lg">
                  {newCompanyCredentials.username}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نوع الاشتراك:</span>
                <span className="font-bold text-emerald-400">
                  Professional ({newCompanyCredentials.billingCycle || 'سنوي'})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">الرقم السري المؤقت:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-sm">
                  {newCompanyCredentials.tempPassword}
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                const info = `بيانات الدخول لمنظومة الدعوات:\nالشركة: ${newCompanyCredentials.companyName}\nاسم المستخدم: ${newCompanyCredentials.username}\nكلمة المرور المؤقتة: ${newCompanyCredentials.tempPassword}\nنوع الاشتراك: Professional (${newCompanyCredentials.billingCycle || 'سنوي'})\n\n* سيُطلب منك تعيين كلمة مرور خاصة بك عند أول تسجيل دخول.`;
                await copyToClipboard(info);
                alert('تم نسخ بيانات الدخول إلى الحافظة بنجاح!');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ كافة البيانات لإرسالها للمالك</span>
            </button>

            <button
              onClick={() => setNewCompanyCredentials(null)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              تم الحفظ والإغلاق
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
