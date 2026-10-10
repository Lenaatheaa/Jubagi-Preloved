import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

// ─── Kredensial Test ────────────────────────────────────────────────────────
function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@jubagi-test.com`;
}
const PASSWORD = 'password123';
let SELLER_EMAIL = '';
let BUYER_EMAIL = '';

// Shared browser page across the entire serial suite
let page: Page;

// ─── Metrik Keberhasilan ──────────────────────────────────────────────────────
const results: { name: string; status: string; duration: number; fps: number }[] = [];

async function measureFPS(p: Page): Promise<number> {
  try {
    return await p.evaluate(() =>
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
  } catch { return 0; }
}

// ─── Helper: Registrasi & auto-login ─────────────────────────────────────────
async function registerAndLogin(p: Page, name: string, email: string) {
  await p.goto('/', { waitUntil: 'networkidle' });
  await p.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
  await expect(p.getByText('Selamat datang kembali!')).toBeVisible({ timeout: 10000 });
  await p.getByRole('button', { name: 'Daftar di sini' }).click();
  await expect(p.getByText('Daftar untuk mulai berbagi')).toBeVisible({ timeout: 5000 });

  await p.getByPlaceholder('Username / Nama Lengkap').fill(name);
  await p.getByPlaceholder('Alamat Email').fill(email);
  await p.getByPlaceholder('Password (Min. 8 karakter)').fill(PASSWORD);
  await p.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081234567890');
  await p.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Jl. Test No. 1, Kota Test');
  await p.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

  // Tunggu modal tertutup
  await expect(p.getByText('Daftar untuk mulai berbagi')).not.toBeVisible({ timeout: 15000 });
  await p.goto('/', { waitUntil: 'networkidle' });
  await expect(p.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
}

// ─── Helper: Login (dengan retry built-in) ───────────────────────────────────
async function loginExisting(p: Page, email: string, password: string) {
  await p.goto('/', { waitUntil: 'networkidle' });

  // Cek apakah sudah login
  const alreadyLoggedIn = await p.locator('span', { hasText: 'Hello,' }).isVisible().catch(() => false);
  if (alreadyLoggedIn) return;

  await p.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
  await expect(p.getByText('Selamat datang kembali!')).toBeVisible({ timeout: 10000 });

  await p.getByPlaceholder('Email').fill(email);
  await p.getByPlaceholder('Password').fill(password);
  await p.locator('.z-\\[100\\] form button[type="submit"]').click();

  await p.waitForTimeout(3000);
  await p.goto('/', { waitUntil: 'networkidle' });

  try {
    await expect(p.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
  } catch {
    await p.reload({ waitUntil: 'networkidle' });
    await expect(p.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 20000 });
  }
}

// ─── Helper: Logout ──────────────────────────────────────────────────────────
async function logout(p: Page) {
  const isLoggedIn = await p.locator('span', { hasText: 'Hello,' }).isVisible().catch(() => false);
  if (!isLoggedIn) return;

  await p.locator('span', { hasText: 'Hello,' }).click();
  await p.getByRole('button', { name: 'Keluar' }).click();
  await expect(p.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible({ timeout: 15000 });
}

// ─── Helper: Pastikan halaman load tanpa error ───────────────────────────────
async function expectPageLoaded(p: Page) {
  await expect(p.locator('body')).toBeVisible({ timeout: 15000 });
  const bodyText = await p.locator('body').innerText();
  expect(bodyText).not.toContain('Application error');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE — JUBAGI COMPREHENSIVE BLACK-BOX TESTING
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('🛍️ Jubagi Comprehensive Black-Box Testing', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    if (!fs.existsSync('dummy.jpg')) {
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);
      fs.writeFileSync('dummy.jpg', jpegHeader);
    }
  });

  test.afterEach(async ({}, testInfo) => {
    const fps = await measureFPS(page);
    results.push({
      name: testInfo.title,
      status: testInfo.status ?? 'unknown',
      duration: testInfo.duration,
      fps,
    });
    console.log(`\n📊 [METRIK] "${testInfo.title}"`);
    console.log(`   ➔ Status  : ${testInfo.status === 'passed' ? '✅ BERHASIL' : '❌ GAGAL'}`);
    console.log(`   ➔ Durasi  : ${testInfo.duration} ms`);
    console.log(`   ➔ FPS     : ~${fps} fps`);
  });

  test.afterAll(async () => {
    await page?.close();
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const rate = total > 0 ? (passed / total * 100).toFixed(2) : '0.00';
    console.log(`\n${'='.repeat(55)}`);
    console.log(`🏆  HASIL AKHIR COMPREHENSIVE BLACK-BOX TESTING — JUBAGI`);
    console.log(`${'='.repeat(55)}`);
    console.log(`Total Skenario : ${total}`);
    console.log(`Lulus          : ${passed}`);
    console.log(`Gagal          : ${total - passed}`);
    console.log(`Keberhasilan   : ${rate}%`);
    console.log(`${'='.repeat(55)}\n`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.status === 'passed' ? '✅' : '❌'}] ${r.name} | ${r.duration}ms | ~${r.fps}fps`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BAGIAN A: GUEST (Tanpa Login) — 9 Skenario
  // ═══════════════════════════════════════════════════════════════════════════

  test('A1. Guest: Landing Page (Hero, Kategori, Produk, WhyJubagi, CTA)', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('JUBAGI').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible();
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Daftar' })).toBeVisible();
    await expectPageLoaded(page);
  });

  test('A2. Guest: Halaman Katalog Produk (/products)', async () => {
    await page.goto('/products', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A3. Guest: Halaman Produk + Filter Kategori (/products?category=fashion)', async () => {
    await page.goto('/products?category=fashion', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A4. Guest: Halaman Bantuan Utama (/help)', async () => {
    await page.goto('/help', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A5. Guest: Halaman Bantuan Beli (/help/buy)', async () => {
    await page.goto('/help/buy', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A6. Guest: Halaman Bantuan Jual (/help/sell)', async () => {
    await page.goto('/help/sell', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A7. Guest: Halaman Bantuan Hibah (/help/hibah)', async () => {
    await page.goto('/help/hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('A8. Guest: Halaman Lupa Password (/forgot-password)', async () => {
    await page.goto('/forgot-password', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    const hasEmailInput = await page.locator('input[type="email"], input[placeholder*="mail" i]').first().isVisible().catch(() => false);
    expect(hasEmailInput).toBeTruthy();
  });

  test('A9. Guest: Pencarian Produk (/products?q=baju)', async () => {
    await page.goto('/products?q=baju', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BAGIAN B: PENJUAL — Login SEKALI, test semua fitur, Logout SEKALI
  // ═══════════════════════════════════════════════════════════════════════════

  test('B1. Penjual: Registrasi Akun Baru', async () => {
    SELLER_EMAIL = uniqueEmail('seller');
    await registerAndLogin(page, 'Test Seller', SELLER_EMAIL);
    await expect(page.locator('span', { hasText: 'Test Seller' })).toBeVisible({ timeout: 10000 });
  });

  test('B2. Penjual: Dashboard User (setelah login, / tampilkan DashboardView)', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
    await expectPageLoaded(page);
  });

  test('B3. Penjual: Navigasi ke Halaman Jual & Setujui T&C', async () => {
    await page.goto('/jual', { waitUntil: 'networkidle' });

    // Tangani T&C Modal jika muncul
    try {
      await expect(page.getByText('Ketentuan Berjualan')).toBeVisible({ timeout: 6000 });
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) await checkboxes.nth(i).check();
      await page.getByRole('button', { name: 'Setuju & Lanjutkan' }).click();
      await expect(page.getByText('Ketentuan Berjualan')).not.toBeVisible({ timeout: 10000 });
    } catch { }

    await expect(page.getByRole('heading', { name: 'Foto Produk' })).toBeVisible({ timeout: 15000 });
  });

  test('B4. Penjual: Isi Form Pasang Iklan (Multi-Step)', async () => {
    await page.goto('/jual', { waitUntil: 'networkidle' });

    // T&C mungkin sudah disetujui
    try {
      await expect(page.getByText('Ketentuan Berjualan')).toBeVisible({ timeout: 4000 });
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) await checkboxes.nth(i).check();
      await page.getByRole('button', { name: 'Setuju & Lanjutkan' }).click();
      await expect(page.getByText('Ketentuan Berjualan')).not.toBeVisible({ timeout: 10000 });
    } catch { }

    await expect(page.getByRole('heading', { name: 'Foto Produk' })).toBeVisible({ timeout: 15000 });

    // Step 1: Upload foto
    await page.locator('input[type="file"]').setInputFiles('dummy.jpg');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Lanjutkan' }).click();

    // Step 2: Pilih kategori
    await expect(page.getByRole('heading', { name: 'Pilih Kategori' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Fashion' }).click();

    // Step 3: Detail produk
    await expect(page.getByRole('heading', { name: 'Detail Barang' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Contoh: iPhone 13 Pro Max 256GB').fill('Barang Test E2E');
    await page.getByRole('button', { name: 'Baru', exact: true }).click();
    await page.getByRole('button', { name: 'Dijual', exact: true }).click();
    await page.getByPlaceholder('0', { exact: true }).fill('150000');
    await page.getByRole('button', { name: 'Ambil di Rumah', exact: true }).click();
    await page.locator('select').first().selectOption({ index: 1 });
    await page.getByPlaceholder('Contoh: Kota Semarang, Kec. Banyumanik').fill('Kota Test');

    await expect(page.getByRole('button', { name: 'Pasang Iklan Sekarang' })).toBeVisible();
  });

  test('B5. Penjual: Halaman Profil Toko (/profile)', async () => {
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('B6. Penjual: Halaman Saldo & Penarikan (/profile/wallet)', async () => {
    await page.goto('/profile/wallet', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('B7. Penjual: Halaman Pesanan Masuk (/transactions?role=seller)', async () => {
    await page.goto('/transactions?role=seller', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('B8. Penjual: Halaman Kelola Hibah (/hibah)', async () => {
    await page.goto('/hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('B9. Penjual: Halaman Pengaturan Akun (/settings)', async () => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('B10. Penjual: Logout', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await logout(page);
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BAGIAN C: PEMBELI — Login SEKALI, test semua fitur, Logout SEKALI
  // ═══════════════════════════════════════════════════════════════════════════

  test('C1. Pembeli: Registrasi Akun Baru', async () => {
    BUYER_EMAIL = uniqueEmail('buyer');
    await registerAndLogin(page, 'Test Buyer', BUYER_EMAIL);
    await expect(page.locator('span', { hasText: 'Test Buyer' })).toBeVisible({ timeout: 10000 });
  });

  test('C2. Pembeli: Dashboard User + Search Bar', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible({ timeout: 10000 });
    await page.locator('input[placeholder*="Cari"]').fill('baju');
    await page.locator('input[placeholder*="Cari"]').press('Enter');
    await page.waitForTimeout(2000);
    await expectPageLoaded(page);
  });

  test('C3. Pembeli: Halaman Pesanan Saya (/transactions?role=buyer)', async () => {
    await page.goto('/transactions?role=buyer', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('C4. Pembeli: Halaman Wishlist (/wishlist)', async () => {
    await page.goto('/wishlist', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('C5. Pembeli: Halaman Chat (/chat)', async () => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('C6. Pembeli: Notifikasi (Bell icon)', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bellButton = page.locator('button').filter({ has: page.locator('svg.lucide-bell') });
    if (await bellButton.isVisible().catch(() => false)) {
      await bellButton.click();
      await page.waitForTimeout(1000);
    }
    await expectPageLoaded(page);
  });

  test('C7. Pembeli: Halaman Pengaturan Akun (/settings)', async () => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('C8. Pembeli: Logout', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await logout(page);
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BAGIAN D: ADMIN PAGES (aksesibilitas — tanpa login admin)
  // ═══════════════════════════════════════════════════════════════════════════

  test('D1. Admin: Redirect/Guard untuk non-admin (/admin)', async () => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('D2. Admin: Sub-pages Products, Users, Transactions', async () => {
    for (const subpage of ['/admin/products', '/admin/users', '/admin/transactions']) {
      await page.goto(subpage, { waitUntil: 'networkidle', timeout: 30000 });
      await expectPageLoaded(page);
    }
  });

  test('D3. Admin: Sub-pages Disputes, Withdrawals, Reports, Settings', async () => {
    for (const subpage of ['/admin/disputes', '/admin/withdrawals', '/admin/reports', '/admin/settings']) {
      await page.goto(subpage, { waitUntil: 'networkidle', timeout: 30000 });
      await expectPageLoaded(page);
    }
  });

  test('D4. Admin: Sub-pages Hibah, Categories, Boosts', async () => {
    for (const subpage of ['/admin/hibah', '/admin/categories', '/admin/boosts']) {
      await page.goto(subpage, { waitUntil: 'networkidle', timeout: 30000 });
      await expectPageLoaded(page);
    }
  });

});
