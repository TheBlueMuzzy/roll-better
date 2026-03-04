# Project State

## Current Status
18-03 implemented: Client-driven rolling AFK countdown timer. Server-side `setTimeout(20_000)` was unreliable in PartyKit's workerd runtime. Solution: host client runs a visible 20s countdown bar, sends `rolling_timeout` to server when it hits zero. Server clears its fallback timer and auto-rolls AFK players. Server timer stays as silent fallback if host disconnects. Awaiting manual playtest verification.

## Version
0.2.0.2

## Current Position

Phase: 18 of 21 (Unlock + Scoring Sync)
Plan: 18-03 complete (UAT passed)
Status: Phase 18 complete
Last activity: 2026-03-04 — 18-03 client-driven countdown built

Progress: ██████████████████████████████████████████████████████████░ 93%

## Last Session
2026-03-04 — 18-03 client-driven rolling AFK countdown:

- Added `isOnlineHost` to game state, passed through from lobby
- New `RollingCountdown` component: 20s countdown bar during online rolling phase
- Host client sends `rolling_timeout` message when bar hits zero
- Server handles `rolling_timeout`: validates host + phase, clears fallback timer, auto-rolls AFK players
- Server-side `setTimeout(20_000)` retained as silent fallback
- Version bumped to 0.2.0.2

### Previous Session
2026-03-04 — Phase 18 completion + release:

- **18-02** (commits d66365e, 45316e2, b7d6ef5): Online round transitions — roundEnd exit animations, round_start enter transitions, 3 sync bugfixes
- **Extra** (commit a4078b6): Restart game flow, scoring sync fix, faster other-player lock animations
- **Release** (commit 691a0ca): v0.2.0 tagged — Online Multiplayer milestone

## Previous Sessions
- 18-01: Scoring + session end sync (applyOnlineScoring, applyOnlineSessionEnd)
- 17-04: Per-player relay for rolling + unlocking, buffered reveals, checkpoint fixes
- 17-03: Server wait-for-all rolling, disconnect safety, onlinePlayerIds mapping
- 17-02: Timing barrier, roll results merge, physics settle routing
- 17-01: Module-level socket, online mode flags, useOnlineGame hook

## RESOLVED: Shake-to-Roll on Phone
Shake-to-roll trigger works (confirmed 2026-03-03). Gravity-mapping idea deferred to VISION.md.
**Dev server**: `http://localhost:5174/` (PC) / `http://192.168.1.152:5174/` (phone)

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2, unlock flow updated)
- `.planning/research/dice-visuals.md` — 3D dice rendering research

## Key Decisions
- Auto-lock then choose to unlock
- Scoring: penalties [1,0,1,1], roundScore = max(0, 8 - penalty sum)
- Handicap every round (floor 1, ceiling 12)
- 2-8 players, 20-point sessions
- Phase 1: local AI, Phase 2: WebSocket rooms (##X## codes)
- Premium 3D dice: MeshPhysicalMaterial + clearcoat + HDRI + AccumulativeShadows
- Physics: Rapier, gravity -50, restitution 0.35 (die), face-up detection via dot product
- PhysicsDie: forwardRef + useImperativeHandle for roll API, settle detection via sleep events
- Settle detection: per-die boolean array with onUnsettled callback + 500ms fallback timer
- Pure physics determines roll results (no fake RNG) — online: client-authoritative values sent to server
- Vite v7 scaffold (latest stable)
- Camera locked top-down at [0, 12, 0.01], fov 50
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable, position:absolute inside game viewport
- DIE_SIZE = arena_width / 9.5 ≈ 0.589
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8, ROLLING_Z_MIN = -1.7, Placement zone floor #4a3020
- GoalRow Z = -4.67, PlayerRow Z = -3.77
- SLOT_SPACING = 0.62, getSlotX centering (i - 2.5), PROFILE_X_OFFSET = 0.10
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- SIMULTANEOUS PLAY — all players roll/lock/unlock in same phases together (NOT turn-based)
- Round ends when ANY player(s) complete the goal — multiple can win same roll
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function shared client/server
- Room server: Players Map keyed by connection ID, first player = host, host migration on disconnect
- Partykit dev port pinned to 1999 in partykit.json
- Protocol types standalone (no game.ts imports)
- Server-authoritative color assignment: PLAYER_COLORS[joinOrderIndex]
- Server-generated goalValues broadcast in game_starting
- Online game auto-fill: < 4 players → fill to 4 with AI; >= 4 → no AI
- Server unlock: per-player relay pattern (like rolling), 20s AFK timeout with must-unlock guard
- Multi-winner scoring: winners[] array in ScoringMessage
- Session end: highest score wins, ties are ties (client determines from player states)
- Starting dice = 2 (matches PRD/client)
- Disconnect-safe: removePlayer updates both room players and gameState players
- addEventListener('message') coexists with useRoom onmessage — no conflict
- Module-level socket singleton for cross-hook access (not React ref)
- onlinePlayerIds mapping: client index → server ID (connection IDs for humans, bot-N for bots)
- **Client-authoritative dice**: Each client rolls physics, reports settled values to server. Server computes locks via findAutoLocks and relays to others.
- **Per-player relay (no batching)**: Server processes each player's result individually and immediately broadcasts via broadcastExcept. Applies to BOTH rolling AND unlocking.
- **Client-side buffered reveals**: Other players' results stored in pendingLockReveals / pendingUnlockReveals. Flushed (with animation) after local player's own action. Same pattern for both.
- **Reveal animations**: Profile-emerge (scale 0→1, fly from profile to slot) for locks. AI-unlock-style (shrink, fly to profile) for unlocks. Always animated, never pop-in.
- **Server-authoritative scoring**: Client trusts server scores, extracts local roundScore from winners array for HUD animation
- **Deferred phase safety**: 5s timeout on deferred phase_change polling prevents infinite loops from stale animation state
- **Restart game flow**: Any remaining player can restart after session end, server handles restart_game message

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- **BUG-002 (fixed):** Buffered reveals lost during physics settling — setRollResults was clearing pending buffers. Fixed in 45316e2.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- **18-03 complete**: Client-driven rolling AFK countdown — UAT passed all 5 tests (2026-03-04).

### Roadmap Evolution

- Milestone v1.1 Online Multiplayer created: real-time multiplayer via Partykit, 8 phases (Phase 14-21)
- v0.2.0 released mid-milestone after Phase 18 Plan 02 — playable online multiplayer shipped

## Future Plans
- Phase 18-03: Rolling AFK timer + disconnect safety during rolling phase
- Phase 19: Connection resilience (disconnect/reconnect, AI drop-in replacement)
- Phase 20: GitHub Pages + PWA deployment
- Phase 21: Compliance + integration testing

## Session Continuity
Last session: 2026-03-04
Stopped at: Phase 18 complete — all 3 plans done, UAT passed
Commits this session: ec5e126 (feat: rolling AFK timeout), pending (client-driven countdown)
Resume file: None
