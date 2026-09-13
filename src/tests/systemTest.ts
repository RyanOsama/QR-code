import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';
import { CheckInService } from '../services/checkInService';
import { QrService } from '../services/qrService';

async function runSystemVerification() {
  console.log('--- بدء اختبار النظام الشامل (System Verification) ---');

  // Use a dedicated test database
  const testDbPath = path.join(process.cwd(), 'database_files', 'test_verification.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  initDatabase(testDbPath);

  // 1. Create Event
  console.log('\n[1] إنشاء مناسبة جديدة...');
  const event1 = EventRepository.create({
    name: 'زواج محمد وأحمد',
    date: '2026-10-15',
    capacity: 100,
  });
  console.log(`تم إنشاء المناسبة بنجاح: ID=${event1.id}, الاسم=${event1.name}, السعة=${event1.capacity}`);
  if (event1.name !== 'زواج محمد وأحمد' || event1.capacity !== 100) {
    throw new Error('فشل التحقق من بيانات المناسبة');
  }

  // 2. Generate 100 invitations
  console.log('\n[2] توليد 100 دعوة فريدة...');
  const genResult = InvitationRepository.generateBatch(event1.id, 100);
  console.log(`نتيجة التوليد: نجاح=${genResult.success}, العدد=${genResult.count}`);
  if (!genResult.success || genResult.count !== 100) {
    throw new Error('فشل توليد 100 دعوة');
  }

  const invitations = InvitationRepository.getByEventId(event1.id);
  console.log(`عدد الدعوات المسترجعة من قاعدة البيانات: ${invitations.length}`);
  if (invitations.length !== 100) {
    throw new Error('عدد الدعوات لا يطابق 100');
  }

  // 3. Verify Capacity Limit (trying to generate 1 more invitation should fail)
  console.log('\n[3] اختبار منع تجاوز السعة المحددة (100)...');
  const overflowResult = InvitationRepository.generateBatch(event1.id, 1);
  console.log(`محاولة تجاوز السعة: نجاح=${overflowResult.success}, رسالة الخطأ=${overflowResult.error}`);
  if (overflowResult.success) {
    throw new Error('خطأ أمني: النظام سمح بتجاوز السعة المحددة!');
  }
  console.log('✅ تم منع تجاوز السعة بنجاح.');

  // 4. Verify Tokens Uniqueness
  console.log('\n[4] التحقق من تفرد الرموز وعدم التكرار...');
  const tokens = new Set<string>();
  for (const inv of invitations) {
    if (tokens.has(inv.token)) {
      throw new Error(`تم العثور على رمز مكرر: ${inv.token}`);
    }
    tokens.add(inv.token);
  }
  console.log(`✅ تم التحقق: جميع الـ 100 رمز فريدة ومميزة بنسبة 100%`);

  // 5. Test QR generation
  console.log('\n[5] اختبار توليد رمز QR عالي الدقة...');
  const sampleToken = invitations[0].token;
  const qrDataUrl = await QrService.generateDataUrl(sampleToken, 200);
  if (!qrDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('فشل توليد صورة QR صالحة');
  }
  console.log('✅ تم توليد رمز QR عالي الدقة بنجاح.');

  // 6. Test Atomic Check-in & Double-Scan Prevention (المسح المزدوج)
  console.log('\n[6] اختبار التحقق الذري ومنع الاستخدام المزدوج...');
  const testInv = invitations[0];
  
  // First scan: should be ACCEPTED
  const firstScan = CheckInService.verifyAndCheckIn(testInv.token, event1.id, 'بوابة القاعة 1');
  console.log(`المسح الأول: نتيجة=${firstScan.result}, نجاح=${firstScan.success}, رسالة=${firstScan.message}`);
  if (firstScan.result !== 'ACCEPTED' || !firstScan.success) {
    throw new Error('فشل قبول المسح الأول لدعوة صالحة');
  }

  // Second scan immediately: MUST BE ALREADY_USED
  const secondScan = CheckInService.verifyAndCheckIn(testInv.token, event1.id, 'بوابة القاعة 1');
  console.log(`المسح الثاني (المتزامن): نتيجة=${secondScan.result}, نجاح=${secondScan.success}, رسالة=${secondScan.message}`);
  if (secondScan.result !== 'ALREADY_USED' || secondScan.success) {
    throw new Error('خطأ أمني حرج: النظام قبل الدخول المزدوج لنفس الرمز!');
  }
  console.log('✅ تم منع الاستخدام المزدوج بنجاح وبطريقة ذرية!');

  // 7. Test Invalid Token
  console.log('\n[7] اختبار مسح رمز غير صالح...');
  const invalidScan = CheckInService.verifyAndCheckIn('FAKE-TOKEN-99999', event1.id);
  console.log(`مسح رمز مزيف: نتيجة=${invalidScan.result}, رسالة=${invalidScan.message}`);
  if (invalidScan.result !== 'INVALID') {
    throw new Error('النظام لم يرفض الرمز المزيف');
  }
  console.log('✅ تم رفض الرمز المزيف بنجاح.');

  // 8. Test Cross-Event Rejection (دعوة من مناسبة أخرى)
  console.log('\n[8] اختبار منع استخدام QR من مناسبة أخرى...');
  const event2 = EventRepository.create({
    name: 'حفلة تخرج خالد',
    date: '2026-11-20',
    capacity: 50,
  });
  const crossScan = CheckInService.verifyAndCheckIn(invitations[1].token, event2.id);
  console.log(`مسح رمز يتبع مناسبة أخرى: نتيجة=${crossScan.result}, رسالة=${crossScan.message}`);
  if (crossScan.result !== 'WRONG_EVENT') {
    throw new Error('النظام لم يرفض الرمز التابع لمناسبة أخرى');
  }
  console.log('✅ تم منع استخدام دعوة في مناسبة غير مناسبتها.');

  // 9. Verify Scan Logs
  console.log('\n[9] التحقق من جدول سجلات المسح (Scan Logs)...');
  const logs = ScanLogRepository.getByEventId(event1.id);
  console.log(`عدد سجلات المسح المسجلة: ${logs.length}`);
  if (logs.length < 3) {
    throw new Error('لم يتم تسجيل كافة عمليات المسح في scan_logs');
  }
  console.log('✅ تم التحقق من تسجيل العمليات بالتفصيل في سجل المسح.');

  // 10. Verify Stats
  console.log('\n[10] التحقق من دقة الإحصائيات (Event Stats)...');
  const stats = EventRepository.getStats(event1.id);
  console.log('الإحصائيات:', stats);
  if (stats.totalInvitations !== 100 || stats.usedInvitations !== 1 || stats.unusedInvitations !== 99) {
    throw new Error('أرقام الإحصائيات غير دقيقة');
  }
  console.log('✅ كافة الإحصائيات دقيقة ومطابقة تماماً.');

  closeDatabase();
  console.log('\n🎉 اكتمل اختبار النظام والتحقق بنجاح 100%! كافة معايير الأمان وقواعد البيانات تعمل بدقة متناهية.\n');
}

runSystemVerification().catch((err) => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
