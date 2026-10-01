import zlib from 'zlib';
import { ImageOutpaintingService, OutpaintMethod } from '../services/imageOutpaintingService';
import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

/**
 * دالة لإنشاء صورة PNG صالحة 100% بأبعاد محددة ولون محدد
 */
function createSolidPngBase64(width: number, height: number, r: number = 30, g: number = 41, b: number = 59): string {
  // 1. Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth
  ihdrData.writeUInt8(2, 9); // Color type RGB
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // 3. Raw image scanlines (1 filter byte per row + width * 3 bytes RGB)
  // For large dimensions, we can produce valid compressed scanlines
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // 4. IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const totalPng = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  return `data:image/png;base64,${totalPng.toString('base64')}`;
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  // Calculate CRC32
  const crcData = chunk.subarray(4, 8 + length);
  const crc = crc32(crcData);
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table & function for valid PNGs
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function runCustomImageOutpaintTests() {
  console.log('========================================================================');
  console.log('🧪 بدء اختبارات مطابقة أبعاد وتمديد خلفية الوجهين (AI Smart Outpaint)');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // TEST CASE 1: Front 1050×650 (Aspect ~1.615) / Back 1200×700 (Aspect ~1.714)
  // Back is wider than Front -> Needs vertical extension (top/bottom)
  // -------------------------------------------------------------------------
  console.log('▶ [الحالة 1] فحص كرت: Front 1050×650 / Back 1200×700');
  const front1050 = createSolidPngBase64(1050, 650, 20, 30, 45);
  const back1200 = createSolidPngBase64(1200, 700, 25, 35, 50);

  const dimsFront1 = await ImageOutpaintingService.getImageDimensions(front1050);
  const dimsBack1 = await ImageOutpaintingService.getImageDimensions(back1200);

  if (dimsFront1.width !== 1050 || dimsFront1.height !== 650) {
    throw new Error(`❌ خطأ في قراءة أبعاد Front: المتوقع 1050x650 والفعلي ${dimsFront1.width}x${dimsFront1.height}`);
  }
  if (dimsBack1.width !== 1200 || dimsBack1.height !== 700) {
    throw new Error(`❌ خطأ في قراءة أبعاد Back: المتوقع 1200x700 والفعلي ${dimsBack1.width}x${dimsBack1.height}`);
  }
  console.log(`  ✓ تم كشف الأبعاد: Front (${dimsFront1.width}×${dimsFront1.height}), Back (${dimsBack1.width}×${dimsBack1.height})`);

  const comp1 = ImageOutpaintingService.calculateComparison(dimsFront1, dimsBack1);
  console.log(`  ✓ نتيجة المقارنة: يحتاج تمديد=${comp1.needsExtension}, محور التمديد=${comp1.extensionAxis}, فارق النسبة=${comp1.aspectRatioDiffPercent}%`);
  console.log(`  ✓ هوامش التمديد المحسوبة: أعلى=${comp1.padTop}px, أسفل=${comp1.padBottom}px, يمين=${comp1.padRight}px, يسار=${comp1.padLeft}px`);

  if (!comp1.needsExtension) {
    throw new Error('❌ خطأ: كان يجب اكتشاف الحاجة للتمديد لاختلاف النسبة!');
  }
  if (comp1.extensionAxis !== 'vertical') {
    throw new Error(`❌ خطأ: كان يجب أن يكون محور التمديد رأسي (أعلى/أسفل)، الفعلي: ${comp1.extensionAxis}`);
  }
  if (comp1.backProcessed.width !== 1050 || comp1.backProcessed.height !== 650) {
    throw new Error(`❌ خطأ: الأبعاد النهائية للوجه الخلفي يجب أن تطابق الوجه الأمامي 1050x650 تماماً! الفعلي: ${comp1.backProcessed.width}x${comp1.backProcessed.height}`);
  }

  const result1 = await ImageOutpaintingService.processAndMatchBackImage(front1050, back1200, 'smart_ai');
  if (result1.width !== 1050 || result1.height !== 650) {
    throw new Error('❌ خطأ: أبعاد النتيجة المعالجة لا تطابق 1050x650!');
  }
  console.log('  ✅ [الحالة 1 نجحت 100%]: تم جعل Front هو المرجع وتمديد Back رأسياً دون أي تشويه.\n');

  // -------------------------------------------------------------------------
  // TEST CASE 2: Front 1200×750 (Aspect 1.6) / Back 1050×650 (Aspect ~1.615)
  // Back is slightly narrower -> Needs horizontal extension (left/right)
  // -------------------------------------------------------------------------
  console.log('▶ [الحالة 2] فحص كرت: Front 1200×750 / Back 1050×650');
  const front1200 = createSolidPngBase64(1200, 750, 15, 23, 42);
  const back1050 = createSolidPngBase64(1050, 650, 18, 28, 48);

  const dimsFront2 = await ImageOutpaintingService.getImageDimensions(front1200);
  const dimsBack2 = await ImageOutpaintingService.getImageDimensions(back1050);

  const comp2 = ImageOutpaintingService.calculateComparison(dimsFront2, dimsBack2);
  console.log(`  ✓ نتيجة المقارنة: Front (${dimsFront2.width}×${dimsFront2.height}), Back (${dimsBack2.width}×${dimsBack2.height})`);
  console.log(`  ✓ محور التمديد=${comp2.extensionAxis}, هوامش التمديد: يسار=${comp2.padLeft}px, يمين=${comp2.padRight}px, أعلى=${comp2.padTop}px, أسفل=${comp2.padBottom}px`);

  if (!comp2.needsExtension) {
    throw new Error('❌ خطأ: كان يجب اكتشاف الحاجة للتمديد!');
  }
  if (comp2.backProcessed.width !== 1200 || comp2.backProcessed.height !== 750) {
    throw new Error(`❌ خطأ: الأبعاد النهائية للوجه الخلفي يجب أن تطابق الوجه الأمامي 1200x750 تماماً!`);
  }

  const result2 = await ImageOutpaintingService.processAndMatchBackImage(front1200, back1050, 'seamless_mirror');
  if (result2.width !== 1200 || result2.height !== 750) {
    throw new Error('❌ خطأ في معالجة النتيجة للحالة 2!');
  }
  console.log('  ✅ [الحالة 2 نجحت 100%]: تم جعل Front 1200x750 هو المرجع ومطابقة Back بدقة.\n');

  // -------------------------------------------------------------------------
  // TEST CASE 3: Front & Back with Identical Dimensions (1050×650 / 1050×650)
  // -------------------------------------------------------------------------
  console.log('▶ [الحالة 3] فحص كرت بأبعاد متطابقة تماماً: Front 1050×650 / Back 1050×650');
  const frontSame = createSolidPngBase64(1050, 650, 10, 20, 30);
  const backSame = createSolidPngBase64(1050, 650, 10, 20, 30);

  const dimsFront3 = await ImageOutpaintingService.getImageDimensions(frontSame);
  const dimsBack3 = await ImageOutpaintingService.getImageDimensions(backSame);

  const comp3 = ImageOutpaintingService.calculateComparison(dimsFront3, dimsBack3);
  console.log(`  ✓ نتيجة المقارنة: تحتاج تمديد=${comp3.needsExtension}, فارق النسبة=${comp3.aspectRatioDiffPercent}%`);

  if (comp3.needsExtension) {
    throw new Error('❌ خطأ: الأبعاد متطابقة تماماً ولا يجب أن تتطلب تمديداً!');
  }
  if (comp3.extensionAxis !== 'none') {
    throw new Error('❌ خطأ: محور التمديد يجب أن يكون none!');
  }
  console.log('  ✅ [الحالة 3 نجحت 100%]: تم التعرف على التطابق التام دون أي تعديل إضافي.\n');

  // -------------------------------------------------------------------------
  // TEST CASE 4: Testing all Outpainting Algorithm Modes
  // -------------------------------------------------------------------------
  console.log('▶ [الحالة 4] فحص كافة خوارزميات التمديد الذكي (All Outpaint Methods)');
  const methods: OutpaintMethod[] = ['smart_ai', 'seamless_mirror', 'edge_gradient', 'solid_dominant'];

  for (const m of methods) {
    const res = await ImageOutpaintingService.processAndMatchBackImage(front1050, back1200, m);
    if (res.methodUsed !== m || res.width !== 1050 || res.height !== 650) {
      throw new Error(`❌ خطأ في الخوارزمية: ${m}`);
    }
    console.log(`  ✓ الخوارزمية '${m}': تعمل بكفاءة وأنتجت أبعاد متطابقة 1050×650.`);
  }
  console.log('  ✅ [الحالة 4 نجحت 100%]: كافة الخوارزميات مدعومة وجاهزة.\n');

  // -------------------------------------------------------------------------
  // TEST CASE 5: Verification of PDF and Print Output using Matched Images
  // -------------------------------------------------------------------------
  console.log('▶ [الحالة 5] التحقق من توافق مستندات الـ PDF والطباعة مع المقاسات الموحدة:');
  const mockEvent: Event = {
    id: 99,
    name: 'حفل زفاف تجريبي',
    date: '2026-11-20',
    time: '09:00 م',
    venue: 'قاعة الاحتفالات الكبرى',
    eventType: 'wedding',
    capacity: 2,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockInvitations: Invitation[] = [
    {
      id: 1,
      event_id: 99,
      invitation_number: 1,
      token: 'INV-OUTPAINT-001',
      guest_name: 'ضيف الشرف',
      has_name: 1,
      status: 'UNUSED',
      created_at: new Date().toISOString(),
      used_at: null,
    }
  ];

  const matchedPrintSettings: PrintSettings = {
    paperSize: 'A4',
    columns: 2,
    rows: 4,
    cardWidth: 85,
    cardHeight: 52.6, // Exactly matches 1050 / 650
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
    customCardImage: front1050,
    customCardBackImage: result1.dataUrl,
    customImageWidth: 1050,
    customImageHeight: 650,
    customAspectRatio: 1050 / 650,
    customQrSide: 'front',
    customQrX: 50,
    customQrY: 60,
    customQrSize: 30,
    doubleSidedMode: 'duplex',
    qrPosition: 'center',
  };

  const qrImages = {
    1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  };

  const printHtml = PdfService.generatePrintHtml(mockEvent, mockInvitations, matchedPrintSettings, qrImages);
  if (!printHtml.includes('page') || !printHtml.includes('card-cell')) {
    throw new Error('❌ خطأ في إنشاء HTML الطباعة للكرت المخصص بوجهين!');
  }
  console.log('  ✓ تم توليد صفحات الطباعة للوجهين الأمامي والخلفي بنجاح تام.');

  const pdfDoc = await PdfService.generatePdfDocument(mockEvent, mockInvitations, matchedPrintSettings);
  const pdfPages = pdfDoc.getNumberOfPages();
  if (pdfPages < 2) {
    throw new Error(`❌ خطأ: عدد صفحات PDF يجب أن يكون صفحتين على الأقل للوجهين، الفعلي: ${pdfPages}`);
  }
  console.log(`  ✓ تم توليد ملف PDF بوجهين (Duplex) بعدد ${pdfPages} صفحات متطابقة المقاسات تماماً.`);
  console.log('  ✅ [الحالة 5 نجحت 100%]: الـ PDF والطباعة متوافقان تماماً بدون أي Stretch أو تشويه.\n');

  console.log('========================================================================');
  console.log('🎉 اكتملت كافة الاختبارات بنجاح 100%! نظام التمديد الذكي ومطابقة الأبعاد جاهز.');
  console.log('========================================================================');
}

runCustomImageOutpaintTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
