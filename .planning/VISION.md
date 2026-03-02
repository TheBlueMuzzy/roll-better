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

### 2026-03-01 — Unlock Animation: Mitosis Split Vision
Selected locked dice translate UP slightly (lifted off position) instead of shrinking — looks like they're being picked up. On UNLOCK tap, selected dice lerp from player row to a clear spot in the pool area (avoiding other dice), shake with increasing intensity, then "split" mitosis-style into two dice of the same value. The split needs to account for surrounding dice so the two halves don't overlap with existing pool dice.
Context: Raised during 06-02 checkpoint. Original departure+spawn animation felt disconnected. Mitosis communicates "your die returns + bonus" much better.

### 2026-03-01 — Pool Dice Should Stay Where They Land
After a roll settles and matching dice lock (lerp to player row), the remaining non-locked dice should stay at their physical resting positions — NOT snap to the center. Keeping it messy makes it feel more real. Currently the generation-key remount (BUG-001 fix) causes all surviving dice to reset to centered spawn positions.
Context: Raised during 06-02 checkpoint. User noticed dice "sort of disappear and snap to the center" after locking.

### 2026-03-01 — Drag-to-Unlock (DEFERRED)
Drag-to-unlock was explored as an alternative to tap-to-select during Phase 7 planning. Conclusion: the drag and tap flows are wildly different — if drag were implemented, it would replace tap entirely, not coexist as a toggle. The drop zone detection, visual feedback during drag, snap-back on invalid drop, and sequential unlock timing all make it a substantial standalone feature. Saved for potential future phase if tap mode proves unsatisfying in playtesting. If implemented, would be drag-only (no dual-mode settings).
Context: Phase 7 planning discussion. Muzzy decided the complexity wasn't justified and the UX wasn't clear enough for users.

### 2026-03-01 — How to Play Slides Can Be Temporary
The How to Play carousel (07-02) doesn't need final art or polished content — temporary placeholder slides are fine. Final visuals can be done in a later polish pass.
Context: Raised during 07-01 execution. Relevant to 07-02 planning.

### 2026-03-02 — Collapsible Goal Area ("Shade" / Split-Screen)
The divider between the Goal/lock-in area and the rolling pool area should be interactive — either draggable or a collapse/expand toggle. Problem being solved: how to see all 8 player rows + goal row without shrinking the rolling area permanently.

**Concept:** The goal area sits "above" the pool area (layered, not adjacent). Expanding it covers the pool area like pulling down a shade. Collapsing it reveals more rolling space. The pool/physics simulation continues underneath regardless — dice still roll and settle even when covered.

**Open design questions (to resolve during Phase 9):**
- Drag vs snap toggle? Snap (animated fast open/close) might solve the animation conflict better than free drag.
- When dice need to lock-in (lerp from pool to goal area) while shade is expanded: should it auto-collapse first? Should dice animate from the avatar group instead?
- Same issue with unlock: dice flying down to pool while shade covers it.
- Maybe auto-collapse on any lock/unlock animation, then user can re-expand?
- Goal: see ALL rows simultaneously when wanted, without scroll bars, without permanently shrinking the roll area.
- The walls that contain rolling dice are in the pool layer — shade covers them visually but doesn't affect physics.

Context: Raised during 08-02 completion. Affects Phase 9 layout design. User is still exploring options — needs discussion during planning.

### 2026-03-02 — Glyphtender as Design Pattern Library
Muzzy wants to use Glyphtender's multiplayer connectivity logic and AI drop-in/drop-out replacement pattern as a referenceable design methodology for future games. Not a code port (Unity C# vs web), but the IDEOLOGY of the design approach: how players connect, how AI seamlessly replaces disconnecting players and yields back when they reconnect, and how that flow is architected. The goal is building a cross-project library of concepts under BMUZ so each new game doesn't start from scratch. Research this before Phase 13+ (online multiplayer milestone).
Context: Raised during 08-02 checkpoint. Glyphtender project at C:\Users\Muzzy\Documents\UnityProjects\Glyphtender\.

### 2026-03-02 — Visual Language for Dice Emergence/Return
Dice emerge FROM their owner's icon (scale 0 → full, with rolling animation). Dice return TO their owner's icon (scale full → 0, arc trajectory). Goal dice emerge from a Star icon (points). This creates a consistent visual grammar: everything has a "home" it comes from and returns to. Applied to: AI lock/unlock, pool spawn/despawn, goal dice enter/exit.
Context: Raised during 08-02 checkpoint. Fully detailed in .planning/phases/09-multi-player-display/CONTEXT.md.

### 2026-03-02 — Player Profile Art Polish
Profile group avatars are placeholder circles with initial letters. Muzzy will design proper avatar art in Illustrator and provide assets later. Current placeholder is functional but needs: custom avatar images, better visual hierarchy, potentially different frame/border styles per player. The profile layout (avatar + star-score + S/T stats) is structurally correct — just needs art assets swapped in.
Context: Raised during 09-01 checkpoint. Muzzy confirmed he'll do this in Illustrator separately.

### 2026-02-28 — Customizable Tabletop Texture
The tabletop surface material should be customizable/changeable later. Current dark walnut is a placeholder. Might want different wood types, felt, or player-selectable surfaces.
Context: Raised during 02-03 checkpoint — user noted the tabletop texture will likely change or become a customization option.
