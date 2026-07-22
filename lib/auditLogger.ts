import fs from 'fs';
import path from 'path';

/**
 * Fungsi untuk mencatat aktivitas penting (Audit Log) ke file sistem lokal.
 * Tidak dimasukkan ke Prisma Schema agar tidak merusak struktur database saat ini.
 */
export async function logAudit(action: string, userId: string | number, details: string) {
  try {
    const date = new Date().toISOString();
    const logMessage = `[${date}] ACTION: ${action} | USER: ${userId} | DETAILS: ${details}\n`;
    
    // Simpan file log di folder 'logs' di root proyek
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(path.join(logDir, 'audit.log'), logMessage);
    console.log(`[AUDIT LOG] ${action} by User ID ${userId}`);
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to write audit log:', error);
  }
}
