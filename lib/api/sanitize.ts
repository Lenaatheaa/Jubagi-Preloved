/**
 * Sanitasi input dasar untuk mencegah XSS.
 * Menghapus tag HTML berbahaya dari string input.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Sanitasi seluruh object secara rekursif.
 * Berguna untuk membersihkan request body sebelum disimpan ke DB.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

/**
 * Validasi nomor telepon Indonesia
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(phone.replace(/\s|-/g, ''));
}

/**
 * Normalisasi nomor telepon ke format 08xx
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\s|-/g, '');
  if (clean.startsWith('+62')) return '0' + clean.slice(3);
  if (clean.startsWith('62')) return '0' + clean.slice(2);
  return clean;
}
