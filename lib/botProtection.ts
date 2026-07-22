/**
 * Utilitas untuk memverifikasi token dari Cloudflare Turnstile (Bot Protection).
 * Dapat dipanggil di endpoint seperti /api/auth/register atau /api/auth/login.
 */
export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secret) {
    console.warn('[TURNSTILE] Secret Key tidak ditemukan di .env. Verifikasi Bot di-bypass.');
    // Mengembalikan true agar aplikasi tidak rusak saat frontend belum di-setup
    return true; 
  }

  if (!token) {
    console.error('[TURNSTILE] Token kosong dari frontend.');
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('[TURNSTILE] Gagal menghubungi API Cloudflare:', error);
    return false;
  }
}
