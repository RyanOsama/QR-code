import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { Event, Invitation, PrintSettings, CardTemplateType } from '../types';
import { QrService } from './qrService';

function hexToRgb(hex?: string): [number, number, number] | null {
  if (!hex) return null;
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

export function getColorPaletteCss(settings: PrintSettings) {
  const scheme = settings.colorScheme || 'default';
  switch (scheme) {
    case 'black_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#18181b',
        cornerBorder: '#71717a',
        cornerIcon: '#a1a1aa',
        frameBorderOuter: 'rgba(24, 24, 27, 0.85)',
        frameBorderInner: 'rgba(113, 113, 122, 0.55)',
        headerText: '#09090b',
        badgeBg: '#f4f4f5',
        badgeBorder: '#18181b',
        badgeText: '#09090b',
        accentText: '#18181b',
        qrBorder: '#18181b',
        qrBoxBg: '#ffffff',
        subText: '#52525b',
        divider: '#e4e4e7',
      };
    case 'blue_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#1e3a8a',
        cornerBorder: '#38bdf8',
        cornerIcon: '#7dd3fc',
        frameBorderOuter: 'rgba(30, 58, 138, 0.85)',
        frameBorderInner: 'rgba(56, 189, 248, 0.55)',
        headerText: '#1e40af',
        badgeBg: '#eff6ff',
        badgeBorder: '#2563eb',
        badgeText: '#1e3a8a',
        accentText: '#1d4ed8',
        qrBorder: '#2563eb',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#bfdbfe',
      };
    case 'emerald_white':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#064e3b',
        cornerBorder: '#34d399',
        cornerIcon: '#6ee7b7',
        frameBorderOuter: 'rgba(5, 150, 105, 0.85)',
        frameBorderInner: 'rgba(16, 185, 129, 0.55)',
        headerText: '#065f46',
        badgeBg: '#ecfdf5',
        badgeBorder: '#059669',
        badgeText: '#064e3b',
        accentText: '#047857',
        qrBorder: '#059669',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#a7f3d0',
      };
    case 'burgundy':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#881337',
        cornerBorder: '#fb7185',
        cornerIcon: '#fda4af',
        frameBorderOuter: 'rgba(190, 18, 60, 0.85)',
        frameBorderInner: 'rgba(244, 63, 94, 0.55)',
        headerText: '#9f1239',
        badgeBg: '#fff1f2',
        badgeBorder: '#e11d48',
        badgeText: '#881337',
        accentText: '#be123c',
        qrBorder: '#e11d48',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#fecdd3',
      };
    case 'violet':
      return {
        cardBg: '#FFFFFF',
        cornerBg: '#581c87',
        cornerBorder: '#c084fc',
        cornerIcon: '#d8b4fe',
        frameBorderOuter: 'rgba(126, 34, 206, 0.85)',
        frameBorderInner: 'rgba(168, 85, 247, 0.55)',
        headerText: '#6b21a8',
        badgeBg: '#faf5ff',
        badgeBorder: '#9333ea',
        badgeText: '#581c87',
        accentText: '#7e22ce',
        qrBorder: '#9333ea',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#e9d5ff',
      };
    case 'custom':
      const pri = settings.customPrimaryColor || '#0f172a';
      const acc = settings.customAccentColor || '#b4821e';
      return {
        cardBg: '#FFFFFF',
        cornerBg: pri,
        cornerBorder: acc,
        cornerIcon: acc,
        frameBorderOuter: pri,
        frameBorderInner: acc,
        headerText: pri,
        badgeBg: '#f8fafc',
        badgeBorder: acc,
        badgeText: pri,
        accentText: pri,
        qrBorder: acc,
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: '#cbd5e1',
      };
    case 'default':
    default:
      return {
        cardBg: '#FCF9F2',
        cornerBg: '#081329',
        cornerBorder: '#fbbf24',
        cornerIcon: '#fde68a',
        frameBorderOuter: 'rgba(245, 158, 11, 0.75)',
        frameBorderInner: 'rgba(251, 191, 36, 0.45)',
        headerText: '#92400e',
        badgeBg: '#fffbeb',
        badgeBorder: '#f59e0b',
        badgeText: '#0f172a',
        accentText: '#78350f',
        qrBorder: '#f59e0b',
        qrBoxBg: '#ffffff',
        subText: '#475569',
        divider: 'rgba(254, 215, 170, 0.8)',
      };
  }
}

