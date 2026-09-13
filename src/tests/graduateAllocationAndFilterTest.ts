import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { PdfService } from '../services/pdfService';
import { PrintSettings } from '../types';

async function testGraduateAllocationAndFilter() {
  console.log('--- بدء اختبار تخصيص كروت الخريجين وتصفية الطباعة (30 طالب × 10 كروت) ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'test_graduates.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  initDatabase(testDbPath);

  // 1. Create graduation event with capacity 300
  console.log('\n[1] إنشاء مناسبة حفل تخرج بسعة 300 كرت...');
  const event = EventRepository.create({
    name: 'حفل تخرج الدفعة الثلاثين',
    date: '2026-09-19',
    time: '08:00 مساءً',
    venue: 'قاعة الاحتفالات الكبرى',
    eventType: 'graduation',
    capacity: 300,
  });
  console.log(`✅ تم إنشاء المناسبة: ID=${event.id}, الاسم=${event.name}`);

  // 2. Prepare 30 graduates with 10 cards each
  console.log('\n[2] توزيع الحصص لـ 30 طالب (10 كروت لكل طالب)...');
  const students = [
    'ريان أسامة بن عسله',
    'أحمد خالد السعيد',
    'فيصل محمد القحطاني',
    'سعود عبدالله الدوسري',
    'محمد عمر باوزير',
    ...Array.from({ length: 25 }, (_, i) => `طالب خريج رقم ${i + 6}`)
  ];

  const allocations = students.map((name) => ({
    graduateName: name,
    count: 10,
  }));

  const batchRes = InvitationRepository.generateBatch(event.id, 300, undefined, allocations);
  if (!batchRes.success || batchRes.count !== 300) {
    throw new Error(`فشل توليد كروت الخريجين: ${batchRes.error}`);
  }
  console.log(`✅ تم توليد ${batchRes.count} كرت بنجاح لـ ${students.length} طالب.`);

  // 3. Test retrieving all cards (General Invitation)
  console.log('\n[3] استرجاع جميع الكروت (دعوة عامة)...');
  const allCards = InvitationRepository.getByEventId(event.id);
  if (allCards.length !== 300) {
    throw new Error(`عدد الكروت غير صحيح: ${allCards.length} بدلاً من 300`);
  }
  console.log(`✅ عدد كروت الدعوة العامة: ${allCards.length} كرت.`);

  // 4. Test filtering by specific graduate: "ريان أسامة بن عسله"
  console.log('\n[4] تصفية الكروت حسب خريج محدد: "ريان أسامة بن عسله"...');
  const rayanCards = InvitationRepository.getByEventId(event.id, { graduateName: 'ريان أسامة بن عسله' });
  if (rayanCards.length !== 10) {
    throw new Error(`عدد كروت ريان غير متطابق: ${rayanCards.length} بدلاً من 10`);
  }
  const allMatch = rayanCards.every((c) => c.graduate_name === 'ريان أسامة بن عسله');
  if (!allMatch) {
    throw new Error('ليست كل الكروت تابعة لريان أسامة بن عسله');
  }
  console.log(`✅ تم استرجاع بالضبط 10 كروت مخصصة لريان أسامة بن عسله بنجاح!`);

  // 5. Test PDF Generation for single graduate with royal_graduation template
  console.log('\n[5] إنشاء مستند PDF لقالب التخرج الملكي (royal_graduation) لـ 10 كروت...');
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
    welcomeText: 'حَفْلُ تَخَرُّج',
    customSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
    cardTheme: 'royal_graduation',
    qrPosition: 'center',
  };

  const pdfDoc = await PdfService.generatePdfDocument(event, rayanCards, settings);
  const pageCount = pdfDoc.getNumberOfPages();
  // 10 cards with 12 per page = 1 page
  if (pageCount !== 1) {
    throw new Error(`عدد الصفحات غير متوقع: ${pageCount} (المتوقع 1 صفحة)`);
  }
  console.log(`✅ تم إنشاء الـ PDF بنجاح في صفحة واحدة لـ 10 كروت.`);

  const outDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const pdfOutPath = path.join(outDir, 'كروت_تخرج_ريان_أسامة_بن_عسله.pdf');
  const buffer = Buffer.from(pdfDoc.output('arraybuffer'));
  fs.writeFileSync(pdfOutPath, buffer);
  console.log(`✅ تم حفظ الملف: ${pdfOutPath} (حجم الملف: ${(buffer.length / 1024).toFixed(1)} KB)`);

  closeDatabase();
  console.log('\n🎉 اكتمل اختبار تخصيص الكروت والتصفية بنجاح 100%!');
}

testGraduateAllocationAndFilter().catch((err) => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
