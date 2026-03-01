import { Vector3, Quaternion } from 'three';

// --- Face normals matching Die3D layout (opposite faces sum to 7) ---
// Each entry maps a die face value to its local-space normal direction.

export const FACE_NORMALS: { value: number; normal: Vector3 }[] = [
  { value: 1, normal: new Vector3(0, 1, 0) },   // +Y (top)
  { value: 6, normal: new Vector3(0, -1, 0) },   // -Y (bottom)
  { value: 5, normal: new Vector3(1, 0, 0) },    // +X (right)
  { value: 2, normal: new Vector3(-1, 0, 0) },   // -X (left)
  { value: 3, normal: new Vector3(0, 0, 1) },    // +Z (front)
  { value: 4, normal: new Vector3(0, 0, -1) },   // -Z (back)
];

// --- World up vector (constant) ---
const WORLD_UP = new Vector3(0, 1, 0);

// --- Reusable scratch vector to avoid per-call allocations ---
const _scratch = new Vector3();

/**
 * Determines which face of a standard die is pointing up, given its rotation.
 *
 * Algorithm: rotate each face normal by the die's quaternion, then dot with
 * world up. The face whose rotated normal has the highest dot product is
 * the one pointing most upward.
 *
 * @param quaternion - The die's current world rotation as a Three.js Quaternion
 * @returns The face value (1-6) that is pointing up
 */
/**
 * Returns the Euler rotation [x, y, z] that places the given face value pointing up.
 * Used to spawn dice showing a specific value without rolling.
 */
export function getFaceUpRotation(value: number): [number, number, number] {
  switch (value) {
    case 1: return [0, 0, 0];                // +Y already up
    case 2: return [0, 0, -Math.PI / 2];     // -X → rotate around Z
    case 3: return [-Math.PI / 2, 0, 0];     // +Z → rotate around X
    case 4: return [Math.PI / 2, 0, 0];      // -Z → rotate around X
    case 5: return [0, 0, Math.PI / 2];      // +X → rotate around Z
    case 6: return [Math.PI, 0, 0];          // -Y → flip around X
    default: return [0, 0, 0];
  }
}

export function getFaceUp(quaternion: Quaternion): number {
  let bestValue = 1;
  let bestDot = -Infinity;

  for (const face of FACE_NORMALS) {
    // Copy the face normal into scratch, then rotate by the die's quaternion
    _scratch.copy(face.normal).applyQuaternion(quaternion);

    // Dot product with world up — higher means more aligned with "up"
    const dot = _scratch.dot(WORLD_UP);

    if (dot > bestDot) {
      bestDot = dot;
      bestValue = face.value;
    }
  }

  return bestValue;
}
