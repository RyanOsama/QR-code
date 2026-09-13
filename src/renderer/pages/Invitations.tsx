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
  GraduationCap, 
  Check, 
  X,
  AlertTriangle,
  QrCode,
  Sparkles,
  UserCheck
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
  const [graduateFilter, setGraduateFilter] = useState<string>('ALL');

  // Generation Modal States
  const [genCount, setGenCount] = useState('50');
  const [mode, setMode] = useState<'NO_NAMES' | 'GRADUATES' | 'WITH_NAMES'>('GRADUATES');
  const [namesText, setNamesText] = useState('');
  const [cardsPerStudent, setCardsPerStudent] = useState('10');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Edit Name States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');

  // Extract unique graduate names from existing invitations
  const uniqueGraduates = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invitations) {
      if (inv.graduate_name && inv.graduate_name.trim()) {
        set.add(inv.graduate_name.trim());
      }
    }
    return Array.from(set);
  }, [invitations]);

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لإدارة الدعوات.
      </div>
    );
  }

  const remainingCapacity = Math.max(0, activeEvent.capacity - invitations.length);

  // Handle generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);

    let count = parseInt(genCount, 10);
    let namesArray: string[] | undefined;
    let allocations: Array<{ graduateName: string; count: number }> | undefined;

    if (mode === 'GRADUATES') {
      const parsedGraduates = namesText
        .split('\n')
        .map((n) => n.trim())
        .filter(Boolean);

      if (parsedGraduates.length === 0) {
        setGenError('يرجى إدخال اسم طالب / خريج واحد على الأقل');
        return;
      }

      const perCount = parseInt(cardsPerStudent, 10);
      if (isNaN(perCount) || perCount <= 0) {
        setGenError('يرجى تحديد عدد كروت صحيح لكل طالب');
        return;
      }

      const totalNeeded = parsedGraduates.length * perCount;
      if (totalNeeded > remainingCapacity) {
        setGenError(`إجمالي الكروت المطلوبة (${totalNeeded} كرت لـ ${parsedGraduates.length} طالب) يتجاوز السعة المتبقية (${remainingCapacity} كرت). السعة القصوى للمناسبة: ${activeEvent.capacity}`);
        return;
      }

      allocations = parsedGraduates.map((name) => ({
        graduateName: name,
        count: perCount,
      }));
      count = totalNeeded;
    } else if (mode === 'WITH_NAMES') {
      const parsed = namesText
        .split('\n')
        .map((n) => n.trim())
        .filter(Boolean);

      if (parsed.length === 0) {
        setGenError('يرجى إدخال اسم واحد على الأقل أو اختيار وضع "بدون أسماء"');
        return;
      }
      count = parsed.length;
      namesArray = parsed;

      if (count > remainingCapacity) {
        setGenError(`العدد المطلوب (${count}) يتجاوز السعة المتبقية (${remainingCapacity}). السعة القصوى: ${activeEvent.capacity}`);
        return;
      }
    } else {
      if (isNaN(count) || count <= 0) {
        setGenError('يرجى تحديد عدد صحيح للدعوات');
        return;
      }
      if (count > remainingCapacity) {
        setGenError(`العدد المطلوب (${count}) يتجاوز السعة المتبقية (${remainingCapacity}). السعة القصوى: ${activeEvent.capacity}`);
        return;
      }
    }

    setGenerating(true);
    try {
      const res = await api.generateInvitations(activeEvent.id, count, namesArray, allocations);
      if (!res.success) {
        setGenError(res.error || 'فشل توليد الدعوات');
      } else {
        setIsCreateModalOpen(false);
        setNamesText('');
        onRefresh();
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
    await api.updateGuestName(invId, editedName);
    setEditingId(null);
    onRefresh();
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

  // Filter and search
  const filtered = invitations.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesGraduate = graduateFilter === 'ALL' || inv.graduate_name === graduateFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(inv.invitation_number).includes(term) ||
      (inv.guest_name && inv.guest_name.toLowerCase().includes(term)) ||
      (inv.graduate_name && inv.graduate_name.toLowerCase().includes(term)) ||
      inv.token.toLowerCase().includes(term);

    return matchesStatus && matchesGraduate && matchesSearch;
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

        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={remainingCapacity <= 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>توليد كروت دعوة جديدة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالرقم أو اسم الخريج أو المدعو أو الرمز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Graduate Filter (If event has graduate cards) */}
          {uniqueGraduates.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">الخريج:</span>
              <select
                value={graduateFilter}
                onChange={(e) => setGraduateFilter(e.target.value)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">جميع الخريجين ({uniqueGraduates.length})</option>
                {uniqueGraduates.map((grad) => (
                  <option key={grad} value={grad} className="bg-slate-900 text-white">{grad}</option>
                ))}
              </select>
            </div>
          )}

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
                <th className="py-3 px-4">اسم الخريج / الطالب</th>
                <th className="py-3 px-4">اسم المدعو</th>
                <th className="py-3 px-4">رمز التحقق (Token)</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">وقت الاستخدام</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    لا توجد دعوات تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      #{String(inv.invitation_number).padStart(3, '0')}
                    </td>

                    {/* Graduate Name Column */}
                    <td className="py-3 px-4">
                      {inv.graduate_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{inv.graduate_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">— (دعوة عامة)</span>
                      )}
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
                        <div className="flex items-center gap-2 group">
                          {inv.guest_name ? (
                            <span className="font-semibold text-white">{inv.guest_name}</span>
                          ) : (
                            <span className="text-slate-500 italic">غير محدد (بدون اسم)</span>
                          )}
                          <button
                            onClick={() => startEdit(inv)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-400 transition-opacity p-0.5"
                            title="تعديل اسم المدعو"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

                    {/* Used At */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {inv.used_at ? new Date(inv.used_at).toLocaleTimeString('ar-SA') : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectForQr(inv)}
                          title="عرض وطباعة الـ QR"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
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

      {/* Create / Generate Invitations Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>توليد كروت ودعوات QR جماعية</span>
                </h3>
                <p className="text-xs text-slate-400">
                  المناسبة: {activeEvent.name} • المتبقي المسموح به: {remainingCapacity} دعوة
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="py-4 space-y-4 overflow-y-auto flex-1">
              
              {genError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {genError}
                </div>
              )}

              {/* Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">طريقة التوليد والتوزيع:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('GRADUATES')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'GRADUATES'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs flex items-center gap-1.5 font-bold">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>توزيع للطلاب / الخريجين</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">تحديد كروت لكل طالب باسمه</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('NO_NAMES')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'NO_NAMES'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">بدون أسماء (عامة)</div>
                    <div className="text-[10px] text-slate-500 mt-1">كروت موحدة لتوزيعها يدوياً</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('WITH_NAMES')}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'WITH_NAMES'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">بأسماء المدعوين</div>
                    <div className="text-[10px] text-slate-500 mt-1">اسم خاص لكل بطاقة</div>
                  </button>
                </div>
              </div>

              {/* Mode 1: GRADUATE ALLOCATION */}
              {mode === 'GRADUATES' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      تخصيص الكروت لطلاب حفل التخرج:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      سيتم طباعة: "احتفالاً بتخرج [اسم الخريج]"
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      أدخل أسماء الطلاب الخريجين (اسم واحد في كل سطر):
                    </label>
                    <textarea
                      rows={5}
                      placeholder="ريان أسامة بن عسله&#10;خالد أحمد العتيبي&#10;محمد عبدالله الحربي..."
                      value={namesText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNamesText(val);
                        const count = val.split('\n').filter((n) => n.trim()).length;
                        if (count > 10) {
                          if (cardsPerStudent === '10' || !cardsPerStudent) {
                            setCardsPerStudent('8');
                          }
                        } else if (count > 0 && count <= 10) {
                          if (cardsPerStudent === '8') {
                            setCardsPerStudent('10');
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  {/* Student Count & Smart Allocation Notice */}
                  {namesText.split('\n').filter((n) => n.trim()).length > 10 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>
                          تم ضبط الحصة تلقائياً على <b>8 كروت لكل طالب</b> (عدد الطلاب: {namesText.split('\n').filter((n) => n.trim()).length}) لضمان عدم تجاوز سقف 100 كرت.
                        </span>
                      </div>
                      {namesText.split('\n').filter((n) => n.trim()).length * (parseInt(cardsPerStudent, 10) || 0) > Math.min(100, remainingCapacity) && (
                        <button
                          type="button"
                          onClick={() => {
                            const count = namesText.split('\n').filter((n) => n.trim()).length;
                            const safe = Math.max(1, Math.floor(Math.min(100, remainingCapacity) / count));
                            setCardsPerStudent(String(safe));
                          }}
                          className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 text-[10px] shrink-0"
                        >
                          ملاءمة السعة ({Math.max(1, Math.floor(Math.min(100, remainingCapacity) / namesText.split('\n').filter((n) => n.trim()).length))} كرت)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs text-slate-300">
                          عدد الكروت المخصصة لكل طالب:
                        </label>
                        {namesText.split('\n').filter((n) => n.trim()).length > 10 && (
                          <span className="text-[10px] text-amber-400 font-bold">(8 كروت تلقائياً)</span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={cardsPerStudent}
                        onChange={(e) => setCardsPerStudent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold text-amber-300"
                        required
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400">إجمالي الكروت الناتجة:</div>
                      <div className="text-base font-extrabold text-white">
                        {namesText.split('\n').filter((n) => n.trim()).length * (parseInt(cardsPerStudent, 10) || 0)} كرت
                      </div>
                      <div className="text-[10px] text-amber-400">
                        ({namesText.split('\n').filter((n) => n.trim()).length} طالب × {cardsPerStudent || 0} كرت)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: NO NAMES */}
              {mode === 'NO_NAMES' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    عدد الكروت المراد إنشاؤها (الحد الأقصى المتاح: {remainingCapacity})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={remainingCapacity}
                    value={genCount}
                    onChange={(e) => setGenCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bold text-amber-300"
                    required
                  />
                </div>
              )}

              {/* Mode 3: WITH GUEST NAMES */}
              {mode === 'WITH_NAMES' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    أدخل قائمة أسماء المدعوين (اسم واحد في كل سطر):
                  </label>
                  <textarea
                    rows={5}
                    placeholder="محمد أحمد&#10;خالد عبدالله&#10;عبدالرحمن سعيد..."
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    عدد الأسماء المدخلة: {namesText.split('\n').filter((n) => n.trim()).length}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={generating || remainingCapacity <= 0}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{generating ? 'جاري إنشاء وتشفير الكروت وتوزيعها...' : 'إنشاء وتوزيع الكروت الآن'}</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
