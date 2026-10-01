import React, { useState } from 'react';
import {
  Database,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { api } from '../utils/apiBridge';

interface DatabaseUpdateScreenProps {
  companyName?: string;
  currentVersion: number;
  requiredVersion: number;
  pendingMigrations?: Array<{
    version: number;
    name: string;
    titleArabic: string;
    description: string;
  }>;
  onMigrationComplete: () => void;
}

interface StepItem {
  stepKey: string;
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | string;
  message?: string;
  error?: string;
}

export const DatabaseUpdateScreen: React.FC<DatabaseUpdateScreenProps> = ({
  companyName = 'الشركة',
  currentVersion,
  requiredVersion,
  pendingMigrations = [],
  onMigrationComplete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [migrationSteps, setMigrationSteps] = useState<StepItem[]>([]);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleStartMigration = async () => {
    setIsUpdating(true);
    setMigrationError(null);

    // Initial placeholder steps
    const initialSteps: StepItem[] = [
      {
        stepKey: 'check_database',
        title: 'فحص حالة قاعدة البيانات',
        status: 'in_progress',
        message: 'جاري فحص الإصدار الحالي ومطابقة المخطط...',
      },
      ...pendingMigrations.map((m) => ({
        stepKey: `migrate_v${m.version}`,
        title: m.titleArabic || `تطبيق التحديث v${m.version}`,
        status: 'pending' as const,
        message: m.description,
      })),
      {
        stepKey: 'verify_final_schema',
        title: 'التحقق النهائي وتأكيد الجاهزية',
        status: 'pending',
        message: 'بانتظار التحقق من الجداول والفهارس المحدثة...',
      },
    ];
    setMigrationSteps(initialSteps);

    try {
      const res = await api.runDatabaseMigrations();

      if (res.steps && res.steps.length > 0) {
        setMigrationSteps(res.steps as StepItem[]);
      }

      if (res.success) {
        setIsCompleted(true);
        setTimeout(() => {
          onMigrationComplete();
        }, 1200);
      } else {
        setMigrationError(
          res.error || 'حدث خطأ أثناء تطبيق تحديثات قاعدة البيانات. لم تتأثر أي بيانات موجودة.'
        );
      }
    } catch (err: any) {
      setMigrationError(err.message || 'حدث خطأ غير متوقع أثناء عملية التحديث.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-arabic selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Database className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>النسخة المخصصة • {companyName}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                تحديث قاعدة البيانات
              </h1>
            </div>
          </div>

          {/* Versions Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                v{currentVersion}
              </span>
              <span className="text-amber-400 font-black">←</span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20">
                v{requiredVersion}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">مطلوب ترقية المخطط</span>
          </div>
        </div>

        {/* Informational Box */}
        {!isUpdating && migrationSteps.length === 0 && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 mb-1">
                  يتوفر تحديث جديد لمخطط قاعدة البيانات:
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تتطلب هذه النسخة من التطبيق تحديث بنية قاعدة البيانات لتطبيق تحسينات الأداء،
                  وفهارس الاستعلام المتقدمة، وضمان التوافق التام مع الميزات الجديدة.
                </p>
              </div>
            </div>

            {/* Pending Migrations List */}
            {pendingMigrations.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>التحديثات المعلقة المجدولة للتطبيق:</span>
                </h3>
                <div className="space-y-2">
                  {pendingMigrations.map((m) => (
                    <div
                      key={m.version}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                        v{m.version}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{m.titleArabic}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {m.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleStartMigration}
                className="w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              >
                <span>تحديث قاعدة البيانات</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Progress List */}
        {(isUpdating || migrationSteps.length > 0) && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">
                {isCompleted
                  ? 'تم تحديث قاعدة البيانات بنجاح'
                  : migrationError
                  ? 'تعذر استكمال تحديث قاعدة البيانات'
                  : 'جاري تطبيق التحديثات البرمجية للمخطط'}
              </h3>
              <p className="text-xs text-slate-400">
                {isCompleted
                  ? 'جاري التحويل التلقائي لشاشة تسجيل الدخول...'
                  : migrationError
                  ? 'يرجى مراجعة الخطوات أدناه والمحاولة مجدداً'
                  : 'يتم تطبيق التحديثات بالتتابع لضمان سلامة وحصانة البيانات'}
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              {migrationSteps.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-900/80 last:border-none"
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                    )}
                    {item.status === 'in_progress' && (
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0 stroke-[2.5]" />
                    )}
                    {item.status === 'failed' && (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 stroke-[2.5]" />
                    )}
                    {item.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          item.status === 'success'
                            ? 'text-emerald-300'
                            : item.status === 'failed'
                            ? 'text-rose-300'
                            : item.status === 'in_progress'
                            ? 'text-amber-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.title}
                      </div>
                      {item.message && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.message}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message & Retry Button */}
            {migrationError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-slate-200">{migrationError}</div>
                </div>

                <div className="pt-2 border-t border-rose-500/20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartMigration}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>[ إعادة المحاولة ]</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
