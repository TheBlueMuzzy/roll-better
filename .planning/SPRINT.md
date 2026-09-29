# Sprint 03 — The table is Cartoon too
Started 2026-09-29 (autonomous overnight run) · Milestone v1.7 · Features: F57, F54, F55, F56, F58 (in this order)
Branch: dev/v1-7-cartoon-ui (live stays on v0.2.2 until /deliver)
Changes for Muzzy: winners screen, tips + messages, a new "Round N" banner, the HUD (status, timer bars, gear) and the player/Goal badges beside the rows all become kit Cartoon pieces. The table, dice and 3D scene stay as they are.
Order change (logged): F57 (pinning) moves first — the HUD status pins over the rolling area with the same glue, so F56 ~needs F57.

## F57 🧱 Kit PlayerChip + pinning to 3D
Done when: a kit PlayerChip exists in the framework (colour avatar + initial, name, star score, detail line, badge, faded state), and the game can pin any kit piece to a 3D point (drei `Html`) that follows the camera and resizes.
- [x] 🤖 1. Framework kit 0.1.8 (`dev/framework/ui-kit`): `PlayerChip`; `Results` gets player colours, optional title/message/actions in one screen, entrance stagger, 1st-place trophy; `toast()` gets `dismissible` (tap to close); gallery + CATALOG + VERSION; checks
- [x] 🤖 2. Install kit 0.1.8 in the game (+ 0.1.7: swap the lobby stitches in `src/ui/LobbyScreen.tsx` for Lobby's own Ready-optional / copy / onBack / colours; `--kit-frame-w/h` replaces the F50 rule in `src/App.css`)
- [x] 🤖 3. `src/components/Pinned.tsx`: drei `Html` wrapper that pins kit UI to a world point (kit classes inside, no per-frame React state), + a quick visual check

## F54 🎮 Winners → kit Results / Post-game
Done when: the end-of-session screen is kit Results with colours, "You win!" / tie title, Play Again + Menu, same behaviour online and offline; words in en.json.
- [x] 🤖 4. `src/ui/WinnersScreen.tsx` on kit Results (+ `rankPlayers`), wired like `src/components/WinnersScreen.tsx` (App.tsx Play Again / Menu, online `applyOnlineSessionEnd`); delete the old component + `.winners-*` CSS
- [ ] 🤖 5. Check: a session-end reached by script (store: scores near 20) — screenshot phone + desktop; e2e still pass

## F55 ✨ Tips + messages → kit toasts; "Round N" banner
Done when: tips and online seat messages are kit toasts (tips tap-to-dismiss, one at a time kept); a short kit RoundIntro "Round N" shows at each round start without delaying play.
- [ ] 🤖 6. Tips → `toast(…, { dismissible })`, words to en.json (`tips`); delete `src/components/TipBanner.tsx` + `.tip-banner` CSS
- [ ] 🤖 7. Seat notifications (`HUD.tsx` :35-73) → toasts, words to en.json (`hud.seat…`)
- [ ] 🤖 8. Kit `RoundIntro` "Round {n}" at round start (App.tsx round flow ~292-345), brief, not blocking input

## F56 🎮 In-game HUD on the kit
Done when: status text is a kit banner pinned over the rolling area, the two timers are kit Bars, "Round N" + gear sit in kit Hud slots; words in en.json; old `.hud-*` CSS gone.
- [ ] 🤖 9. Status → kit `TurnBanner`-style piece pinned (F57) over the rolling area; all status strings to en.json (`hud.status`)
- [ ] 🤖 10. Timers → kit `Bar` driven by the existing countdown logic (keep `RollingCountdown` timing as a hook; display only changes)
- [ ] 🤖 11. Round label + gear (aria-label) into kit `Hud`/`Screen` slots; delete unused `.hud-*`, `.hud-skip-btn*`, dead score code

## F58 🎮 Player + Goal badges as kit UI
Done when: every row's badge is a kit PlayerChip pinned beside it (colour, initial, score, S/T detail, Bot badge), the Goal badge shows the potential score, a badge fades while a dragged die passes over it, and the 3D profile groups are gone.
- [ ] 🤖 12. Pin PlayerChips at the row positions (`Scene.tsx` :343-375) for all players + the Goal; S/T detail + bot badge; words to en.json
- [ ] 🤖 13. Fade a chip while a dragged die is over it (drag position from the store, compared in a ref / useFrame — no React state per frame); score count-up on scoring (revive the dead HUD code via kit Score)
- [ ] 🤖 14. Delete `PlayerProfileGroup.tsx`, `GoalProfileGroup.tsx`, dead `PlayerIcon.tsx`; B010 check still passes (dragged die over the badge column)
- [ ] 🤖 15. Checks: tests, build, check-ui, `npm run e2e` + `e2e:midgame`, screenshots phone + desktop of a live game, winners, a tip, round banner; update `.planning/design/screens.md` + GDD §6
- [ ] 🙋 16. Look check on phone + desktop — sprint 02's front door AND this sprint's table (`/play`)

Ask Muzzy: (none yet — taste calls land as defaults in content/ui/style.json / en.json, tweakable)
Notes: Task 1 — framework kit 0.1.7 (1459af8: Lobby optional Ready / copy / Back / colours, game box `--kit-frame-w/h`) + 0.1.8 (919e56a: PlayerChip, Results title/actions/colours/stagger/★, dismissible toasts, `.kit-scope`). Task 2 half — 0.1.7 installed, lobby stitches removed, game box via kit vars; e2e online + midgame PASS. Task 2 rest — kit 0.1.8 installed (7 kit files, motion.ts added); check-ui, tsc, tests pass. Task 3 — `Pinned.tsx`: drei Html + a `fit` box in world units (piece scales to fill it, measured with offsetWidth + ResizeObserver, scale written as a CSS variable — no React state per frame), `anchor` right/centre, kit-scope inside, never catches taps, z 5→0 so HUD (10) and kit screens sit above. drei's `distanceFactor` ignores window size, hence the own fit. Checked with two test chips at 844×390 + 1440×900: same size on the table at both. Task 4 — `src/ui/WinnersScreen.tsx` = kit Results (colours, ★, You badge, Play again / Menu) inside a kit `Screen dialog` for the dim (Results has no dim of its own — kit gap); title You win! / {name} wins! (was "You Win" for ANY human winner online — fixed) / Tie!; message = rounds played; words in en.json `winners`; drawn directly in a `.winners-layer` (z 70) rather than the screen stack, so Esc / phone Back / tapping the dim can't close it. Old component + all `.winners-*` CSS deleted.
