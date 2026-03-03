# Project State

## Current Status
Phase 14 in progress. Plan 14-02 (Room Server Implementation) complete. Full room server with player tracking, host assignment, host migration, disconnect handling, and edge case guards.

## Version
0.1.0.103

## Current Position

Phase: 14 of 21 (Partykit Server Setup)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-03-03 — Completed 14-02-PLAN.md

Progress: █████████████████████████████████████████████░░░ 62% (13/21 phases + 14 started)

## Last Session
2026-03-03 — Plan 14-02 execution:
- Replaced placeholder server with full room lifecycle management
- Players tracked via in-memory Map keyed by connection ID
- First player becomes host automatically; host migration on disconnect
- Room closes when last player leaves; rejects connections when closed/full (8 max)
- Message handling: join (name/color validation), leave, malformed JSON recovery
- Broadcast helpers: sendToConnection, broadcastRoomState, broadcastExcept
- Edge cases: connect-without-join guard, duplicate join idempotency, capacity checks
- Diagnostic logging for joins, leaves, host changes, errors
- Verified: tsc --noEmit passes, partykit dev starts cleanly on :1999

## RESOLVED: Shake-to-Roll on Phone
Shake-to-roll trigger works (confirmed 2026-03-03). Gravity-mapping idea (accelerometer → Rapier gravity per-frame for physical dice shaking) deferred to VISION.md as future upgrade.
**Dev server**: `http://localhost:5174/` (PC) / `http://192.168.1.152:5174/` (phone)

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2, unlock flow updated)
- `.planning/research/dice-visuals.md` — 3D dice rendering research

