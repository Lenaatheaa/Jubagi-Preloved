import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  windowMs: number;  // waktu window dalam ms
  max: number;       // maks request per window
  message?: string;
}

// In-memory store (gunakan Redis di production untuk multi-instance)
const store = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter sederhana berbasis IP + endpoint.
 * Kembalikan null jika masih dalam batas, atau NextResponse 429 jika melewati.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Terlalu banyak request. Coba lagi nanti.' } = options;

  return function checkRateLimit(req: NextRequest | Request, key?: string): NextResponse | null {
    cleanupExpired(); // Pembersihan lazy tanpa setInterval global
    // Ambil IP dari header atau fallback
    const ip =
      (req as NextRequest).headers?.get('x-forwarded-for')?.split(',')[0].trim() ||
      (req as NextRequest).headers?.get('x-real-ip') ||
      'unknown';

    const identifier = key ? `${ip}:${key}` : ip;
    const now = Date.now();

    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      // Mulai window baru
      store.set(identifier, { count: 1, resetTime: now + windowMs });
      return null;
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        { success: false, message },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    record.count++;
    return null;
  };
}

// Preset rate limiters untuk berbagai endpoint
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 menit
  max: 5,
  message: 'Terlalu banyak percobaan transaksi. Tunggu 1 menit.',
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 10,
  message: 'Terlalu banyak percobaan login. Tunggu 10 menit.',
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

// Pembersihan lazy: hapus entri kadaluarsa pada setiap request
// Menghindari setInterval di module level yang bermasalah di serverless Next.js
function cleanupExpired() {
  const now = Date.now();
  // Hanya cleanup jika store terlalu besar (>500 entries) untuk performa
  if (store.size > 500) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) store.delete(key);
    }
  }
}
