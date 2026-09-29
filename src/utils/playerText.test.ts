import { describe, it, expect } from 'vitest';
import appSource from '../App.tsx?raw';
import statusSource from '../components/StatusPin.tsx?raw';
import wordsFile from '../../content/text/en.json?raw';

// B005: the UNLOCK / SKIP buttons were removed in v1.6 (you drag to unlock now).
// Player-facing text must not tell players to tap-select or press those buttons.
const FILES_WITH_PLAYER_TEXT: Record<string, string> = {
  'App.tsx': appSource,
  'StatusPin.tsx': statusSource, // picks the in-game status words (was HUD.tsx until F56)
  'content/text/en.json': wordsFile, // every screen's words live here now (How to Play too)
};

describe('player-facing text matches drag-to-unlock (B005)', () => {
  for (const [file, source] of Object.entries(FILES_WITH_PLAYER_TEXT)) {
    it(`${file} never mentions the old UNLOCK/SKIP buttons`, () => {
      expect(source).not.toMatch(/press UNLOCK|Tap locked dice|press SKIP/i);
    });
  }
});
