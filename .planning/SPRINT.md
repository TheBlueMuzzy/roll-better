# Sprint 04 — Tune the colours yourself
Started 2026-09-29 · Milestone v1.8 · Features: F60, F59 (in this order) · in parallel: B009 (physics helper)
Branch: dev/v1-7-cartoon-ui (live stays on v0.2.2 until /deliver)
Changes for Muzzy: in the dev build, ` opens a Dev Kit panel on the right; its Color tab lists every UI + table colour with a picker; changes show live; Save writes them into content/. Nothing changes on the live site or for players.

## F60 🧱 Dev Kit console
Done when: ` (desktop) or a triple-tap in a corner (phone) toggles a right-side panel with tabs in the DEV build only; the live build has no trace of it; Save can write a content/ JSON file; Copy for Claude copies a plain-English change list.
- [ ] 🤖 1. `src/devkit/` — console shell (key/triple-tap, right-side panel, tabs, close), loaded only when `import.meta.env.DEV` (dynamic import so the live bundle has none of it)
- [ ] 🤖 2. Dev-server save endpoint (a small Vite plugin in `vite.config.ts`, `apply: 'serve'`): POST → writes a JSON file, only under `content/`, pretty-printed, keeps `_help`
- [ ] 🤖 3. Check: live build (`npm run build`) contains no devkit code / endpoint; ` does nothing there

## F59 🔧 Dev Kit Color tool
Done when: the Color tab lists the 15 kit style colours (friendly names, current value from preset + tweaks) and the 4 table values; picking a colour updates the game instantly (UI via applyStyle, 3D table live); ↺ resets to the preset; Save writes style.json tweaks / table.json; Copy for Claude lists what changed; a colour-blind preview toggle.
- [ ] 🤖 4. Color tab UI: groups (UI · Table), swatch + native colour picker + hex field + ↺ per row; divider opacity slider
- [ ] 🤖 5. Live preview: UI via kit `applyStyle`; table colours live in the 3D scene (store or event the Scene reads — no reload)
- [ ] 🤖 6. Save + Copy for Claude (only changed values; tweaks equal to the preset are dropped)
- [ ] 🤖 7. Colour-blind preview toggle (deuteranopia / protanopia / tritanopia via CSS/SVG filter on the game)
- [ ] 🤖 8. Checks: tests for the pure bits (diff / tweak cleanup), build, e2e still pass, screenshots of the panel open over a game (844×390 + 1440×900); update TDD §1/§3 + DEVKIT.md catalog
- [ ] 🙋 9. Muzzy tries it: open with `, change a colour, save, refresh — it stuck

Notes: The Dev Kit is a developer tool, not game UI — plain functional styling is fine (the game-ui rules apply to src/ui/, not src/devkit/).
