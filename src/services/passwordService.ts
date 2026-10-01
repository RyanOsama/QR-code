import crypto from 'crypto';

export class PasswordService {
  /**
   * Generates a readable, secure temporary password (e.g., 'Pass-7842')
   */
  static generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(1000 + Math.random() * 9000);
    return `Pass-${code}${num}`;
  }

  /**
   * Generates SHA-256 hex hash matching PostgreSQL digest
   */
  static hash(password: string): string {
    return crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  /**
   * Verifies password against hash or temporary password
   */
  static verify(password: string, storedHash: string, tempPassword?: string | null): boolean {
    const inputHash = this.hash(password);
    if (inputHash === storedHash) return true;
    if (tempPassword && tempPassword.trim() === password.trim()) return true;
    return false;
  }
}
