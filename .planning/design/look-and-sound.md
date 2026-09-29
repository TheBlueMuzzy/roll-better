# Roll Better — Look & sound
> Detail for GDD §6 Look & sound — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

### 6.2 Visual Style — Premium 3D Dice
> Full visual research: `.planning/research/dice-visuals.md`
> Target quality: Beat True Dice Roller (Steam, 96% positive) and Mighty Dice in a browser.

**Dice Geometry:**
- drei `RoundedBox` with args `[1, 1, 1]`, smoothness 4
- **Edge bevel radius: 0.07** — essential for realism (sharp edges look CG)
- Pips: flat circle geometry (radius 0.08, 16 segments) positioned on each face with standard pip layouts
- Pip color: near-black (`#1a1a1a`) for high contrast on cream/colored surfaces

**Dice Materials (meshPhysicalMaterial):**
- Goal dice (white/cream `#e8e0d4`): metalness 0, roughness 0.35, clearcoat 1.0, clearcoatRoughness 0.1 — polished plastic look
- Player dice (colored): same material properties, tinted per player color
- Pip material: MeshPhysicalMaterial with clearcoat 0.8, clearcoatRoughness 0.15
- Environment map intensity 1.0 for reflections

**Player Colors (curated palette):**
```
red: #c0392b, blue: #2980b9, green: #27ae60, purple: #8e44ad,
orange: #d35400, yellow: #f39c12, teal: #16a085, pink: #e84393
```
- Goal dice: always cream/white
- Player dice look like painted versions of the same premium material

**Lighting & Shadows:**
- Performance mode toggle: "Advanced" (shadows enabled) vs "Simple" (no shadows)
- Environment map for global illumination and reflections
- Directional lighting for primary shadows
- Shadows ground the dice to the surface

**Rolling Surface:**
- Physics floor at y=0 with restitution 0.5
- Invisible boundary walls (restitution 0.3) containing dice in the rolling area
- Asymmetric rolling zone (dice can roll into player row area but walls prevent escape)

**Background:**
- Clean, dark, uncluttered
- The dice and the game board are the ONLY visual focus

**Typography:**
- Clean sans-serif
- Scores: large, high-contrast, readable at a glance
- X/Y/Z: small but legible
- Status text: bold, centered in HUD area

**Animations:**
- **Goal entry**: Each die emerges from star icon (scale 0→1), lerps to sorted position with tumble rotation, staggered ~40ms apart, ~500ms each
- **Goal exit**: Each die slides right (8 units) over 350ms, staggered ~15ms apart
- **Lock (pool → slot)**: Linear lerp with quaternion slerp, ~400ms, staggered ~100ms. Sound: click
- **Unlock (mitosis)**: Since v1.6 the die is dragged into the rolling area first; at turn end every committed die splits into 2 in place (batch mitosis). Sound: pop
- **Pool exit**: Scale 1→1.3→0 over 0.45s. Sound: pop
- **Pool spawn**: Arc from player icon to pool position, scale 0→1, tumble rotation, ~600ms. Sound: spawn pop
- **Score counting**: Cubic ease-out over 1500ms, tick sound every 100ms, scale-pop on completion
- **Other players' locks (online)**: Dice lerp from their player icon → their row slots (profile-emerge pattern)

**The Anticipation-Resolution Arc (per roll):**
1. Intention: Status text visible, dice waiting in the rolling area
2. Anticipation (hold, up to 2.5 s ramp): dice gather and orbit your finger, spinning faster — the player chooses how long to build
3. Release: Dice fling out with the orbit's momentum
4. Chaos (300-2000ms): Bouncing, spinning, colliding — pure physics
5. Settling (2000-2500ms): Energy dissipating, faces becoming readable — tension builds
6. Resolution (2500-3000ms): Final faces visible, auto-lock lerps begin
7. Reaction (3000ms+): Lock animation, unlock decision

### 6.4 Audio Direction
> Current status: **Basic sound effects implemented** via Web Audio API (`soundManager.ts`). Full multi-layered sound design is a future milestone.

**Implemented sounds:**
- Die selection click
- Mitosis/unlock pop
- Pool exit pop
- Pool spawn pop
- Score tick (ascending tones per point)
- Score complete fanfare
- Round start fanfare

**Future (not yet implemented):**
- Multi-layered dice roll sounds (impact, tumble, scrape, settle)
- Physics collision-triggered audio
- Spatial 3D audio
- Full haptic feedback suite (currently basic Vibration API via `haptics.ts`)
