import fs from 'fs';
import path from 'path';
import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

async function testCardShapeAndCustomText() {
  console.log('--- اختبار ميزة شكل الكرت (مستطيل/مربع) وتخصيص كافة نصوص القالب ---');

  const testEvent: Event = {
    id: 99,
    name: 'حفل زواج راكان وسارة',
    date: '2026-10-15',
    time: '08:30 مساءً',
    venue: 'قاعة الأساطير الكبرى',
    capacity: 4,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    eventType: 'wedding',
  };

  const testInvitations: Invitation[] = [
    {
      id: 101,
      event_id: 99,
      token: 'INV-SQUARE-001',
      guest_name: 'معالي الشيخ فهد آل سعود',
      has_name: 1,
      status: 'UNUSED',
      used_at: null,
      invitation_number: 1,
      scan_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 102,
      event_id: 99,
      token: 'INV-SQUARE-002',
      guest_name: '', // دعوة عامة بدون اسم
      has_name: 0,
      status: 'UNUSED',
      used_at: null,
      invitation_number: 2,
      scan_count: 0,
      created_at: new Date().toISOString(),
    },
  ];

  // 1. Test Square Card with Full Custom Texts
  const squareSettings: PrintSettings = {
    paperSize: 'A4',
    columns: 3,
    rows: 3,
    cardWidth: 70,
    cardHeight: 70,
    cardShape: 'rectangle' as any,
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
    welcomeText: 'أهلاً وسهلاً بضيوفنا الأعزاء (نص مخصص)',
    customSubtitle: 'فرحتنا اليوم بلقياكم أغلى من كل شيء (نص مخصص)',
    guestPrefixText: 'يتشرف الداعي بدعوة السمو والمكرم/ـة:',
    generalCardNotice: 'يسعدنا جداً حضوركم وتلبية الدعوة المباركة',
    qrInstructionText: 'امسح هذا الباركود للدخول السريع من البوابة الشرقية',
    footerNoteText: 'أهلاً بكم في ليلة العمر التي تزهو بكم',
    backTitleText: 'بطاقة دخول خاصة بالزفاف الملكي',
    backHeaderText: 'ليلة مباركة تجمع القلوب على المودة والوفاء',
    backMessageText: 'شرفتم ونورتم حفلنا بحضوركم الكريم',
    backBadgeText: 'دخول VIP مخصص',
    cardTheme: 'wedding_imperial',
    colorScheme: 'default',
    qrPosition: 'center',
    doubleSidedMode: 'duplex',
    printMode: 'cards',
  };

  console.log('[1] توليد كروت مربعة بوجهين مع نصوص مخصصة كاملة عبر HTML...');
  const qrImages: Record<number, string> = {
    101: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    102: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const htmlOutput = PdfService.generatePrintHtml(testEvent, testInvitations, squareSettings, qrImages);

  // Validate that all custom texts exist in the generated HTML
  if (!htmlOutput.includes('أهلاً وسهلاً بضيوفنا الأعزاء (نص مخصص)')) {
    throw new Error('❌ لم يتم العثور على عبارة الترحيب المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('يتشرف الداعي بدعوة السمو والمكرم/ـة:')) {
    throw new Error('❌ لم يتم العثور على مقدمة اسم المدعو المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('يسعدنا جداً حضوركم وتلبية الدعوة المباركة')) {
    throw new Error('❌ لم يتم العثور على عبارة الدعوة العامة المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('امسح هذا الباركود للدخول السريع من البوابة الشرقية')) {
    throw new Error('❌ لم يتم العثور على تعليمات الباركود المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('أهلاً بكم في ليلة العمر التي تزهو بكم')) {
    throw new Error('❌ لم يتم العثور على عبارة التذييل المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('بطاقة دخول خاصة بالزفاف الملكي')) {
    throw new Error('❌ لم يتم العثور على عنوان ظهر الكرت المخصص في الـ HTML');
  }
  if (!htmlOutput.includes('ليلة مباركة تجمع القلوب على المودة والوفاء')) {
    throw new Error('❌ لم يتم العثور على عبارة الظهر العلوية المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('شرفتم ونورتم حفلنا بحضوركم الكريم')) {
    throw new Error('❌ لم يتم العثور على رسالة الظهر المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('دخول VIP مخصص')) {
    throw new Error('❌ لم يتم العثور على شارة الظهر المخصصة في الـ HTML');
  }
  if (!htmlOutput.includes('aspect-ratio: 1 / 1')) {
    throw new Error('❌ لم يتم العثور على تنسيق النسبة المربعة aspect-ratio: 1 / 1');
  }
  console.log('✅ تم التحقق بنجاح من تضمين كافة النصوص المخصصة والنسبة المربعة في طباعة الـ HTML');

  // 2. Test PDF document generation via jsPDF
  console.log('[2] توليد مستند PDF عبر jsPDF للكروت المربعة...');
  const pdfDoc = await PdfService.generatePdfDocument(testEvent, testInvitations, squareSettings);
  const outDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const pdfPath = path.join(outDir, 'test_square_custom_texts.pdf');
  fs.writeFileSync(pdfPath, Buffer.from(pdfDoc.output('arraybuffer')));
  console.log(`✅ تم إنشاء وحفظ ملف PDF الكروت المربعة بنجاح: ${pdfPath}`);

  // 3. Test Horizontal Landscape Rectangle with Custom Texts (85x58 mm - بالعرض يمين ويسار)
  console.log('[3] توليد كروت مستطيلة بالعرض (أفقي 85×58 مم)...');
  const landscapeRectSettings: PrintSettings = {
    ...squareSettings,
    cardShape: 'rectangle',
    cardWidth: 85,
    cardHeight: 58,
    columns: 2,
    rows: 4,
  };
  const landscapeHtml = PdfService.generatePrintHtml(testEvent, testInvitations, landscapeRectSettings, qrImages);
  if (!landscapeHtml.includes('أهلاً وسهلاً بضيوفنا الأعزاء (نص مخصص)')) {
    throw new Error('❌ لم يتم العثور على عبارة الترحيب في الكرت المستطيل بالعرض');
  }
  if (!landscapeHtml.includes('aspect-ratio: 85 / 58')) {
    throw new Error('❌ لم يتم العثور على نسبة العرض إلى الارتفاع الأفقية aspect-ratio: 85 / 58');
  }
  console.log('✅ تم التحقق بنجاح من توليد الكروت المستطيلة بالعرض (أفقي: يمين ويسار)');

  // 4. Test Vertical Rectangle (58x85 mm - طولي)
  console.log('[4] توليد كروت مستطيلة بالطول (رأسي 58×85 مم)...');
  const verticalRectSettings: PrintSettings = {
    ...squareSettings,
    cardShape: 'rectangle' as any,
    cardWidth: 58,
    cardHeight: 85,
    columns: 3,
    rows: 4,
  };
  const verticalHtml = PdfService.generatePrintHtml(testEvent, testInvitations, verticalRectSettings, qrImages);
  if (!verticalHtml.includes('aspect-ratio: 58 / 85')) {
    throw new Error('❌ لم يتم العثور على نسبة الارتفاع الرأسية aspect-ratio: 58 / 85');
  }
  console.log('✅ تم التحقق بنجاح من توليد الكروت المستطيلة بالطول (رأسي)');

  console.log('🎉 نجحت كافة اختبارات شكل الكرت (مستطيل بالعرض / مربع / مستطيل بالطول) وتخصيص النصوص بنسبة 100%!');
}

testCardShapeAndCustomText().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
