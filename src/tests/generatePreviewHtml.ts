import fs from 'fs';
import { PdfService } from '../services/pdfService';
import { Event, Invitation, PrintSettings } from '../types';

const testEvent: Event = {
  id: 101,
  name: 'حفل زفاف أحمد وماريا',
  date: '2026-09-20',
  time: '08:00 مساءً',
  venue: 'قاعة الفخامة\nالمكلا - حضرموت',
  eventType: 'wedding',
  capacity: 100,
  status: 'ACTIVE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const testInvitations: Invitation[] = [
  {
    id: 1,
    event_id: 101,
    invitation_number: 102,
    token: 'TOKEN-WEDDING-102',
    guest_name: 'سالم أحمد',
    has_name: 1,
    status: 'UNUSED',
    used_at: null,
    created_at: new Date().toISOString(),
  },
];

// Valid 1x1 base64 transparent png or encoded black square SVG
const qrImages = {
  1: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="15" y="15" width="20" height="20" fill="white"/><rect x="18" y="18" width="14" height="14" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="65" y="15" width="20" height="20" fill="white"/><rect x="68" y="18" width="14" height="14" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="15" y="65" width="20" height="20" fill="white"/><rect x="18" y="68" width="14" height="14" fill="black"/><rect x="45" y="45" width="15" height="15" fill="black"/><rect x="50" y="70" width="10" height="10" fill="black"/><rect x="70" y="50" width="15" height="10" fill="black"/></svg>')
};

const settings: PrintSettings = {
  paperSize: 'A4',
  columns: 2,
  rows: 4,
  cardWidth: 85,
  cardHeight: 55,
  cardShape: 'rectangle',
  gapX: 4,
  gapY: 4,
  marginX: 10,
  marginY: 10,
  showEventName: false,
  showGuestName: true,
  showInvitationNumber: true,
  showCropMarks: false,
  showVenue: true,
  showTime: true,
  showDate: true,
  venueText: 'قاعة الفخامة\nالمكلا - حضرموت',
  timeText: '08:00 مساءً',
  dateText: '2026-09-20',
  welcomeText: 'دعوة لحضور حفل زفاف',
  customSubtitle: 'نتشرف بدعوتكم لحضور حفل زفافنا',
  groomName: 'أحمد',
  brideName: 'ماريا',
  weddingTitleType: 'couple_names',
  guestPrefixText: 'الأستاذ/',
  guestPrefixEnabled: true,
  monogramEnabled: true,
  monogramGroomInitial: 'A',
  monogramBrideInitial: 'M',
  showHeartIcon: true,
  showFooterDivider: true,
  footerDividerText: 'بحضوركم تكتمل فرحتنا',
  qrInstructionText: 'يرجى إبراز الكود للدخول',
  cardTheme: 'wedding_golden_floral',
  colorScheme: 'default',
  qrPosition: 'center',
  doubleSidedMode: 'duplex',
  printMode: 'cards',
  showBackEnglishNote: true,
  backEnglishNoteText: 'A Special Day\nA Lasting Memory',
  backTitleText: 'بارك الله لهما وبارك عليهما\nوجمع بينهما في خير',
  backHeaderText: 'شكراً لكم على تلبية الدعوة',
};

const html = PdfService.generatePrintHtml(testEvent, testInvitations, settings, qrImages);
fs.writeFileSync('preview_golden_floral.html', html, 'utf-8');
console.log('✅ Generated preview_golden_floral.html successfully! Size:', html.length);

// Extract cards from html to create a clean visual mockup
const cardCells = html.match(/<div class="card-cell">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g) || [];
console.log('Found card cells:', cardCells.length);

const showcaseHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>Golden Floral Mockup Showcase</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #EAE6DF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Amiri', 'Tajawal', serif;
      padding: 40px 20px;
    }
    .mockup-container {
      display: flex;
      flex-direction: column;
      gap: 30px;
      align-items: center;
      max-width: 900px;
    }
    .card-row {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-direction: row;
    }
    .card-wrapper {
      width: 580px;
      height: 375px;
      box-shadow: 0 15px 35px rgba(50, 40, 30, 0.18), 0 5px 15px rgba(0,0,0,0.08);
      border-radius: 8px;
      overflow: hidden;
      background: #FCFAF7;
      position: relative;
    }
    .card-wrapper .card-cell, .card-wrapper .royal-card {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 8px;
    }
    .badge-label {
      background: #5A4731;
      color: #FFF;
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="mockup-container">
    <div class="card-row">
      <div class="card-wrapper">
        ${cardCells[0] || ''}
      </div>
      <div class="badge-label">الوجه الأمامي</div>
    </div>
    <div class="card-row">
      <div class="card-wrapper">
        ${cardCells[1] || ''}
      </div>
      <div class="badge-label">الوجه الخلفي</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('preview_showcase.html', showcaseHtml, 'utf-8');
console.log('✅ Generated preview_showcase.html successfully!');

