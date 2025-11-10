import { THREE } from '../core/three.js';
import { GROUND_SIZE } from './terrain.js';

export const colliders = [];          // outside world colliders (house shell, market, etc.)
export const interiorColliders = [];  // interior-only colliders (inside walls, inside door)

/**
 * Create a static bounding box from a mesh or group and store it.
 * options.interior = true -> goes into interiorColliders instead of outside colliders.
 */
export function addStaticBoxCollider(mesh, padding = 0, options = {}) {
  const box = new THREE.Box3().setFromObject(mesh);

  if (padding !== 0) {
    box.min.x -= padding;
    box.min.z -= padding;
    box.max.x += padding;
    box.max.z += padding;
  }

  if (options.interior) {
    interiorColliders.push(box);
  } else {
    colliders.push(box);
  }
}

/**
 * Get the correct collider list based on whether the player is inside the house.
 */
export function getColliders(isInsideHouse) {
  return isInsideHouse ? interiorColliders : colliders;
}

// Keep player inside the fenced ground area
export function clampToGroundBounds(position, margin = 1, boundsOverride = null) {
  if (boundsOverride) {
    if (position.x > boundsOverride.maxX - margin) {
      position.x = boundsOverride.maxX - margin;
    }
    if (position.x < boundsOverride.minX + margin) {
      position.x = boundsOverride.minX + margin;
    }
    if (position.z > boundsOverride.maxZ - margin) {
      position.z = boundsOverride.maxZ - margin;
    }
    if (position.z < boundsOverride.minZ + margin) {
      position.z = boundsOverride.minZ + margin;
    }
    return;
  }

  const half = GROUND_SIZE / 2 - margin;
  if (position.x > half) position.x = half;
  if (position.x < -half) position.x = -half;
  if (position.z > half) position.z = half;
  if (position.z < -half) position.z = -half;
}
