// Collision groups for a die (Rapier: high 16 bits = the groups it is in, low 16 = the groups it touches).
//
// B009: a die "passes through everything" by switching its collision groups — NEVER with
// setSensor. Rapier decides sensor-or-solid for a pair of colliders when their boxes first
// overlap; flipping a sensor back to solid while it already overlaps a wall leaves that pair a
// sensor pair, so the wall stops nothing until the die has completely left it again. A die
// released from the gather spin next to a wall just slid into it and the out-of-bounds safety
// net had to put it back. Groups are re-checked every physics step, so walls work straight away.
// Guarded by dieCollisionGroups.test.ts (plain Rapier, no React) + `npm run e2e:physics`.

/** Touches nothing: gathering (flying to the orbit) and the unstick slide. */
export const GHOST_GROUPS = 0x00000000;
/** Just released and still growing back: floor + walls, but not other dice (group 1). */
export const RELEASE_GROUPS = (0x0002 << 16) | 0xfffd;
/** Normal: everything. */
export const SOLID_GROUPS = (0xffff << 16) | 0xffff;
