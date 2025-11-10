import { THREE } from '../core/three.js';

let player = null;
let cam = null;

// We'll track yaw (left/right) and pitch (up/down) ourselves
let yaw = 0;
let pitch = 0;

export function createPlayer(scene, camera) {
  player = new THREE.Object3D();
  cam = camera;

  // Start player on the ground
  player.position.set(0, 1.6, 5);

  // Camera is a child of the player, at head height
  cam.position.set(0, 0, 0);
  player.add(cam);

  // Add player to the scene
  scene.add(player);
}

export function getPlayer() {
  return player;
}

// Called from input.js when the mouse moves (smoothed)
export function rotatePlayer(deltaYaw, deltaPitch) {
  if (!player || !cam) return;

  yaw += deltaYaw;
  pitch += deltaPitch;

  // Clamp pitch so you can't flip over
  const limit = Math.PI / 2 - 0.01;
  if (pitch > limit) pitch = limit;
  if (pitch < -limit) pitch = -limit;

  // Yaw rotates the body around Y
  player.rotation.set(0, yaw, 0);

  // Pitch rotates the camera up/down
  cam.rotation.set(pitch, 0, 0);
}

// Teleport the player to a new position and optionally set facing direction
export function teleportPlayer(x, y, z, yawAngleRadians = null) {
  if (!player || !cam) return;

  player.position.set(x, y, z);

  // Reset pitch so you're looking level when you teleport
  pitch = 0;
  cam.rotation.set(pitch, 0, 0);

  // Optionally set yaw so you're facing a specific direction
  if (typeof yawAngleRadians === 'number') {
    yaw = yawAngleRadians;
    player.rotation.set(0, yaw, 0);
  }
}

