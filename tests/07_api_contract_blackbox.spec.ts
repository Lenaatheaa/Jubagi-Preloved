import { test, expect } from '@playwright/test';
import { uniqueEmail, DEFAULT_PASSWORD } from './test-helpers';

test.describe('🔌 Blackbox Testing: Kontrak API & Respons HTTP', () => {

  test('TC-API-01: POST /api/auth/register - Registrasi dengan payload valid', async ({ request }) => {
    const email = uniqueEmail('api_reg');
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'API Test User',
        email,
        password: DEFAULT_PASSWORD,
        phone: '081234567890',
        address: 'Jl. API Test No. 1'
      }
    });
    // Response status code harus 200 atau 201
    expect([200, 201]).toContain(response.status());
    const data = await response.json().catch(() => ({}));
    expect(data).toBeDefined();
  });

  test('TC-API-02 [Negative]: POST /api/auth/register - Registrasi dengan email invalid (Bad Request 400)', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'Bad Email User',
        email: 'invalid-email-format',
        password: DEFAULT_PASSWORD,
        phone: '081234567890',
        address: 'Jl. Test'
      }
    });
    expect([400, 422]).toContain(response.status());
  });

  test('TC-API-03: POST /api/auth/forgot-password - Permintaan reset password', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'test@jubagi.com'
      }
    });
    // Harus merespons tanpa 500 error
    expect(response.status()).toBeLessThan(500);
  });

  test('TC-API-04: GET /api/products - Mengambil katalog produk publik', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
  });

  test('TC-API-05: GET /api/products dengan filter query (?category=fashion&type=jual)', async ({ request }) => {
    const response = await request.get('/api/products?category=fashion&type=jual');
    expect(response.status()).toBe(200);
  });

  test('TC-API-06: GET /api/products/[id] - Produk yang tidak ditemukan (404 Not Found)', async ({ request }) => {
    const response = await request.get('/api/products/99999999-tidak-ada');
    expect([400, 404]).toContain(response.status());
  });

  test('TC-API-07 [Security]: POST /api/products tanpa autentikasi (401 Unauthorized)', async ({ request }) => {
    const response = await request.post('/api/products', {
      data: {
        title: 'Barang Ilegal Tanpa Auth',
        price: 100000
      }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-08 [Security]: POST /api/likes tanpa autentikasi (401 Unauthorized)', async ({ request }) => {
    const response = await request.post('/api/likes', {
      data: {
        productId: '1'
      }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-09: POST /api/shipping/rates - Kalkulasi ongkir', async ({ request }) => {
    const response = await request.post('/api/shipping/rates', {
      data: {
        destination: 'Jakarta Selatan',
        weight: 1000
      }
    });
    // Endpoint harus mengembalikan response terstruktur
    expect(response.status()).toBeLessThan(500);
  });

  test('TC-API-10 [Security]: GET /api/chat/rooms tanpa autentikasi (401 Unauthorized)', async ({ request }) => {
    const response = await request.get('/api/chat/rooms');
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-11 [Security]: POST /api/offers tanpa autentikasi (401 Unauthorized)', async ({ request }) => {
    const response = await request.post('/api/offers', {
      data: {
        productId: '1',
        offerPrice: 50000
      }
    });
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-12 [Security]: GET /api/notifications tanpa autentikasi (mengembalikan list kosong / 401)', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect([200, 401]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBe(0);
    }
  });

  test('TC-API-13: GET /api/hibah - Mengambil data hibah publik/terbuka', async ({ request }) => {
    const response = await request.get('/api/hibah');
    expect(response.status()).toBeLessThan(500);
  });

  test('TC-API-14 [RBAC Security]: GET /api/admin/stats tanpa hak admin (401/403 Forbidden)', async ({ request }) => {
    const response = await request.get('/api/admin/stats');
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-15 [RBAC Security]: GET /api/admin/users tanpa hak admin (401/403 Forbidden)', async ({ request }) => {
    const response = await request.get('/api/admin/users');
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-16 [RBAC Security]: GET /api/admin/withdrawals tanpa hak admin (401/403 Forbidden)', async ({ request }) => {
    const response = await request.get('/api/admin/withdrawals');
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-17: POST /api/webhooks/midtrans - Verifikasi format notifikasi pembayaran', async ({ request }) => {
    const response = await request.post('/api/webhooks/midtrans', {
      data: {
        order_id: 'TEST-ORDER-123',
        transaction_status: 'settlement',
        fraud_status: 'accept',
        status_code: '200'
      }
    });
    expect(response.status()).toBeLessThan(500);
  });
});
