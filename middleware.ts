import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiting (Edge-compatible Map)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Gunakan header 'x-forwarded-for' karena request.ip mungkin tidak ada di versi Next.js terbaru
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;

  // 1. RATE LIMITING (Login & API)
  if (path.startsWith('/api/') || path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
    const windowMs = 60 * 1000; // 1 menit
    const maxRequests = (path.startsWith('/auth/')) ? 5 : 60; // 5 req/min untuk auth, 60 req/min untuk API
    
    const current = rateLimitMap.get(ip) || { count: 0, timestamp: Date.now() };
    if (Date.now() - current.timestamp > windowMs) {
      current.count = 1;
      current.timestamp = Date.now();
    } else {
      current.count++;
    }
    rateLimitMap.set(ip, current);

    if (current.count > maxRequests) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Terlalu banyak permintaan (Rate Limit). Silakan coba lagi sebentar.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. SECURITY HEADERS
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Menambahkan challenges.cloudflare.com ke CSP untuk mempersiapkan Bot Protection (Turnstile)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https:;"
  );

  // 3. RBAC (Role-Based Access Control) untuk Halaman & API Admin
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'rahasia_jubagi_123' });
    if (!token || token.role !== 'admin') {
      // Tolak akses jika bukan admin, redirect ke beranda
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
