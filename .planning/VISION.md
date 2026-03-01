# Vision Capture

Ideas and preferences mentioned during development, saved for future consideration.

### 2026-02-28 — Viewport Boundary Walls (NON-NEGOTIABLE)
The visible area must have invisible physical walls (RigidBody colliders) so dice can never bounce out of view. Dice should bounce off the walls if they hit them. This is a core physics requirement, not optional.
Context: Raised during Phase 2 execution. Relevant to Phase 3 (rolling area bounds/bumpers mentioned in ROADMAP 03-03) and Phase 4 (game board layout).

### 2026-02-28 — Dice Lerp to Sorted Row After Settling
After all dice settle, they should lerp into a sorted row — lowest to highest, left to right. The row should be vertical on screen (aligned along Z axis from top-down view). Each die rotates to be perfectly square (sides parallel to screen edges) during the lerp. Die size is set so 8.5 fit across the arena width. This sorted row is the "result display" — important for the lock/unlock mechanic later.
Context: Raised during 03-03 checkpoint. User specified ascending sort order and perfect orientation for the row layout.

### 2026-03-01 — Goal Dice Transition Animation (Phase 6)
Between rounds, old goal dice translate off-screen to the right, then new goal dice fall from the sky in correct sorted positions. They bounce in place but do NOT change horizontal position (fall in a column, land perfectly). They do NOT rotate — oriented square the entire time they fall, bounce, and settle.
Context: Raised during Phase 5 planning. Relevant to Phase 6 (Lerp & Animation).

### 2026-03-01 — Unlock Interaction Details (IMPLEMENTED in Phase 5)
During unlock phase, all locked dice show white outline + slight scale pulse to indicate they're unlockable. Tap a locked die to toggle selection: selected = shrinks 25%, tap again = scales back to full size. An "UNLOCK" button confirms the selection. Player can forego unlocking by confirming with nothing selected. ANY locked die can be unlocked, even from previous turns.
Context: Raised during Phase 5 planning. Implemented in 05-04 (pulled forward from Phase 7).

### 2026-03-01 — Unlock Dice Outline Style
Current unlock highlight uses a white ring on the floor under the die. Muzzy wants actual dice outlines instead — an outline effect ON the die itself (e.g., Edges from drei, or a slightly scaled-up wireframe mesh behind the die). The ring is a placeholder.
Context: Raised during 05-04 checkpoint verification. Relevant to visual polish pass.

### 2026-02-28 — Customizable Tabletop Texture
The tabletop surface material should be customizable/changeable later. Current dark walnut is a placeholder. Might want different wood types, felt, or player-selectable surfaces.
Context: Raised during 02-03 checkpoint — user noted the tabletop texture will likely change or become a customization option.
