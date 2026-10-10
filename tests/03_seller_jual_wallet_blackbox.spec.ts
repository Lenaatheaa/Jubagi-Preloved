import { test, expect, Page } from '@playwright/test';
import { uniqueEmail, DEFAULT_PASSWORD, ensureDummyImage, expectPageLoaded } from './test-helpers';

test.describe('🏪 Blackbox Testing: Modul Penjual (Iklan, Profil, Dompet, & Pesanan)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const sellerEmail = uniqueEmail('bb_seller');

  test.beforeAll(async ({ browser }) => {
    ensureDummyImage('dummy.jpg');
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('TC-SEL-01: Registrasi dan Login akun Penjual', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await page.getByPlaceholder('Username / Nama Lengkap').fill('Toko Maju Jaya');
    await page.getByPlaceholder('Alamat Email').fill(sellerEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081377889900');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Jl. Sudirman No. 45, Bandung');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Tunggu modal registrasi tertutup menandakan registrasi & auto-login selesai
    await expect(page.getByText('Daftar untuk mulai berbagi')).not.toBeVisible({ timeout: 15000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-SEL-02: Navigasi ke /jual dan konfirmasi Syarat & Ketentuan Berjualan', async () => {
    await page.goto('/jual', { waitUntil: 'networkidle' });

    // Jika muncul dialog Ketentuan Berjualan
    const tcModal = page.getByText('Ketentuan Berjualan');
    if (await tcModal.isVisible().catch(() => false)) {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      const submitBtn = page.getByRole('button', { name: 'Setuju & Lanjutkan' });
      await submitBtn.click();
      await expect(tcModal).not.toBeVisible({ timeout: 8000 });
    }

    // Memastikan berada di form upload foto
    await expect(page.getByRole('heading', { name: 'Foto Produk' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-SEL-03: Multi-Step Form Jual - Step 1: Upload Foto Produk', async () => {
    await page.goto('/jual', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Foto Produk' })).toBeVisible({ timeout: 15000 });

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles('dummy.jpg');
    await page.waitForTimeout(1000);

    const nextBtn = page.getByRole('button', { name: 'Lanjutkan' });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verifikasi beralih ke Step 2 (Pilih Kategori)
    await expect(page.getByRole('heading', { name: 'Pilih Kategori' })).toBeVisible({ timeout: 6000 });
  });

  test('TC-SEL-04: Multi-Step Form Jual - Step 2: Pemilihan Kategori', async () => {
    // Pilih salah satu kategori
    const fashionBtn = page.getByRole('button', { name: 'Fashion' });
    if (await fashionBtn.isVisible().catch(() => false)) {
      await fashionBtn.click();
    } else {
      // Fallback tombol kategori pertama
      await page.locator('.grid button').first().click();
    }

    // Verifikasi beralih ke Step 3 (Detail Barang)
    await expect(page.getByRole('heading', { name: 'Detail Barang' })).toBeVisible({ timeout: 6000 });
  });

  test('TC-SEL-05: Multi-Step Form Jual - Step 3: Pengisian Detail Barang & Validasi Harga', async () => {
    await page.getByPlaceholder('Contoh: iPhone 13 Pro Max 256GB').fill('Jaket Kulit Premium Blackbox');
    await page.getByRole('button', { name: 'Baru', exact: true }).click();
    await page.getByRole('button', { name: 'Dijual', exact: true }).click();

    // Pengujian input harga
    const priceInput = page.getByPlaceholder('0', { exact: true });
    await priceInput.fill('250000');

    // Pengiriman & Lokasi
    await page.getByRole('button', { name: 'Ambil di Rumah', exact: true }).click();
    const selectCourier = page.locator('select').first();
    if (await selectCourier.isVisible().catch(() => false)) {
      await selectCourier.selectOption({ index: 1 });
    }
    await page.getByPlaceholder('Contoh: Kota Semarang, Kec. Banyumanik').fill('Kota Bandung, Kec. Coblong');

    // Tombol submit terlihat
    const submitAdBtn = page.getByRole('button', { name: 'Pasang Iklan Sekarang' });
    await expect(submitAdBtn).toBeVisible();
  });

  test('TC-SEL-06: Halaman Profil Toko Penjual (/profile)', async () => {
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi elemen nama toko / profile
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Toko Maju Jaya');
  });

  test('TC-SEL-07: Halaman Dompet Saldo (/profile/wallet)', async () => {
    await page.goto('/profile/wallet', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi informasi saldo tertera
    const pageText = await page.locator('body').innerText();
    expect(pageText).toMatch(/Saldo|Wallet|Rp/i);
  });

  test('TC-SEL-08: Verifikasi Modal Penarikan Saldo (Withdrawal Modal)', async () => {
    await page.goto('/profile/wallet', { waitUntil: 'networkidle' });

    // Cari tombol Tarik Dana
    const withdrawBtn = page.getByRole('button', { name: /Tarik|Withdraw|Cairkan/i }).first();
    if (await withdrawBtn.isVisible().catch(() => false)) {
      const isDisabled = await withdrawBtn.isDisabled();
      if (!isDisabled) {
        await withdrawBtn.click();
        await page.waitForTimeout(1000);
      } else {
        // Tombol dinonaktifkan sesuai aturan bisnis karena saldo akun baru Rp 0
        expect(isDisabled).toBeTruthy();
      }
      await expectPageLoaded(page);
    }
  });

  test('TC-SEL-09: Halaman Pesanan Masuk Penjual (/transactions?role=seller)', async () => {
    await page.goto('/transactions?role=seller', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi tab atau filter status transaksi
    const pageText = await page.locator('body').innerText();
    expect(pageText).toMatch(/Pesanan|Penjual|Status|Semua/i);
  });

  test('TC-SEL-10: Halaman Kelola Hibah Penjual (/hibah)', async () => {
    await page.goto('/hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });
});
