import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Layers, 
  GraduationCap, 
  Heart, 
  Utensils, 
  PartyPopper, 
  Upload, 
  RefreshCw,
  Palette,
  QrCode,
  Sliders,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { CardTemplateItem, QrPositionType } from '../../types';
import { useTheme } from '../context/ThemeContext';

export const TemplatesPage: React.FC = () => {
  const { isDark } = useTheme();

  const [templates, setTemplates] = useState<CardTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActiveFilter, setOnlyActiveFilter] = useState(false);

  // Active side toggle map for card flip previews: [templateId]: 'front' | 'back'
  const [cardSideMap, setCardSideMap] = useState<Record<string, 'front' | 'back'>>({});

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateItem | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CardTemplateItem | null>(null);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

  // Form states for Add/Edit
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    category: string;
    front_image: string;
    back_image: string;
    text_color_scheme: 'gold' | 'light' | 'dark' | 'custom';
    default_primary_color: string;
    default_accent_color: string;
    default_qr_position: QrPositionType;
    is_active: boolean;
  }>({
    name: '',
    category: 'graduation',
    front_image: '',
    back_image: '',
    text_color_scheme: 'gold',
    default_primary_color: '#D4AF37',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.getCardTemplates) {
        const list = await window.electronAPI.getCardTemplates();
        setTemplates(list || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Category Tabs
  const categories = [
    { id: 'all', label: 'جميع التصاميم', icon: Layers, count: templates.length },
    { id: 'graduation', label: 'حفلات التخرج', icon: GraduationCap, count: templates.filter(t => t.category === 'graduation').length },
    { id: 'wedding', label: 'حفلات الزفاف والملكة', icon: Heart, count: templates.filter(t => t.category === 'wedding').length },
    { id: 'dinner', label: 'عشاء ومآدب', icon: Utensils, count: templates.filter(t => t.category === 'dinner').length },
    { id: 'celebration', label: 'احتفالات ومؤتمرات', icon: PartyPopper, count: templates.filter(t => t.category === 'celebration' || t.category === 'general').length },
  ];

  // Filtered list
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat = selectedCategory === 'all' || tpl.category === selectedCategory || (selectedCategory === 'celebration' && tpl.category === 'general');
      const matchSearch = searchQuery.trim() === '' || tpl.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchActive = !onlyActiveFilter || tpl.is_active;
      return matchCat && matchSearch && matchActive;
    });
  }, [templates, selectedCategory, searchQuery, onlyActiveFilter]);

  // Toggle active status
  const handleToggleActive = async (tpl: CardTemplateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !tpl.is_active;
    try {
      if (window.electronAPI?.toggleCardTemplateActive) {
        await window.electronAPI.toggleCardTemplateActive(tpl.id, newStatus);
      }
      setTemplates((prev) =>
        prev.map((item) => (item.id === tpl.id ? { ...item, is_active: newStatus } : item))
      );
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      category: selectedCategory === 'all' ? 'graduation' : selectedCategory,
      front_image: '',
      back_image: '',
      text_color_scheme: 'gold',
      default_primary_color: '#D4AF37',
      default_accent_color: '#FFFFFF',
      default_qr_position: 'right',
      is_active: true,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (tpl: CardTemplateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTemplate(tpl);
    setFormData({
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      front_image: tpl.front_image,
      back_image: tpl.back_image || '',
      text_color_scheme: tpl.text_color_scheme || 'gold',
      default_primary_color: tpl.default_primary_color || '#D4AF37',
      default_accent_color: tpl.default_accent_color || '#FFFFFF',
      default_qr_position: tpl.default_qr_position || 'right',
      is_active: tpl.is_active,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Delete Template
  const handleDelete = async (tpl: CardTemplateItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`هل أنت متأكد من حذف القالب "${tpl.name}"؟`)) return;

    try {
      if (window.electronAPI?.deleteCardTemplate) {
        const res = await window.electronAPI.deleteCardTemplate(tpl.id);
        if (res.success) {
          setTemplates((prev) => prev.filter((item) => item.id !== tpl.id));
        } else {
          alert(res.error || 'فشل حذف القالب');
        }
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  // Handle Image File Upload (Convert to Base64 data URL)
  const handleImageUpload = (side: 'front' | 'back', file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (side === 'front') {
        setFormData((prev) => ({ ...prev, front_image: dataUrl }));
      } else {
        setFormData((prev) => ({ ...prev, back_image: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Add/Edit Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('يرجى كتابة اسم القالب.');
      return;
    }
    if (!formData.front_image.trim()) {
      setFormError('يرجى رفع أو تحديد صورة الوجه الأمامي للقالب.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (selectedTemplate) {
        // Update
        const res = await window.electronAPI.updateCardTemplate(selectedTemplate.id, {
          name: formData.name,
          category: formData.category,
          front_image: formData.front_image,
          back_image: formData.back_image || null,
          text_color_scheme: formData.text_color_scheme,
          default_primary_color: formData.default_primary_color,
          default_accent_color: formData.default_accent_color,
          default_qr_position: formData.default_qr_position,
          is_active: formData.is_active,
        });

        if (res.success && res.template) {
          setTemplates((prev) =>
            prev.map((item) => (item.id === selectedTemplate.id ? res.template! : item))
          );
          setIsEditModalOpen(false);
        } else {
          setFormError(res.error || 'فشل تحديث القالب');
        }
      } else {
        // Create
        const res = await window.electronAPI.createCardTemplate({
          id: `tpl_custom_${Date.now()}`,
          name: formData.name,
          category: formData.category,
          front_image: formData.front_image,
          back_image: formData.back_image || null,
          thumbnail_url: null,
          text_color_scheme: formData.text_color_scheme,
          default_primary_color: formData.default_primary_color,
          default_accent_color: formData.default_accent_color,
          default_qr_position: formData.default_qr_position,
          is_active: formData.is_active,
          is_builtin: false,
          company_id: null,
        });

        if (res.success && res.template) {
          setTemplates((prev) => [res.template!, ...prev]);
          setIsEditModalOpen(false);
        } else {
          setFormError(res.error || 'فشل إضافة القالب');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ القالب.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle side flip
  const toggleSide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardSideMap((prev) => ({
      ...prev,
      [id]: prev[id] === 'back' ? 'front' : 'back',
    }));
  };

  return (
    <div className={`min-h-screen p-6 lg:p-10 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <span>إدارة قوالب وتصاميم البطاقات</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold">
                    Super Admin
                  </span>
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  إدارة الخلفيات الفاخرة (حفلات التخرج، الزفاف، والمناسبات) مع تحكم كامل بالوجهين والتفعيل والتعطيل للمستخدمين.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTemplates}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة قالب جديد</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-[11px] font-semibold text-slate-400">إجمالي القوالب</p>
            <p className="text-xl font-black text-amber-400 mt-1">{templates.length}</p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-[11px] font-semibold text-slate-400">قوالب التخرج 🎓</p>
            <p className="text-xl font-black text-blue-400 mt-1">
              {templates.filter(t => t.category === 'graduation').length}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-[11px] font-semibold text-slate-400">قوالب الزفاف والملكة 💍</p>
            <p className="text-xl font-black text-rose-400 mt-1">
              {templates.filter(t => t.category === 'wedding').length}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className="text-[11px] font-semibold text-slate-400">القوالب النشطة (تظهر للعملاء)</p>
            <p className="text-xl font-black text-emerald-400 mt-1">
              {templates.filter(t => t.is_active).length}
            </p>
          </div>
        </div>

        {/* Filters & Category Tabs */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories */}
          <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-200/70 border-slate-300'
          }`}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Active Filter Toggle */}
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center min-w-[240px] rounded-xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث عن قالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={() => setOnlyActiveFilter(!onlyActiveFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                onlyActiveFilter
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-bold'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>النشطة فقط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400 font-medium">جارٍ تحميل مكتبة القوالب...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed text-center ${
            isDark ? 'bg-slate-900/30 border-slate-800 text-slate-400' : 'bg-white/60 border-slate-300 text-slate-600'
          }`}>
            <Sparkles className="w-12 h-12 text-slate-500 mb-3 opacity-40" />
            <h3 className="text-base font-bold">لا توجد قوالب تطابق خيارات البحث</h3>
            <p className="text-xs mt-1 text-slate-500 max-w-sm">
              يمكنك إضافة قالب جديد مخصص أو تغيير تصنيف الفلتر لعرض القوالب المتاحة.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-400 cursor-pointer"
            >
              إضافة قالب الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => {
              const currentSide = cardSideMap[tpl.id] || 'front';
              const displayImage = currentSide === 'back' && tpl.back_image ? tpl.back_image : tpl.front_image;

              return (
                <div
                  key={tpl.id}
                  className={`group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl ${
                    tpl.is_active
                      ? isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
                        : 'bg-white border-slate-200 hover:border-amber-500/40 shadow-slate-200'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-100 border-slate-300 opacity-60'
                  }`}
                >
                  {/* Template Card Visual Preview Header */}
                  <div className="relative w-full aspect-[2.4/1] bg-slate-950 overflow-hidden border-b border-slate-800/60">
                    <img
                      src={displayImage}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />

                    {/* Side Indicator Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-md">
                        {currentSide === 'front' ? 'الوجه الأمامي' : 'الوجه الخلفي'}
                      </span>
                    </div>

                    {/* Active / Inactive Badge on Top Left */}
                    <div className="absolute top-3 left-3 z-10">
                      <button
                        onClick={(e) => handleToggleActive(tpl, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border shadow-md transition-all cursor-pointer ${
                          tpl.is_active
                            ? 'bg-emerald-950/85 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900'
                            : 'bg-rose-950/85 text-rose-400 border-rose-500/40 hover:bg-rose-900'
                        }`}
                        title="انقر لتفعيل أو تعطيل القالب"
                      >
                        {tpl.is_active ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>مفعل (يظهر للمستخدمين)</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 stroke-[3]" />
                            <span>معطل (مخفي)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Flip Front/Back Button inside Preview */}
                    {tpl.back_image && (
                      <button
                        onClick={(e) => toggleSide(tpl.id, e)}
                        className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-slate-700 shadow-md transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        <span>قلب للوجه الآخر</span>
                      </button>
                    )}

                    {/* Quick Preview Button */}
                    <button
                      onClick={() => {
                        setPreviewTemplate(tpl);
                        setPreviewSide('front');
                        setIsPreviewModalOpen(true);
                      }}
                      className="absolute bottom-3 left-3 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 shadow-md transition-all cursor-pointer"
                      title="معاينة كاملة مع نصوص تجريبية"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Details & Action Footer */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          tpl.category === 'graduation'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : tpl.category === 'wedding'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {tpl.category === 'graduation' ? 'حفل تخرج 🎓' : tpl.category === 'wedding' ? 'زفاف وملكة 💍' : 'مناسبة عامة 🏛️'}
                        </span>

                        {tpl.is_builtin && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            قالب ملكي مدمج
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm leading-snug line-clamp-1 mb-1">
                        {tpl.name}
                      </h3>

                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>لون النص: <strong className="text-amber-400">{tpl.text_color_scheme === 'gold' ? 'ذهبي ملكي' : tpl.text_color_scheme === 'dark' ? 'داكن كلاسيكي' : 'أبيض ناصع'}</strong></span>
                        <span>•</span>
                        <span>الباركود: <strong className="text-slate-300">{tpl.default_qr_position === 'left' ? 'يسار' : tpl.default_qr_position === 'center' ? 'وسط' : 'يمين'}</strong></span>
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(tpl, e)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                          title="تعديل القالب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(tpl, e)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-rose-950/40 border-rose-800/50 text-rose-400 hover:bg-rose-900/60'
                              : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                          }`}
                          title="حذف القالب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Fast Active Status Toggle Button */}
                      <button
                        onClick={(e) => handleToggleActive(tpl, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          tpl.is_active
                            ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tpl.is_active ? 'تعطيل القالب' : 'تفعيل القالب'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT TEMPLATE MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-8 ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedTemplate ? 'تعديل بيانات القالب' : 'إضافة قالب بطاقة جديد'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    قم برفع صورة الوجهين الأمامي والخلفي وضبط موضع النصوص والباركود.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم القالب *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حفل تخرج أسود وذهبي ملكي"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تصنيف المناسبة *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="graduation">حفلات التخرج (Graduation 🎓)</option>
                    <option value="wedding">حفلات الزفاف والملكة (Wedding 💍)</option>
                    <option value="dinner">عشاء ومآدب رسمية (Dinner 🍽️)</option>
                    <option value="celebration">احتفالات ومؤتمرات (Celebration 🏛️)</option>
                    <option value="general">دعوات عامة مخصصة (General 🎫)</option>
                  </select>
                </div>
              </div>

              {/* Upload Front & Back Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Front Image */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>صورة الوجه الأمامي (Front Image) *</span>
                    <span className="text-[10px] text-amber-400 font-normal">النسبة الموصى بها 2.4:1</span>
                  </label>

                  <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[160px] transition-all overflow-hidden ${
                    formData.front_image
                      ? 'border-amber-500/50 bg-slate-950'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}>
                    {formData.front_image ? (
                      <div className="relative w-full aspect-[2.4/1] rounded-xl overflow-hidden group">
                        <img src={formData.front_image} alt="Front Preview" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold gap-1">
                          <Upload className="w-5 h-5 text-amber-400" />
                          <span>تغيير الصورة</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('front', e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full">
                        <Upload className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
                        <span className="text-xs font-bold text-slate-300">انقر لرفع خلفية الوجه الأمامي</span>
                        <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, SVG عالية الدقة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload('front', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>صورة الوجه الخلفي (Back Image)</span>
                    <span className="text-[10px] text-slate-400 font-normal">اختياري للطباعة المزدوجة</span>
                  </label>

                  <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[160px] transition-all overflow-hidden ${
                    formData.back_image
                      ? 'border-amber-500/50 bg-slate-950'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}>
                    {formData.back_image ? (
                      <div className="relative w-full aspect-[2.4/1] rounded-xl overflow-hidden group">
                        <img src={formData.back_image} alt="Back Preview" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold gap-1">
                          <Upload className="w-5 h-5 text-amber-400" />
                          <span>تغيير الصورة</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('back', e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full">
                        <Upload className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
                        <span className="text-xs font-bold text-slate-300">انقر لرفع خلفية الوجه الخلفي</span>
                        <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, SVG عالية الدقة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload('back', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Styling & Color Palette Controls */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>تخصيص ألوان النصوص والباركود الافتراضية</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      نظام ألوان النصوص
                    </label>
                    <select
                      value={formData.text_color_scheme}
                      onChange={(e: any) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          text_color_scheme: val,
                          default_primary_color: val === 'gold' ? '#D4AF37' : val === 'dark' ? '#1E293B' : '#FFFFFF',
                          default_accent_color: val === 'gold' ? '#FFFFFF' : val === 'dark' ? '#8C6204' : '#F5E6C8',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none"
                    >
                      <option value="gold">ذهبي ملكي (للخلفيات الداكنة)</option>
                      <option value="dark">داكن كلاسيكي (للخلفيات الفاتحة/العاجية)</option>
                      <option value="light">أبيض ناصع</option>
                      <option value="custom">مخصص يدوي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      موضع الباركود الافتراضي
                    </label>
                    <select
                      value={formData.default_qr_position}
                      onChange={(e: any) => setFormData({ ...formData, default_qr_position: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none"
                    >
                      <option value="right">الجهة اليمنى (Right)</option>
                      <option value="left">الجهة اليسرى (Left)</option>
                      <option value="center">المنتصف (Center)</option>
                      <option value="bottom">الأسفل (Bottom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      حالة الظهور والتفعيل
                    </label>
                    <label className="flex items-center gap-2.5 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200">
                        تفعيل القالب (يظهر في خيارات الطباعة)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  <span>{selectedTemplate ? 'حفظ التعديلات' : 'إضافة القالب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>معاينة حية للقالب:</span>
                  <span className="text-amber-400">{previewTemplate.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  معاينة إسقاط النصوص الديناميكية والباركود والترحيب فوق خلفية القالب.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {previewTemplate.back_image && (
                  <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => setPreviewSide('front')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewSide === 'front' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الوجه الأمامي
                    </button>
                    <button
                      onClick={() => setPreviewSide('back')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewSide === 'back' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الوجه الخلفي
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Canvas Preview Frame */}
            <div className="p-8 flex items-center justify-center bg-slate-900/50">
              <div className="relative w-full aspect-[2.4/1] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <img
                  src={previewSide === 'back' && previewTemplate.back_image ? previewTemplate.back_image : previewTemplate.front_image}
                  alt={previewTemplate.name}
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Sample Text Elements */}
                {previewSide === 'front' ? (
                  <div className="absolute inset-0 p-8 flex items-center justify-between pointer-events-none">
                    {/* Left or Right Content depending on layout */}
                    <div className="flex-1 pr-6 flex flex-col justify-center" style={{ color: previewTemplate.default_primary_color || '#D4AF37' }}>
                      <span className="text-[11px] font-bold tracking-widest uppercase opacity-80" style={{ color: previewTemplate.default_accent_color || '#FFFFFF' }}>
                        {previewTemplate.category === 'graduation' ? 'حفل تخرج الدفعة 2026' : 'دعوة زفاف فاخرة'}
                      </span>
                      <h2 className="text-2xl font-black mt-1 leading-tight" style={{ color: previewTemplate.default_primary_color || '#D4AF37' }}>
                        {previewTemplate.category === 'graduation' ? 'المهندس / ريان أسامة' : 'أحمد سالم & سارة المنصور'}
                      </h2>
                      <p className="text-xs font-semibold mt-2 opacity-90" style={{ color: previewTemplate.default_accent_color || '#FFFFFF' }}>
                        يسرنا دعوتكم لمشاركتنا أجمل اللحظات وأسعدها
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] font-bold opacity-80" style={{ color: previewTemplate.default_accent_color || '#FFFFFF' }}>
                        <span>📍 قاعة المملكة الكبرى</span>
                        <span>⏰ 8:00 مساءً</span>
                        <span>📅 الخميس 24 أكتوبر</span>
                      </div>
                    </div>

                    {/* QR Code Sample Box */}
                    <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <QrCode className="w-20 h-20 text-slate-950" />
                      <span className="text-[10px] font-black text-slate-950 mt-1">#INV-001</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center pointer-events-none" style={{ color: previewTemplate.default_primary_color || '#D4AF37' }}>
                    <h3 className="text-xl font-black mb-2" style={{ color: previewTemplate.default_primary_color || '#D4AF37' }}>
                      {previewTemplate.category === 'graduation' ? 'ألف مبروك التخرج والتفوق' : 'شرفتمونا بحضوركم الكريم'}
                    </h3>
                    <p className="text-xs max-w-md font-semibold opacity-90" style={{ color: previewTemplate.default_accent_color || '#FFFFFF' }}>
                      نتمنى لكم قضاء أوقات سعيدة وذكرى تدوم في قلوبنا جميعاً.
                    </p>
                    <span className="mt-4 text-[10px] tracking-wider uppercase font-bold opacity-70">
                      A Special Day • A Lasting Memory
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
