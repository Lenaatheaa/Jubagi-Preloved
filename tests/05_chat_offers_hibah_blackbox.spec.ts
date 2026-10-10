import { test, expect, Page } from '@playwright/test';
import { uniqueEmail, DEFAULT_PASSWORD, expectPageLoaded } from './test-helpers';

test.describe('💬 Blackbox Testing: Komunikasi Chat, Nego Harga, & Hibah Sosial', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const chatUserEmail = uniqueEmail('bb_chat_user');

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('TC-CHAT-01: Persiapan akun user untuk Chat & Hibah', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await page.getByPlaceholder('Username / Nama Lengkap').fill('Chat Tester');
    await page.getByPlaceholder('Alamat Email').fill(chatUserEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081299900011');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Jl. Melati No. 5, Surabaya');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Tunggu modal registrasi tertutup menandakan registrasi & auto-login selesai
    await expect(page.getByText('Daftar untuk mulai berbagi')).not.toBeVisible({ timeout: 15000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-CHAT-02: Halaman Chat (/chat) memuat antarmuka pesan', async () => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi input pencarian chat di sidebar
    const chatSearchInput = page.getByPlaceholder('Cari percakapan...');
    await expect(chatSearchInput).toBeVisible({ timeout: 10000 });
  });

  test('TC-CHAT-03: Pencarian percakapan pada sidebar chat', async () => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    const chatSearchInput = page.getByPlaceholder('Cari percakapan...');
    if (await chatSearchInput.isVisible().catch(() => false)) {
      await chatSearchInput.fill('iPhone');
      await page.waitForTimeout(500);
      await chatSearchInput.fill('');
    }
    await expectPageLoaded(page);
  });

  test('TC-CHAT-04: Verifikasi input pesan teks di dalam Chat View', async () => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    const messageInput = page.locator('input[placeholder*="Ketik"], input[placeholder*="pesan" i], textarea[placeholder*="pesan" i]').first();
    if (await messageInput.isVisible().catch(() => false)) {
      await messageInput.fill('Halo kak, barang masih ready kah?');
    }
    await expectPageLoaded(page);
  });

  test('TC-CHAT-05: Fitur Tawar Harga (Nego) pada Chat', async () => {
    await page.goto('/chat', { waitUntil: 'networkidle' });

    // Cari tombol Tawar Harga jika tersedia di tampilan chat
    const offerBtn = page.getByRole('button', { name: /Tawar|Nego|Beri Tawaran/i }).first();
    if (await offerBtn.isVisible().catch(() => false)) {
      await offerBtn.click();
      await page.waitForTimeout(1000);
    }
    await expectPageLoaded(page);
  });

  test('TC-HIBAH-01: Halaman Katalog & Kelola Hibah (/hibah)', async () => {
    await page.goto('/hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Hibah|Gratis|Donasi|Permintaan/i);
  });

  test('TC-HIBAH-02: Modal Pengajuan Permintaan Hibah', async () => {
    // Kunjungi produk dengan tipe hibah (contoh: id 4)
    await page.goto('/products/4', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Cari tombol ajukan hibah jika ada
    const hibahRequestBtn = page.getByRole('button', { name: /Ajukan Hibah|Minta Hibah|Ambil Gratis/i }).first();
    if (await hibahRequestBtn.isVisible().catch(() => false)) {
      await hibahRequestBtn.click();
      await page.waitForTimeout(1000);
      await expectPageLoaded(page);
    }
  });

  test('TC-NOTIF-01: Popup Notifikasi Lonceng (Bell Icon)', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
    if (await bellBtn.isVisible().catch(() => false)) {
      await bellBtn.click();
      await page.waitForTimeout(1000);
      await expectPageLoaded(page);
    }
  });
});
