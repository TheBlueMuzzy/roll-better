# Roll Better — Full rules
> Detail for GDD §4 How it plays — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

## 4. Core Gameplay

### 4.1 Session Structure
- A **session** = a series of **rounds** played until 1+ players reach **20 points**
- Players who cross 20 on the same round all win
- **Offline**: 2–4 players (1 human + AI), selectable from main menu
- **Online**: 2–8 players (humans + AI backfill when host starts)
- AI fills remaining slots when host starts early

### 4.2 Round Setup
1. **Goal Generation**: Roll 8 standard six-sided dice. Sort by number ascending.
   - Example Goal: [1, 1, 2, 3, 3, 3, 5, 6]
   - Goal dice are white and positioned horizontally at the top of the screen
   - Goal dice emerge from the star icon with a scale-up + tumble animation, then lerp to their sorted positions
2. **Pool Reset**: Each player's dice pool resets to their current **starting dice count** (Z value)
   - Default starting count: 2
   - Modified by handicap each round (see 4.6)
   - Range: 1–12

### 4.3 Turn Flow (simultaneous, all players)
Each turn has these phases, executed simultaneously for all players:

**Phase 1 — Roll (`idle` → `rolling`)** — hold-to-gather roll (v1.5)
- Press and hold anywhere in the rolling area: your dice are pulled toward your finger and orbit it, spinning faster the longer you hold (speed ramps up over 2.5 s; vacuum rings show the pull)
- Release to fling them — they fly off with the orbit's momentum, tumble, bounce off invisible walls, and settle naturally
- **AFK timer**: 20-second countdown appears if the player hasn't rolled. When it expires, the game gathers and releases for them.

**Phase 2 — Auto-Lock (`rolling` → `locking`)**
- After all dice settle, the game runs `findAutoLocks()` to identify which rolled dice match unfilled Goal slots
- Matching dice automatically lerp from their settled positions to the corresponding Goal slots (staggered ~100ms apart, ~400ms each)
- **Lock-in limit**: Up to the Goal's count per number. If the Goal has three 3s, you can lock at most three 3s.
- Auto-locking is fully automatic — there is no way to skip or cancel a lock
- Non-matching dice remain in the pool (a scale-down exit animation plays, then they respawn at pool positions for the next roll)

**Phase 3 — Winner Check (during `locking`)**
- After lock animations complete, check: does any player have all 8 slots locked?
- If YES → proceed to **Scoring** (4.5), then start a new round
- If NO → proceed to Phase 4

**Phase 4 — Unlock Phase (`unlocking`)** — drag-to-unlock (v1.6)
- Drag a locked die from your row down into the rolling area and let go — it's committed where you drop it and glows. Drop it back over the locked row (or not far enough) and it snaps back.
- Drag as many as you like, one at a time. There are no buttons: doing nothing = skipping.
- **Inactivity timer**: a 3-second countdown bar; every drag restarts it. When it runs out, the turn ends:
  - a die still being dragged resolves by where it is — over the rolling area it counts (placed at a clear spot), over the locked row it snaps back
  - after that, locked dice can't be picked up until the next unlock turn
- Then all your committed dice split at once (**batch mitosis**), in place where you dropped them:
  1. Each committed die splits into 2 (the original + a bonus die)
  2. Net effect per die: locked −1, pool +2 (net +1 total dice)
- **Must-unlock rule**: If pool size is 0 and locked < 8, the player MUST unlock at least 1 die (can't roll with 0 dice). If the timer runs out with nothing dragged, the game unlocks one for them.
- **Dice cap**: pool + locked + 2 per committed unlock can't exceed 12 — at the cap, locked dice can't be dragged.

**Phase 5 — Next Turn (`idle`)**
- Return to Phase 1 with updated pool/locked state
- Repeat until a winner is found

### 4.4 Turn Timing
- All players roll simultaneously — each gathers and releases on their own screen when ready
- Each player sees their OWN results immediately. Other players' results are hidden until you've rolled and locked in, then revealed with animation (full data flow: `TDD.md` §2b Multiplayer)
- Same pattern for unlocking: your choice applies immediately, others' choices revealed only after you've acted
- **Rolling AFK timer**: 20-second countdown. When it expires, auto-roll triggers. Client-driven with server-side fallback.
- **Unlock inactivity timer**: 3 seconds, restarted by every drag (see 4.3 Phase 4). Online it works exactly like offline — each phone's own timer ends its turn and sends one message with everything dragged. The server only steps in as a backstop if a phone goes silent (it then unlocks for that player that turn only, through the same drag path).
- The pace should feel brisk — no waiting for slow players

### 4.5 Scoring
When 1+ players lock all 8 dice matching the Goal:

**Points calculation:**
- Base: **8 points**, minus **2 per leftover die** (changed in v1.5 from the old `[1, 0, 1, 1]` penalty list)
- Formula: `points = max(0, 8 − 2 × remainingPool)`
- Remaining pool = dice NOT locked (total dice − 8 locked). Max remaining pool is 4 (since total cap is 12).

| Remaining Pool | Points |
|----------------|--------|
| 0              | 8 (perfect) |
| 1              | 6 |
| 2              | 4 |
| 3              | 2 |
| 4              | 0 |

**Strategic note:** A sloppy win still beats a slow perfect attempt that never completes — but with 2 per leftover die, a 4-leftover win now scores nothing (it still counts as a round win for the handicap). Early rounds favor aiming for 8 (perfect locks). As the session progresses, players who are behind benefit from aggressive unlocking — more dice means faster wins even at lower scores. The core tension: a fast sloppy win (4–6 pts) beats a slow perfect attempt that never completes (0 pts).

- All players who complete the Goal on the same turn score
- Players who did NOT complete the Goal score 0 for that round

**Scoring animation:**
1. Score counter in HUD counts up from old score to new score with cubic ease-out (1500ms)
2. Each tick plays an ascending tone; completion plays a fanfare
3. Score display does a scale-pop (1→1.15→1) on completion

### 4.6 Handicap System (between rounds)
Applied after every round:

- **Won** this round (locked all 8) → starting dice count (Z) **decreases by 1** (minimum 1)
- **Failed** this round (didn't complete) → starting dice count (Z) **increases by 1** (maximum 12)
- Next round: pool resets to new Z value

### 4.7 Session End
- When 1+ players have **20 or more total points**, the session ends
- All players who crossed 20 on the final round are declared winners
- Transition to **Winners Screen** showing final rankings (sorted by score descending)
- **Play Again**: Returns to game with same player count + difficulty (offline) or restarts with bots filling empty slots (online)
- **Back to Menu**: Returns to main menu

### 4.8 Edge Cases
- **All Goal dice are the same number** (e.g., eight 3s): Rare but valid. Players only need to roll 3s. Still plays normally.
- **Player has pool of 1**: They roll 1 die. If it doesn't match anything unlocked, they have 0 locked and 1 in pool. If they unlock a locked die, pool grows to 2. Starting from 1 is hard but not impossible.
- **Player has 0 pool dice and < 8 locked**: Must-unlock rule forces at least 1 unlock before next roll.
- **Player at 12 total dice and wins**: They score 0 points (8 − 2×4 remaining pool). Their Z still decreases by 1.
- **Multiple players hit 20+ on same round**: All are winners. The Winners Screen shows all of them.
- **Player disconnects mid-round (online)**: AI seamlessly takes over for disconnected player (game continues without pause). On reconnect, player takes back control from AI immediately. No data lost — PartyKit maintains room state.
- **Host exits to menu, remaining player hits Play Again (online)**: Game restarts with bots filling all empty slots. Works correctly.
