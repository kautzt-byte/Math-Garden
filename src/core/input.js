import { THREE } from './three.js';
import { getPlayer, rotatePlayer } from '../entities/player.js';
import { handleInteract, tryRotateDecoration } from './raycast.js';
import { advanceDay, game } from './main.js';
import { getColliders, clampToGroundBounds } from '../world/collisions.js';
import { getRegionBounds } from '../world/travel.js';
import {
  toggleInventoryUI,
  updateHotbarSelection,
  updateHUD,
  showMessage,
} from './ui.js';
import { setCurrentTool } from './tools.js';
import { cycleSeedSelection } from './crops.js';

let keys = {};
let isPointerLocked = false;

// Tweak these if needed
const MOUSE_SENSITIVITY = 0.001;  // lower = slower mouse look
const MOVE_SPEED = 0.08;           // walking speed

// For smoothing mouse look
let pendingYaw = 0;
let pendingPitch = 0;

export function setupInput(canvas) {
  // Keyboard
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;


    if (key === 'i') {
      toggleInventoryUI();
    }

    // Tool + seed selection
    if (key === '0') {
      // Hand AND cycle seed selection
      setCurrentTool('none');
      cycleSeedSelection(game.inventory);
      updateHotbarSelection();
      updateHUD();
    }
    if (key === '1') {
      setCurrentTool('hoe');
      updateHotbarSelection();
      updateHUD();
    }
    if (key === '2') {
      setCurrentTool('shovel');
      updateHotbarSelection();
      updateHUD();
    }
    if (key === '3') {
      setCurrentTool('rake');
      updateHotbarSelection();
      updateHUD();
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Click to lock pointer
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  // Track pointer lock
  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
  });

    // Left-click interaction while pointer is locked
  document.addEventListener('mousedown', (event) => {
    if (!isPointerLocked) return;

    if (event.button === 0) {
      handleInteract();
    } else if (event.button === 2) {
      event.preventDefault();
      tryRotateDecoration();
    }
  });

  document.addEventListener('contextmenu', (event) => {
    if (isPointerLocked) {
      event.preventDefault();
    }
  });

  // Mouse look (we only ACCUMULATE here; smoothing happens in updateLook)
  document.addEventListener('mousemove', (event) => {
    if (!isPointerLocked) return;

    const player = getPlayer();
    if (!player) return;

    let rawX = event.movementX;
    let rawY = event.movementY;

    // DEAD ZONE: ignore tiny noise
    const DEAD_ZONE = 0.7; // pixels
    if (Math.abs(rawX) < DEAD_ZONE) rawX = 0;
    if (Math.abs(rawY) < DEAD_ZONE) rawY = 0;

    // Convert pixels → radians (scale down by sensitivity)
    let deltaYaw = -rawX * MOUSE_SENSITIVITY;
    let deltaPitch = -rawY * MOUSE_SENSITIVITY;

    // Clamp single-event contributions
    const MAX_DELTA = 0.04; // radians (~3.4 degrees)
    deltaYaw = THREE.MathUtils.clamp(deltaYaw, -MAX_DELTA, MAX_DELTA);
    deltaPitch = THREE.MathUtils.clamp(deltaPitch, -MAX_DELTA, MAX_DELTA);

    // Accumulate; we'll apply these gradually in updateLook()
    pendingYaw += deltaYaw;
    pendingPitch += deltaPitch;
  });
}

export function handleMovement() {
  const player = getPlayer();
  if (!player) return;

  if (!isPointerLocked) return;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const move = new THREE.Vector3();

  // Direction the player body is facing
  player.getWorldDirection(forward);
  forward.y = 0;          // lock to ground
  forward.normalize();

  // Right vector: perpendicular to UP and FORWARD
  right.crossVectors(up, forward).normalize();

  // W = forward, S = backward
  if (keys['w']) move.add(forward.clone().multiplyScalar(-1)); // forward
  if (keys['s']) move.add(forward);                            // backward

  // D = right, A = left
  if (keys['d']) move.add(right);                              // right
  if (keys['a']) move.add(right.clone().multiplyScalar(-1));   // left

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(MOVE_SPEED);

    // Proposed next position
    const nextPos = player.position.clone().add(move);
    nextPos.y = 1.6;

    // Keep within region bounds (farm or town)
    const bounds = getRegionBounds(game.currentRegion);
    clampToGroundBounds(nextPos, 1, bounds);

    // Choose which collider set to use
    const boxes = getColliders(game.isInsideHouse);
    const testPoint = nextPos.clone();
    let blocked = false;

    for (const box of boxes) {
      if (box.containsPoint(testPoint)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      player.position.copy(nextPos);
    }
  }
}

// Called every frame from gameLoop to actually apply smoothed look
export function updateLook() {
  const player = getPlayer();
  if (!player) return;

  // How quickly we "consume" the pending rotation (0–1)
  const SMOOTHING = 0.3; // higher = snappier, lower = floatier

  const yawStep = pendingYaw * SMOOTHING;
  const pitchStep = pendingPitch * SMOOTHING;

  // Nothing meaningful to apply
  if (Math.abs(yawStep) < 1e-4 && Math.abs(pitchStep) < 1e-4) return;

  rotatePlayer(yawStep, pitchStep);

  // Reduce pending by whatever we just applied
  pendingYaw -= yawStep;
  pendingPitch -= pitchStep;
}
