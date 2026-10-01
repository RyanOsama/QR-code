import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Printer, 
  FileDown, 
  Eye, 
  Check, 
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
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  AlertCircle,
  X,
  Palette,
  Layers,
  FlipHorizontal,
  Trash2,
  User,
  Users,
  Mail,
  Edit3,
  HelpCircle,
  BookOpen,
  RotateCw
} from 'lucide-react';
import { Event, Invitation, PrintSettings, CardTemplateType, CardColorScheme, CardTemplateItem } from '../../types';
import { api } from '../utils/apiBridge';
import { 
  renderThemeCorners, 
  renderThemeTopCrest, 
  renderWeddingRichBackground, 
  WeddingEtiquetteIcons, 
  SculptedCallaMotif,
  InitialsMonogram,
  GoldenHeartIcon,
  GoldenFooterDivider,
  GoldenFloralFrontBackground,
  GoldenFloralBackBackground
} from '../components/CardEmbroideryTemplates';
import { BackImageOutpaintModal } from '../components/BackImageOutpaintModal';

export const getColorPaletteStyles = (
  scheme: CardColorScheme = 'default',
  customPrimary?: string,
  customAccent?: string,
  theme?: CardTemplateType,
  customBg?: string
) => {
  // Bespoke default palettes for each wedding template
  if (scheme === 'default') {
    if (theme === 'wedding_golden_floral') {
      return {
        cardBg: customBg || '#FCFAF7',
        cornerBg: '#9B783E',
        cornerBorder: customPrimary || '#BFA063',
        cornerIcon: '#EAD397',
        frameBorderOuter: customPrimary || '#BFA063',
        frameBorderInner: '#E3CD97',
        headerText: customAccent || '#2D2319',
        badgeBg: '#EFE8DC',
        badgeBorder: '#D8CAB8',
        badgeText: '#3E3224',
        accentText: customPrimary || '#8C6D34',
        qrBorder: customPrimary || '#CA9E50',
        qrBoxBg: '#FFFFFF',
        subText: '#5A4A38',
        divider: '#D8CAB8',
      };
    }
    if (theme === 'wedding_botanical_purple') {
      return {
        cardBg: '#F9F8F6',
        cornerBg: '#5b21b6',
        cornerBorder: '#7c3aed',
        cornerIcon: '#c4b5fd',
        frameBorderOuter: '#7c3aed',
        frameBorderInner: '#a78bfa',
        headerText: '#5b21b6',
        badgeBg: '#f5f3ff',
        badgeBorder: '#c4b5fd',
        badgeText: '#4c1d95',
        accentText: '#7c3aed',
        qrBorder: '#7c3aed',
        qrBoxBg: '#ffffff',
        subText: '#5b21b6',
        divider: '#e9d5ff',
      };
    }
    if (theme === 'wedding_royal_burgundy') {
      return {
        cardBg: '#FFFDFD',
        cornerBg: '#881337',
        cornerBorder: '#be123c',
        cornerIcon: '#fda4af',
        frameBorderOuter: '#881337',
        frameBorderInner: '#f43f5e',
        headerText: '#881337',
        badgeBg: '#fff1f2',
        badgeBorder: '#fecdd3',
        badgeText: '#881337',
        accentText: '#be123c',
        qrBorder: '#881337',
        qrBoxBg: '#ffffff',
        subText: '#881337',
        divider: '#ffe4e6',
      };
    }
    if (theme === 'wedding_calla_sage') {
      return {
        cardBg: '#FBFDFB',
        cornerBg: '#365314',
        cornerBorder: '#4d7c0f',
        cornerIcon: '#bef264',
        frameBorderOuter: '#65a30d',
        frameBorderInner: '#84cc16',
        headerText: '#365314',
        badgeBg: '#f7fee7',
        badgeBorder: '#d9f99d',
        badgeText: '#365314',
        accentText: '#4d7c0f',
        qrBorder: '#65a30d',
        qrBoxBg: '#ffffff',
        subText: '#365314',
        divider: '#ecfccb',
      };
    }
    if (theme === 'wedding_sculpted_ivory') {
      return {
        cardBg: '#F8F5EE',
        cornerBg: '#57422f',
        cornerBorder: '#786048',
        cornerIcon: '#e7dec8',
        frameBorderOuter: '#b8a692',
        frameBorderInner: '#d5c7b3',
        headerText: '#57422f',
        badgeBg: '#fdfbf7',
        badgeBorder: '#e7dec8',
        badgeText: '#57422f',
        accentText: '#786048',
        qrBorder: '#786048',
        qrBoxBg: '#ffffff',
        subText: '#786048',
        divider: '#d8cab8',
      };
    }
  }

  switch (scheme) {
    case 'black_white':
      return {
        cardBg: '#FAF9F6', // Raw alabaster cotton cardstock
        cornerBg: '#18181b',
        cornerBorder: '#71717a',
        cornerIcon: '#a1a1aa',
        frameBorderOuter: 'rgba(24, 24, 27, 0.85)',
        frameBorderInner: 'rgba(113, 113, 122, 0.55)',
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
        cardBg: '#F8FAFC', // Fine linen white
        cornerBg: '#1e3a8a',
        cornerBorder: '#38bdf8',
        cornerIcon: '#7dd3fc',
        frameBorderOuter: 'rgba(30, 58, 138, 0.85)',
        frameBorderInner: 'rgba(96, 165, 250, 0.55)',
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
        cardBg: '#F7FAF8', // Pearl mint raw cardstock
        cornerBg: '#064e3b',
        cornerBorder: '#34d399',
        cornerIcon: '#6ee7b7',
        frameBorderOuter: 'rgba(5, 150, 105, 0.85)',
        frameBorderInner: 'rgba(16, 185, 129, 0.55)',
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
        cardBg: '#FAF7F8', // Warm rose alabaster
        cornerBg: '#881337',
        cornerBorder: '#fb7185',
        cornerIcon: '#fda4af',
        frameBorderOuter: 'rgba(190, 18, 60, 0.85)',
        frameBorderInner: 'rgba(244, 63, 94, 0.55)',
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
        cardBg: '#FAF8FB', // Lavender mist ivory
        cornerBg: '#581c87',
        cornerBorder: '#c084fc',
        cornerIcon: '#d8b4fe',
        frameBorderOuter: 'rgba(126, 34, 206, 0.85)',
        frameBorderInner: 'rgba(168, 85, 247, 0.55)',
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
        cardBg: '#FAF9F6',
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
        cardBg: '#FCF9F2', // Warm Ivory Royal Gold
        cornerBg: '#081329',
        cornerBorder: '#fbbf24',
        cornerIcon: '#fde68a',
        frameBorderOuter: 'rgba(245, 158, 11, 0.85)',
        frameBorderInner: 'rgba(251, 191, 36, 0.55)',
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

interface TemplateOption {
  id: CardTemplateType;
  category: 'wedding' | 'graduation' | 'dinner' | 'celebration' | 'minimal';
  title: string;
  subtitle: string;
  icon: any;
  defaultWelcome: string;
  defaultSub: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  // 0. Golden Floral Wedding (المميز الفاخر المطابق للصورة)
  {
    id: 'wedding_golden_floral',
    category: 'wedding',
    title: '🌿 الزفاف الذهبي الملكي (المميز)',
    subtitle: 'موجة ذهبية نباتية، مونوغرام حرفي العروسين، تفاصيل ثلاثية بأيقونات، وتصميم فاخر بوجهين (مطابق للصورة)',
    icon: Sparkles,
    defaultWelcome: 'دعوة لحضور حفل زفاف',
    defaultSub: 'نتشرف بدعوتكم لحضور حفل زفافنا',
  },
  // 1. Photo 1: Lavender Botanical Floral
  {
    id: 'wedding_botanical_purple',
    category: 'wedding',
    title: '💐 الزهور البنفسجية والكتان الفاخر',
    subtitle: 'خلفية كتان خام مع باقة زهور مائية بنفسجية وأوراق ذهبية، رمز العروسين وبطاقة دخول (مثل الصورة 1)',
    icon: Sparkles,
    defaultWelcome: 'بـطـاقـة دخـول',
    defaultSub: 'الرجاء تمرير الباركود على القارئ للدخول - للاستخدام مرة واحدة فقط',
  },
  // 2. Photo 2: Royal Burgundy Rose & Damask Monogram
  {
    id: 'wedding_royal_burgundy',
    category: 'wedding',
    title: '🌹 العنابي الملكي المورد والمونوغرام',
    subtitle: 'نقوش ورود دمشقية رقيقة ومونوغرام ملكي دائري، أسماء العروسين بالعنابي، وأيقونات الإتيكيت (مثل الصورة 2)',
    icon: Heart,
    defaultWelcome: 'دعوة زفاف كريمة',
    defaultSub: 'الحمد لله على الفرح الذي يعانق أرواحنا .. بكل الحب والود ندعوكم لحضور زفاف',
  },
  // 3. Photo 3: Sage & White Calla Lily
  {
    id: 'wedding_calla_sage',
    category: 'wedding',
    title: '🌿 زنبق الكالا الزمردي الهادئ',
    subtitle: 'زهور زنبق الكالا الطبيعية وأوراق زمردية، مخطوطة دعوة زفاف، وأيقونات دائرية راقية (مثل الصورة 3)',
    icon: Sparkles,
    defaultWelcome: 'دعوة زفاف',
    defaultSub: 'بكل ما تحمله مشاعرنا من حب ولأن فرحتنا تكتمل بمن نحب يتشرف',
  },
  // 4. Photo 4: Sculpted 3D Ivory & Calla
  {
    id: 'wedding_sculpted_ivory',
    category: 'wedding',
    title: '🏛️ المنحوتة العاجية ثلاثية الأبعاد',
    subtitle: 'تموجات نحت عاجية 3D وزهرة كالا وسطية بين الاسمين، عبارة عقد قران ودعاء مأثور (مثل الصورة 4)',
    icon: Layers,
    defaultWelcome: 'تم بحمد الله عقد قران',
    defaultSub: 'اللهم أتمّ عليهم السعادة والهناء',
  },

  // Classic Wedding Embroidery Styles
  {
    id: 'wedding_andalusian',
    category: 'wedding',
    title: '👑 التطريز الأندلسي الملكي',
    subtitle: 'أقواس وزخارف أندلسية مطرزة بخيوط الذهب، كرت عاجي خام كلاسيكي',
    icon: Sparkles,
    defaultWelcome: 'دعوة لحضور حفل زفاف',
    defaultSub: 'بارك الله لهما وبارك عليهما وجمع بينهما في خير',
  },
  {
    id: 'wedding_damask',
    category: 'wedding',
    title: '⚜️ تطريز الدانتيل الدمشقي الفاخر',
    subtitle: 'نقوش نباتية وزهور دمشقية مطرزة بأناقة عريقة على ورق خام فاخر',
    icon: Heart,
    defaultWelcome: 'دعوة زفاف كريمة',
    defaultSub: 'دامت دياركم عامرة بالأفراح والمسرات ونبتهج بحضوركم',
  },
  {
    id: 'wedding_imperial',
    category: 'wedding',
    title: '🏛️ التطريز الإمبراطوري المذهب',
    subtitle: 'إطار كلاسيكي مزدوج محاك بخيوط مذهبة مع زوايا إمبراطورية فخمة',
    icon: Layers,
    defaultWelcome: 'دعوة لحضور حفل القران المبارك',
    defaultSub: 'يشرّفنا ويسعدنا حضوركم وتلبية دعوتنا الكريمة',
  },
  {
    id: 'wedding_minimal_luxury',
    category: 'wedding',
    title: '✨ تطريز الحرير العاجي الكلاسيكي',
    subtitle: 'تصميم كلاسيكي ناعم بنقشة تطريز خطية راقية وبساطة مترفة',
    icon: Sparkles,
    defaultWelcome: 'دعوة لحضور حفل زفاف',
    defaultSub: 'بحضوركم تكتمل الأفراح ونسعد بتشريفكم الكريم',
  },

  // Graduation Templates (حفل تخرج)
  {
    id: 'graduation_royal',
    category: 'graduation',
    title: '🎓 التطريز الأكاديمي الملكي',
    subtitle: 'إكليل الغار الذهبي وإطار تخرج شرفي رسمي بوجهين',
    icon: GraduationCap,
    defaultWelcome: 'حَفْلُ تَخَرُّجْ وتكريم',
    defaultSub: 'يسرنا دعوتكم لمشاركتنا فرحة التخرج والنجاح والتفوق',
  },
  {
    id: 'graduation_classic',
    category: 'graduation',
    title: '📜 تطريز وشاح الشرف الكلاسيكي',
    subtitle: 'تصميم أكاديمي كلاسيكي وقبعة تخرج مطرزة بوقار',
    icon: GraduationCap,
    defaultWelcome: 'حفل تخرج الدفعة المباركة',
    defaultSub: 'فرحة نجاح تتوج مسيرة السنين ونسعد بمشاركتكم لنا',
  },

  // Dinner Templates (مأدبة عشاء)
  {
    id: 'dinner_royal',
    category: 'dinner',
    title: '🍽️ مأدبة الضيافة الملكية',
    subtitle: 'تطريز مذهب فاخر للولائم والمناسبات الكبرى بوجهين',
    icon: Utensils,
    defaultWelcome: 'دعوة لتناول طعام العشاء',
    defaultSub: 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة وطاب ممشاكم',
  },
  {
    id: 'dinner_classic',
    category: 'dinner',
    title: '✨ مأدبة عشاء كلاسيكية هادئة',
    subtitle: 'إطار كرم وضيافة راقي وتصميم دافئ للاحتفاء بالضيوف',
    icon: Utensils,
    defaultWelcome: 'دعوة كريمة لتناول العشاء',
    defaultSub: 'أهلاً وسهلاً بكم وطاب ممشاكم بيننا بحلولكم الكريمة',
  },
];

export function getTemplateDefaultTexts(theme: CardTemplateType, event?: Event | null) {
  let defaultWelcome = 'دعوة لحضور حفل زفاف';
  let defaultSub = 'بارك الله لهما وبارك عليهما وجمع بينهما في خير';
  let defaultGuestPrefix = 'تتشرف الأسرة الكريمة بدعوة المكرم/ـة:';
  let defaultGeneralNotice = 'يسرنا ويشرفنا دعوتكم الكريمة لحضور';
  let defaultQrInstruction = 'يرجى إبراز الرمز للدخول';
  let defaultFooterNote = 'بحضوركم تكتمل فرحتنا';
  let defaultBackTitle = event?.name || 'دعوة زفاف رسمية';
  let defaultBackHeader = 'بارك الله لهما وجمع بينهما في خير';
  let defaultBackMessage = 'حضوركم يشرّفنا وتكتمل به فرحتنا وسرورنا';
  let defaultBackBadge = 'بطاقة دعوة خاصة - لا تكرر';

  if (theme === 'wedding_golden_floral') {
    defaultWelcome = 'دعوة لحضور حفل زفاف';
    defaultSub = 'نتشرف بدعوتكم لحضور حفل زفافنا';
    defaultGuestPrefix = 'الأستاذ/';
    defaultGeneralNotice = 'نتشرف بدعوتكم الكريمة لحضور حفل زفافنا';
    defaultQrInstruction = 'يرجى إبراز الكود للدخول';
    defaultFooterNote = 'بحضوركم تكتمل فرحتنا';
    defaultBackTitle = 'بارك الله لهما وبارك عليهما وجمع بينهما في خير';
    defaultBackHeader = 'شكراً لكم على تلبية الدعوة';
    defaultBackMessage = '';
    defaultBackBadge = '';
  } else if (theme === 'wedding_botanical_purple') {
    defaultWelcome = 'بـطـاقـة دخـول';
    defaultSub = 'الرجاء تمرير الباركود على القارئ للدخول';
    defaultFooterNote = 'للاستخدام مرة واحدة فقط';
    defaultQrInstruction = 'الرجاء تمرير الباركود للدخول';
    defaultBackTitle = event?.name || 'بطاقة دخول حفل زفاف';
    defaultBackHeader = 'بارك الله لهما وبارك عليهما وجمع بينهما في خير';
    defaultBackMessage = 'حضوركم يشرّفنا وتكتمل به فرحتنا وسرورنا';
    defaultBackBadge = 'بطاقة دخول خاصة';
  } else if (theme === 'wedding_royal_burgundy') {
    defaultWelcome = 'أذن لمراسيم الفرح أن تشرع أبوابها';
    defaultSub = 'الحمد لله على الفرح الذي يعانق أرواحنا .. بكل الحب والود ندعوكم لحضور زفاف';
    defaultFooterNote = 'وبحضوركم يتم لنا الفرح والسرور';
    defaultQrInstruction = 'يرجى إبراز الرمز للدخول';
    defaultBackTitle = event?.name || 'دعوة زفاف ملكية';
    defaultBackHeader = 'اللهم بارك لهما القادم من حياتهما';
    defaultBackMessage = 'دامت دياركم عامرة بالأفراح والمسرات ونبتهج بحضوركم وتشريفكم';
    defaultBackBadge = 'بطاقة زفاف ملكية';
  } else if (theme === 'wedding_calla_sage') {
    defaultWelcome = 'دعوة زفاف';
    defaultSub = 'بكل ما تحمله مشاعرنا من حب ولأن فرحتنا تكتمل بمن نحب يتشرف بدعوتكم';
    defaultFooterNote = 'حضوركم يشرّفنا ويسعدنا';
    defaultQrInstruction = 'إبراز الرمز عند الاستقبال';
    defaultBackTitle = event?.name || 'دعوة زفاف كريمة';
    defaultBackHeader = 'بارك الله لهما وجمع بينهما في خير';
    defaultBackMessage = 'يسعدنا ويشرفنا تشريفكم لحضور حفل الزفاف المبارك';
    defaultBackBadge = 'بطاقة دعوة زفاف';
  } else if (theme === 'wedding_sculpted_ivory') {
    defaultWelcome = 'تم بحمد الله عقد قران';
    defaultSub = 'اللهم أتمّ عليهم السعادة والهناء';
    defaultFooterNote = 'اللهم أتمّ عليهم السعادة والهناء والسرور';
    defaultQrInstruction = 'يرجى إبراز الرمز للدخول';
    defaultBackTitle = event?.name || 'عقد قران مبارك';
    defaultBackHeader = 'تم بحمد الله عقد قران';
    defaultBackMessage = 'حضوركم يشرّفنا وتكتمل به فرحتنا وسرورنا';
    defaultBackBadge = 'بطاقة عقد قران';
  } else if (theme === 'wedding_damask') {
    defaultWelcome = 'دعوة زفاف كريمة';
    defaultSub = 'دامت دياركم عامرة بالأفراح والمسرات ونبتهج بحضوركم';
    defaultFooterNote = 'حضوركم يزيّن ليلتنا';
    defaultBackTitle = event?.name || 'دعوة زفاف كريمة';
    defaultBackHeader = 'دامت دياركم عامرة بالأفراح والمسرات';
    defaultBackMessage = 'حضوركم يزيّن ليلتنا وتكتمل به سعادتنا وسرورنا';
    defaultBackBadge = 'بطاقة زفاف خاصة';
  } else if (theme === 'wedding_imperial') {
    defaultWelcome = 'دعوة لحضور حفل القران المبارك';
    defaultSub = 'يشرّفنا ويسعدنا حضوركم وتلبية دعوتنا الكريمة';
    defaultFooterNote = 'شرفونا بحضوركم الكريم';
    defaultBackTitle = event?.name || 'دعوة ملكية خاصة';
    defaultBackHeader = 'شرفونا بحضوركم الكريم لمشاركتنا فرحة العمر';
    defaultBackMessage = 'حضوركم شرف لنا وابتهاج لقلوبنا بدعوتكم الميمونة';
    defaultBackBadge = 'بطاقة دخول رسمية';
  } else if (theme === 'wedding_minimal_luxury') {
    defaultWelcome = 'دعوة زفاف رسمية';
    defaultSub = 'بحضوركم تكتمل الأفراح ونسعد بتشريفكم الكريم';
    defaultFooterNote = 'أهلاً بكم في ليلة الفرح';
    defaultBackTitle = event?.name || 'فرحة زفاف مباركة';
    defaultBackHeader = 'يسرنا دعوتكم لمشاركتنا أجمل اللحظات';
    defaultBackMessage = 'أهلاً وسهلاً بكم في ليلة الفرح والسرور المبارك';
    defaultBackBadge = 'بطاقة دعوة خاصة';
  } else if (theme?.startsWith('graduation') || theme === 'royal_graduation') {
    defaultWelcome = 'حَفْلُ تَخَرُّجْ وتكريم';
    defaultSub = 'يسرنا مشاركتكم فرحة التخرج والنجاح ودامت دياركم عامرة بالأفراح';
    defaultGuestPrefix = 'يسعدنا تكريم وحضور الخريج/ـة والمكرم/ـة:';
    defaultGeneralNotice = 'يسرنا دعوتكم لحضور حفل التخرج';
    defaultFooterNote = 'فرحة نجاح وسرور';
    defaultBackTitle = event?.name || 'حفل تخرج وتكريم';
    defaultBackHeader = 'فرحة نجاح وتخرج تتوج مسيرة السنين';
    defaultBackMessage = 'يسرنا مشاركتكم فرحة التخرج والنجاح ودامت دياركم عامرة بالأفراح';
    defaultBackBadge = 'بطاقة دخول حفل التخرج';
  } else if (theme?.startsWith('dinner')) {
    defaultWelcome = 'دعوة لتناول طعام العشاء';
    defaultSub = 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة وطاب ممشاكم';
    defaultGuestPrefix = 'يسعدنا تشريف وحضور المكرم/ـة:';
    defaultGeneralNotice = 'يسرنا دعوتكم لتناول طعام العشاء';
    defaultFooterNote = 'أهلاً بالضيوف الكرام';
    defaultBackTitle = event?.name || 'مأدبة عشاء كريمة';
    defaultBackHeader = 'يشرّفنا ويسعدنا تلبية دعوتنا الكريمة';
    defaultBackMessage = 'أهلاً وسهلاً بكم وطاب ممشاكم بيننا بحلولكم الكريمة';
    defaultBackBadge = 'بطاقة حضور مأدبة عشاء';
  }

  return {
    welcomeText: defaultWelcome,
    customSubtitle: defaultSub,
    guestPrefixText: defaultGuestPrefix,
    generalCardNotice: defaultGeneralNotice,
    qrInstructionText: defaultQrInstruction,
    footerNoteText: defaultFooterNote,
    backTitleText: defaultBackTitle,
    backHeaderText: defaultBackHeader,
    backMessageText: defaultBackMessage,
    backBadgeText: defaultBackBadge,
  };
}

const PresetBackCard: React.FC<{
  settings: PrintSettings;
  palette: any;
  activeEvent: Event;
}> = ({ settings, palette, activeEvent }) => {
  const theme = (settings.cardTheme === 'wedding' ? 'wedding_botanical_purple' : (settings.cardTheme || 'wedding_botanical_purple')) as CardTemplateType;
  const defs = getTemplateDefaultTexts(theme, activeEvent);

  const isBespokeWedding = 
    theme === 'wedding_golden_floral' ||
    theme === 'wedding_botanical_purple' ||
    theme === 'wedding_royal_burgundy' ||
    theme === 'wedding_calla_sage' ||
    theme === 'wedding_sculpted_ivory';

  const coupleTitle = (settings.weddingTitleType || 'couple_names') === 'couple_names'
    ? `${settings.groomName || 'العريس'} & ${settings.brideName || 'العروسة'}`
    : (activeEvent?.name || 'حفل زفاف مبارك');

  const themeTitle = settings.backTitleText !== undefined ? settings.backTitleText : (isBespokeWedding ? coupleTitle : defs.backTitleText);
  const themeHeader = settings.backHeaderText !== undefined ? settings.backHeaderText : defs.backHeaderText;
  const themeMsg = settings.backMessageText || settings.customSubtitle || defs.backMessageText;
  const themeBadge = settings.backBadgeText || defs.backBadgeText;

  const eventVenue = (settings.venueText || activeEvent?.venue || (activeEvent as any)?.location || '').trim();
  const eventDate = (settings.weddingHijriDate || settings.dateText || activeEvent?.date || '').trim();
  const eventTime = (settings.timeText || activeEvent?.time || '').trim();

  if (theme === 'wedding_golden_floral') {
    return (
      <div
        className="relative w-full h-full rounded-2xl shadow-xl overflow-hidden text-slate-900 select-none flex flex-col justify-center items-center text-center"
        style={{ 
          backgroundColor: palette.cardBg, 
          border: '1px solid rgba(190, 155, 95, 0.45)',
        }}
      >
        <GoldenFloralBackBackground
          showEnglishNote={settings.showBackEnglishNote !== false}
          englishNoteText={settings.backEnglishNoteText || 'A Special Day\nA Lasting Memory'}
        />

        <div className="relative z-10 w-full max-w-[68%] flex flex-col justify-center items-center text-center my-auto space-y-1.5 px-3">
          {themeTitle !== '' && (
            <h3
              className="text-[13px] sm:text-[15.5px] font-black leading-snug whitespace-pre-line"
              style={{
                color: palette.headerText || '#8C6826',
                fontFamily: "'Amiri', 'Traditional Arabic', serif",
                textShadow: '0 0.5px 1px rgba(140, 109, 52, 0.25)',
              }}
            >
              {themeTitle}
            </h3>
          )}
          {settings.showHeartIcon !== false && (
            <GoldenHeartIcon color={palette.accentText || '#BFA063'} className="w-3.5 h-3.5 mx-auto my-0.5" />
          )}
          {themeHeader !== '' && (
            <p
              className="text-[10px] sm:text-[11.5px] font-bold"
              style={{
                color: '#382B1C',
                fontFamily: "'Amiri', 'Traditional Arabic', serif",
              }}
            >
              {themeHeader}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-2xl shadow-xl overflow-hidden text-slate-900 select-none p-3 sm:p-3.5 flex flex-col justify-between text-center border-2"
      style={{ 
        backgroundColor: palette.cardBg, 
        borderColor: palette.frameBorderOuter,
        backgroundImage: isBespokeWedding ? undefined : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.02) 100%)'
      }}
    >
      {/* Rich Bespoke SVG Background */}
      {renderWeddingRichBackground(theme)}

      {/* Embroidery Stitched Inner Frames (only for classic themes) */}
      {!isBespokeWedding && (
        <div
          className="absolute inset-1.5 rounded-xl border pointer-events-none"
          style={{ borderColor: palette.frameBorderOuter, borderStyle: 'solid' }}
        />
      )}

      {/* 4 Bespoke Embroidery Corners */}
      {renderThemeCorners(theme, palette)}

      {/* Top Header Motif & Theme Crest */}
      <div className="relative z-10 pt-0.5 flex flex-col items-center">
        {renderThemeTopCrest(theme, palette)}
        <div className="text-[11.5px] sm:text-xs font-serif font-black px-2 tracking-wide mt-0.5" style={{ color: palette.headerText }}>
          {themeTitle}
        </div>
      </div>

      {/* Center Luxury Embroidery Text */}
      <div className="relative z-10 px-2 space-y-1 my-auto">
        <p className="text-[11px] sm:text-xs font-bold leading-snug font-serif" style={{ color: palette.headerText }}>
          {themeHeader}
        </p>
        <div 
          className="w-16 h-0.5 mx-auto rounded-full my-0.5" 
          style={{ backgroundColor: palette.divider }} 
        />
        <p className="text-[9px] sm:text-[9.5px] text-slate-600 font-medium leading-relaxed px-1 line-clamp-2">
          {themeMsg}
        </p>

        {/* Event Venue, Date, and Time Info Strip */}
        {(eventVenue || eventDate || eventTime) && (
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5 text-[7px] sm:text-[7.5px] text-slate-700 font-semibold pt-1">
            {eventVenue && (
              <span className="inline-flex items-center gap-0.5">
                <span>📍</span>
                <span className="truncate max-w-[120px]">{eventVenue}</span>
              </span>
            )}
            {eventDate && (
              <span className="inline-flex items-center gap-0.5">
                <span>🗓️</span>
                <span>{eventDate}</span>
              </span>
            )}
            {eventTime && (
              <span className="inline-flex items-center gap-0.5">
                <span>⏰</span>
                <span>{eventTime}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Badge */}
      <div className="relative z-10 pb-0.5 flex flex-col items-center">
        <span
          className="text-[8px] font-bold px-3 py-0.5 rounded-full border shadow-sm"
          style={{ 
            backgroundColor: palette.badgeBg, 
            borderColor: palette.badgeBorder, 
            color: palette.badgeText,
            borderStyle: theme === 'wedding_imperial' ? 'solid' : 'dashed'
          }}
        >
          {themeBadge}
        </span>
      </div>
    </div>
  );
};

const PresetFrontCard: React.FC<{
  settings: PrintSettings;
  palette: any;
  activeEvent: Event | null;
  currentGuestName?: string | null;
  currentInvNum: number;
  previewSampleQr?: string | null;
  isLandscape: boolean;
  isSquare?: boolean;
}> = ({
  settings,
  palette,
  activeEvent,
  currentGuestName,
  currentInvNum,
  previewSampleQr,
  isLandscape,
  isSquare,
}) => {
  const eventVenue = (settings.venueText || activeEvent?.venue || (activeEvent as any)?.location || '').trim();
  const eventDate = (settings.weddingHijriDate || settings.dateText || activeEvent?.date || '').trim();
  const eventTime = (settings.timeText || activeEvent?.time || '').trim();

  const { eventDayName, eventDateOnly } = (() => {
    if (!eventDate) return { eventDayName: '', eventDateOnly: '' };
    try {
      const d = new Date(eventDate);
      if (!isNaN(d.getTime())) {
        const day = d.toLocaleDateString('ar-SA', { weekday: 'long' });
        const dateStr = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });
        return { eventDayName: day, eventDateOnly: dateStr };
      }
    } catch (_) {}
    return { eventDayName: '', eventDateOnly: eventDate };
  })();

  const { venuePrimary, venueSecondary } = (() => {
    if (!eventVenue) return { venuePrimary: '', venueSecondary: '' };
    const lines = eventVenue.split('\n').map((s: string) => s.trim()).filter(Boolean);
    if (lines.length > 1) {
      return { venuePrimary: lines[0], venueSecondary: lines.slice(1).join(' - ') };
    }
    const dashParts = eventVenue.split(' - ').map((s: string) => s.trim()).filter(Boolean);
    if (dashParts.length > 1) {
      return { venuePrimary: dashParts[0], venueSecondary: dashParts.slice(1).join(' - ') };
    }
    return { venuePrimary: eventVenue, venueSecondary: '' };
  })();

  if (isLandscape) {
    return (
      <div
        className="relative w-full h-full flex flex-col justify-between p-2.5 sm:p-3 text-slate-900 overflow-hidden select-none"
        style={{ 
          backgroundColor: palette.cardBg,
          backgroundImage: (
            settings.cardTheme === 'wedding_golden_floral' ||
            settings.cardTheme === 'wedding_botanical_purple' ||
            settings.cardTheme === 'wedding_royal_burgundy' ||
            settings.cardTheme === 'wedding_calla_sage' ||
            settings.cardTheme === 'wedding_sculpted_ivory'
          ) ? undefined : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.02) 100%)'
        }}
      >
        {renderWeddingRichBackground(settings.cardTheme)}
        {renderThemeCorners(settings.cardTheme || 'wedding_andalusian', palette)}

        {settings.cardTheme === 'wedding_golden_floral' ? (
          <div dir="ltr" className="relative z-10 flex-1 flex items-center justify-between gap-1.5 px-1 py-0.5 h-full w-full select-none">
            <div className="w-[18%] sm:w-[20%] shrink-0 pointer-events-none" />
            <div dir="rtl" className="flex-1 flex flex-col items-center justify-between text-center py-0.5 px-0.5 h-full min-w-0">
              {settings.monogramEnabled !== false ? (
                <div className="shrink-0 -mb-0.5">
                  <InitialsMonogram
                    groomInitial={settings.monogramGroomInitial || 'A'}
                    brideInitial={settings.monogramBrideInitial || 'M'}
                    color={palette.accentText || '#8C6826'}
                    accent={palette.cornerBorder || '#C89D4B'}
                    className="mx-auto scale-90 sm:scale-100"
                  />
                </div>
              ) : <div className="h-0.5" />}

              {settings.welcomeText && (
                <div className="text-[8px] sm:text-[9.5px] font-bold tracking-wide leading-tight" style={{ color: '#3A2E20', fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                  {settings.welcomeText}
                </div>
              )}

              <div className="my-0.5 shrink-0">
                {settings.weddingTitleType === 'family_title' ? (
                  <h2 className="text-[11px] sm:text-[13px] font-black tracking-wide leading-tight px-1" style={{ color: palette.headerText || '#8C6826', fontFamily: "'Amiri', 'Traditional Arabic', serif", textShadow: '0 0.5px 1px rgba(140, 109, 52, 0.2)' }}>
                    {settings.familyTitleText || 'تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف ابنهم'}
                  </h2>
                ) : settings.weddingTitleType === 'event_name' ? (
                  <h2 className="text-[11.5px] sm:text-[13.5px] font-black tracking-wide leading-tight px-1" style={{ color: palette.headerText || '#8C6826', fontFamily: "'Amiri', 'Traditional Arabic', serif", textShadow: '0 0.5px 1px rgba(140, 109, 52, 0.2)' }}>
                    {activeEvent?.name || 'حفل زفاف مبارك'}
                  </h2>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <h2 className="text-[14px] sm:text-[16.5px] font-black tracking-wide leading-none" style={{ color: palette.headerText || '#8C6826', fontFamily: "'Amiri', 'Traditional Arabic', serif", textShadow: '0 0.5px 1.5px rgba(140, 109, 52, 0.25)' }}>
                      {settings.groomName || 'أحمد'} & {settings.brideName || 'ماريا'}
                    </h2>
                    {settings.showHeartIcon !== false && (
                      <GoldenHeartIcon color={palette.accentText || '#BFA063'} className="w-2.5 h-2.5 mt-0.5 mx-auto" />
                    )}
                  </div>
                )}
              </div>

              {settings.customSubtitle && (
                <div className="text-[7.5px] sm:text-[8.5px] font-medium leading-tight -mt-0.5" style={{ color: '#564536', fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                  {settings.customSubtitle}
                </div>
              )}

              <div className="my-0.5 shrink-0 max-w-full">
                {currentGuestName ? (
                  <div className="inline-flex items-center justify-center gap-1 px-4 py-0.5 rounded-full border shadow-sm max-w-[96%] truncate" style={{ backgroundColor: palette.badgeBg || '#EDE5D8', borderColor: palette.badgeBorder || '#D8CAB8', color: palette.badgeText || '#281E14' }}>
                    {settings.guestPrefixEnabled !== false && settings.guestPrefixText && (
                      <span className="text-[8px] sm:text-[8.5px] font-semibold opacity-90" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                        {settings.guestPrefixText}
                      </span>
                    )}
                    <span className="text-[9.5px] sm:text-[11px] font-black truncate" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                      {currentGuestName}
                    </span>
                  </div>
                ) : (
                  <div className="inline-block px-3 py-0.5 rounded-full border shadow-sm text-[8.5px] font-bold" style={{ backgroundColor: palette.badgeBg || '#EDE5D8', borderColor: palette.badgeBorder || '#D8CAB8', color: palette.badgeText || '#281E14', fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                    {settings.generalCardNotice || 'دعوة عامة'}
                  </div>
                )}
              </div>

              {((settings.showDate !== false && eventDate) || (settings.showTime !== false && eventTime) || (settings.showVenue !== false && eventVenue)) && (
                <div className="w-full flex items-start justify-between gap-1 text-[7px] font-semibold text-slate-800 pt-0.5 px-0.5">
                  {settings.showDate !== false && eventDate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center leading-tight">
                      <div className="flex items-center justify-center gap-0.5 text-[6.5px] sm:text-[7.5px] text-[#5A4836] font-bold">
                        <span>{eventDayName || 'السبت'}</span>
                        <Calendar className="w-2.5 h-2.5 text-[#A3782B] shrink-0" />
                      </div>
                      <div className="font-bold text-[#2D2115] font-mono text-[6.5px] sm:text-[7.5px] mt-0.5">
                        {eventDateOnly || eventDate}
                      </div>
                    </div>
                  ) : <div className="flex-1" />}

                  {settings.showTime !== false && eventTime ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center leading-tight">
                      <div className="flex items-center justify-center gap-0.5 text-[6.5px] sm:text-[7.5px] text-[#5A4836] font-bold">
                        <span>الساعة</span>
                        <Clock className="w-2.5 h-2.5 text-[#A3782B] shrink-0" />
                      </div>
                      <div className="font-bold text-[#2D2115] text-[6.5px] sm:text-[7.5px] mt-0.5">
                        {eventTime}
                      </div>
                    </div>
                  ) : <div className="flex-1" />}

                  {settings.showVenue !== false && eventVenue ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center leading-tight max-w-[85px] sm:max-w-[95px]">
                      <div className="flex items-center justify-center gap-0.5 text-[6.5px] sm:text-[7.5px] text-[#5A4836] font-bold truncate max-w-full">
                        <span className="truncate">{venuePrimary || eventVenue}</span>
                        <MapPin className="w-2.5 h-2.5 text-[#A3782B] shrink-0" />
                      </div>
                      {venueSecondary ? (
                        <div className="font-bold text-[#2D2115] text-[6px] sm:text-[7px] truncate max-w-full mt-0.5">
                          {venueSecondary}
                        </div>
                      ) : null}
                    </div>
                  ) : <div className="flex-1" />}
                </div>
              )}

              {settings.showFooterDivider !== false && (
                <div className="w-full pt-0.5 shrink-0">
                  <GoldenFooterDivider text={settings.footerDividerText || 'بحضوركم تكتمل فرحتنا'} color={palette.accentText || '#8C6D34'} />
                </div>
              )}
            </div>

            <div dir="rtl" className="w-[78px] sm:w-[86px] flex flex-col items-center justify-center shrink-0 pr-0.5 z-10">
              <div className="p-1 rounded-xl shadow-md border-2 bg-white flex items-center justify-center" style={{ borderColor: palette.qrBorder || '#C49E4F' }}>
                {previewSampleQr ? (
                  <img src={previewSampleQr} alt="QR Code" className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] object-contain" />
                ) : (
                  <div className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] bg-slate-100" />
                )}
              </div>
              {settings.qrInstructionText && (
                <div className="text-[7px] sm:text-[7.5px] font-bold mt-1 text-center leading-tight" style={{ color: '#5D4624', fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                  {settings.qrInstructionText}
                </div>
              )}
              {settings.showInvitationNumber && (
                <div className="text-[7.5px] sm:text-[8.5px] font-mono font-bold mt-0.5 text-[#382B18]">
                  #{String(currentInvNum).padStart(3, '0')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 flex-1 flex items-center justify-between gap-2.5 px-1 pt-0.5">
              <div className="flex-1 flex flex-col justify-center text-center space-y-0.5 min-w-0">
                <div>
                  {renderThemeTopCrest(settings.cardTheme || 'wedding_andalusian', palette)}

                  {(
                    settings.cardTheme === 'wedding_botanical_purple' ||
                    settings.cardTheme === 'wedding_royal_burgundy' ||
                    settings.cardTheme === 'wedding_calla_sage' ||
                    settings.cardTheme === 'wedding_sculpted_ivory'
                  ) ? (
                    <div className="mt-0.5">
                      <h2 className="text-[11.5px] sm:text-xs font-black tracking-wide drop-shadow-sm font-serif truncate" style={{ color: palette.headerText }}>
                        {(settings.weddingTitleType || 'couple_names') === 'couple_names'
                          ? `${settings.groomName || 'العريس'} & ${settings.brideName || 'العروسة'}`
                          : (activeEvent?.name || 'حفل زفاف مبارك')}
                      </h2>
                      <div className="text-[8px] font-bold text-slate-600 truncate">
                        {settings.welcomeText || 'دعوة زفاف كريمة'}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-[11.5px] sm:text-xs font-black tracking-wide drop-shadow-sm font-serif mt-0.5 truncate" style={{ color: palette.headerText }}>
                        {settings.welcomeText || 'دعوة زفاف كريمة'}
                      </h2>
                      {settings.showEventName && activeEvent && (
                        <div className="text-[8.5px] font-bold text-slate-700 truncate px-1">
                          {activeEvent.name}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {currentGuestName ? (
                  <div>
                    <div className="text-[7.5px] text-slate-600 font-semibold leading-tight">
                      {settings.guestPrefixText || 'تتشرف الأسرة الكريمة بدعوة المكرم/ـة:'}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded-lg border font-black text-[9.5px] shadow-sm mt-0.5 max-w-[90%] truncate" style={{ backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder, color: palette.badgeText, borderStyle: 'solid' }}>
                      {currentGuestName}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[7.5px] text-slate-600 font-semibold leading-tight">
                      {settings.generalCardNotice || 'يسرنا ويشرفنا دعوتكم الكريمة لحضور'}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded-lg border font-black text-[9.5px] shadow-sm mt-0.5 max-w-[90%] truncate" style={{ backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder, color: palette.badgeText, borderStyle: 'solid' }}>
                      {activeEvent?.name || 'المناسبة المباركة'}
                    </div>
                  </div>
                )}

                {(eventVenue || eventDate || eventTime) && (
                  <div className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 text-[6.8px] sm:text-[7.2px] text-slate-700 font-semibold pt-0.5">
                    {eventVenue && (
                      <span className="inline-flex items-center gap-0.5">
                        <span>📍</span>
                        <span className="truncate max-w-[95px]">{eventVenue}</span>
                      </span>
                    )}
                    {eventDate && (
                      <span className="inline-flex items-center gap-0.5">
                        <span>🗓️</span>
                        <span>{eventDate}</span>
                      </span>
                    )}
                    {eventTime && (
                      <span className="inline-flex items-center gap-0.5">
                        <span>⏰</span>
                        <span>{eventTime}</span>
                      </span>
                    )}
                  </div>
                )}

                {settings.customSubtitle && (
                  <p className="text-[7px] text-slate-600 font-medium truncate px-1">
                    {settings.customSubtitle}
                  </p>
                )}
              </div>

              <div className="w-[95px] flex flex-col items-center justify-center shrink-0">
                <div className="p-1 rounded-xl shadow-md border-2 bg-white" style={{ borderColor: palette.qrBorder, borderStyle: 'solid' }}>
                  {previewSampleQr ? (
                    <img src={previewSampleQr} alt="QR Code" className="w-[58px] h-[58px] object-contain" />
                  ) : (
                    <div className="w-[58px] h-[58px] bg-slate-100" />
                  )}
                </div>
                <div className="text-[6.8px] font-bold mt-0.5 text-center leading-tight" style={{ color: palette.accentText }}>
                  {(settings.qrInstructionText === 'للدخول يرجى إبراز هذا الرمز عند البوابة' ? 'يرجى إبراز الرمز للدخول' : settings.qrInstructionText) || 'يرجى إبراز الرمز للدخول'}
                </div>
                {settings.showInvitationNumber && (
                  <div className="text-[7px] font-mono font-bold mt-0.2" style={{ color: palette.accentText }}>
                    #{String(currentInvNum).padStart(3, '0')}
                  </div>
                )}
                {(
                  settings.cardTheme === 'wedding_botanical_purple' ||
                  settings.cardTheme === 'wedding_royal_burgundy' ||
                  settings.cardTheme === 'wedding_calla_sage' ||
                  settings.cardTheme === 'wedding_sculpted_ivory'
                ) && settings.showEtiquetteIcons !== false && (
                  <WeddingEtiquetteIcons color={palette.headerText} className="mt-0.5 scale-85" />
                )}
              </div>
            </div>

            <div className="relative z-10 text-center text-[7px] text-slate-600 pt-0.5 flex items-center justify-center px-2" style={{ borderTopColor: palette.divider, borderTopStyle: 'none' }}>
              <span className="truncate">
                {settings.footerNoteText || 'حضوركم يزيّن ليلتنا وتكتمل به فرحتنا'}
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Vertical / Square Card
  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-3 sm:p-3.5 text-slate-900 overflow-hidden select-none"
      style={{ 
        backgroundColor: palette.cardBg,
        backgroundImage: (
          settings.cardTheme === 'wedding_botanical_purple' ||
          settings.cardTheme === 'wedding_royal_burgundy' ||
          settings.cardTheme === 'wedding_calla_sage' ||
          settings.cardTheme === 'wedding_sculpted_ivory'
        ) ? undefined : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.02) 100%)'
      }}
    >
      {renderWeddingRichBackground(settings.cardTheme)}
      {renderThemeCorners(settings.cardTheme || 'wedding_andalusian', palette)}

      <div className="relative z-10 text-center pt-0.5">
        {renderThemeTopCrest(settings.cardTheme || 'wedding_andalusian', palette)}

        {settings.cardTheme === 'wedding_botanical_purple' ? (
          <div className="mt-0.5">
            <h2 className="text-sm sm:text-base font-serif font-black tracking-wide mt-0.5 drop-shadow-sm truncate" style={{ color: palette.headerText }}>
              {(settings.weddingTitleType || 'couple_names') === 'couple_names'
                ? `${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}`
                : (activeEvent?.name || 'حفل زفاف مبارك')}
            </h2>
            <div className="text-[9.5px] font-bold tracking-widest text-slate-700 mt-0.5">
              {settings.welcomeText || 'بـطـاقـة دخـول'}
            </div>
          </div>
        ) : settings.cardTheme === 'wedding_royal_burgundy' ? (
          <div className="mt-0.5">
            <div className="text-[7px] text-rose-950/80 leading-relaxed max-w-[220px] mx-auto line-clamp-1">
              {settings.customSubtitle || 'أذن لمراسيم الفرح أن تشرّع أبوابها .. بكل الحب والود ندعوكم لحضور زفاف'}
            </div>
            <h2 className="text-sm sm:text-base font-serif font-black tracking-wider mt-0.5 drop-shadow-sm truncate" style={{ color: palette.headerText }}>
              {(settings.weddingTitleType || 'couple_names') === 'couple_names'
                ? `${settings.groomName || 'غسان'} & ${settings.brideName || 'منال'}`
                : (activeEvent?.name || 'حفل زفاف مبارك')}
            </h2>
          </div>
        ) : settings.cardTheme === 'wedding_calla_sage' ? (
          <div className="mt-0.5">
            <div className="text-[7px] text-lime-950/80 leading-relaxed max-w-[210px] mx-auto line-clamp-1">
              {settings.customSubtitle || 'بكل ما تحمله مشاعرنا من حب ولأن فرحتنا تكتمل بمن نحب يتشرف'}
            </div>
            <h2 className="text-sm sm:text-base font-serif font-black tracking-wide mt-0.5 drop-shadow-sm truncate" style={{ color: palette.headerText }}>
              {(settings.weddingTitleType || 'couple_names') === 'couple_names'
                ? `${settings.groomName || 'أحمد'} و ${settings.brideName || 'سارة'}`
                : (activeEvent?.name || 'حفل زفاف مبارك')}
            </h2>
            <div className="text-[7.5px] text-slate-600 mt-0.5">بدعوتكم لحضور حفل زفافهما</div>
          </div>
        ) : settings.cardTheme === 'wedding_sculpted_ivory' ? (
          <div className="mt-0.5">
            <div className="text-[9px] font-serif font-black tracking-widest text-stone-700">
              {settings.welcomeText || 'تـ ـمّ بـحـمـ ـدِ اللهِ عَـقـ ـد قِـ ـران'}
            </div>
            {(settings.weddingTitleType || 'couple_names') === 'couple_names' ? (
              <div className="flex items-center justify-center gap-2 my-0.5">
                <span className="text-xs sm:text-sm font-serif font-black text-stone-800">{settings.groomName || 'صقر'}</span>
                <SculptedCallaMotif className="w-3.5 h-5" />
                <span className="text-xs sm:text-sm font-serif font-black text-stone-800">{settings.brideName || 'نوال'}</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-serif font-black text-stone-800 my-0.5">
                {activeEvent?.name}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-0.5">
            <h2 className="text-sm sm:text-base font-serif font-black tracking-wide drop-shadow-sm truncate" style={{ color: palette.headerText }}>
              {settings.welcomeText || 'دعوة زفاف كريمة'}
            </h2>
            {settings.showEventName && activeEvent && (
              <div className="text-[10px] font-bold text-slate-700 truncate px-2">
                {activeEvent.name}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 px-2 space-y-1 text-center">
        {currentGuestName ? (
          <div>
            <div className="text-[8px] text-slate-600 font-semibold leading-tight">
              {settings.guestPrefixText || 'تتشرف الأسرة الكريمة بدعوة المكرم/ـة:'}
            </div>
            <div className="inline-block px-3 py-0.5 rounded-lg border font-black text-xs shadow-sm mt-0.5 max-w-[90%] truncate" style={{ backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder, color: palette.badgeText, borderStyle: 'solid' }}>
              {currentGuestName}
            </div>
          </div>
        ) : !(
          settings.cardTheme === 'wedding_botanical_purple' ||
          settings.cardTheme === 'wedding_royal_burgundy' ||
          settings.cardTheme === 'wedding_calla_sage' ||
          settings.cardTheme === 'wedding_sculpted_ivory'
        ) ? (
          <div>
            <div className="text-[8px] text-slate-600 font-semibold leading-tight">
              {settings.generalCardNotice || 'يسرنا ويشرفنا دعوتكم الكريمة لحضور'}
            </div>
            <div className="inline-block px-3 py-0.5 rounded-lg border font-black text-xs shadow-sm mt-0.5 max-w-[90%] truncate" style={{ backgroundColor: palette.badgeBg, borderColor: palette.badgeBorder, color: palette.badgeText, borderStyle: 'solid' }}>
              {activeEvent?.name || 'المناسبة المباركة'}
            </div>
          </div>
        ) : null}

        {(eventVenue || eventDate || eventTime) && (
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5 text-[7px] sm:text-[7.5px] text-slate-700 font-semibold py-0.5">
            {eventVenue && (
              <span className="inline-flex items-center gap-0.5">
                <span>📍</span>
                <span className="truncate max-w-[110px]">{eventVenue}</span>
              </span>
            )}
            {eventDate && (
              <span className="inline-flex items-center gap-0.5">
                <span>🗓️</span>
                <span>{eventDate}</span>
              </span>
            )}
            {eventTime && (
              <span className="inline-flex items-center gap-0.5">
                <span>⏰</span>
                <span>{eventTime}</span>
              </span>
            )}
          </div>
        )}

        {!(
          settings.cardTheme === 'wedding_botanical_purple' ||
          settings.cardTheme === 'wedding_royal_burgundy' ||
          settings.cardTheme === 'wedding_calla_sage' ||
          settings.cardTheme === 'wedding_sculpted_ivory'
        ) && settings.customSubtitle && (
          <p className="text-[8px] text-slate-600 font-medium line-clamp-1 px-1">
            {settings.customSubtitle}
          </p>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="relative p-1.5 rounded-xl shadow-md border-2 bg-white" style={{ borderColor: palette.qrBorder, borderStyle: 'solid' }}>
          {previewSampleQr ? (
            <img src={previewSampleQr} alt="QR Code" className="w-16 h-16 sm:w-18 sm:h-18 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-slate-100" />
          )}
        </div>
        <div className="text-[7.5px] font-bold mt-0.5 text-center" style={{ color: palette.accentText }}>
          {(settings.qrInstructionText === 'للدخول يرجى إبراز هذا الرمز عند البوابة' ? 'يرجى إبراز الرمز للدخول' : settings.qrInstructionText) || 'يرجى إبراز الرمز للدخول'}
        </div>
        {settings.showInvitationNumber && (
          <div className="text-[7px] font-mono font-bold mt-0.2" style={{ color: palette.accentText }}>
            #{String(currentInvNum).padStart(3, '0')}
          </div>
        )}
      </div>

      <div className="relative z-10 text-center text-[7px] text-slate-600 pt-0.5 flex flex-col items-center justify-center px-1" style={{ borderTopColor: palette.divider, borderTopStyle: 'none' }}>
        <span>
          {settings.footerNoteText || (
            settings.cardTheme === 'wedding_sculpted_ivory' ? 'اللّهم أتمّ عليهم السعادة والهناء' :
            settings.cardTheme === 'wedding_royal_burgundy' ? 'وبحضوركم يتم لنا الفرح والسرور' :
            'بحضوركم تكتمل فرحتنا'
          )}
        </span>
        {(
          settings.cardTheme === 'wedding_botanical_purple' ||
          settings.cardTheme === 'wedding_royal_burgundy' ||
          settings.cardTheme === 'wedding_calla_sage' ||
          settings.cardTheme === 'wedding_sculpted_ivory'
        ) && settings.showEtiquetteIcons !== false && (
          <WeddingEtiquetteIcons color={palette.headerText} className="mt-0.5 scale-90" />
        )}
      </div>
    </div>
  );
};

interface PrintSettingsPageProps {
  activeEvent: Event | null;
  invitations: Invitation[];
  onRefreshInvitations?: () => void;
}

export const PrintSettingsPage: React.FC<PrintSettingsPageProps> = ({ activeEvent, invitations, onRefreshInvitations }) => {
  const [previewMode, setPreviewMode] = useState<'single' | 'sheet'>('single');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentSheetPage, setCurrentSheetPage] = useState<number>(0);
  const [sheetSide, setSheetSide] = useState<'front' | 'back'>('front');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Guest name editing states for single card preview
  const [isEditingCardName, setIsEditingCardName] = useState(false);
  const [editingCardNameVal, setEditingCardNameVal] = useState('');
  const [savingCardName, setSavingCardName] = useState(false);

  // File upload refs for Front and Back card faces
  const frontFileInputRef = useRef<HTMLInputElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);

  // Card interactive container refs for drag/click QR positioning
  const frontCardRef = useRef<HTMLDivElement | null>(null);
  const backCardRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingQr, setIsDraggingQr] = useState(false);

  // Preview face toggle (Front vs Back)
  const [previewFace, setPreviewFace] = useState<'front' | 'back'>('front');

  // Print settings
  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    columns: 2,
    rows: 4,
    cardWidth: 85,
    cardHeight: 58,
    cardShape: 'rectangle',
    gapX: 4,
    gapY: 4,
    marginX: 10,
    marginY: 10,
    showEventName: true,
    showGuestName: true,
    showInvitationNumber: true,
    showCropMarks: false,
    showVenue: true,
    showTime: true,
    showDate: true,
    venueText: activeEvent?.venue || 'قاعة الفخامة - المكلا',
    timeText: activeEvent?.time || '08:00 مساءً',
    dateText: activeEvent?.date || '2026-09-20',
    welcomeText: activeEvent?.eventType === 'wedding' 
      ? 'دعوة لحضور حفل زفاف'
      : activeEvent?.eventType === 'graduation'
      ? 'حَفْلُ تَخَرُّج'
      : 'أهلاً بكم في حفلنا',
    customSubtitle: activeEvent?.eventType === 'wedding'
      ? 'نتشرف بدعوتكم لحضور حفل زفافنا'
      : 'بكم تكتمل الفرحة .. وحضوركم يشرّفنا',
    cardTheme: (activeEvent?.eventType === 'wedding' 
      ? 'wedding_golden_floral' 
      : activeEvent?.eventType === 'graduation' 
      ? 'graduation_royal' 
      : activeEvent?.eventType === 'dinner'
      ? 'dinner_royal'
      : 'wedding_golden_floral'),
    colorScheme: 'default',
    customPrimaryColor: '#BFA063',
    customAccentColor: '#8C6D34',
    customBgColor: '#FCFAF7',
    qrPosition: 'right',
    designSource: 'system_templates',
    customCardImage: null,
    customCardBackImage: null,
    customImageWidth: undefined,
    customImageHeight: undefined,
    customAspectRatio: undefined,
    customQrSide: 'front',
    customQrX: 50,
    customQrY: 65,
    customQrSize: 30,
    customQrBg: true,
    doubleSidedMode: 'duplex',
    printMode: 'cards',
    stickerPreset: '30',
    stickerShowNumber: true,
    stickerShowName: false,
    stickerShowCutMarks: true,
    // Dynamic golden template defaults matching user card
    monogramEnabled: true,
    monogramGroomInitial: 'A',
    monogramBrideInitial: 'M',
    showHeartIcon: true,
    weddingTitleType: 'couple_names',
    groomName: 'أحمد',
    brideName: 'ماريا',
    familyTitleText: 'تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف ابنهم',
    guestPrefixEnabled: true,
    guestPrefixText: 'الأستاذ/',
    qrInstructionText: 'يرجى إبراز الكود للدخول',
    showFooterDivider: true,
    footerDividerText: 'بحضوركم تكتمل فرحتنا',
    showBackEnglishNote: true,
    backEnglishNoteText: 'A Special Day\nA Lasting Memory',
    backTitleText: 'بارك الله لهما وبارك عليهما وجمع بينهما في خير',
    backHeaderText: 'شكراً لكم على تلبية الدعوة',
  });

  const [designMode, setDesignMode] = useState<'system_templates' | 'custom_images'>('system_templates');
  const [detectedDimensions, setDetectedDimensions] = useState<{ width: number; height: number; aspect: number } | null>(null);

  // Auto-detect dimensions if custom image is already present
  useEffect(() => {
    if (settings.customCardImage && !detectedDimensions) {
      const img = new Image();
      img.onload = () => {
        setDetectedDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspect: img.naturalWidth / img.naturalHeight,
        });
      };
      img.src = settings.customCardImage;
    }
  }, [settings.customCardImage]);

  const [previewSampleQr, setPreviewSampleQr] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOutpaintModalOpen, setIsOutpaintModalOpen] = useState(false);

  // Dynamic Card Templates from Super Admin Database
  const [dbTemplates, setDbTemplates] = useState<CardTemplateItem[]>([]);
  const [selectedDbTemplateId, setSelectedDbTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDbTemplates = async () => {
      try {
        if (window.electronAPI?.getCardTemplates) {
          const tpls = await window.electronAPI.getCardTemplates({
            category: activeEvent?.eventType,
            onlyActive: true,
          });
          setDbTemplates(tpls || []);
        }
      } catch (err) {
        console.error('Failed to load card templates:', err);
      }
    };
    fetchDbTemplates();
  }, [activeEvent?.eventType]);

  // 3D Card Preview Modal States & Handlers
  const [is3dModalOpen, setIs3dModalOpen] = useState(false);
  const [cardRotationY, setCardRotationY] = useState(0);
  const [cardRotationX, setCardRotationX] = useState(0);
  const [isDragging3d, setIsDragging3d] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [autoRotate3d, setAutoRotate3d] = useState(false);

  // Auto-rotate 3D loop
  useEffect(() => {
    if (!autoRotate3d || !is3dModalOpen || isDragging3d) return;
    const interval = setInterval(() => {
      setCardRotationY((prev) => (prev + 1) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate3d, is3dModalOpen, isDragging3d]);

  const handle3dMouseDown = (e: React.MouseEvent) => {
    setIsDragging3d(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setAutoRotate3d(false);
  };

  const handle3dMouseMove = (e: React.MouseEvent) => {
    if (!isDragging3d) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    setCardRotationY((prev) => prev + deltaX * 0.7);
    setCardRotationX((prev) => Math.max(-25, Math.min(25, prev - deltaY * 0.3)));
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
  };

  const handle3dMouseUp = () => {
    setIsDragging3d(false);
  };

  const handle3dTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging3d(true);
    setDragStartX(e.touches[0].clientX);
    setDragStartY(e.touches[0].clientY);
    setAutoRotate3d(false);
  };

  const handle3dTouchMove = (e: React.TouchEvent) => {
    if (!isDragging3d || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    const deltaY = e.touches[0].clientY - dragStartY;
    setCardRotationY((prev) => prev + deltaX * 0.7);
    setCardRotationX((prev) => Math.max(-25, Math.min(25, prev - deltaY * 0.3)));
    setDragStartX(e.touches[0].clientX);
    setDragStartY(e.touches[0].clientY);
  };

  // Sync settings when activeEvent changes
  useEffect(() => {
    if (activeEvent) {
      const eventType = activeEvent.eventType || 'wedding';

      let defaultTheme: CardTemplateType = 'wedding_golden_floral';
      let defaultWelcome = 'دعوة لحضور حفل زفاف';
      let defaultSub = 'نتشرف بدعوتكم لحضور حفل زفافنا';

      let extractedGroom = 'أحمد';
      let extractedBride = 'ماريا';
      if (activeEvent.name) {
        const cleanName = activeEvent.name.replace(/^(حفل\s+)?(عقد\s+قران|زواج|زفاف)\s+/i, '').trim();
        if (cleanName.includes(' و ')) {
          const parts = cleanName.split(' و ');
          extractedGroom = parts[0]?.trim() || extractedGroom;
          extractedBride = parts[1]?.trim() || extractedBride;
        } else if (cleanName.includes(' & ')) {
          const parts = cleanName.split(' & ');
          extractedGroom = parts[0]?.trim() || extractedGroom;
          extractedBride = parts[1]?.trim() || extractedBride;
        }
      }

      if (eventType === 'graduation') {
        defaultTheme = 'graduation_royal';
        defaultWelcome = 'حَفْلُ تَخَرُّجْ وتكريم';
        defaultSub = 'يسرنا دعوتكم لمشاركتنا فرحة التخرج والنجاح والتفوق';
      } else if (eventType === 'dinner') {
        defaultTheme = 'dinner_royal';
        defaultWelcome = 'دعوة لتناول طعام العشاء';
        defaultSub = 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة وطاب ممشاكم';
      } else if (eventType === 'celebration') {
        defaultTheme = 'celebration';
        defaultWelcome = 'أهلاً بكم في احتفالنا';
        defaultSub = 'سعداء بحضوركم ومشاركتكم فرحتنا';
      }

      setSettings((prev) => {
        // Enforce that chosen cardTheme matches active eventType
        const isCompatible = prev.cardTheme === 'custom' ||
          (eventType === 'wedding' && (
            prev.cardTheme === 'wedding_golden_floral' ||
            prev.cardTheme === 'wedding_botanical_purple' ||
            prev.cardTheme === 'wedding_royal_burgundy' ||
            prev.cardTheme === 'wedding_calla_sage' ||
            prev.cardTheme === 'wedding_sculpted_ivory' ||
            prev.cardTheme === 'wedding' ||
            prev.cardTheme === 'wedding_andalusian' ||
            prev.cardTheme === 'wedding_damask' ||
            prev.cardTheme === 'wedding_imperial' ||
            prev.cardTheme === 'wedding_minimal_luxury'
          )) ||
          (eventType === 'graduation' && (prev.cardTheme === 'royal_graduation' || prev.cardTheme === 'graduation' || prev.cardTheme === 'graduation_royal' || prev.cardTheme === 'graduation_classic')) ||
          (eventType === 'dinner' && (prev.cardTheme === 'dinner' || prev.cardTheme === 'dinner_royal' || prev.cardTheme === 'dinner_classic')) ||
          (eventType === 'celebration' && prev.cardTheme === 'celebration');

        const normalizedMode = prev.doubleSidedMode === 'back_only' ? 'front_only' : (prev.doubleSidedMode || 'duplex');

        return {
          ...prev,
          cardTheme: (designMode === 'custom_images' && prev.customCardImage) ? 'custom' : (isCompatible && prev.cardTheme !== 'custom' ? prev.cardTheme : defaultTheme),
          doubleSidedMode: normalizedMode,
          venueText: activeEvent.venue || prev.venueText,
          timeText: activeEvent.time || prev.timeText,
          dateText: activeEvent.date || prev.dateText,
          welcomeText: prev.welcomeText || defaultWelcome,
          customSubtitle: prev.customSubtitle || defaultSub,
          weddingTitleType: prev.weddingTitleType || 'couple_names',
          groomName: prev.groomName ?? extractedGroom,
          brideName: prev.brideName ?? extractedBride,
          weddingHijriDate: prev.weddingHijriDate ?? (activeEvent.date || '1446.08.12'),
          showEtiquetteIcons: prev.showEtiquetteIcons ?? true,
          qrInstructionText: prev.qrInstructionText === 'للدخول يرجى إبراز هذا الرمز عند البوابة' ? 'يرجى إبراز الرمز للدخول' : prev.qrInstructionText,
        };
      });
    }
  }, [activeEvent]);

  // Generate sample QR for preview
  useEffect(() => {
    const targetInv = invitations[currentCardIndex] || invitations[0];
    const token = targetInv ? targetInv.token : 'INV-SAMPLE1234';
    api.generateQrDataUrl(token).then(setPreviewSampleQr);
  }, [invitations, currentCardIndex]);

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لإعداد وطباعة الكروت.
      </div>
    );
  }

  // Handle image uploads
  const handleFrontImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const aspect = w / h;
        setDetectedDimensions({ width: w, height: h, aspect });
        setSettings((prev) => ({
          ...prev,
          customCardImage: base64,
          customImageWidth: w,
          customImageHeight: h,
          customAspectRatio: aspect,
          cardTheme: 'custom',
          designSource: 'custom_images',
          customQrSide: prev.customQrSide || 'front',
        }));
        setDesignMode('custom_images');
        setPreviewFace('front');
        setPreviewMode('single');

        // If back image already exists, check if dimensions or aspect ratio differ
        if (settings.customCardBackImage) {
          const backImg = new Image();
          backImg.onload = () => {
            const bw = backImg.naturalWidth;
            const bh = backImg.naturalHeight;
            const backAspect = bw / bh;
            const diffRatio = Math.abs(aspect - backAspect) / aspect;
            if (diffRatio > 0.005 || w !== bw || h !== bh) {
              setIsOutpaintModalOpen(true);
              setFeedback({
                type: 'success',
                text: `تم تحديث الوجه الأمامي (${w}×${h}). تم اكتشاف اختلاف مع الوجه الخلفي (${bw}×${bh})، جاري فتح نافذة المعالجة الذكية للتطابق!`
              });
              return;
            }
          };
          backImg.src = settings.customCardBackImage;
        }

        setFeedback({ 
          type: 'success', 
          text: `تم رفع صورة الوجه الأمامي بنجاح! الأبعاد المكتشفة: ${w} × ${h} بكسل (${aspect > 1.1 ? 'أفقي / عرضي' : aspect < 0.9 ? 'عمودي / طولي' : 'مربع'}).` 
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const backAspect = w / h;

        setSettings((prev) => ({
          ...prev,
          customCardBackImage: base64,
          cardTheme: 'custom',
          designSource: 'custom_images',
          doubleSidedMode: 'duplex',
        }));
        setDesignMode('custom_images');
        setPreviewFace('back');
        setPreviewMode('single');

        // Check if Front image exists and if dimensions/aspect ratio mismatch
        if (settings.customCardImage) {
          const frontW = settings.customImageWidth || detectedDimensions?.width || w;
          const frontH = settings.customImageHeight || detectedDimensions?.height || h;
          const frontAspect = frontW / frontH;
          const diffRatio = Math.abs(frontAspect - backAspect) / frontAspect;

          if (diffRatio > 0.005 || frontW !== w || frontH !== h) {
            setIsOutpaintModalOpen(true);
            setFeedback({
              type: 'success',
              text: `تم رفع الوجه الخلفي (${w}×${h} بكسل). تم اكتشاف اختلاف مع الوجه الأمامي (${frontW}×${frontH} بكسل)، جاري فتح نافذة المعالجة والتمديد الذكي!`
            });
            return;
          }
        }

        setFeedback({ 
          type: 'success', 
          text: `تم رفع صورة الوجه الخلفي بنجاح! (${w} × ${h} بكسل) كرتك الآن بوجهين بأبعاد متطابقة.` 
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyOutpaintedBack = (processedBackDataUrl: string) => {
    setSettings((prev) => ({
      ...prev,
      customCardBackImage: processedBackDataUrl,
      cardTheme: 'custom',
      designSource: 'custom_images',
      doubleSidedMode: 'duplex',
    }));
    setIsOutpaintModalOpen(false);
    setPreviewFace('back');
    setFeedback({
      type: 'success',
      text: '✨ تم اعتماد وتطبيق الوجه الخلفي المعالج بنجاح! أبعاد الوجهين متطابقة 100% وجاهزة للطباعة.',
    });
  };

  const removeCustomImages = () => {
    setSettings((prev) => ({
      ...prev,
      customCardImage: null,
      customCardBackImage: null,
      customImageWidth: undefined,
      customImageHeight: undefined,
      customAspectRatio: undefined,
      designSource: 'system_templates',
      cardTheme: (activeEvent.eventType === 'wedding' ? 'wedding_golden_floral' : 'graduation_royal') as CardTemplateType,
    }));
    setDetectedDimensions(null);
    setDesignMode('system_templates');
    setPreviewFace('front');
  };

  const handleSelectDbTemplate = (tpl: CardTemplateItem) => {
    setSelectedDbTemplateId(tpl.id);
    setSettings((prev) => ({
      ...prev,
      customCardImage: tpl.front_image,
      customCardBackImage: tpl.back_image || null,
      customImageWidth: 1200,
      customImageHeight: 500,
      customAspectRatio: 2.4,
      cardTheme: 'custom',
      designSource: 'custom_images',
      doubleSidedMode: tpl.back_image ? 'duplex' : 'front_only',
      customPrimaryColor: tpl.default_primary_color || '#D4AF37',
      customAccentColor: tpl.default_accent_color || '#FFFFFF',
      qrPosition: tpl.default_qr_position || 'right',
      customShowTextOverlay: true,
    }));
    setDetectedDimensions({ width: 1200, height: 500, aspect: 2.4 });
    setDesignMode('custom_images');
    setPreviewFace('front');
    setFeedback({
      type: 'success',
      text: `✨ تم تطبيق القالب الملكي: "${tpl.name}" بنجاح!`
    });
  };


  // Interactive QR positioning via mouse click/drag for Front Face
  const updateFrontQrPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!frontCardRef.current) return;
    const rect = frontCardRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    setSettings((prev) => ({
      ...prev,
      customQrSide: 'front',
      customQrX: Math.round(Math.max(8, Math.min(92, rawX))),
      customQrY: Math.round(Math.max(8, Math.min(92, rawY))),
    }));
  };

  // Interactive QR positioning via mouse click/drag for Back Face
  const updateBackQrPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!backCardRef.current) return;
    const rect = backCardRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    setSettings((prev) => ({
      ...prev,
      customQrSide: 'back',
      customQrX: Math.round(Math.max(8, Math.min(92, rawX))),
      customQrY: Math.round(Math.max(8, Math.min(92, rawY))),
    }));
  };

  const selectTheme = (themeId: CardTemplateType) => {
    const t = TEMPLATE_OPTIONS.find((opt) => opt.id === themeId);
    const defs = getTemplateDefaultTexts(themeId, activeEvent);
    setSettings((prev) => ({
      ...prev,
      cardTheme: themeId,
      customCardImage: null,
      customCardBackImage: null,
      welcomeText: t ? t.defaultWelcome : defs.welcomeText,
      customSubtitle: t ? t.defaultSub : defs.customSubtitle,
      guestPrefixText: defs.guestPrefixText,
      generalCardNotice: defs.generalCardNotice,
      qrInstructionText: defs.qrInstructionText,
      footerNoteText: defs.footerNoteText,
      backTitleText: defs.backTitleText,
      backHeaderText: defs.backHeaderText,
      backMessageText: defs.backMessageText,
      backBadgeText: defs.backBadgeText,
    }));
  };

  // Grid Presets for full cards
  const gridPresets = [
    { label: '12 كرت (3×4)', cols: 3, rows: 4, desc: '9 صفحات لـ 100 كرت' },
    { label: '10 كروت (2×5)', cols: 2, rows: 5, desc: '10 صفحات لـ 100 كرت' },
    { label: '8 كروت (2×4)', cols: 2, rows: 4, desc: '13 صفحة لـ 100 كرت' },
    { label: '6 كروت (2×3)', cols: 2, rows: 3, desc: '17 صفحة لـ 100 كرت' },
    { label: '4 كروت (2×2)', cols: 2, rows: 2, desc: 'كروت كبيرة فاخرة' },
  ];

  // Presets for pure QR barcode stickers
  const stickerPresets = [
    { id: '24' as const, label: '24 ملصق (3×8)', cols: 3, rows: 8, size: '70×37 مم', desc: 'حجم كبير وواضح جداً' },
    { id: '30' as const, label: '30 ملصق (3×10)', cols: 3, rows: 10, size: '70×29.7 مم', desc: 'شائع ومثالي لكروت الدعوة' },
    { id: '35' as const, label: '35 ملصق (5×7)', cols: 5, rows: 7, size: '42×42 مم', desc: 'ملصقات مربعة متناسقة' },
    { id: '40' as const, label: '40 ملصق (4×10)', cols: 4, rows: 10, size: '52.5×29.7 مم', desc: 'توزيع متوازن وموفر' },
    { id: '48' as const, label: '48 ملصق (6×8)', cols: 6, rows: 8, size: '35×37 مم', desc: 'حجم مدمج للبطاقات الصغيرة' },
    { id: '60' as const, label: '60 ملصق (6×10)', cols: 6, rows: 10, size: '35×29.7 مم', desc: 'أقصى كثافة وتوفير للورق' },
  ];

  const isStickers = settings.printMode === 'pure_qr_stickers';
  const activeStickerPreset = stickerPresets.find((p) => p.id === settings.stickerPreset) || stickerPresets[1]; // default 30
  let stickerCols = activeStickerPreset.cols;
  let stickerRows = activeStickerPreset.rows;
  if (settings.stickerPreset === 'custom') {
    stickerCols = Math.max(1, settings.columns || 5);
    stickerRows = Math.max(1, settings.rows || 7);
  }

  // Print Scope: Named Only vs General Only (All cards combined option permanently removed per user request)
  const namedCount = useMemo(() => invitations.filter((i) => Boolean(i.guest_name && i.guest_name.trim())).length, [invitations]);
  const generalCount = useMemo(() => invitations.filter((i) => !i.guest_name || !i.guest_name.trim()).length, [invitations]);

  const [printScope, setPrintScope] = useState<'named_only' | 'general_only'>(
    namedCount > 0 ? 'named_only' : 'general_only'
  );

  // Auto fallback to general_only if no named invitations exist in the event
  useEffect(() => {
    if (namedCount === 0 && generalCount > 0 && printScope === 'named_only') {
      setPrintScope('general_only');
    }
  }, [namedCount, generalCount, printScope]);

  const isCustomDesign = designMode === 'custom_images';

  const displayedInvitations = useMemo(() => {
    if (isCustomDesign) {
      return invitations;
    }
    if (printScope === 'named_only') {
      return invitations.filter((i) => Boolean(i.guest_name && i.guest_name.trim()));
    }
    return invitations.filter((i) => !i.guest_name || !i.guest_name.trim());
  }, [invitations, printScope, isCustomDesign]);

  // Ensure card index is within bounds of filtered cards
  useEffect(() => {
    if (currentCardIndex >= displayedInvitations.length && displayedInvitations.length > 0) {
      setCurrentCardIndex(0);
    }
  }, [displayedInvitations.length, currentCardIndex]);

  const cardsPerPage = isStickers ? (stickerCols * stickerRows) : (settings.columns * settings.rows);
  const totalPages = Math.ceil(displayedInvitations.length / cardsPerPage) || 1;

  const currentInv = displayedInvitations[currentCardIndex] || displayedInvitations[0];
  const currentGuestName = currentInv?.guest_name && currentInv.guest_name.trim() ? currentInv.guest_name.trim() : null;
  const currentInvNum = currentInv ? currentInv.invitation_number : 1;

  // Handle saving modified guest name directly from card preview
  const handleSaveCurrentCardGuestName = async () => {
    if (!currentInv) return;
    setSavingCardName(true);
    const cleanName = editingCardNameVal.trim();
    try {
      await api.updateGuestName(currentInv.id, cleanName);
      currentInv.guest_name = cleanName || null;
      currentInv.has_name = cleanName ? 1 : 0;
      setIsEditingCardName(false);
      setFeedback({
        type: 'success',
        text: cleanName
          ? `تم تحديث اسم المدعو للكرت #${currentInv.invitation_number} بنجاح إلى: "${cleanName}"`
          : `تم حذف الاسم وأصبح الكرت #${currentInv.invitation_number} كرت دعوة عامة (بدون اسم)`
      });
      if (onRefreshInvitations) {
        onRefreshInvitations();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'فشل تحديث اسم المدعو'
      });
    } finally {
      setSavingCardName(false);
    }
  };

  // Filtered templates: strictly display templates matching current event type (e.g. Wedding only shows Wedding templates)
  const filteredTemplates = useMemo(() => {
    const eventType = activeEvent?.eventType || 'wedding';
    const matching = TEMPLATE_OPTIONS.filter((opt) => opt.category === eventType);
    if (matching.length > 0) return matching;
    return TEMPLATE_OPTIONS.filter((opt) => opt.category === 'wedding');
  }, [activeEvent?.eventType]);

  const hasBackImage = Boolean(settings.customCardBackImage);
  const isSquare = false;
  const isVertical = false;
  const isLandscape = true;
  const isTwoSidedPreview = !isStickers && (isCustomDesign ? (hasBackImage && settings.doubleSidedMode === 'duplex') : (settings.doubleSidedMode === 'duplex'));

  // Helper to get sanitized settings for export & print
  const getEffectiveSettings = (): PrintSettings => ({
    ...settings,
    cardTheme: isCustomDesign
      ? 'custom'
      : (settings.cardTheme === 'custom' ? (activeEvent.eventType === 'wedding' ? 'wedding_golden_floral' : 'graduation_royal') : settings.cardTheme),
    customCardImage: isCustomDesign ? settings.customCardImage : null,
    customCardBackImage: isCustomDesign ? settings.customCardBackImage : null,
  });

  // Export handlers
  const handleExportPdf = async () => {
    if (displayedInvitations.length === 0) {
      setFeedback({ type: 'error', text: 'لا توجد كروت في هذا النطاق للتصدير!' });
      return;
    }
    setExporting(true);
    setFeedback(null);
    try {
      const res = await api.exportPdf({
        event: activeEvent,
        invitations: displayedInvitations,
        printSettings: getEffectiveSettings(),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: `تم تصدير ملف الـ PDF بنجاح (${displayedInvitations.length} كرت) في: ${res.filePath}` });
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
    if (displayedInvitations.length === 0) {
      setFeedback({ type: 'error', text: 'لا توجد كروت في هذا النطاق للطباعة!' });
      return;
    }
    setPrinting(true);
    setFeedback(null);
    try {
      const res = await api.printPdf({
        event: activeEvent,
        invitations: displayedInvitations,
        printSettings: getEffectiveSettings(),
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
    settings.customAccentColor,
    settings.cardTheme
  );
  const customAspect = settings.customAspectRatio || (detectedDimensions ? (detectedDimensions.width / detectedDimensions.height) : 1.46);
  const cardAspectRatio = isCustomDesign
    ? `${customAspect}`
    : isSquare
    ? '1 / 1'
    : isLandscape
    ? `${Math.max(settings.cardWidth || 85, settings.cardHeight || 58)} / ${Math.min(settings.cardWidth || 85, settings.cardHeight || 58)}`
    : `${Math.min(settings.cardWidth || 58, settings.cardHeight || 85)} / ${Math.max(settings.cardWidth || 58, settings.cardHeight || 85)}`;

  // 3D Front Face Renderer
  const render3dFrontFace = () => {
    if (isCustomDesign) {
      if (!settings.customCardImage) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-400">
            <ImageIcon className="w-10 h-10 text-slate-500 mb-2" />
            <span className="text-xs font-bold text-white mb-1">الوجه الأمامي غير مرفوع</span>
            <span className="text-[11px]">ارفع صورة الوجه الأمامي لتظهر هنا</span>
          </div>
        );
      }
      return (
        <div className="relative w-full h-full">
          <img
            src={settings.customCardImage}
            alt="Front Face"
            className="w-full h-full object-cover pointer-events-none select-none"
          />
          {settings.customQrSide !== 'back' && (
            <div
              className={`absolute p-1.5 rounded-xl shadow-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                settings.customQrBg !== false ? 'bg-white border border-slate-300' : ''
              }`}
              style={{
                left: `${settings.customQrX ?? 50}%`,
                top: `${settings.customQrY ?? 65}%`,
                width: `${(settings.customQrSize ?? 30) * 2.3}px`,
                minHeight: `${(settings.customQrSize ?? 30) * 2.3}px`,
              }}
            >
              {settings.showEventName && activeEvent?.name && (
                <div className="text-[7.5px] font-bold text-center text-slate-900 mb-0.5 truncate max-w-full px-0.5 leading-tight">
                  {activeEvent.name}
                </div>
              )}
              {previewSampleQr ? (
                <img src={previewSampleQr} alt="QR" className="w-full aspect-square object-contain mx-auto" />
              ) : (
                <div className="w-full aspect-square bg-slate-200" />
              )}
              {settings.showInvitationNumber !== false && (
                <div className="text-[8px] font-mono font-bold text-center text-slate-800 mt-0.5">
                  #{String(currentInvNum).padStart(3, '0')}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // System Template Front Face in 3D
    return (
      <PresetFrontCard
        settings={settings}
        palette={palette}
        activeEvent={activeEvent}
        currentGuestName={currentGuestName}
        currentInvNum={currentInvNum}
        previewSampleQr={previewSampleQr}
        isLandscape={isLandscape}
        isSquare={isSquare}
      />
    );
  };

  // 3D Back Face Renderer
  const render3dBackFace = () => {
    if (isCustomDesign) {
      if (!settings.customCardBackImage) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-400">
            <Layers className="w-10 h-10 text-slate-500 mb-2" />
            <span className="text-xs font-bold text-white mb-1">الوجه الخلفي غير مرفوع</span>
            <span className="text-[11px] max-w-[220px]">كرتك الحالي بطباعة وجه أمامي فقط. يمكنك رفع تصميم خلفي لتفعيل الطباعة المزدوجة.</span>
          </div>
        );
      }
      return (
        <div className="relative w-full h-full">
          <img
            src={settings.customCardBackImage}
            alt="Back Face"
            className="w-full h-full object-cover pointer-events-none select-none"
          />
          {settings.customQrSide === 'back' && (
            <div
              className={`absolute p-1.5 rounded-xl shadow-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                settings.customQrBg !== false ? 'bg-white border border-slate-300' : ''
              }`}
              style={{
                left: `${settings.customQrX ?? 50}%`,
                top: `${settings.customQrY ?? 65}%`,
                width: `${(settings.customQrSize ?? 30) * 2.3}px`,
                minHeight: `${(settings.customQrSize ?? 30) * 2.3}px`,
              }}
            >
              {settings.showEventName && activeEvent?.name && (
                <div className="text-[7.5px] font-bold text-center text-slate-900 mb-0.5 truncate max-w-full px-0.5 leading-tight">
                  {activeEvent.name}
                </div>
              )}
              {previewSampleQr ? (
                <img src={previewSampleQr} alt="QR" className="w-full aspect-square object-contain mx-auto" />
              ) : (
                <div className="w-full aspect-square bg-slate-200" />
              )}
              {settings.showInvitationNumber !== false && (
                <div className="text-[8px] font-mono font-bold text-center text-slate-800 mt-0.5">
                  #{String(currentInvNum).padStart(3, '0')}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // System Template Back Face in 3D
    return (
      <PresetBackCard
        settings={settings}
        palette={palette}
        activeEvent={activeEvent}
      />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hidden File Inputs for Custom Design Uploads */}
      <input
        ref={frontFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFrontImageUpload}
      />
      <input
        ref={backFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleBackImageUpload}
      />

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <span>تصميم وطباعة كروت الـ QR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            اختر قالباً جاهزاً حسب مناسبتك أو ارفع تصميمك الخاص (بوجه واحد أو بوجهين أمامي وخلفي) مع تحديد مكان الباركود تفاعلياً.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isCustomDesign && (
            <>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all cursor-pointer"
                title="دليل مرئي مبسط يشرح كيف تصمم وتجلب كرت بوجهين من برامج خارجية مثل كانفا"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>💡 دليل التصميم</span>
              </button>

              <button
                onClick={() => frontFileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{settings.customCardImage ? 'استبدال الوجه الأمامي' : 'رفع تصميم الكرت (أمامي)'}</span>
              </button>

              <button
                onClick={() => backFileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-teal-500/40 text-teal-300 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>{settings.customCardBackImage ? 'استبدال الوجه الخلفي' : 'رفع تصميم (خلفي)'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportPdf}
            disabled={exporting || invitations.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>{exporting ? 'جاري الإنشاء...' : 'تصدير PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={printing || invitations.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة مباشرة</span>
          </button>
        </div>
      </div>

      {/* 1. PRIMARY MODE SELECTION: SYSTEM TEMPLATES VS IMPORT CUSTOM IMAGES */}
      <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDesignMode('system_templates');
              setSettings(prev => ({
                ...prev,
                designSource: 'system_templates',
                cardTheme: prev.cardTheme === 'custom'
                  ? (activeEvent.eventType === 'wedding' ? 'wedding_golden_floral' : 'graduation_royal')
                  : prev.cardTheme,
              }));
            }}
            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl text-right transition-all cursor-pointer ${
              designMode === 'system_templates'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/60'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${designMode === 'system_templates' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                <span>🎨 الطباعة حسب قوالبنا الجاهزة</span>
                {designMode === 'system_templates' && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-950 text-amber-300 font-bold">نشط</span>
                )}
              </div>
              <div className={`text-[11px] mt-0.5 ${designMode === 'system_templates' ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                اختر من قوالبنا الفاخرة المعتمدة مع تخصيص الألوان والمونوغرام وبيانات المناسبة
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDesignMode('custom_images');
              setSettings(prev => ({
                ...prev,
                designSource: 'custom_images',
                cardTheme: 'custom',
              }));
            }}
            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl text-right transition-all cursor-pointer ${
              designMode === 'custom_images'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/25 scale-[1.01]'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/60'
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${designMode === 'custom_images' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                <span>🖼️ استيراد وتصدير صورة خلفية وأمامية</span>
                {designMode === 'custom_images' && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-950 text-teal-300 font-bold">نشط</span>
                )}
              </div>
              <div className={`text-[11px] mt-0.5 ${designMode === 'custom_images' ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                ارفع تصميم بطاقتك الخاصة بأبعادها الأصلية مع وضع الباركود وإلغاء اسم المدعو
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR BASED ON SELECTED PRIMARY MODE */}
      {designMode === 'system_templates' ? (
        <>
          {/* PRINT MODE SWITCHER: LUXURY FULL CARDS VS PURE QR STICKERS */}
          <div className="flex items-center gap-2.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, printMode: 'cards' });
                setCurrentSheetPage(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.printMode !== 'pure_qr_stickers'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>🎴 كروت بتصميم فاخر (طباعة بطاقات دعوة كاملة)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, printMode: 'pure_qr_stickers' });
                setPreviewMode('sheet');
                setCurrentSheetPage(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.printMode === 'pure_qr_stickers'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.01]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>🏷️ ملصقات باركود فقط (عالية الكثافة - للقص واللصق على كروتك الجاهزة)</span>
            </button>
          </div>

          {/* PRINT SCOPE & FLEXIBILITY SELECTOR (NAMED VS GENERAL ONLY) */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>تحديد نطاق الطباعة والتصدير:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                    طباعة مفصولة بدقة
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  اختر طباعة الكروت المخصصة بأسماء المدعوين أو طباعة الكروت العامة (بدون اسم)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setPrintScope('named_only'); setCurrentCardIndex(0); setCurrentSheetPage(0); }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  printScope === 'named_only'
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>كروت بأسماء المدعوين فقط ({namedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => { setPrintScope('general_only'); setCurrentCardIndex(0); setCurrentSheetPage(0); }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  printScope === 'general_only'
                    ? 'bg-blue-500 text-white shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-blue-400 hover:bg-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>الكروت العامة (بدون اسم) ({generalCount})</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* CUSTOM IMAGES INFO BANNER */
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>نمط استيراد وتصدير الصور المخصصة:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                  أبعاد حرة تلقائية + باركود نقي
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-snug">
                النظام يكتشف أبعاد صورتك تلقائياً دون إجبارك على مقاس محدد، ولا يضع اسم المدعو على البطاقة، ويمكنك تحديد موضع الباركود وإلغاء اسم المناسبة ورقم الكود.
              </div>
            </div>
          </div>

          <div className="text-xs text-teal-300 font-mono font-bold bg-teal-950/60 border border-teal-800/60 px-3 py-1.5 rounded-xl shrink-0">
            إجمالي الكروت: {invitations.length} كرت
          </div>
        </div>
      )}

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

      {/* Main Grid: Controls (Left) and Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Panel (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto">

          {/* TOTAL INVITATIONS BADGE */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">إجمالي الكروت الجاهزة للطباعة:</span>
            <span className="font-bold text-amber-400 font-mono px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {invitations.length} كرت
            </span>
          </div>

          {/* ======================================================== */}
          {/* OPTION 1: PURE QR STICKERS CONTROLS                      */}
          {/* ======================================================== */}
          {isStickers ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm text-white mb-1">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" />
                  <span>إعدادات ملصقات الباركود عالية الكثافة</span>
                </div>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  طباعة باركودات فقط على ورق الملصقات (Stickers Sheet) للقص واللصق على كروت الدعوة الجاهزة بدون طباعة كروت كاملة.
                </p>
              </div>

              {/* STICKER PRESETS SELECTION */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اختر عدد ومقاس الملصقات في ورقة A4:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">مقاسات ملصقات قياسية</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stickerPresets.map((sp) => {
                    const isSelected = (settings.stickerPreset || '30') === sp.id;
                    const pagesNeeded = Math.ceil(invitations.length / (sp.cols * sp.rows)) || 1;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          setCurrentSheetPage(0);
                          setSettings({ ...settings, stickerPreset: sp.id });
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {sp.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                            {sp.size}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span>{sp.desc}</span>
                          <span className="font-bold text-emerald-400 font-mono">({pagesNeeded} ورقة)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STICKER DISPLAY TOGGLES */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">خيارات محتوى الملصق:</h4>
                
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stickerShowNumber !== false}
                    onChange={(e) => setSettings({ ...settings, stickerShowNumber: e.target.checked })}
                    className="rounded text-emerald-500 w-4 h-4"
                  />
                  <span>إظهار رقم الدعوة المرجعي أسفل الباركود (#{String(1).padStart(3, '0')})</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stickerShowCutMarks !== false}
                    onChange={(e) => setSettings({ ...settings, stickerShowCutMarks: e.target.checked })}
                    className="rounded text-emerald-500 w-4 h-4"
                  />
                  <span>إظهار خطوط القص المتقطعة حول كل ملصق</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stickerShowName === true}
                    onChange={(e) => setSettings({ ...settings, stickerShowName: e.target.checked })}
                    className="rounded text-emerald-500 w-4 h-4"
                  />
                  <span>إظهار اسم المدعو على الملصق (في الكروت المخصصة بالاسم)</span>
                </label>
              </div>

              {/* STATS & CALCULATION BOX */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-300">
                  <span>عدد الملصقات في الورقة الواحدة:</span>
                  <span className="font-mono text-white text-sm">{cardsPerPage} ملصق ({stickerCols} × {stickerRows})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>إجمالي كروت المناسبة:</span>
                  <span className="font-mono text-white">{invitations.length} كرت</span>
                </div>
                <div className="flex items-center justify-between font-bold text-amber-300 pt-1.5 border-t border-emerald-500/20">
                  <span>إجمالي أوراق A4 المطلوبة للطباعة:</span>
                  <span className="font-mono text-white text-sm">{totalPages} ورقة A4</span>
                </div>
                {invitations.length % cardsPerPage !== 0 && (
                  <div className="text-[10px] text-slate-400">
                    * الورقة الأخيرة ستحتوي على {invitations.length % cardsPerPage} ملصقاً فقط والباقي خانات فارغة.
                  </div>
                )}
              </div>
            </div>
          ) : isCustomDesign ? (
            /* ======================================================== */
            /* OPTION 2: CUSTOM DESIGN CONTROLS (FRONT & BACK IMAGES)   */
            /* ======================================================== */
            <div className="space-y-4">
              
              {/* Custom Design Banner */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/40 text-xs text-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">إعدادات بطاقة الصور المخصصة</div>
                    <div className="text-[11px] text-teal-300/80">
                      {settings.customCardImage
                        ? (hasBackImage ? 'تصميم مرفوع بوجهين (أمامي وخلفي)' : 'تصميم مرفوع بوجه أمامي واحد')
                        : 'يرجى رفع صورة الوجه الأمامي لبدء المعاينة'}
                    </div>
                  </div>
                </div>
                {settings.customCardImage && (
                  <button
                    onClick={removeCustomImages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>حذف الصور والعودة</span>
                  </button>
                )}
              </div>

              {/* Detected Dimensions Badge */}
              {(settings.customImageWidth || detectedDimensions) && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span>📐 أبعاد الصورة المكتشفة تلقائياً:</span>
                  </span>
                  <span className="font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-lg">
                    {settings.customImageWidth || detectedDimensions?.width} × {settings.customImageHeight || detectedDimensions?.height} بكسل
                    {' '}(
                    {(settings.customAspectRatio || detectedDimensions?.aspect || 1) > 1.1
                      ? 'أفقي / عرضي'
                      : (settings.customAspectRatio || detectedDimensions?.aspect || 1) < 0.9
                      ? 'عمودي / طولي'
                      : 'مربع'}
                    )
                  </span>
                </div>
              )}

              {/* Uploaded Faces Summary & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Front face card */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">صورة الوجه الأمامي:</span>
                    {settings.customCardImage ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">مرفوع ✓</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">مطلوب</span>
                    )}
                  </div>
                  {settings.customCardImage ? (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-700 mb-2 flex items-center justify-center bg-black/40">
                      <img src={settings.customCardImage} alt="Front" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div
                      onClick={() => frontFileInputRef.current?.click()}
                      className="w-full h-24 rounded-lg border border-dashed border-slate-700 hover:border-teal-400 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-[11px] mb-2 p-2 text-center cursor-pointer transition-colors"
                    >
                      <Upload className="w-5 h-5 mb-1 text-teal-400" />
                      <span>انقر لرفع الوجه الأمامي</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => frontFileInputRef.current?.click()}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold cursor-pointer transition-colors"
                  >
                    {settings.customCardImage ? 'استبدال الصورة الأمامية' : 'رفع الصورة الأمامية'}
                  </button>
                </div>

                {/* Back face card */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">صورة الوجه الخلفي:</span>
                    {hasBackImage ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">مرفوع ✓</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">اختياري</span>
                    )}
                  </div>
                  {settings.customCardBackImage ? (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-700 mb-2 flex items-center justify-center bg-black/40">
                      <img src={settings.customCardBackImage} alt="Back" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div
                      onClick={() => backFileInputRef.current?.click()}
                      className="w-full h-24 rounded-lg border border-dashed border-slate-800 hover:border-teal-400 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center text-slate-500 text-[10px] mb-2 p-2 text-center cursor-pointer transition-colors"
                    >
                      <Layers className="w-5 h-5 mb-1 text-slate-600" />
                      <span>اختياري: ارفع الوجه الخلفي إذا كان الكرت بوجهين</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => backFileInputRef.current?.click()}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-bold cursor-pointer transition-colors"
                  >
                    {hasBackImage ? 'استبدال الوجه الخلفي' : 'رفع وجه خلفي'}
                  </button>
                </div>
              </div>

              {/* AI Smart Outpainting / Dimension Matcher Action Card */}
              {settings.customCardImage && settings.customCardBackImage && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-amber-950/30 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>مطابقة أبعاد الوجهين وتمديد الخلفية (AI Smart Outpaint)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        جعل Front هو المرجع وتمديد خلفية Back بذكاء بدون تشويه أو مط لمنع أي خلل بالطباعة والـ PDF.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOutpaintModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>معاينة وتعديل المقاس بالذكاء الاصطناعي</span>
                  </button>
                </div>
              )}

              {/* QR Code Target Face (Front vs Back) */}
              {hasBackImage && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <label className="block text-xs font-bold text-teal-400">
                    على أي وجه تريد وضع كود الـ QR؟
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, customQrSide: 'front' });
                        setPreviewFace('front');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        settings.customQrSide !== 'back'
                          ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🖼️ الوجه الأمامي</span>
                      {settings.customQrSide !== 'back' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, customQrSide: 'back' });
                        setPreviewFace('back');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        settings.customQrSide === 'back'
                          ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>📄 الوجه الخلفي</span>
                      {settings.customQrSide === 'back' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Positioning Sliders & Quick Presets */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" />
                    <span>موقع وحجم الباركود فوق الصورة:</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    يطبق على كل الكروت ✓
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>
                    <b>تحديد تفاعلي:</b> يمكنك النقر مباشرة في أي مكان على صورة الكرت في نافذة المعاينة لنقل الباركود فوراً إلى ذلك الموضع!
                  </span>
                </div>

                {/* Size Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>حجم الباركود فوق الكرت</span>
                    <span className="font-mono text-teal-400">{settings.customQrSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="55"
                    value={settings.customQrSize ?? 30}
                    onChange={(e) => setSettings({ ...settings, customQrSize: parseInt(e.target.value) })}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Elements with Barcode (Toggles for Event Name & Code Number & White Box) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <span>العناصر المرافقة للباركود (اختيارية):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    يمكن إلغاؤها ليبقى الباركود فقط
                  </span>
                </div>

                {/* Toggle: Show Event Name */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">إظهار اسم المناسبة</div>
                    <div className="text-[10px] text-slate-400">
                      عرض اسم المناسبة ({activeEvent.name}) أعلى الباركود
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.showEventName)}
                    onChange={(e) => setSettings({ ...settings, showEventName: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>

                {/* Toggle: Show Invitation Number */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">إظهار رقم الكود / رقم الدعوة</div>
                    <div className="text-[10px] text-slate-400">
                      عرض رقم الكود (مثال: #001) أسفل الباركود
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showInvitationNumber !== false}
                    onChange={(e) => setSettings({ ...settings, showInvitationNumber: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>

                {/* Toggle: White Background behind QR */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">خلفية بيضاء حامية خلف الباركود</div>
                    <div className="text-[10px] text-slate-400">
                      إضافة إطار أبيض خلف الباركود لحمايته وسهولة مسحه
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.customQrBg !== false}
                    onChange={(e) => setSettings({ ...settings, customQrBg: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                  />
                </label>

                {/* Informative Note */}
                <div className="p-2.5 rounded-xl bg-slate-900 text-[11px] text-slate-400 leading-relaxed border border-slate-800">
                  💡 <b>ملاحظة:</b> لا يتم وضع اسم المدعو في هذا النمط نهائياً. وإذا ألغيت "اسم المناسبة" و"رقم الكود"، فسيظهر <b>الباركود فقط</b> صافياً على كرتك.
                </div>
              </div>

              {/* Two-Sided Printing Mode (If back image exists) */}
              {hasBackImage && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <FlipHorizontal className="w-4 h-4" />
                      <span>نمط طباعة الوجهين:</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                      خيارات الطباعة
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      settings.doubleSidedMode === 'duplex'
                        ? 'bg-teal-500/15 border-teal-500/50 text-teal-200 font-bold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="duplex_mode"
                        checked={settings.doubleSidedMode === 'duplex'}
                        onChange={() => setSettings({ ...settings, doubleSidedMode: 'duplex' })}
                        className="text-teal-500 mt-0.5"
                      />
                      <div>
                        <div>طباعة وجهين (أمامي + خلفي)</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                          تتطابق أفقياً عند الطباعة على وجهين
                        </div>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      settings.doubleSidedMode === 'front_only' || !settings.doubleSidedMode
                        ? 'bg-teal-500/15 border-teal-500/50 text-teal-200 font-bold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="duplex_mode"
                        checked={settings.doubleSidedMode === 'front_only' || !settings.doubleSidedMode}
                        onChange={() => setSettings({ ...settings, doubleSidedMode: 'front_only' })}
                        className="text-teal-500 mt-0.5"
                      />
                      <div>
                        <div>طباعة وجه واحد (أمامي فقط)</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                          طباعة الوجه الأمامي فقط
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ======================================================== */
            /* OPTION 3: PRESET TEMPLATES DYNAMICALLY BY EVENT TYPE     */
            /* ======================================================== */
            <div className="space-y-4">
              
              {/* CURRENT EVENT TYPE BADGE (NO graduation/dinner for wedding!) */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>القوالب والتصاميم الفاخرة المعتمدة للمناسبة:</span>
                </label>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                  {activeEvent.eventType === 'wedding' ? '💍 حفلات زفاف وملكة' :
                   activeEvent.eventType === 'graduation' ? '🎓 حفلات تخرج' :
                   activeEvent.eventType === 'dinner' ? '🍽️ مأدبة وعشاء' : '🎉 احتفالات ومؤتمرات'}
                </span>
              </div>

              {/* IMPORTED LUXURY DATABASE TEMPLATES GALLERY (MATCHING THE PHOTO) */}
              {dbTemplates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>قوالب الخلفيات الفاخرة (بوجهين عالية الدقة):</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {dbTemplates.length} قالب جاهز
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dbTemplates.map((tpl) => {
                      const isSelected = selectedDbTemplateId === tpl.id || Boolean(settings.customCardImage && settings.customCardImage === tpl.front_image);
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectDbTemplate(tpl)}
                          className={`group relative p-2 rounded-2xl border text-right transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/80 scale-[1.02]'
                              : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {/* Artwork Thumbnail */}
                          <div className="relative w-full aspect-[2.4/1] rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-2">
                            <img src={tpl.front_image} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            {isSelected && (
                              <div className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-amber-500 text-slate-950 shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            {tpl.back_image && (
                              <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded text-[9px] font-black bg-slate-950/80 text-amber-300 border border-amber-500/30">
                                بوجهين 🎴
                              </span>
                            )}
                          </div>

                          <div>
                            <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                              {tpl.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                              <span>نص: {tpl.text_color_scheme === 'gold' ? 'ذهبي' : tpl.text_color_scheme === 'dark' ? 'داكن' : 'أبيض'}</span>
                              <span className="text-amber-400 font-bold">تطبيق ↵</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* WEDDING TITLE FORMAT QUESTION: COUPLE NAMES VS EVENT NAME */}
              {activeEvent.eventType === 'wedding' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
                      <span>صيغة عنوان بطاقة الدعوة في التصميم:</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      خيارات الزفاف
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    هل ترغب بأن تكون الدعوة بأسماء العريس والعروسة (كما في الصور) أم باسم المناسبة العام؟
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, weddingTitleType: 'couple_names' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        (settings.weddingTitleType || 'couple_names') === 'couple_names'
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-amber-300 shadow-md font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>💍 بأسماء العريس والعروسة</span>
                      {(settings.weddingTitleType || 'couple_names') === 'couple_names' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, weddingTitleType: 'event_name' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        settings.weddingTitleType === 'event_name'
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-amber-300 shadow-md font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🏷️ باسم المناسبة الكريمة</span>
                      {settings.weddingTitleType === 'event_name' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {(settings.weddingTitleType || 'couple_names') === 'couple_names' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-500/20 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          🤵 اسم العريس:
                        </label>
                        <input
                          type="text"
                          value={settings.groomName ?? ''}
                          onChange={(e) => setSettings({ ...settings, groomName: e.target.value })}
                          placeholder="مثال: أحمد"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          👰 اسم العروسة:
                        </label>
                        <input
                          type="text"
                          value={settings.brideName ?? ''}
                          onChange={(e) => setSettings({ ...settings, brideName: e.target.value })}
                          placeholder="مثال: ماريا"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          📅 التاريخ الهجري للزفاف:
                        </label>
                        <input
                          type="text"
                          value={settings.weddingHijriDate ?? ''}
                          onChange={(e) => setSettings({ ...settings, weddingHijriDate: e.target.value })}
                          placeholder="مثال: 1446.08.12 هـ"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-3">
                          <input
                            type="checkbox"
                            checked={settings.showEtiquetteIcons !== false}
                            onChange={(e) => setSettings({ ...settings, showEtiquetteIcons: e.target.checked })}
                            className="rounded text-amber-500 w-4 h-4"
                          />
                          <span>أيقونات الإتيكيت (ممنوع التصوير / الأطفال) 📷🚫</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TWO-SIDED (DUPLEX) PRINTING SELECTOR FOR PRESET TEMPLATES */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <FlipHorizontal className="w-4 h-4" />
                    <span>نمط طباعة كروت القالب:</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                    خياران للطباعة
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    settings.doubleSidedMode === 'duplex'
                      ? 'bg-teal-500/15 border-teal-500/50 text-teal-200 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="preset_duplex_mode"
                      checked={settings.doubleSidedMode === 'duplex'}
                      onChange={() => setSettings({ ...settings, doubleSidedMode: 'duplex' })}
                      className="text-teal-500 mt-0.5"
                    />
                    <div>
                      <div>طباعة وجهين (أمامي + خلفي معاً)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                        تُنشئ صفحة للوجه الأمامي تليها صفحة للوجه الخلفي المطرزة معكوسة أفقياً لتتطابق تماماً في الطابعات المزدوجة
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    settings.doubleSidedMode === 'front_only' || !settings.doubleSidedMode
                      ? 'bg-teal-500/15 border-teal-500/50 text-teal-200 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="preset_duplex_mode"
                      checked={settings.doubleSidedMode === 'front_only' || !settings.doubleSidedMode}
                      onChange={() => setSettings({ ...settings, doubleSidedMode: 'front_only' })}
                      className="text-teal-500 mt-0.5"
                    />
                    <div>
                      <div>طباعة وجه واحد (الوجه الأمامي فقط)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                        طباعة الوجه الأمامي فقط المحتوي على الباركود وبيانات الدعوة والاسم
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* COLOR PALETTE SELECTOR */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>لوحة ألوان القالب:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">تطبيق فوري ومتناسق</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'default' as const, label: 'كحلي وذهبي ملوكي', primary: '#0f172a', accent: '#d97706', bg: '#FCF9F2' },
                    { id: 'black_white' as const, label: 'أبيض وأسود كلاسيك', primary: '#18181b', accent: '#71717a', bg: '#ffffff' },
                    { id: 'blue_white' as const, label: 'أزرق ملكي وأبيض', primary: '#1e3a8a', accent: '#0284c7', bg: '#ffffff' },
                    { id: 'emerald_white' as const, label: 'أخضر زمردي', primary: '#064e3b', accent: '#10b981', bg: '#ffffff' },
                    { id: 'burgundy' as const, label: 'عنابي وماروني', primary: '#881337', accent: '#e11d48', bg: '#ffffff' },
                    { id: 'violet' as const, label: 'بنفسجي ملكي', primary: '#581c87', accent: '#9333ea', bg: '#ffffff' },
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
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: colorOpt.primary }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: colorOpt.accent }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-sm" style={{ backgroundColor: colorOpt.bg }} />
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                          {colorOpt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. CARD SHAPE: STRICTLY HORIZONTAL LANDSCAPE (85x58 mm) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span>شكل ومقاس الكرت (معتمد ومثبت):</span>
                  </label>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    ✓ مستطيل بالعرض (أفقي) فقط
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-6 rounded-md border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-mono text-amber-300 font-black">85×58</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">مستطيل بالعرض (85 × 58 مم)</div>
                      <div className="text-[10px] text-slate-400">توزيع قياسي 8 كروت في صفحة A4 (عمودين × 4 صفوف) مطابق للتصميم الفاخر</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    2 × 4
                  </span>
                </div>
              </div>

              {/* 2. CANVA-STYLE DYNAMIC CONTROLS CENTER (سهولة تحكم كاملة مثل كانفا) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>لوحة التحكم الديناميكية (تحكّم بكافة تفاصيل الكرت):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const defs = getTemplateDefaultTexts(settings.cardTheme || 'wedding_golden_floral', activeEvent);
                      setSettings((prev) => ({
                        ...prev,
                        ...defs,
                        monogramEnabled: true,
                        monogramGroomInitial: 'A',
                        monogramBrideInitial: 'M',
                        showHeartIcon: true,
                        guestPrefixEnabled: true,
                        guestPrefixText: 'الأستاذ/',
                        showFooterDivider: true,
                        footerDividerText: 'بحضوركم تكتمل فرحتنا',
                        showBackEnglishNote: true,
                        backEnglishNoteText: 'A Special Day\nA Lasting Memory',
                        weddingTitleType: 'couple_names',
                        showVenue: true,
                        showTime: true,
                        showDate: true,
                      }));
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 flex items-center gap-1 transition-all"
                    title="استعادة الإعدادات الأصلية الافتراضية"
                  >
                    <span>🔄 استعادة الافتراضي</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يمكنك تخصيص كل كلمة، إخفاء أو إظهار أي عنصر بعلامة (✕)، وتعديل نمط العنوان والألوان بسهولة تامة:
                </p>

                {/* A. DYNAMIC COLOR CUSTOMIZATION */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      <span>تغيير ألوان الكرت ديناميكياً:</span>
                    </span>
                    <span className="text-[9px] text-slate-400">تحكّم مباشر بالألوان</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">اللون الذهبي الرئيسي</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={settings.customPrimaryColor || '#BFA063'}
                          onChange={(e) => setSettings({ ...settings, colorScheme: 'custom', customPrimaryColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <span className="text-[9px] font-mono text-slate-300">{settings.customPrimaryColor || '#BFA063'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">لون النصوص والعناوين</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={settings.customAccentColor || '#2D2319'}
                          onChange={(e) => setSettings({ ...settings, colorScheme: 'custom', customAccentColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <span className="text-[9px] font-mono text-slate-300">{settings.customAccentColor || '#2D2319'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">لون بطاقة الكرت (الخلفية)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={settings.customBgColor || '#FCFAF7'}
                          onChange={(e) => setSettings({ ...settings, colorScheme: 'custom', customBgColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <span className="text-[9px] font-mono text-slate-300">{settings.customBgColor || '#FCFAF7'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. MONOGRAM INITIALS (A 🌿 M) WITH (X) TOGGLE */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-300">مونوغرام حرفي العروسين (A 🌿 M):</span>
                      <span className="text-[9px] text-slate-400">(أعلى الكرت)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, monogramEnabled: settings.monogramEnabled === false })}
                      className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold transition-all ${
                        settings.monogramEnabled !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                      title={settings.monogramEnabled !== false ? 'انقر لحذف المونوغرام (✕)' : 'انقر لإعادة المونوغرام (✓)'}
                    >
                      {settings.monogramEnabled !== false ? (
                        <>
                          <span>ظاهر</span>
                          <span className="text-rose-400 font-black ml-1 hover:text-rose-300">✕</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">محذوف</span>
                          <span className="text-emerald-400 font-bold ml-1">+ إضافة</span>
                        </>
                      )}
                    </button>
                  </div>

                  {settings.monogramEnabled !== false && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">حرف العريس (الإنجليزية):</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={settings.monogramGroomInitial || 'A'}
                          onChange={(e) => setSettings({ ...settings, monogramGroomInitial: e.target.value.toUpperCase() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center font-serif font-black text-amber-300 uppercase"
                          placeholder="A"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">حرف العروسة (الإنجليزية):</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={settings.monogramBrideInitial || 'M'}
                          onChange={(e) => setSettings({ ...settings, monogramBrideInitial: e.target.value.toUpperCase() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center font-serif font-black text-amber-300 uppercase"
                          placeholder="M"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* C. TITLE FORMAT SWITCHER: COUPLE NAMES VS FAMILY INVITATION VS EVENT NAME */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">نمط وصيغة العنوان الرئيسي:</span>
                    <span className="text-[9px] text-slate-400">اختر طريقة العرض</span>
                  </div>

                  {/* Mode Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, weddingTitleType: 'couple_names' })}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all text-center ${
                        (settings.weddingTitleType || 'couple_names') === 'couple_names'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      أسماء العروسين
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, weddingTitleType: 'family_title' })}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all text-center ${
                        settings.weddingTitleType === 'family_title'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      دعوة عائلية
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, weddingTitleType: 'event_name' })}
                      className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all text-center ${
                        settings.weddingTitleType === 'event_name'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      اسم المناسبة
                    </button>
                  </div>

                  {/* Dynamic inputs based on selected title mode */}
                  {(settings.weddingTitleType || 'couple_names') === 'couple_names' && (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">اسم العريس:</label>
                          <input
                            type="text"
                            value={settings.groomName ?? 'أحمد'}
                            onChange={(e) => setSettings({ ...settings, groomName: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            placeholder="أحمد"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">اسم العروسة:</label>
                          <input
                            type="text"
                            value={settings.brideName ?? 'ماريا'}
                            onChange={(e) => setSettings({ ...settings, brideName: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            placeholder="ماريا"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">أيقونة القلب الذهبي الصغير أسفل الاسمين:</span>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, showHeartIcon: settings.showHeartIcon === false })}
                          className={`text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                            settings.showHeartIcon !== false
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {settings.showHeartIcon !== false ? 'ظاهر (✕ إخفاء)' : 'مخفي (+ إضافة)'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settings.weddingTitleType === 'family_title' && (
                    <div className="pt-1 border-t border-slate-800">
                      <label className="block text-[10px] text-slate-400 mb-1">نص الدعوة العائلية (يحل محل أسماء العروسين):</label>
                      <input
                        type="text"
                        value={settings.familyTitleText ?? 'تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف ابنهم'}
                        onChange={(e) => setSettings({ ...settings, familyTitleText: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                        placeholder="مثال: تتشرف أسرة أحمد سالم بدعوتكم لحضور..."
                      />
                    </div>
                  )}

                  {settings.weddingTitleType === 'event_name' && (
                    <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                      يتم إظهار اسم المناسبة المعتمد في الفعالية: <span className="font-bold text-amber-300 font-serif">{activeEvent?.name || 'حفل زفاف مبارك'}</span>
                    </div>
                  )}
                </div>

                {/* D. GUEST PREFIX SELECTOR (الاستاذ/ أو المكرم/ أو سعادة/ إلخ) WITH (X) TOGGLE */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">مقدمة شارة اسم المدعو:</span>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, guestPrefixEnabled: settings.guestPrefixEnabled === false })}
                      className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold transition-all ${
                        settings.guestPrefixEnabled !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                      title={settings.guestPrefixEnabled !== false ? 'انقر لإلغاء المقدمة وحذفها (✕)' : 'انقر لتفعيل المقدمة (+)'}
                    >
                      {settings.guestPrefixEnabled !== false ? (
                        <>
                          <span>مفعلة</span>
                          <span className="text-rose-400 font-black ml-1">✕</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">ملغاة</span>
                          <span className="text-emerald-400 font-bold ml-1">+ تفعيل</span>
                        </>
                      )}
                    </button>
                  </div>

                  {settings.guestPrefixEnabled !== false && (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      {/* Quick Choice Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {['الأستاذ/', 'المكرم/', 'سعادة/', 'الشيخ/', 'الدكتور/', 'الأخ/', 'الأخت/'].map((prefix) => (
                          <button
                            key={prefix}
                            type="button"
                            onClick={() => setSettings({ ...settings, guestPrefixText: prefix })}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                              settings.guestPrefixText === prefix
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {prefix}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">أو اكتب مقدمة مخصصة:</label>
                        <input
                          type="text"
                          value={settings.guestPrefixText ?? ''}
                          onChange={(e) => setSettings({ ...settings, guestPrefixText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                          placeholder="مثال: الأستاذ/ أو المكرم/"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* E. EVENT DETAILS STRIP (VENUE, DATE, TIME) WITH INDIVIDUAL (X) TOGGLES */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">شريط بيانات الحفل الثلاثي (المكان، الوقت، التاريخ):</span>
                    <span className="text-[9px] text-slate-400">إظهار أو إخفاء أي تفصيل بـ (✕)</span>
                  </div>

                  {/* 1. Venue with (X) */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>📍 مكان الحفل والقاعة:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showVenue: settings.showVenue === false })}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          settings.showVenue !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {settings.showVenue !== false ? 'ظاهر ✕' : 'مخفي +'}
                      </button>
                    </div>
                    {settings.showVenue !== false && (
                      <input
                        type="text"
                        value={settings.venueText || ''}
                        onChange={(e) => setSettings({ ...settings, venueText: e.target.value })}
                        className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        placeholder="قاعة الفخامة - المكلا - حضرموت"
                      />
                    )}
                  </div>

                  {/* 2. Time with (X) */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>🕒 الساعة وموعد الحضور:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showTime: settings.showTime === false })}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          settings.showTime !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {settings.showTime !== false ? 'ظاهر ✕' : 'مخفي +'}
                      </button>
                    </div>
                    {settings.showTime !== false && (
                      <input
                        type="text"
                        value={settings.timeText || ''}
                        onChange={(e) => setSettings({ ...settings, timeText: e.target.value })}
                        className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        placeholder="08:00 مساءً"
                      />
                    )}
                  </div>

                  {/* 3. Date with (X) */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>📅 اليوم والتاريخ:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showDate: settings.showDate === false })}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          settings.showDate !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {settings.showDate !== false ? 'ظاهر ✕' : 'مخفي +'}
                      </button>
                    </div>
                    {settings.showDate !== false && (
                      <input
                        type="text"
                        value={settings.dateText || ''}
                        onChange={(e) => setSettings({ ...settings, dateText: e.target.value })}
                        className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                        placeholder="السبت 2026-09-20"
                      />
                    )}
                  </div>
                </div>

                {/* F. WELCOME TITLE & SUBTITLE */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">العبارة العلوية (فوق الأسماء):</label>
                      <input
                        type="text"
                        value={settings.welcomeText}
                        onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
                        placeholder="دعوة لحضور حفل زفاف"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">عبارة الدعوة المرفقة (تحت الأسماء):</label>
                      <input
                        type="text"
                        value={settings.customSubtitle ?? ''}
                        onChange={(e) => setSettings({ ...settings, customSubtitle: e.target.value })}
                        placeholder="نتشرف بدعوتكم لحضور حفل زفافنا"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* G. FOOTER DIVIDER WITH (X) TOGGLE */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">الفاصل الزخرفي السفلي (—✦— بحضوركم تكتمل فرحتنا —✦—):</span>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, showFooterDivider: settings.showFooterDivider === false })}
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        settings.showFooterDivider !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {settings.showFooterDivider !== false ? 'ظاهر ✕' : 'مخفي +'}
                    </button>
                  </div>
                  {settings.showFooterDivider !== false && (
                    <input
                      type="text"
                      value={settings.footerDividerText ?? 'بحضوركم تكتمل فرحتنا'}
                      onChange={(e) => setSettings({ ...settings, footerDividerText: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      placeholder="بحضوركم تكتمل فرحتنا"
                    />
                  )}
                </div>

                {/* H. QR INSTRUCTIONS & SERIAL NUMBER WITH (X) TOGGLES */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400">تعليمات أسفل الباركود:</label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, qrInstructionText: settings.qrInstructionText ? '' : 'يرجى إبراز الكود للدخول' })}
                          className="text-[8.5px] text-amber-400 hover:underline"
                        >
                          {settings.qrInstructionText ? 'إلغاء ✕' : 'إضافة +'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.qrInstructionText ?? ''}
                        onChange={(e) => setSettings({ ...settings, qrInstructionText: e.target.value })}
                        placeholder="يرجى إبراز الكود للدخول"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400">رقم الكرت السلسلي (#102):</label>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, showInvitationNumber: !settings.showInvitationNumber })}
                          className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                            settings.showInvitationNumber ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {settings.showInvitationNumber ? 'ظاهر ✕' : 'مخفي +'}
                        </button>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                        {settings.showInvitationNumber ? '#102 (يظهر تلقائياً لكل ضيف)' : '(الرقم مخفي)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* I. BACK FACE CUSTOMIZATION (WHEN DUPLEX IS ENABLED) */}
                {settings.doubleSidedMode === 'duplex' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
                        <FlipHorizontal className="w-3.5 h-3.5 text-teal-400" />
                        <span>تفاصيل ونصوص الوجه الخلفي (الظهر):</span>
                      </span>
                      <span className="text-[9px] text-teal-400/80">الموجة الذهبية وباقة الزهور</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">الدعاء الرئيسي (في المنتصف):</label>
                        <input
                          type="text"
                          value={settings.backTitleText ?? 'بارك الله لهما وبارك عليهما وجمع بينهما في خير'}
                          onChange={(e) => setSettings({ ...settings, backTitleText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                          placeholder="بارك الله لهما وبارك عليهما وجمع بينهما في خير"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">عبارة الشكر أسفل الدعاء:</label>
                        <input
                          type="text"
                          value={settings.backHeaderText ?? 'شكراً لكم على تلبية الدعوة'}
                          onChange={(e) => setSettings({ ...settings, backHeaderText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                          placeholder="شكراً لكم على تلبية الدعوة"
                        />
                      </div>

                      {/* English note toggle with (X) */}
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-400">العبارة الإنجليزية أسفل اليسار:</label>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, showBackEnglishNote: settings.showBackEnglishNote === false })}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              settings.showBackEnglishNote !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {settings.showBackEnglishNote !== false ? 'ظاهرة ✕' : 'مخفية +'}
                          </button>
                        </div>
                        {settings.showBackEnglishNote !== false && (
                          <textarea
                            rows={2}
                            value={settings.backEnglishNoteText ?? 'A Special Day\nA Lasting Memory'}
                            onChange={(e) => setSettings({ ...settings, backEnglishNoteText: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-serif text-amber-200"
                            placeholder="A Special Day&#10;A Lasting Memory"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SUMMARY INFO (In cards mode) */}
          {!isStickers && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 text-xs space-y-2 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span>الكروت في كل صفحة: <b className="text-white">{cardsPerPage} كرت</b></span>
                <span>عدد الصفحات الكلي: <b className="text-white font-mono">{totalPages} صفحات</b> ({displayedInvitations.length} كرت)</span>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <b>تصدير وطباعة مرنة:</b> عند النقر على <b>"تصدير PDF"</b> أو <b>"طباعة مباشرة"</b> سيتم إخراج الـ <b>{displayedInvitations.length} كرت</b> المحددة، بحيث يُطبع اسم كل مدعو على كرته المخصص، وتُطبع الكروت العامة بدون أسماء تلقائياً.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Live Interactive Preview Panel (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
          
          {/* Top Preview Controls */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-2">
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
                  <span>معاينة مكبرة</span>
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
                  <span>ورقة A4 كاملة</span>
                </button>
              </div>

              {/* Direct Print Button with 3D Preview Modal */}
              <button
                type="button"
                onClick={() => {
                  setCardRotationY(0);
                  setCardRotationX(0);
                  setAutoRotate3d(false);
                  setIs3dModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer transform hover:scale-[1.02]"
                title="معاينة الكرت ثلاثي الأبعاد 3D والطباعة الفورية"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الكرت (معاينة 3D)</span>
              </button>
            </div>

            {/* If Single card view: card navigation, status pill & quick jump */}
            {previewMode === 'single' && displayedInvitations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isCustomDesign ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>كرت رقم #{String(currentInvNum).padStart(3, '0')}</span>
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Guest Name Status & Inline Edit Box */}
                    {isEditingCardName ? (
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-amber-500 shadow-md">
                        <input
                          type="text"
                          value={editingCardNameVal}
                          onChange={(e) => setEditingCardNameVal(e.target.value)}
                          placeholder="اسم المدعو لهذا الكرت..."
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs focus:outline-none focus:border-amber-400 w-44 font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCurrentCardGuestName();
                            if (e.key === 'Escape') setIsEditingCardName(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveCurrentCardGuestName}
                          disabled={savingCardName}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                          title="حفظ الاسم وتطبيقه فوراً"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{savingCardName ? '...' : 'حفظ'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingCardName(false)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="إلغاء"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {currentGuestName ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm">
                            <User className="w-3.5 h-3.5" />
                            <span>دعوة مخصصة باسم: <b className="text-white underline underline-offset-2">{currentGuestName}</b></span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>✉️ كرت دعوة عامة (بدون اسم)</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingCardName(true);
                            setEditingCardNameVal(currentGuestName || '');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer"
                          title="تعديل اسم المدعو المطبوع على هذا الكرت مباشرة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{currentGuestName ? 'تعديل الاسم' : 'تخصيص باسم مدعو'}</span>
                        </button>
                      </div>
                    )}

                    {/* Quick jump to named cards if on a general card and named cards exist */}
                    {namedCount > 0 && !currentGuestName && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstNamedIdx = displayedInvitations.findIndex((i) => Boolean(i.guest_name && i.guest_name.trim()));
                          if (firstNamedIdx >= 0) setCurrentCardIndex(firstNamedIdx);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all shadow-sm cursor-pointer"
                        title="الانتقال المباشر لأول كرت مكتوب فيه اسم مدعو"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>معاينة كروت الأسماء ⚡</span>
                      </button>
                    )}
                  </>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      setIsEditingCardName(false);
                      setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={currentCardIndex === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    title="الكرت السابق"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs px-2 font-bold text-amber-400">
                    {currentCardIndex + 1} / {displayedInvitations.length}
                  </span>
                  <button
                    onClick={() => {
                      setIsEditingCardName(false);
                      setCurrentCardIndex((prev) => Math.min(displayedInvitations.length - 1, prev + 1));
                    }}
                    disabled={currentCardIndex >= displayedInvitations.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    title="الكرت التالي"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* If Sheet view: Page navigation */}
            {previewMode === 'sheet' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <button
                  onClick={() => setCurrentSheetPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentSheetPage === 0}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-2 py-0.5 font-bold text-amber-400 bg-slate-950 rounded-lg border border-slate-800">
                  صفحة {currentSheetPage + 1} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentSheetPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentSheetPage >= totalPages - 1}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: SINGLE CARD / STICKER INTERACTIVE VIEW            */}
          {/* ======================================================== */}
          {previewMode === 'single' ? (
            isStickers ? (
              /* SINGLE PURE QR STICKER ENLARGED PREVIEW */
              <div className="w-full flex flex-col items-center justify-center p-4">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    🏷️ معاينة ملصق باركود فردي (عالي الدقة)
                  </span>
                </div>

                <div className={`relative w-48 h-48 rounded-2xl bg-white shadow-2xl p-3 flex flex-col items-center justify-center text-center select-none ${
                  settings.stickerShowCutMarks !== false ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                }`}>
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center p-1">
                    {previewSampleQr ? (
                      <img src={previewSampleQr} alt="QR" className="max-h-full max-w-full aspect-square object-contain" />
                    ) : (
                      <div className="w-28 h-28 bg-slate-100" />
                    )}
                  </div>
                  {settings.stickerShowNumber !== false && (
                    <div className="text-xs font-mono font-black text-slate-900 leading-tight mt-1">
                      #{String(currentInvNum).padStart(3, '0')}
                    </div>
                  )}
                  {settings.stickerShowName && currentGuestName && (
                    <div className="text-[11px] font-bold text-slate-700 truncate max-w-full leading-tight mt-0.5">
                      {currentGuestName}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 text-center mt-3">
                  ملصق باركود مربع عالي الوضوح مهيأ للقص واللصق على بطاقات الدعوة الجاهزة.
                </p>
              </div>
            ) : (
              /* DUAL-FACE PREVIEW: FRONT AND BACK SIDE-BY-SIDE */
              <div className="w-full flex flex-col items-center justify-center p-2">
                <div className="w-full text-center mb-3">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    ✨ معاينة الكرت بوجهين (الأمامي والخلفي معاً)
                  </span>
                </div>

                {(() => {
                  const customAspect = settings.customAspectRatio || (detectedDimensions ? (detectedDimensions.width / detectedDimensions.height) : 1.46);
                  const cardAspectRatio = isCustomDesign
                    ? `${customAspect}`
                    : isSquare
                    ? '1 / 1'
                    : isLandscape
                    ? `${Math.max(settings.cardWidth || 85, settings.cardHeight || 58)} / ${Math.min(settings.cardWidth || 85, settings.cardHeight || 58)}`
                    : `${Math.min(settings.cardWidth || 58, settings.cardHeight || 85)} / ${Math.max(settings.cardWidth || 58, settings.cardHeight || 85)}`;

                  const cardContainerMaxWidth = isCustomDesign
                    ? (customAspect < 0.85 ? 'max-w-[280px]' : customAspect > 1.25 ? 'max-w-[420px]' : 'max-w-[340px]')
                    : isSquare
                    ? 'max-w-[280px]'
                    : isLandscape
                    ? 'max-w-[360px]'
                    : 'max-w-[270px]';

                  const eventVenue = (settings.venueText || activeEvent?.venue || (activeEvent as any)?.location || '').trim();
                  const eventDate = (settings.weddingHijriDate || settings.dateText || activeEvent?.date || '').trim();
                  const eventTime = (settings.timeText || activeEvent?.time || '').trim();

                  const eventDayName = (() => {
                    if (!eventDate) return '';
                    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    for (const d of days) {
                      if (eventDate.includes(d)) return d;
                    }
                    try {
                      const parsed = new Date(eventDate);
                      if (!isNaN(parsed.getTime())) {
                        return parsed.toLocaleDateString('ar-SA', { weekday: 'long' });
                      }
                    } catch (_) {}
                    return 'السبت';
                  })();

                  const eventDateOnly = (() => {
                    if (!eventDate) return '';
                    return eventDate.replace(/^(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\s*[-/]?\s*/, '').trim();
                  })();

                  const { venuePrimary, venueSecondary } = (() => {
                    if (!eventVenue) return { venuePrimary: '', venueSecondary: '' };
                    const lines = eventVenue.split('\n').map((s: string) => s.trim()).filter(Boolean);
                    if (lines.length > 1) {
                      return { venuePrimary: lines[0], venueSecondary: lines.slice(1).join(' - ') };
                    }
                    const dashParts = eventVenue.split(' - ').map((s: string) => s.trim()).filter(Boolean);
                    if (dashParts.length > 1) {
                      return { venuePrimary: dashParts[0], venueSecondary: dashParts.slice(1).join(' - ') };
                    }
                    return { venuePrimary: eventVenue, venueSecondary: '' };
                  })();

                  return (
                    <div className={`w-full ${isTwoSidedPreview ? (isLandscape ? 'grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-4xl' : 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl') : (isLandscape ? 'flex justify-center max-w-md' : 'flex justify-center max-w-sm')} justify-items-center`}>
                      
                      {/* 1. RIGHT SIDE: الوجه الأمامي */}
                      <div className="w-full flex flex-col items-center">
                        <div className={`flex items-center justify-between w-full ${cardContainerMaxWidth} mb-1.5 px-1`}>
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <span>🖼️ الوجه الأمامي</span>
                            {isCustomDesign && settings.customQrSide !== 'back' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">مكان الباركود</span>
                            )}
                          </span>
                          {isCustomDesign && hasBackImage && (
                            <button
                              type="button"
                              onClick={() => setSettings(prev => ({ ...prev, customQrSide: 'front' }))}
                              className={`text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                                settings.customQrSide !== 'back'
                                  ? 'bg-teal-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              ضع الـ QR هنا
                            </button>
                          )}
                        </div>

                        {isCustomDesign && !settings.customCardImage ? (
                          /* Empty upload prompt card in preview */
                          <div
                            onClick={() => frontFileInputRef.current?.click()}
                            style={{ aspectRatio: '1.46' }}
                            className={`w-full ${cardContainerMaxWidth} rounded-2xl border-2 border-dashed border-slate-700 hover:border-teal-400 bg-slate-950/60 hover:bg-slate-900/60 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all shadow-xl group`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-teal-400" />
                            </div>
                            <div className="text-xs font-bold text-white mb-1">رفع صورة الوجه الأمامي</div>
                            <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">
                              انقر هنا لرفع تصميم الكرت وسيعرضه النظام تلقائياً بأبعاده الحقيقية
                            </p>
                          </div>
                        ) : (
                          <div
                            ref={frontCardRef}
                            onClick={isCustomDesign ? updateFrontQrPosition : undefined}
                            onMouseDown={() => { if (isCustomDesign) { setIsDraggingQr(true); setSettings(prev => ({ ...prev, customQrSide: 'front' })); } }}
                            onMouseUp={() => setIsDraggingQr(false)}
                            onMouseMove={(e) => {
                              if (isDraggingQr && isCustomDesign && settings.customQrSide !== 'back') {
                                updateFrontQrPosition(e);
                              }
                            }}
                            style={{
                              aspectRatio: cardAspectRatio,
                              backgroundColor: palette.cardBg,
                              borderColor: settings.cardTheme === 'wedding_golden_floral'
                                ? 'rgba(190, 155, 95, 0.45)'
                                : isCustomDesign
                                ? (settings.customQrSide !== 'back' ? '#2dd4bf' : '#334155')
                                : palette.frameBorderOuter,
                              borderWidth: settings.cardTheme === 'wedding_golden_floral' ? '1px' : '2px',
                            }}
                            className={`relative w-full ${cardContainerMaxWidth} rounded-2xl shadow-xl overflow-hidden text-slate-900 select-none transition-all ${
                              isCustomDesign
                                ? (settings.customQrSide !== 'back' ? 'cursor-crosshair ring-2 ring-teal-400/30' : 'cursor-crosshair')
                                : ''
                            }`}
                          >
                            {isCustomDesign ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={settings.customCardImage!}
                                  alt="Front Face"
                                  className="w-full h-full object-contain pointer-events-none select-none"
                                />
                                {settings.customQrSide !== 'back' && (
                                  <div
                                    className={`absolute p-1.5 rounded-xl shadow-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all ${
                                      settings.customQrBg !== false ? 'bg-white border border-slate-300' : ''
                                    }`}
                                    style={{
                                      left: `${settings.customQrX ?? 50}%`,
                                      top: `${settings.customQrY ?? 65}%`,
                                      width: `${(settings.customQrSize ?? 30) * 2.3}px`,
                                      minHeight: `${(settings.customQrSize ?? 30) * 2.3}px`,
                                    }}
                                  >
                                    {settings.showEventName && activeEvent?.name && (
                                      <div className="text-[7.5px] font-bold text-center text-slate-900 mb-0.5 truncate max-w-full px-0.5 leading-tight">
                                        {activeEvent.name}
                                      </div>
                                    )}
                                    {previewSampleQr ? (
                                      <img src={previewSampleQr} alt="QR" className="w-full aspect-square object-contain mx-auto" />
                                    ) : (
                                      <div className="w-full aspect-square bg-slate-200" />
                                    )}
                                    {settings.showInvitationNumber !== false && (
                                      <div className="text-[8px] font-mono font-bold text-center text-slate-800 mt-0.5">
                                        #{String(currentInvNum).padStart(3, '0')}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {settings.customQrSide !== 'back' && (
                                  <div className="absolute bottom-2 left-2 right-2 p-1 rounded bg-slate-950/80 backdrop-blur-sm text-[9px] text-teal-300 text-center pointer-events-none">
                                    انقر لتحديد مكان الباركود ({settings.customQrX}%, {settings.customQrY}%)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <PresetFrontCard
                                settings={settings}
                                palette={palette}
                                activeEvent={activeEvent}
                                currentGuestName={currentGuestName}
                                currentInvNum={currentInvNum}
                                previewSampleQr={previewSampleQr}
                                isLandscape={isLandscape}
                                isSquare={isSquare}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* 2. LEFT SIDE: الوجه الخلفي (ONLY SHOWN IF isTwoSidedPreview IS TRUE!) */}
                      {isTwoSidedPreview && (
                        <div className="w-full flex flex-col items-center">
                          <div className={`flex items-center justify-between w-full ${cardContainerMaxWidth} mb-1.5 px-1`}>
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                              <span>📄 الوجه الخلفي</span>
                              {isCustomDesign && settings.customQrSide === 'back' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">مكان الباركود</span>
                              )}
                            </span>
                            {isCustomDesign && hasBackImage && (
                              <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, customQrSide: 'back' }))}
                                className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                                  settings.customQrSide === 'back'
                                    ? 'bg-teal-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                ضع الـ QR هنا
                              </button>
                            )}
                          </div>

                          {isCustomDesign ? (
                            hasBackImage ? (
                              <div
                                ref={backCardRef}
                                onClick={updateBackQrPosition}
                                onMouseDown={() => { setIsDraggingQr(true); setSettings(prev => ({ ...prev, customQrSide: 'back' })); }}
                                onMouseUp={() => setIsDraggingQr(false)}
                                onMouseMove={(e) => {
                                  if (isDraggingQr && settings.customQrSide === 'back') {
                                    updateBackQrPosition(e);
                                  }
                                }}
                                style={{
                                  aspectRatio: cardAspectRatio,
                                  borderColor: settings.customQrSide === 'back' ? '#2dd4bf' : '#334155',
                                }}
                                className={`relative w-full ${cardContainerMaxWidth} rounded-2xl shadow-xl overflow-hidden bg-white text-slate-900 select-none transition-all cursor-crosshair border-2 ${
                                  settings.customQrSide === 'back' ? 'ring-2 ring-teal-400/30' : ''
                                }`}
                              >
                                <img
                                  src={settings.customCardBackImage!}
                                  alt="Back Face"
                                  className="w-full h-full object-contain pointer-events-none select-none"
                                />
                                {settings.customQrSide === 'back' && (
                                  <div
                                    className={`absolute p-1.5 rounded-xl shadow-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all ${
                                      settings.customQrBg !== false ? 'bg-white border border-slate-300' : ''
                                    }`}
                                    style={{
                                      left: `${settings.customQrX ?? 50}%`,
                                      top: `${settings.customQrY ?? 65}%`,
                                      width: `${(settings.customQrSize ?? 30) * 2.3}px`,
                                      minHeight: `${(settings.customQrSize ?? 30) * 2.3}px`,
                                    }}
                                  >
                                    {settings.showEventName && activeEvent?.name && (
                                      <div className="text-[7.5px] font-bold text-center text-slate-900 mb-0.5 truncate max-w-full px-0.5 leading-tight">
                                        {activeEvent.name}
                                      </div>
                                    )}
                                    {previewSampleQr ? (
                                      <img src={previewSampleQr} alt="QR" className="w-full aspect-square object-contain mx-auto" />
                                    ) : (
                                      <div className="w-full aspect-square bg-slate-200" />
                                    )}
                                    {settings.showInvitationNumber !== false && (
                                      <div className="text-[8px] font-mono font-bold text-center text-slate-800 mt-0.5">
                                        #{String(currentInvNum).padStart(3, '0')}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {settings.customQrSide === 'back' && (
                                  <div className="absolute bottom-2 left-2 right-2 p-1 rounded bg-slate-950/80 backdrop-blur-sm text-[9px] text-teal-300 text-center pointer-events-none">
                                    انقر لتحديد مكان الباركود ({settings.customQrX}%, {settings.customQrY}%)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                onClick={() => backFileInputRef.current?.click()}
                                style={{ aspectRatio: cardAspectRatio }}
                                className={`relative w-full ${cardContainerMaxWidth} rounded-2xl shadow-inner border-2 border-dashed border-slate-700 hover:border-teal-500/70 bg-slate-950/60 hover:bg-slate-900/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group`}
                              >
                                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Layers className="w-6 h-6 text-teal-400" />
                                </div>
                                <div className="text-xs font-bold text-slate-200 mb-1">الوجه الخلفي غير مرفوع</div>
                                <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">
                                  انقر هنا لرفع تصميم الوجه الخلفي إذا كان كرتك بوجهين
                                </p>
                                <span className="mt-3 px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                                  + رفع الوجه الخلفي
                                </span>
                              </div>
                            )
                          ) : (
                            /* PRESET BACK CARD - WRAPPED IN IDENTICAL ASPECT-RATIO AND SIZING */
                            <div
                              style={{ aspectRatio: cardAspectRatio }}
                              className={`w-full ${cardContainerMaxWidth} rounded-2xl overflow-hidden`}
                            >
                              <PresetBackCard
                                settings={settings}
                                palette={palette}
                                activeEvent={activeEvent}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-slate-400 text-center mt-3">
                  {isCustomDesign
                    ? 'يمكنك النقر مباشرة على أي من الوجهين لتحديد مكان الباركود وتغيير موضعه وحجمه بكل حرية.'
                    : (isTwoSidedPreview 
                        ? 'معاينة متكاملة للوجهين الأمامي والخلفي المطرز تضمن أفضل تناسق قبل الطباعة والتصدير.' 
                        : 'معاينة متكاملة للوجه الأمامي المحتوي على الباركود وبيانات الدعوة والاسم.')}
                </p>
              </div>
            )
          ) : (
            /* ======================================================== */
            /* VIEW 2: FULL A4 SHEET GRID (DUPLEX OR SINGLE OR STICKERS) */
            /* ======================================================== */
            <div className="w-full flex flex-col items-center">
              
              {/* Duplex sheet toggle if two-sided cards */}
              {!isStickers && (isCustomDesign ? hasBackImage : settings.doubleSidedMode === 'duplex') && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSheetSide('front')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sheetSide === 'front' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    معاينة صفحة الوجه الأمامي
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetSide('back')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      sheetSide === 'back' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    معاينة صفحة الوجه الخلفي (معكوسة أفقياً للتطابق)
                  </button>
                </div>
              )}

              <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-lg shadow-2xl p-3 aspect-[1/1.414] overflow-hidden select-none border border-slate-300">
                <div
                  className="w-full h-full grid"
                  style={{
                    gridTemplateColumns: isStickers
                      ? `repeat(${stickerCols}, minmax(0, 1fr))`
                      : `repeat(${settings.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: isStickers
                      ? `repeat(${stickerRows}, minmax(0, 1fr))`
                      : `repeat(${settings.rows}, minmax(0, 1fr))`,
                    gap: isStickers ? '3px' : '6px',
                  }}
                >
                  {Array.from({ length: cardsPerPage }).map((_, idx) => {
                    // For back sheet in duplex mode, mirror columns horizontally
                    let resolvedIdx = idx;
                    if (!isStickers && sheetSide === 'back' && (isCustomDesign ? hasBackImage : settings.doubleSidedMode === 'duplex')) {
                      const r = Math.floor(idx / settings.columns);
                      const c = idx % settings.columns;
                      const mirroredCol = settings.columns - 1 - c;
                      resolvedIdx = r * settings.columns + mirroredCol;
                    }

                    const cardIdx = currentSheetPage * cardsPerPage + resolvedIdx;
                    const sampleInv = displayedInvitations[cardIdx];
                    if (!sampleInv && cardIdx >= displayedInvitations.length) {
                      return (
                        <div
                          key={idx}
                          className="relative p-1 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[8px]"
                        >
                          (فارغ)
                        </div>
                      );
                    }
                    const invNum = sampleInv ? sampleInv.invitation_number : cardIdx + 1;
                    const gName = sampleInv?.guest_name && sampleInv.guest_name.trim() ? sampleInv.guest_name.trim() : null;

                    // PURE QR STICKERS IN SHEET GRID (NO squished cards!)
                    if (isStickers) {
                      return (
                        <div
                          key={idx}
                          className={`relative p-1 bg-white rounded flex flex-col items-center justify-center text-center overflow-hidden select-none ${
                            settings.stickerShowCutMarks !== false ? 'border border-dashed border-slate-300' : 'border border-transparent'
                          }`}
                        >
                          <div className="w-full flex-1 min-h-0 flex items-center justify-center p-0.5">
                            {previewSampleQr ? (
                              <img
                                src={previewSampleQr}
                                alt="QR"
                                className="max-h-full max-w-full aspect-square object-contain"
                              />
                            ) : (
                              <div className="w-7 h-7 bg-slate-100" />
                            )}
                          </div>

                          {settings.stickerShowNumber !== false && (
                            <div className="text-[7.5px] font-mono font-black text-slate-900 leading-none mt-0.5">
                              #{String(invNum).padStart(3, '0')}
                            </div>
                          )}

                          {settings.stickerShowName && gName && (
                            <div className="text-[6px] font-bold text-slate-700 truncate max-w-full leading-none mt-0.5">
                              {gName}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Custom Uploaded Card in Sheet Grid
                    if (isCustomDesign) {
                      const faceImg = (sheetSide === 'back' && settings.customCardBackImage) 
                        ? settings.customCardBackImage 
                        : settings.customCardImage!;
                      const showQr = (sheetSide === 'front' && settings.customQrSide !== 'back') ||
                        (sheetSide === 'back' && settings.customQrSide === 'back');

                      return (
                        <div key={idx} className="relative w-full h-full rounded overflow-hidden border border-slate-200">
                          <img src={faceImg} alt="Card" className="w-full h-full object-cover" />
                          {showQr && (
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
                          )}
                        </div>
                      );
                    }

                    // Preset template card cell in sheet (Back face)
                    if (sheetSide === 'back') {
                      const isBespokeWedding = 
                        settings.cardTheme === 'wedding_botanical_purple' ||
                        settings.cardTheme === 'wedding_royal_burgundy' ||
                        settings.cardTheme === 'wedding_calla_sage' ||
                        settings.cardTheme === 'wedding_sculpted_ivory';
                      const coupleTitle = (settings.weddingTitleType || 'couple_names') === 'couple_names'
                        ? `${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}`
                        : (activeEvent?.name || 'حفل زفاف مبارك');

                      return (
                        <div
                          key={idx}
                          className="relative p-1 rounded border border-slate-200 flex flex-col justify-between text-center overflow-hidden"
                          style={{ backgroundColor: palette.cardBg }}
                        >
                          <div className="leading-tight pt-0.5">
                            <div className="text-[5.5px] font-black truncate" style={{ color: palette.headerText }}>
                              {isBespokeWedding ? coupleTitle : activeEvent?.name}
                            </div>
                          </div>

                          <div className="my-auto text-[5px] font-bold text-slate-700 px-1 leading-snug">
                            {settings.cardTheme === 'wedding_sculpted_ivory' ? 'اللّهم بارك لهما وأتمّ عليهما السعادة' :
                             settings.cardTheme === 'wedding_royal_burgundy' ? 'أذن لمراسيم الفرح أن تشرّع أبوابها' :
                             settings.cardTheme === 'wedding_calla_sage' ? 'ولأن فرحتنا تكتمل بمن نحب' :
                             settings.cardTheme === 'wedding' || settings.cardTheme === 'wedding_botanical_purple' ? 'بارك الله لهما وجمع بينهما في خير' :
                             settings.cardTheme === 'dinner' ? 'يشرّفنا ويسعدنا تلبية دعوتنا' :
                             'فرحة نجاح وتخرج تتوج مسيرة السنين'}
                          </div>

                          <div className="text-[4px] text-slate-600 truncate pb-0.5">
                            {settings.showInvitationNumber && <span className="font-bold">#{invNum}</span>}
                          </div>
                        </div>
                      );
                    }

                    // Preset template card cell in sheet (Front face)
                    const isBespokeWedding = 
                      settings.cardTheme === 'wedding_botanical_purple' ||
                      settings.cardTheme === 'wedding_royal_burgundy' ||
                      settings.cardTheme === 'wedding_calla_sage' ||
                      settings.cardTheme === 'wedding_sculpted_ivory';
                    const coupleTitle = (settings.weddingTitleType || 'couple_names') === 'couple_names'
                      ? `${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}`
                      : (activeEvent?.name || 'حفل زفاف مبارك');

                    return (
                      <div
                        key={idx}
                        className="relative p-1 rounded border border-slate-200 flex flex-col justify-between text-center overflow-hidden"
                        style={{ backgroundColor: palette.cardBg }}
                      >
                        <div className="leading-tight">
                          <div className="text-[6px] font-bold truncate" style={{ color: palette.headerText }}>
                            {isBespokeWedding ? coupleTitle : settings.welcomeText}
                          </div>
                          {gName ? (
                            <div className="text-[5px] font-bold text-slate-800 truncate">{gName}</div>
                          ) : isBespokeWedding ? (
                            <div className="text-[5px] font-medium text-slate-600 truncate">{settings.welcomeText}</div>
                          ) : (
                            <div className="text-[5px] font-bold text-slate-600 truncate">{activeEvent?.name}</div>
                          )}
                        </div>

                        <div className="my-auto flex items-center justify-center">
                          <div className="p-0.5 rounded border inline-block" style={{ backgroundColor: palette.qrBoxBg, borderColor: palette.qrBorder }}>
                            {previewSampleQr && <img src={previewSampleQr} alt="QR" className="w-7 h-7 object-contain" />}
                          </div>
                        </div>

                        <div className="text-[4px] text-slate-600 truncate">
                          {settings.showInvitationNumber && <span className="font-bold">#{invNum}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* GUIDE MODAL: How to bring a custom design front and back */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">دليل تصميم وجلب كرت خارجي بوجهين (أمام وخلف)</h3>
                  <p className="text-xs text-slate-400">خطوات سهلة ومبسطة لأي شخص بدون الحاجة لخبرة سابقة في التصميم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">1</span>
                  <span>ما هو التصميم المطلوب؟</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تحتاج فقط إلى <b>صورتين منفصلتين</b> (بصيغة PNG أو JPG بدقة جيدة):
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li><b>صورة الوجه الأمامي:</b> تحتوي على تصميم الكرت والترحيب، مع ترك مساحة فارغة بسيطة (تقريباً 2.5×2.5 سم) لوضع الباركود.</li>
                  <li><b>صورة الوجه الخلفي:</b> خلفية الكرت (مثلاً عبارة شكر، خريطة الموقع، أو زخرفة المناسبة).</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">2</span>
                  <span>أين تصممها بكل سهولة؟</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  عبر موقع <b>Canva (كانفا)</b> المجاني أو من خلال مصمم جرافيك:
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>في Canva، اختر "إنشاء تصميم" بمقاس بطاقة دعوة (مثلاً <b>9 × 5.5 سم</b> أو <b>1050 × 650 بكسل</b>).</li>
                  <li>اجعل الصفحة 1 للوجه، وأضف صفحة 2 للخلفية بنفس المقاس تماماً.</li>
                  <li>اضغط "مشاركة (Share)" ثم "تنزيل (Download)" كصور PNG.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">3</span>
                  <span>رفع الصورتين في البرنامج</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  في أعلى هذه الصفحة:
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>اضغط على زر <b>"رفع تصميم الكرت (أمامي)"</b> واختر صورة الوجه.</li>
                  <li>اضغط على زر <b>"رفع تصميم (خلفي)"</b> واختر صورة الخلفية.</li>
                  <li>يتحول كرتك تلقائياً إلى كرت بوجهين جاهزين!</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">4</span>
                  <span>تثبيت الباركود والطباعة</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  كل شيء يتم تلقائياً بضغطة زر:
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li><b>تحديد المكان:</b> انقر بالماوس مباشرة على أي موضع داخل الكرت في المعاينة لنقل الباركود إليه فوراً.</li>
                  <li><b>الطباعة والتصدير:</b> اضغط "تصدير PDF" أو "طباعة مباشرة"، ويقوم البرنامج بإنشاء صفحات متطابقة تماماً للوجه والظهر للطباعة على الوجهين (Duplex) بدون تعب.</li>
                </ul>
              </div>
            </div>


            {/* Quick Upload Action Buttons Inside Modal */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">هل الصورتان جاهزتان معك من Canva أو جهازك؟</span>
                <span>يمكنك اختصار الوقت ورفعهما مباشرة من هنا:</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsGuideModalOpen(false);
                    frontFileInputRef.current?.click();
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>رفع الوجه الأمامي</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGuideModalOpen(false);
                    backFileInputRef.current?.click();
                  }}
                  className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>رفع الوجه الخلفي</span>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D INTERACTIVE CARD PREVIEW MODAL */}
      {is3dModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl p-5 sm:p-7 flex flex-col items-center text-white relative">
            
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>معاينة الكرت النهائي ثلاثي الأبعاد (3D Flip Card)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      جاهز للطباعة والقص
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    يمكنك تدوير الكرت بالماوس 360° لمشاهدة ترابط الوجهين والتأكد من مطابقة التصميم
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIs3dModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="إغلاق المعاينة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Helper / Notification Pill */}
            <div className="w-full mb-3 flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">💡</span>
                <span className="text-[11px]">
                  <b>تحكّم تفاعلي:</b> اسحب الكرت بالماوس أو الإصبع للفّه يميناً ويساراً، أو استخدم أزرار القلب السريعة أدناه.
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>الوجهان متطابقان بالأبعاد 100% لضمان دقة القص عند الطباعة المزدوجة</span>
              </div>
            </div>

            {/* Current Card Indicator & Navigation */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  كرت رقم #{String(currentInvNum).padStart(3, '0')}
                </span>
                {currentGuestName ? (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    المدعو: {currentGuestName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    كرت دعوة عامة
                  </span>
                )}
              </div>

              {/* Card Navigation */}
              {displayedInvitations.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentCardIndex === 0}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    title="الكرت السابق"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs px-2 font-bold text-amber-400">
                    {currentCardIndex + 1} / {displayedInvitations.length}
                  </span>
                  <button
                    onClick={() => setCurrentCardIndex((prev) => Math.min(displayedInvitations.length - 1, prev + 1))}
                    disabled={currentCardIndex >= displayedInvitations.length - 1}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white cursor-pointer"
                    title="الكرت التالي"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 3D INTERACTIVE STAGE */}
            <div
              className="relative w-full h-[320px] sm:h-[370px] flex items-center justify-center select-none overflow-hidden my-2 rounded-2xl bg-gradient-to-b from-slate-950/60 to-slate-950/90 border border-slate-800 shadow-inner cursor-grab active:cursor-grabbing"
              style={{ perspective: '1400px' }}
              onMouseDown={handle3dMouseDown}
              onMouseMove={handle3dMouseMove}
              onMouseUp={handle3dMouseUp}
              onMouseLeave={handle3dMouseUp}
              onTouchStart={handle3dTouchStart}
              onTouchMove={handle3dTouchMove}
              onTouchEnd={handle3dMouseUp}
            >
              {/* 3D Card Object */}
              <div
                style={{
                  width: '460px',
                  maxWidth: '88%',
                  aspectRatio: cardAspectRatio,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${cardRotationY}deg) rotateX(${cardRotationX}deg)`,
                  transition: isDragging3d ? 'none' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="relative rounded-2xl shadow-2xl"
              >
                {/* 1. FRONT FACE */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-white"
                >
                  {render3dFrontFace()}
                </div>

                {/* 2. BACK FACE (Flipped 180 deg) */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-teal-500/30 bg-white"
                >
                  {render3dBackFace()}
                </div>
              </div>
            </div>

            {/* 3D CONTROLS BAR */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => { setCardRotationY(0); setCardRotationX(0); setAutoRotate3d(false); }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    (Math.abs(cardRotationY % 360) < 45 || Math.abs(cardRotationY % 360) > 315)
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  🖼️ الوجه الأمامي
                </button>

                <button
                  type="button"
                  onClick={() => { setCardRotationY((prev) => prev + 180); setAutoRotate3d(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>قلب الكرت (180°)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCardRotationY(180); setCardRotationX(0); setAutoRotate3d(false); }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    Math.abs(cardRotationY % 360) >= 135 && Math.abs(cardRotationY % 360) <= 225
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  📄 الوجه الخلفي
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRotate3d((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    autoRotate3d
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{autoRotate3d ? 'إيقاف الدوران' : 'دوران 3D تلقائي'}</span>
                </button>
              </div>

              {/* ACTION BUTTONS (DIRECT PRINT & EXPORT) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePrint();
                  }}
                  disabled={printing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{printing ? 'جاري الطباعة...' : 'بدء الطباعة الآن'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf();
                  }}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{exporting ? 'جاري التصدير...' : 'تصدير PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIs3dModalOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Smart Outpainting Preview & Dimension Matching Modal */}
      {settings.customCardImage && settings.customCardBackImage && (
        <BackImageOutpaintModal
          isOpen={isOutpaintModalOpen}
          onClose={() => setIsOutpaintModalOpen(false)}
          frontImage={settings.customCardImage}
          backImage={settings.customCardBackImage}
          onApply={handleApplyOutpaintedBack}
        />
      )}

    </div>
  );
};
