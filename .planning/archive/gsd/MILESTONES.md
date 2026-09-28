# Project Milestones: Roll Better

## v1.2 Polish (Shipped: 2026-03-06)

**Delivered:** UI/UX polish pass — simplified menus, removed shake-to-roll, randomized AI difficulty, merged lobby into main menu with inline Create/Join flow, and verified How to Play accuracy.

**Phases completed:** 22-26 (6 plans total)

**Key accomplishments:**

- Simplified main menu: removed difficulty selector, added How to Play + Upgrades buttons
- Removed shake-to-roll entirely, cleaned up Settings panel
- Settings gear icon (bottom-right) + audio slider with visible filled track
- AI difficulty randomly assigned per bot (no manual selection)
- Merged LobbyScreen into MainMenu with inline 4-state Create/Join flow
- Verified How to Play content accuracy for all v1.2 changes

**Stats:**

- 37 files created/modified (2,791 insertions, 1,305 deletions)
- 9,134 lines of TypeScript/CSS (total project)
- 5 phases, 6 plans, 33 commits
- 2 days from start to ship (2026-03-05 to 2026-03-06)

**Git range:** v1.1 to v1.2

**What's next:** TBD — next milestone to be determined.

---

## v1.1 Online Multiplayer (Shipped: 2026-03-05)

**Delivered:** Real-time online multiplayer with PartyKit WebSockets, Jackbox-style room codes, disconnect/reconnect resilience, PWA deployment, and compliance documentation.

**Phases completed:** 14-21 (20 plans total)

**Key accomplishments:**

- Real-time online multiplayer via PartyKit WebSockets (free Cloudflare tier)
- Jackbox-style 4-letter room codes with lobby, ready-up, AI fill
- Client-authoritative dice with per-player relay and buffered reveals
- Disconnect/reconnect with 60s keepalive and full state recovery
- GitHub Pages deployment with PWA (installable, auto-updates)
- Privacy policy + IARC 3+ compliance documentation

**Stats:**

- 76 files created/modified
- 10,864 lines of TypeScript/CSS (total project)
- 8 phases, 20 plans
- 3 days from start to ship (2026-03-03 to 2026-03-05)

**Git range:** `3cedc0f` to `ee15cb9`

**What's next:** TBD — game is publicly playable, next milestone to be determined.

---

## v1.0 MVP (Shipped: 2026-03-03)

**Delivered:** Complete local dice-matching game with 3D physics, AI opponents, animations, audio, and mobile-first responsive UI.

**Phases completed:** 1-13 (43 plans total)

**Key accomplishments:**

- Premium 3D dice with MeshPhysicalMaterial, clearcoat, HDRI reflections
- Rapier physics with face-up detection via dot product
- Full game loop: roll, auto-lock, unlock, score, handicap, session to 20
- AI opponents at Easy/Medium/Hard difficulty
- Shake-to-roll, haptics, responsive portrait layout
- Audio hooks wired (procedural sounds stripped to stubs pending art pass)

**Stats:**

- 13 phases, 43 plans
- 6 days from project start to ship (2026-02-27 to 2026-03-03)

**Git range:** Initial commit to Phase 13 completion

---
