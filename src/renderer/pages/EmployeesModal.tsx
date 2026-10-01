import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Copy, 
  Check, 
  ShieldCheck, 
  Key, 
  Trash2, 
  RefreshCw, 
  X, 
  AlertTriangle,
  User,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { AppUser } from '../../types';
import { api } from '../utils/apiBridge';
import { copyToClipboard } from '../utils/clipboard';

interface EmployeesModalProps {
  companyId: number;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeesModal: React.FC<EmployeesModalProps> = ({
  companyId,
  companyName,
  isOpen,
  onClose,
}) => {
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Success Created Modal
  const [newCredentials, setNewCredentials] = useState<{
    fullName: string;
    username: string;
    tempPassword: string;
  } | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees(companyId);
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyId) {
      fetchEmployees();
    }
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanUser = username.trim();

    if (!cleanName || !cleanUser) {
      setFormError('يرجى تعبئة اسم الموظف واسم المستخدم');
      return;
    }

    setSaving(true);
    try {
      const res = await api.createEmployee(companyId, {
        full_name: cleanName,
        username: cleanUser,
      });

      if (res.success && res.tempPassword) {
        setIsAddOpen(false);
        setFullName('');
        setUsername('');
        setNewCredentials({
          fullName: cleanName,
          username: cleanUser,
          tempPassword: res.tempPassword,
        });
        fetchEmployees();
      } else {
        setFormError(res.error || 'فشلت إضافة الموظف');
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء إضافة الموظف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, empName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${empName}"؟ لن يتمكن من تسجيل الدخول بعد الآن.`)) {
      return;
    }
    try {
      const res = await api.deleteEmployee(userId);
      if (res.success) {
        fetchEmployees();
      } else {
        alert(res.error || 'فشل حذف الموظف');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (userId: number, empName: string) => {
    if (!confirm(`إعادة تعيين كلمة المرور للموظف "${empName}" وتوليد رقم سري مؤقت جديد؟`)) {
      return;
    }
    try {
      const res = await api.resetEmployeePassword(userId);
      if (res.success && res.tempPassword) {
        alert(`تم توليد كلمة مرور مؤقتة جديدة للموظف (${empName}):\n\n${res.tempPassword}\n\nيرجى تزويده بها ليسجل دخوله بها لأول مرة ويغيرها.`);
        fetchEmployees();
      } else {
        alert(res.error || 'فشلت إعادة التعيين');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      e.full_name.toLowerCase().includes(term) ||
      e.username.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-arabic">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-right space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">إدارة موظفي البوابة والمسح</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-amber-400">
                  {companyName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة موظفين لمسح الباركود عبر تطبيق الجوال أو الديسكتوب، وتوليد كلمات المرور المؤقتة
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Controls Bar: Search & Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الموظف أو اسم المستخدم..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>

        {/* Employees Table / List */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px]">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>جاري تحميل الموظفين...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <User className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">لم يتم إضافة موظفين بعد</p>
              <p className="text-slate-500">أضف موظفيك ليتمكنوا من تسجيل الدخول في تطبيق الماسح بجوالاتهم</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEmployees.map((emp) => {
                const hasTemp = Boolean(emp.temp_password);

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResetPassword(emp.id, emp.full_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                          title="توليد رقم سري مؤقت جديد"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.full_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div>
                          <h4 className="font-bold text-white text-sm">{emp.full_name}</h4>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {emp.username}
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Password Status Banner */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">حالة الرقم السري:</span>
                      {hasTemp ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold text-xs">
                            {emp.temp_password}
                          </span>
                          <button
                            onClick={() => handleCopy(emp.temp_password!, emp.id)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            title="نسخ الرقم المؤقت"
                          >
                            {copiedId === emp.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>مؤمن (تم التغيير)</span>
                        </span>
                      )}
                    </div>

                    {hasTemp && (
                      <p className="text-[10px] text-amber-400/80 leading-tight">
                        * سيختفي الرقم المؤقت فور تسجيل الموظف دخوله وتغييره لكلمته
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>يستخدم الموظف بياناته للدخول عبر تطبيق الجوال (Android/iOS) ومسح الباركودات</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>

        {/* Nested Add Employee Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">إضافة موظف استقبال جديد</h4>
                  <UserPlus className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateEmployee} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    اسم الموظف (عربي أو إنجليزي) *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله الغامدي"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    اسم المستخدم للدخول *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmed_gate1 أو أحمد_بوابة"
                    dir="auto"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-sans"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    سيتم توليد <b>رقم سري مؤقت تلقائي</b> يظهر لك الآن لتسليمه للموظف. عند أول دخول للموظف بجواله سيُطلب منه تعيين كلمة مروره الخاصة ويختفي الرقم من حسابك.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>إضافة الموظف</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Employee Credentials Popup */}
        {newCredentials && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white">تمت إضافة الموظف بنجاح!</h4>
                <p className="text-xs text-slate-400">
                  انسخ بيانات الدخول وسلمها للموظف ليسجل بها في تطبيق الجوال:
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">اسم الموظف:</span>
                  <span className="font-bold text-white">{newCredentials.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">اسم المستخدم:</span>
                  <span className="font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded-lg">
                    {newCredentials.username}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">الرقم السري المؤقت:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-sm">
                    {newCredentials.tempPassword}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  const msg = `بيانات الدخول لتطبيق ماسح الباركود:\nالشركة: ${companyName}\nالموظف: ${newCredentials.fullName}\nاسم المستخدم: ${newCredentials.username}\nالرمز السري المؤقت: ${newCredentials.tempPassword}\n\n* سيطلب منك التطبيق تغيير كلمة المرور عند أول تسجيل دخول.`;
                  await copyToClipboard(msg);
                  alert('تم نسخ بيانات الموظف إلى الحافظة!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ بيانات الدخول لإرسالها للموظف</span>
              </button>

              <button
                onClick={() => setNewCredentials(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
