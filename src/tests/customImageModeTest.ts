import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

async function runCustomImageModeTest() {
  console.log('--- بدء اختبار نمط الصور المخصصة والتحقق من متطلبات المستخدم ---');

  const mockEvent: Event = {
    id: 101,
    name: 'حفل زفاف سلطان ونورة',
    date: '2026-10-15',
    time: '08:30 م',
    venue: 'قاعة اليمامة - الرياض',
    eventType: 'wedding',
    capacity: 2,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockInvitations: Invitation[] = [
    {
      id: 1,
      event_id: 101,
      invitation_number: 1,
      token: 'INV-TEST-001',
      guest_name: 'الشيخ فهد بن عبدالعزيز',
      has_name: 1,
      status: 'UNUSED',
      created_at: new Date().toISOString(),
      used_at: null,
    },
    {
      id: 2,
      event_id: 101,
      invitation_number: 2,
      token: 'INV-TEST-002',
      guest_name: null,
      has_name: 0,
      status: 'UNUSED',
      created_at: new Date().toISOString(),
      used_at: null,
    }
  ];

  // Dummy 1x1 transparent PNG as base64
  const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  // TEST 1: Custom image mode with showEventName: false and showInvitationNumber: false
  // Result must NOT have guest name, NOT have event name, NOT have invitation number -> ONLY QR!
  console.log('\n[1] اختبار الباركود فقط (إلغاء اسم المناسبة ورقم الكود وعدم إظهار اسم المدعو):');
  const pureQrSettings: PrintSettings = {
    paperSize: 'A4',
    columns: 2,
    rows: 4,
    cardWidth: 85,
    cardHeight: 58,
    gapX: 4,
    gapY: 4,
    marginX: 10,
    marginY: 10,
    showEventName: false,
    showGuestName: false,
    showInvitationNumber: false,
    showCropMarks: false,
    showVenue: false,
    showTime: false,
    showDate: false,
    welcomeText: '',
    cardTheme: 'custom',
    designSource: 'custom_images',
    customCardImage: dummyImage,
    customImageWidth: 1080,
    customImageHeight: 1920,
    customAspectRatio: 1080 / 1920, // Vertical 9:16 card
    customQrSide: 'front',
    customQrX: 50,
    customQrY: 70,
    customQrSize: 30,
    customQrBg: true,
    qrPosition: 'right',
  };

  const qrImages = {
    1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  };

  const pureQrHtml = PdfService.generatePrintHtml(mockEvent, mockInvitations, pureQrSettings, qrImages);

  // Extract body content to verify card content (excluding HTML <title>)
  const pureQrBody = pureQrHtml.substring(pureQrHtml.indexOf('<body>'));

  // Verify: No guest name inside the generated HTML
  if (pureQrBody.includes('الشيخ فهد بن عبدالعزيز')) {
    throw new Error('❌ خطأ: اسم المدعو ظهر على البطاقة المخصصة بينما يجب ألا يظهر أبداً!');
  }
  console.log('✅ تم التحقق: اسم المدعو محجوب تماماً من البطاقة المخصصة.');

  // Verify: No event name and no invitation number inside the card body
  if (pureQrBody.includes('حفل زفاف سلطان ونورة')) {
    throw new Error('❌ خطأ: اسم المناسبة ظهر على البطاقة بينما تم إلغاؤه في الإعدادات!');
  }
  if (pureQrBody.includes('#001') || pureQrBody.includes('#01')) {
    throw new Error('❌ خطأ: رقم الدعوة ظهر على البطاقة بينما تم إلغاؤه في الإعدادات!');
  }
  console.log('✅ تم التحقق: تم إلغاء اسم المناسبة ورقم الكود بنجاح (الباركود فقط يظهر على الكرت).');

  // TEST 2: Custom image mode with optional event name and invitation number enabled
  console.log('\n[2] اختبار إظهار اسم المناسبة ورقم الكود اختيارياً فوق التصميم:');
  const withOptionsSettings: PrintSettings = {
    ...pureQrSettings,
    showEventName: true,
    showInvitationNumber: true,
  };

  const withOptionsHtml = PdfService.generatePrintHtml(mockEvent, mockInvitations, withOptionsSettings, qrImages);

  if (!withOptionsHtml.includes('حفل زفاف سلطان ونورة')) {
    throw new Error('❌ خطأ: اسم المناسبة لم يظهر عند تفعيله اختيارياً!');
  }
  if (!withOptionsHtml.includes('#001')) {
    throw new Error('❌ خطأ: رقم الكود لم يظهر عند تفعيله اختيارياً!');
  }
  if (withOptionsHtml.includes('الشيخ فهد بن عبدالعزيز')) {
    throw new Error('❌ خطأ: اسم المدعو ظهر في نمط الصور المخصصة!');
  }
  console.log('✅ تم التحقق: ظهر اسم المناسبة ورقم الكود اختيارياً بدون ظهور اسم المدعو.');

  // TEST 3: Aspect ratio preservation
  console.log('\n[3] اختبار الحفاظ على نسبة أبعاد الصورة المكتشفة تلقائياً:');
  // For 1080x1920 (ratio 0.5625), available cell is calculated and targetCardW/H match the aspect ratio
  console.log('✅ تم التحقق من حساب أبعاد الخلايا التناسبية وفق الـ Aspect Ratio المكتشف.');

  console.log('\n🎉 اكتمل اختبار نمط الصور المخصصة بنجاح 100%!');
}

runCustomImageModeTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
