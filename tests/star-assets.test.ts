import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { starAsset } from '../src/domain';

describe('Figma emotion star assets', () => {
  for (const emotion of ['tired', 'gloomy', 'lonely', 'heavy', 'unsure', 'okay'] as const) {
    it(`${emotion} uses four vector-only stages on a shared canvas`, () => {
      expect(starAsset(emotion)).toBe(starAsset(emotion, 0));
      for (let stage = 0; stage < 4; stage++) {
        const svg = readFileSync(`public${starAsset(emotion, stage)}`, 'utf8');
        expect(svg).toContain('viewBox="0 0 560 560"');
        expect(svg).toContain('<path');
        expect(svg).not.toMatch(/<image\b|data:image|<foreignObject\b|<clipPath\b/);
      }
    });
  }
});
