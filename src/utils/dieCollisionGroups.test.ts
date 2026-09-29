// B009 guard: a die let go right next to a wall must bounce off it, not slide in.
// Plain Rapier (the same engine the game runs), same setup as the game: a kinematic wall,
// a die that ghosts through everything while it is pulled in, then is released and grows back.
import { describe, it, expect, beforeAll } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { GHOST_GROUPS, RELEASE_GROUPS } from './dieCollisionGroups';

beforeAll(async () => {
  await RAPIER.init();
});

const INNER_FACE_Z = -4.75; // the back wall's inside face (as in the game)

/** Returns how far the die's centre got toward/into the wall (lowest z). */
function releaseNextToWall(ghost: 'groups' | 'sensor'): number {
  const world = new RAPIER.World({ x: 0, y: -50, z: 0 });
  const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 10).setTranslation(0, -0.1, 0), floor);
  const wall = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 8, INNER_FACE_Z - 0.25));
  world.createCollider(RAPIER.ColliderDesc.cuboid(10, 8, 0.25).setRestitution(0.3), wall);

  // A shrunken die orbiting just touching the wall (what the B009 logs showed: gap ≈ 0)
  let half = 0.31;
  const die = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 3, INNER_FACE_Z + half - 0.02).setCcdEnabled(true).setGravityScale(0),
  );
  const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(half, half, half).setDensity(2), die);

  // Gather: pass through everything
  if (ghost === 'groups') collider.setCollisionGroups(GHOST_GROUPS);
  else collider.setSensor(true);
  for (let i = 0; i < 30; i++) world.step();

  // Release: solid against walls, flung along and slightly into the wall, growing back
  if (ghost === 'sensor') collider.setSensor(false);
  collider.setCollisionGroups(RELEASE_GROUPS);
  die.setGravityScale(1, true);
  die.setLinvel({ x: 5, y: -2, z: -2.5 }, true);
  let minZ = Infinity;
  for (let i = 0; i < 40; i++) {
    if (half < 0.4) {
      half = Math.min(0.4, half + 0.01);
      collider.setHalfExtents({ x: half, y: half, z: half });
    }
    world.step();
    minZ = Math.min(minZ, die.translation().z);
  }
  world.free();
  return minZ;
}

describe('die collision groups (B009)', () => {
  it('a die released next to a wall bounces off it (ghosting via collision groups)', () => {
    const minZ = releaseNextToWall('groups');
    // Centre never gets closer to the inside face than a small overlap
    expect(minZ).toBeGreaterThan(INNER_FACE_Z + 0.2);
  });

  it('why: ghosting via setSensor lets the same die slide into the wall (Rapier behaviour)', () => {
    // If this ever starts failing, Rapier changed how sensor pairs are updated — harmless,
    // but the comment in dieCollisionGroups.ts can then be relaxed.
    expect(releaseNextToWall('sensor')).toBeLessThan(INNER_FACE_Z);
  });
});
