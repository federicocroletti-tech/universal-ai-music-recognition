import { defineConfig, devices } from '@playwright/test';
import { HUM_WAV } from './e2e/paths';

const port = 4317;
const baseURL = process.env['E2E_BASE_URL'] ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-audio-capture=${HUM_WAV}`,
          ],
        },
      },
    },
  ],
  // Without E2E_BASE_URL, tests run against the local production build (run `npm run build` first).
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'node e2e/static-server.mjs',
        url: baseURL,
        env: { PORT: String(port) },
        reuseExistingServer: false,
      },
});