export class PdfService {
  private static getThemeColors(settings: PrintSettings) {
    const scheme = settings.colorScheme || 'default';
    const theme = settings.cardTheme || 'royal_graduation';

    // 1. If user selected an explicit color scheme
    if (scheme === 'black_white') {
      return {
        primary: [15, 23, 42], // Deep Charcoal / Black
        accent: [30, 41, 59], // Dark Slate
        cardBg: [255, 255, 255], // Pure White
        innerFrame: [71, 85, 105], // Slate Silver
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }
    if (scheme === 'blue_white') {
      return {
        primary: [30, 58, 138], // Royal Blue
        accent: [2, 132, 199], // Sky Azure
        cardBg: [255, 255, 255], // Pure White
        innerFrame: [59, 130, 246], // Bright Blue
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }
    if (scheme === 'emerald_white') {
      return {
        primary: [6, 78, 59], // Deep Emerald
        accent: [16, 185, 129], // Emerald
        cardBg: [255, 255, 255],
        innerFrame: [16, 185, 129],
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }
    if (scheme === 'burgundy') {
      return {
        primary: [136, 19, 55], // Burgundy Rose
        accent: [225, 29, 72], // Rose
        cardBg: [255, 255, 255],
        innerFrame: [244, 63, 94],
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }
    if (scheme === 'violet') {
      return {
        primary: [88, 28, 135], // Royal Violet
        accent: [124, 58, 237],
        cardBg: [255, 255, 255],
        innerFrame: [168, 85, 247],
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }
    if (scheme === 'custom') {
      const p = hexToRgb(settings.customPrimaryColor) || [15, 23, 42];
      const a = hexToRgb(settings.customAccentColor) || [180, 130, 30];
      const bg = hexToRgb(settings.customBgColor) || [255, 255, 255];
      return {
        primary: p,
        accent: a,
        cardBg: bg,
        innerFrame: a,
        defaultWelcome: 'حَفْلُ تَخَرُّج',
        defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
      };
    }

    // 2. Default color palettes by template
    switch (theme) {
      case 'royal_graduation':
        return {
          primary: [15, 23, 42], // Royal Navy
          accent: [180, 130, 30], // Rich Gold
          cardBg: [253, 250, 243], // Luxury Ivory
          innerFrame: [212, 160, 50], // Gold Frame
          defaultWelcome: 'حَفْلُ تَخَرُّج',
          defaultSubtitle: 'تتشرف أسرة الخريج بدعوتكم لمشاركتنا فرحة التخرج',
        };
      case 'graduation':
        return {
          primary: [15, 23, 42], // Deep Navy
          accent: [180, 130, 30], // Rich Gold
          cardBg: [255, 255, 255],
          innerFrame: [210, 170, 70],
          defaultWelcome: 'أهلاً بكم في حفل تخرج',
          defaultSubtitle: 'بكم تكتمل الفرحة .. وحضوركم يشرّفنا',
        };
      case 'wedding':
        return {
          primary: [115, 65, 10], // Royal Amber
          accent: [215, 160, 35], // Wedding Gold
          cardBg: [255, 255, 255],
          innerFrame: [230, 190, 80],
          defaultWelcome: 'دعوة لحضور حفل زفاف',
          defaultSubtitle: 'بكم تكتمل الأفراح ونسعد بحضوركم الكريم',
        };
      case 'dinner':
        return {
          primary: [6, 78, 59], // Deep Emerald
          accent: [16, 185, 129],
          cardBg: [255, 255, 255],
          innerFrame: [200, 170, 90],
          defaultWelcome: 'دعوة لتناول طعام العشاء',
          defaultSubtitle: 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة',
        };
      case 'celebration':
        return {
          primary: [88, 28, 135], // Royal Purple
          accent: [234, 179, 8],
          cardBg: [255, 255, 255],
          innerFrame: [210, 150, 230],
          defaultWelcome: 'أهلاً بكم في احتفالنا',
          defaultSubtitle: 'سعداء بحضوركم ومشاركتكم فرحتنا',
        };
      case 'custom':
      case 'minimal':
      default:
        return {
          primary: [30, 41, 59],
          accent: [71, 85, 105],
          cardBg: [255, 255, 255],
          innerFrame: [203, 213, 225],
          defaultWelcome: 'مرحبًا بكم',
          defaultSubtitle: 'نرحب بحضوركم الكريم',
        };
    }
  }

  /**
   * Generates a PDF document with multiple cards per page (A4/A5 grid)
   */
  static async generatePdfDocument(
    event: Event,
    invitations: Invitation[],
    settings: PrintSettings
  ): Promise<jsPDF> {
    const isA5 = settings.paperSize === 'A5';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isA5 ? 'a5' : 'a4',
    });

    const pageWidth = isA5 ? 148 : 210;
    const pageHeight = isA5 ? 210 : 297;

    const cols = Math.max(1, settings.columns || 3);
    const rows = Math.max(1, settings.rows || 4);
    const cardsPerPage = cols * rows;

    const marginX = settings.marginX !== undefined ? settings.marginX : 10;
    const marginY = settings.marginY !== undefined ? settings.marginY : 10;
    const gapX = settings.gapX !== undefined ? settings.gapX : 3;
    const gapY = settings.gapY !== undefined ? settings.gapY : 3;

    // Calculate card width and height to fit margins and gaps
    const availableW = pageWidth - marginX * 2 - (cols - 1) * gapX;
    const availableH = pageHeight - marginY * 2 - (rows - 1) * gapY;
    const cardW = settings.cardWidth > 0 ? settings.cardWidth : availableW / cols;
    const cardH = settings.cardHeight > 0 ? settings.cardHeight : availableH / rows;
    const themeColors = this.getThemeColors(settings);

    // Pre-generate QR data URLs for all invitations
    const qrImages: Record<number, string> = {};
    for (const inv of invitations) {
      qrImages[inv.id] = await QrService.generateDataUrl(inv.token, 400);
    }

    const totalPages = Math.ceil(invitations.length / cardsPerPage) || 1;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        doc.addPage(isA5 ? 'a5' : 'a4', 'portrait');
      }

      const pageInvitations = invitations.slice(
        pageIdx * cardsPerPage,
        (pageIdx + 1) * cardsPerPage
      );

      // Draw each card in grid
      for (let i = 0; i < pageInvitations.length; i++) {
        const inv = pageInvitations[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);

        // Draw Crop / Cutting marks if enabled
        if (settings.showCropMarks) {
          doc.setDrawColor(160, 160, 160);
          doc.setLineWidth(0.2);
          const markLen = 2.5;

          doc.line(x - 1, y, x - 1 - markLen, y);
          doc.line(x, y - 1, x, y - 1 - markLen);
          doc.line(x + cardW + 1, y, x + cardW + 1 + markLen, y);
          doc.line(x + cardW, y - 1, x + cardW, y - 1 - markLen);
          doc.line(x - 1, y + cardH, x - 1 - markLen, y + cardH);
          doc.line(x, y + cardH + 1, x, y + cardH + 1 + markLen);
          doc.line(x + cardW + 1, y + cardH, x + cardW + 1 + markLen, y + cardH);
          doc.line(x + cardW, y + cardH + 1, x + cardW, y + cardH + 1 + markLen);
        }

        // ========================================================
        // CASE A: CUSTOM USER UPLOADED DESIGN
        // ========================================================
        if (settings.cardTheme === 'custom' && settings.customCardImage) {
          // Draw custom background image
          try {
            doc.addImage(settings.customCardImage, 'JPEG', x, y, cardW, cardH);
          } catch (_) {
            try {
              doc.addImage(settings.customCardImage, 'PNG', x, y, cardW, cardH);
            } catch (err) {
              console.warn('Could not render custom image', err);
            }
          }

          // Calculate custom QR position
          const qrPercent = settings.customQrSize || 32;
          const qrSize = Math.max(14, (qrPercent / 100) * Math.min(cardW, cardH));
          const posX = settings.customQrX !== undefined ? settings.customQrX : 50;
          const posY = settings.customQrY !== undefined ? settings.customQrY : 65;

          const qrX = x + (posX / 100) * (cardW - qrSize);
          const qrY = y + (posY / 100) * (cardH - qrSize);

          // White protective backing behind QR
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 0.5, 0.5, 'F');

          const qrDataUrl = qrImages[inv.id];
          if (qrDataUrl) {
            doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          }

          if (settings.showInvitationNumber) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(30, 41, 59);
            doc.text(`#${String(inv.invitation_number).padStart(3, '0')}`, qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
          }

          continue; // Card finished!
        }

        // ========================================================
        // CASE B: PRESET THEMES (Graduation, Royal, Wedding, Dinner, Celebration)
        // ========================================================

        // Fill card background if not pure white
        if (themeColors.cardBg) {
          doc.setFillColor(themeColors.cardBg[0], themeColors.cardBg[1], themeColors.cardBg[2]);
          doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
        }

        // 1. Draw Card Outer Border
        doc.setDrawColor(210, 215, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S');

        // 2. Inner Decorative Golden Frame
        doc.setDrawColor(themeColors.innerFrame[0], themeColors.innerFrame[1], themeColors.innerFrame[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(x + 1.5, y + 1.5, cardW - 3, cardH - 3, 1.2, 1.2, 'S');

        // Decorative corner accents
        doc.setDrawColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
        doc.setLineWidth(0.8);
        doc.line(x + 2, y + 2, x + 6, y + 2);
        doc.line(x + 2, y + 2, x + 2, y + 6);
        doc.line(x + cardW - 2, y + 2, x + cardW - 6, y + 2);
        doc.line(x + cardW - 2, y + 2, x + cardW - 2, y + 6);

        // Header Welcome Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
        const welcome = settings.welcomeText || themeColors.defaultWelcome;
        doc.text(welcome, x + cardW / 2, y + 5.5, { align: 'center' });

        let currentY = y + 8.5;

        // Event Name
        if (settings.showEventName && event.name) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(themeColors.accent[0], themeColors.accent[1], themeColors.accent[2]);
          doc.text(event.name, x + cardW / 2, currentY, { align: 'center' });
          currentY += 4;
        }

        // Subtitle
        if (settings.customSubtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(settings.customSubtitle, x + cardW / 2, currentY, { align: 'center' });
          currentY += 3.5;
        }

        // Graduate Name or Guest Name (No dummy name!)
        const gradName = inv.graduate_name && inv.graduate_name.trim();
        const guestName = inv.guest_name && inv.guest_name.trim();

        if (gradName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(themeColors.accent[0], themeColors.accent[1], themeColors.accent[2]);
          doc.text(`احتفالاً بتخرج: ${gradName}`, x + cardW / 2, currentY, { align: 'center' });
          currentY += 4;
        } else if (settings.showGuestName && guestName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(guestName, x + cardW / 2, currentY, { align: 'center' });
          currentY += 4;
        }

        // QR Code Size & Positioning
        const bottomReserved = (settings.showVenue || settings.showDate || settings.showTime || settings.showInvitationNumber) ? 12 : 4;
        const availableQrH = Math.max(18, cardH - (currentY - y) - bottomReserved);
        const qrSize = Math.min(cardW - 14, availableQrH, 32);

        let qrX = x + (cardW - qrSize) / 2;
        if (settings.qrPosition === 'left') {
          qrX = x + 3.5;
        } else if (settings.qrPosition === 'right') {
          qrX = x + cardW - qrSize - 3.5;
        }

        const qrY = currentY + 0.5;

        // Decorative QR Border
        doc.setDrawColor(themeColors.innerFrame[0], themeColors.innerFrame[1], themeColors.innerFrame[2]);
        doc.setLineWidth(0.3);
        doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 'S');

        const qrDataUrl = qrImages[inv.id];
        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        }

        // Details at bottom: Venue, Date, Time
        let detailsY = y + cardH - 6.5;

        const eventVenue = settings.venueText || event.venue;
        const eventDate = settings.dateText || event.date;
        const eventTime = settings.timeText || event.time;

        if (settings.showVenue && eventVenue) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(71, 85, 105);
          doc.text(eventVenue, x + cardW / 2, detailsY, { align: 'center' });
          detailsY += 2.8;
        }

        const dateAndTimeParts: string[] = [];
        if (settings.showDate && eventDate) dateAndTimeParts.push(eventDate);
        if (settings.showTime && eventTime) dateAndTimeParts.push(eventTime);

        if (dateAndTimeParts.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(100, 116, 139);
          doc.text(dateAndTimeParts.join(' - '), x + cardW / 2, detailsY, { align: 'center' });
        }

        if (settings.showInvitationNumber) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
          const numStr = `Inv #${String(inv.invitation_number).padStart(3, '0')}`;
          doc.text(numStr, x + cardW / 2, y + cardH - 1.8, { align: 'center' });
        }
      }
    }

    return doc;
  }

  /**
   * Generates PDF and prompts user with a Save Dialog
   */
  /**
   * Generates the pixel-perfect HTML document matching the React preview 100%
   */
  static generatePrintHtml(
    event: Event,
    invitations: Invitation[],
    settings: PrintSettings,
    qrImages: Record<number, string>
  ): string {
    const isA5 = settings.paperSize === 'A5';
    const cols = Math.max(1, settings.columns || 3);
    const rows = Math.max(1, settings.rows || 4);
    const cardsPerPage = cols * rows;
    const totalPages = Math.ceil(invitations.length / cardsPerPage) || 1;

    const marginX = settings.marginX !== undefined ? settings.marginX : 10;
    const marginY = settings.marginY !== undefined ? settings.marginY : 10;
    const gapX = settings.gapX !== undefined ? settings.gapX : 3;
    const gapY = settings.gapY !== undefined ? settings.gapY : 3;

    const singleGradName = !settings.isGeneralInvitation && invitations.length > 0 && invitations.every((i) => i.graduate_name && i.graduate_name.trim() === invitations[0].graduate_name?.trim())
      ? invitations[0].graduate_name?.trim()
      : null;

    const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeGradName = singleGradName ? singleGradName.replace(/[\\/:*?"<>|]/g, '_').trim() : '';
    const printJobTitle = singleGradName ? `${safeEventName} - ${safeGradName}` : `${safeEventName} - عامة`;

    const palette = getColorPaletteCss(settings);

    // SVGs for crisp offline rendering
    const sparklesSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`;
    const capSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
    const pinSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
    const heartSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

    // Compact mode sizing if 4 or more rows
    const isDense = rows >= 4;
    const qrSizePx = isDense ? 52 : rows === 3 ? 72 : 95;
    const welcomeFontPt = isDense ? 9.5 : rows === 3 ? 12 : 15;
    const badgeFontPt = isDense ? 9 : rows === 3 ? 11.5 : 14;

    let pagesHtml = '';

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageInvitations = invitations.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

      let cardsHtml = '';
      for (let i = 0; i < pageInvitations.length; i++) {
        const inv = pageInvitations[i];
        const qrDataUrl = qrImages[inv.id] || '';
        const gradName = !settings.isGeneralInvitation && inv.graduate_name ? inv.graduate_name.trim() : null;
        const guestName = inv.guest_name && inv.guest_name.trim();
        const venueText = settings.venueText || event.venue || '';
        const dateText = settings.dateText || event.date || '';
        const timeText = settings.timeText || event.time || '';

        // Crop marks
        const cropMarksHtml = settings.showCropMarks ? `
          <div style="position:absolute; top:0; left:0; width:5px; height:5px; border-top:1px solid #94a3b8; border-left:1px solid #94a3b8; z-index:30;"></div>
          <div style="position:absolute; top:0; right:0; width:5px; height:5px; border-top:1px solid #94a3b8; border-right:1px solid #94a3b8; z-index:30;"></div>
          <div style="position:absolute; bottom:0; left:0; width:5px; height:5px; border-bottom:1px solid #94a3b8; border-left:1px solid #94a3b8; z-index:30;"></div>
          <div style="position:absolute; bottom:0; right:0; width:5px; height:5px; border-bottom:1px solid #94a3b8; border-right:1px solid #94a3b8; z-index:30;"></div>
        ` : '';

        // Case 1: Custom Uploaded Image
        if (settings.cardTheme === 'custom' && settings.customCardImage) {
          const qrX = settings.customQrX ?? 50;
          const qrY = settings.customQrY ?? 65;
          const qrSize = (settings.customQrSize ?? 30) * 1.5;

          cardsHtml += `
            <div class="card-cell">
              ${cropMarksHtml}
              <div style="position:relative; width:100%; height:100%; overflow:hidden; border-radius:8px;">
                <img src="${settings.customCardImage}" style="width:100%; height:100%; object-fit:cover; display:block;" />
                <div style="position:absolute; left:${qrX}%; top:${qrY}%; transform:translate(-50%, -50%); padding:3px; background:#fff; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                  <img src="${qrDataUrl}" style="width:${qrSize}px; height:${qrSize}px; object-fit:contain; display:block;" />
                  ${settings.showInvitationNumber ? `<div style="font-size:7pt; font-family:monospace; font-weight:bold; text-align:center; color:#1e293b; margin-top:2px;">#${String(inv.invitation_number).padStart(3, '0')}</div>` : ''}
                </div>
              </div>
            </div>
          `;
          continue;
        }

        // Case 2: Royal Graduation Luxury Card (Default)
        if (settings.cardTheme === 'royal_graduation' || !settings.cardTheme) {
          cardsHtml += `
            <div class="card-cell">
              ${cropMarksHtml}
              <div class="royal-card" style="background-color: ${palette.cardBg};">
                
                <!-- Corner Filigrees -->
                <div class="corner-filigree-tl" style="background-color: ${palette.cornerBg}; border-color: ${palette.cornerBorder};">
                  <span style="color: ${palette.cornerIcon};">${sparklesSvg}</span>
                </div>
                <div class="corner-filigree-br" style="background-color: ${palette.cornerBg}; border-color: ${palette.cornerBorder};">
                  <span style="color: ${palette.cornerIcon};">${sparklesSvg}</span>
                </div>

                <!-- Double Border -->
                <div class="frame-outer" style="border-color: ${palette.frameBorderOuter};"></div>
                <div class="frame-inner" style="border-color: ${palette.frameBorderInner};"></div>

                <!-- Card Content -->
                <div class="card-content">
                  
                  <!-- Top Header -->
                  <div>
                    <div style="display:flex; align-items:center; justify-content:center; gap:4px; color: ${palette.headerText};">
                      <span style="color: ${palette.cornerIcon};">${sparklesSvg}</span>
                      <span style="font-size: ${welcomeFontPt}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif;">
                        ${settings.welcomeText || (settings.isGeneralInvitation ? 'دَعْوَةُ حُضُور' : 'حَفْلُ تَخَرُّج')}
                      </span>
                      <span style="color: ${palette.cornerIcon};">${sparklesSvg}</span>
                    </div>
                    ${settings.showEventName && event.name && (gradName || guestName) ? `
                      <div style="font-size: 7.5pt; font-weight: 800; color: #1e293b; margin-top: 1px;">
                        ${event.name}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Middle Section -->
                  <div style="margin: 2px 0;">
                    ${gradName ? `
                      <div style="font-size: 6.5pt; color: #475569; font-weight: 600;">
                        تتشرف أسرة الخريج
                      </div>
                      <div style="margin: 2px 0;">
                        <div style="display:inline-block; padding: 2px 10px; border-radius: 8px; border: 1.8px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: ${badgeFontPt}pt; font-weight: 900; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                          ${gradName}
                        </div>
                      </div>
                      <div style="display:flex; align-items:center; justify-content:center; gap:3px; font-size: 6.5pt; font-weight: 800; color: ${palette.accentText}; margin-top: 1px;">
                        <span>احتفالاً بتخرج ${gradName}</span>
                        <span>${capSvg}</span>
                      </div>
                    ` : guestName ? `
                      <div style="font-size: 6.5pt; color: #475569; font-weight: 600;">
                        تتشرف الأسرة الكريمة بدعوة
                      </div>
                      <div style="margin: 2px 0;">
                        <div style="display:inline-block; padding: 2px 8px; border-radius: 6px; border: 1.2px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: ${badgeFontPt * 0.9}pt; font-weight: 800;">
                          ${guestName}
                        </div>
                      </div>
                    ` : `
                      <div style="font-size: 6.5pt; color: #475569; font-weight: 600;">
                        يسرنا ويشرفنا دعوتكم لحضور
                      </div>
                      <div style="margin: 2px 0;">
                        <div style="display:inline-block; padding: 2px 10px; border-radius: 8px; border: 1.8px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: ${badgeFontPt}pt; font-weight: 900; box-shadow: 0 1px 2px rgba(0,0,0,0.06);">
                          ${event.name || 'حفل التخرج'}
                        </div>
                      </div>
                      <div style="display:flex; align-items:center; justify-content:center; gap:3px; font-size: 6.5pt; font-weight: 800; color: ${palette.accentText}; margin-top: 1px;">
                        <span>أهلاً وسهلاً بضيوفنا الكرام</span>
                        <span>${sparklesSvg}</span>
                      </div>
                    `}

                    ${settings.customSubtitle ? `
                      <div style="font-size: 5.5pt; color: #64748b; font-weight: 500; line-height: 1.2; margin-top: 1px;">
                        ${settings.customSubtitle}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Venue & Date/Time -->
                  <div style="display:inline-block; margin: 1px auto; padding: 2px 8px; border-radius: 6px; border: 1px solid ${palette.frameBorderInner}; background: rgba(255,255,255,0.85);">
                    ${settings.showVenue && venueText ? `
                      <div style="display:flex; align-items:center; justify-content:center; gap:2px; font-size: 6.5pt; font-weight: bold; color: #0f172a;">
                        <span style="color: ${palette.accentText};">${pinSvg}</span>
                        <span>المكان: ${venueText}</span>
                      </div>
                    ` : ''}
                    ${(settings.showDate && dateText) || (settings.showTime && timeText) ? `
                      <div style="font-size: 5.5pt; color: #475569; display:flex; justify-content:center; gap:4px;">
                        ${settings.showDate && dateText ? `<span>التاريخ: ${dateText}</span>` : ''}
                        ${settings.showTime && timeText ? `<span>الوقت: ${timeText}</span>` : ''}
                      </div>
                    ` : ''}
                  </div>

                  <!-- QR Code Frame -->
                  <div style="margin: 1px auto;">
                    <div style="display:inline-block; padding: 3px; border-radius: 8px; border: 2px solid ${palette.qrBorder}; background-color: ${palette.qrBoxBg}; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                      <img src="${qrDataUrl}" style="width: ${qrSizePx}px; height: ${qrSizePx}px; display: block; object-fit: contain;" />
                    </div>
                    <div style="font-size: 5.5pt; font-weight: bold; color: ${palette.accentText}; margin-top: 1px;">للدخول يرجى مسح الباركود</div>
                    <div style="font-size: 5pt; color: #64748b;">نرجو الحضور مع الدعوة</div>
                  </div>

                  <!-- Footer -->
                  <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid ${palette.divider}; padding-top: 2px; font-size: 5pt; color: #64748b;">
                    <span>بحضوركم تكتمل فرحتنا</span>
                    ${settings.showInvitationNumber ? `
                      <span style="font-weight:bold; font-family:monospace; color: ${palette.accentText}; font-size: 6pt;">#${String(inv.invitation_number).padStart(3, '0')}</span>
                    ` : ''}
                    <span>ليلة من العمر</span>
                  </div>

                </div>
              </div>
            </div>
          `;
          continue;
        }

        // Case 3: Other Templates (Graduation, Wedding, Dinner, Celebration, Minimal)
        cardsHtml += `
          <div class="card-cell">
            ${cropMarksHtml}
            <div class="royal-card" style="background-color: ${palette.cardBg}; border: 1.5px solid ${palette.frameBorderOuter};">
              <div class="frame-inner" style="border-color: ${palette.frameBorderInner};"></div>
              
              <div class="card-content">
                <div>
                  <div style="font-size: ${welcomeFontPt}pt; font-weight: 900; color: ${palette.headerText};">
                    ${settings.welcomeText || 'أهلاً بكم في حفلنا'}
                  </div>
                  ${settings.showEventName && event.name ? `
                    <div style="font-size: 7pt; font-weight: 700; color: #1e293b; margin-top: 1px;">
                      ${event.name}
                    </div>
                  ` : ''}
                </div>

                <div style="margin: 2px 0;">
                  ${gradName ? `
                    <div style="display:inline-block; padding: 2px 10px; border-radius: 8px; border: 1.5px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: ${badgeFontPt}pt; font-weight: 900;">
                      الخريج: ${gradName}
                    </div>
                  ` : guestName ? `
                    <div style="display:inline-block; padding: 2px 8px; border-radius: 6px; border: 1.2px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: ${badgeFontPt * 0.9}pt; font-weight: 800;">
                      ${guestName}
                    </div>
                  ` : ''}
                  ${settings.customSubtitle ? `<div style="font-size: 6pt; color: #64748b; margin-top: 2px;">${settings.customSubtitle}</div>` : ''}
                </div>

                <div style="margin: 2px auto;">
                  <div style="display:inline-block; padding: 3px; border-radius: 8px; border: 2px solid ${palette.qrBorder}; background-color: ${palette.qrBoxBg};">
                    <img src="${qrDataUrl}" style="width: ${qrSizePx}px; height: ${qrSizePx}px; display: block; object-fit: contain;" />
                  </div>
                  <div style="font-size: 5.5pt; color: #64748b; margin-top: 1px;">يرجى إبراز هذا الكود عند الدخول</div>
                </div>

                <div style="font-size: 5.5pt; color: #64748b; border-top: 1px solid ${palette.divider}; padding-top: 2px;">
                  ${settings.showVenue && venueText ? `<div>${venueText}</div>` : ''}
                  ${settings.showInvitationNumber ? `<div style="font-weight:bold; font-family:monospace; color: ${palette.accentText};">الدعوة #${String(inv.invitation_number).padStart(3, '0')}</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      pagesHtml += `
        <div class="page">
          ${cardsHtml}
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${printJobTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Tajawal:wght@400;500;700;800;900&display=swap');

    @page {
      size: ${isA5 ? 'A5' : 'A4'} portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page {
      width: ${isA5 ? '148mm' : '210mm'};
      height: ${isA5 ? '210mm' : '297mm'};
      box-sizing: border-box;
      padding: ${marginY}mm ${marginX}mm;
      display: grid;
      grid-template-columns: repeat(${cols}, minmax(0, 1fr));
      grid-template-rows: repeat(${rows}, minmax(0, 1fr));
      gap: ${gapY}mm ${gapX}mm;
      page-break-after: always;
      page-break-inside: avoid;
      background: #ffffff;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .card-cell {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      border-radius: 8px;
    }

    .royal-card {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 7px 10px;
      box-sizing: border-box;
      overflow: hidden;
      border-radius: 10px;
    }

    .corner-filigree-tl {
      position: absolute;
      top: -15px;
      left: -15px;
      width: 52px;
      height: 52px;
      border-bottom-right-radius: 28px;
      border-right: 2px solid;
      border-bottom: 2px solid;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 4px;
      z-index: 1;
    }

    .corner-filigree-br {
      position: absolute;
      bottom: -15px;
      right: -15px;
      width: 52px;
      height: 52px;
      border-top-left-radius: 28px;
      border-left: 2px solid;
      border-top: 2px solid;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 4px;
      z-index: 1;
    }

    .frame-outer {
      position: absolute;
      inset: 4px;
      border-radius: 9px;
      pointer-events: none;
      z-index: 2;
    }

    .frame-inner {
      position: absolute;
      inset: 6px;
      border-radius: 7px;
      pointer-events: none;
      z-index: 2;
    }

    .card-content {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
  }

  /**
   * Generates PDF and prompts user with a Save Dialog using Chromium native PDF engine
   */
  static async exportToPdf(
    event: Event,
    invitations: Invitation[],
    settings: PrintSettings
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const electron = await import('electron');
      const dialog = electron.dialog;
      const BrowserWindow = electron.BrowserWindow;

      const singleGradName = !settings.isGeneralInvitation && invitations.length > 0 && invitations.every((i) => i.graduate_name && i.graduate_name.trim() === invitations[0].graduate_name?.trim())
        ? invitations[0].graduate_name?.trim()
        : null;

      const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
      const safeGradName = singleGradName ? singleGradName.replace(/[\\/:*?"<>|]/g, '_').trim() : '';

      const defaultFileName = singleGradName
        ? `${safeEventName} - ${safeGradName}.pdf`
        : `${safeEventName} - عامة.pdf`;

      const result = await dialog.showSaveDialog({
        title: 'تصدير كروت الدعوة إلى PDF',
        defaultPath: defaultFileName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'تم إلغاء التصدير' };
      }

      // Pre-generate QR data URLs for all invitations
      const qrImages: Record<number, string> = {};
      for (const inv of invitations) {
        qrImages[inv.id] = await QrService.generateDataUrl(inv.token, 400);
      }

      // If running inside Electron with BrowserWindow, use Chromium printToPDF for 100% pixel-perfect output!
      if (BrowserWindow) {
        const htmlContent = this.generatePrintHtml(event, invitations, settings, qrImages);
        const tempDir = process.env.TEMP || process.env.TMP || '.';
        const tempHtmlPath = path.join(tempDir, `print_export_${Date.now()}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

        const printWin = new BrowserWindow({
          show: false,
          width: 1200,
          height: 1600,
          webPreferences: {
            offscreen: true,
          },
        });

        await printWin.loadURL(`file://${tempHtmlPath}`);

        const pdfBuffer = await printWin.webContents.printToPDF({
          printBackground: true,
          preferCSSPageSize: true,
        });

        printWin.close();
        try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (_) {}

        fs.writeFileSync(result.filePath, pdfBuffer);
      } else {
        // Fallback for tests/non-electron environments
        const doc = await this.generatePdfDocument(event, invitations, settings);
        const pdfArrayBuffer = doc.output('arraybuffer');
        fs.writeFileSync(result.filePath, Buffer.from(pdfArrayBuffer));
      }

      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      console.error('PDF Export error:', err);
      return { success: false, error: err.message || 'فشل إنشاء ملف PDF' };
    }
  }

  /**
   * Prints the generated cards directly to the system printer using Chromium engine
   */
  static async printDirectly(
    event: Event,
    invitations: Invitation[],
    settings: PrintSettings
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const electron = await import('electron');
      const BrowserWindow = electron.BrowserWindow;

      const singleGradName = !settings.isGeneralInvitation && invitations.length > 0 && invitations.every((i) => i.graduate_name && i.graduate_name.trim() === invitations[0].graduate_name?.trim())
        ? invitations[0].graduate_name?.trim()
        : null;

      const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
      const safeGradName = singleGradName ? singleGradName.replace(/[\\/:*?"<>|]/g, '_').trim() : '';

      const printJobTitle = singleGradName
        ? `${safeEventName} - ${safeGradName}`
        : `${safeEventName} - عامة`;

      // Pre-generate QR data URLs for all invitations
      const qrImages: Record<number, string> = {};
      for (const inv of invitations) {
        qrImages[inv.id] = await QrService.generateDataUrl(inv.token, 400);
      }

      if (BrowserWindow) {
        const htmlContent = this.generatePrintHtml(event, invitations, settings, qrImages);
        const tempDir = process.env.TEMP || process.env.TMP || '.';
        const tempHtmlPath = path.join(tempDir, `${printJobTitle}.html`);
        fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

        // Open print window loaded with exact HTML template
        const printWindow = new BrowserWindow({
          show: false,
          title: printJobTitle,
          webPreferences: {
            plugins: true,
          },
        });

        printWindow.setTitle(printJobTitle);
        await printWindow.loadURL(`file://${tempHtmlPath}`);
        printWindow.setTitle(printJobTitle);

        printWindow.webContents.print(
          {
            silent: false,
            printBackground: true,
          },
          (success, failureReason) => {
            printWindow.close();
            try {
              if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
            } catch (_) {}
            if (!success) {
              console.warn('Print canceled or failed:', failureReason);
            }
          }
        );
      } else {
        // Fallback for non-electron environments
        const doc = await this.generatePdfDocument(event, invitations, settings);
        const tempDir = process.env.TEMP || process.env.TMP || '.';
        const tempPdfPath = path.join(tempDir, `${printJobTitle}.pdf`);
        const pdfArrayBuffer = doc.output('arraybuffer');
        fs.writeFileSync(tempPdfPath, Buffer.from(pdfArrayBuffer));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Print direct error:', err);
      return { success: false, error: err.message || 'فشل إرسال أمر الطباعة' };
    }
  }
}
