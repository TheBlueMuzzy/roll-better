# Project State

## Current Status
Phase 16 complete. Full server-authoritative game engine: roll → lock → unlock → score → handicap → next round → session end. Multi-winner support, AFK timeout, disconnect-safe. Next: Phase 17 (dice sync + simultaneous play).

## Version
0.1.0.115

## Current Position

Phase: 16 of 21 (State Sync Protocol)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-03-03 — Completed 16-02-PLAN.md

Progress: ██████████████████████████████████████████████████░ 80%

## Last Session
2026-03-03 — Plan 16-02 execution + audit fixes:
- Unlock/skip handlers: wait-for-all pattern, must-unlock guard
- AI unlock decisions via shared getAIUnlockDecision
- Multi-winner scoring: ScoringMessage.winners[] array (not single winnerId)
- Scoring formula: penalties [1,0,1,1], matches client exactly
- Handicap: winner -1 (min 1), others +1 (max 12)
- Session end at score >= 20, highest score wins, ties are ties
- Starting dice fixed: 5 → 2 (matches PRD/client)
- Disconnect-safe: removePlayer marks isOnline=false in gameState, re-checks unlock responses
- 20-second AFK timeout auto-skips unresponsive players
- Timer cleanup: 4 timers (locking, scoring, roundEnd, unlockTimeout)

Previous session (16-01):
- Game action protocol types: roll, unlock, phase change, round start, scoring, session end
- Server game state tracking: ServerGameState/ServerPlayerState with round initialization
- Server roll handler: generates dice for all players, computes auto-locks via findAutoLocks

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
- Pure physics determines roll results (no fake RNG) — online: server-authoritative random
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
- Server unlock: wait-for-all pattern, 20s AFK timeout auto-skip
- Multi-winner scoring: winners[] array in ScoringMessage
- Session end: highest score wins, ties are ties (client determines from player states)
- Starting dice = 2 (matches PRD/client)
- Disconnect-safe: removePlayer updates both room players and gameState players

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- ISS-004: Online game rolls not synced — server generates results (16-01), client consumption in Phase 17

### Roadmap Evolution

- Milestone v1.1 Online Multiplayer created: real-time multiplayer via Partykit, 8 phases (Phase 14-21)

## Session Continuity
Last session: 2026-03-03
Stopped at: Completed Phase 16 (State Sync Protocol). Next: Phase 17 (Dice Sync + Simultaneous Play)
Resume file: None
