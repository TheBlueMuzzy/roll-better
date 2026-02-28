# Vision Capture

Ideas and preferences mentioned during development, saved for future consideration.

### 2026-02-28 — Viewport Boundary Walls (NON-NEGOTIABLE)
The visible area must have invisible physical walls (RigidBody colliders) so dice can never bounce out of view. Dice should bounce off the walls if they hit them. This is a core physics requirement, not optional.
Context: Raised during Phase 2 execution. Relevant to Phase 3 (rolling area bounds/bumpers mentioned in ROADMAP 03-03) and Phase 4 (game board layout).

### 2026-02-28 — Dice Lerp to Sorted Row After Settling
After all dice settle, they should lerp into a sorted row — lowest to highest, left to right. The row should be vertical on screen (aligned along Z axis from top-down view). Each die rotates to be perfectly square (sides parallel to screen edges) during the lerp. Die size is set so 8.5 fit across the arena width. This sorted row is the "result display" — important for the lock/unlock mechanic later.
Context: Raised during 03-03 checkpoint. User specified ascending sort order and perfect orientation for the row layout.

### 2026-02-28 — Customizable Tabletop Texture
The tabletop surface material should be customizable/changeable later. Current dark walnut is a placeholder. Might want different wood types, felt, or player-selectable surfaces.
Context: Raised during 02-03 checkpoint — user noted the tabletop texture will likely change or become a customization option.
