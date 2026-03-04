# Project State

## Current Status
Phase 18, Plan 1 complete (scoring + session end sync) — applyOnlineScoring and applyOnlineSessionEnd store actions. Online scoring triggers HUD counting animation, session end shows winners screen.

## Version
0.1.0.122

## Current Position

Phase: 18 of 21 (Unlock + Scoring Sync)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-04 — Completed 18-01-PLAN.md

Progress: ███████████████████████████████████████████████████████░ 87%

## Last Session
2026-03-04 — Plan 18-01 execution:

- **Task 1** (commit d80a5ad): applyOnlineScoring store action — maps server PlayerSyncState[] to local players via onlinePlayerIds, sets phase='scoring' + roundScore
- **Task 2** (commit 3d98fb1): applyOnlineSessionEnd store action — syncs final scores, sets phase='sessionEnd' + screen='winners'

## Previous Sessions
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

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

### Roadmap Evolution

- Milestone v1.1 Online Multiplayer created: real-time multiplayer via Partykit, 8 phases (Phase 14-21)

## Session Continuity
Last session: 2026-03-04
Stopped at: Completed 18-01-PLAN.md
Commits this session: d80a5ad, 3d98fb1
Resume file: None
