# Roll Better — 3D Dice Visual Research

**Date:** 2026-02-28
**Purpose:** Establish visual/feel standards for premium 3D dice in browser (R3F)

---

## Industry Leaders

### True Dice Roller (Steam, 96% Positive)
- 60+ dice sets: plastic, obsidian, gold, glass, metal
- Material-specific physics: glass bounces differently from metal
- Hand-recorded audio per material type — the gold standard for sound
- Multi-sensory consistency: visuals, physics, AND sound all agree on material

### Mighty Dice (iOS/Android, Highly Rated)
- 42 dice skins across 3 quality settings
- Per-bounce haptic feedback (not just a single buzz — pulses with each bounce)
- Swipe speed/angle affects roll physics
- Shake-to-roll with accelerometer

### Dice by 7pixels (4.5+ Stars)
- "Neatest looking dice" per reviews
- Multiple environments affect visual context
- User complaint revealed expectation: sound must match BOTH die material AND surface

### dddice (Web, Three.js-based)
- 10,000+ community themes
- Custom Phong shader with GLSL 3.0 ES
- Cross-platform sync (dice look identical on all clients)
- `hiddenness` uniform for dramatic reveal animations

---

## What Makes Dice Look Premium

### Geometry
- Start with high-segment box (50x50x50) or RoundedBoxGeometry
- **Edge bevel radius: 0.07** relative to die size — critical for realism
- Pips/numbers either sculpted into geometry (cosine impulse function) or UV-mapped textures
- Alternative: Model in Blender with Bevel Modifier (0.2 amount, 8 segments), export as .glb

### Materials (MeshPhysicalMaterial for premium quality)
- **Plastic dice**: metalness 0, roughness 0.3-0.5, clearcoat 1.0, clearcoatRoughness 0.1
- **Metallic dice**: metalness 0.8-1.0, roughness 0.1-0.3
- **Glass dice**: transmission 1.0, roughness 0, thickness property, ior for refraction
- Environment map (envMap) is **essential** — reflections sell the material
- Texture maps: color + normal (scratches/grain) + roughness + AO
- Pack AO/Roughness/Metalness into one RGB texture for efficiency

### Lighting
- HDRI environment maps from polyhaven.com via drei `<Environment preset="studio" />`
- Primary warm spotlight (~0xefdfd5, intensity 0.7) for shadows
- Ambient fill light
- Camera-attached light for consistent specular highlights as dice move

### Shadows
- AccumulativeShadows + RandomizedLight (soft, realistic, performant)
- OR ContactShadows for simpler setup
- Shadow opacity 0.15-0.3 (subtle grounding, not dark blobs)

---

## What Makes Dice Move Right

### Physics Parameters (Rapier recommended)
| Parameter | Felt Surface | Wood Surface |
|-----------|-------------|-------------|
| Gravity | [0, -50, 0] to [0, -100, 0] | Same |
| Mass | 1 | 1 |
| Restitution | 0.15 | 0.35 |
| Friction | 0.7 | 0.5 |
| Angular damping | 0.3 | 0.3 |
| Sleep time limit | 0.1s | 0.1s |

- Apply impulse at OFFSET point (not center) for natural rotation
- Random initial rotation per die for variety
- Higher gravity than real (50-100x) = faster settling = less waiting

### Result Detection
- Wait for physics body to sleep
- Read face-up via dot products of face normals with up vector
- Pure physics determines result (no predetermined outcomes) — players trust this

### Settle Timing
- Full roll: 1.5-3 seconds to settle
- Shorter = feels cheap/random. Longer = tedious.
- Offer "Quick Roll" skip for utility, but default to full physics

---

## The Anticipation-Resolution Arc

1. **Intention** (0ms): Player decides to roll
2. **Anticipation** (0-300ms): "Roll Better" prompt, gathering energy
3. **Release** (300ms): Shake/click — maximum energy, dice leave
4. **Chaos** (300-2000ms): Bouncing, spinning, colliding — uncontrollable
5. **Settling** (2000-2500ms): Energy dissipating, faces becoming readable
6. **Resolution** (2500-3000ms): Final face visible, result registered
7. **Reaction** (3000ms+): Lock animation, score update, emotional payoff

---

## Camera

- **During throw**: Low angle (~20°) for drama — dice appear large, bouncing has impact
- **During settle**: Smooth animate to isometric (~40°) for readability
- Mimics how you naturally follow dice with your eyes
- Subtle camera shake on heavy impacts

---

## Sound Design Layers

Each roll = multi-layered audio event:
1. **Initial impact** — first hit on surface
2. **Tumbling/rattling** — bouncing, hitting other dice
3. **Scraping** — sliding as momentum dies
4. **Settling click** — final tip onto resting face

Sound must match: die material × surface material
Trigger sounds on physics collision callbacks, decreasing volume per bounce

---

## Haptic Feedback (Mobile)

- Per-bounce haptic pulses (10-30ms) via Vibration API
- Decrease intensity as dice lose energy
- Final settle: one subtle pulse
- Industry standard set by Mighty Dice

---

## Open Source References

| Library | Tech | Best For |
|---------|------|----------|
| @3d-dice/dice-box-threejs | Three.js + Cannon ES | Feature-complete reference |
| @3d-dice/dice-box | Three.js + offscreen worker | Drop-in production SDK |
| threejs-dice (byWulf) | Three.js + Cannon.js | Simple integration |
| open-dice | Three.js | React/Vue integration |
| Codrops tutorial | Three.js + Cannon ES | Learning fundamentals |

---

## Recommended R3F Stack

| Layer | Technology |
|-------|-----------|
| Renderer | React Three Fiber |
| Physics | @react-three/rapier (Rust/WASM) |
| Helpers | @react-three/drei (Environment, shadows, controls) |
| Post-processing | @react-three/postprocessing (selective bloom) |
| Dice geometry | Blender .glb export OR procedural RoundedBoxGeometry |
| Materials | MeshPhysicalMaterial with clearcoat |
| Environment | HDRI from polyhaven via drei `<Environment>` |
| Shadows | AccumulativeShadows + RandomizedLight |
| Sound | Howler.js or Web Audio API |
| Haptics | Vibration API |
