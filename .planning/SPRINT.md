# Sprint 05 — Dragging dice feels solid and clear, on any screen
Started 2026-09-29 · Milestone v1.6 · Features: F48
Branch `dev/v1.6` (not live until /deliver).

## F48 ✨ Drag polish + UAT
Done when: no stuck or swapped dice (lost finger, two fingers, screen edges, portrait + landscape), the 12-dice cap is obvious, the rolling area shows when a drop will count, and Muzzy tunes drag feel himself in the Dev Kit.
why: dragging is the only way to unlock now → it must feel sure and readable → players act without hesitating (Mastery / Flow)
- [x] 🤖 1. Tip + How to Play say "drag" (B005 — fixed 2026-09-29, guarded by src/utils/playerText.test.ts)
- [x] 🤖 2. Lost pointer mid-drag (pointercancel / lostpointercapture) resolves the drag at once by zone — src/components/PlayerRow.tsx, src/store/gameStore.ts (cancelDragUnlock / completeDragUnlock) + test in src/utils/unlockTurn.test.ts
- [ ] 🤖 3. One drag at a time: a second finger is ignored while a drag is active — gameStore.startDragUnlock + PlayerRow isDragging + test
- [ ] 🤖 4. 12-dice cap: locked dice dim at the cap, and trying to drag one shakes it + toast "Max 12 dice" (text in content/text/en.json) — Scene.tsx L357, PlayerRow.tsx
- [ ] 🤖 5. Rolling area highlights while a dragged die is over it (RollingArea.tsx reads dragUnlockState); die stays under the finger (grab offset + lift-height ray fix) — try 2 highlight looks behind a tuning value
- [ ] 🤖 6. Drag feel numbers (PlayerRow.tsx L28–35/97/117/143, CommittedDie.tsx, dropZone.ts paddings) → content/tuning/drag.json; framework-first Dev Kit "Tuning" tab (edits any content/tuning/*.json number with sliders) in framework/devkit, then install
- [ ] 🤖 7. Real-pointer e2e: drags near edges, lost pointer, two fingers, 12-cap — phone portrait + landscape + desktop (new e2e script, run one at a time); update design/tech-internals.md drag state notes
- [ ] 🙋 8. Two-phone online check (drag, cap, timer) on the dev link
- [ ] 🤖 9. Tune drag feel with Muzzy in the Dev Kit Tuning tab (tuning)
Check: new drag e2e + e2e:solo + e2e:online + unlock-race-sweep green; Muzzy's phone check
Ask Muzzy: —
Notes: Cap signal = BOTH dim + shake/toast (Muzzy 2026-09-29). Tuning tab approved (Muzzy 2026-09-29) — build in framework devkit first.
