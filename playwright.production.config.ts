import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/production',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5175', channel: 'chrome', reducedMotion: 'reduce' },
  webServer: {
    command: 'npm run dev -- --port 5175',
    url: 'http://127.0.0.1:5175',
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
