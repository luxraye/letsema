import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromium = '/opt/pw-browsers/chromium';
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'off',
    launchOptions: existsSync(chromium) && !process.env.CI ? { executablePath: chromium } : {},
  },
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run start', url: 'http://localhost:3000/api/health', reuseExistingServer: true, timeout: 120_000 },
});
