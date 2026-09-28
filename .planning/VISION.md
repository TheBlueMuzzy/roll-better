# Vision — ideas for later

Parking lot for ideas not being built now. Anyone appends (newest ideas at the bottom, with a date).
Ideas #1–#15 moved here from the old GDD §11 at the BMUZ-2 conversion (2026-09-28), numbers kept. Their scope (should / could) is drafted in GDD §3b.

### Shipped (removed from active list)
- ~~#8 — Drop-in/Drop-out~~ → SHIPPED v1.3
- ~~#13 — Landscape-Only Layout~~ → SHIPPED v1.4
- ~~#14 — Collapsible Goal Area~~ → REMOVED (landscape solved the space problem)
- ~~#15 — Auto-Ready on Join~~ → SHIPPED v1.3

### Polish

**#1 — Unlock Dice Outline Style**
Replace floor-ring highlight with outlines ON the die (drei Edges or wireframe mesh). Defer until art pass — visual style TBD. Current white ring on the floor under selectable dice is a placeholder.

**#2 — Visual Language: Emergence/Return**
Dice emerge FROM owner's icon and return TO it. Emergence done (SpawningDie scales 0→1 from icon position). Missing: return-to-icon — when dice exit the pool or get locked, they currently scale to 0 in place instead of arcing back toward the player icon. Half the visual grammar is incomplete.

### Interaction

**#3 — Drag-to-Unlock (Input System Overhaul)** → became milestone v1.6 (ROADMAP F44–F48)
Full drag input system. Swipe gesture replaces tap-to-toggle entirely (not dual-mode). Drop zone detection, visual feedback during drag, snap-back on invalid drop. This is a major system change — #4 and #5 are sub-features that depend on this being solved first.

**#4 — Hold-to-Gather-Roll** ✅ SHIPPED (v1.5, 2026-03-27)
Shipped independently of #3. Hold gesture gathers dice into orbit, release flings with tangential momentum. Includes hockey-stick speed ramp, vacuum VFX, auto-release at 2.5s, AFK support.

**#5 — Mouse-Based Dice Rolling (PC)**
Drag-and-release physics throw for desktop. Part of the drag input system (#3) — same interaction paradigm, different input device. Depends on #3's architecture.

### Tutorial

**#6 — Tutorial System Rework**
Current tip system is loose but functional (TipBanner with one-time-per-session tips). Needs a full design pass. Includes: "you should unlock" recurring tip until 8+ dice, and likely other tutorial improvements for onboarding. The unlock tip is one specific note within a bigger tutorial task.

### Audio

**#7 — Full Audio Pass**
Multi-layered dice sounds (impact, tumble, scrape, settle), collision-triggered audio, spatial 3D. Current sounds are procedural stubs. Defer until visual look is figured out — audio should match the aesthetic.

### System

**#9 — Upgrades System (Spots + Special Dice)**
Major progression system accessed from the Upgrades menu button (already on main menu as placeholder). Two unlockable types:
- **Spots**: Special rules for lock-in slots. When a die locks into a spot, the player gets a bonus (effects TBD — needs design pass).
- **Special Dice**: Dice with special rules that can be "bought" mid-game. If you roll doubles of anything, you can trade both dice in for a special die from your personal market.
- **Market**: Each player has 6 side-screen market slots. Not all must be filled. One of each maximum. Filled with spots and dice from unlocked options.
- **Upgrades Menu**: 6 loadout slots with drag/drop from an unlocked grid of options. Pre-game customization.
- Scale comparable to #3 (drag system). Needs full game design pass before implementation.

### Cosmetics

**#10 — Custom Dice Colors / Skins**
Cosmetic unlocks. Requires light shader work — tinting/swapping materials on the existing meshPhysicalMaterial setup.

**#11 — Customizable Tabletop Texture**
Player-selectable surfaces (wood types, felt, etc.). Current dark walnut is placeholder. Same shader/material category as #10.

**#12 — Player Profile Art**
Pre-set (possibly unlockable/earnable) avatar images replacing placeholder circle avatars. Muzzy to design in Illustrator. Layout is structurally correct — just needs assets swapped in.
