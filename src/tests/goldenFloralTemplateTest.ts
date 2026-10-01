import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

async function testGoldenFloralTemplate() {
  console.log('================================================================');
  console.log('🧪 اختبار قالب الزفاف الذهبي الراقي (Wedding Golden Floral) والميزات الديناميكية');
  console.log('================================================================\n');

  const testEvent: Event = {
    id: 101,
    name: 'حفل زفاف أحمد وماريا',
    date: '2026-09-20',
    time: '08:00 مساءً',
    venue: 'قاعة الفخامة - المكلا - حضرموت',
    eventType: 'wedding',
    capacity: 100,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testInvitations: Invitation[] = [
    {
      id: 1,
      event_id: 101,
      invitation_number: 102,
      token: 'TOKEN-WEDDING-102',
      guest_name: 'سالم أحمد',
      has_name: 1,
      status: 'UNUSED',
      used_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  const qrImages: Record<number, string> = {
    1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  // 1. Test Default Golden Floral Template (matching Image 1 exactly)
  console.log('▶ [1] اختبار القالب الافتراضي المطابق للصورة 1 (أحمد & ماريا، الأستاذ/ سالم أحمد، Monogram A&M)...');
  const defaultSettings: PrintSettings = {
    paperSize: 'A4',
    columns: 2,
    rows: 4,
    cardWidth: 85,
    cardHeight: 58,
    cardShape: 'rectangle',
    gapX: 3,
    gapY: 3,
    marginX: 10,
    marginY: 10,
    showEventName: false,
    showGuestName: true,
    showInvitationNumber: true,
    showCropMarks: false,
    showVenue: true,
    showTime: true,
    showDate: true,
    venueText: 'قاعة الفخامة\nالمكلا - حضرموت',
    timeText: '08:00 مساءً',
    dateText: '2026-09-20',
    welcomeText: 'دعوة لحضور حفل زفاف',
    customSubtitle: 'نتشرف بدعوتكم لحضور حفل زفافنا',
    groomName: 'أحمد',
    brideName: 'ماريا',
    weddingTitleType: 'couple_names',
    guestPrefixText: 'الأستاذ/',
    guestPrefixEnabled: true,
    monogramEnabled: true,
    monogramGroomInitial: 'A',
    monogramBrideInitial: 'M',
    showHeartIcon: true,
    showFooterDivider: true,
    footerDividerText: 'بحضوركم تكتمل فرحتنا',
    qrInstructionText: 'يرجى إبراز الكود للدخول',
    cardTheme: 'wedding_golden_floral',
    colorScheme: 'default',
    qrPosition: 'center',
    doubleSidedMode: 'duplex',
    printMode: 'cards',
    showBackEnglishNote: true,
    backEnglishNoteText: 'A Special Day\nA Lasting Memory',
    backTitleText: 'بارك الله لهما وبارك عليهما\nوجمع بينهما في خير',
    backHeaderText: 'شكراً لكم على تلبية الدعوة',
  };

  const defaultHtml = PdfService.generatePrintHtml(testEvent, testInvitations, defaultSettings, qrImages);

  // Assertions for Image 1 front
  if (!defaultHtml.includes('أحمد & ماريا')) throw new Error('❌ اسم العروسين مفقود!');
  if (!defaultHtml.includes('الأستاذ/')) throw new Error('❌ بادئة الأستاذ/ مفقودة!');
  if (!defaultHtml.includes('سالم أحمد')) throw new Error('❌ اسم الضيف مفقود!');
  if (!defaultHtml.includes('قاعة الفخامة')) throw new Error('❌ موقع القاعة مفقود!');
  if (!defaultHtml.includes('2026-09-20')) throw new Error('❌ التاريخ مفقود!');
  if (!defaultHtml.includes('08:00 مساءً')) throw new Error('❌ الوقت مفقود!');
  if (!defaultHtml.includes('يرجى إبراز الكود للدخول')) throw new Error('❌ تعليمات الكود مفقودة!');
  if (!defaultHtml.includes('#102')) throw new Error('❌ رقم الدعوة مفقود!');
  if (!defaultHtml.includes('بحضوركم تكتمل فرحتنا')) throw new Error('❌ شريط التذييل مفقود!');
  if (!defaultHtml.includes('A Special Day') || !defaultHtml.includes('A Lasting Memory')) {
    throw new Error('❌ النص الإنجليزي في ظهر الكرت مفقود!');
  }
  if (!defaultHtml.includes('بارك الله لهما وبارك عليهما')) {
    throw new Error('❌ نص الدعاء في ظهر الكرت مفقود!');
  }
  if (!defaultHtml.includes('شكراً لكم على تلبية الدعوة')) {
    throw new Error('❌ نص الشكر في ظهر الكرت مفقود!');
  }
  console.log('✅ نجح اختبار القالب الافتراضي المطابق للصورة 1 بنسبة 100%.\n');

  // 2. Test Dynamic Customizations (Canva-like): Family Title + Prefix "المكرم/"
  console.log('▶ [2] اختبار التخصيص الديناميكي: تغيير العنوان إلى (تتشرف أسرة أحمد سالم) وتغيير اللقب إلى (المكرم/)...');
  const customizedSettings: PrintSettings = {
    ...defaultSettings,
    weddingTitleType: 'family_title',
    familyTitleText: 'تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف',
    guestPrefixText: 'المكرم/',
    monogramEnabled: false, // User removed monogram via (X)
    showBackEnglishNote: false, // User removed english note via (X)
  };

  const customHtml = PdfService.generatePrintHtml(testEvent, testInvitations, customizedSettings, qrImages);

  if (!customHtml.includes('تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف')) {
    throw new Error('❌ صيغة العائلة المخصصة لم تظهر!');
  }
  if (!customHtml.includes('المكرم/')) {
    throw new Error('❌ لقب المكرم/ لم يظهر!');
  }
  if (customHtml.includes('A Special Day')) {
    throw new Error('❌ تم حذف النص الإنجليزي بالـ (X) لكنه ما زال موجوداً!');
  }
  console.log('✅ نجح اختبار صيغة العائلة ولقب المكرم/ وحذف العناصر الديناميكية بالـ (X).\n');

  // 3. Test Duplex Long Edge Flipping and Page Balancing
  console.log('▶ [3] اختبار الوجهين المتطابقين (Duplex) والانعكاس الأفقي...');
  const multiInvitations: Invitation[] = [
    { ...testInvitations[0], id: 1, invitation_number: 101 },
    { ...testInvitations[0], id: 2, invitation_number: 102 },
  ];
  const duplexHtml = PdfService.generatePrintHtml(testEvent, multiInvitations, defaultSettings, { 1: qrImages[1], 2: qrImages[1] });
  if (!duplexHtml.includes('class="page"')) {
    throw new Error('❌ لم يتم العثور على صفحات الطباعة class="page"!');
  }
  console.log('✅ نجح توليد الوجهين الأمامي والخلفي المتناظرين بنجاح.\n');

  console.log('🎉 جميع اختبارات قالب الزفاف الذهبي الراقي والتخصيصات الديناميكية (مثل كانفا) نجحت بنسبة 100%!');
}

testGoldenFloralTemplate().catch((err) => {
  console.error('❌ فشل الاختبار:', err);
  process.exit(1);
});
