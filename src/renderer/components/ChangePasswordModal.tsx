import React, { useState } from 'react';
import { ShieldAlert, Lock, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../utils/apiBridge';
import { AppUser } from '../../types';

interface ChangePasswordModalProps {
  user: AppUser;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanNew.length < 4) {
      setError('يجب ألا تقل كلمة المرور الجديدة عن 4 خانات');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة الكتابة');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(user.id, cleanNew);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'تعذر تغيير كلمة المرور');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in font-arabic">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-7 shadow-2xl overflow-hidden text-right space-y-5">
        
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">تغيير كلمة المرور المؤقتة (إلزامي)</h2>
            <p className="text-xs text-slate-400 mt-1">مرحباً بك، <b className="text-amber-300">{user.full_name}</b></p>
          </div>
        </div>

        {/* Security Warning Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed text-right">
          تم تسجيل دخولك باستخدام كلمة مرور مؤقتة مكشوفة لدى الإدارة. لضمان أمان حسابك وحفظ خصوصية بيانات الفعاليات، يجب عليك تعيين كلمة مرور جديدة سرية الآن.
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة..."
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور..."
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري حفظ كلمة المرور...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>حفظ كلمة المرور والدخول للنظام</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
