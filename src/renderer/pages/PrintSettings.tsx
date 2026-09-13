import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  FileDown, 
  Eye, 
  Check, 
  Scissors, 
  LayoutGrid, 
  GraduationCap, 
  Heart, 
  Utensils, 
  PartyPopper, 
  Sparkles, 
  MapPin, 
  Clock, 
  Calendar,
  Upload,
  Move,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  AlertCircle,
  X,
  Palette
} from 'lucide-react';
import { Event, Invitation, PrintSettings, CardTemplateType, CardColorScheme } from '../../types';
import { api } from '../utils/apiBridge';

export const getColorPaletteStyles = (
  scheme: CardColorScheme = 'default',
  customPrimary?: string,
  customAccent?: string
) => {
  switch (scheme) {
    case 'black_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#18181b', // Pure dark charcoal/black
        cornerBorder: '#71717a', // Slate/zinc border
        cornerIcon: '#a1a1aa',
        frameBorderOuter: 'rgba(24, 24, 27, 0.8)',
        frameBorderInner: 'rgba(113, 113, 122, 0.5)',
        headerText: '#09090b',
        badgeBg: '#f4f4f5',
        badgeBorder: '#18181b',
        badgeText: '#09090b',
        accentText: '#18181b',
        qrBorder: '#18181b',
        qrBoxBg: '#ffffff',
        subText: '#52525b',
        divider: '#e4e4e7',
      };
    case 'blue_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#1e3a8a', // Royal deep blue
        cornerBorder: '#38bdf8', // Bright azure border
        cornerIcon: '#7dd3fc',
        frameBorderOuter: 'rgba(30, 58, 138, 0.8)',
        frameBorderInner: 'rgba(96, 165, 250, 0.5)',
        headerText: '#1e40af',
        badgeBg: '#eff6ff',
        badgeBorder: '#2563eb',
        badgeText: '#1e3a8a',
        accentText: '#1d4ed8',
        qrBorder: '#2563eb',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#bfdbfe',
      };
    case 'emerald_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#064e3b', // Emerald deep
        cornerBorder: '#34d399',
        cornerIcon: '#6ee7b7',
        frameBorderOuter: 'rgba(5, 150, 105, 0.8)',
        frameBorderInner: 'rgba(16, 185, 129, 0.5)',
        headerText: '#065f46',
        badgeBg: '#ecfdf5',
        badgeBorder: '#059669',
        badgeText: '#064e3b',
        accentText: '#047857',
        qrBorder: '#059669',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#a7f3d0',
      };
    case 'burgundy':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#881337', // Burgundy
        cornerBorder: '#fb7185',
        cornerIcon: '#fda4af',
        frameBorderOuter: 'rgba(190, 18, 60, 0.8)',
        frameBorderInner: 'rgba(244, 63, 94, 0.5)',
        headerText: '#9f1239',
        badgeBg: '#fff1f2',
        badgeBorder: '#e11d48',
        badgeText: '#881337',
        accentText: '#be123c',
        qrBorder: '#e11d48',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#fecdd3',
      };
    case 'violet':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#581c87', // Violet
        cornerBorder: '#c084fc',
        cornerIcon: '#d8b4fe',
        frameBorderOuter: 'rgba(126, 34, 206, 0.8)',
        frameBorderInner: 'rgba(168, 85, 247, 0.5)',
        headerText: '#6b21a8',
        badgeBg: '#faf5ff',
        badgeBorder: '#9333ea',
        badgeText: '#581c87',
        accentText: '#7e22ce',
        qrBorder: '#9333ea',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#e9d5ff',
      };
    case 'custom':
      const pri = customPrimary || '#0f172a';
      const acc = customAccent || '#b4821e';
      return {
        cardBg: '#FFFFFF',
        cornerBg: pri,
        cornerBorder: acc,
        cornerIcon: acc,
        frameBorderOuter: pri,
        frameBorderInner: acc,
        headerText: pri,
        badgeBg: '#f8fafc',
        badgeBorder: acc,
        badgeText: pri,
        accentText: pri,
        qrBorder: acc,
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#cbd5e1',
      };
    case 'default':
    default:
      return {
        cardBg: '#FCF9F2',
        cornerBg: '#081329',
        cornerBorder: '#fbbf24',
        cornerIcon: '#fde68a',
        frameBorderOuter: 'rgba(245, 158, 11, 0.7)',
        frameBorderInner: 'rgba(251, 191, 36, 0.4)',
        headerText: '#92400e',
        badgeBg: '#fffbeb',
        badgeBorder: '#f59e0b',
        badgeText: '#0f172a',
        accentText: '#78350f',
        qrBorder: '#f59e0b',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: 'rgba(254, 215, 170, 0.8)',
      };
  }
};

interface PrintSettingsPageProps {
  activeEvent: Event | null;
  invitations: Invitation[];
}

