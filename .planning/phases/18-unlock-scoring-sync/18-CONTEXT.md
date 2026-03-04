# Phase 18: Unlock + Scoring Sync - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<vision>
## How This Should Work

The online round-end flow should be indistinguishable from local play. When someone locks all 8 dice, the same score animation plays, the same goal transition happens, the same pool spawn animation kicks off the next round. Server drives the timing instead of local timers, but the player experience is identical.

Turn timers should be added — if a player doesn't act within a reasonable window, AI takes over (rolling, unlocking). This prevents one AFK player from holding everyone hostage. The existing 20s unlock timeout is a starting point, but rolling should have a timer too.

If someone disconnects mid-game, the game shouldn't soft-lock. Auto-skip or AI-fill so the remaining players can keep playing. Full reconnection logic (rejoin, state recovery) is Phase 19 — this phase just needs to not break.
</vision>

<essential>
## What Must Be Nailed

- **No soft-locks** — every phase transition must work online: scoring, round end, next round, session end. The game must never get stuck.
- **Score animations feel right** — players need to SEE who won, the score counting animation, the handicap change. The emotional payoff of winning a round can't be skipped or broken.
- **Both equally** — it needs to work AND feel right. Can't ship one without the other.
</essential>

<boundaries>
## What's Out of Scope

- Special online session-end ceremony — when someone hits 20 points, just show the existing winners screen. No special online treatment needed.
- Full reconnection logic — if someone drops and comes back, that's Phase 19. This phase just prevents the disconnect from soft-locking others.
</boundaries>

<specifics>
## Specific Ideas

- Mirror local exactly — same animations, same timing, same feel. Server replaces local timers, nothing else.
- AFK timers on BOTH rolling and unlocking, not just unlocking.
- Disconnect = AI takes over that player's slot so others can continue.
</specifics>

<notes>
## Additional Context

The `scoring`, `round_start`, and `session_end` message handlers in useOnlineGame.ts are currently stubbed ("Phase 18 scope"). The local phase useEffects for scoring and roundEnd are skipped for online games. This phase needs to either handle those server messages or re-enable the local timers with server data.

The unlock flow is already fully working from Phase 17-04 (per-player relay, buffered reveals, animations). This phase focuses on everything AFTER unlocking: scoring, handicap, round transitions, and session end.
</notes>

---

*Phase: 18-unlock-scoring-sync*
*Context gathered: 2026-03-04*
