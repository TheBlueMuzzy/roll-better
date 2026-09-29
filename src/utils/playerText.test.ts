import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// B005: the UNLOCK / SKIP buttons were removed in v1.6 (you drag to unlock now).
// Player-facing text must not tell players to tap-select or press those buttons.
const FILES_WITH_PLAYER_TEXT = ['src/App.tsx', 'src/components/HowToPlay.tsx', 'src/components/HUD.tsx'];

describe('player-facing text matches drag-to-unlock (B005)', () => {
  for (const file of FILES_WITH_PLAYER_TEXT) {
    it(`${file} never mentions the old UNLOCK/SKIP buttons`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/press UNLOCK|Tap locked dice|press SKIP/i);
    });
  }
});
