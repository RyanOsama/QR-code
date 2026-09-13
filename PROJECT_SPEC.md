# مشروع نظام إدارة دعوات المناسبات وتأكيد الدخول عبر QR Code
## Event Invitation & Entry Management Desktop System (Local-First Windows Desktop App)

---

## 1. الهدف الرئيسي والمواصفات الكاملة (Prompt & Specifications)

تطبيق Desktop محلي يعمل على Windows لإدارة مناسبات الأفراح والفعاليات باستخدام كروت دعوة تحمل رموز QR فريدة ومشفرة لمنع التزوير والاستخدام المتكرر.

### المبادئ الأساسية:
1. **Desktop محلي بالكامل (Local-First):** لا يحتاج إنترنت إطلاقاً، ولا خادم سحابي خارجي.
2. **قاعدة بيانات مدمجة:** SQLite مدمجة داخل مسار التطبيق مع دعم النسخ الاحتياطي والاستعادة.
3. **أمان الرموز (Tokens):**
   - لا يتم استخدام الرقم التسلسلي كقيمة QR.
   - يتم إنشاء Token عشوائي مشفر وغير قابل للتخمين (مثل: `INV-7F92A7XK29`).
   - ربط كل رمز بالمناسبة المحددة (`event_id`).
4. **العمليات الذرية (Atomic Check-in):**
   - التحقق وتغيير الحالة وتسجيل وقت الدخول داخل SQLite Transaction لمنع الاستخدام المزدوج والتزامن.
5. **الطباعة الجماعية والـ PDF:**
   - طباعة شبكة كروت على ورق A4 (مثلاً 12 كرت: 3 أعمدة × 4 صفوف).
   - علامات قص واضحة (Crop / Cutting Marks).
   - كروت بدون أسماء (افتراضي) أو بأسماء مخصصة اختيارية.
6. **مسح الكاميرا الفوري (Scanner):**
   - مسح فوري عبر كاميرا الجهاز.
   - رد فعل بصري وصوتي (أخضر/أحمر) وشاشة انتظار للمسح التالي.

---

## 2. هيكل البيانات (Database Schema)

### جدول المناسبات (`events`):
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `date` (TEXT NOT NULL)
- `capacity` (INTEGER NOT NULL)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)
- `status` (TEXT NOT NULL DEFAULT 'ACTIVE')

### جدول الدعوات (`invitations`):
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `event_id` (INTEGER NOT NULL, FK)
- `invitation_number` (INTEGER NOT NULL)
- `token` (TEXT NOT NULL UNIQUE)
- `guest_name` (TEXT)
- `has_name` (INTEGER NOT NULL DEFAULT 0)
- `status` (TEXT NOT NULL DEFAULT 'UNUSED') -- UNUSED, USED, CANCELLED
- `created_at` (TEXT NOT NULL)
- `used_at` (TEXT)

### جدول سجلات المسح (`scan_logs`):
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `invitation_id` (INTEGER, FK)
- `event_id` (INTEGER NOT NULL, FK)
- `scanned_at` (TEXT NOT NULL)
- `result` (TEXT NOT NULL) -- ACCEPTED, ALREADY_USED, INVALID, WRONG_EVENT
- `device_name` (TEXT)
- `notes` (TEXT)

---

## 3. مراحل وخطة التنفيذ المقسمة (Project Roadmap & Phases)

### 🔹 المرحلة 1: إعداد البيئة وهيكل المشروع (Scaffolding & Core Architecture)
- تجهيز Electron + Vite + React + TypeScript + TailwindCSS.
- ضبط مسارات الـ Main Process و Preload Script مع تفعيل `contextIsolation` وتعطيل `nodeIntegration`.
- تجهيز الاتصال الآمن بين Renderer و Main عبر Electron IPC Typesafe Handlers.

### 🔹 المرحلة 2: طبقة قاعدة البيانات (SQLite Layer & Migrations)
- تثبيت وإعداد `better-sqlite3` أو حل SQLite المتوافق مع Windows.
- كتابة الـ Migrations لإنشاء جداول `events`, `invitations`, `scan_logs` مع الفهارس والقيود.
- إنشاء `EventRepository`, `InvitationRepository`, `ScanLogRepository`.
- توفير آلية النسخ الاحتياطي (Backup) والاستعادة (Restore).

### 🔹 المرحلة 3: محرك الأمان والـ QR (Tokens & QR Generation)
- دالة توليد Tokens عشوائية قوية غير قابلة للتخمين مستندة إلى `crypto.randomBytes`.
- خدمة توليد رموز QR عالية الدقة (SVG / Canvas / PNG Base64).

### 🔹 المرحلة 4: محرك طباعة الكروت والـ PDF (Multi-Card A4 Layout & PDF Generator)
- محرك حساب أبعاد الشبكة لورق A4 و A5 (3x4 = 12 بطاقة أو مقاس مخصص).
- رسم بطاقات فاخرة بتصاميم تناسب حفلات الزواج والمناسبات مع علامات القص (Crop Marks).
- إنشاء ملفات PDF قابلة للتنزيل والطباعة الفورية مع دقة عالية لـ QR.

### 🔹 المرحلة 5: منطق التحقق الذري (Atomic Check-in Engine)
- دالة فحص وتأكيد الدخول عبر SQLite Immediate Transaction.
- فحص ملكية الـ QR للمناسبة المحددة.
- منع سيناريو الدخول المزدوج حتى في حال المسح السريع المتزامن.
- تسجيل كل محاولة في `scan_logs`.

### 🔹 المرحلة 6: واجهة المستخدم (Modern Arabic RTL UI)
- نظام ألوان ملكي فخم وعصري (Dark Luxury / Emerald & Gold) ملائم للمناسبات.
- **الشاشات:**
  1. **لوحة التحكم (Dashboard):** إحصائيات سريعة، نسب الحضور، آخر عمليات المسح، أزرار الإجراءات السريعة.
  2. **إدارة المناسبات (Events):** إنشاء مناسبة جديدة، اختيار المناسبة النشطة، تعديل السعة.
  3. **توليد وإدارة الدعوات (Invitations):** توليد جماعي، تخصيص الأسماء، فلاتر البحث، تفاصيل الدعوة.
  4. **شاشة الطباعة والـ PDF (Printing & Export):** معاينة حية لشبكة A4، ضبط الهوامش وعدد الصفوف/الأعمدة وعلامات القص، وتصدير PDF.
  5. **شاشة قارئ الـ QR (Live Camera Scanner):** قارئ الكاميرا مع مؤشرات نجاح/فشل ضخمة وواضحة لحراس البوابة مع أصوات تأكيد.
  6. **سجل المسح والتقارير (Scan Logs & Analytics):** جدول تفصيلي للمحاولات المقبولة والمرفوضة ووقت كل عملية.
  7. **النسخ الاحتياطي (Backup & Restore):** أخذ نسخة احتياطية فورية واستعادتها بأمان.

### 🔹 المرحلة 7: الاختبارات والتأكد من الجودة (Automated & Manual Verification)
- اختبارات توليد 100 دعوة فريدة بدون تكرار.
- اختبار العمليات المتزامنة (Race conditions) والتأكد من قبول عملية واحدة ورفض الثانية بـ ALREADY_USED.
- اختبار توافق PDF وقراءة رموز الـ QR فعلياً.
- تجربة التطبيق كاملاً على بيئة Windows.
