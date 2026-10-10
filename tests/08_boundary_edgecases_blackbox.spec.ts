import { test, expect } from '@playwright/test';
import { expectPageLoaded } from './test-helpers';

test.describe('🛡️ Blackbox Testing: Nilai Batas (Boundary), Ketahanan Input, & Responsivitas', () => {

  test('TC-EDGE-01: Penanganan graceful halaman 404 Not Found (/halaman-acak-12345)', async ({ page }) => {
    await page.goto('/halaman-acak-12345-notfound', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // Tidak boleh menampilkan stack trace error internal Next.js
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });

  test('TC-EDGE-02 [Security]: Ketahanan terhadap input XSS Script Injection (<script>alert(1)</script>)', async ({ page }) => {
    const maliciousPayload = '<script>alert("XSS")</script>';
    await page.goto(`/products?q=${encodeURIComponent(maliciousPayload)}`, { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Pastikan tidak ada dialog alert browser yang terpancing secara tidak aman
    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      dialogAppeared = true;
      await dialog.dismiss();
    });
    await page.waitForTimeout(1000);
    expect(dialogAppeared).toBeFalsy();
  });

  test('TC-EDGE-03 [Security]: Ketahanan terhadap SQL Injection pattern (" OR 1=1 --)', async ({ page }) => {
    const sqlPayload = "' OR 1=1 --";
    await page.goto(`/products?q=${encodeURIComponent(sqlPayload)}`, { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-EDGE-04 [Boundary]: Input teks sangat panjang (500+ karakter) pada form search', async ({ page }) => {
    const veryLongString = 'A'.repeat(500);
    await page.goto('/', { waitUntil: 'networkidle' });

    const searchInput = page.locator('input[placeholder*="Cari"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(veryLongString);
    await searchInput.press('Enter');
    await page.waitForTimeout(1500);
    await expectPageLoaded(page);
  });

  test('TC-EDGE-05: Verifikasi seluruh Pusat Bantuan Pengguna (/help, /help/buy, /help/sell, /help/hibah)', async ({ page }) => {
    for (const helpPath of ['/help', '/help/buy', '/help/sell', '/help/hibah']) {
      await page.goto(helpPath, { waitUntil: 'networkidle' });
      await expectPageLoaded(page);
      const content = await page.locator('body').innerText();
      expect(content.length).toBeGreaterThan(100);
    }
  });

  test('TC-EDGE-06 [Responsiveness]: Tampilan Mobile Viewport (iPhone SE - 375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Verifikasi branding tetap terlihat di mobile
    await expect(page.getByText('JUBAGI').first()).toBeVisible();
  });

  test('TC-EDGE-07 [Responsiveness]: Tampilan Layar Lebar Desktop (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    // Navbar desktop harus menampilkan tombol masuk & daftar
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible();
  });
});
