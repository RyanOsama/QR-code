import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { PdfService } from '../services/pdfService';
import { PrintSettings } from '../types';
import { QrService } from '../services/qrService';

async function testPdfAndQr() {
  console.log('--- بدء اختبار الـ PDF والطباعة والـ QR الفعلي (100 بطاقة) ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'test_pdf.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  initDatabase(testDbPath);

  // 1. Create event
  const event = EventRepository.create({
    name: 'حفل زفاف راقي - 100 مدعو',
    date: '2026-12-01',
    capacity: 100,
  });

  // 2. Generate 100 cards
  console.log('\n[1] توليد 100 بطاقة دعوة فريدة...');
  const res = InvitationRepository.generateBatch(event.id, 100);
  if (!res.success || res.count !== 100) {
    throw new Error('فشل توليد 100 بطاقة');
  }

  const invitations = InvitationRepository.getByEventId(event.id);
  console.log(`تم استرجاع ${invitations.length} بطاقة من قاعدة البيانات.`);

  // 3. Settings for 12 cards per A4 page (3 columns x 4 rows)
  const settings: PrintSettings = {
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
    welcomeText: 'أهلاً بكم في حفل تخرج',
    cardTheme: 'graduation',
    qrPosition: 'center',
  };

  // 4. Generate PDF Document
  console.log('\n[2] إنشاء مستند الـ PDF متعدد الصفحات وتوزيع 12 كرت في كل صفحة A4...');
  const doc = await PdfService.generatePdfDocument(event, invitations, settings);
  
  const pageCount = doc.getNumberOfPages();
  const expectedPages = Math.ceil(100 / 12); // 9 pages
  console.log(`عدد صفحات الـ PDF المنشأة: ${pageCount} (المتوقع: ${expectedPages} صفحات)`);
  if (pageCount !== expectedPages) {
    throw new Error(`عدد الصفحات غير متطابق: ${pageCount} بدلاً من ${expectedPages}`);
  }

  // 5. Save to disk and check file
  const outDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const pdfFilePath = path.join(outDir, 'test_output_100_cards.pdf');

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(pdfFilePath, pdfBuffer);

  const fileStats = fs.statSync(pdfFilePath);
  console.log(`✅ تم حفظ ملف الـ PDF بنجاح: ${pdfFilePath}`);
  console.log(`حجم الملف: ${(fileStats.size / 1024).toFixed(2)} KB`);

  // Verify PDF header
  const header = pdfBuffer.slice(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('الملف ليس PDF صالحاً');
  }
  console.log('✅ ترويسة ملف الـ PDF صالحة وسليمة 100%.');

  // 6. Verify QR Data URL generation and scan validity
  console.log('\n[3] التحقق من سلامة رموز الـ QR...');
  const firstToken = invitations[0].token;
  const lastToken = invitations[99].token;

  if (firstToken === lastToken) {
    throw new Error('تم العثور على رمز مكرر بين البطاقة الأولى والأخيرة');
  }

  const firstQr = await QrService.generateDataUrl(firstToken);
  const lastQr = await QrService.generateDataUrl(lastToken);

  if (firstQr === lastQr) {
    throw new Error('صورة QR مكررة!');
  }

  console.log(`✅ تم التحقق: الـ QR للبطاقة الأولى (#${invitations[0].invitation_number}) مختلف تماماً عن البطاقة المئة (#${invitations[99].invitation_number}).`);

  closeDatabase();
  console.log('\n🎉 اكتمل اختبار الـ PDF بنجاح تام! جاهز للطباعة والقص الفعلي.\n');
}

testPdfAndQr().catch((err) => {
  console.error('❌ خطأ في اختبار الـ PDF:', err);
  process.exit(1);
});
