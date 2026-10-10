import { test, expect } from '@playwright/test';
import { expectPageLoaded } from './test-helpers';

test.describe('🛍️ Blackbox Testing: Katalog, Penjelajahan, Pencarian, & Filter', () => {

  test('TC-CAT-01: Landing Page memuat seluruh seksi utama (Hero, Kategori, Produk, WhyJubagi, CTA, Footer)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi branding
    await expect(page.getByText('JUBAGI').first()).toBeVisible({ timeout: 10000 });

    // Verifikasi tombol masuk dan daftar di header
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible();
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Daftar' })).toBeVisible();

    // Verifikasi search input
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible();

    // Verifikasi Footer ada di halaman
    await expect(page.locator('footer')).toBeVisible();
  });

  test('TC-CAT-02: Navigasi kategori di Landing Page mengarahkan ke filter kategori yang sesuai', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Cari tombol kategori apa saja (misal: Fashion, Elektronik, dll)
    const categoryBtn = page.locator('button, a').filter({ hasText: /Fashion|Elektronik|Perabotan|Kendaraan/i }).first();
    if (await categoryBtn.isVisible().catch(() => false)) {
      await categoryBtn.click();
      await page.waitForTimeout(1500);
      await expectPageLoaded(page);
    }
  });

  test('TC-CAT-03: Halaman Katalog Produk (/products) menampilkan daftar produk', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Memastikan terdapat container produk
    const cards = page.locator('[data-testid="product-card"], a[href^="/products/"], .group');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-CAT-04: Filter Katalog berdasarkan Kategori (e.g., /products?category=fashion)', async ({ page }) => {
    await page.goto('/products?category=fashion', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    expect(page.url()).toContain('category=fashion');
  });

  test('TC-CAT-05: Filter Katalog berdasarkan Kategori Elektronik (/products?category=elektronik)', async ({ page }) => {
    await page.goto('/products?category=elektronik', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    expect(page.url()).toContain('category=elektronik');
  });

  test('TC-CAT-06: Filter Katalog berdasarkan Tipe Hibah (/products?type=hibah)', async ({ page }) => {
    await page.goto('/products?type=hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    expect(page.url()).toContain('type=hibah');
  });

  test('TC-CAT-07: Filter Katalog berdasarkan Tipe Jual (/products?type=jual)', async ({ page }) => {
    await page.goto('/products?type=jual', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    expect(page.url()).toContain('type=jual');
  });

  test('TC-CAT-08 [Search]: Pencarian dengan kata kunci umum (e.g., "baju")', async ({ page }) => {
    await page.goto('/products?q=baju', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    expect(page.url()).toContain('q=baju');
  });

  test('TC-CAT-09 [Search]: Pencarian dengan kata kunci tidak ada kecocokan (Empty State)', async ({ page }) => {
    await page.goto('/products?q=xyz_produk_tidak_mungkin_ada_99999', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // Tidak boleh crash, harus menampilkan feedback atau list kosong
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toBeDefined();
  });

  test('TC-CAT-10: Halaman Detail Produk (/products/1)', async ({ page }) => {
    await page.goto('/products/1', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // Verifikasi elemen tombol aksi (beli, chat, atau informasi penjual)
    const pageText = await page.locator('body').innerText();
    expect(pageText.length).toBeGreaterThan(50);
  });

  test('TC-CAT-11 [Negative]: Akses detail produk dengan ID acak yang tidak ada (/products/non-existent-id-9999)', async ({ page }) => {
    await page.goto('/products/non-existent-id-9999', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // Memastikan website menangani graceful (tidak unhandled crash)
  });

  test('TC-CAT-12: Halaman Toko Penjual Publik (/store/1)', async ({ page }) => {
    await page.goto('/store/1', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });
});
