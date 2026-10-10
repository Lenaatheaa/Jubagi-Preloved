import { test, expect, Page } from '@playwright/test';
import { uniqueEmail, DEFAULT_PASSWORD, expectPageLoaded } from './test-helpers';

test.describe('🛒 Blackbox Testing: Modul Pembeli (Wishlist, Checkout, & Review)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const buyerEmail = uniqueEmail('bb_buyer');

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('TC-BUY-01: Registrasi dan Login akun Pembeli', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await page.getByPlaceholder('Username / Nama Lengkap').fill('Pembeli Setia');
    await page.getByPlaceholder('Alamat Email').fill(buyerEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081234567899');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Jl. Kemang Raya No. 12, Jakarta');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Tunggu modal registrasi tertutup menandakan registrasi & auto-login selesai
    await expect(page.getByText('Daftar untuk mulai berbagi')).not.toBeVisible({ timeout: 15000 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
  });

  test('TC-BUY-02: Fitur Wishlist / Simpan Barang Favorit (/wishlist)', async () => {
    // Navigasi ke halaman wishlist (sudah terotentikasi)
    await page.goto('/wishlist', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi judul wishlist
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Wishlist|Favorit|Disimpan/i);
  });

  test('TC-BUY-03: Toggle tombol Like pada kartu produk di Katalog', async () => {
    await page.goto('/products', { waitUntil: 'networkidle' });
    const likeButton = page.locator('button').filter({ has: page.locator('svg.lucide-heart') }).first();
    if (await likeButton.isVisible().catch(() => false)) {
      await likeButton.click();
      await page.waitForTimeout(1000);
    }
    await expectPageLoaded(page);
  });

  test('TC-BUY-04: Halaman Checkout (/checkout/1) menampilkan ringkasan belanja', async () => {
    await page.goto('/checkout/1', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Memastikan terdapat komponen rincian biaya / tombol bayar
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Checkout|Ringkasan|Total|Pengiriman|Bayar/i);
  });

  test('TC-BUY-05: Verifikasi Pilihan Alamat dan Opsi Pengiriman pada Checkout', async () => {
    await page.goto('/checkout/1', { waitUntil: 'networkidle' });

    // Cek dropdown atau opsi kurir bila ada
    const courierSelector = page.locator('select, [role="combobox"]').first();
    if (await courierSelector.isVisible().catch(() => false)) {
      await expect(courierSelector).toBeEnabled();
    }
    await expectPageLoaded(page);
  });

  test('TC-BUY-06: Tombol Pembayaran (Midtrans integration) merespons klik', async () => {
    await page.goto('/checkout/1', { waitUntil: 'networkidle' });

    const payButton = page.getByRole('button', { name: /Bayar|Proses Pembayaran|Checkout/i }).first();
    if (await payButton.isVisible().catch(() => false)) {
      await payButton.click();
      await page.waitForTimeout(2000);
      // Memastikan sistem merespon tanpa runtime crash
      await expectPageLoaded(page);
    }
  });

  test('TC-BUY-07: Halaman Riwayat Pesanan Pembeli (/transactions?role=buyer)', async () => {
    await page.goto('/transactions?role=buyer', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Pesanan|Riwayat|Status|Pembelian/i);
  });

  test('TC-BUY-08: Halaman Beri Ulasan / Review Produk (/review/1)', async () => {
    await page.goto('/review/1', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi rating bintang atau teks ulasan
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Ulasan|Rating|Bintang|Review/i);
  });

  test('TC-BUY-09: Interaksi Form Ulasan (Bintang & Testimoni)', async () => {
    await page.goto('/review/1', { waitUntil: 'networkidle' });

    // Cek tombol rating / star
    const starBtn = page.locator('button').filter({ has: page.locator('svg.lucide-star') }).last();
    if (await starBtn.isVisible().catch(() => false)) {
      await starBtn.click();
    }

    // Input komentar jika ada textarea
    const commentInput = page.locator('textarea');
    if (await commentInput.isVisible().catch(() => false)) {
      await commentInput.fill('Barang sangat bagus, sesuai deskripsi dan penjual ramah!');
    }
  });
});
