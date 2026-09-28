# Roll Better — Game Design Document (GDD)
> What the game is, how it plays, how it should feel. Detail lives in `design/` (linked below).
> Current phase: Complete (core game shipped v1.0–v1.5; v1.6 Drag-to-Unlock in progress, live build v0.2.1)
> Engineering plan: `TDD.md` · Milestones, ideas, known issues: `ROADMAP.md` + `BUGS.md` · Words we use: `design/glossary.md`
> Slimmed to the BMUZ-2 shape 2026-09-28 — nothing deleted; long sections moved word for word into `design/` and `research/audience.md`.

## 1. Pitch
- **One line:** A browser dice-matching race — everyone rolls at once to match a shared Goal of 8 dice. Unlock dice to grow your pool and match faster, but every die left over when you finish costs you points.
- **Target feeling:** "That roll was INSANE!" — thrilling, lucky, social spectacle.
- **Core value:** The dice roll IS the product. Every decision serves the moment of the roll — 3D physics, satisfying animations, dramatic reveals.
- **Platform:** Web, landscape (phones held sideways + desktop). **Players:** 2–4 offline (you + AI), 2–8 online (AI fills empty seats).
- **Audience:** general (not made for kids) · casual players of Wordle, Yahtzee and board games with friends — quick thrilling rounds, no app download. Personas + competitor table: `research/audience.md`.
- **References:** Balatro (the "bend your luck" fantasy) · Dice Forge (dice as objects you invest in) · King of Tokyo (social spectacle of shared rolls) · Knucklebones (simple rules, fast rounds) · Wordle (daily ritual, shareable). Anti: MONOPOLY GO / Yahtzee with Buddies (predatory, pay-to-win).
- **Constraints:** free hosting only (GitHub Pages + PartyKit free tier) · zero data collection, no accounts · smooth on iPhone Safari + Android Chrome · physics decides every die (no fake RNG) · premium dice look (clearcoat + HDRI) · no monetization of any kind.

## 2. Experience targets  (MDA — DRAFT 2026-09-28, Muzzy to confirm)
| | Target | In players' words | We'll know when… (watchable) | Seen? |
|---|---|---|---|---|
| Primary | Sensation — the roll as spectacle | "Did you SEE that roll?!" | players react out loud / show the screen to someone mid-game | — |
| Secondary | Fellowship — racing friends at the same moment | "One more — I'm getting you this time" | a group hits Play Again without being asked | — |
| Secondary | Challenge (light) — push your luck | "I unlocked too many, that's on me" | players pause on the unlock turn and can say why they dragged | — |
| Not this game | Narrative · long grind / Discovery | — | — | — |
**Key moments:** the gather-and-release (building the spin, then letting go) · the last Goal slot locking for the win · the unlock gamble (drag one more?) · catching up after losing thanks to the handicap.
**Watch-outs:** waiting on other players · a roll that hangs or loses a die (B007) · a runaway leader the handicap can't catch · unlock turns that feel like busywork rather than a choice.

