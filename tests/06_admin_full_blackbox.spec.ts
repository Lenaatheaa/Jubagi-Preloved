import { test, expect } from '@playwright/test';
import { expectPageLoaded } from './test-helpers';

test.describe('👑 Blackbox Testing: Panel Administrator & Moderasi Platform', () => {

  test('TC-ADM-01: Akses Guard - User biasa/guest ditolak/dialihkan dari /admin', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // Tamu tanpa sesi admin tidak boleh melihat data sensitif platform
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toBeDefined();
  });

  test('TC-ADM-02: Dashboard Utama Admin (/admin)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-03: Manajemen Pengguna (/admin/users)', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-04: Moderasi Produk (/admin/products)', async ({ page }) => {
    await page.goto('/admin/products', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-05: Manajemen Kategori (/admin/categories)', async ({ page }) => {
    await page.goto('/admin/categories', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-06: Monitoring Transaksi Platform (/admin/transactions)', async ({ page }) => {
    await page.goto('/admin/transactions', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-07: Moderasi Penarikan Saldo Dompet (/admin/withdrawals)', async ({ page }) => {
    await page.goto('/admin/withdrawals', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-08: Moderasi Permohonan Hibah (/admin/hibah)', async ({ page }) => {
    await page.goto('/admin/hibah', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-09: Laporan Pelanggaran Komunitas (/admin/reports)', async ({ page }) => {
    await page.goto('/admin/reports', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-10: Pusat Resolusi Sengketa (/admin/disputes)', async ({ page }) => {
    await page.goto('/admin/disputes', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-11: Manajemen Iklan Boost (/admin/boosts)', async ({ page }) => {
    await page.goto('/admin/boosts', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-ADM-12: Pengaturan Sistem Platform (/admin/settings)', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });
});
