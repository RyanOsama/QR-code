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
  const theme = settings.cardTheme || 'wedding_botanical_purple';

  // Bespoke default palettes for each wedding template
  if (scheme === 'default') {
    if (theme === 'wedding_golden_floral') {
      return {
        cardBg: settings.customBgColor || '#FCFAF7',
        cornerBg: '#8C6826',
        cornerBorder: settings.customPrimaryColor || '#C89D4B',
        cornerIcon: '#EAD397',
        frameBorderOuter: settings.customPrimaryColor || '#C89D4B',
        frameBorderInner: '#E3CD97',
        headerText: settings.customAccentColor || '#8C6826',
        badgeBg: '#EDE5D8',
        badgeBorder: '#D8CAB8',
        badgeText: '#281E14',
        accentText: settings.customPrimaryColor || '#8C6826',
        qrBorder: settings.customPrimaryColor || '#C49E4F',
        qrBoxBg: '#FFFFFF',
        subText: '#5A4A38',
        divider: '#D8CAB8',
      };
    }
    if (theme === 'wedding_botanical_purple') {
      return {
        cardBg: '#F9F8F6',
        cornerBg: '#5b21b6',
        cornerBorder: '#7c3aed',
        cornerIcon: '#c4b5fd',
        frameBorderOuter: '#7c3aed',
        frameBorderInner: '#a78bfa',
        headerText: '#5b21b6',
        badgeBg: '#f5f3ff',
        badgeBorder: '#c4b5fd',
        badgeText: '#4c1d95',
        accentText: '#7c3aed',
        qrBorder: '#7c3aed',
        qrBoxBg: '#ffffff',
        subText: '#5b21b6',
        divider: '#e9d5ff',
      };
    }
    if (theme === 'wedding_royal_burgundy') {
      return {
        cardBg: '#FFFDFD',
        cornerBg: '#881337',
        cornerBorder: '#be123c',
        cornerIcon: '#fda4af',
        frameBorderOuter: '#881337',
        frameBorderInner: '#f43f5e',
        headerText: '#881337',
        badgeBg: '#fff1f2',
        badgeBorder: '#fecdd3',
        badgeText: '#881337',
        accentText: '#be123c',
        qrBorder: '#881337',
        qrBoxBg: '#ffffff',
        subText: '#881337',
        divider: '#ffe4e6',
      };
    }
    if (theme === 'wedding_calla_sage') {
      return {
        cardBg: '#FBFDFB',
        cornerBg: '#365314',
        cornerBorder: '#4d7c0f',
        cornerIcon: '#bef264',
        frameBorderOuter: '#65a30d',
        frameBorderInner: '#84cc16',
        headerText: '#365314',
        badgeBg: '#f7fee7',
        badgeBorder: '#d9f99d',
        badgeText: '#365314',
        accentText: '#4d7c0f',
        qrBorder: '#65a30d',
        qrBoxBg: '#ffffff',
        subText: '#365314',
        divider: '#ecfccb',
      };
    }
    if (theme === 'wedding_sculpted_ivory') {
      return {
        cardBg: '#F8F5EE',
        cornerBg: '#57422f',
        cornerBorder: '#786048',
        cornerIcon: '#e7dec8',
        frameBorderOuter: '#b8a692',
        frameBorderInner: '#d5c7b3',
        headerText: '#57422f',
        badgeBg: '#fdfbf7',
        badgeBorder: '#e7dec8',
        badgeText: '#57422f',
        accentText: '#786048',
        qrBorder: '#786048',
        qrBoxBg: '#ffffff',
        subText: '#786048',
        divider: '#d8cab8',
      };
    }
  }

  switch (scheme) {
    case 'black_white':
      return {
        cardBg: '#FAF9F6', // Raw alabaster cotton cardstock
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
        cardBg: '#F8FAFC', // Fine linen white
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
        cardBg: '#F7FAF8', // Pearl mint raw cardstock
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
        cardBg: '#FAF7F8', // Warm rose alabaster
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
        cardBg: '#FAF8FB', // Lavender mist ivory
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
        cardBg: '#FAF9F6',
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
    const theme = settings.cardTheme || 'wedding_botanical_purple';

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
      case 'wedding_golden_floral':
        return {
          primary: [140, 104, 38], // #8C6826
          accent: [191, 160, 99], // #BFA063
          cardBg: [252, 250, 247], // #FCFAF7
          innerFrame: [227, 205, 151], // #E3CD97
          defaultWelcome: 'دعوة لحضور حفل زفاف',
          defaultSubtitle: 'نتشرف بدعوتكم لحضور حفل زفافنا',
        };
      case 'wedding_botanical_purple':
        return {
          primary: [91, 33, 182],
          accent: [124, 58, 237],
          cardBg: [249, 248, 246],
          innerFrame: [167, 139, 250],
          defaultWelcome: 'بـطـاقـة دخـول',
          defaultSubtitle: 'الرجاء تمرير الباركود على القارئ للدخول',
        };
      case 'wedding_royal_burgundy':
        return {
          primary: [136, 19, 55],
          accent: [190, 18, 60],
          cardBg: [255, 253, 253],
          innerFrame: [244, 63, 94],
          defaultWelcome: 'دعوة لحضور زفاف',
          defaultSubtitle: 'وبحضوركم يتم لنا الفرح والسرور',
        };
      case 'wedding_calla_sage':
        return {
          primary: [54, 83, 20],
          accent: [101, 163, 13],
          cardBg: [251, 253, 251],
          innerFrame: [132, 204, 22],
          defaultWelcome: 'دعوة زفاف',
          defaultSubtitle: 'بدعوتكم لحضور حفل زفافهما',
        };
      case 'wedding_sculpted_ivory':
        return {
          primary: [87, 66, 47],
          accent: [120, 96, 72],
          cardBg: [248, 245, 238],
          innerFrame: [213, 199, 179],
          defaultWelcome: 'تم بحمدالله عقد قران',
          defaultSubtitle: 'اللّهم أتمّ عليهم السعادة والهناء',
        };
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

    let cols = Math.max(1, settings.columns || 3);
    let rows = Math.max(1, settings.rows || 4);

    if (settings.printMode === 'pure_qr_stickers') {
      const preset = settings.stickerPreset || '35';
      if (preset === '24') { cols = 3; rows = 8; }
      else if (preset === '35') { cols = 5; rows = 7; }
      else if (preset === '48') { cols = 6; rows = 8; }
      else if (preset === '60') { cols = 6; rows = 10; }
      else if (preset === 'custom') {
        cols = Math.max(1, settings.columns || 5);
        rows = Math.max(1, settings.rows || 7);
      }
    }

    const cardsPerPage = cols * rows;

    const marginX = settings.marginX !== undefined ? settings.marginX : (settings.printMode === 'pure_qr_stickers' ? 6 : 10);
    const marginY = settings.marginY !== undefined ? settings.marginY : (settings.printMode === 'pure_qr_stickers' ? 6 : 10);
    const gapX = settings.gapX !== undefined ? settings.gapX : (settings.printMode === 'pure_qr_stickers' ? 2 : 3);
    const gapY = settings.gapY !== undefined ? settings.gapY : (settings.printMode === 'pure_qr_stickers' ? 2 : 3);

    // Calculate card width and height to fit margins and gaps
    const availableW = pageWidth - marginX * 2 - (cols - 1) * gapX;
    const availableH = pageHeight - marginY * 2 - (rows - 1) * gapY;
    const cellW = availableW / cols;
    const cellH = availableH / rows;
    let cardW = settings.cardWidth > 0 ? settings.cardWidth : cellW;
    let cardH = settings.cardHeight > 0 ? settings.cardHeight : cellH;
    if (settings.cardTheme === 'custom' && settings.customAspectRatio) {
      const imgAspect = settings.customAspectRatio;
      const cellAspect = cellW / cellH;
      if (cellAspect > imgAspect) {
        cardW = Math.round(cellH * imgAspect * 10) / 10;
        cardH = cellH;
      } else {
        cardW = cellW;
        cardH = Math.round((cellW / imgAspect) * 10) / 10;
      }
    } else if ((settings.cardShape as any) === 'square') {
      const sqDim = Math.min(cardW, cardH, cellW, cellH);
      cardW = sqDim;
      cardH = sqDim;
    }
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

        const cellOffsetX = (cellW - cardW) / 2;
        const cellOffsetY = (cellH - cardH) / 2;
        const x = marginX + col * (cellW + gapX) + (cellOffsetX > 0 ? cellOffsetX : 0);
        const y = marginY + row * (cellH + gapY) + (cellOffsetY > 0 ? cellOffsetY : 0);

        // Pure QR Stickers Mode (High density label sheet)
        if (settings.printMode === 'pure_qr_stickers') {
          if (settings.stickerShowCutMarks !== false) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.15);
            doc.rect(x, y, cardW, cardH);
          }
          const qrImg = qrImages[inv.id];
          const hasNumber = settings.stickerShowNumber !== false;
          const hasName = settings.stickerShowName === true && !!(inv.guest_name || inv.graduate_name);
          const bottomSpace = hasNumber && hasName ? 7 : (hasNumber || hasName) ? 4.5 : 2;
          const qrDim = Math.min(cardW - 3, cardH - bottomSpace - 2);

          if (qrImg && qrDim > 5) {
            const qrX = x + (cardW - qrDim) / 2;
            const qrY = y + 1.5;
            try {
              doc.addImage(qrImg, 'PNG', qrX, qrY, qrDim, qrDim);
            } catch (_) {}
          }

          if (hasNumber) {
            doc.setFontSize(rows >= 9 ? 6 : 7);
            doc.setTextColor(15, 23, 42);
            doc.text(`#${String(inv.invitation_number).padStart(3, '0')}`, x + cardW / 2, y + cardH - (hasName ? 4 : 1.5), { align: 'center' });
          }

          if (hasName) {
            doc.setFontSize(rows >= 9 ? 4.5 : 5.5);
            doc.setTextColor(71, 85, 105);
            const labelName = (inv.guest_name || inv.graduate_name || '').substring(0, 18);
            doc.text(labelName, x + cardW / 2, y + cardH - 1.2, { align: 'center' });
          }

          continue;
        }

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

        // Header Welcome Text or Couple Names
        const isWedding = 
          settings.cardTheme === 'wedding_botanical_purple' ||
          settings.cardTheme === 'wedding_royal_burgundy' ||
          settings.cardTheme === 'wedding_calla_sage' ||
          settings.cardTheme === 'wedding_sculpted_ivory' ||
          settings.cardTheme === 'wedding';

        const showCouple = isWedding && (settings.weddingTitleType || 'couple_names') === 'couple_names';
        const coupleNames = `${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
        const mainTitle = showCouple ? coupleNames : (settings.welcomeText || themeColors.defaultWelcome);
        doc.text(mainTitle, x + cardW / 2, y + 5.5, { align: 'center' });

        let currentY = y + 8.5;

        // Subheader or Event Name
        if (showCouple && settings.welcomeText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(themeColors.accent[0], themeColors.accent[1], themeColors.accent[2]);
          doc.text(settings.welcomeText, x + cardW / 2, currentY, { align: 'center' });
          currentY += 3.5;
        } else if (settings.showEventName && event.name) {
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

      // Duplex Back Page Generation in direct jsPDF mode
      if (settings.doubleSidedMode === 'duplex' && settings.printMode !== 'pure_qr_stickers') {
        doc.addPage(isA5 ? 'a5' : 'a4', 'portrait');

        // Draw back cards mirrored horizontally for long-edge duplex alignment
        for (let i = 0; i < pageInvitations.length; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const mirroredCol = cols - 1 - col;
          const mirroredIdx = row * cols + mirroredCol;
          const inv = pageInvitations[mirroredIdx] || pageInvitations[i];

          const x = marginX + col * (cardW + gapX);
          const y = marginY + row * (cardH + gapY);

          // If custom card back image exists
          if (settings.cardTheme === 'custom' && settings.customCardBackImage) {
            try {
              doc.addImage(settings.customCardBackImage, 'JPEG', x, y, cardW, cardH);
            } catch (_) {
              try {
                doc.addImage(settings.customCardBackImage, 'PNG', x, y, cardW, cardH);
              } catch (e) {}
            }
            continue;
          }

          // Otherwise draw preset embroidered back card
          doc.setFillColor(themeColors.cardBg[0], themeColors.cardBg[1], themeColors.cardBg[2]);
          doc.rect(x, y, cardW, cardH, 'F');

          // Outer solid border
          doc.setDrawColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
          doc.setLineWidth(0.4);
          doc.roundedRect(x + 1, y + 1, cardW - 2, cardH - 2, 2, 2, 'S');

          let backY = y + 8;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
          const backTitle = settings.backTitleText || event.name || 'بطاقة دعوة';
          doc.text(backTitle, x + cardW / 2, backY, { align: 'center' });

          backY += 7;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(themeColors.accent[0], themeColors.accent[1], themeColors.accent[2]);
          const backHeader = settings.backHeaderText || (settings.cardTheme === 'wedding' ? 'بارك الله لهما وجمع بينهما في خير' :
            settings.cardTheme === 'dinner' ? 'يسعدنا ويشرفنا تلبية دعوتنا' :
            'فرحة نجاح وتخرج مباركة');
          doc.text(backHeader, x + cardW / 2, backY, { align: 'center' });

          backY += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          const backSub = settings.backMessageText || settings.customSubtitle || (
            settings.cardTheme === 'wedding' ? 'حضوركم يشرفنا وتكتمل به فرحتنا' :
            settings.cardTheme === 'dinner' ? 'أهلاً وسهلاً بكم وطاب ممشاكم' :
            'ودامت دياركم عامرة بالأفراح والمسرات'
          );
          doc.text(backSub, x + cardW / 2, backY, { align: 'center' });

          // Bottom badge & invitation number
          const badgeY = y + cardH - 4.5;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(themeColors.primary[0], themeColors.primary[1], themeColors.primary[2]);
          const badgePrefix = settings.backBadgeText ? `${settings.backBadgeText} ` : '';
          doc.text(`${badgePrefix}#${String(inv.invitation_number).padStart(3, '0')}`, x + cardW / 2, badgeY, { align: 'center' });
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
    if (settings.printMode === 'pure_qr_stickers') {
      return this.generateStickersPrintHtml(event, invitations, settings, qrImages);
    }

    const isA5 = settings.paperSize === 'A5';
    const cols = Math.max(1, settings.columns || 3);
    const rows = Math.max(1, settings.rows || 4);
    const cardsPerPage = cols * rows;
    const totalPages = Math.ceil(invitations.length / cardsPerPage) || 1;

    const marginX = settings.marginX !== undefined ? settings.marginX : 10;
    const marginY = settings.marginY !== undefined ? settings.marginY : 10;
    const gapX = settings.gapX !== undefined ? settings.gapX : 3;
    const gapY = settings.gapY !== undefined ? settings.gapY : 3;

    const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
    const isCustomTwoSided = settings.cardTheme === 'custom' && Boolean(settings.customCardBackImage);
    const isDuplex = (isCustomTwoSided || settings.cardTheme !== 'custom') && settings.doubleSidedMode === 'duplex';
    const printJobTitle = isDuplex ? `كروت بوجهين - ${safeEventName}` : `كروت الدعوة - ${safeEventName}`;

    const palette = getColorPaletteCss(settings);

    // SVGs for crisp offline rendering
    const sparklesSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`;
    const pinSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
    const heartSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    const gradCapSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
    const utensilsSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v14a3 3 0 0 1-3 3H9"/><path d="M6 2v20"/><path d="M3 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2"/></svg>`;

    const eventVenue = (settings.venueText || event.venue || (event as any).location || '').trim();
    const eventDate = (settings.weddingHijriDate || settings.dateText || event.date || '').trim();
    const eventTime = (settings.timeText || event.time || '').trim();

    const eventDayName = (() => {
      if (!eventDate) return '';
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      for (const d of days) {
        if (eventDate.includes(d)) return d;
      }
      try {
        const parsed = new Date(eventDate);
        if (!isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('ar-SA', { weekday: 'long' });
        }
      } catch (_) {}
      return 'السبت';
    })();

    const eventDateOnly = (() => {
      if (!eventDate) return '';
      return eventDate.replace(/^(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\s*[-/]?\s*/, '').trim();
    })();

    const venueLines = eventVenue.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const venueDashParts = eventVenue.split(' - ').map((s: string) => s.trim()).filter(Boolean);
    const venuePrimary = venueLines.length > 1 ? venueLines[0] : (venueDashParts.length > 1 ? venueDashParts[0] : eventVenue);
    const venueSecondary = venueLines.length > 1 ? venueLines.slice(1).join(' - ') : (venueDashParts.length > 1 ? venueDashParts.slice(1).join(' - ') : '');

    const isSquare = false;
    const isVertical = false;
    const isLandscape = true;

    // Physical millimeter sizing based on paper margins & columns
    const pageWidthMm = isA5 ? 148 : 210;
    const pageHeightMm = isA5 ? 210 : 297;
    const availableCellW = (pageWidthMm - marginX * 2 - (cols - 1) * gapX) / cols;
    const availableCellH = (pageHeightMm - marginY * 2 - (rows - 1) * gapY) / rows;

    let targetCardW = settings.cardWidth > 0 ? settings.cardWidth : availableCellW;
    let targetCardH = settings.cardHeight > 0 ? settings.cardHeight : availableCellH;

    if (settings.cardTheme === 'custom' && settings.customAspectRatio) {
      const imgAspect = settings.customAspectRatio;
      const cellAspect = availableCellW / availableCellH;
      if (cellAspect > imgAspect) {
        targetCardW = Math.round(availableCellH * imgAspect * 10) / 10;
        targetCardH = availableCellH;
      } else {
        targetCardW = availableCellW;
        targetCardH = Math.round((availableCellW / imgAspect) * 10) / 10;
      }
    } else if (isSquare) {
      // Force exact physical square dimensions to prevent vertical stretching
      const sq = Math.min(targetCardW, targetCardH, availableCellW, availableCellH);
      targetCardW = sq;
      targetCardH = sq;
    } else if (isLandscape) {
      if (targetCardW <= targetCardH) {
        const tmp = targetCardW;
        targetCardW = targetCardH;
        targetCardH = tmp;
      }
    }

    // Compact mode sizing if 4 or more rows
    const isDense = rows >= 4;
    const qrSizePx = isDense ? (isLandscape ? 58 : 52) : rows === 3 ? 72 : 95;
    const welcomeFontPt = isDense ? 9.5 : rows === 3 ? 12 : 15;
    const badgeFontPt = isDense ? 9 : rows === 3 ? 11.5 : 14;

    let pagesHtml = '';

    // Helper to render custom card cell
    const renderCustomFace = (imgSrc: string, inv: Invitation | null, showQr: boolean) => {
      if (!inv) {
        return `<div class="card-cell" style="opacity:0;"></div>`;
      }
      const qrDataUrl = qrImages[inv.id] || '';
      const qrX = settings.customQrX ?? 50;
      const qrY = settings.customQrY ?? 65;
      const qrSize = (settings.customQrSize ?? 30) * 1.5;

      return `
        <div class="card-cell">
          <div style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin:auto; overflow:hidden; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <img src="${imgSrc}" style="width:100%; height:100%; object-fit:cover; display:block;" />
            ${showQr ? `
              <div style="position:absolute; left:${qrX}%; top:${qrY}%; transform:translate(-50%, -50%); padding:2.5px; ${settings.customQrBg !== false ? 'background:#fff;' : ''} border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.25); text-align:center;">
                ${settings.showEventName && event?.name ? `<div style="font-size:5.5pt; font-weight:bold; color:#0f172a; margin-bottom:1.5px; max-width:${qrSize + 30}px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${event.name}</div>` : ''}
                <img src="${qrDataUrl}" style="width:${qrSize}px; height:${qrSize}px; object-fit:contain; display:block; margin:auto;" />
                ${settings.showInvitationNumber ? `<div style="font-size:6pt; font-family:monospace; font-weight:bold; text-align:center; color:#1e293b; margin-top:1.5px;">#${String(inv.invitation_number).padStart(3, '0')}</div>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    };

    // Helper SVG embroidery functions
    const andalusianCornerSvg = (pri: string, acc: string) => `
      <svg width="26" height="26" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 42 C2 26 12 16 28 16 L28 2 Z" stroke="${pri}" stroke-width="1.4" fill="none" />
        <path d="M6 6 L6 34 C8 24 16 16 26 14 L26 6 Z" stroke="${acc}" stroke-width="0.9" stroke-dasharray="2,2" fill="none" />
        <path d="M14 14 C14 8 18 4 24 4 C24 10 20 14 14 14 Z" fill="${acc}" fill-opacity="0.25" stroke="${acc}" stroke-width="0.8" />
        <path d="M14 14 C8 14 4 18 4 24 C10 24 14 20 14 14 Z" fill="${acc}" fill-opacity="0.25" stroke="${acc}" stroke-width="0.8" />
        <circle cx="14" cy="14" r="2.5" fill="${pri}" />
        <path d="M14 9 L15.5 12.5 L19 14 L15.5 15.5 L14 19 L12.5 15.5 L9 14 L12.5 12.5 Z" fill="${acc}" />
      </svg>
    `;

    const damaskCornerSvg = (pri: string, acc: string) => `
      <svg width="26" height="26" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 44 C2 38 6 36 8 32 C10 28 14 26 18 22 C22 18 26 14 30 10 C34 6 38 2 44 2 Z" stroke="${pri}" stroke-width="1.2" fill="none" />
        <path d="M12 12 C16 9 22 11 23 15 C24 19 19 23 15 22 C11 21 9 16 12 12 Z" fill="${acc}" fill-opacity="0.2" stroke="${acc}" stroke-width="1" />
        <path d="M14 14 C16 12 19 13 20 16 C20 18 17 20 15 19 C13 18 12 16 14 14 Z" fill="${pri}" fill-opacity="0.4" />
        <path d="M5 28 C9 26 13 27 15 24 C17 21 16 17 20 16 C24 15 27 18 26 21 C25 24 22 25 21 28" stroke="${acc}" stroke-width="0.9" stroke-linecap="round" />
        <path d="M28 5 C26 9 27 13 24 15 C21 17 17 16 16 20 C15 24 18 27 21 26 C24 25 25 22 28 21" stroke="${acc}" stroke-width="0.9" stroke-linecap="round" />
        <circle cx="8" cy="8" r="1.8" fill="${pri}" />
      </svg>
    `;

    const imperialCornerSvg = (pri: string, acc: string) => `
      <svg width="26" height="26" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 42 L10 42 L10 18 L24 18 L24 10 L42 10 L42 2 Z" stroke="${pri}" stroke-width="1.6" fill="${pri}" fill-opacity="0.08" />
        <path d="M6 6 L6 38 L8 38 L8 14 L22 14 L22 6 Z" stroke="${acc}" stroke-width="1.1" fill="none" />
        <path d="M14 26 C14 20 20 14 26 14 C32 14 36 20 36 24 C32 26 28 24 26 26 C24 28 24 32 22 34 C20 32 16 30 14 26 Z" fill="${acc}" fill-opacity="0.35" stroke="${acc}" stroke-width="1" />
        <rect x="14" y="14" width="5" height="5" transform="rotate(45 16.5 16.5)" fill="${pri}" />
        <circle cx="5" cy="5" r="1.5" fill="${acc}" />
      </svg>
    `;

    const minimalKnotCornerSvg = (pri: string, acc: string) => `
      <svg width="26" height="26" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 40 M2 2 L40 2" stroke="${pri}" stroke-width="1.3" />
        <path d="M6 6 L6 34 M6 6 L34 6" stroke="${acc}" stroke-width="0.8" stroke-dasharray="1.5,1.5" />
        <path d="M12 12 C12 6 18 6 18 12 C18 18 12 18 12 24 C12 30 18 30 18 24" stroke="${pri}" stroke-width="1" fill="none" stroke-linecap="round" />
        <path d="M12 12 C6 12 6 18 12 18 C18 18 18 12 24 12 C30 12 30 18 24 18" stroke="${acc}" stroke-width="1" fill="none" stroke-linecap="round" />
        <circle cx="15" cy="15" r="1.5" fill="${acc}" />
      </svg>
    `;

    const andalusianArchCrestSvg = (pri: string, acc: string) => `
      <svg width="70" height="24" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M10 40 C10 18 35 6 60 6 C85 6 110 18 110 40" stroke="${pri}" stroke-width="1.5" fill="none" />
        <path d="M18 40 C18 22 38 12 60 12 C82 12 102 22 102 40" stroke="${acc}" stroke-width="1" stroke-dasharray="3,2" fill="none" />
        <path d="M60 2 L62.5 7 L68 8 L64 12 L65 17 L60 14.5 L55 17 L56 12 L52 8 L57.5 7 Z" fill="${pri}" />
        <circle cx="60" cy="10" r="1.5" fill="#ffffff" />
        <path d="M42 34 C44 26 52 22 60 22 C68 22 76 26 78 34" stroke="${pri}" stroke-width="1.1" fill="none" />
        <circle cx="48" cy="27" r="1.5" fill="${acc}" />
        <circle cx="60" cy="24" r="2" fill="${acc}" />
        <circle cx="72" cy="27" r="1.5" fill="${acc}" />
      </svg>
    `;

    const damaskFloralCrestSvg = (pri: string, acc: string) => `
      <svg width="65" height="22" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <circle cx="60" cy="18" r="6" fill="${pri}" fill-opacity="0.2" stroke="${pri}" stroke-width="1.3" />
        <circle cx="60" cy="18" r="3.5" fill="${acc}" stroke="${acc}" stroke-width="0.8" />
        <path d="M53 18 C46 14 42 8 32 10 C24 12 22 18 14 19" stroke="${pri}" stroke-width="1.3" stroke-linecap="round" />
        <path d="M67 18 C74 14 78 8 88 10 C96 12 98 18 106 19" stroke="${pri}" stroke-width="1.3" stroke-linecap="round" />
        <path d="M44 13 C40 10 38 5 42 4 C46 3 48 8 44 13 Z" fill="${acc}" fill-opacity="0.3" stroke="${acc}" stroke-width="0.9" />
        <path d="M76 13 C80 10 82 5 78 4 C74 3 72 8 76 13 Z" fill="${acc}" fill-opacity="0.3" stroke="${acc}" stroke-width="0.9" />
      </svg>
    `;

    const imperialCrownCrestSvg = (pri: string, acc: string) => `
      <svg width="70" height="24" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M48 30 L45 16 L53 22 L60 12 L67 22 L75 16 L72 30 Z" fill="${pri}" fill-opacity="0.2" stroke="${pri}" stroke-width="1.5" stroke-linejoin="round" />
        <circle cx="45" cy="15" r="2" fill="${acc}" />
        <circle cx="60" cy="11" r="2.5" fill="${acc}" />
        <circle cx="75" cy="15" r="2" fill="${acc}" />
        <rect x="47" y="27" width="26" height="4" rx="1.5" fill="${pri}" />
        <path d="M42 28 C34 26 26 20 22 12" stroke="${acc}" stroke-width="1.2" stroke-linecap="round" />
        <path d="M78 28 C86 26 94 20 98 12" stroke="${acc}" stroke-width="1.2" stroke-linecap="round" />
      </svg>
    `;

    const minimalDiamondCrestSvg = (pri: string, acc: string) => `
      <svg width="60" height="20" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M6 16 L42 16" stroke="${acc}" stroke-width="0.8" />
        <path d="M58 16 L94 16" stroke="${acc}" stroke-width="0.8" />
        <path d="M50 6 L54 13 L61 16 L54 19 L50 26 L46 19 L39 16 L46 13 Z" fill="${pri}" fill-opacity="0.25" stroke="${pri}" stroke-width="1.2" />
        <circle cx="50" cy="16" r="2.2" fill="${acc}" />
      </svg>
    `;

    const graduationLaurelCrestSvg = (pri: string, acc: string) => `
      <svg width="70" height="24" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M60 11 L78 17 L60 23 L42 17 Z" fill="${pri}" stroke="${pri}" stroke-width="1.3" />
        <path d="M49 20 V25 C49 28 71 28 71 25 V20" fill="${pri}" fill-opacity="0.3" stroke="${pri}" stroke-width="1" />
        <path d="M60 17 L69 22 L68 28" stroke="${acc}" stroke-width="1.4" stroke-linecap="round" />
        <circle cx="68" cy="29" r="1.5" fill="${acc}" />
      </svg>
    `;

    const dinnerBanquetCrestSvg = (pri: string, acc: string) => `
      <svg width="65" height="22" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M58 8 C58 5 62 5 62 8 L64 16 C68 18 70 22 68 26 C66 30 54 30 52 26 C50 22 52 18 56 16 Z" fill="${pri}" fill-opacity="0.25" stroke="${pri}" stroke-width="1.3" />
        <path d="M46 22 C38 18 30 20 22 17" stroke="${pri}" stroke-width="1.2" stroke-linecap="round" />
        <path d="M74 22 C82 18 90 20 98 17" stroke="${pri}" stroke-width="1.2" stroke-linecap="round" />
      </svg>
    `;

    const initialsMonogramSvg = (g: string, b: string, color: string) => `
      <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin: 0 auto;">
        <span style="font-family:'Playfair Display', 'Cinzel', Georgia, serif; font-size:16pt; color:${color}; font-weight:normal; line-height:1;">${g}</span>
        <svg width="15" height="22" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; margin-top:-2px;">
          <path d="M12 30 C12 20 12 10 12 3" stroke="${color}" stroke-width="1.3" stroke-linecap="round" />
          <path d="M12 23 C7 21 5 16 6 13 C9.5 13.5 11.5 17.5 12 19.5" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="0.8" />
          <path d="M12 19 C17 17 19 12 18 9 C14.5 9.5 12.5 13.5 12 15.5" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="0.8" />
          <path d="M12 13 C7.5 11 6 7 7.5 4.5 C10 5 11.5 8.5 12 10.5" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.8" />
          <path d="M12 9 C16.5 7 18 3 16.5 1 C14 1.5 12.5 5 12 6.5" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.8" />
          <circle cx="12" cy="2.5" r="1.5" fill="${color}" />
        </svg>
        <span style="font-family:'Playfair Display', 'Cinzel', Georgia, serif; font-size:16pt; color:${color}; font-weight:normal; line-height:1;">${b}</span>
      </div>
    `;

    const goldenHeartIconSvg = (color: string) => `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="display:block; margin: 1px auto;">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;

    const goldenFooterDividerSvg = (text: string, color: string) => `
      <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin: 2px auto 0;">
        <svg width="24" height="7" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 6 L20 6" stroke="${color}" stroke-width="1" />
          <path d="M20 6 C23 3 27 3 29 6 C27 9 23 9 20 6 Z" fill="${color}" fill-opacity="0.85" />
          <path d="M29 6 L40 6" stroke="${color}" stroke-width="1" />
          <circle cx="35" cy="6" r="1.5" fill="${color}" />
          <path d="M24 2 C26 0.5 29 1.5 29 3 C27 3.5 25 3 24 2 Z" fill="${color}" />
          <path d="M24 10 C26 11.5 29 10.5 29 9 C27 8.5 25 9 24 10 Z" fill="${color}" />
        </svg>
        <span style="font-size: 5.5pt; font-weight: bold; font-family:'Amiri', 'Traditional Arabic', serif; color: ${color}; letter-spacing: 0.5px;">${text}</span>
        <svg width="24" height="7" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: scaleX(-1);">
          <path d="M0 6 L20 6" stroke="${color}" stroke-width="1" />
          <path d="M20 6 C23 3 27 3 29 6 C27 9 23 9 20 6 Z" fill="${color}" fill-opacity="0.85" />
          <path d="M29 6 L40 6" stroke="${color}" stroke-width="1" />
          <circle cx="35" cy="6" r="1.5" fill="${color}" />
          <path d="M24 2 C26 0.5 29 1.5 29 3 C27 3.5 25 3 24 2 Z" fill="${color}" />
          <path d="M24 10 C26 11.5 29 10.5 29 9 C27 8.5 25 9 24 10 Z" fill="${color}" />
        </svg>
      </div>
    `;

    const goldenFloralBackBackgroundHtml = (showEnglishNote: boolean, englishNoteText: string) => `
      <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
        <svg viewBox="0 0 400 240" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="backGoldWavePdf" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#7E591A" />
              <stop offset="25%" stop-color="#A3782B" />
              <stop offset="55%" stop-color="#E9D396" />
              <stop offset="85%" stop-color="#C89D4B" />
              <stop offset="100%" stop-color="#F5E4B5" />
            </linearGradient>
            <linearGradient id="flowerPetalGradPdf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="40%" stop-color="#FDFBF7" />
              <stop offset="75%" stop-color="#F3E7D5" />
              <stop offset="100%" stop-color="#DFC3A0" />
            </linearGradient>
            <linearGradient id="flowerPetalShadowPdf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F5EADA" />
              <stop offset="100%" stop-color="#D4BA94" />
            </linearGradient>
            <linearGradient id="goldLeafGradBackPdf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E5C782" />
              <stop offset="50%" stop-color="#BA8F3E" />
              <stop offset="100%" stop-color="#755217" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="${palette.cardBg || '#FCFAF7'}" />
          <rect x="1.5" y="1.5" width="397" height="237" rx="8" stroke="#E5D6BA" stroke-width="0.8" fill="none" opacity="0.6" />

          <!-- Bottom Left Wave -->
          <path d="M 0 240 L 165 240 C 130 215 85 195 48 185 C 18 177 0 182 0 182 Z" fill="url(#backGoldWavePdf)" />
          <path d="M 165 240 C 130 215 85 195 48 185 C 18 177 0 182 0 182" stroke="#FFF2CE" stroke-width="1.4" fill="none" />
          <path d="M 180 240 C 145 212 96 189 54 179 C 22 171 0 174 0 174" stroke="#CAA256" stroke-width="0.75" stroke-dasharray="3, 3" fill="none" opacity="0.65" />

          <!-- Top Left Watermark Foliage -->
          <g opacity="0.32" transform="translate(8, 14)">
            <path d="M 5 50 C 15 25 35 12 55 5 C 45 28 25 48 5 50 Z" fill="none" stroke="#BA8E3C" stroke-width="1" />
            <path d="M 5 50 Q 32 26 55 5" stroke="#BA8E3C" stroke-width="0.7" />
            <path d="M 30 70 C 42 48 62 38 80 30 C 68 52 48 68 30 70 Z" fill="none" stroke="#BA8E3C" stroke-width="1" />
            <path d="M 30 70 Q 58 48 80 30" stroke="#BA8E3C" stroke-width="0.7" />
          </g>

          <!-- Top Right Leaf Sprays -->
          <g transform="translate(305, 5)">
            <path d="M 75 12 C 60 22 55 38 52 55 C 65 42 75 28 75 12 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.4" />
            <path d="M 75 12 Q 62 32 52 55" stroke="#FFF7E6" stroke-width="0.5" opacity="0.7" />
            <path d="M 50 35 C 35 45 32 60 30 75 C 42 62 50 48 50 35 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.4" />
            <path d="M 85 45 C 72 58 70 75 68 90 C 80 75 88 60 85 45 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.4" />
          </g>

          <!-- Right & Bottom-Right Floral Art -->
          <g transform="translate(240, 95)">
            <g>
              <path d="M 110 95 C 130 65 155 55 165 45 C 152 75 132 98 110 95 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.5" />
              <path d="M 110 95 Q 140 72 165 45" stroke="#FFF7E6" stroke-width="0.6" opacity="0.8" />
              <path d="M 65 55 C 75 25 105 12 125 5 C 112 35 95 55 65 55 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.5" />
              <path d="M 65 55 Q 98 28 125 5" stroke="#FFF7E6" stroke-width="0.6" opacity="0.8" />
              <path d="M 35 75 C 15 55 -5 65 -20 75 C -10 90 15 90 35 75 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.5" />
              <path d="M 40 115 C 10 118 -8 135 2 145 C 20 142 35 130 40 115 Z" fill="url(#goldLeafGradBackPdf)" stroke="#5B3E12" stroke-width="0.5" />
            </g>
            <g transform="translate(18, 52)">
              <path d="M -5 18 C -10 10 -2 0 8 4 C 14 8 10 20 -5 18 Z" fill="url(#goldLeafGradBackPdf)" stroke="#7E5F22" stroke-width="0.5" />
              <path d="M 0 14 C -3 5 4 -3 14 0 C 18 4 14 18 0 14 Z" fill="url(#flowerPetalGradPdf)" stroke="#B38A3A" stroke-width="0.6" />
              <path d="M 3 10 C 1 2 9 -1 12 2" stroke="#CA9E4F" stroke-width="0.5" fill="none" />
            </g>
            <g transform="translate(85, 82)">
              <path d="M -48 -8 C -62 -35 -30 -60 0 -54 C 30 -60 62 -35 48 -8 C 62 20 30 52 0 46 C -30 52 -62 20 -48 -8 Z" fill="url(#flowerPetalShadowPdf)" stroke="#B88E3E" stroke-width="0.8" />
              <path d="M -38 -20 C -48 -45 -18 -55 0 -48 C 18 -55 48 -45 38 -20 C 48 5 22 35 0 28 C -22 35 -48 5 -38 -20 Z" fill="url(#flowerPetalGradPdf)" stroke="#C89D4B" stroke-width="0.8" />
              <path d="M -30 0 C -40 -20 -15 -35 0 -30 C 15 -35 40 -20 30 0 C 40 20 15 35 0 30 C -15 35 -40 20 -30 0 Z" fill="#FFFDF9" stroke="#C49A46" stroke-width="0.7" />
              <path d="M -20 -12 C -28 -28 -5 -30 0 -22 C 5 -30 28 -28 20 -12 C 28 8 5 22 0 16 C -5 22 -28 8 -20 -12 Z" fill="url(#flowerPetalGradPdf)" stroke="#BA8E3C" stroke-width="0.7" />
              <path d="M -14 0 C -18 -10 -6 -18 0 -15 C 6 -18 18 -10 14 0 C 18 10 6 18 0 15 C -6 18 -18 10 -14 0 Z" fill="url(#flowerPetalShadowPdf)" stroke="#A07628" stroke-width="0.75" />
              <path d="M -8 -4 C -10 -9 -3 -12 0 -10 C 3 -12 10 -9 8 -4 C 10 3 3 8 0 6 C -3 8 -10 3 -8 -4 Z" fill="#FFFBF5" stroke="#A07628" stroke-width="0.6" />
              <circle cx="0" cy="0" r="8" fill="#CAA04A" stroke="#8C6826" stroke-width="0.7" />
              <circle cx="-3" cy="-3" r="1.4" fill="#FFF7E6" />
              <circle cx="3" cy="-2" r="1.3" fill="#FFF7E6" />
              <circle cx="-2" cy="3" r="1.2" fill="#755015" />
              <circle cx="3" cy="2" r="1.2" fill="#755015" />
              <circle cx="0" cy="0" r="1.5" fill="#FFEBB8" />
            </g>
          </g>
        </svg>
        ${showEnglishNote ? `
          <div style="position:absolute; bottom:8px; left:10px; text-align:left; pointer-events:none; z-index:10; font-family:'Playfair Display', 'Cinzel', Georgia, serif; color:#FFF8EB; font-size:5.5pt; font-weight:500; line-height:1.2; text-shadow:0 1px 3px rgba(45,30,10,0.75);">
            ${englishNoteText.split('\n').map(l => `<div>${l}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    const botanicalPurpleCrestSvg = (color: string) => `
      <svg width="40" height="34" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M40 70 C38 52 42 38 48 24 C52 14 62 8 60 5 C56 2 46 8 38 20 C32 30 30 46 36 70 Z" fill="${color}" fill-opacity="0.8" />
        <path d="M48 24 C46 16 54 10 50 6 C44 4 38 12 36 22 C34 32 37 45 40 55" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="56" cy="12" r="2.5" fill="${color}" />
        <circle cx="48" cy="6" r="1.5" fill="${color}" />
      </svg>
    `;

    const burgundyMonogramCrestSvg = (color: string) => `
      <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <circle cx="50" cy="50" r="38" stroke="${color}" stroke-width="1.8" stroke-dasharray="3 2" />
        <circle cx="50" cy="50" r="34" stroke="${color}" stroke-width="0.9" />
        <path d="M50 14 C46 10 54 10 50 6" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />
        <path d="M50 86 C46 90 54 90 50 94" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />
        <path d="M14 50 C10 46 10 54 6 50" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />
        <path d="M86 50 C90 46 90 54 94 50" stroke="${color}" stroke-width="1.4" stroke-linecap="round" />
        <path d="M52 28 C45 34 42 42 43 54 C44 64 50 72 58 72 C64 72 67 66 65 60 C62 52 52 50 47 48 C42 46 38 42 40 36 C42 30 48 26 56 26" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none" />
      </svg>
    `;

    const callaSageTopCalligraphySvg = (color: string) => `
      <svg width="84" height="26" viewBox="0 0 140 45" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M15 28 C20 18 28 15 35 22 C42 30 48 30 52 24 C56 16 62 14 68 20 C74 27 82 25 88 18 C94 12 102 14 108 22 C114 30 125 28 130 20" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <circle cx="35" cy="12" r="2.5" fill="${color}" />
        <circle cx="70" cy="10" r="2.5" fill="${color}" />
        <circle cx="106" cy="10" r="2.5" fill="${color}" />
      </svg>
    `;

    const sculptedCallaMotifSvg = () => `
      <svg width="22" height="30" viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto;">
        <path d="M25 65 C25 45 26 35 25 28" stroke="#4d7c0f" stroke-width="2.2" stroke-linecap="round" />
        <path d="M25 45 C28 40 32 38 35 39 C34 44 30 46 25 45 Z" fill="#65a30d" />
        <path d="M25 28 C20 18 16 8 22 2 C28 -3 34 5 32 14 C30 20 27 24 25 28 Z" fill="#fffefb" stroke="#d1d5db" stroke-width="0.8" />
        <path d="M22 2 C16 10 20 22 25 28 C27 22 30 16 28 8 C26 2 24 -1 22 2 Z" fill="#fbf7ee" />
        <path d="M24 20 L25 8" stroke="#eab308" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;

    const weddingEtiquetteIconsSvg = (color: string) => `
      <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:3px;">
        <div style="display:flex; align-items:center; justify-content:center;" title="ممنوع التصوير">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="1.5" />
            <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="${color}" stroke-width="1.5" />
            <rect x="7" y="8" width="10" height="8" rx="1.5" stroke="${color}" stroke-width="1.2" />
            <circle cx="12" cy="12" r="2" stroke="${color}" stroke-width="1.2" />
          </svg>
        </div>
        <div style="display:flex; align-items:center; justify-content:center;" title="جنة الأطفال منازلهم">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="1.5" />
            <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="${color}" stroke-width="1.5" />
            <circle cx="12" cy="8.5" r="2" stroke="${color}" stroke-width="1.2" />
            <path d="M8.5 15.5 C9.5 13 11 12 13.5 12" stroke="${color}" stroke-width="1.2" stroke-linecap="round" />
            <circle cx="9" cy="16" r="1.3" fill="${color}" />
            <circle cx="15" cy="16" r="1.3" fill="${color}" />
          </svg>
        </div>
      </div>
    `;

    const renderWeddingRichBackgroundHtml = (theme: string) => {
      if (theme === 'wedding_golden_floral') {
        return `
          <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
            <svg viewBox="0 0 400 240" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="goldWaveGradPdf" x1="0%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stop-color="#C89D4B" />
                  <stop offset="18%" stop-color="#E9D396" />
                  <stop offset="42%" stop-color="#BA8E3C" />
                  <stop offset="68%" stop-color="#F5E4B5" />
                  <stop offset="88%" stop-color="#A3782B" />
                  <stop offset="100%" stop-color="#7E591A" />
                </linearGradient>
                <linearGradient id="goldLeafGradPdf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#DFC386" />
                  <stop offset="35%" stop-color="#C99E48" />
                  <stop offset="70%" stop-color="#A4792B" />
                  <stop offset="100%" stop-color="#735118" />
                </linearGradient>
                <linearGradient id="goldHighlightGradPdf" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#FFF4D4" />
                  <stop offset="50%" stop-color="#ECCF8E" />
                  <stop offset="100%" stop-color="#C49B48" />
                </linearGradient>
                <linearGradient id="cardSurfaceGradPdf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FCFAF7" />
                  <stop offset="50%" stop-color="#FAF7F2" />
                  <stop offset="100%" stop-color="#F6F1E8" />
                </linearGradient>
              </defs>
              <rect width="400" height="240" fill="url(#cardSurfaceGradPdf)" />
              <rect x="1.5" y="1.5" width="397" height="237" rx="8" stroke="#E5D6BA" stroke-width="0.8" fill="none" opacity="0.6" />

              <!-- Left Side: Metallic Wave -->
              <path d="M0 0 L84 0 C54 38 32 85 45 132 C58 178 44 212 0 240 L0 0 Z" fill="url(#goldWaveGradPdf)" />
              <path d="M84 0 C54 38 32 85 45 132 C58 178 44 212 0 240" stroke="url(#goldHighlightGradPdf)" stroke-width="1.6" fill="none" />
              <path d="M92 0 C61 42 38 88 52 133 C66 181 50 216 4 240" stroke="#CAA256" stroke-width="0.75" fill="none" opacity="0.75" />
              <path d="M97 0 C66 45 43 91 57 134 C71 183 55 219 9 240" stroke="#DFC285" stroke-width="0.5" stroke-dasharray="2.5, 2.5" fill="none" opacity="0.5" />

              <!-- Laurel Branch -->
              <g transform="translate(14, 18)">
                <path d="M 12 195 C 8 155 16 112 28 72 C 34 44 29 20 22 5" stroke="url(#goldLeafGradPdf)" stroke-width="2" stroke-linecap="round" />
                <path d="M 22 5 C 29 -3 39 4 34 16 C 28 15 23 10 22 5 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 22 5 Q 29 8 34 16" stroke="#FFF7E6" stroke-width="0.7" opacity="0.8" />
                <path d="M 25 26 C 16 20 10 28 15 37 C 20 35 24 31 25 26 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 27 28 C 38 22 45 32 39 43 C 33 40 29 35 27 28 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 29 54 C 18 47 11 58 17 67 C 23 65 28 60 29 54 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 30 58 C 42 50 51 61 44 73 C 38 70 33 65 30 58 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 27 88 C 15 80 8 92 15 101 C 21 98 26 94 27 88 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 28 92 C 40 83 49 95 41 107 C 35 104 31 99 28 92 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 22 124 C 11 117 5 128 12 137 C 18 134 21 129 22 124 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 23 128 C 35 120 42 132 34 143 C 29 140 25 135 23 128 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 16 158 C 7 152 2 163 9 171 C 14 168 16 163 16 158 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
                <path d="M 17 162 C 28 156 34 167 27 176 C 22 173 19 168 17 162 Z" fill="url(#goldLeafGradPdf)" stroke="#6C4D15" stroke-width="0.4" />
              </g>

              <!-- Bottom Right Hairline Accent -->
              <path d="M 290 240 C 330 235 365 215 385 180 C 395 160 398 140 400 130" stroke="url(#goldHighlightGradPdf)" stroke-width="1.2" fill="none" opacity="0.85" />
              <path d="M 305 240 C 342 236 374 218 392 186 C 399 172 400 156 400 148" stroke="#CAA256" stroke-width="0.6" stroke-dasharray="3, 3" fill="none" opacity="0.55" />
            </svg>
          </div>
        `;
      }
      if (theme === 'wedding_botanical_purple') {
        return `
          <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
            <div style="position:absolute; inset:0; background:radial-gradient(circle at 50% 30%, #ffffff 0%, #FAF8F5 65%, #F4EFEB 100%);"></div>
            <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" style="position:absolute; bottom:0; left:0; right:0; width:100%; height:45%; pointer-events:none;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="purpleGradPdf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.85" />
                  <stop offset="60%" stop-color="#6d28d9" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.95" />
                </linearGradient>
                <linearGradient id="leafGradPdf" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#a3e635" stop-opacity="0.8" />
                  <stop offset="100%" stop-color="#4d7c0f" stop-opacity="0.9" />
                </linearGradient>
              </defs>
              <path d="M-10 200 C30 140 70 120 120 160 C150 180 180 190 220 150 C260 110 320 130 360 170 C380 190 400 170 420 200 Z" fill="url(#leafGradPdf)" fill-opacity="0.45" />
              <circle cx="50" cy="165" r="30" fill="url(#purpleGradPdf)" />
              <circle cx="75" cy="180" r="26" fill="url(#purpleGradPdf)" fill-opacity="0.9" />
              <circle cx="340" cy="165" r="32" fill="url(#purpleGradPdf)" />
              <circle cx="365" cy="180" r="28" fill="url(#purpleGradPdf)" fill-opacity="0.9" />
              <circle cx="65" cy="160" r="3.5" fill="#fbbf24" />
              <circle cx="72" cy="155" r="2.5" fill="#fef08a" />
              <circle cx="330" cy="160" r="3.5" fill="#fbbf24" />
              <circle cx="340" cy="155" r="2.5" fill="#fef08a" />
            </svg>
          </div>
        `;
      }
      if (theme === 'wedding_royal_burgundy') {
        return `
          <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
            <div style="position:absolute; inset:0; background:linear-gradient(180deg, #FFFFFF 0%, #FFFDFD 50%, #FFF5F6 100%);"></div>
            <svg viewBox="0 0 300 400" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:0.18;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#881337" stroke-width="1.1" fill="none">
                <path d="M-20 40 C20 10 50 30 30 70 C10 110 60 120 70 80 C80 40 40 20 20 -10" />
                <path d="M220 -20 C260 20 290 5 280 50 C270 95 310 100 320 60" />
                <path d="M-10 320 C30 290 60 310 40 350 C20 390 70 410 80 370" />
                <path d="M230 330 C270 300 300 320 280 360 C260 400 310 410 320 370" />
              </g>
            </svg>
          </div>
        `;
      }
      if (theme === 'wedding_calla_sage') {
        return `
          <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
            <div style="position:absolute; inset:0; background:radial-gradient(circle at 50% 25%, rgba(255,255,255,0.95) 0%, rgba(247,250,247,0.85) 60%, rgba(240,245,238,0.7) 100%);"></div>
            <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" style="position:absolute; bottom:0; left:0; right:0; width:100%; height:45%; pointer-events:none;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(110, 60)">
                <path d="M50 180 C48 130 52 90 54 65" stroke="#4d7c0f" stroke-width="6" stroke-linecap="round" />
                <path d="M54 65 C40 45 30 20 48 5 C62 -10 75 10 70 30 C66 45 60 55 54 65 Z" fill="#ffffff" stroke="#c5d1be" stroke-width="1.2" />
                <path d="M52 45 L54 18" stroke="#ca8a04" stroke-width="4" stroke-linecap="round" />
              </g>
              <g transform="translate(200, 75)">
                <path d="M40 165 C42 120 38 85 36 60" stroke="#4d7c0f" stroke-width="5.5" stroke-linecap="round" />
                <path d="M36 60 C24 40 18 15 32 2 C44 -10 56 8 52 26 C48 40 42 50 36 60 Z" fill="#ffffff" stroke="#c5d1be" stroke-width="1.2" />
                <path d="M34 42 L36 16" stroke="#ca8a04" stroke-width="3.5" stroke-linecap="round" />
              </g>
              <path d="M-20 240 C10 160 30 110 80 80 C65 120 45 180 20 240 Z" fill="#365314" fill-opacity="0.7" />
              <path d="M420 240 C390 160 370 110 320 80 C335 120 355 180 380 240 Z" fill="#365314" fill-opacity="0.7" />
            </svg>
          </div>
        `;
      }
      if (theme === 'wedding_sculpted_ivory') {
        return `
          <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0;">
            <div style="position:absolute; inset:0; background:linear-gradient(180deg, #FBF8F3 0%, #F5EFEB 40%, #EFE8DE 100%);"></div>
            <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMin slice" style="position:absolute; top:0; left:0; right:0; width:100%; height:42%; pointer-events:none;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-20 -10 C60 60 140 70 200 40 C260 10 340 50 420 -10 L420 80 C340 130 260 110 200 120 C140 130 60 110 -20 80 Z" fill="#ffffff" fill-opacity="0.85" />
              <path d="M0 20 C80 90 150 95 200 70 C250 45 320 80 400 30" stroke="#d5c7b3" stroke-width="8" stroke-linecap="round" fill="none" />
              <g transform="translate(180, 20)">
                <path d="M20 70 C10 45 5 20 18 5 C28 -8 38 10 34 30 C30 45 25 58 20 70 Z" fill="#ffffff" stroke="#d8cab8" stroke-width="1.2" />
                <path d="M19 45 L20 20" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" />
              </g>
            </svg>
          </div>
        `;
      }
      return '';
    };

    const renderCornersHtml = (theme: string) => {
      if (
        theme === 'wedding_golden_floral' ||
        theme === 'wedding_botanical_purple' ||
        theme === 'wedding_royal_burgundy' ||
        theme === 'wedding_calla_sage' ||
        theme === 'wedding_sculpted_ivory'
      ) {
        return '';
      }

      let cornerFn = andalusianCornerSvg;
      if (theme === 'wedding_damask') cornerFn = damaskCornerSvg;
      else if (theme === 'wedding_imperial' || theme === 'graduation_royal' || theme === 'graduation_classic' || theme === 'graduation' || theme === 'royal_graduation') cornerFn = imperialCornerSvg;
      else if (theme === 'wedding_minimal_luxury') cornerFn = minimalKnotCornerSvg;

      const pri = palette.frameBorderOuter;
      const acc = palette.cornerBorder;

      return `
        <div style="position:absolute; top:2px; left:2px; pointer-events:none; z-index:1;">${cornerFn(pri, acc)}</div>
        <div style="position:absolute; top:2px; right:2px; transform:scaleX(-1); pointer-events:none; z-index:1;">${cornerFn(pri, acc)}</div>
        <div style="position:absolute; bottom:2px; left:2px; transform:scaleY(-1); pointer-events:none; z-index:1;">${cornerFn(pri, acc)}</div>
        <div style="position:absolute; bottom:2px; right:2px; transform:scale(-1,-1); pointer-events:none; z-index:1;">${cornerFn(pri, acc)}</div>
      `;
    };

    const renderTopCrestHtml = (theme: string) => {
      if (theme === 'wedding_golden_floral') return '';
      const pri = palette.headerText;
      const acc = palette.accentText;
      if (theme === 'wedding_botanical_purple') return botanicalPurpleCrestSvg(pri);
      if (theme === 'wedding_royal_burgundy') return burgundyMonogramCrestSvg(pri);
      if (theme === 'wedding_calla_sage') return callaSageTopCalligraphySvg(pri);
      if (theme === 'wedding_sculpted_ivory') return sculptedCallaMotifSvg();
      if (theme === 'wedding_damask') return damaskFloralCrestSvg(pri, acc);
      if (theme === 'wedding_imperial') return imperialCrownCrestSvg(pri, acc);
      if (theme === 'wedding_minimal_luxury') return minimalDiamondCrestSvg(pri, acc);
      if (theme === 'graduation_royal' || theme === 'graduation_classic' || theme === 'graduation' || theme === 'royal_graduation') return graduationLaurelCrestSvg(pri, acc);
      if (theme === 'dinner_royal' || theme === 'dinner_classic' || theme === 'dinner') return dinnerBanquetCrestSvg(pri, acc);
      return andalusianArchCrestSvg(pri, acc);
    };

    // Helper to render built-in embroidered template Front Card
    const renderPresetFrontCard = (inv: Invitation | null) => {
      if (!inv) {
        return `<div class="card-cell" style="opacity:0;"></div>`;
      }
      const qrDataUrl = qrImages[inv.id] || '';
      const guestName = inv.guest_name && inv.guest_name.trim();
      const theme = settings.cardTheme || 'wedding_botanical_purple';
      const isImperial = theme === 'wedding_imperial';

      const isBespokeWedding = 
        theme === 'wedding_botanical_purple' ||
        theme === 'wedding_royal_burgundy' ||
        theme === 'wedding_calla_sage' ||
        theme === 'wedding_sculpted_ivory';

      const coupleTitle = (settings.weddingTitleType || 'couple_names') === 'couple_names'
        ? `${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}`
        : (event.name || 'حفل زفاف مبارك');

      let welcomeText = settings.welcomeText;
      if (!welcomeText) {
        if (theme === 'wedding_botanical_purple') welcomeText = 'بـطـاقـة دخـول';
        else if (theme === 'wedding_royal_burgundy') welcomeText = 'دعوة لحضور زفاف';
        else if (theme === 'wedding_calla_sage') welcomeText = 'دعوة زفاف';
        else if (theme === 'wedding_sculpted_ivory') welcomeText = 'تـمّ بـحـمـدِ اللهِ عَـقـد قِـران';
        else if (theme === 'wedding_damask') welcomeText = 'دعوة زفاف كريمة';
        else if (theme === 'wedding_imperial') welcomeText = 'دعوة لحضور حفل القران المبارك';
        else if (theme === 'wedding_minimal_luxury') welcomeText = 'دعوة زفاف رسمية';
        else if (theme.startsWith('graduation')) welcomeText = 'حَفْلُ تَخَرُّجْ وتكريم';
        else if (theme.startsWith('dinner')) welcomeText = 'دعوة لتناول طعام العشاء';
        else welcomeText = 'دعوة لحضور حفل زفاف';
      }

      let subText = settings.customSubtitle;
      if (!subText) {
        if (theme === 'wedding_botanical_purple') subText = 'الرجاء تمرير الباركود على القارئ للدخول';
        else if (theme === 'wedding_royal_burgundy') subText = 'وبحضوركم يتم لنا الفرح والسرور';
        else if (theme === 'wedding_calla_sage') subText = 'بدعوتكم لحضور حفل زفافهما';
        else if (theme === 'wedding_sculpted_ivory') subText = 'اللّهم أتمّ عليهم السعادة والهناء';
        else if (theme === 'wedding_damask') subText = 'دامت دياركم عامرة بالأفراح والمسرات';
        else if (theme === 'wedding_imperial') subText = 'شرفونا بحضوركم الكريم لمشاركتنا فرحة العمر';
        else if (theme === 'wedding_minimal_luxury') subText = 'بحضوركم تكتمل الأفراح ونسعد بتشريفكم';
        else if (theme.startsWith('graduation')) subText = 'يسرنا مشاركتكم فرحة التخرج والنجاح';
        else if (theme.startsWith('dinner')) subText = 'يشرّفنا حضوركم وتلبية دعوتنا الكريمة';
        else subText = 'بارك الله لهما وبارك عليهما وجمع بينهما في خير';
      }

      if (theme === 'wedding_golden_floral') {
        const guestDisplayName = guestName || settings.generalCardNotice || 'دعوة عامة';
        return `
          <div class="card-cell">
            <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg || '#FCFAF7'}; border: 1px solid rgba(190, 155, 95, 0.45); overflow:hidden;">
              ${renderWeddingRichBackgroundHtml(theme)}
              <div class="card-content" style="position:relative; z-index:1; direction: ltr; display:flex; flex-direction:row; align-items:center; justify-content:space-between; height:100%; padding: 2.5px 5px; box-sizing:border-box;">
                <!-- 1. Left Breathing Margin over gold wave graphic -->
                <div style="width: 19%; flex-shrink: 0; pointer-events: none;"></div>

                <!-- 2. Center Column: Monogram + Title + Hero Names + Subtitle + Guest Pill + Details + Footer -->
                <div style="direction: rtl; flex: 1; display:flex; flex-direction:column; align-items:center; justify-content:space-between; text-align:center; height:100%; padding: 1px 2px; min-width:0; box-sizing:border-box;">
                  ${settings.monogramEnabled !== false ? `
                    <div style="margin-bottom: 0px; transform: scale(0.95);">
                      ${initialsMonogramSvg(settings.monogramGroomInitial || 'A', settings.monogramBrideInitial || 'M', palette.accentText || '#8C6826')}
                    </div>
                  ` : '<div style="height:2px;"></div>'}

                  ${settings.welcomeText ? `
                    <div style="font-size: 5.5pt; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', serif; color: #3A2E20; line-height: 1.1;">
                      ${settings.welcomeText}
                    </div>
                  ` : ''}

                  <!-- Couple or Family Title -->
                  <div style="margin: 0.5px 0;">
                    ${settings.weddingTitleType === 'family_title' ? `
                      <div style="font-size: 7.2pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText || '#8C6826'}; line-height: 1.2;">
                        ${settings.familyTitleText || 'تتشرف أسرة أحمد سالم بدعوتكم لحضور حفل زفاف ابنهم'}
                      </div>
                    ` : settings.weddingTitleType === 'event_name' ? `
                      <div style="font-size: 7.8pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText || '#8C6826'}; line-height: 1.2;">
                        ${event.name || 'حفل زفاف مبارك'}
                      </div>
                    ` : `
                      <div style="font-size: 9.8pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText || '#8C6826'}; line-height: 1.05;">
                        ${settings.groomName || 'أحمد'} & ${settings.brideName || 'ماريا'}
                      </div>
                      ${settings.showHeartIcon !== false ? goldenHeartIconSvg(palette.accentText || '#BFA063') : ''}
                    `}
                  </div>

                  ${settings.customSubtitle ? `
                    <div style="font-size: 5pt; font-weight: 500; font-family: 'Amiri', serif; color: #564536; line-height: 1.1; margin-top: -1px;">
                      ${settings.customSubtitle}
                    </div>
                  ` : ''}

                  <!-- Guest Name Capsule / Pill -->
                  <div style="margin: 0.5px 0; max-width: 96%;">
                    <div style="display:inline-block; padding: 1.2px 10px; border-radius: 9999px; background-color: ${palette.badgeBg || '#EDE5D8'}; border: 1px solid ${palette.badgeBorder || '#D8CAB8'}; color: ${palette.badgeText || '#281E14'}; font-size: 6.8pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      ${settings.guestPrefixEnabled !== false && settings.guestPrefixText ? `<span style="font-size: 5.8pt; font-weight: 600; margin-left: 2px;">${settings.guestPrefixText}</span>` : ''}
                      <span>${guestDisplayName}</span>
                    </div>
                  </div>

                  <!-- 3-Column Info Strip -->
                  ${((settings.showDate !== false && eventDate) || (settings.showTime !== false && eventTime) || (settings.showVenue !== false && eventVenue)) ? `
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; width: 100%; font-size: 4.8pt; color: #2D2115; padding: 0 1px; margin-top: 0.5px;">
                      ${settings.showDate !== false && eventDate ? `
                        <div style="flex:1; text-align:center; line-height:1.1;">
                          <div style="font-size:4.5pt; font-weight:bold; color:#5A4836;">📅 ${eventDayName || 'السبت'}</div>
                          <div style="font-size:4.8pt; font-weight:bold; font-family:monospace; margin-top:0.5px;">${eventDateOnly || eventDate}</div>
                        </div>
                      ` : '<div style="flex:1;"></div>'}

                      ${settings.showTime !== false && eventTime ? `
                        <div style="flex:1; text-align:center; line-height:1.1;">
                          <div style="font-size:4.5pt; font-weight:bold; color:#5A4836;">🕒 الساعة</div>
                          <div style="font-size:4.8pt; font-weight:bold; margin-top:0.5px;">${eventTime}</div>
                        </div>
                      ` : '<div style="flex:1;"></div>'}

                      ${settings.showVenue !== false && eventVenue ? `
                        <div style="flex:1; text-align:center; line-height:1.1; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                          <div style="font-size:4.5pt; font-weight:bold; color:#5A4836; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${venuePrimary || eventVenue}</div>
                          ${venueSecondary ? `<div style="font-size:4.2pt; font-weight:bold; margin-top:0.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${venueSecondary}</div>` : ''}
                        </div>
                      ` : '<div style="flex:1;"></div>'}
                    </div>
                  ` : ''}

                  <!-- Footer Divider -->
                  ${settings.showFooterDivider !== false ? goldenFooterDividerSvg(settings.footerDividerText || 'بحضوركم تكتمل فرحتنا', palette.accentText || '#8C6D34') : ''}
                </div>

                <!-- 3. Right Column: Framed QR Box + Instruction + Serial -->
                <div style="direction: rtl; width: 60px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; flex-shrink:0; padding-right: 1px;">
                  <div style="padding: 2.5px; border-radius: 9px; border: 1.5px solid ${palette.qrBorder || '#C49E4F'}; background-color: #ffffff; box-shadow: 0 1px 4px rgba(140, 109, 52, 0.1);">
                    <img src="${qrDataUrl}" style="width: ${qrSizePx}px; height: ${qrSizePx}px; display:block; object-fit:contain;" />
                  </div>
                  ${settings.qrInstructionText ? `
                    <div style="font-size: 4.8pt; font-weight: bold; font-family: 'Amiri', serif; color: #5D4624; margin-top: 1.5px; line-height: 1.1;">
                      ${settings.qrInstructionText}
                    </div>
                  ` : ''}
                  ${settings.showInvitationNumber ? `
                    <div style="font-weight:bold; font-family:monospace; color: #382B18; font-size: 5.5pt; margin-top: 0.5px;">
                      #${String(inv.invitation_number).padStart(3, '0')}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      if (isLandscape) {
        return `
          <div class="card-cell">
            <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg}; border: 1.5px solid ${palette.frameBorderOuter}; overflow:hidden;">
              ${renderWeddingRichBackgroundHtml(theme)}
              ${renderCornersHtml(theme)}

              <div class="card-content" style="position:relative; z-index:1; display:flex; flex-direction:column; justify-content:space-between; height:100%; padding: 4px 6px;">
                <div style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; flex:1; gap:6px;">
                  <!-- Right Side (يمين): Texts & Details -->
                  <div style="flex:1; text-align:center; display:flex; flex-direction:column; justify-content:center;">
                    <div>
                      ${renderTopCrestHtml(theme)}
                      <div style="font-size: ${welcomeFontPt * 0.9}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText}; margin-top: 1px;">
                        ${isBespokeWedding ? coupleTitle : welcomeText}
                      </div>
                      ${isBespokeWedding ? `
                        <div style="font-size: 6.5pt; font-weight: bold; color: ${palette.subText}; margin-top: 0.5px;">
                          ${welcomeText}
                        </div>
                      ` : (settings.showEventName && event.name ? `
                        <div style="font-size: 6.5pt; font-weight: 800; color: #1e293b; margin-top: 0.5px;">
                          ${event.name}
                        </div>
                      ` : '')}
                    </div>

                    <div style="margin: 2px 0;">
                      ${guestName ? `
                        <div style="font-size: 6pt; color: #475569; font-weight: 600;">
                          ${settings.guestPrefixText || (theme.startsWith('dinner') ? 'يسعدنا تشريف وحضور المكرم/ـة:' : 'تتشرف الأسرة الكريمة بدعوة المكرم/ـة:')}
                        </div>
                        <div style="margin: 1px 0;">
                          <div style="display:inline-block; font-size: ${badgeFontPt * 0.95}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText};">
                            ${guestName}
                          </div>
                        </div>
                      ` : !isBespokeWedding ? `
                        <div style="font-size: 6pt; color: #475569; font-weight: 600;">
                          ${settings.generalCardNotice || (theme.startsWith('dinner') ? 'يسرنا دعوتكم لتناول طعام العشاء' : 'يسرنا ويشرفنا دعوتكم لحضور')}
                        </div>
                        <div style="margin: 1px 0;">
                          <div style="display:inline-block; font-size: ${badgeFontPt * 0.9}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText};">
                            ${event.name || 'المناسبة'}
                          </div>
                        </div>
                      ` : ''}
                      <div style="font-size: 5pt; color: #64748b; margin-top: 1px;">
                        ${subText}
                      </div>
                    </div>
                  </div>

                  <!-- Left Side (يسار): QR Code & instructions -->
                  <div style="width: auto; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; shrink: 0;">
                    <div style="display:inline-block; padding: 2px; border-radius: 8px; border: 1px solid ${palette.frameBorderOuter}40; background-color: ${palette.qrBoxBg};">
                      <img src="${qrDataUrl}" style="width: ${qrSizePx}px; height: ${qrSizePx}px; display: block; object-fit: contain;" />
                    </div>
                    <div style="font-size: 5pt; font-weight: bold; color: ${palette.accentText}; margin-top: 1px;">${(settings.qrInstructionText === 'للدخول يرجى إبراز هذا الرمز عند البوابة' ? 'يرجى إبراز الرمز للدخول' : settings.qrInstructionText) || 'يرجى إبراز الرمز للدخول'}</div>
                    ${settings.showInvitationNumber ? `
                      <div style="font-weight:bold; font-family:monospace; color: ${palette.accentText}; font-size: 6pt; margin-top: 0.5px;">#${String(inv.invitation_number).padStart(3, '0')}</div>
                    ` : ''}
                  </div>
                </div>

                <!-- Bottom Details & Event Info Strip -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding-top: 1.5px; font-size: 5pt; color: #64748b;">
                  <span>${settings.footerNoteText || (isBespokeWedding ? (theme === 'wedding_sculpted_ivory' ? 'اللّهم أتمّ عليهم السعادة والهناء' : theme === 'wedding_royal_burgundy' ? 'وبحضوركم يتم لنا الفرح والسرور' : 'بحضوركم تكتمل فرحتنا') : (theme === 'wedding_damask' ? 'حضوركم يزيّن ليلتنا' : theme === 'wedding_imperial' ? 'شرفونا بحضوركم' : theme.startsWith('dinner') ? 'أهلاً بالضيوف الكرام' : theme.startsWith('graduation') ? 'فرحة نجاح وسرور' : 'بحضوركم تكتمل فرحتنا'))}</span>
                  ${(eventVenue || eventDate || eventTime) ? `
                    <span style="font-size: 4.8pt; color: #334155; font-weight: 600;">
                      ${[eventVenue ? `📍 ${eventVenue}` : '', eventDate ? `🗓️ ${eventDate}` : '', eventTime ? `⏰ ${eventTime}` : ''].filter(Boolean).join(' • ')}
                    </span>
                  ` : ''}
                </div>
                ${isBespokeWedding && settings.showEtiquetteIcons !== false ? weddingEtiquetteIconsSvg(palette.headerText) : ''}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="card-cell">
          <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg}; border: 1.5px solid ${palette.frameBorderOuter}; overflow:hidden;">
            ${renderWeddingRichBackgroundHtml(theme)}
            ${renderCornersHtml(theme)}

            <div class="card-content" style="position:relative; z-index:1;">
              <div style="text-align: center; margin-top: 1px;">
                ${renderTopCrestHtml(theme)}
                <div style="font-size: ${welcomeFontPt}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText}; margin-top: 2px;">
                  ${isBespokeWedding ? coupleTitle : welcomeText}
                </div>
                ${isBespokeWedding ? `
                  <div style="font-size: 7pt; font-weight: bold; color: ${palette.subText}; margin-top: 1px;">
                    ${welcomeText}
                  </div>
                ` : (settings.showEventName && event.name ? `
                  <div style="font-size: 7pt; font-weight: 800; color: #1e293b; margin-top: 1px;">
                    ${event.name}
                  </div>
                ` : '')}
              </div>

              <div style="margin: 2px 0; text-align: center;">
                ${guestName ? `
                  <div style="font-size: 6.5pt; color: #475569; font-weight: 600;">
                    ${settings.guestPrefixText || (theme.startsWith('dinner') ? 'يسعدنا تشريف وحضور المكرم/ـة:' : 'تتشرف الأسرة الكريمة بدعوة المكرم/ـة:')}
                  </div>
                  <div style="margin: 2px 0;">
                    <div style="display:inline-block; font-size: ${badgeFontPt * 1.05}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText};">
                      ${guestName}
                    </div>
                  </div>
                ` : !isBespokeWedding ? `
                  <div style="font-size: 6.5pt; color: #475569; font-weight: 600;">
                    ${settings.generalCardNotice || (theme.startsWith('dinner') ? 'يسرنا دعوتكم لتناول طعام العشاء' : 'يسرنا ويشرفنا دعوتكم لحضور')}
                  </div>
                  <div style="margin: 2px 0;">
                    <div style="display:inline-block; font-size: ${badgeFontPt * 0.95}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText};">
                      ${event.name || 'المناسبة'}
                    </div>
                  </div>
                ` : ''}

                <!-- Event Location, Date, Time Strip in Vertical/Square Card -->
                ${(eventVenue || eventDate || eventTime) ? `
                  <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-size: 5pt; color: #334155; font-weight: 600; margin: 1.5px 0;">
                    ${eventVenue ? `<span>📍 ${eventVenue}</span>` : ''}
                    ${eventDate ? `<span>🗓️ ${eventDate}</span>` : ''}
                    ${eventTime ? `<span>⏰ ${eventTime}</span>` : ''}
                  </div>
                ` : ''}

                <div style="font-size: 5.5pt; color: #64748b; margin-top: 1px;">
                  ${subText}
                </div>
              </div>

              <div style="margin: 1px auto; text-align: center;">
                <div style="display:inline-block; padding: 3px; border-radius: 8px; border: 1px solid ${palette.frameBorderOuter}40; background-color: ${palette.qrBoxBg};">
                  <img src="${qrDataUrl}" style="width: ${qrSizePx}px; height: ${qrSizePx}px; display: block; object-fit: contain;" />
                </div>
                <div style="font-size: 5.5pt; font-weight: bold; color: ${palette.accentText}; margin-top: 1px;">${(settings.qrInstructionText === 'للدخول يرجى إبراز هذا الرمز عند البوابة' ? 'يرجى إبراز الرمز للدخول' : settings.qrInstructionText) || 'يرجى إبراز الرمز للدخول'}</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; padding-top: 2px; font-size: 5pt; color: #64748b;">
                <span>${settings.footerNoteText || (isBespokeWedding ? (theme === 'wedding_sculpted_ivory' ? 'اللّهم أتمّ عليهم السعادة والهناء' : theme === 'wedding_royal_burgundy' ? 'وبحضوركم يتم لنا الفرح والسرور' : 'بحضوركم تكتمل فرحتنا') : (theme === 'wedding_damask' ? 'حضوركم يزيّن ليلتنا' : theme === 'wedding_imperial' ? 'شرفونا بحضوركم' : theme.startsWith('dinner') ? 'أهلاً بالضيوف الكرام' : theme.startsWith('graduation') ? 'فرحة نجاح وسرور' : 'بحضوركم تكتمل فرحتنا'))}</span>
                ${settings.showInvitationNumber ? `
                  <span style="font-weight:bold; font-family:monospace; color: ${palette.accentText}; font-size: 6pt;">#${String(inv.invitation_number).padStart(3, '0')}</span>
                ` : ''}
              </div>

              ${isBespokeWedding && settings.showEtiquetteIcons !== false ? weddingEtiquetteIconsSvg(palette.headerText) : ''}
            </div>
          </div>
        </div>
      `;
    };

    // Helper to render built-in embroidered template Back Card
    const renderPresetBackCard = (inv: Invitation | null) => {
      if (!inv) {
        return `<div class="card-cell" style="opacity:0;"></div>`;
      }
      const theme = settings.cardTheme || 'wedding_botanical_purple';
      const isImperial = theme === 'wedding_imperial';

      const isBespokeWedding = 
        theme === 'wedding_botanical_purple' ||
        theme === 'wedding_royal_burgundy' ||
        theme === 'wedding_calla_sage' ||
        theme === 'wedding_sculpted_ivory';

      const coupleTitle = (settings.weddingTitleType || 'couple_names') === 'couple_names'
        ? `${settings.groomName || 'العريس'} & ${settings.brideName || 'العروسة'}`
        : (event.name || 'حفل زفاف مبارك');

      let themeTitle = settings.backTitleText || (isBespokeWedding ? coupleTitle : (event.name || 'دعوة زفاف رسمية'));
      let themeHeader = settings.backHeaderText || (
        theme === 'wedding_sculpted_ivory' ? 'اللّهم بارك لهما وأتمّ عليهما السعادة والهناء' :
        theme === 'wedding_royal_burgundy' ? 'أذن لمراسيم الفرح أن تشرّع أبوابها' :
        theme === 'wedding_calla_sage' ? 'ولأن فرحتنا تكتمل بمن نحب يتشرفون بدعوتكم' :
        'بارك الله لهما وجمع بينهما في خير'
      );
      let themeMsg = settings.backMessageText || settings.customSubtitle || 'حضوركم يشرّفنا وتكتمل به فرحتنا وسرورنا';
      let themeBadge = settings.backBadgeText || (
        isBespokeWedding ? 'بطاقة دعوة زفاف خاصة' : 'بطاقة دعوة خاصة - لا تكرر'
      );

      if (!settings.backTitleText && !event.name && !isBespokeWedding) {
        if (theme === 'wedding_damask') themeTitle = 'دعوة زفاف كريمة';
        else if (theme === 'wedding_imperial') themeTitle = 'دعوة ملكية خاصة';
        else if (theme === 'wedding_minimal_luxury') themeTitle = 'فرحة زفاف مباركة';
        else if (theme.startsWith('graduation') || theme === 'royal_graduation') themeTitle = 'حفل تخرج وتكريم';
        else if (theme.startsWith('dinner')) themeTitle = 'مأدبة عشاء كريمة';
      }

      if (!settings.backHeaderText && !isBespokeWedding) {
        if (theme === 'wedding_damask') themeHeader = 'دامت دياركم عامرة بالأفراح والمسرات';
        else if (theme === 'wedding_imperial') themeHeader = 'شرفونا بحضوركم الكريم لمشاركتنا فرحة العمر';
        else if (theme === 'wedding_minimal_luxury') themeHeader = 'يسرنا دعوتكم لمشاركتنا أجمل اللحظات';
        else if (theme.startsWith('graduation') || theme === 'royal_graduation') themeHeader = 'فرحة نجاح وتخرج تتوج مسيرة السنين';
        else if (theme.startsWith('dinner')) themeHeader = 'يشرّفنا ويسعدنا تلبية دعوتنا الكريمة';
      }

      if (!settings.backMessageText && !settings.customSubtitle && !isBespokeWedding) {
        if (theme === 'wedding_damask') themeMsg = 'حضوركم يزيّن ليلتنا وتكتمل به سعادتنا وسرورنا';
        else if (theme === 'wedding_imperial') themeMsg = 'حضوركم شرف لنا وابتهاج لقلوبنا بدعوتكم الميمونة';
        else if (theme === 'wedding_minimal_luxury') themeMsg = 'أهلاً وسهلاً بكم في ليلة الفرح والسرور المبارك';
        else if (theme.startsWith('graduation') || theme === 'royal_graduation') themeMsg = 'يسرنا مشاركتكم فرحة التخرج والنجاح ودامت دياركم عامرة بالأفراح';
        else if (theme.startsWith('dinner')) themeMsg = 'أهلاً وسهلاً بكم وطاب ممشاكم بيننا بحلولكم الكريمة';
      }

      if (!settings.backBadgeText && !isBespokeWedding) {
        if (theme === 'wedding_damask') themeBadge = 'بطاقة زفاف خاصة';
        else if (theme === 'wedding_imperial') themeBadge = 'بطاقة دخول رسمية';
        else if (theme === 'wedding_minimal_luxury') themeBadge = 'بطاقة دعوة خاصة';
        else if (theme.startsWith('graduation') || theme === 'royal_graduation') themeBadge = 'بطاقة دخول حفل التخرج';
        else if (theme.startsWith('dinner')) themeBadge = 'بطاقة حضور مأدبة عشاء';
      }

      if (theme === 'wedding_golden_floral') {
        return `
          <div class="card-cell">
            <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg || '#FCFAF7'}; border: 1px solid rgba(190, 155, 95, 0.45); overflow:hidden;">
              ${goldenFloralBackBackgroundHtml(settings.showBackEnglishNote !== false, settings.backEnglishNoteText || 'A Special Day\nA Lasting Memory')}
              <div class="card-content" style="position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; height:100%; padding: 6px 12px;">
                <div style="max-width: 68%; margin: auto; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                  ${themeTitle ? `
                    <div style="font-size: 10pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText || '#8C6826'}; margin-bottom: 2px; line-height: 1.35; white-space: pre-line;">
                      ${themeTitle}
                    </div>
                  ` : ''}
                  ${settings.showHeartIcon !== false ? goldenHeartIconSvg(palette.accentText || '#BFA063') : ''}
                  ${themeHeader ? `
                    <div style="font-size: 7.8pt; font-weight: bold; color: #382B1C; font-family: 'Amiri', 'Traditional Arabic', serif; margin-top: 3px; line-height: 1.3;">
                      ${themeHeader}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      if (isLandscape) {
        return `
          <div class="card-cell">
            <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg}; border: 1.5px solid ${palette.frameBorderOuter}; overflow:hidden;">
              ${renderWeddingRichBackgroundHtml(theme)}
              ${renderCornersHtml(theme)}

              <div class="card-content" style="position:relative; z-index:1; padding: 4px 8px; justify-content: space-between; text-align: center; height: 100%; display: flex; flex-direction: column;">
                <div style="margin-top: 1px;">
                  ${renderTopCrestHtml(theme)}
                  <div style="font-size: ${welcomeFontPt * 0.85}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText}; margin-top: 1px;">
                    ${themeTitle}
                  </div>
                </div>

                <div style="margin: 2px 0;">
                  <div style="font-size: 7pt; font-weight: 800; color: ${palette.headerText}; line-height: 1.3; font-family: 'Amiri', serif;">
                    ${themeHeader}
                  </div>
                  <div style="width: 40px; height: 1px; background: ${palette.divider}; margin: 2px auto; border-radius: 2px;"></div>
                  <div style="font-size: 5.5pt; color: #475569; font-weight: 500; line-height: 1.2;">
                    ${themeMsg}
                  </div>

                  ${(eventVenue || eventDate || eventTime) ? `
                    <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-size: 4.8pt; color: #334155; font-weight: 600; margin-top: 2px;">
                      ${eventVenue ? `<span>📍 ${eventVenue}</span>` : ''}
                      ${eventDate ? `<span>🗓️ ${eventDate}</span>` : ''}
                      ${eventTime ? `<span>⏰ ${eventTime}</span>` : ''}
                    </div>
                  ` : ''}
                </div>

                <div style="margin-bottom: 1px; display:flex; align-items:center; justify-content:center; gap:6px;">
                  <div style="display:inline-block; padding: 1px 8px; border-radius: 10px; border: 1px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: 5.5pt; font-weight: bold;">
                    ${themeBadge}
                  </div>
                  ${settings.showInvitationNumber ? `
                    <span style="font-weight:bold; font-family:monospace; color: ${palette.accentText}; font-size: 5.5pt;">#${String(inv.invitation_number).padStart(3, '0')}</span>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="card-cell">
          <div class="royal-card" style="position:relative; width: ${targetCardW}mm; height: ${targetCardH}mm; max-width: 100%; max-height: 100%; margin: auto; background-color: ${palette.cardBg}; border: 1.5px solid ${palette.frameBorderOuter}; overflow:hidden;">
            ${renderWeddingRichBackgroundHtml(theme)}
            ${renderCornersHtml(theme)}

            <div class="card-content" style="position:relative; z-index:1; padding: 8px 6px; justify-content: space-between; text-align: center; height: 100%; display: flex; flex-direction: column;">
              <div style="margin-top: 2px;">
                ${renderTopCrestHtml(theme)}
                <div style="font-size: ${welcomeFontPt * 0.9}pt; font-weight: 900; font-family: 'Amiri', 'Traditional Arabic', serif; color: ${palette.headerText}; margin-top: 2px;">
                  ${themeTitle}
                </div>
              </div>

              <div style="margin: 4px 0;">
                <div style="font-size: 7.5pt; font-weight: 800; color: ${palette.headerText}; line-height: 1.4; font-family: 'Amiri', serif;">
                  ${themeHeader}
                </div>
                <div style="width: 50px; height: 1.5px; background: ${palette.divider}; margin: 3px auto; border-radius: 2px;"></div>
                <div style="font-size: 6.5pt; color: #475569; font-weight: 500; line-height: 1.3;">
                  ${themeMsg}
                </div>

                ${(eventVenue || eventDate || eventTime) ? `
                  <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-size: 5pt; color: #334155; font-weight: 600; margin-top: 3px;">
                    ${eventVenue ? `<span>📍 ${eventVenue}</span>` : ''}
                    ${eventDate ? `<span>🗓️ ${eventDate}</span>` : ''}
                    ${eventTime ? `<span>⏰ ${eventTime}</span>` : ''}
                  </div>
                ` : ''}
              </div>

              <div style="margin-bottom: 2px;">
                <div style="display:inline-block; padding: 2px 10px; border-radius: 12px; border: 1px solid ${palette.badgeBorder}; background-color: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: 6pt; font-weight: bold;">
                  ${themeBadge}
                </div>
                ${settings.showInvitationNumber ? `
                  <div style="font-weight:bold; font-family:monospace; color: ${palette.accentText}; font-size: 6pt; margin-top: 2px;">#${String(inv.invitation_number).padStart(3, '0')}</div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    };

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageInvitations = invitations.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);

      // CASE 1: CUSTOM UPLOADED IMAGE (FRONT & BACK DUPLEX OR SINGLE)
      if (settings.cardTheme === 'custom' && settings.customCardImage) {
        const hasBack = Boolean(settings.customCardBackImage);
        const mode = settings.doubleSidedMode || (hasBack ? 'duplex' : 'front_only');
        const qrSide = settings.customQrSide || 'front';

        if (mode === 'duplex' && hasBack) {
          // 1A. Front Sheet
          let frontCardsHtml = '';
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              const inv = pageInvitations[idx] || null;
              frontCardsHtml += renderCustomFace(settings.customCardImage, inv, qrSide === 'front');
            }
          }
          pagesHtml += `<div class="page">${frontCardsHtml}</div>`;

          // 1B. Back Sheet (Mirrored horizontally so front & back align perfectly when flipped on long edge)
          let backCardsHtml = '';
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const mirroredCol = cols - 1 - c;
              const idx = r * cols + mirroredCol;
              const inv = pageInvitations[idx] || null;
              backCardsHtml += renderCustomFace(settings.customCardBackImage!, inv, qrSide === 'back');
            }
          }
          pagesHtml += `<div class="page">${backCardsHtml}</div>`;
          continue;
        } else if (mode === 'back_only' && hasBack) {
          // 1C. Back only
          let backCardsHtml = '';
          for (let i = 0; i < cardsPerPage; i++) {
            const inv = pageInvitations[i] || null;
            backCardsHtml += renderCustomFace(settings.customCardBackImage!, inv, qrSide === 'back');
          }
          pagesHtml += `<div class="page">${backCardsHtml}</div>`;
          continue;
        } else {
          // 1D. Front only
          let frontCardsHtml = '';
          for (let i = 0; i < cardsPerPage; i++) {
            const inv = pageInvitations[i] || null;
            frontCardsHtml += renderCustomFace(settings.customCardImage, inv, qrSide === 'front');
          }
          pagesHtml += `<div class="page">${frontCardsHtml}</div>`;
          continue;
        }
      }

      // CASE 2 & 3: PRESET TEMPLATES
      const presetMode = settings.doubleSidedMode || 'front_only';

      if (presetMode === 'duplex') {
        // 2A. Front Sheet
        let frontCardsHtml = '';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const inv = pageInvitations[idx] || null;
            frontCardsHtml += renderPresetFrontCard(inv);
          }
        }
        pagesHtml += `<div class="page">${frontCardsHtml}</div>`;

        // 2B. Back Sheet (Mirrored horizontally so front & back align perfectly when flipped on long edge)
        let backCardsHtml = '';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const mirroredCol = cols - 1 - c;
            const idx = r * cols + mirroredCol;
            const inv = pageInvitations[idx] || null;
            backCardsHtml += renderPresetBackCard(inv);
          }
        }
        pagesHtml += `<div class="page">${backCardsHtml}</div>`;
      } else if (presetMode === 'back_only') {
        let backCardsHtml = '';
        for (let i = 0; i < cardsPerPage; i++) {
          const inv = pageInvitations[i] || null;
          backCardsHtml += renderPresetBackCard(inv);
        }
        pagesHtml += `<div class="page">${backCardsHtml}</div>`;
      } else {
        // Front only
        let frontCardsHtml = '';
        for (let i = 0; i < cardsPerPage; i++) {
          const inv = pageInvitations[i] || null;
          frontCardsHtml += renderPresetFrontCard(inv);
        }
        pagesHtml += `<div class="page">${frontCardsHtml}</div>`;
      }
    }

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${printJobTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Tajawal:wght@400;500;700;800;900&display=swap');

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
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .royal-card {
      position: relative;
      ${isSquare
        ? 'aspect-ratio: 1 / 1;'
        : isLandscape
        ? `aspect-ratio: ${settings.cardWidth || 85} / ${settings.cardHeight || 58};`
        : `aspect-ratio: ${settings.cardWidth || 58} / ${settings.cardHeight || 85};`
      }
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6px 9px;
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
   * Generates high-density sticker sheet HTML for pure QR barcodes (cutting and pasting onto cards)
   */
  static generateStickersPrintHtml(
    event: Event,
    invitations: Invitation[],
    settings: PrintSettings,
    qrImages: Record<number, string>
  ): string {
    const preset = settings.stickerPreset || '35';
    let cols = 5;
    let rows = 7;
    if (preset === '24') { cols = 3; rows = 8; }
    else if (preset === '30') { cols = 3; rows = 10; }
    else if (preset === '35') { cols = 5; rows = 7; }
    else if (preset === '40') { cols = 4; rows = 10; }
    else if (preset === '48') { cols = 6; rows = 8; }
    else if (preset === '60') { cols = 6; rows = 10; }
    else if (preset === 'custom') {
      cols = Math.max(1, settings.columns || 5);
      rows = Math.max(1, settings.rows || 7);
    }

    const stickersPerPage = cols * rows;
    const totalPages = Math.ceil(invitations.length / stickersPerPage) || 1;

    const marginX = settings.marginX !== undefined ? settings.marginX : 6;
    const marginY = settings.marginY !== undefined ? settings.marginY : 6;
    const gapX = settings.gapX !== undefined ? settings.gapX : 2;
    const gapY = settings.gapY !== undefined ? settings.gapY : 2;

    const showNumber = settings.stickerShowNumber !== false;
    const showName = settings.stickerShowName === true;
    const showCutMarks = settings.stickerShowCutMarks !== false;

    const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
    const printJobTitle = `ملصقات باركود - ${safeEventName}`;

    let pagesHtml = '';

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageInvitations = invitations.slice(pageIdx * stickersPerPage, (pageIdx + 1) * stickersPerPage);

      let cellsHtml = '';
      for (let i = 0; i < pageInvitations.length; i++) {
        const inv = pageInvitations[i];
        const qrDataUrl = qrImages[inv.id] || '';
        const nameText = inv.guest_name || inv.graduate_name || '';

        cellsHtml += `
          <div class="sticker-cell ${showCutMarks ? 'with-cut-marks' : ''}">
            <div class="sticker-inner">
              <div class="qr-wrapper">
                <img src="${qrDataUrl}" alt="QR" class="qr-img" />
              </div>
              ${showNumber ? `<div class="sticker-number">#${String(inv.invitation_number).padStart(3, '0')}</div>` : ''}
              ${showName && nameText ? `<div class="sticker-name">${nameText}</div>` : ''}
            </div>
          </div>
        `;
      }

      pagesHtml += `
        <div class="page">
          ${cellsHtml}
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${printJobTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap');

    @page {
      size: A4 portrait;
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
      width: 210mm;
      height: 297mm;
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

    .sticker-cell {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5px;
    }

    .sticker-cell.with-cut-marks {
      border: 0.75px dashed #94a3b8;
      border-radius: 4px;
    }

    .sticker-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
    }

    .qr-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-height: 82%;
    }

    .qr-img {
      max-width: 100%;
      max-height: 100%;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      display: block;
      image-rendering: pixelated;
    }

    .sticker-number {
      font-size: ${rows >= 9 ? '6pt' : rows >= 7 ? '7pt' : '8pt'};
      font-weight: 800;
      font-family: 'Courier New', Courier, monospace;
      color: #0f172a;
      line-height: 1.1;
      margin-top: 1px;
    }

    .sticker-name {
      font-size: ${rows >= 9 ? '5pt' : rows >= 7 ? '5.5pt' : '6.5pt'};
      font-weight: 700;
      color: #334155;
      line-height: 1.1;
      max-width: 96%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
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

      const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
      const isStickers = settings.printMode === 'pure_qr_stickers';
      const isDuplex = settings.cardTheme === 'custom' && Boolean(settings.customCardBackImage) && settings.doubleSidedMode === 'duplex';
      const defaultFileName = isStickers
        ? `ملصقات باركود - ${safeEventName}.pdf`
        : isDuplex
        ? `كروت بوجهين - ${safeEventName}.pdf`
        : `كروت الدعوة - ${safeEventName}.pdf`;

      const result = await dialog.showSaveDialog({
        title: isStickers ? 'تصدير ملصقات الباركود إلى PDF' : 'تصدير كروت الدعوة إلى PDF',
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
        const htmlContent = isStickers
          ? this.generateStickersPrintHtml(event, invitations, settings, qrImages)
          : this.generatePrintHtml(event, invitations, settings, qrImages);
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

      const safeEventName = (event.name || 'المناسبة').replace(/[\\/:*?"<>|]/g, '_').trim();
      const isStickers = settings.printMode === 'pure_qr_stickers';
      const isDuplex = settings.cardTheme === 'custom' && Boolean(settings.customCardBackImage) && settings.doubleSidedMode === 'duplex';
      const printJobTitle = isStickers
        ? `ملصقات باركود - ${safeEventName}`
        : isDuplex
        ? `كروت بوجهين - ${safeEventName}`
        : `كروت الدعوة - ${safeEventName}`;

      // Pre-generate QR data URLs for all invitations
      const qrImages: Record<number, string> = {};
      for (const inv of invitations) {
        qrImages[inv.id] = await QrService.generateDataUrl(inv.token, 400);
      }

      if (BrowserWindow) {
        const htmlContent = isStickers
          ? this.generateStickersPrintHtml(event, invitations, settings, qrImages)
          : this.generatePrintHtml(event, invitations, settings, qrImages);
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