## Key Decisions
- Auto-lock then choose to unlock
- Scoring: max(0, 8 - poolSize * 2) where poolSize = remaining unlocked dice at win
- Handicap every round (floor 1, ceiling 12)
- 2-8 players, 20-point sessions
- Phase 1: local AI, Phase 2: WebSocket rooms (##X## codes)
- Premium 3D dice: MeshPhysicalMaterial + clearcoat + HDRI + AccumulativeShadows
- Physics: Rapier, gravity -50, restitution 0.35 (die), face-up detection via dot product
- PhysicsDie: forwardRef + useImperativeHandle for roll API, settle detection via sleep events
- Settle detection: per-die boolean array with onUnsettled callback + 500ms fallback timer
- Pure physics determines roll results (no fake RNG)
- Vite v7 scaffold (latest stable)
- Camera locked top-down at [0, 12, 0.01], fov 50
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable, position:absolute inside game viewport
- DIE_SIZE = arena_width / 9.5 ≈ 0.589 (scaled down from 8.5 for breathing room)
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8 — prevents dice escaping at peak of roll arc
- ROLLING_Z_MIN = -1.7 — boundary between rolling zone and placement zone
- Placement zone floor #4a3020
- GoalRow Z = -4.67, PlayerRow Z = -3.77
- SLOT_SPACING = 0.62, getSlotX centering (i - 2.5), PROFILE_X_OFFSET = 0.10
- PlayerProfileGroup: right-aligned, 44px avatar + 42px star-score + SX|TX stats
- GoalProfileGroup: right-aligned, 48px circle + potentialScore display
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Tap-text instead of button — "Tap To Roll" → "Rolling" → results
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- PLAYER_COLORS in store file (avoids circular dep with Die3D)
- initGame must reset currentRound for StrictMode safety
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function, left-to-right slot filling, returns only new locks
- Phase transitions via chained useEffect timers with cleanup (StrictMode-safe)
- Unlock flow: white ring + pulse, tap to select (lifts up 0.3), UNLOCK button confirms
- Unlock returns die + bonus die via mitosis split animation
- DicePool uses generation-counter keys + remainingDicePositions for position persistence
- Must unlock 1+ when poolSize reaches 0 (soft lock prevention)
- 12-die cap: maxUnlocks = 12 - poolSize - lockedCount (net +1 die per unlock)
- Shake feedback (150ms, 90Hz) on rejected unlock selections
- Ease-in-out cubic easing for lock lerp (user feedback: much better than ease-out only)
- AnimatingDie renders outside Physics group (visual-only, no physics body)
- animatingSlotIndices hides PlayerRow dice during flight to prevent overlap
- Mitosis split over departure+spawn — communicates "1 die → 2 dice" intuitively
- Pool dice persist at physical positions — generation key still bumps but uses saved positions
- Lift-to-select instead of shrink — feels like picking the die up
- Center-preferring clear-spot placement with minimum clearance
- 3-axis random shake with ramping direction change rate (15→60/sec)
- Score counting via RAF in HTML overlay (not useFrame — HUD is outside Canvas)
- initRound({ skipPhase: true }) for staged round transitions
- Goal transition: 500ms exit + 500ms enter within 2000ms roundEnd window
- Settings panel: HTML overlay z-index 50, gear button in HUD bottom-right
- Settings persist in Zustand (not reset by initGame/initRound)
- Performance mode as single toggle, not segmented control
- Confirmation setting: on/off toggle, will affect unlock-to-roll flow when hooked up
- H2P carousel: z-index 60 (above settings), touch swipe via refs, breadcrumb dots
- Layered modal pattern: settings (z-50) < H2P (z-60) — modals stack
- Tips: CSS transition toggle pattern (mount → rAF → add class), one-at-a-time guard
- Tips: session-scoped (reset initGame, not initRound), hidden when settings open
- AI strategy pattern: shared constraint checks (cap, must-unlock) → difficulty-specific function
- AI match rate = (poolSize * uniqueRemaining/6) / remainingSlots — efficiency metric
- AI Easy: 40% unlock chance, max 1 die; Medium: poolSize < remaining/2 heuristic; Hard: matchRate < 0.5 threshold
- SIMULTANEOUS PLAY — all players roll/lock/unlock in same phases together (NOT turn-based)
- Round ends immediately when ANY player completes the goal
- AI rolls: random numbers computed in setRollResults alongside human dice physics
- AI unlocks: decisions processed when human confirms/skips (processAIUnlocks action)
- Inner-wrapper animation: useFrame drives position/rotation/scale on inner group, outer group holds static face rotation + DIE_SIZE
- Star-origin emergence: STAR_WORLD_X = getSlotX(0) - 0.9, local offset = (starX - slotX) / DIE_SIZE
- Unified unlock/skip button centered at 55% vertical in pool area
- Tips positioned at top: 36% (just below divider line)
- AI lock animations: separate aiLockAnimations array with playerId, fromScale=0 toScale=1
- AnimatingDie scale interpolation: (fromScale + (toScale - fromScale) * eased) * DIE_SIZE
- AI unlock animations: animate-then-apply pattern, scale 1→0 arc back to profile group
- Combined animatingSlotIndices for AI rows (lock-in + unlock-out in single prop)
- Pool exit: ExitingDie pop (1→1.3 ease-out) + shrink (1.3→0 ease-in), 0.45s total
- Pool spawn: SpawningDie from avatar pos, scale overshoot 0→1.15→1, tumble during flight
- poolSpawnPositions pre-computed and shared with DicePool (no teleport on swap)
- Unlock ring/pulse only on selectable dice (dynamic based on remaining cap)
- Goal indicators: 3D CircleGeometry dots above goal row, split wedges for ties
- Stacked dice: 500ms fallback timer fires results when all faces reported
- Screen state as simple string union in Zustand ('menu' | 'game' | 'winners')
- Menu at z-index 70 (above settings z-50 and H2P z-60)
- Canvas/HUD don't render on menu screen (saves GPU)
- Settings "Quit Game" → "Main Menu" via setScreen
- Single timeout for multi-state transitions (setPhase + setScreen) to prevent React cleanup races
- PlayerProfileGroup Html zIndexRange [40,0] — below all overlays (settings 50, H2P 60, menu/winners 70)
- CSS opacity transitions (0.3s) for screen fades — no JS animation libraries
- pointer-events: none on hidden overlays to prevent click blocking
- Game preferences stored in Zustand (session-scoped, not localStorage)
- handleMenu resets phase to lobby before screen change
- Cosmetic animations deferred to art pass (user direction)
- Shake-to-roll: SHAKE_THRESHOLD = 15, SHAKE_COOLDOWN = 1000ms (tunable)
- DeviceMotion refs (not state) for high-frequency acceleration tracking
- iOS permission-gated sensor pattern: detect → requestPermission → track state → listen
- Haptics: pure utility pattern, no React state — gating at call site
- Force-proportional bounce: clamp [0,50] → map [3,15]ms, skip below force 5
- Feature-detected mobile API: isSupported() guard + no-op fallback pattern
- touch-action: manipulation (not none) — preserves pan/tap, kills zoom
- position: fixed on body for iOS rubber-band prevention
- dpr=1 in simple mode (biggest GPU win on high-DPI), [1,2] in advanced
- AccumulativeShadows unmounted in simple mode (not just hidden)
- Dice materials untouched in simple mode — premium look non-negotiable
- Responsive tokens: 5-step --fs-* font scale + 5-step --sp-* spacing scale + layout tokens via clamp()
- Safe-area-inset calcs preserved when swapping base px to custom properties
- Audio: Stub-based hook system — 18 no-op functions wired at all game event trigger points
- Audio: initAudio/setVolume functional (AudioContext + masterGain), sound bodies empty
- Audio: Real audio assets to be implemented during art pass
- Room server: Players Map keyed by connection ID, first player = host, host migration on disconnect
- Room server: removePlayer shared helper for leave + onClose, guard against connect-without-join
- Room server: broadcastRoomState/sendToConnection/broadcastExcept helper pattern

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- ISS-003: After auto-lock shrinks pool, surviving dice may show locked values briefly (cosmetic)

### Roadmap Evolution

- Milestone v1.1 Online Multiplayer created: real-time multiplayer via Partykit, 8 phases (Phase 14-21)

## Session Continuity
Last session: 2026-03-03
Stopped at: Completed 14-02-PLAN.md
Resume file: None