## 3. Pillars
- **The dice are the star** — the roll is the product — settles any "should this screen/effect compete with the dice?" (no).
- **Simple rules, deep decisions** — learn in 2 minutes; the only real choice each turn is what to unlock — settles feature creep (max 2–3 choices per turn).
- **Social by default** — every roll is a performance others see — settles hidden-vs-shown info (hidden until you've acted, then revealed with animation).
- **Fair forever** — no pay-to-win, no rigged dice, no monetization — settles every business question.
- **Catch-up is built in** — losing makes you stronger next round — settles balance tweaks toward keeping everyone in it.
- **Zero friction** — no account, a 4-letter room code, click and play — settles onboarding and online flow.
- **Juice everything** — every action gets feedback (lerps, pops, spawns, sounds).

## 4. How it plays
- **Core loop:** gather + release to roll → matching dice lock to the Goal automatically → drag locked dice back to unlock (each splits into 2) → roll again → first to fill all 8 Goal slots wins the round → first to 20 points wins the session.
- **Rules** (full detail + edge cases: `design/rules.md`):
  1. **Session** = rounds until someone reaches **20 points**; everyone who crosses 20 on the same round wins.
  2. **Round setup:** roll 8 Goal dice, sort them. Each player's pool resets to their **starting dice** (default 2, range 1–12).
  3. **Roll:** everyone rolls at the same time, on their own screen. 20 s roll timer, then the game rolls for you.
  4. **Lock:** dice matching an unfilled Goal slot lock automatically (never more of a number than the Goal has). No choice here.
  5. **Win check:** all 8 slots filled → score the round, start a new one.
  6. **Unlock:** drag locked dice into the rolling area. When the turn ends, each one splits into 2 (net +1 die). A 3 s inactivity timer ends the turn and every drag restarts it; doing nothing = skip.
  7. **Must-unlock:** 0 dice in the pool and fewer than 8 locked → you must unlock at least one (the game picks one if the timer runs out).
  8. **Dice cap:** 12 dice total (pool + locked + 2 per unlock).
  9. **Scoring:** the round winner(s) score **8 − 2 per die left in the pool** (minimum 0). Everyone else scores 0.
  10. **Handicap:** win the round → start the next with 1 fewer die (min 1); lose → 1 more (max 12).
- **Controls** (same on phone and desktop): **Roll** — press and hold in the rolling area to gather, release to throw. **Unlock** — drag a locked die from your row into the rolling area. Settings — gear icon. Screens and HUD: `design/screens.md`.
- **Mechanics:**
| Mechanic | What players end up doing → Target |
|---|---|
| Hold-to-gather roll | build the spin, choose the moment to let go → Sensation (it feels like *your* throw) |
| Simultaneous rolling | everyone rolls at once, results revealed with animation → Sensation + Fellowship |
| Auto-lock | no busywork after the roll; the eye goes straight to the matches → Sensation |
| Drag-to-unlock + mitosis | weigh "more dice now" against "points later" → Challenge |
| 8 − 2 per leftover die | tension between a fast sloppy win and a slow clean one → Challenge |
| Handicap | losers get more dice next round and stay in the race → Fellowship (nobody drops out) |

## 5. Systems
- **AI opponents:** Easy / Medium / Hard unlock strategies, randomly assigned per bot (no difficulty picker). AI dice use the same physics — no cheating. → `design/online-and-ai.md`
- **Online multiplayer:** PartyKit rooms with 4-letter codes (no I or O), inline Create/Join on the main menu, AI fills seats, drop-in/drop-out (a bot holds your seat, you can reclaim it), AFK → bot after 2 auto-actions. Rule of thumb: online is an invisible layer — your screen behaves exactly like offline and you never wait on anyone. → `design/online-and-ai.md`; netcode in `TDD.md`.
- **Tips:** one-time contextual hint banners (toggle in settings). A full tutorial rework is a Should (ROADMAP Later).
- **Save:** none beyond preferences (settings, player count) in local storage — no accounts.

## 6. Look & sound
Premium tactile 3D dice (rounded bevels, clearcoat plastic, HDRI reflections) on a clean dark table; the dice are the only visual focus. Goal dice are cream, player dice are the same material tinted per player colour (8-colour palette). The UI is moving to the shared game-ui kit (Cartoon style; settings done) — open art question: bright Cartoon UI against the dark table. Audio is placeholder stubs; a full layered dice-sound pass waits until the look is settled. Full spec (geometry, materials, lighting, every animation timing, the per-roll anticipation arc, audio list): `design/look-and-sound.md`.

## 7. Scope
Draft made at the BMUZ-2 conversion — **Muzzy to confirm**. Release stages (alpha / beta / 1.0) not picked yet, so musts are for "the next release".
| Must — next release | Should | Could | Won't (and why) |
|---|---|---|---|
| Drag-to-unlock offline (F44–F46 ✅) | Tutorial system rework (#6) | Unlock/commit dice outline style (#1) | Monetization of any kind — fair forever |
| Drag-to-unlock online (F47 ✅) | Full audio pass (#7) | Return-to-icon animations (#2) | Shake-to-roll — removed v1.2, unreliable on phones |
| Drag polish + UAT (F48) | | Mouse throw rolling on PC (#5) | Accounts / data collection — zero-friction, zero-data promise |
| CI builds like local (F49 ✅) | | Upgrades: spots + special dice (#9) | Portrait layout — landscape-only since v1.4 |
| | | Dice skins, table textures, profile art (#10–#12) | |
| | | Daily challenge, shareable result cards, spectator, tournament, friends/rematch, replays | |
Release stages: prototype → alpha → beta → 1.0. **Done** for a stage = all its musts done.

## 8. Product
- **Release path:** web (GitHub Pages) now; app stores later (privacy policy + IARC self-assessment already done in v1.2).
- **Business:** none — free, no ads, no purchases, forever.
- **Success looks like:** friends ask for another session; people share "look what I rolled" moments.

## 9. Open questions
- What stage is the live game (alpha / beta / 1.0), and what's the next release? (sets `Release target:` in ROADMAP)
- Scoring: since v1.5 a win with 4 leftover dice scores **0** (8 − 2×4). Intended — a win that still helps your handicap but not your score — or should the floor be higher?
- No skip-lock: players can't refuse a matching die. Deliberate simplification — revisit if unlock choices feel thin.
- UI art direction for the game-ui kit rollout: bright Cartoon UI vs the dark table.
