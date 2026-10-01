import React, { useState, useEffect } from 'react';
import {
  Server,
  Cloud,
  ShieldCheck,
  Key,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Building2,
  Lock,
  Database,
  Layers,
  Sparkles,
  PlusCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Copy,
  Check,
  Ban,
  PlayCircle,
  Cpu,
  Monitor,
  Trash2,
  UserCheck,
  Info,
  Search,
  Eye,
  EyeOff,
  FileText,
  History,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../utils/apiBridge';
import {
  SystemDeploymentConfig,
  DeploymentMode,
  TenantSubscription,
  DedicatedLicenseConfig,
  Company,
  BillingCycle,
  SubscriptionStatus,
  License,
  LicenseActivation,
  LicenseType,
  LicenseStatus,
  LicenseAuditLog,
} from '../../types';
import { copyToClipboard } from '../utils/clipboard';

interface SystemDeploymentPageProps {
  onRefreshGlobal?: () => void;
}

export const SystemDeploymentPage: React.FC<SystemDeploymentPageProps> = ({ onRefreshGlobal }) => {
  const [activeTab, setActiveTab] = useState<'deployment' | 'saas_subscriptions' | 'licenses_hub'>('deployment');

  const [config, setConfig] = useState<SystemDeploymentConfig>({
    deployment_mode: 'saas',
    database_type: 'hosted_supabase',
    database_url: '',
    database_anon_key: '',
    device_name: 'بوابة 1',
    dedicated_license: null,
  });

  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicenseActivations, setSelectedLicenseActivations] = useState<{ license: License; activations: LicenseActivation[] } | null>(null);

  // Search & Filter State for Licenses Hub
  const [licSearch, setLicSearch] = useState('');
  const [licStatusFilter, setLicStatusFilter] = useState<LicenseStatus | 'all'>('all');
  const [revealedKeyIds, setRevealedKeyIds] = useState<{ [id: number]: boolean }>({});

  // Audit Logs State
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<LicenseAuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // New License Modal State
  const [isCreateLicenseOpen, setIsCreateLicenseOpen] = useState(false);
  const [newLicCompany, setNewLicCompany] = useState('');
  const [newLicMaxDevices, setNewLicMaxDevices] = useState(1);
  const [newLicType, setNewLicType] = useState<LicenseType>('PERPETUAL');
  const [newLicExpiry, setNewLicExpiry] = useState('');
  const [createdKeyNotification, setCreatedKeyNotification] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [renewingCompanyId, setRenewingCompanyId] = useState<number | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cfg, subs, comps, lics] = await Promise.all([
        api.getSystemDeploymentConfig().catch(() => null),
        api.getTenantSubscriptions().catch(() => []),
        api.getCompanies().catch(() => []),
        api.getAdminLicenses().catch(() => []),
      ]);

      if (cfg) setConfig(cfg);
      if (subs) setSubscriptions(subs);
      if (comps) setCompanies(comps);
      if (lics) setLicenses(lics);
    } catch (err) {
      console.error('Failed to load system deployment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLicenses = async () => {
    try {
      const lics = await api.getAdminLicenses({
        query: licSearch.trim() || undefined,
        status: licStatusFilter !== 'all' ? licStatusFilter : undefined,
      });
      setLicenses(lics);
    } catch (err) {
      console.error('Failed to reload licenses:', err);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [licSearch, licStatusFilter]);

  const toggleRevealKey = (licId: number) => {
    setRevealedKeyIds((prev) => ({
      ...prev,
      [licId]: !prev[licId],
    }));
  };

  const handleOpenAuditLogs = async (licenseId?: number) => {
    try {
      setLoadingAuditLogs(true);
      setIsAuditLogOpen(true);
      const logs = await api.getAdminLicenseAuditLogs(licenseId ? { licenseId } : undefined);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load license audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleModeChange = (mode: DeploymentMode) => {
    setConfig((prev) => ({
      ...prev,
      deployment_mode: mode,
      database_type: mode === 'saas' ? 'hosted_supabase' : mode === 'dedicated' ? 'hosted_supabase' : 'local_sqlite',
    }));
  };

  const handleTestConnection = async () => {
    if (!config.database_url || !config.database_anon_key) {
      setTestResult({
        success: false,
        message: 'يرجى إدخال رابط المشروع (Project URL) ومفتاح الوصول (API Key) أولاً.',
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testCloudConnection(config.database_url, config.database_anon_key);
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'تم الاتصال بقاعدة البيانات بنجاح' : 'تعذر الاتصال'),
        latencyMs: res.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'فشل الاتصال بالسيرفر السحابي',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await api.saveSystemDeploymentConfig(config);
      if (res.success) {
        setSaveSuccessMsg('تم حفظ وتطبيق إعدادات النشر والنظام بنجاح!');
        if (onRefreshGlobal) onRefreshGlobal();
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        alert(res.error || 'حدث خطأ أثناء حفظ الإعدادات');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const handleRenewSubscription = async (companyId: number, months: number, cycle?: BillingCycle) => {
    setRenewingCompanyId(companyId);
    try {
      const res = await api.renewTenantSubscription(companyId, months, cycle);
      if (res.success) {
        const subs = await api.getTenantSubscriptions();
        setSubscriptions(subs);
        const comps = await api.getCompanies();
        setCompanies(comps);
      } else {
        alert(res.error || 'تعذر تجديد الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'فشل تجديد الاشتراك');
    } finally {
      setRenewingCompanyId(null);
    }
  };

  const handleToggleSubStatus = async (sub: TenantSubscription) => {
    const isSuspended = sub.status === 'suspended' || sub.status === 'expired';
    const newStatus: SubscriptionStatus = isSuspended ? 'active' : 'suspended';
    const actionText = isSuspended ? 'إعادة تفعيل' : 'تعليق';

    if (!confirm(`هل أنت متأكد من ${actionText} اشتراك شركة "${sub.company_name}"؟`)) {
      return;
    }

    try {
      const res = await api.updateTenantSubscription(sub.company_id, { status: newStatus });
      if (res.success) {
        const subs = await api.getTenantSubscriptions();
        setSubscriptions(subs);
      } else {
        alert(res.error || 'تعذر تحديث حالة الاشتراك');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في التحديث');
    }
  };

  const handleSyncToCloud = async () => {
    if (!config.database_url || !config.database_anon_key) {
      alert('يرجى التأكد من إدخال الرابط والمفتاح السحابي أولاً!');
      return;
    }

    if (!confirm('سيتم رفع كافة المناسبات والدعوات والشركات من هذا الجهاز إلى قاعدة البيانات المركزية.\n\nهل ترغب بالمتابعة؟')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncLocalToCloud();
      if (res.success) {
        setSyncResult({
          success: true,
          message: `تمت المزامنة بنجاح: تم رفع (${res.eventsSynced}) مناسبة و (${res.invitationsSynced}) دعوة!`,
        });
      } else {
        setSyncResult({
          success: false,
          message: `فشلت المزامنة: ${res.error || 'يرجى مراجعة إعدادات قاعدة البيانات'}`,
        });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'خطأ أثناء المزامنة' });
    } finally {
      setSyncing(false);
    }
  };

  // License Hub Operations
  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicCompany.trim()) {
      alert('يرجى كتابة اسم الشركة');
      return;
    }

    try {
      const res = await api.createAdminLicense({
        company_name: newLicCompany.trim(),
        max_devices: newLicMaxDevices > 0 ? newLicMaxDevices : 1,
        license_type: newLicType,
        expires_at: newLicExpiry.trim() ? new Date(newLicExpiry).toISOString() : null,
      });

      if (res.success && res.plainLicenseKey) {
        setCreatedKeyNotification(res.plainLicenseKey);
        setIsCreateLicenseOpen(false);
        setNewLicCompany('');
        setNewLicMaxDevices(1);
        setNewLicExpiry('');
        const lics = await api.getAdminLicenses();
        setLicenses(lics);
      } else {
        alert(res.error || 'فشل إنشاء الترخيص');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ غير متوقع');
    }
  };

  const handleRevokeLicense = async (licenseId: number) => {
    if (!confirm('هل أنت متأكد من سحب وإلغاء هذا الترخيص؟ سيتم حظر جميع الأجهزة المرتبطة به.')) return;
    try {
      const res = await api.revokeAdminLicense(licenseId);
      if (res.success) {
        const lics = await api.getAdminLicenses();
        setLicenses(lics);
      } else {
        alert(res.error || 'فشل إلغاء الترخيص');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ');
    }
  };

  const handleReactivateLicense = async (licenseId: number) => {
    try {
      const res = await api.reactivateAdminLicense(licenseId);
      if (res.success) {
        await loadLicenses();
      } else {
        alert(res.error || 'فشل إعادة تفعيل الترخيص');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ');
    }
  };

  const handleUpdateLicenseStatus = async (licenseId: number, status: LicenseStatus) => {
    try {
      const res = await api.updateAdminLicenseStatus(licenseId, status);
      if (res.success) {
        await loadLicenses();
      } else {
        alert(res.error || 'فشل تحديث حالة الترخيص');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء تحديث حالة الترخيص');
    }
  };

  const handleViewActivations = async (lic: License) => {
    try {
      const acts = await api.getAdminLicenseActivations(lic.id);
      setSelectedLicenseActivations({ license: lic, activations: acts });
    } catch (_) {}
  };

  const handleDeactivateDevice = async (actId: number) => {
    if (!confirm('هل تريد إلغاء تفعيل هذا الجهاز وتحرير المقعد؟')) return;
    try {
      const res = await api.deactivateAdminDevice(actId);
      if (res.success) {
        if (selectedLicenseActivations) {
          const acts = await api.getAdminLicenseActivations(selectedLicenseActivations.license.id);
          setSelectedLicenseActivations({ ...selectedLicenseActivations, activations: acts });
        }
        const lics = await api.getAdminLicenses();
        setLicenses(lics);
      }
    } catch (_) {}
  };

  const getStatusBadge = (status: SubscriptionStatus | string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>نشط (Active)</span>
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 border border-sky-500/40 text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>تجريبي (Trial)</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>معلق (Suspended)</span>
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>ملغى (Revoked)</span>
          </span>
        );
      case 'expired':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>منتهي (Expired)</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-xs font-bold text-slate-400">جاري تحميل إعدادات وتراخيص النظام...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Layers className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold mb-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>إدارة النظام والتراخيص التجارية (Super Admin Only)</span>
            </div>
            <h2 className="text-xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              نموذج النشر وإدارة التراخيص والاشتراكات
            </h2>
          </div>
        </div>

        {/* Action Tabs Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'deployment'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            بيئة النشر والربط
          </button>
          <button
            onClick={() => setActiveTab('saas_subscriptions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'saas_subscriptions'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            اشتراكات SaaS ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('licenses_hub')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'licenses_hub'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            خادم التراخيص الدائمة ({licenses.length})
          </button>
        </div>
      </div>

      {/* Generated License Pop-up Alert */}
      {createdKeyNotification && (
        <div className="p-5 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/60 shadow-2xl animate-in zoom-in-95 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-200 font-bold">تم توليد ترخيص الشراء الدائم الجديد بنجاح!</div>
              <div className="text-xs text-slate-300 mt-0.5">انسخ هذا المفتاح وأرسله للعميل (لن يتم تخزين المفتاح الصريح لاحقاً لدواعي الأمان المشدد):</div>
              <div className="text-sm font-mono font-black text-amber-300 mt-1.5 tracking-wider bg-slate-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 select-all" dir="ltr">
                {createdKeyNotification}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                await copyToClipboard(createdKeyNotification);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey ? 'تم النسخ' : 'نسخ المفتاح'}</span>
            </button>
            <button
              onClick={() => setCreatedKeyNotification(null)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: DEPLOYMENT SETTINGS */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>اختر النمط التجاري وبيئة التشغيل للتطبيق</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SaaS Mode */}
              <div
                onClick={() => handleModeChange('saas')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  config.deployment_mode === 'saas'
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Cloud className="w-5 h-5 text-amber-400" />
                    <span>نسخة الاشتراك السحابي (SaaS Multi-tenant)</span>
                  </div>
                  {config.deployment_mode === 'saas' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تستخدم كافة الشركات بنية سحابية مشتركة على سيرفر الشركة المزودة مع عزل كامل للبيانات وسياسات RLS واشتراكات دورية.
                </p>
              </div>

              {/* Dedicated Full Purchase Mode */}
              <div
                onClick={() => handleModeChange('dedicated')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  config.deployment_mode === 'dedicated'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <span>نسخة الشراء الدائم (Dedicated Full Purchase)</span>
                  </div>
                  {config.deployment_mode === 'dedicated' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ترخيص دائم لشركة واحدة يربط على قاعدة بيانات Supabase مستقلة وخاصة بالعميل، محمي بخادم التراخيص وبصمة الأجهزة.
                </p>
              </div>
            </div>
          </div>

          {/* Database Configuration Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>إعدادات قاعدة البيانات المركزية (Supabase Settings)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>اختبار الاتصال</span>
                </button>
                <button
                  onClick={handleSyncToCloud}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>مزامنة المحلي للسحابة</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span className="font-semibold">{testResult.message}</span>
                {testResult.latencyMs !== undefined && testResult.latencyMs > 0 && (
                  <span className="text-[10px] text-slate-400 mr-auto">زمن الاستجابة: {testResult.latencyMs}ms</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  رابط المشروع (Supabase Project URL)
                </label>
                <input
                  type="text"
                  value={config.database_url}
                  onChange={(e) => setConfig({ ...config, database_url: e.target.value })}
                  placeholder="https://xyzcompany.supabase.co"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  مفتاح الوصول العام (Anon Public API Key)
                </label>
                <input
                  type="password"
                  value={config.database_anon_key}
                  onChange={(e) => setConfig({ ...config, database_anon_key: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                {saveSuccessMsg}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                <span>حفظ وتطبيق إعدادات النشر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAAS SUBSCRIPTIONS */}
      {activeTab === 'saas_subscriptions' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">لوحة إدارة اشتراكات الشركات (SaaS Subscriptions)</h3>
                <p className="text-[11px] text-slate-400">
                  خطة موحدة <b>Professional</b> • متابعة فترات التجديد، التمديد، والتعليق الإداري بدون حذف البيانات
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-bold">الشركة المستفيدة</th>
                  <th className="pb-3 font-bold">الخطة</th>
                  <th className="pb-3 font-bold">دورة الفوترة</th>
                  <th className="pb-3 font-bold">حالة الاشتراك</th>
                  <th className="pb-3 font-bold">تاريخ الانتهاء</th>
                  <th className="pb-3 font-bold text-left">إجراءات التجديد والتعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {companies.map((comp) => {
                  const sub = subscriptions.find((s) => s.company_id === comp.id) || comp.subscription;
                  const isRenewing = renewingCompanyId === comp.id;

                  const status: SubscriptionStatus = sub?.status || (comp.status === 'SUSPENDED' ? 'suspended' : 'active');
                  const expiryDate = sub?.expiration_date ? new Date(sub.expiration_date).toLocaleDateString('ar-SA') : '—';

                  return (
                    <tr key={comp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                            {comp.logo_url ? (
                              <img src={comp.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{comp.name}</div>
                            <div className="text-[10px] text-slate-400">المالك: {comp.owner_name || '—'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                          Professional
                        </span>
                      </td>

                      <td className="py-3.5 text-slate-300 font-medium">
                        {sub?.billing_cycle === 'monthly' ? 'شهري (Monthly)' : 'سنوي (Yearly)'}
                      </td>

                      <td className="py-3.5">
                        {getStatusBadge(status)}
                      </td>

                      <td className="py-3.5 font-mono text-[11px]">
                        <span className={status === 'expired' ? 'text-orange-400 font-bold' : 'text-slate-300'}>
                          {expiryDate}
                        </span>
                      </td>

                      <td className="py-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRenewSubscription(comp.id, 1, 'monthly')}
                            disabled={isRenewing}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                            title="تمديد الاشتراك لشهر إضافي"
                          >
                            + شهر
                          </button>
                          <button
                            onClick={() => handleRenewSubscription(comp.id, 12, 'yearly')}
                            disabled={isRenewing}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-colors cursor-pointer"
                            title="تمديد الاشتراك لسنة كاملة"
                          >
                            + سنة
                          </button>
                          {sub && (
                            <button
                              onClick={() => handleToggleSubStatus(sub)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                status === 'suspended' || status === 'expired'
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                              }`}
                              title={status === 'suspended' ? 'إلغاء التعليق وإعادة التفعيل' : 'تعليق الاشتراك'}
                            >
                              {status === 'suspended' ? <PlayCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LICENSES HUB (PERPETUAL LICENSES) */}
      {activeTab === 'licenses_hub' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">خادم إدارة التراخيص الدائمة (License Server Hub)</h3>
                <p className="text-[11px] text-slate-400">
                  توليد وإدارة تراخيص الشراء الدائم، متابعة الأجهزة المفعلة، نقل التراخيص، ومراجعة سجل التدقيق
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAuditLogs()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>سجل العمليات (Audit Log)</span>
              </button>

              <button
                onClick={() => setIsCreateLicenseOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/20 transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء ترخيص دائم جديد</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={licSearch}
                onChange={(e) => setLicSearch(e.target.value)}
                placeholder="بحث باسم الشركة أو مفتاح الترخيص..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 ml-1 shrink-0">الحالة:</span>
              {(
                [
                  { key: 'all', label: 'الكل' },
                  { key: 'active', label: 'نشط' },
                  { key: 'revoked', label: 'ملغي' },
                  { key: 'suspended', label: 'معلق' },
                  { key: 'expired', label: 'منتهي' },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLicStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                    licStatusFilter === f.key
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Licenses Table */}
          {licenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Key className="w-8 h-8 text-slate-600" />
              <span>لا توجد تراخيص تطابق معايير البحث.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-bold">الشركة / العميل</th>
                    <th className="pb-3 font-bold">مفتاح الترخيص (License Key)</th>
                    <th className="pb-3 font-bold">نوع الترخيص</th>
                    <th className="pb-3 font-bold">الحد الأقصى للأجهزة</th>
                    <th className="pb-3 font-bold">الأجهزة النشطة</th>
                    <th className="pb-3 font-bold">الحالة</th>
                    <th className="pb-3 font-bold">تاريخ الإنشاء</th>
                    <th className="pb-3 font-bold text-left">إجراءات التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {licenses.map((lic) => {
                    const activeCount = (lic.activations || []).filter((a) => !a.deactivated_at).length || lic.activations_count || 0;
                    const plainKey = lic.license_key || `PERPETUAL-${lic.license_key_hash.substring(0, 4)}-${lic.license_key_hash.substring(4, 8)}-${lic.license_key_hash.substring(8, 12)}`.toUpperCase();
                    const isRevealed = Boolean(revealedKeyIds[lic.id]);
                    const displayKey = isRevealed
                      ? plainKey
                      : plainKey.length > 12
                      ? `${plainKey.substring(0, 4)}-****-****-${plainKey.substring(plainKey.length - 4)}`
                      : '****';

                    return (
                      <tr key={lic.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5">
                          <div className="font-bold text-white text-sm">{lic.company_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">ID: #{lic.id}</div>
                        </td>

                        <td className="py-3.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                            <span className="font-mono font-bold text-amber-300 text-xs tracking-wide" dir="ltr">
                              {displayKey}
                            </span>
                            <button
                              onClick={() => toggleRevealKey(lic.id)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title={isRevealed ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={async () => {
                                await copyToClipboard(plainKey);
                                alert(`تم نسخ مفتاح الترخيص لشركة (${lic.company_name}) بنجاح:\n${plainKey}`);
                              }}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="نسخ مفتاح الترخيص"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                            {lic.license_type}
                          </span>
                        </td>

                        <td className="py-3.5 font-bold text-slate-200">
                          {lic.max_devices} {lic.max_devices > 1 ? 'أجهزة' : 'جهاز'}
                        </td>

                        <td className="py-3.5">
                          <button
                            onClick={() => handleViewActivations(lic)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Monitor className="w-3.5 h-3.5 text-sky-400" />
                            <span>{activeCount} / {lic.max_devices} مفعل</span>
                          </button>
                        </td>

                        <td className="py-3.5">
                          {getStatusBadge(lic.status)}
                        </td>

                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {new Date(lic.created_at).toLocaleDateString('ar-SA')}
                        </td>

                        <td className="py-3.5 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {lic.status === 'active' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateLicenseStatus(lic.id, 'suspended')}
                                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
                                  title="تعليق الترخيص مؤقتاً"
                                >
                                  تعليق
                                </button>
                                <button
                                  onClick={() => handleRevokeLicense(lic.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-colors cursor-pointer"
                                  title="إلغاء وسحب الترخيص"
                                >
                                  سحب
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleReactivateLicense(lic.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-colors cursor-pointer"
                                title="إعادة تفعيل الترخيص"
                              >
                                إعادة تفعيل
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenAuditLogs(lic.id)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors cursor-pointer"
                              title="عرض سجل تدقيق هذا الترخيص"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create New License */}
      {isCreateLicenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>إصدار ترخيص شراء دائم (Perpetual License)</span>
              </h3>
              <button
                onClick={() => setIsCreateLicenseOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300">اسم الشركة أو العميل</label>
                <input
                  type="text"
                  value={newLicCompany}
                  onChange={(e) => setNewLicCompany(e.target.value)}
                  placeholder="مثال: شركة الفخامة للفعاليات"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300">الحد الأقصى للأجهزة المسموح بتفعيلها</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newLicMaxDevices}
                  onChange={(e) => setNewLicMaxDevices(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
                <p className="text-[10px] text-slate-400">الافتراضي: جهاز واحد (1) لكل ترخيص</p>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300">نوع الترخيص</label>
                <select
                  value={newLicType}
                  onChange={(e) => setNewLicType(e.target.value as LicenseType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                >
                  <option value="PERPETUAL">ترخيص دائم (Perpetual / Lifetime)</option>
                  <option value="SUBSCRIPTION">ترخيص سنوي محدد</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateLicenseOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  إصدار وتوليد المفتاح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View License Activations & Deactivate Devices */}
      {selectedLicenseActivations && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>الأجهزة المفعلة لترخيص: {selectedLicenseActivations.license.company_name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  الحد الأقصى: {selectedLicenseActivations.license.max_devices} جهاز
                </p>
              </div>
              <button
                onClick={() => setSelectedLicenseActivations(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Device Transfer Explanation Callout */}
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-sky-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">نقل الترخيص إلى جهاز جديد (Device Transfer):</span>
                <p className="text-[11px] text-sky-200/80 mt-0.5">
                  عند إلغاء تفعيل أي جهاز قديم، يتم تحرير المقعد على الفور، مما يتيح تشغيل التطبيق على الجهاز الجديد وتفعيله بنفس المفتاح دون تجاوز الحد المسموح به للأجهزة.
                </p>
              </div>
            </div>

            {selectedLicenseActivations.activations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لم يتم تفعيل هذا الترخيص على أي جهاز بعد.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedLicenseActivations.activations.map((act) => {
                  const isDeactivated = Boolean(act.deactivated_at);
                  return (
                    <div
                      key={act.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                        isDeactivated
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isDeactivated ? 'bg-slate-800 text-slate-500' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{act.device_name || 'جهاز مكتبي'}</span>
                            {isDeactivated ? (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                                تم إلغاء التفعيل
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                نشط
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5" dir="ltr">
                            Hash: {act.device_id_hash.substring(0, 16)}...
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            تاريخ التفعيل: {new Date(act.activated_at).toLocaleDateString('ar-SA')} • آخر ظهور: {new Date(act.last_seen_at).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>

                      {!isDeactivated && (
                        <button
                          onClick={() => handleDeactivateDevice(act.id)}
                          className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          إلغاء تفعيل هذا الجهاز
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLicenseActivations(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Logs Viewer */}
      {isAuditLogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">سجل تدقيق عمليات التراخيص والأجهزة (License Audit Log)</h3>
                  <p className="text-[11px] text-slate-400">
                    توثيق العمليات الحساسة، التوليد، التفعيل، الإلغاء، ونقل التراخيص
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditLogOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingAuditLogs ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>جاري تحميل سجل التدقيق...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                لا توجد سجلات تدقيق مسجلة حتى الآن.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto overflow-x-auto border border-slate-800/80 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0">
                    <tr className="border-b border-slate-800">
                      <th className="p-3 font-bold">الوقت والتاريخ</th>
                      <th className="p-3 font-bold">العملية</th>
                      <th className="p-3 font-bold">الشركة / الترخيص</th>
                      <th className="p-3 font-bold">التفاصيل</th>
                      <th className="p-3 font-bold">المنفّذ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {auditLogs.map((log) => {
                      let actionBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {log.action}
                        </span>
                      );

                      if (log.action === 'LICENSE_CREATED') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            إنشاء ترخيص
                          </span>
                        );
                      } else if (log.action === 'LICENSE_REVOKED') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            سحب ترخيص
                          </span>
                        );
                      } else if (log.action === 'LICENSE_REACTIVATED') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            إعادة تفعيل
                          </span>
                        );
                      } else if (log.action === 'DEVICE_ACTIVATED') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            تفعيل جهاز
                          </span>
                        );
                      } else if (log.action === 'DEVICE_DEACTIVATED') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                            إلغاء جهاز
                          </span>
                        );
                      } else if (log.action === 'DEVICE_TRANSFER') {
                        actionBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            نقل ترخيص
                          </span>
                        );
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </td>
                          <td className="p-3 whitespace-nowrap">{actionBadge}</td>
                          <td className="p-3">
                            <div className="font-bold text-white">{log.company_name || '—'}</div>
                            {log.license_key_masked && (
                              <div className="text-[10px] font-mono text-amber-300/80" dir="ltr">
                                {log.license_key_masked}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 text-[11px] max-w-xs">{log.details || '—'}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.actor || 'SUPER_ADMIN'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAuditLogOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SystemDeploymentPage;
