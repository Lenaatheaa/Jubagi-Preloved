import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_PASSWORD = 'password123';

/**
 * Generate email unik untuk pengujian blackbox
 */
export function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@jubagi-test.com`;
}

/**
 * Memastikan file gambar dummy tersedia untuk pengujian upload
 */
export function ensureDummyImage(filename: string = 'dummy.jpg'): string {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(filePath, jpegHeader);
  }
  return filePath;
}

/**
 * Validasi halaman ter-load sempurna tanpa pesan error fatal
 */
export async function expectPageLoaded(page: Page, timeout: number = 15000) {
  await expect(page.locator('body')).toBeVisible({ timeout });
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain('Application error');
  expect(bodyText).not.toContain('Unhandled Runtime Error');
}

/**
 * Pengukuran rendering FPS (performa blackbox)
 */
export async function measureFPS(page: Page): Promise<number> {
  try {
    return await page.evaluate(() =>
      new Promise<number>(resolve => {
        let frames = 0;
        const start = performance.now();
        const loop = () => {
          frames++;
          if (performance.now() - start >= 1000) resolve(frames);
          else requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      })
    );
  } catch {
    return 0;
  }
}

/**
 * Helper Registrasi & Auto-login dari UI
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string = DEFAULT_PASSWORD,
  phone: string = '081234567890',
  address: string = 'Jl. Test No. 1, Kota Test'
) {
  await page.goto('/', { waitUntil: 'networkidle' });
  const masukBtn = page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' });
  if (await masukBtn.isVisible().catch(() => false)) {
    await masukBtn.click();
    await expect(page.getByText('Selamat datang kembali!')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Daftar di sini' }).click();
    await expect(page.getByText('Daftar untuk mulai berbagi')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Username / Nama Lengkap').fill(name);
    await page.getByPlaceholder('Alamat Email').fill(email);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(password);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill(phone);
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill(address);
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Tunggu modal registrasi tertutup menandakan auto-login selesai
    await expect(page.getByText('Daftar untuk mulai berbagi')).not.toBeVisible({ timeout: 15000 });
    await page.goto('/', { waitUntil: 'networkidle' });
  }
}

/**
 * Helper Login user yang sudah terdaftar
 */
export async function loginUser(page: Page, email: string, password: string = DEFAULT_PASSWORD) {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Cek apakah sudah login
  const alreadyLoggedIn = await page.locator('span', { hasText: 'Hello,' }).isVisible().catch(() => false);
  if (alreadyLoggedIn) return;

  const masukBtn = page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' });
  if (await masukBtn.isVisible().catch(() => false)) {
    await masukBtn.click();
    await expect(page.getByText('Selamat datang kembali!')).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.locator('.z-\\[100\\] form button[type="submit"]').click();

    await page.waitForTimeout(3000);
    await page.goto('/', { waitUntil: 'networkidle' });
  }
}

/**
 * Helper Logout
 */
export async function logoutUser(page: Page) {
  const userGreeting = page.locator('span', { hasText: 'Hello,' });
  if (await userGreeting.isVisible().catch(() => false)) {
    await userGreeting.click();
    const logoutBtn = page.getByRole('button', { name: 'Keluar' });
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
    }
  }
}
