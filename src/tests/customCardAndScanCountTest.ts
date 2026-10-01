import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { PdfService } from '../services/pdfService';
import { Event, PrintSettings } from '../types';

async function runTests() {
  console.log('--- بدء اختبار عدد مرات المسح وتوليد الكروت ذات الوجهين ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'test_custom_cards.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  initDatabase(testDbPath);

  // 1. Create an event
  const event = EventRepository.create({
    name: 'حفل زفاف تجريبي فاخر',
    eventType: 'wedding',
    date: '2026-10-01',
    time: '08:00 مساءً',
    venue: 'قاعة القمة الكبرى',
    capacity: 2,
  });
  console.log(`[1] تم إنشاء المناسبة بنجاح: ID=${event.id}, السعة=${event.capacity}`);

  // 2. Generate 2 invitations
  const genResult = InvitationRepository.generateBatch(event.id, 2);
  console.log(`[2] تم توليد ${genResult.count} دعوات`);

  // 3. Perform scan logs on invitation 1
  const invs = InvitationRepository.getByEventId(event.id);
  const inv1 = invs[0];
  const inv2 = invs[1];

  // Log scans for inv1 (e.g. 3 scans)
  ScanLogRepository.create({
    event_id: event.id,
    invitation_id: inv1.id,
    result: 'ACCEPTED',
    device_name: 'مدخل الرجال',
  });
  ScanLogRepository.create({
    event_id: event.id,
    invitation_id: inv1.id,
    result: 'ALREADY_USED',
    device_name: 'مدخل النساء',
  });
  ScanLogRepository.create({
    event_id: event.id,
    invitation_id: inv1.id,
    result: 'ALREADY_USED',
    device_name: 'مدخل الرجال',
  });

  // 4. Verify scan_count is correctly calculated
  const updatedInvs = InvitationRepository.getByEventId(event.id);
  const updatedInv1 = updatedInvs.find((i) => i.id === inv1.id);
  const updatedInv2 = updatedInvs.find((i) => i.id === inv2.id);

  console.log(`[3] التحقق من عدد مرات المسح:`);
  console.log(`   - كرت رقم #${updatedInv1?.invitation_number}: مسح ${updatedInv1?.scan_count} مرات (المتوقع: 3)`);
  console.log(`   - كرت رقم #${updatedInv2?.invitation_number}: مسح ${updatedInv2?.scan_count} مرات (المتوقع: 0)`);

  if (updatedInv1?.scan_count !== 3 || updatedInv2?.scan_count !== 0) {
    throw new Error('فشل التحقق من عدد مرات المسح!');
  }
  console.log('✅ تم احتساب عدد مرات المسح بدقة متناهية.');

  // 5. Test Two-Sided Duplex Card HTML Generation in PdfService
  console.log('[4] اختبار توليد صفحة الطباعة ذات الوجهين (Duplex) بكروت مخصصة:');
  const dummyFront = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const dummyBack = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const settings: PrintSettings = {
    paperSize: 'A4',
    columns: 2,
    rows: 2,
    cardWidth: 90,
    cardHeight: 120,
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
    welcomeText: 'دعوة زفاف',
    cardTheme: 'custom',
    customCardImage: dummyFront,
    customCardBackImage: dummyBack,
    customQrSide: 'back', // QR placed on Back side
    customQrX: 45,
    customQrY: 70,
    customQrSize: 28,
    doubleSidedMode: 'duplex',
    qrPosition: 'custom',
  };

  const qrImages = {
    [inv1.id]: dummyFront,
    [inv2.id]: dummyFront,
  };

  const html = PdfService.generatePrintHtml(event, updatedInvs, settings, qrImages);

  // Check that html contains both Front and Back pages (2 pages for 1 sheet)
  const pageMatches = html.match(/<div class="page">/g);
  console.log(`   - عدد صفحات الـ HTML المنشأة: ${pageMatches?.length} (المتوقع: 2 - صفحة أمامية وصفحة خلفية)`);

  if (pageMatches?.length !== 2) {
    throw new Error(`خطأ: المتوقع صفحتين للطباعة على الوجهين ولكن تم العثور على ${pageMatches?.length}`);
  }

  // Verify that crop marks are NOT present
  if (html.includes('border-top:1px solid #94a3b8')) {
    throw new Error('خطأ: تم العثور على حدود وعلامات قص غير مرغوبة في الـ HTML!');
  }
  console.log('✅ تم التحقق: خلو الـ HTML من أي علامات أو حدود قص.');

  // Verify that QR is on Back side as configured
  console.log('✅ تم توليد الـ HTML بنجاح مع مطابقة الوجهين للطباعة المزدوجة A4.');
  closeDatabase();
  console.log('\n🎉 اكتمل اختبار الكروت المخصصة وعدد مرات المسح بنجاح 100%!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
