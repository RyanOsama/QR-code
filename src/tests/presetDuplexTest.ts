import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { PdfService } from '../services/pdfService';
import { PrintSettings } from '../types';

async function testPresetDuplex() {
  console.log('--- اختبار طباعة القوالب المطرزة بوجهين (Duplex) ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'test_preset_duplex.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  initDatabase(testDbPath);

  // 1. Wedding Event
  const event = EventRepository.create({
    name: 'زواج آل فلان وآل علان',
    date: '2026-10-15',
    capacity: 24,
    eventType: 'wedding',
  });

  InvitationRepository.generateBatch(event.id, 24);
  const invitations = InvitationRepository.getByEventId(event.id);
  invitations[0].guest_name = 'الشيخ محمد بن سعود';

  const settings: PrintSettings = {
    paperSize: 'A4',
    columns: 3,
    rows: 4, // 12 per page
    cardWidth: 58,
    cardHeight: 65,
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
    welcomeText: 'دعوة لحضور حفل زفاف',
    cardTheme: 'wedding',
    qrPosition: 'center',
    doubleSidedMode: 'duplex', // 24 cards / 12 per page = 2 front pages + 2 back pages = 4 pages total
  };

  const doc = await PdfService.generatePdfDocument(event, invitations, settings);
  const pages = doc.getNumberOfPages();
  console.log(`عدد صفحات الـ PDF المنشأة في نمط الوجهين: ${pages} (المتوقع: 4 صفحات)`);
  if (pages !== 4) {
    throw new Error(`عدد الصفحات المتوقع 4 ولكن تم إنشاء: ${pages}`);
  }

  const outDir = path.join(process.cwd(), 'database_files');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'test_preset_wedding_duplex.pdf');
  fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
  console.log(`✅ تم إنشاء وحفظ ملف كرت الزفاف المطرز بوجهين بنجاح: ${outPath}`);

  // 2. Test front_only mode
  const settingsFrontOnly: PrintSettings = {
    ...settings,
    cardTheme: 'wedding_andalusian',
    doubleSidedMode: 'front_only',
  };
  const docFrontOnly = await PdfService.generatePdfDocument(event, invitations, settingsFrontOnly);
  const pagesFrontOnly = docFrontOnly.getNumberOfPages();
  console.log(`عدد صفحات الـ PDF في نمط الوجه الأمامي فقط: ${pagesFrontOnly} (المتوقع: 2 صفحة)`);
  if (pagesFrontOnly !== 2) {
    throw new Error(`عدد الصفحات المتوقع 2 ولكن تم إنشاء: ${pagesFrontOnly}`);
  }

  // 3. Test all other bespoke wedding themes
  for (const theme of ['wedding_damask', 'wedding_imperial', 'wedding_minimal_luxury'] as const) {
    const docTheme = await PdfService.generatePdfDocument(event, invitations.slice(0, 12), {
      ...settings,
      cardTheme: theme,
      doubleSidedMode: 'duplex',
    });
    if (docTheme.getNumberOfPages() !== 2) {
      throw new Error(`Expected 2 pages for 12 cards duplex in ${theme}`);
    }
    console.log(`✅ تم التحقق من نجاح توليد قالب: ${theme}`);
  }

  closeDatabase();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  console.log('🎉 اكتمل اختبار القوالب المطرزة بوجهين والوجه الواحد بنجاح 100%!');
}

testPresetDuplex().catch((err) => {
  console.error('فشل الاختبار:', err);
  process.exit(1);
});
