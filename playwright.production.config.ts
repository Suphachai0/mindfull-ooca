import { defineConfig } from '@playwright/test';

const port = Number(process.env.PRODUCTION_TEST_PORT || 5175);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/production',
  workers: 1,
  reporter: 'list',
  use: { baseURL, channel: 'chrome', reducedMotion: 'reduce' },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://jrtxrrghyutwbbujtubt.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      VITE_AUTH_ENABLED: 'false',
      VITE_PREVIEW_MODE: 'false',
      VITE_FEEDBACK_URL: 'https://github.com/suphachai-chaichang/ooca-stars/issues',
    },
  },
});
