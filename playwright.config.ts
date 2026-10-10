import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Timeout per test: 90 detik (DB Supabase bisa lambat)
  timeout: 90_000,
  // Hanya jalankan serial dengan 1 worker agar DB tidak dibanjiri
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    // Viewport desktop lebar supaya md:block elemen terlihat
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    // Screenshot otomatis saat gagal
    screenshot: 'only-on-failure',
  },

  // Hanya jalankan di Chromium agar tidak membebani DB 3x lipat
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
