import QRCode from 'qrcode';

export class QrService {
  /**
   * Generates a high-resolution PNG data URL for the given token
   * Uses Error Correction Level 'H' (High - 30% recovery) or 'M' for optimal scan reliability
   */
  static async generateDataUrl(token: string, size: number = 300): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: size,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return dataUrl;
    } catch (err) {
      console.error('QR generation error:', err);
      throw err;
    }
  }

  /**
   * Generates an SVG string representation of the QR code
   */
  static async generateSvg(token: string): Promise<string> {
    try {
      const svg = await QRCode.toString(token, {
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
      throw err;
    }
  }
}
