import { getDatabase } from '../database/connection';
import { CheckInResult, Invitation } from '../types';
import { ScanLogRepository } from '../database/repositories/scanLogRepository';

export class CheckInService {
  /**
   * Atomic check-in with immediate transaction lock.
   * Prevents double entry race conditions even with rapid simultaneous scans.
   */
  static verifyAndCheckIn(token: string, currentEventId: number, deviceName?: string, scannedBy?: string): CheckInResult {
    const db = getDatabase();
    const cleanToken = token.trim();
    const now = new Date().toISOString();
    const scannerName = scannedBy || 'الموظف المسؤول';

    // Use a transaction function to guarantee atomicity
    const performCheckIn = db.transaction(() => {
      // 1. Fetch the invitation matching this token with ROW lock
      const invitation = db
        .prepare(`SELECT * FROM invitations WHERE token = ?`)
        .get(cleanToken) as Invitation | undefined;

      // 2. Token doesn't exist at all -> INVALID
      if (!invitation) {
        ScanLogRepository.create({
          invitation_id: null,
          event_id: currentEventId,
          result: 'INVALID',
          device_name: deviceName,
          scanned_by_name: scannerName,
          notes: `رمز QR غير معروف: ${cleanToken.substring(0, 15)}...`,
        });

        return {
          success: false,
          result: 'INVALID' as const,
          message: 'رمز الدعوة غير صالح أو غير موجود في النظام!',
        };
      }

      // 3. Token belongs to a different event -> WRONG_EVENT
      if (invitation.event_id !== currentEventId) {
        ScanLogRepository.create({
          invitation_id: invitation.id,
          event_id: currentEventId,
          result: 'WRONG_EVENT',
          device_name: deviceName,
          scanned_by_name: scannerName,
          notes: `دعوة تابعة لمناسبة أخرى (رقم المناسبة: ${invitation.event_id})`,
        });

        return {
          success: false,
          result: 'WRONG_EVENT' as const,
          message: 'هذه الدعوة مخصصة لمناسبة أخرى ولا تتبع هذه المناسبة!',
          guestName: invitation.guest_name,
          invitationNumber: invitation.invitation_number,
        };
      }

      // 4. Token has already been used -> ALREADY_USED
      if (invitation.status === 'USED') {
        const lastScan = ScanLogRepository.getLastAcceptedScan(invitation.id);
        const prevScanner = lastScan?.scanned_by_name || 'غير محدد';

        ScanLogRepository.create({
          invitation_id: invitation.id,
          event_id: currentEventId,
          result: 'ALREADY_USED',
          device_name: deviceName,
          scanned_by_name: scannerName,
          notes: `محاولة دخول مكررة لدعوة ممسوحة سابقاً بواسطة: ${prevScanner}`,
        });

        return {
          success: false,
          result: 'ALREADY_USED' as const,
          message: 'تم استخدام هذه الدعوة مسبقاً! يرجى منع الدخول.',
          invitation,
          previousUsedAt: lastScan?.scanned_at || invitation.used_at || undefined,
          scannedBy: prevScanner,
          guestName: invitation.guest_name,
          invitationNumber: invitation.invitation_number,
        };
      }

      // 5. Token is cancelled
      if (invitation.status === 'CANCELLED') {
        ScanLogRepository.create({
          invitation_id: invitation.id,
          event_id: currentEventId,
          result: 'INVALID',
          device_name: deviceName,
          scanned_by_name: scannerName,
          notes: `دعوة ملغاة`,
        });

        return {
          success: false,
          result: 'INVALID' as const,
          message: 'هذه الدعوة تم إلغاؤها من قبل الإدارة!',
          guestName: invitation.guest_name,
          invitationNumber: invitation.invitation_number,
        };
      }

      // 6. Token is UNUSED -> Atomic UPDATE to USED
      db.prepare(`
        UPDATE invitations 
        SET status = 'USED', used_at = ? 
        WHERE id = ? AND status = 'UNUSED'
      `).run(now, invitation.id);

      // Record in scan logs
      ScanLogRepository.create({
        invitation_id: invitation.id,
        event_id: currentEventId,
        result: 'ACCEPTED',
        device_name: deviceName,
        scanned_by_name: scannerName,
        notes: `دخول مصرح - الدعوة #${invitation.invitation_number}`,
      });

      const updatedInvitation: Invitation = {
        ...invitation,
        status: 'USED',
        used_at: now,
      };

      return {
        success: true,
        result: 'ACCEPTED' as const,
        message: 'تم قبول الدخول بنجاح. أهلاً وسهلاً!',
        invitation: updatedInvitation,
        scannedBy: scannerName,
        guestName: invitation.guest_name,
        invitationNumber: invitation.invitation_number,
      };
    });

    return performCheckIn();
  }
}
