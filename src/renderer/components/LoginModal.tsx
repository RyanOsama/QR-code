import React, { useState, useEffect } from 'react';
import { QrCode, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldAlert, Timer } from 'lucide-react';
import { api } from '../utils/apiBridge';
import { AppUser } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Active countdown timer when locked out
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatCountdown = (secs: number) => {
    if (secs >= 86400) {
      const days = Math.floor(secs / 86400);
      const hours = Math.floor((secs % 86400) / 3600);
      return `${days} يوم و ${hours} ساعة`;
    }
    if (secs >= 3600) {
      const hours = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    if (secs >= 60) {
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      return remSecs > 0 ? `${mins} دقيقة و ${remSecs} ثانية` : `${mins} دقيقة`;
    }
    return `${secs} ثانية`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('يرجى كتابة اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(cleanUser, cleanPass);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        const errorMsg = res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة';
        setError(errorMsg);

        // Check if error response mentions lockout duration
        const match = errorMsg.match(/\((\d+)\)/);
        if (match && match[1]) {
          setLockoutSeconds(parseInt(match[1], 10));
        } else if (errorMsg.includes('يومين')) {
          setLockoutSeconds(172800);
        } else if (errorMsg.includes('5 دقائق')) {
          setLockoutSeconds(300);
        } else if (errorMsg.includes('60 ثانية')) {
          setLockoutSeconds(60);
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-arabic selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Icon & Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center shadow-xl shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300">
            <QrCode className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              منظومة إدارة الدعوات الذكية
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              تسجيل الدخول الموحد للشركات والإدارة والموظفين
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username Field (Arabic or English) */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-end gap-1.5">
              <span>اسم المستخدم (عربي أو إنجليزي)</span>
              <User className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                dir="auto"
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-end gap-1.5">
              <span>كلمة المرور</span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور أو الرمز المؤقت..."
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
              lockoutSeconds > 0
                ? 'bg-slate-800 text-rose-300 border border-rose-500/40 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.99] cursor-pointer disabled:opacity-50'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : lockoutSeconds > 0 ? (
              <>
                <Timer className="w-4 h-4 animate-spin text-rose-400" />
                <span>محظور مؤقتاً ({formatCountdown(lockoutSeconds)})</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Contact Management Section */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <a
            href="https://wa.me/967780791584"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all duration-200 group shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>للتواصل والاستفسار:</span>
            <span dir="ltr" className="font-mono tracking-wider text-white font-black group-hover:text-amber-300">
              967780791584
            </span>
          </a>
        </div>

      </div>

      {/* Footer Info */}
      <p className="mt-6 text-xs text-slate-500 text-center">
        نظام التحقق الذاتي المشفر © 2026 جميع الحقوق محفوظة
      </p>

    </div>
  );
};
