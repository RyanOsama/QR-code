import { initDatabase } from '../database/connection';
import { UserRepository } from '../database/repositories/userRepository';
import { EventRepository } from '../database/repositories/eventRepository';
import { PasswordService } from '../services/passwordService';
import { PdfService } from '../services/pdfService';
import { Event, PrintSettings, Invitation } from '../types';

async function runTests() {
  console.log('--- بدء اختبار نظام إيقاف الشركة ومحاكاة الملصقات وتعديل المناسبات ---');
  const db = initDatabase(':memory:');

  // 1. إنشاء شركة
  const compResult = db.prepare(`INSERT INTO companies (name, status, created_at) VALUES ('شركة تجريبية', 'ACTIVE', datetime('now'))`).run();
  const companyId = compResult.lastInsertRowid as number;

  // 2. إنشاء مستخدم مالك شركة وموظف وسوبر أدمن
  const hash = PasswordService.hash('password123');
  db.prepare(`
    INSERT INTO app_users (company_id, username, password_hash, full_name, role, must_change_password, created_at)
    VALUES (NULL, 'superadmin', ?, 'مدير النظام العام', 'SUPER_ADMIN', 0, datetime('now'))
  `).run(hash);

  db.prepare(`
    INSERT INTO app_users (company_id, username, password_hash, full_name, role, must_change_password, created_at)
    VALUES (?, 'company_owner', ?, 'مالك الشركة', 'COMPANY_OWNER', 0, datetime('now'))
  `).run(companyId, hash);

  db.prepare(`
    INSERT INTO app_users (company_id, username, password_hash, full_name, role, must_change_password, created_at)
    VALUES (?, 'employee_user', ?, 'موظف الاستقبال', 'EMPLOYEE', 0, datetime('now'))
  `).run(companyId, hash);

  // اختبار تسجيل الدخول عندما تكون الشركة نشطة
  let loginRes = UserRepository.login('company_owner', 'password123');
  if (!loginRes.success) throw new Error('فشل تسجيل الدخول للشركة النشطة');
  console.log('✅ تسجيل الدخول ناجح عندما تكون الشركة ACTIVE');

  // إيقاف الشركة من السوبر أدمن (status = SUSPENDED)
  db.prepare(`UPDATE companies SET status = 'SUSPENDED' WHERE id = ?`).run(companyId);
  console.log('⛔ تم تحويل حالة الشركة إلى SUSPENDED');

  // محاولة تسجيل دخول المالك
  const ownerBlocked = UserRepository.login('company_owner', 'password123');
  if (ownerBlocked.success) throw new Error('فشل الحظر: مالك الشركة تمكن من الدخول رغم إيقاف الشركة!');
  if (ownerBlocked.error !== 'يرجى التواصل مع الإدارة') {
    throw new Error(`الرسالة غير مطابقة! المتوقع: "يرجى التواصل مع الإدارة", المحصل: "${ownerBlocked.error}"`);
  }
  console.log('✅ تم منع تسجيل دخول مالك الشركة الموقوفة مع إرجاع التنبيه: ' + ownerBlocked.error);

  const employeeBlocked = UserRepository.login('employee_user', 'password123');
  if (employeeBlocked.success) throw new Error('فشل الحظر: الموظف تمكن من الدخول رغم إيقاف الشركة!');
  if (employeeBlocked.error !== 'يرجى التواصل مع الإدارة') {
    throw new Error(`الرسالة غير مطابقة! المتوقع: "يرجى التواصل مع الإدارة", المحصل: "${employeeBlocked.error}"`);
  }
  console.log(`✅ تم حجب الموظف بنجاح بالرسالة المطلوبة: "${employeeBlocked.error}"`);

  // التأكد أن السوبر أدمن لا يتأثر
  const superAdminLogin = UserRepository.login('superadmin', 'password123');
  if (!superAdminLogin.success) throw new Error('السوبر أدمن يجب ألا يتأثر بإيقاف الشركات');
  console.log('✅ السوبر أدمن يسجل دخوله بصورة طبيعية دون تأثر.');

  // 3. اختبار تعديل اسم وبيانات المناسبة
  const createdEvent = EventRepository.create({
    company_id: companyId,
    name: 'حفل زفاف أحمد القديم',
    date: '2026-10-01',
    time: '08:00 مساءً',
    venue: 'قاعة الروابي',
    eventType: 'wedding',
    capacity: 100,
  });

  const updatedEvent = EventRepository.update(createdEvent.id, {
    name: 'حفل زفاف أحمد وسارة الملكي',
    venue: 'فندق الريتز كارلتون',
    capacity: 150,
  });

  if (!updatedEvent || updatedEvent.name !== 'حفل زفاف أحمد وسارة الملكي' || updatedEvent.capacity !== 150) {
    throw new Error('فشل تحديث بيانات المناسبة');
  }
  console.log('✅ تم تعديل اسم وبيانات المناسبة بنجاح:', updatedEvent.name, `(السعة: ${updatedEvent.capacity})`);

  // 4. اختبار توليد ملصقات الباركود A4 بالمقاسات 30 و 40
  const sampleEvent: Event = {
    id: 1,
    name: 'حفل زفاف أحمد وسارة الملكي',
    date: '2026-10-01',
    capacity: 60,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleInvitations: Invitation[] = Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    event_id: 1,
    invitation_number: i + 1,
    token: `INV-${i + 1}`,
    guest_name: i % 2 === 0 ? `ضيف رقم ${i + 1}` : null,
    has_name: i % 2 === 0 ? 1 : 0,
    status: 'UNUSED',
    created_at: new Date().toISOString(),
    used_at: null,
  }));

  const sampleQrImages: Record<number, string> = {};
  sampleInvitations.forEach(inv => {
    sampleQrImages[inv.id] = 'data:image/png;base64,sampleQrBase64';
  });

  // تجربة مقاس 30 ملصق في الصفحة
  const settings30: PrintSettings = {
    paperSize: 'A4',
    columns: 3,
    rows: 10,
    cardWidth: 70,
    cardHeight: 29.7,
    gapX: 2,
    gapY: 2,
    marginX: 6,
    marginY: 6,
    showEventName: false,
    showGuestName: false,
    showInvitationNumber: true,
    showCropMarks: false,
    showVenue: false,
    showTime: false,
    showDate: false,
    welcomeText: '',
    cardTheme: 'wedding',
    qrPosition: 'center',
    printMode: 'pure_qr_stickers',
    stickerPreset: '30',
    stickerShowNumber: true,
    stickerShowCutMarks: true,
  };

  const html30 = PdfService.generateStickersPrintHtml(sampleEvent, sampleInvitations, settings30, sampleQrImages);
  if (!html30.includes('grid-template-columns: repeat(3, minmax(0, 1fr))') || !html30.includes('grid-template-rows: repeat(10, minmax(0, 1fr))')) {
    throw new Error('توليد شبكة 30 ملصق (3×10) غير صحيح');
  }
  console.log('✅ تم توليد ملصقات 30 بالصفحة (3×10) بدقة تامة وبدون تشويه.');

  // تجربة مقاس 40 ملصق في الصفحة
  const settings40: PrintSettings = {
    ...settings30,
    stickerPreset: '40',
  };
  const html40 = PdfService.generateStickersPrintHtml(sampleEvent, sampleInvitations, settings40, sampleQrImages);
  if (!html40.includes('grid-template-columns: repeat(4, minmax(0, 1fr))') || !html40.includes('grid-template-rows: repeat(10, minmax(0, 1fr))')) {
    throw new Error('توليد شبكة 40 ملصق (4×10) غير صحيح');
  }
  // 5. اختبار الطباعة المرنة (كروت عامة + كروت بأسماء المدعوين)
  const mixedInvitations: Invitation[] = [
    { id: 1, event_id: 1, invitation_number: 1, token: 'INV-001', guest_name: null, has_name: 0, status: 'UNUSED', created_at: new Date().toISOString(), used_at: null },
    { id: 2, event_id: 1, invitation_number: 2, token: 'INV-002', guest_name: 'محمد احمد', has_name: 1, status: 'UNUSED', created_at: new Date().toISOString(), used_at: null },
    { id: 3, event_id: 1, invitation_number: 3, token: 'INV-003', guest_name: 'خالد سالم', has_name: 1, status: 'UNUSED', created_at: new Date().toISOString(), used_at: null },
    { id: 4, event_id: 1, invitation_number: 4, token: 'INV-004', guest_name: 'سالم احمد', has_name: 1, status: 'UNUSED', created_at: new Date().toISOString(), used_at: null },
  ];
  const mixedQrImages: Record<number, string> = {
    1: 'data:image/png;base64,qr1',
    2: 'data:image/png;base64,qr2',
    3: 'data:image/png;base64,qr3',
    4: 'data:image/png;base64,qr4',
  };
  const weddingSettings: PrintSettings = {
    ...settings30,
    printMode: 'cards',
    cardTheme: 'wedding',
    columns: 2,
    rows: 2,
  };

  const mixedHtml = PdfService.generatePrintHtml(sampleEvent, mixedInvitations, weddingSettings, mixedQrImages);
  
  // التحقق من طباعة اسم المدعو الأول
  if (!mixedHtml.includes('محمد احمد') || !mixedHtml.includes('تتشرف الأسرة الكريمة بدعوة المكرم/ـة:')) {
    throw new Error('فشل طباعة اسم المدعو المخصص "محمد احمد" على كرته!');
  }
  // التحقق من طباعة اسم المدعو الثاني والثالث
  if (!mixedHtml.includes('خالد سالم') || !mixedHtml.includes('سالم احمد')) {
    throw new Error('فشل طباعة كروت المدعوين "خالد سالم" أو "سالم احمد"!');
  }
  // التحقق من طباعة الدعوة العامة للكرت الذي ليس له اسم
  if (!mixedHtml.includes('يسرنا ويشرفنا دعوتكم لحضور')) {
    throw new Error('فشل طباعة عبارة الدعوة العامة للكرت بدون اسم!');
  }
  console.log('✅ تم التحقق من مرونة الطباعة: الكروت المخصصة يُطبع عليها اسم المدعو، والكروت العامة تُطبع كدعوة عامة ترحيبية بنجاح!');

  console.log('\n🎉 كافة الاختبارات نجحت بنسبة 100%!');
}

runTests().catch(err => {
  console.error('❌ خطأ في الاختبار:', err);
  process.exit(1);
});
