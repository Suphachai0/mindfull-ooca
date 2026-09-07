import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { previewSeeds } from '../src/seeds';

describe('production assets', () => {
  test('the approved migration matches all 60 reviewed team stars', () => {
    const sql = readFileSync('supabase/migrations/202609080001_team_seeds.sql', 'utf8');
    expect(previewSeeds).toHaveLength(60);
    for (const star of previewSeeds) {
      expect(sql).toContain(star.id);
      expect(sql).toContain(star.content.replaceAll("'", "''"));
      expect(sql).toContain(`'${star.emotion}','team','approved'`);
    }
  });

  test('deployment headers allow only the required external services', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain('https://challenges.cloudflare.com');
    expect(headers).toContain('https://jrtxrrghyutwbbujtubt.supabase.co');
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
