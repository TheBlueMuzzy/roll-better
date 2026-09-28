# Roll Better — State

## ▶ RESUME HERE
Housekeeping done 2026-09-28: GDD rebuilt on the BMUZ-2 template (~110 lines, detail moved word for word to `design/` + `research/audience.md`), TDD slimmed, VISION.md → `archive/vision.md` (ideas were already in ROADMAP Later). F47 approved ✅, F49 ✅.
Next: sprint 01 still has the roll physics bugs — `/develop` task 7 (B007 dice escape + hang, P1), 8, 9 (B008 gather misses dice). Then the UI-kit rollout (ROADMAP Ideas) needs `/define` first: kit additions + the Cartoon-vs-dark-table art call.
Muzzy: confirm the draft Experience targets (GDD §2) + open questions (GDD §9 — incl. is a 0-point win with 4 leftover dice intended?).
Muzzy: check B003 on two real phones on the LIVE site → verified. · Did your late-drag retry (B006) come out clean? → verified.
Muzzy: What stage is the live game (alpha/beta/1.0), and what's next? · Confirm the draft scope in GDD §7. · LAPTOP: install BMUZ-2 (`! cd ~/.claude-config && git pull && bash setup.sh`, restart). · Obsidian setup when there's 5 minutes.

## Where we are
Stage: develop   Milestone: v1.6 — Drag-to-Unlock   Sprint: 01 — Rolling and unlocking are solid
Doing: housekeeping done; roll physics bugs (B007, B008) next
Branch: dev/v1-6-drag-to-unlock   Version: 0.2.1.1
Live: https://thebluemuzzy.github.io/roll-better/ — v0.2.1, release stage not set

## Key facts
**Run/deploy**
- Dev: Vite `http://localhost:5173` (`--host` for phones on LAN) + PartyKit `npm run party:dev` on `localhost:1999`. `.env` must NOT set `VITE_PARTY_HOST` for local dev.
- `npm test` (vitest) · `npm run build` = `tsc -b && vite build` — must pass before any release.
- Front end auto-deploys to GitHub Pages on every push to `master` (workflow sets `VITE_PARTY_HOST`). CI now runs `npm run build` + `npm test` (F49). Build on work branches, merge to master only via /deliver.
- Server: `npx partykit deploy` by hand, only when `party/` changes — a front-end release doesn't update it.
- Version lives in `version.json` AND `package.json` (keep both in step). Tags `vX.Y.Z`. Default branch `master`, remote `origin` = github.com/TheBlueMuzzy/roll-better.
**Rules**
- R3F: never React state for per-frame updates — mutate refs in `useFrame`.
- Physics decides the dice (`getFaceUp`), offline and online. No fake RNG.
- Online = invisible layer: your own screen behaves like offline; nobody waits for another human. Others' results stay hidden until you've acted.
- Unlock online = your own 3 s drag timer, then ONE `unlock_request`/`skip_unlock` (TDD D15 — Muzzy's decision, don't re-argue).
- Scoring = max(0, 8 − 2 × dice left in pool) (43-01). Handicap every round, starting dice 1–12. Client cap: pool + locked + unlocks ≤ 12.
- AFK: 2 consecutive auto-actions → bot takes the seat. Timers table: TDD §2b.
**Architecture** (detail in TDD §2/§2b)
- Client-authoritative dice, server-authoritative locking (`findAutoLocks` on the server). Every `phase_change` carries a full snapshot, applied after animations (5 s safety).
- Identity: `conn.id` (sessionStorage) per tab, `persistentId` (localStorage) owns the seat; rejoin → `rejoin_state`; host migrates, all-bot room dissolves.
**Don't re-break**
- B003: HUD must run the unlock inactivity timer online too, and timer-end must send the drags to the server (`unlockTurn.ts` + test). No separate 20 s online unlock countdown.
- B006: once the timer fires (`unlockTimerResetKey` -1) the turn is closed — no new drags; `handleUnlockTimerExpire` must call `completeDragUnlock` BEFORE setting -1 (held drag resolves by zone). `setPhase` (leaving unlocking) + `initRound` clear `committedUnlocks`. Guarded by `unlockTurn.test.ts` + `npm run e2e:solo`. Leaving the unlock phase: a still-parked die goes BACK to its slot (`returnParkedDice`), never dropped or carried over. Race check: `node e2e/unlock-race-sweep.mjs [passes] [pages] [step]`.
- 12-dice cap lives in `src/utils/diceCap.ts` — phone AND server use it; don't re-inline it. Server backstop is topped up by `unlock_activity` (D16).
- B004: `npm run build` must stay green (CI won't tell you).
- BUG-002: `setRollResults` must NOT clear `pendingLockReveals`/`pendingUnlockReveals` (only `initRound` + flush do); unlock value fallback is `goalValues[slot]`, never `1`; deferred phase polling keeps its 5 s timeout.
- ISS-003: the server generates goal values (in `game_starting`) — clients never roll their own goal.
- ISS-005 / B001 / B002: keep DicePool's 10 s absolute settle timeout, 200 ms fallback, active speed check, `snapFlat` (dot < 0.95) and the 0.2 u wall nudge. B001 diagnostic logs are intentional.
- DicePool keys `${generation}-${i}` (generation bumps when pool shrinks) — fixes wrong faces after locking.
- 46-03: `processAIUnlocks(true)` clears state + animations in one update (else AI unlock dice flash); don't re-add an early `clearAIUnlockAnimations`.
- StrictMode double-fires effects in dev — init logic idempotent, `hasFired` refs guard callbacks.
- 46-03 tried more angular damping — reverted; keep 0.3.

## Log
- 2026-09-28 — F47 built: late drag resolves by zone and the turn closes at timer end (B006), nothing left parked, server rules match the phone, AFK players see the split. F49: deploy now runs tests + type check. e2e scripts use their own browser.
- 2026-09-28 — F47 tasks 1–5: B006 late drag fixed (turn closes at timer end), parked dice cleared, AFK unlocks via drag path, shared 12-dice cap, D16 unlock_activity, e2e scripts (`npm run e2e`). Removed dead tap-to-unlock code (`handleConfirmUnlock`, `toggleUnlockSelection`, `confirmUnlock`, `skipUnlock`, `clearSpot.ts`).
- 2026-09-28 — Hotfix v0.2.1: B003 online drag-to-unlock fixed (one batched unlock_request, TDD D15) + B004 build type-check fixed; released. Converted planning to BMUZ-2.
- 2026-09-26 — Docs: ISSUES + PRD refresh.
- 2026-03-30 — Phase 46 done: inactivity timer, batch in-place mitosis, UNLOCK/SKIP removed, faster settle, AI unlock flash fixes (build 92).
- 2026-03-29 — v1.6 Drag-to-Unlock started: phases 44–45 (drag locked dice, drop zone, commit + glow).
- 2026-03-28 — Vacuum VFX rings during the gather gesture.
- 2026-03-27 — v1.5 Hold-to-Gather-Roll shipped: release-roll, AFK force-release, polish (collision groups, speed curve, scoring 8 − 2×pool).
- 2026-03-26 — v1.4 Landscape shipped; v1.5 phases 40–41 (touch goals, physics attractor + orbit).
- 2026-03-25 — Landscape: 3D profile elements (37.1), menus + modals (38), HUD.
- 2026-03-13 — Session handoff notes.
- 2026-03-12 — v1.3 Drop-in/Drop-out shipped (UAT); landscape layout foundation + 3D scene rework (35–36).
(Older entries: `.planning/archive/log.md`)
