# Roll Better — Online play & AI opponents
> Detail for GDD §5 Systems — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

## 5. Game Systems

### 5.1 Multiplayer Architecture
Both modes are fully implemented:
- **Offline**: AI opponents only (local game logic, AI makes unlock decisions). Selectable from main menu with player count (2–4). AI difficulty is randomized per bot.
- **Online**: Room-based multiplayer via PartyKit WebSocket server with room codes. Create/Join flow is inline on the main menu (no separate lobby screen).

**Room Codes:**
- Format: 4-letter alphabetic code (excludes I and O for readability, e.g., `QRPD`)
- Case-insensitive
- Unique per active room, recycled when room closes
- Zero friction: no accounts, no downloads — just enter a code

**Room Flow (Jackbox-style):**
1. **Create**: Host taps "CREATE ROOM" → PartyKit room created → 4-letter code displayed prominently
2. **Join**: Player enters code on lobby screen → taps "JOIN" → enters room lobby
3. **Lobby**: Player list with names/colors, "READY" toggle per player, host sees "START GAME" button
4. **Start conditions**: Host clicks "START GAME" (host can configure target player count and AI difficulty)
5. **AI backfill**: Remaining slots filled with AI at configured difficulty

### 5.2 AI Opponents
AI makes unlock decisions based on difficulty-specific strategies. AI "rolls" use the same physics RNG as players — no cheating, no rigged dice.

- **Easy AI**: 40% chance to skip unlock entirely (unless must-unlock rule applies). When unlocking, picks 1 random locked die.
- **Medium AI**: Skips if pool size ≥ half of remaining slots needed (unless must-unlock). Scores each locked die by how frequently its value appears in remaining Goal slots. Unlocks 1–2 of the worst candidates (least useful to keep). Respects 12-die cap.
- **Hard AI**: Never unlocks if ≤2 remaining slots (unless must-unlock). Calculates expected match rate: `poolSize × (uniqueRemainingValues / 6) / remainingSlots`. Only unlocks if match rate < 0.5 (pool is inefficient). Unlocks by ascending frequency (sacrifices dice least likely to re-match), simulating one-at-a-time until match rate ≥ 0.5.

AI difficulty is randomly assigned per bot (Easy, Medium, or Hard). There is no user-facing difficulty selector.

### 5.3 Online Play
How the netcode works (who owns what, message flow, deferred snapshots, watchdog, timers) moved to `TDD.md` §2b Multiplayer. The player-facing rules:

#### Design Principles for Online Play
- **The local experience is the source of truth.** Online is an invisible layer on top. If you turned off the network, each player's own experience would look identical to offline.
- **No player waits for any other player to act.** You tap, your dice roll, your locks animate. You never see a loading spinner or "waiting for other players" during your own actions.
- **Information is private until you've acted.** You don't see what others rolled/locked/unlocked until you've done the same. This prevents influence and preserves the feeling of playing your own game.
- **Every reveal is animated.** "Immediately" means "with the standard animation" (profile-emerge for locks, appropriate animation for unlocks). Nothing pops into position.

(Old §5.4 State Management moved to `TDD.md` §2b.)
