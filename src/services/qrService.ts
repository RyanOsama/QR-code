import QRCode from 'qrcode';

export class QrService {
  /**
   * Generates a high-resolution PNG data URL for the given token
   * Uses Error Correction Level 'H' (High - 30% recovery) or 'M' for optimal scan reliability
   */
  static async generateDataUrl(token: string, size: number = 300): Promise<string> {
    if (!token || typeof token !== 'string') {
      return '';
    }
    const cleanToken = token.trim().substring(0, 2048); // Bound max payload size
    const safeSize = Math.max(50, Math.min(Number(size) || 300, 2000));
    try {
      const dataUrl = await QRCode.toDataURL(cleanToken, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: safeSize,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (err) {
      console.error('QR generation error:', err);
      return '';
    }
  }

  /**
   * Generates an SVG string representation of the QR code
   */
  static async generateSvg(token: string): Promise<string> {
    if (!token || typeof token !== 'string') {
      return '';
    }
    const cleanToken = token.trim().substring(0, 2048);
    try {
      const svg = await QRCode.toString(cleanToken, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return svg;
    } catch (err) {
      console.error('QR SVG error:', err);
      return '';
    }
  }
}
