# Sprint 02 — The front door is Cartoon
Started 2026-09-29 · Milestone v1.7 · Features: F50, F51, F52, F53 (in this order)
Branch: dev/v1-7-cartoon-ui (live stays on v0.2.2 until /deliver)
Changes for Muzzy: main menu, Create/Join, online room, reconnecting overlay and How to Play become Cartoon cards on a light-blue backdrop (like Settings). Stays the same: everything once a game starts (table, badges, HUD, winners) — next sprint.

## F50 🧱 Kit screens sit inside the game's 16:9 box
Done when: every kit screen (and its dim) stays inside the game frame at phone and desktop sizes; all kit words come from one editable file.
- [ ] 🤖 1. Check: screenshot Settings/Credits at 844×390, 1280×720 and a tall 1000×800 window — do panel + dim stay inside `#root` (`src/App.css` #root 16:9 box, `src/ui/kit/ScreenStack.tsx` overlay)?
- [ ] 🤖 2. Fix only if needed (keep it in `src/App.css` game layer, not the kit)
- [ ] 🤖 3. `content/text/en.json` + `src/ui/words.ts` (loads it, `fill()` for `{n}` placeholders) — every screen's words live there from now on
Check: screenshots at the three sizes.

## F51 🎮 Main menu + Create/Join on the kit
Done when: the main menu and the Create/Join screen are kit screens on the Cartoon light-blue backdrop; every button does what it did before.
- [ ] 🤖 4. `src/ui/MainMenuScreen.tsx` — kit `MainMenu`: Play Local, Play Online, How to Play, Settings, Upgrades (disabled, "Coming soon"), version at the bottom; wire into `src/App.tsx` in place of `src/components/MainMenu.tsx`; Cartoon light-blue backdrop behind menu screens (Muzzy's pick — colour from `content/ui/style.json`)
- [ ] 🤖 5. Play Online → kit `Lobby` without a code (create / join by code), wired to `src/hooks/useRoom` (create, join, room full, not found, "connected in another tab", player count picker if the old menu had one)
- [ ] 🤖 6. Point `e2e/online-unlock.mjs` + `e2e/lib.mjs` + the other e2e scripts at the new buttons (they click PLAY LOCAL / CREATE / JOIN)
Check: `npm run e2e` passes; screenshots phone + desktop.

## F52 🎮 Online room lobby + reconnecting on the kit
Done when: after Create/Join you land in a kit room screen; mid-game joiners pick a seat from a kit list; reconnecting uses the kit overlay + toast; the old MainMenu is gone.
- [ ] 🤖 7. Room: kit `Lobby` with a code — tap-to-copy code, players with colour `Avatar`s, host badge, ready, Start; Play Again returns here (the old "auto-detect lobby return")
- [ ] 🤖 8. New kit piece — seat picker for mid-game joins ("Game in progress — pick a seat", name, score, locks; waiting spinner + cancel; no seats / errors) built from kit parts (`ListRow`, `Avatar`, `Badge`, `Spinner`) in `src/ui/SeatPicker.tsx`; note it for copy-back to `dev/framework/ui-kit` as Built
- [ ] 🤖 9. Reconnecting overlay → kit `Reconnecting`; reconnect message → kit `toast()` (`src/App.tsx`)
- [ ] 🤖 10. Delete `src/components/MainMenu.tsx` + its `menu-*` rules in `src/App.css`
- [ ] 🤖 11. Check: `npm run e2e:online` + a by-hand mid-game join with two browsers (seat picker → takes over a bot)
Check: e2e passes; two-browser mid-game join works; screenshots of room + seat picker.

## F53 🎮 How to Play on the kit
Done when: How to Play is the kit screen with page dots, same 6 pages, words from `content/text/en.json`.
- [ ] 🤖 12. Kit `HowToPlay` with the 6 pages from `en.json`; replace `src/components/HowToPlay.tsx`; B005 text guard (`src/utils/playerText.test.ts`) reads `en.json` too
- [ ] 🤖 13. Update `.planning/design/screens.md` (menu, lobby, How to Play now kit screens)
- [ ] 🙋 14. Look check on phone + desktop (`/play`)
Check: tests + build; screenshots.

Ask Muzzy: (answered) backdrop behind menu cards → Cartoon light blue (b). Colours are tweakable later with the Dev Kit Color tool (F59).
Notes:
