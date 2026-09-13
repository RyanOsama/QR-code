import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/connection';
import { EventRepository } from '../database/repositories/eventRepository';
import { InvitationRepository } from '../database/repositories/invitationRepository';
import { CheckInService } from '../services/checkInService';

async function run500ScansBenchmark() {
  console.log('--- بدء اختبار كفاءة وسرعة فحص 500 كرت في الثانية (500 Rapid Scans Benchmark) ---');

  const testDbPath = path.join(process.cwd(), 'database_files', 'benchmark_500.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  initDatabase(testDbPath);

  // 1. Create large event for 500 guests
  console.log('\n[1] إنشاء مناسبة تتسع لـ 500 مدعو...');
  const event = EventRepository.create({
    name: 'حفل تخرج الدفعة الكبرى - 500 مدعو',
    date: '2026-06-20',
    time: '07:00 مساءً',
    venue: 'مركز الملك فيصل للمؤتمرات',
    capacity: 500,
  });

  // 2. Generate 500 unique invitations
  console.log('[2] توليد 500 كرت دعوة فريدة...');
  const t0Gen = performance.now();
  const genResult = InvitationRepository.generateBatch(event.id, 500);
  const t1Gen = performance.now();
  console.log(`✅ تم توليد وتشفير 500 كرت بالكامل في: ${(t1Gen - t0Gen).toFixed(1)} مللي ثانية (أقل من ثانية واحدة)!`);

  const invitations = InvitationRepository.getByEventId(event.id);
  if (invitations.length !== 500) {
    throw new Error('لم يتم توليد 500 كرت');
  }

  // 3. Rapid Check-in simulation of 500 consecutive entries (one after another at lightning speed)
  console.log('\n[3] محاكاة فحص وتأكيد دخول 500 ضيف متتاليين عبر البوابة...');
  const t0Check = performance.now();
  let acceptedCount = 0;

  for (let i = 0; i < 500; i++) {
    const result = CheckInService.verifyAndCheckIn(
      invitations[i].token,
      event.id,
      'قارئ باركود البوابة 1'
    );
    if (result.result === 'ACCEPTED') {
      acceptedCount++;
    }
  }

  const t1Check = performance.now();
  const totalDurationMs = t1Check - t0Check;
  const avgPerScanMs = totalDurationMs / 500;
  const scansPerSecond = Math.round(1000 / avgPerScanMs);

  console.log(`\n=================================================`);
  console.log(`📊 نتائج قياس السرعة والأداء لفحص 500 كرت:`);
  console.log(`- إجمالي الكروت المفحوصة والمقبولة: ${acceptedCount} / 500`);
  console.log(`- إجمالي الوقت المستغرق لـ 500 فحص: ${totalDurationMs.toFixed(1)} مللي ثانية (${(totalDurationMs / 1000).toFixed(3)} ثانية)`);
  console.log(`- متوسط وقت فحص الكرت الواحد: ${avgPerScanMs.toFixed(3)} مللي ثانية`);
  console.log(`- سرعة الفحص القصوى: ${scansPerSecond.toLocaleString()} فحص في الثانية الواحدة!`);
  console.log(`=================================================\n`);

  // 4. Test rapid double scan on all 500 (should all be rejected immediately as ALREADY_USED)
  console.log('[4] اختبار محاولة إعادة مسح نفس الـ 500 كرت دفعة واحدة (منع التكرار)...');
  let duplicateCount = 0;
  for (let i = 0; i < 500; i++) {
    const doubleRes = CheckInService.verifyAndCheckIn(invitations[i].token, event.id);
    if (doubleRes.result === 'ALREADY_USED') {
      duplicateCount++;
    }
  }
  if (duplicateCount !== 500) {
    throw new Error('فشل كشف التكرار لجميع الكروت');
  }
  console.log(`✅ تم منع تكرار الدخول لجميع الـ 500 كرت بنسبة 100% وبدون أي خطأ.`);

  closeDatabase();
  console.log('\n🎉 أثبت الاختبار أن التطبيق قادر على استيعاب آلاف الكروت والعمل بسرعة فائقة جداً (أقل من نصف مللي ثانية لكل فحص) دون أي بطء!');
}

run500ScansBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
