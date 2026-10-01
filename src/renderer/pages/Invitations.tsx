import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  X,
  AlertTriangle,
  QrCode,
  Sparkles,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Event, Invitation } from '../../types';
import { api } from '../utils/apiBridge';

interface InvitationsProps {
  activeEvent: Event | null;
  invitations: Invitation[];
  onRefresh: () => void;
  onSelectForQr: (invitation: Invitation) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const Invitations: React.FC<InvitationsProps> = ({
  activeEvent,
  invitations,
  onRefresh,
  onSelectForQr,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'USED'>('ALL');

  // Generation Modal States
  const [genCount, setGenCount] = useState('30');
  const [mode, setMode] = useState<'NO_NAMES' | 'WITH_NAMES'>('NO_NAMES');
  const [namesText, setNamesText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Edit Name States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');

  // Reset Used Invitations States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const usedCount = useMemo(() => invitations.filter((i) => i.status === 'USED').length, [invitations]);

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لإدارة الدعوات.
      </div>
    );
  }

  const remainingCapacity = Math.max(0, activeEvent.capacity - invitations.length);

  // Handle generation (unified with auto-capacity expansion if needed)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);

    let count = parseInt(genCount, 10);
    let namesArray: string[] | undefined;

    if (mode === 'WITH_NAMES') {
      const parsed = namesText
        .split('\n')
        .map((n) => n.trim())
        .filter(Boolean);

      if (parsed.length === 0) {
        setGenError('يرجى إدخال اسم واحد على الأقل أو اختيار وضع "كروت عامة (بدون أسماء)"');
        return;
      }
      count = parsed.length;
      namesArray = parsed;
    } else {
      if (isNaN(count) || count <= 0) {
        setGenError('يرجى تحديد عدد صحيح موجب للدعوات');
        return;
      }
    }

    setGenerating(true);
    try {
      if (count > remainingCapacity) {
        // Automatically expand capacity and add new invitations
        const res = await api.addInvitationsToEvent(activeEvent.id, count, namesArray);
        if (res.success) {
          setActionFeedback({
            type: 'success',
            message: `تم بنجاح رفع سعة المناسبة إلى ${res.newCapacity} وتوليد ${res.addedCount} كرت جديد!`,
          });
          setIsCreateModalOpen(false);
          setNamesText('');
          onRefresh();
        } else {
          setGenError(res.error || 'فشلت إضافة الكروت وزيادة السعة');
        }
      } else {
        const res = await api.generateInvitations(activeEvent.id, count, namesArray);
        if (!res.success) {
          setGenError(res.error || 'فشل توليد الدعوات');
        } else {
          setActionFeedback({
            type: 'success',
            message: `تم بنجاح توليد ${res.count} كرت جديد!`,
          });
          setIsCreateModalOpen(false);
          setNamesText('');
          onRefresh();
        }
      }
    } catch (err: any) {
      setGenError(err.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setGenerating(false);
    }
  };

  // Inline edit name
  const startEdit = (inv: Invitation) => {
    setEditingId(inv.id);
    setEditedName(inv.guest_name || '');
  };

  const saveEdit = async (invId: number) => {
    try {
      const clean = editedName.trim();
      await api.updateGuestName(invId, clean);
      setEditingId(null);
      setActionFeedback({
        type: 'success',
        message: clean ? `تم بنجاح تحديث اسم المدعو إلى: ${clean}` : 'تمت إزالة اسم المدعو وتحويل الكرت لدعوة عامة',
      });
      onRefresh();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'فشل تحديث اسم المدعو',
      });
    }
  };

  const handleRegenerateToken = async (inv: Invitation) => {
    if (inv.status === 'USED') {
      alert('تحذير: لا يمكن تغيير رمز دعوة تم استخدامها مسبقاً حفاظاً على السجل الأمني!');
      return;
    }
    if (confirm(`هل أنت متأكد من رغبتك في إلغاء الرمز السابق وإنشاء رمز QR جديد تماماً للدعوة #${inv.invitation_number}؟ الرمز القديم سيتوقف عن العمل فوراً.`)) {
      const res = await api.regenerateToken(inv.id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'فشل إعادة التوليد');
      }
    }
  };

  const handleDelete = async (invId: number, invNumber: number) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف الدعوة رقم #${invNumber} نهائياً؟`)) {
      await api.deleteInvitation(invId);
      onRefresh();
    }
  };

  const handleResetAllUsed = async () => {
    if (!activeEvent) return;
    setResetting(true);
    try {
      const res = await api.resetUsedInvitations(activeEvent.id);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `تمت إعادة تعيين ${res.resetCount} باركود مستخدم بنجاح! أصبحت صالحة للدخول كأنها جديدة تماماً.`,
        });
        setIsResetModalOpen(false);
        onRefresh();
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'فشل في إعادة تعيين الدعوات' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'حدث خطأ أثناء إعادة التعيين' });
    } finally {
      setResetting(false);
    }
  };

  const handleResetSingle = async (invId: number, invNumber: number) => {
    try {
      const res = await api.resetSingleInvitation(invId);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `تمت إعادة الدعوة رقم #${invNumber} لتصبح جديدة وغير مستخدمة!`,
        });
        onRefresh();
      } else {
        setActionFeedback({ type: 'error', message: res.error || 'تعذر إعادة تعيين الدعوة' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message });
    }
  };

  // Filter and search
  const filtered = invitations.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(inv.invitation_number).includes(term) ||
      (inv.guest_name && inv.guest_name.toLowerCase().includes(term)) ||
      inv.token.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Controls Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>إدارة الدعوات ورموز الـ QR</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-amber-300 font-bold">
              {invitations.length} / {activeEvent.capacity}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المتبقي المسموح به في السعة: <span className="text-emerald-400 font-bold">{remainingCapacity}</span> دعوة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {usedCount > 0 && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold text-xs shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
              title="إعادة تعيين جميع الباركودات المستخدمة لتعود جديدة كلياً"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة تعيين المستخدمة ({usedCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>توليد كروت وإضافة دعوات</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2.5 animate-in fade-in ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الدعوة أو اسم المدعو أو الرمز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({invitations.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNUSED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'UNUSED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              غير مستخدم ({invitations.filter((i) => i.status === 'UNUSED').length})
            </button>
            <button
              onClick={() => setStatusFilter('USED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'USED' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              مستخدم ({invitations.filter((i) => i.status === 'USED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">رقم الدعوة</th>
                <th className="py-3 px-4">اسم المدعو</th>
                <th className="py-3 px-4">رمز التحقق (Token)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">عدد مرات المسح</th>
                <th className="py-3 px-4">وقت الاستخدام</th>
                <th className="py-3 px-4">مسح بواسطة (الموظف)</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    لا توجد دعوات تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      #{String(inv.invitation_number).padStart(3, '0')}
                    </td>

                    {/* Guest Name Column (Editable) */}
                    <td className="py-3 px-4">
                      {editingId === inv.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="الاسم (اختياري)"
                            className="px-2 py-1 rounded bg-slate-950 border border-amber-400 text-white text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(inv.id)}
                            className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {inv.guest_name ? (
                            <span className="font-semibold text-white">{inv.guest_name}</span>
                          ) : (
                            <span className="text-slate-500 italic">غير محدد (بدون اسم)</span>
                          )}
                          <button
                            onClick={() => startEdit(inv)}
                            className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm border border-amber-500/30"
                            title="تعديل اسم المدعو"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Masked Token */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <code>{inv.token.slice(0, 7)}••••••</code>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'USED'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {inv.status === 'USED' ? 'مستخدم' : 'غير مستخدم'}
                      </span>
                    </td>

                    {/* Scan Count Badge */}
                    <td className="py-3 px-4 text-center">
                      {inv.scan_count && inv.scan_count > 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold">
                          {inv.scan_count} مرات
                        </span>
                      ) : inv.scan_count === 1 || inv.status === 'USED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-bold">
                          1 مسح
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px]">
                          0
                        </span>
                      )}
                    </td>

                    {/* Used At */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {inv.used_at ? new Date(inv.used_at).toLocaleTimeString('ar-SA') : '—'}
                    </td>

                    {/* Scanned By Employee */}
                    <td className="py-3 px-4">
                      {inv.status === 'USED' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{inv.scanned_by_name || 'الموظف المسؤول'}</span>
                          </span>
                          {inv.scanned_device_name && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {inv.scanned_device_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(inv)}
                          title="تعديل اسم المدعو"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectForQr(inv)}
                          title="عرض وطباعة الـ QR"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'USED' && (
                          <button
                            onClick={() => handleResetSingle(inv.id, inv.invitation_number)}
                            title="إعادة تعيين هذا الباركود ليصبح جديداً (غير مستخدم)"
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRegenerateToken(inv)}
                          disabled={inv.status === 'USED'}
                          title="إعادة توليد رمز جديد"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invitation_number)}
                          title="حذف الدعوة"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invitations Modal (Unified) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-right">
                <h3 className="text-lg font-bold text-white flex items-center justify-end gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>توليد وإضافة كروت دعوة جديدة</span>
                </h3>
                <p className="text-xs text-slate-400">
                  المناسبة: {activeEvent.name} • الكروت الحالية: {invitations.length} / {activeEvent.capacity}
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="py-4 space-y-4 overflow-y-auto flex-1">
              
              {genError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {genError}
                </div>
              )}

              {/* Mode Selector: NO_NAMES vs WITH_NAMES */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">طريقة التوليد المطلوبة:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('NO_NAMES')}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      mode === 'NO_NAMES'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>عامة (بدون أسماء)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">كروت دعوة عامة موحدة بأرقام ورموز QR فريدة</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('WITH_NAMES')}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      mode === 'WITH_NAMES'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>بأسماء المدعوين</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">اسم مدعو خاص لكل بطاقة من القائمة</div>
                  </button>
                </div>
              </div>

              {/* Mode 1: NO NAMES */}
              {mode === 'NO_NAMES' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    عدد الكروت المراد توليدها:
                  </label>
                  
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {['10', '20', '30', '50', '100'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGenCount(preset)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          genCount === preset
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset} كرت
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="1"
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                    placeholder="أو اكتب عدداً مخصصاً..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono font-bold text-amber-300"
                    required
                  />
                </div>
              )}

              {/* Mode 2: WITH GUEST NAMES */}
              {mode === 'WITH_NAMES' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      أدخل قائمة أسماء المدعوين (اسم واحد في كل سطر):
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                      {namesText.split('\n').filter((n) => n.trim()).length} اسم
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="الشيخ فهد بن خالد&#10;الأستاذ محمد عبدالله&#10;د. عبدالرحمن سعيد..."
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-arabic resize-none"
                  />
                </div>
              )}

              {/* Seamless Smart Capacity Tip */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  يمكنك إضافة دفعات متعددة في أي وقت (مثلاً 30 باسم و 30 بدون اسم). إذا تجاوز العدد السعة المتبقية ({remainingCapacity})، سيقوم النظام تلقائياً برفع سعة المناسبة وتوليد الكروت فوراً.
                </span>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{generating ? 'جاري توليد الكروت وتشفير الرموز...' : 'توليد الكروت وإضافتها للمناسبة الآن'}</span>
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Reset Used Invitations Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden text-right space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">إعادة تعيين الباركودات المستخدمة؟</h3>
              <p className="text-xs text-slate-400">
                لديك حالياً <b className="text-rose-400 font-mono text-sm">{usedCount} باركود</b> تم استخدامها أو مسحها تجريبياً.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>ستعود جميع هذه الباركودات لحالة <b>"غير مستخدمة (جديدة)"</b>.</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>سيتم تصفير وقت المسح وإفراغ سجل الدخول لتبدأ المناسبة نظيفة تماماً.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Check className="w-4 h-4 shrink-0 text-slate-500" />
                <span>لن تتغير رموز الباركود ولا أرقام الدعوات ولا أسماء المدعوين.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetAllUsed}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التصفير...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>تأكيد إعادة التعيين ({usedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

