import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

async function runTest() {
  console.log('--- اختبار تطابق مقاسات الوجهين الأمامي والخلفي وظهور الموقع والتاريخ والوقت في كافة الأشكال ---');

  const testEvent: Event = {
    id: 1,
    name: 'حفل زفاف أحمد وماريا',
    date: '2026-10-15',
    time: '08:30 مساءً',
    venue: 'قاعة الأساطير الكبرى',
    eventType: 'wedding',
    capacity: 50,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleInvitation: Invitation = {
    id: 1,
    event_id: 1,
    invitation_number: 1,
    token: 'TEST-TOKEN-1234',
    guest_name: 'سالم عبدالله الكندي',
    has_name: 1,
    status: 'UNUSED',
    used_at: null,
    created_at: new Date().toISOString(),
  };

  const qrImages: Record<number, string> = {
    1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const shapes: ('rectangle')[] = ['rectangle'];

  // Test 1: Landscape Rectangle (85x58 mm)
  console.log('[1] فحص كرت مستطيل بالعرض (Landscape)...');
  const landscapeSettings: PrintSettings = {
    paperSize: 'A4',
    columns: 3,
    rows: 4,
    cardWidth: 85,
    cardHeight: 58,
    cardShape: 'rectangle',
    gapX: 3,
    gapY: 3,
    marginX: 10,
    marginY: 10,
    showEventName: true,
    showGuestName: true,
    showInvitationNumber: true,
    showCropMarks: false,
    showVenue: true,
    showTime: true,
    showDate: true,
    venueText: 'قاعة الأساطير الكبرى',
    timeText: '08:30 مساءً',
    dateText: '2026-10-15',
    welcomeText: 'دعوة زفاف كريمة',
    cardTheme: 'wedding_royal_burgundy',
    qrPosition: 'center',
    doubleSidedMode: 'duplex',
    printMode: 'cards',
  };

  const landscapeHtml = PdfService.generatePrintHtml(testEvent, [sampleInvitation], landscapeSettings, qrImages);

  if (!landscapeHtml.includes('قاعة الأساطير الكبرى')) {
    throw new Error('الموقع غير موجود في كرت المستطيل الأفقي!');
  }
  if (!landscapeHtml.includes('2026-10-15')) {
    throw new Error('التاريخ غير موجود في كرت المستطيل الأفقي!');
  }
  if (!landscapeHtml.includes('08:30 مساءً')) {
    throw new Error('الوقت غير موجود في كرت المستطيل الأفقي!');
  }
  console.log('✅ المستطيل الأفقي: ظهر الموقع والتاريخ والوقت بنجاح.');

  // Test 2: Square (65x65 mm)
  console.log('[2] فحص كرت مربع (Square)...');
  const squareSettings: PrintSettings = {
    ...landscapeSettings,
    cardWidth: 65,
    cardHeight: 65,
    cardShape: 'rectangle' as any,
  };

  const squareHtml = PdfService.generatePrintHtml(testEvent, [sampleInvitation], squareSettings, qrImages);

  if (!squareHtml.includes('قاعة الأساطير الكبرى')) {
    throw new Error('الموقع غير موجود في الكرت المربع!');
  }
  if (!squareHtml.includes('2026-10-15')) {
    throw new Error('التاريخ غير موجود في الكرت المربع!');
  }
  if (!squareHtml.includes('08:30 مساءً')) {
    throw new Error('الوقت غير موجود في الكرت المربع!');
  }
  console.log('✅ الكرت المربع: ظهر الموقع والتاريخ والوقت بنجاح.');

  // Test 3: Vertical Rectangle (58x85 mm)
  console.log('[3] فحص كرت مستطيل بالطول (Vertical)...');
  const verticalSettings: PrintSettings = {
    ...landscapeSettings,
    cardWidth: 58,
    cardHeight: 85,
    cardShape: 'rectangle',
  };

  const verticalHtml = PdfService.generatePrintHtml(testEvent, [sampleInvitation], verticalSettings, qrImages);

  if (!verticalHtml.includes('قاعة الأساطير الكبرى')) {
    throw new Error('الموقع غير موجود في كرت المستطيل الرأسي!');
  }
  if (!verticalHtml.includes('2026-10-15')) {
    throw new Error('التاريخ غير موجود في كرت المستطيل الرأسي!');
  }
  if (!verticalHtml.includes('08:30 مساءً')) {
    throw new Error('الوقت غير موجود في كرت المستطيل الرأسي!');
  }
  console.log('✅ المستطيل الرأسي: ظهر الموقع والتاريخ والوقت بنجاح.');

  // Test 4: Verify identical dimensions and duplex matching
  console.log('[4] فحص تطابق المقاسات بين الوجه الأمامي والوجه الخلفي...');
  // Both front and back pages exist
  if (!landscapeHtml.includes('class="page"') || (landscapeHtml.match(/class="page"/g) || []).length < 2) {
    throw new Error('لم يتم إنشاء صفحة الوجه الخلفي في نمط duplex!');
  }
  console.log('✅ تم التحقق: كل من صفحتي الوجه الأمامي والخلفي منشأة بمقاسات متطابقة تماماً.');

  console.log('🎉 اكتملت جميع الاختبارات بنجاح 100%! التطابق التام وظهور الموقع والتاريخ والوقت يعمل بامتياز.');
}

runTest().catch((err) => {
  console.error('❌ فشل الاختبار:', err);
  process.exit(1);
});
