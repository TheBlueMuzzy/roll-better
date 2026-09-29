import { describe, it, expect } from 'vitest';
import appSource from '../App.tsx?raw';
import howToPlaySource from '../components/HowToPlay.tsx?raw';
import hudSource from '../components/HUD.tsx?raw';

// B005: the UNLOCK / SKIP buttons were removed in v1.6 (you drag to unlock now).
// Player-facing text must not tell players to tap-select or press those buttons.
const FILES_WITH_PLAYER_TEXT: Record<string, string> = {
  'App.tsx': appSource,
  'HowToPlay.tsx': howToPlaySource,
  'HUD.tsx': hudSource,
};

describe('player-facing text matches drag-to-unlock (B005)', () => {
  for (const [file, source] of Object.entries(FILES_WITH_PLAYER_TEXT)) {
    it(`${file} never mentions the old UNLOCK/SKIP buttons`, () => {
      expect(source).not.toMatch(/press UNLOCK|Tap locked dice|press SKIP/i);
    });
  }
});
