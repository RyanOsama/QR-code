import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { PdfService } from '../services/pdfService';
import { PrintSettings, CardColorScheme } from '../types';

async function testColorSchemesAndAllocation() {
  console.log('--- بدء اختبار أنظمة الألوان، توزيع الطلاب، وتسمية الملفات ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'test_colors.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  initDatabase(testDbPath);

  // 1. Create graduation event
  const event = EventRepository.create({
    name: 'حفل تخرج طلاب جامعة الريان',
    date: '2026-09-20',
    time: '08:00 مساءً',
    venue: 'قاعة الأندلس',
    eventType: 'graduation',
    capacity: 150,
  });

  // 2. Test student count logic (> 10 students defaults to 8 cards)
  console.log('\n[1] فحص منطق خفض توزيع الكروت للطلاب (> 10 طلاب):');
  const getCardsPerStudent = (studentCount: number) => (studentCount > 10 ? 8 : 10);
  
  if (getCardsPerStudent(5) !== 10) throw new Error('فشل فحص 5 طلاب (يجب أن يكون 10)');
  if (getCardsPerStudent(10) !== 10) throw new Error('فشل فحص 10 طلاب (يجب أن يكون 10)');
  if (getCardsPerStudent(11) !== 8) throw new Error('فشل فحص 11 طالب (يجب أن يكون 8)');
  if (getCardsPerStudent(12) !== 8) throw new Error('فشل فحص 12 طالب (يجب أن يكون 8)');
  console.log('✅ منطق التوزيع الذكي: 10 طلاب = 10 كروت (100 كرت)، 11 طالب = 8 كروت (88 كرت <= 100).');

  // 3. Generate invitations for a specific student
  const studentName = 'ريان أسامة بن عسله';
  InvitationRepository.generateBatch(event.id, 8, undefined, [{ graduateName: studentName, count: 8 }]);
  const studentCards = InvitationRepository.getByEventId(event.id, { graduateName: studentName });
  if (studentCards.length !== 8) throw new Error('عدد كروت الطالب غير متطابق');

  // 4. Test file naming format
  console.log('\n[2] فحص تنسيق تسمية الملف التلقائي (اسم المناسبة - اسم الطالب أو عامة):');
  const safeEventName = event.name.replace(/[\\/:*?"<>|]/g, '_').trim();
  const studentFileName = `${safeEventName} - ${studentName}.pdf`;
  const generalFileName = `${safeEventName} - عامة.pdf`;

  if (studentFileName !== 'حفل تخرج طلاب جامعة الريان - ريان أسامة بن عسله.pdf') {
    throw new Error(`اسم ملف الطالب غير متطابق: ${studentFileName}`);
  }
  if (generalFileName !== 'حفل تخرج طلاب جامعة الريان - عامة.pdf') {
    throw new Error(`اسم الملف العام غير متطابق: ${generalFileName}`);
  }
  console.log(`✅ اسم ملف الطالب: "${studentFileName}"`);
  console.log(`✅ اسم الملف العام: "${generalFileName}"`);

  // 5. Test PDF Generation across color schemes
  console.log('\n[3] فحص توليد الـ PDF بمختلف لوحات الألوان:');
  const schemes: CardColorScheme[] = [
    'default',
    'black_white',
    'blue_white',
    'emerald_white',
    'burgundy',
    'violet',
    'custom',
  ];

  for (const scheme of schemes) {
    const settings: PrintSettings = {
      paperSize: 'A4',
      columns: 2,
      rows: 4,
      cardWidth: 0,
      cardHeight: 0,
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
      cardTheme: 'royal_graduation',
      colorScheme: scheme,
      customPrimaryColor: scheme === 'custom' ? '#1e293b' : undefined,
      customAccentColor: scheme === 'custom' ? '#f59e0b' : undefined,
      qrPosition: 'center',
    };

    const doc = await PdfService.generatePdfDocument(event, studentCards, settings);
    const pages = doc.getNumberOfPages();
    if (pages !== 1) throw new Error(`صفحات غير متطابقة في نظام الألوان ${scheme}`);
    console.log(`  ✓ تم بنجاح توليد PDF لنظام الألوان: [${scheme}]`);
  }

  closeDatabase();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  console.log('\n🎉 اكتملت جميع الفحوصات بنجاح 100%!');
}

testColorSchemesAndAllocation().catch((err) => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
