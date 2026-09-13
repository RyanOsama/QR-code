import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import { getDatabase, getDatabasePath, initDatabase } from './connection';

export class BackupService {
  /**
   * Performs an immediate backup of the SQLite database
   */
  static async backupDatabase(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const db = getDatabase();
      
      // Checkpoint WAL first to flush all changes to main db
      db.pragma('wal_checkpoint(TRUNCATE)');

      const defaultDateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFileName = `backup_events_${defaultDateStr}.db`;

      const result = await dialog.showSaveDialog({
        title: 'حفظ نسخة احتياطية من قاعدة البيانات',
        defaultPath: defaultFileName,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'تم إلغاء عملية الحفظ' };
      }

      // Use better-sqlite3 native backup method for live consistency
      await db.backup(result.filePath);

      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      console.error('Backup error:', err);
      return { success: false, error: err.message || 'فشل إنشاء النسخة الاحتياطية' };
    }
  }

  /**
   * Restores a database from a selected backup file
   */
  static async restoreDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'اختر ملف النسخة الاحتياطية للاستعادة',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, error: 'تم إلغاء الاستعادة' };
      }

      const backupPath = result.filePaths[0];
      const targetDbPath = getDatabasePath();

      // Close current db connection
      const currentDb = getDatabase();
      currentDb.close();

      // Copy backup file over current db path
      fs.copyFileSync(backupPath, targetDbPath);

      // Remove any lingering -wal or -shm files from old db
      if (fs.existsSync(`${targetDbPath}-wal`)) fs.unlinkSync(`${targetDbPath}-wal`);
      if (fs.existsSync(`${targetDbPath}-shm`)) fs.unlinkSync(`${targetDbPath}-shm`);

      // Reinitialize db
      initDatabase(targetDbPath);

      return { success: true };
    } catch (err: any) {
      console.error('Restore error:', err);
      return { success: false, error: err.message || 'فشل استعادة النسخة الاحتياطية' };
    }
  }
}