export const PrintSettingsPage: React.FC<PrintSettingsPageProps> = ({ activeEvent, invitations }) => {
  // Preview mode: 'single' (huge clear card) or 'sheet' (full A4 page)
  const [previewMode, setPreviewMode] = useState<'single' | 'sheet'>('single');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Print Scope: All cards (General invitation) OR specific graduate filter
  const [selectedGraduateFilter, setSelectedGraduateFilter] = useState<string>('ALL');

  // Extract unique graduate names
  const graduatesList = Array.from(
    new Set(
      invitations
        .map((inv) => inv.graduate_name)
        .filter((name): name is string => Boolean(name && name.trim()))
    )
  );

  // Filter invitations according to selected print scope
  const effectiveInvitations = selectedGraduateFilter === 'ALL'
    ? invitations
    : invitations.filter((inv) => inv.graduate_name === selectedGraduateFilter);

  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    columns: 3,
    rows: 4,
    cardWidth: 58,
    cardHeight: 65,
    gapX: 4,
    gapY: 4,
    marginX: 10,
    marginY: 10,
    showEventName: true,
    showGuestName: true,
    showInvitationNumber: true,
    showCropMarks: true,
    showVenue: true,
    showTime: true,
    showDate: true,
    venueText: activeEvent?.venue || '',
    timeText: activeEvent?.time || '08:00 مساءً',
    dateText: activeEvent?.date || '',
    welcomeText: activeEvent?.eventType === 'graduation' ? 'حَفْلُ تَخَرُّج' : 'أهلاً بكم في حفلنا',
    customSubtitle: 'بكم تكتمل الفرحة .. وحضوركم يشرّفنا',
    cardTheme: (activeEvent?.eventType === 'graduation' ? 'royal_graduation' : (activeEvent?.eventType as CardTemplateType)) || 'wedding',
    colorScheme: 'default',
    customPrimaryColor: '#0f172a',
    customAccentColor: '#d97706',
    qrPosition: 'center',
    isGeneralInvitation: true,
    customCardImage: null,
    customQrX: 50,
    customQrY: 65,
    customQrSize: 30,
    customShowTextOverlay: false,
  });

  const [previewSampleQr, setPreviewSampleQr] = useState<string>('');
  const [currentSheetPage, setCurrentSheetPage] = useState<number>(0);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset index if out of bounds after filtering
  useEffect(() => {
    if (currentCardIndex >= effectiveInvitations.length && effectiveInvitations.length > 0) {
      setCurrentCardIndex(0);
    }
    setCurrentSheetPage(0);
  }, [selectedGraduateFilter, effectiveInvitations.length]);

  // Sync settings when activeEvent changes
  useEffect(() => {
    if (activeEvent) {
      const defaultTheme: CardTemplateType = activeEvent.eventType === 'graduation' 
        ? 'royal_graduation' 
        : ((activeEvent.eventType as CardTemplateType) || 'wedding');

      setSettings((prev) => ({
        ...prev,
        cardTheme: prev.customCardImage ? 'custom' : defaultTheme,
        venueText: activeEvent.venue || prev.venueText,
        timeText: activeEvent.time || prev.timeText,
        dateText: activeEvent.date || prev.dateText,
        welcomeText: defaultTheme === 'royal_graduation' ? 'حَفْلُ تَخَرُّج' : defaultTheme === 'graduation' ? 'أهلاً بكم في حفل تخرج' : defaultTheme === 'dinner' ? 'دعوة لتناول طعام العشاء' : 'أهلاً بكم في حفل زفاف',
      }));
    }
  }, [activeEvent]);

  // Generate sample QR for preview
  useEffect(() => {
    const targetInv = effectiveInvitations[currentCardIndex] || effectiveInvitations[0];
    const token = targetInv ? targetInv.token : 'INV-SAMPLE1234';
    api.generateQrDataUrl(token).then(setPreviewSampleQr);
  }, [effectiveInvitations, currentCardIndex]);

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لإعداد وطباعة الكروت.
      </div>
    );
  }

  // Handle custom image upload from computer
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings({
        ...settings,
        customCardImage: base64,
        cardTheme: 'custom',
        customQrX: 50,
        customQrY: 65,
        customQrSize: 32,
      });
      setPreviewMode('single'); // Switch to large preview to see upload immediately!
      setFeedback({ type: 'success', text: 'تم رفع تصميم الكرت بنجاح! يمكنك الآن تحديد موقع الباركود بدقة.' });
    };
    reader.readAsDataURL(file);
  };

  const removeCustomImage = () => {
    setSettings({
      ...settings,
      customCardImage: null,
      cardTheme: (activeEvent.eventType === 'graduation' ? 'royal_graduation' : (activeEvent.eventType as CardTemplateType)) || 'wedding',
    });
  };

  // Preset templates
  const templateOptions: Array<{ id: CardTemplateType; title: string; subtitle: string; icon: any; bgImage?: string; defaultWelcome: string; defaultSub: string }> = [
    {
      id: 'royal_graduation',
      title: '👑 حفل تخرج ملكي فاخر (كحلي وذهبي)',
      subtitle: 'تصميم مطابق للنموذج الرسمي: خط ديواني مذهب، إكليل الغار، وقبعة التخرج مع إطار باركود هندسي فاخر',
      icon: GraduationCap,
      bgImage: '/templates/graduation_royal_bg.jpg',
      defaultWelcome: 'حَفْلُ تَخَرُّج',
      defaultSub: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
    },
    {
      id: 'graduation',
      title: '🎓 حفل تخرج كلاسيكي (خلفية كحلية)',
      subtitle: 'خلفية كحلية وذهبية فاخرة مع قبعة التخرج وشهادة رسمية',
      icon: GraduationCap,
      bgImage: '/templates/graduation_bg.jpg',
      defaultWelcome: 'أهلاً بكم في حفل تخرج',
      defaultSub: 'بكم تكتمل الفرحة .. وحضوركم يشرّفنا',
    },
    {
      id: 'wedding',
      title: '💍 حفل زفاف ملكي (خلفية عروس وورد)',
      subtitle: 'رسمة عروس راقية مع باقة ورد وإطار ذهبي ملوكي فاخر',
      icon: Heart,
      bgImage: '/templates/wedding_bg.jpg',
      defaultWelcome: 'دعوة لحضور حفل زفاف',
      defaultSub: 'بارك الله لهما وبارك عليهما وجمع بينهما في خير',
    },
    {
      id: 'dinner',
      title: '🍽️ مأدبة عشاء / غداء',
      subtitle: 'طابع زمردي داكن فاخر مع لمسات ذهبية للمناسبات والولائم',
      icon: Utensils,
      defaultWelcome: 'دعوة لتناول طعام العشاء',
      defaultSub: 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة',
    },
    {
      id: 'celebration',
      title: '🎉 احتفال وفعالية رسمية',
      subtitle: 'طابع بنفسجي وعنبري راقي للمؤتمرات والاحتفالات',
      icon: PartyPopper,
      defaultWelcome: 'أهلاً بكم في احتفالنا',
      defaultSub: 'سعداء بحضوركم ومشاركتكم فرحتنا',
    },
    {
      id: 'minimal',
      title: '🏷️ كلاسيكي ميني (Minimal)',
      subtitle: 'تصميم بسيط ومركّز على الـ QR للقص السريع',
      icon: LayoutGrid,
      defaultWelcome: 'مرحبًا بكم',
      defaultSub: 'بطاقة دخول رسمية',
    },
  ];

  // Grid Presets (number of cards per sheet)
  const gridPresets = [
    { label: '12 كرت (3×4)', cols: 3, rows: 4, desc: '9 صفحات لـ 100 كرت' },
    { label: '10 كروت (2×5)', cols: 2, rows: 5, desc: '10 صفحات لـ 100 كرت' },
    { label: '8 كروت (2×4)', cols: 2, rows: 4, desc: '13 صفحة لـ 100 كرت' },
    { label: '6 كروت (2×3)', cols: 2, rows: 3, desc: '17 صفحة لـ 100 كرت' },
    { label: '4 كروت (2×2)', cols: 2, rows: 2, desc: 'كروت كبيرة فاخرة' },
  ];

  const applyGridPreset = (cols: number, rows: number) => {
    setCurrentSheetPage(0);
    setSettings({
      ...settings,
      columns: cols,
      rows: rows,
      cardWidth: 0,
      cardHeight: 0,
    });
  };

  const selectTheme = (themeId: CardTemplateType) => {
    const t = templateOptions.find((opt) => opt.id === themeId);
    setSettings({
      ...settings,
      cardTheme: themeId,
      customCardImage: null, // clear custom image if selecting preset
      welcomeText: t ? t.defaultWelcome : settings.welcomeText,
      customSubtitle: t ? t.defaultSub : settings.customSubtitle,
    });
  };

  const cardsPerPage = settings.columns * settings.rows;
  const totalPages = Math.ceil(effectiveInvitations.length / cardsPerPage) || 1;

  const currentInv = effectiveInvitations[currentCardIndex] || effectiveInvitations[0];
  const currentGuestName = currentInv?.guest_name && currentInv.guest_name.trim() ? currentInv.guest_name.trim() : null;
  const currentGraduateName = !settings.isGeneralInvitation && currentInv?.graduate_name && currentInv.graduate_name.trim() 
    ? currentInv.graduate_name.trim() 
    : null;
  const currentInvNum = currentInv ? currentInv.invitation_number : 1;

  const handleExportPdf = async () => {
    if (effectiveInvitations.length === 0) {
      setFeedback({ type: 'error', text: 'لا توجد كروت في هذا النطاق للتصدير!' });
      return;
    }
    setExporting(true);
    setFeedback(null);
    try {
      const res = await api.exportPdf({
        event: activeEvent,
        invitations: effectiveInvitations,
        printSettings: settings,
      });
      if (res.success) {
        const scopeDesc = selectedGraduateFilter === 'ALL'
          ? `(دعوة عامة - ${effectiveInvitations.length} كرت)`
          : `(كروت الخريج: ${selectedGraduateFilter} - ${effectiveInvitations.length} كرت)`;
        setFeedback({ type: 'success', text: `تم تصدير ملف الـ PDF بنجاح ${scopeDesc} في: ${res.filePath}` });
      } else if (res.error && res.error !== 'تم إلغاء التصدير') {
        setFeedback({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إنشاء ملف الـ PDF' });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (effectiveInvitations.length === 0) {
      setFeedback({ type: 'error', text: 'لا توجد كروت في هذا النطاق للطباعة!' });
      return;
    }
    setPrinting(true);
    setFeedback(null);
    try {
      const res = await api.printPdf({
        event: activeEvent,
        invitations: effectiveInvitations,
        printSettings: settings,
      });
      if (!res.success && res.error) {
        setFeedback({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إرسال أمر الطباعة' });
    } finally {
      setPrinting(false);
    }
  };

  const palette = getColorPaletteStyles(
    settings.colorScheme,
    settings.customPrimaryColor,
    settings.customAccentColor
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hidden File Input for Custom Design Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <span>تصميم وطباعة كروت الـ QR الجماعية</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            اختر قالباً جاهزاً مع خلفيات مصممة (عروس، تخرج)، أو ارفع تصميمك الخاص وحدد مكان الباركود بحرية.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>رفع تصميمك الخاص</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exporting || effectiveInvitations.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>{exporting ? 'جاري الإنشاء...' : 'تصدير PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={printing || effectiveInvitations.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة مباشرة</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Controls (Left) and Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Panel (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">

          {/* PRINT SCOPE FILTER: GENERAL INVITATION (ALL) OR BY GRADUATE */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>نطاق طباعة وتصدير الكروت:</span>
              </label>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                {selectedGraduateFilter === 'ALL'
                  ? `دعوة عامة (${invitations.length} كرت)`
                  : `${effectiveInvitations.length} كروت لهذا الخريج`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option 1: General (All Cards) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedGraduateFilter('ALL');
                  setSettings((prev) => ({
                    ...prev,
                    isGeneralInvitation: true,
                    welcomeText: 'دَعْوَةُ حُضُور',
                  }));
                }}
                className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                  selectedGraduateFilter === 'ALL'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">🌐 دعوة عامة (كل الكروت)</div>
                <div className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                  {invitations.length}
                </div>
              </button>

              {/* Option 2: Filter by Graduate Name */}
              {graduatesList.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedGraduateFilter === 'ALL' ? '' : selectedGraduateFilter}
                    onChange={(e) => {
                      const val = e.target.value || 'ALL';
                      setSelectedGraduateFilter(val);
                      if (val === 'ALL') {
                        setSettings((prev) => ({
                          ...prev,
                          isGeneralInvitation: true,
                          welcomeText: 'دَعْوَةُ حُضُور',
                        }));
                      } else {
                        setSettings((prev) => ({
                          ...prev,
                          isGeneralInvitation: false,
                          welcomeText: activeEvent?.eventType === 'graduation' ? 'حَفْلُ تَخَرُّج' : 'أهلاً بكم في حفلنا',
                        }));
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all bg-slate-900 cursor-pointer ${
                      selectedGraduateFilter !== 'ALL'
                        ? 'border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-sm'
                        : 'border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <option value="" disabled={selectedGraduateFilter !== 'ALL'}>
                      🎓 طباعة حسب اسم الخريج...
                    </option>
                    {graduatesList.map((gradName) => {
                      const count = invitations.filter((i) => i.graduate_name === gradName).length;
                      return (
                        <option key={gradName} value={gradName}>
                          {gradName} ({count} كروت)
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center">
                  لا توجد أسماء خريجين مخصصة
                </div>
              )}
            </div>

            {/* General Invitation Style Options (When Scope is ALL) */}
            {selectedGraduateFilter === 'ALL' && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300">نمط طباعة الكروت:</span>
                  <span className="font-semibold text-amber-400">
                    {settings.isGeneralInvitation ? 'دعوة حضور عامة (بدون أسماء الطلاب)' : 'إظهار اسم كل طالب على كرته'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({
                      ...s,
                      isGeneralInvitation: true,
                      welcomeText: 'دَعْوَةُ حُضُور',
                    }))}
                    className={`p-2 rounded-xl border text-right transition-all flex items-center justify-between ${
                      settings.isGeneralInvitation
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">🎯 دعوة عامة (بدون اسم طالب)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">تظهر كـ "دعوة حضور {activeEvent?.name || 'المناسبة'}"</div>
                    </div>
                    {settings.isGeneralInvitation && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({
                      ...s,
                      isGeneralInvitation: false,
                      welcomeText: activeEvent?.eventType === 'graduation' ? 'حَفْلُ تَخَرُّج' : 'أهلاً بكم في حفلنا',
                    }))}
                    className={`p-2 rounded-xl border text-right transition-all flex items-center justify-between ${
                      !settings.isGeneralInvitation
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">🎓 إظهار اسم كل طالب على كرته</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">طباعة كروت الطلاب مع أسمائهم دفعة واحدة</div>
                    </div>
                    {!settings.isGeneralInvitation && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                </div>
              </div>
            )}

            {selectedGraduateFilter !== 'ALL' && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  مُحدد للطباعة: كروت الخريج <b>{selectedGraduateFilter}</b>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGraduateFilter('ALL');
                    setSettings((prev) => ({
                      ...prev,
                      isGeneralInvitation: true,
                      welcomeText: 'دَعْوَةُ حُضُور',
                    }));
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  إلغاء والعودة لجميع الكروت
                </button>
              </div>
            )}
          </div>
          
          {/* CUSTOM UPLOAD STATUS ALERT */}
          {settings.cardTheme === 'custom' && settings.customCardImage && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">أنت تستخدم تصميم مخصص مرفوع</div>
                  <div className="text-[11px] text-amber-300/80">حدد موقع وحجم الباركود بدقة بالأسفل</div>
                </div>
              </div>
              <button
                onClick={removeCustomImage}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                العودة للقوالب الجاهزة
              </button>
            </div>
          )}

          {/* SECTION 1: CUSTOM QR POSITIONING CONTROLS (IF CUSTOM UPLOAD) */}
          {settings.cardTheme === 'custom' && settings.customCardImage ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                تحديد موضع الباركود فوق التصميم المرفوع:
              </h4>

              {/* Sliders for exact X and Y positioning */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>الموقع الأفقي (يمين - يسار)</span>
                  <span className="font-mono text-amber-400">{settings.customQrX}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={settings.customQrX ?? 50}
                  onChange={(e) => setSettings({ ...settings, customQrX: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>الموقع الرأسي (أعلى - أسفل)</span>
                  <span className="font-mono text-amber-400">{settings.customQrY ?? 65}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={settings.customQrY ?? 65}
                  onChange={(e) => setSettings({ ...settings, customQrY: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>حجم الباركود</span>
                  <span className="font-mono text-amber-400">{settings.customQrSize}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={settings.customQrSize ?? 30}
                  onChange={(e) => setSettings({ ...settings, customQrSize: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Preset quick positions */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">مواقع سريعة جاهزة:</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customQrX: 50, customQrY: 70, customQrSize: 30 })}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    أسفل منتصف
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customQrX: 50, customQrY: 50, customQrSize: 32 })}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    منتصف الكرت
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customQrX: 20, customQrY: 75, customQrSize: 26 })}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    أسفل يسار
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, customQrX: 80, customQrY: 75, customQrSize: 26 })}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    أسفل يمين
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* SECTION 1: TEMPLATE SELECTOR (IF PRESET) */
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                قوالب التصميم مع الخلفيات الفاخرة (عروس، تخرج، مأدبة):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {templateOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = settings.cardTheme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => selectTheme(opt.id)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {opt.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 1.5: COLOR PALETTE SELECTOR */}
          {settings.cardTheme !== 'custom' && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  ألوان وتنسيق القالب (Color Themes):
                </label>
                <span className="text-[10px] text-slate-400">
                  تغيير ألوان البطاقة فورياً
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'default' as const,
                    label: 'كحلي وذهبي ملوكي',
                    desc: 'الأصلي الفاخر (كحلي وذهبي)',
                    primary: '#0f172a',
                    accent: '#d97706',
                    bg: '#FCF9F2',
                  },
                  {
                    id: 'black_white' as const,
                    label: 'أبيض وأسود كلاسيكي',
                    desc: 'أبيض وأسود أنيق ومثالي للطباعة',
                    primary: '#18181b',
                    accent: '#71717a',
                    bg: '#ffffff',
                  },
                  {
                    id: 'blue_white' as const,
                    label: 'أبيض وأزرق ملكي',
                    desc: 'أزرق ملكي ناصع وأبيض',
                    primary: '#1e3a8a',
                    accent: '#0284c7',
                    bg: '#ffffff',
                  },
                  {
                    id: 'emerald_white' as const,
                    label: 'أخضر زمردي وأبيض',
                    desc: 'زمردي راقي مع لمسات نضرة',
                    primary: '#064e3b',
                    accent: '#10b981',
                    bg: '#ffffff',
                  },
                  {
                    id: 'burgundy' as const,
                    label: 'عنابي وماروني فاخر',
                    desc: 'درجات الورد والعنابي الملكي',
                    primary: '#881337',
                    accent: '#e11d48',
                    bg: '#ffffff',
                  },
                  {
                    id: 'violet' as const,
                    label: 'بنفسجي ملكي',
                    desc: 'بنفسجي ملكي فاخر',
                    primary: '#581c87',
                    accent: '#9333ea',
                    bg: '#ffffff',
                  },
                ].map((colorOpt) => {
                  const isSelected = (settings.colorScheme || 'default') === colorOpt.id;
                  return (
                    <button
                      key={colorOpt.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, colorScheme: colorOpt.id })}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-md ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: colorOpt.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: colorOpt.accent }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-sm"
                            style={{ backgroundColor: colorOpt.bg }}
                          />
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                        {colorOpt.label}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">{colorOpt.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Selector toggle */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, colorScheme: settings.colorScheme === 'custom' ? 'default' : 'custom' })}
                  className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                    settings.colorScheme === 'custom'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>تخصيص يدوي للألوان (اختيار درجات خاصة)</span>
                </button>
              </div>

              {settings.colorScheme === 'custom' && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">اللون الأساسي للكرت:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.customPrimaryColor || '#0f172a'}
                        onChange={(e) => setSettings({ ...settings, customPrimaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">{settings.customPrimaryColor || '#0f172a'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">لون الإطار والباركود:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.customAccentColor || '#d97706'}
                        onChange={(e) => setSettings({ ...settings, customAccentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">{settings.customAccentColor || '#d97706'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: GRID PRESET & CARDS PER SHEET */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2">توزيع وتقسيم الصفحة A4:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {gridPresets.map((gp) => (
                <button
                  key={gp.label}
                  type="button"
                  onClick={() => applyGridPreset(gp.cols, gp.rows)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    settings.columns === gp.cols && settings.rows === gp.rows
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div>{gp.label}</div>
                  <div className="text-[9px] text-slate-500 font-normal">{gp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: TEXT FIELDS */}
          {settings.cardTheme !== 'custom' && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-200">البيانات الظاهرة على الكرت:</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عبارة الترحيب</label>
                  <input
                    type="text"
                    value={settings.welcomeText}
                    onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">عبارة الفرحة / الدعوة</label>
                  <input
                    type="text"
                    value={settings.customSubtitle || ''}
                    onChange={(e) => setSettings({ ...settings, customSubtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">موقع القاعة / المكان</label>
                <input
                  type="text"
                  placeholder="مثال: قاعة الاحتفالات الكبرى"
                  value={settings.venueText || ''}
                  onChange={(e) => setSettings({ ...settings, venueText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">التاريخ</label>
                  <input
                    type="text"
                    value={settings.dateText || ''}
                    onChange={(e) => setSettings({ ...settings, dateText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الوقت</label>
                  <input
                    type="text"
                    value={settings.timeText || ''}
                    onChange={(e) => setSettings({ ...settings, timeText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: TOGGLES */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCropMarks}
                onChange={(e) => setSettings({ ...settings, showCropMarks: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Scissors className="w-3.5 h-3.5" />
                إظهار حدود وعلامات القص (Crop Marks) لسهولة التقطيع
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showInvitationNumber}
                onChange={(e) => setSettings({ ...settings, showInvitationNumber: e.target.checked })}
                className="rounded text-amber-500"
              />
              <span>إظهار رقم الدعوة (#001)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEventName}
                onChange={(e) => setSettings({ ...settings, showEventName: e.target.checked })}
                className="rounded text-amber-500"
              />
              <span>إظهار اسم المناسبة أعلى الكرت (للكروت الفردية)</span>
            </label>
          </div>

          {/* SUMMARY INFO & BATCH PRINT ASSURANCE */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span>الكروت في كل صفحة: <b className="text-white">{cardsPerPage} كرت</b></span>
              <span>عدد الصفحات الكلي: <b className="text-white font-mono">{totalPages} صفحات</b> ({effectiveInvitations.length} كرت)</span>
            </div>
            <div className="flex items-start gap-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>طباعة وتصدير دفعة واحدة:</b> عند الضغط على <b>"طباعة مباشرة"</b> أو <b>"تصدير PDF"</b> سيتم إرسال كامل الـ <b>{effectiveInvitations.length} كرت</b> مقسمة تلقائياً على <b>{totalPages} صفحات A4</b> دون الحاجة لطباعتها صفحة صفحة!
              </span>
            </div>
          </div>

        </div>

        {/* Live Interactive Preview Panel (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
          
          {/* Top Preview Controls: Toggle between Single Zoom and Full Sheet */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  previewMode === 'single'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة مكبرة بوضوح</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  previewMode === 'sheet'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>ورقة A4 كاملة ({cardsPerPage} كرت)</span>
              </button>
            </div>

            {/* If Single card view: card navigation */}
            {previewMode === 'single' && effectiveInvitations.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <button
                  onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentCardIndex === 0}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  title="الكرت السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-1 font-bold text-amber-400">
                  {currentCardIndex + 1} / {effectiveInvitations.length}
                </span>
                <button
                  onClick={() => setCurrentCardIndex((prev) => Math.min(effectiveInvitations.length - 1, prev + 1))}
                  disabled={currentCardIndex >= effectiveInvitations.length - 1}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  title="الكرت التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* If Sheet view: Page navigation */}
            {previewMode === 'sheet' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <button
                  onClick={() => setCurrentSheetPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentSheetPage === 0}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-all"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-2 py-0.5 font-bold text-amber-400 bg-slate-950 rounded-lg border border-slate-800">
                  الصفحة {currentSheetPage + 1} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentSheetPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentSheetPage >= totalPages - 1}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-all"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: SINGLE CARD HIGH RESOLUTION CLEAR VIEW            */}
          {/* ======================================================== */}
          {previewMode === 'single' ? (
            <div className="w-full flex flex-col items-center justify-center p-2">
              
              {/* The Card Container */}
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500/50 bg-white text-slate-900 select-none">
                
                {/* 1. If Custom Uploaded Image */}
                {settings.cardTheme === 'custom' && settings.customCardImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={settings.customCardImage}
                      alt="Custom Card Design"
                      className="w-full h-full object-cover"
                    />

                    {/* QR Code placed at user's defined position */}
                    <div
                      className="absolute p-1 bg-white rounded-lg shadow-xl border border-slate-300 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${settings.customQrX ?? 50}%`,
                        top: `${settings.customQrY ?? 65}%`,
                        width: `${(settings.customQrSize ?? 30) * 2.8}px`,
                        height: `${(settings.customQrSize ?? 30) * 2.8}px`,
                      }}
                    >
                      {previewSampleQr ? (
                        <img src={previewSampleQr} alt="QR" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                      {settings.showInvitationNumber && (
                        <div className="text-[9px] font-mono font-bold text-center text-slate-800 mt-0.5">
                          #{String(currentInvNum).padStart(3, '0')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : settings.cardTheme === 'royal_graduation' ? (
                  /* 2. ROYAL GRADUATION LUXURY CARD (مطابق للنموذج الرسمي بجميع لوحات الألوان) */
                  <div
                    className="relative w-full h-full flex flex-col justify-between p-4 text-slate-900 overflow-hidden"
                    style={{ backgroundColor: palette.cardBg }}
                  >
                    
                    {/* Dynamic Corner Filigree Accents (Top-Left & Bottom-Right) */}
                    <div
                      className="absolute -top-6 -left-6 w-24 h-24 rounded-br-[40px] border-r-2 border-b-2 shadow-md flex items-end justify-end p-2 pointer-events-none"
                      style={{ backgroundColor: palette.cornerBg, borderColor: palette.cornerBorder }}
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: palette.cornerIcon }} />
                    </div>
                    <div
                      className="absolute -bottom-6 -right-6 w-24 h-24 rounded-tl-[40px] border-l-2 border-t-2 shadow-md flex items-start justify-start p-2 pointer-events-none"
                      style={{ backgroundColor: palette.cornerBg, borderColor: palette.cornerBorder }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: palette.cornerIcon }} />
                    </div>

                    {/* Double Border Styled Dynamically */}
                    <div className="absolute inset-2.5 rounded-xl border pointer-events-none" style={{ borderColor: palette.frameBorderOuter }} />
                    <div className="absolute inset-3.5 rounded-lg border pointer-events-none" style={{ borderColor: palette.frameBorderInner }} />

                    {/* Top Calligraphy Header */}
                    <div className="relative z-10 text-center pt-2">
                      <div className="inline-flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" style={{ color: palette.cornerIcon }} />
                        <h2
                          className="text-xl font-black tracking-wider drop-shadow-sm font-serif"
                          style={{ color: palette.headerText }}
                        >
                          {settings.welcomeText || (settings.isGeneralInvitation ? 'دَعْوَةُ حُضُور' : 'حَفْلُ تَخَرُّج')}
                        </h2>
                        <Sparkles className="w-3 h-3" style={{ color: palette.cornerIcon }} />
                      </div>

                      {/* Event or Ceremony Name: Only shown at top when graduate/guest name occupies the center badge */}
                      {settings.showEventName && activeEvent && (currentGraduateName || currentGuestName) && (
                        <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                          {activeEvent.name}
                        </div>
                      )}
                    </div>

                    {/* Middle Section: Graduate Name & Invitation Text */}
                    <div className="relative z-10 text-center my-auto space-y-1 px-3">
                      {currentGraduateName ? (
                        <>
                          <div className="text-xs text-slate-700 font-semibold">
                            تتشرف أسرة الخريج
                          </div>
                          <div className="py-0.5">
                            <div
                              className="inline-block px-4 py-1.5 rounded-xl border-2 font-black text-base shadow-sm"
                              style={{
                                backgroundColor: palette.badgeBg,
                                borderColor: palette.badgeBorder,
                                color: palette.badgeText,
                              }}
                            >
                              {currentGraduateName}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold pt-0.5" style={{ color: palette.accentText }}>
                            <span>احتفالاً بتخرج {currentGraduateName}</span>
                            <GraduationCap className="w-4 h-4 inline" style={{ color: palette.accentText }} />
                          </div>
                        </>
                      ) : currentGuestName ? (
                        <>
                          <div className="text-xs text-slate-700 font-semibold">
                            تتشرف الأسرة الكريمة بدعوة
                          </div>
                          <div className="py-0.5">
                            <div
                              className="inline-block px-3 py-1 rounded-lg border font-bold text-xs shadow-sm"
                              style={{
                                backgroundColor: palette.badgeBg,
                                borderColor: palette.badgeBorder,
                                color: palette.badgeText,
                              }}
                            >
                              {currentGuestName}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-700 font-semibold">
                            يسرنا ويشرفنا دعوتكم لحضور
                          </div>
                          <div className="py-0.5">
                            <div
                              className="inline-block px-4 py-1.5 rounded-xl border-2 font-black text-sm shadow-sm"
                              style={{
                                backgroundColor: palette.badgeBg,
                                borderColor: palette.badgeBorder,
                                color: palette.badgeText,
                              }}
                            >
                              {activeEvent?.name || 'حفل التخرج'}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold pt-0.5" style={{ color: palette.accentText }}>
                            <span>أهلاً وسهلاً بضيوفنا الكرام</span>
                            <Sparkles className="w-3.5 h-3.5 inline" style={{ color: palette.accentText }} />
                          </div>
                        </>
                      )}

                      <p className="text-[11px] text-slate-600 font-medium">
                        {settings.customSubtitle || 'بكم تكتمل الفرحة .. وحضوركم يشرّفنا'}
                      </p>
                    </div>

                    {/* Laurel Wreath Details Box: Venue, Date, Time */}
                    <div className="relative z-10 text-center my-auto px-4 py-1">
                      <div
                        className="relative inline-block px-4 py-1.5 rounded-xl bg-white/80 border shadow-sm space-y-0.5 text-xs"
                        style={{ borderColor: palette.frameBorderInner }}
                      >
                        {settings.showVenue && settings.venueText && (
                          <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentText }} />
                            <span>المكان: {settings.venueText}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-700 font-medium">
                          {settings.showDate && settings.dateText && (
                            <span>التاريخ: {settings.dateText}</span>
                          )}
                          {settings.showTime && settings.timeText && (
                            <span>الوقت: {settings.timeText}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Geometric QR Frame with Dynamic Border */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                      <div
                        className="relative p-1.5 rounded-xl shadow-md border-2"
                        style={{ backgroundColor: palette.qrBoxBg, borderColor: palette.qrBorder }}
                      >
                        {previewSampleQr ? (
                          <img src={previewSampleQr} alt="QR Code" className="w-24 h-24 object-contain" />
                        ) : (
                          <div className="w-24 h-24 bg-slate-100" />
                        )}
                      </div>
                      <div className="text-[9px] font-bold mt-1" style={{ color: palette.accentText }}>
                        للدخول يرجى مسح الباركود
                      </div>
                      <div className="text-[8px] text-slate-600">
                        نرجو الحضور مع الدعوة
                      </div>
                    </div>

                    {/* Bottom Details and Invitation Number */}
                    <div
                      className="relative z-10 text-center text-[9px] text-slate-600 border-t pt-1 flex items-center justify-between px-2"
                      style={{ borderTopColor: palette.divider }}
                    >
                      <span>بحضوركم تكتمل فرحتنا</span>
                      {settings.showInvitationNumber && (
                        <span className="font-mono font-bold" style={{ color: palette.accentText }}>
                          #{String(currentInvNum).padStart(3, '0')}
                        </span>
                      )}
                      <span>ليلة من العمر</span>
                    </div>

                  </div>
                ) : (
                  /* 3. Other Preset Templates (Wedding, Classic Graduation, Dinner) */
                  <div className="relative w-full h-full flex flex-col justify-between p-6">
                    
                    {/* Background Artwork Layer */}
                    {settings.cardTheme === 'graduation' && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-95 pointer-events-none"
                        style={{ backgroundImage: `url('/templates/graduation_bg.jpg')` }}
                      />
                    )}

                    {settings.cardTheme === 'wedding' && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-95 pointer-events-none"
                        style={{ backgroundImage: `url('/templates/wedding_bg.jpg')` }}
                      />
                    )}

                    {/* Dark overlay for contrast if graduation */}
                    {settings.cardTheme === 'graduation' && (
                      <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
                    )}

                    {/* Decorative Inner Border */}
                    <div className="absolute inset-3 rounded-xl border border-amber-500/60 pointer-events-none" />

                    {/* Card Content (Relative z-10 for sharp readability) */}
                    <div className="relative z-10 text-center space-y-1">
                      
                      {/* Theme Emblem */}
                      <div className="inline-flex items-center justify-center p-2 rounded-full bg-amber-500/20 text-amber-500 mb-1 border border-amber-400/40">
                        {settings.cardTheme === 'graduation' && <GraduationCap className="w-6 h-6" />}
                        {settings.cardTheme === 'wedding' && <Heart className="w-6 h-6" />}
                        {settings.cardTheme === 'dinner' && <Utensils className="w-6 h-6" />}
                        {settings.cardTheme === 'celebration' && <PartyPopper className="w-6 h-6" />}
                        {settings.cardTheme === 'minimal' && <LayoutGrid className="w-6 h-6" />}
                      </div>

                      {/* Welcome Phrase */}
                      <h3 className={`text-base font-extrabold ${settings.cardTheme === 'graduation' ? 'text-amber-300' : 'text-amber-800'}`}>
                        {settings.welcomeText}
                      </h3>

                      {/* Event Name */}
                      {settings.showEventName && (
                        <h2 className={`text-lg font-black tracking-tight ${settings.cardTheme === 'graduation' ? 'text-white drop-shadow' : 'text-slate-950'}`}>
                          {activeEvent.name}
                        </h2>
                      )}

                      {/* Subtitle */}
                      {settings.customSubtitle && (
                        <p className={`text-xs ${settings.cardTheme === 'graduation' ? 'text-slate-200' : 'text-slate-600'}`}>
                          {settings.customSubtitle}
                        </p>
                      )}

                      {/* Graduate or Guest Name */}
                      {(currentGraduateName || currentGuestName) && (
                        <div className="pt-2">
                          <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-100/90 border border-amber-300 font-bold text-sm text-slate-950 shadow-sm">
                            {currentGraduateName ? `الخريج: ${currentGraduateName}` : currentGuestName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                      <div className="p-2 bg-white rounded-2xl shadow-xl border-2 border-amber-400/60 inline-block">
                        {previewSampleQr ? (
                          <img src={previewSampleQr} alt="QR Code" className="w-28 h-28 object-contain" />
                        ) : (
                          <div className="w-28 h-28 bg-slate-100" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold mt-1.5">
                        يرجى إبراز هذا الكود عند الدخول
                      </span>
                    </div>

                    {/* Bottom Details: Venue, Date, Time */}
                    <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-xl p-2.5 border border-amber-400/30 text-xs text-slate-700 space-y-1 text-center shadow-sm">
                      {settings.showVenue && settings.venueText && (
                        <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{settings.venueText}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600">
                        {settings.showDate && settings.dateText && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>{settings.dateText}</span>
                          </span>
                        )}
                        {settings.showTime && settings.timeText && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{settings.timeText}</span>
                          </span>
                        )}
                      </div>

                      {settings.showInvitationNumber && (
                        <div className="text-[10px] font-mono font-bold text-amber-700 pt-0.5">
                          الدعوة #{String(currentInvNum).padStart(3, '0')}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

              <p className="text-xs text-slate-400 text-center mt-3">
                المعاينة مكبرة بدقة عالية. هذا هو الشكل الدقيق الذي سيظهر على كل كرت عند طباعته.
              </p>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW 2: FULL A4 SHEET (12/8/6/4 CARDS GRID)               */
            /* ======================================================== */
            <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-lg shadow-2xl p-3 aspect-[1/1.414] overflow-hidden select-none border border-slate-300">
              <div
                className="w-full h-full grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${settings.rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: cardsPerPage }).map((_, idx) => {
                  const cardIdx = currentSheetPage * cardsPerPage + idx;
                  const sampleInv = effectiveInvitations[cardIdx];
                  if (!sampleInv && cardIdx >= effectiveInvitations.length) {
                    return (
                      <div
                        key={idx}
                        className="relative p-1 rounded border border-dashed border-slate-300/60 bg-slate-50 flex items-center justify-center text-slate-400 text-[10px]"
                      >
                        (فارغ)
                      </div>
                    );
                  }
                  const invNum = sampleInv ? sampleInv.invitation_number : cardIdx + 1;
                  const gName = sampleInv?.guest_name && sampleInv.guest_name.trim() ? sampleInv.guest_name.trim() : null;
                  const gradName = !settings.isGeneralInvitation && sampleInv?.graduate_name && sampleInv.graduate_name.trim() 
                    ? sampleInv.graduate_name.trim() 
                    : null;

                  return (
                    <div
                      key={idx}
                      className="relative p-1 rounded border border-slate-300 flex flex-col justify-between text-center overflow-hidden transition-colors"
                      style={{ backgroundColor: palette.cardBg }}
                    >
                      {settings.showCropMarks && (
                        <>
                          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-slate-400" />
                          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-slate-400" />
                          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-slate-400" />
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-slate-400" />
                        </>
                      )}

                      {/* Custom Uploaded Background or Preset */}
                      {settings.cardTheme === 'custom' && settings.customCardImage ? (
                        <div className="relative w-full h-full">
                          <img src={settings.customCardImage} alt="Card" className="w-full h-full object-cover" />
                          <div
                            className="absolute p-0.5 bg-white rounded shadow border -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${settings.customQrX ?? 50}%`,
                              top: `${settings.customQrY ?? 65}%`,
                              width: `${(settings.customQrSize ?? 30) * 0.9}px`,
                              height: `${(settings.customQrSize ?? 30) * 0.9}px`,
                            }}
                          >
                            {previewSampleQr && <img src={previewSampleQr} alt="QR" className="w-full h-full object-contain" />}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="leading-tight">
                            <div className="text-[6px] font-bold truncate" style={{ color: palette.headerText }}>
                              {settings.welcomeText || (settings.isGeneralInvitation ? 'دَعْوَةُ حُضُور' : 'حَفْلُ تَخَرُّج')}
                            </div>
                            {settings.showEventName && (
                              <div className="text-[5px] font-extrabold truncate text-slate-800">
                                {activeEvent.name}
                              </div>
                            )}
                            {gradName ? (
                              <div className="text-[5px] font-black truncate" style={{ color: palette.accentText }}>
                                🎓 {gradName}
                              </div>
                            ) : gName ? (
                              <div className="text-[5px] font-bold text-slate-800 truncate">{gName}</div>
                            ) : (
                              <div className="text-[5px] font-bold text-slate-600 truncate">دعوة عامة</div>
                            )}
                          </div>

                          <div className="my-auto flex items-center justify-center">
                            <div className="p-0.5 rounded border inline-block" style={{ backgroundColor: palette.qrBoxBg, borderColor: palette.qrBorder }}>
                              {previewSampleQr && <img src={previewSampleQr} alt="QR" className="w-8 h-8 object-contain" />}
                            </div>
                          </div>

                          <div className="text-[4px] text-slate-600 truncate">
                            {settings.showVenue && settings.venueText && <span>{settings.venueText} • </span>}
                            {settings.showInvitationNumber && <span className="font-bold">#{invNum}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
