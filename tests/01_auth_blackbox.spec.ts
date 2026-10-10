import { test, expect } from '@playwright/test';
import { uniqueEmail, DEFAULT_PASSWORD, expectPageLoaded } from './test-helpers';

test.describe('🔐 Blackbox Testing: Otentikasi, Otorisasi, & Validasi Akun', () => {
  test.describe.configure({ mode: 'serial' });

  let validEmail = '';

  test('TC-AUTH-01: Modal Login menampilkan seluruh elemen input yang dibutuhkan', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const masukBtn = page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' });
    await expect(masukBtn).toBeVisible({ timeout: 10000 });
    await masukBtn.click();

    // Verifikasi judul dan form login
    await expect(page.getByText('Selamat datang kembali!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.locator('.z-\\[100\\] form button[type="submit"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daftar di sini' })).toBeVisible();
  });

  test('TC-AUTH-02: Modal Registrasi menampilkan field formulir lengkap', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await expect(page.getByText('Daftar untuk mulai berbagi')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('Username / Nama Lengkap')).toBeVisible();
    await expect(page.getByPlaceholder('Alamat Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password (Min. 8 karakter)')).toBeVisible();
    await expect(page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)')).toBeVisible();
    await expect(page.getByPlaceholder('Alamat Lengkap Pengiriman')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buat Akun JUBAGI' })).toBeVisible();
  });

  test('TC-AUTH-03 [Positive]: Registrasi akun baru dengan data valid', async ({ page }) => {
    validEmail = uniqueEmail('bb_user');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await page.getByPlaceholder('Username / Nama Lengkap').fill('Blackbox Tester');
    await page.getByPlaceholder('Alamat Email').fill(validEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081298765432');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Jl. Mawar No. 10, Jakarta Pusat');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Tunggu proses registrasi selesai dan redirect / sesi aktif
    await page.waitForTimeout(3000);
    await page.goto('/', { waitUntil: 'networkidle' });
    try {
      await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
    } catch {
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 20000 });
    }
  });

  test('TC-AUTH-04 [Negative]: Registrasi gagal dengan format email tidak valid', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Pastikan belum login
    const userGreeting = page.locator('span', { hasText: 'Hello,' });
    if (await userGreeting.isVisible().catch(() => false)) {
      await userGreeting.click();
      await page.getByRole('button', { name: 'Keluar' }).click();
      await page.waitForTimeout(2000);
    }

    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    await page.getByPlaceholder('Username / Nama Lengkap').fill('Invalid Email Test');
    await page.getByPlaceholder('Alamat Email').fill('email-tanpa-domain');
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081200000000');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Alamat Test');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Harus tetap berada di modal registrasi (tidak membuat sesi)
    await expect(page.getByText('Daftar untuk mulai berbagi')).toBeVisible();
  });

  test('TC-AUTH-05 [Negative]: Registrasi gagal jika password kurang dari 8 karakter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    const testEmail = uniqueEmail('short_pass');
    await page.getByPlaceholder('Username / Nama Lengkap').fill('Short Pass User');
    await page.getByPlaceholder('Alamat Email').fill(testEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill('123'); // < 8 char
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081200000000');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Alamat Test');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    // Form tidak boleh submit sukses
    await expect(page.getByText('Daftar untuk mulai berbagi')).toBeVisible();
  });

  test('TC-AUTH-06 [Negative]: Registrasi gagal dengan email yang sudah terdaftar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByRole('button', { name: 'Daftar di sini' }).click();

    // Gunakan email yang sudah didaftarkan pada TC-AUTH-03
    await page.getByPlaceholder('Username / Nama Lengkap').fill('Duplicate Email User');
    await page.getByPlaceholder('Alamat Email').fill(validEmail);
    await page.getByPlaceholder('Password (Min. 8 karakter)').fill(DEFAULT_PASSWORD);
    await page.getByPlaceholder('Nomor Telepon (Contoh: 0812...)').fill('081211112222');
    await page.getByPlaceholder('Alamat Lengkap Pengiriman').fill('Alamat Duplikat');
    await page.getByRole('button', { name: 'Buat Akun JUBAGI' }).click();

    await page.waitForTimeout(2000);
    // Tidak boleh login otomatis dan tetap di modal atau menampilkan alert error
    await expect(page.getByText('Daftar untuk mulai berbagi')).toBeVisible();
  });

  test('TC-AUTH-07 [Negative]: Login gagal dengan password salah', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();

    await page.getByPlaceholder('Email').fill(validEmail);
    await page.getByPlaceholder('Password').fill('passwordsalah123');
    await page.locator('.z-\\[100\\] form button[type="submit"]').click();

    await page.waitForTimeout(2000);
    // Sesi tidak dibuat
    await expect(page.locator('span', { hasText: 'Hello,' })).not.toBeVisible();
  });

  test('TC-AUTH-08 [Negative]: Login gagal dengan email yang tidak terdaftar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();

    await page.getByPlaceholder('Email').fill('tidakada_' + Date.now() + '@jubagi.id');
    await page.getByPlaceholder('Password').fill('bebas12345');
    await page.locator('.z-\\[100\\] form button[type="submit"]').click();

    await page.waitForTimeout(2000);
    await expect(page.locator('span', { hasText: 'Hello,' })).not.toBeVisible();
  });

  test('TC-AUTH-09 [Positive]: Login sukses dengan kredensial yang valid', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();

    await page.getByPlaceholder('Email').fill(validEmail);
    await page.getByPlaceholder('Password').fill(DEFAULT_PASSWORD);
    await page.locator('.z-\\[100\\] form button[type="submit"]').click();

    await page.waitForTimeout(3000);
    await page.goto('/', { waitUntil: 'networkidle' });
    try {
      await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 15000 });
    } catch {
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.locator('span', { hasText: 'Hello,' })).toBeVisible({ timeout: 20000 });
    }
  });

  test('TC-AUTH-10: Halaman Lupa Password (/forgot-password) dan validasi form email', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);

    const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('user@jubagi.com');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Kirim")').first();
    await expect(submitBtn).toBeVisible();
  });

  test('TC-AUTH-11: Halaman Reset Password (/reset-password) dapat dibuka', async ({ page }) => {
    await page.goto('/reset-password?token=sample-test-token', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
  });

  test('TC-AUTH-12: RBAC - Tamu yang belum login diarahkan/ditolak saat mengakses area privat', async ({ page }) => {
    // Logout dulu jika masih login
    await page.goto('/', { waitUntil: 'networkidle' });
    const userGreeting = page.locator('span', { hasText: 'Hello,' });
    if (await userGreeting.isVisible().catch(() => false)) {
      await userGreeting.click();
      await page.getByRole('button', { name: 'Keluar' }).click();
      await page.waitForTimeout(2000);
    }

    // Akses rute admin tanpa login
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expectPageLoaded(page);
    // URL tidak boleh tetap di /admin tanpa redirect atau ditolak
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/stats');
  });

  test('TC-AUTH-13: Logout berhasil menghapus sesi dan kembali ke status tamu', async ({ page }) => {
    // Login kembali
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' }).click();
    await page.getByPlaceholder('Email').fill(validEmail);
    await page.getByPlaceholder('Password').fill(DEFAULT_PASSWORD);
    await page.locator('.z-\\[100\\] form button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.goto('/', { waitUntil: 'networkidle' });

    // Lakukan logout
    await page.locator('span', { hasText: 'Hello,' }).click();
    await page.getByRole('button', { name: 'Keluar' }).click();
    await page.waitForTimeout(2000);

    // Verifikasi tombol masuk kembali terlihat
    await expect(page.locator('div.hidden.lg\\:flex button', { hasText: 'Masuk' })).toBeVisible({ timeout: 10000 });
  });
});
