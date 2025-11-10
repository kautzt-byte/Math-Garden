import { THREE } from '../core/three.js';
import { clampToGroundBounds, getColliders } from '../world/collisions.js';
import { getRegionBounds } from '../world/travel.js';
import { registerInteractable } from '../world/interactables.js';

const DEFAULT_IDLE_RANGE = [1.8, 3.8];
const DEFAULT_MOVE_RANGE = [2.5, 5];
const DEFAULT_SPEED = 1.15; // units per second
const DEFAULT_TURN_SPEED = Math.PI * 1.25;
const DEFAULT_RADIUS = 0.35;
const DEFAULT_PROBE_HEIGHT = 1;

const npcs = [];
let boundScene = null;

const PROBE_TEMPLATE = [
  new THREE.Vector2(0, 0),
  new THREE.Vector2(1, 0),
  new THREE.Vector2(-1, 0),
  new THREE.Vector2(0, 1),
  new THREE.Vector2(0, -1),
  new THREE.Vector2(0.7, 0.7),
  new THREE.Vector2(-0.7, 0.7),
  new THREE.Vector2(0.7, -0.7),
  new THREE.Vector2(-0.7, -0.7),
];

const tempVec = new THREE.Vector3();
const tempTarget = new THREE.Vector3();
const tempMove = new THREE.Vector3();

export function initNPCSystem(scene) {
  boundScene = scene;
}

export function spawnNPC(config = {}) {
  if (!boundScene) {
    console.warn('initNPCSystem(scene) must be called before spawning NPCs.');
    return null;
  }

  const npc = {
    id: config.id || `npc_${npcs.length}`,
    object3D: createNPCMesh(config.appearance || {}),
    region: config.region || 'farm',
    movementBounds: config.movementBounds || getRegionBounds(config.region || 'farm') || null,
    wanderRadius: config.wanderRadius ?? 4,
    speed: config.speed ?? DEFAULT_SPEED,
    turnSpeed: config.turnSpeed ?? DEFAULT_TURN_SPEED,
    collisionRadius: config.collisionRadius ?? DEFAULT_RADIUS,
    probeHeight: config.probeHeight ?? DEFAULT_PROBE_HEIGHT,
    idleRange: config.idleRange || DEFAULT_IDLE_RANGE,
    moveRange: config.moveRange || DEFAULT_MOVE_RANGE,
    useInteriorColliders: Boolean(config.useInteriorColliders),
    targetPosition: new THREE.Vector3(),
    state: 'idle',
    stateTimer: 0,
    groundHeight: 0,
  };

  const startPos = config.position || { x: 0, y: 0, z: 0 };
  npc.groundHeight = startPos.y ?? 0;
  npc.object3D.position.set(
    startPos.x ?? 0,
    npc.groundHeight,
    startPos.z ?? 0
  );
  npc.object3D.userData.npcId = npc.id;
  if (typeof config.initialYaw === 'number') {
    npc.object3D.rotation.y = config.initialYaw;
  }

  boundScene.add(npc.object3D);

  if (config.interactable) {
    registerNPCInteractableMeshes(npc.object3D, config.interactable);
  }

  enterIdleState(npc, true);
  npcs.push(npc);
  return npc;
}

export function updateNPCSystem(deltaSeconds = 0.016) {
  if (!npcs.length) return;

  const dt = THREE.MathUtils.clamp(deltaSeconds, 0.001, 0.08);
  for (const npc of npcs) {
    tickNPC(npc, dt);
  }
}

export function getNPCs() {
  return npcs;
}

function tickNPC(npc, delta) {
  npc.object3D.position.y = npc.groundHeight;

  npc.stateTimer -= delta;

  if (npc.state === 'idle') {
    if (npc.stateTimer <= 0) {
      enterMoveState(npc);
    }
    return;
  }

  if (npc.state !== 'move') return;

  moveTowardTarget(npc, delta);

  if (npc.stateTimer <= 0) {
    enterIdleState(npc);
  }
}

function moveTowardTarget(npc, delta) {
  const current = npc.object3D.position;
  tempTarget.copy(npc.targetPosition);
  tempTarget.y = npc.groundHeight;

  tempMove.copy(tempTarget).sub(current);
  tempMove.y = 0;
  const distance = tempMove.length();
  if (distance < 0.05) {
    tempTarget.y = npc.groundHeight;
    npc.object3D.position.copy(tempTarget);
    npc.object3D.position.y = npc.groundHeight;
    enterIdleState(npc);
    return;
  }

  const maxStep = npc.speed * delta;
  if (distance > maxStep) {
    tempMove.setLength(maxStep);
  }

  tempVec.copy(current).add(tempMove);
  const nextPos = tempVec;
  nextPos.y = npc.groundHeight;
  const bounds = npc.movementBounds;
  if (bounds) {
    clampToGroundBounds(nextPos, npc.collisionRadius, bounds);
  }

  if (wouldCollide(npc, nextPos)) {
    enterIdleState(npc);
    return;
  }

  npc.object3D.position.copy(nextPos);
  npc.object3D.position.y = npc.groundHeight;

  const heading = Math.atan2(tempMove.x, tempMove.z);
  rotateToward(npc, heading, delta);
}

function enterIdleState(npc, initial = false) {
  npc.state = 'idle';
  npc.stateTimer = randomRange(
    npc.idleRange[0] * (initial ? 0.4 : 1),
    npc.idleRange[1]
  );
  npc.targetPosition.copy(npc.object3D.position);
  npc.targetPosition.y = npc.groundHeight;
}

function enterMoveState(npc) {
  const next = pickWanderTarget(npc);
  if (!next) {
    enterIdleState(npc);
    return;
  }

  npc.state = 'move';
  npc.targetPosition.copy(next);
  npc.stateTimer = randomRange(npc.moveRange[0], npc.moveRange[1]);
}

function pickWanderTarget(npc) {
  const current = npc.object3D.position;
  const currentX = current.x;
  const currentZ = current.z;
  const bounds = npc.movementBounds;
  const attempts = 6;

  for (let i = 0; i < attempts; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * npc.wanderRadius;

    tempVec.set(
      currentX + Math.cos(angle) * distance,
      npc.groundHeight,
      currentZ + Math.sin(angle) * distance
    );

    if (bounds) {
      clampToGroundBounds(tempVec, npc.collisionRadius, bounds);
    }

    if (!wouldCollide(npc, tempVec)) {
      return tempVec.clone();
    }
  }

  return null;
}

function wouldCollide(npc, position) {
  const boxes = getColliders(npc.useInteriorColliders);
  if (!boxes || !boxes.length) return false;

  const radius = npc.collisionRadius;

  for (const box of boxes) {
    for (const template of PROBE_TEMPLATE) {
      tempVec.set(
        position.x + template.x * radius,
        npc.probeHeight,
        position.z + template.y * radius
      );

      if (box.containsPoint(tempVec)) {
        return true;
      }
    }
  }

  return false;
}

function rotateToward(npc, heading, delta) {
  const currentYaw = npc.object3D.rotation.y;
  let deltaYaw = heading - currentYaw;

  deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));

  const maxTurn = npc.turnSpeed * delta;
  deltaYaw = THREE.MathUtils.clamp(deltaYaw, -maxTurn, maxTurn);

  npc.object3D.rotation.y = currentYaw + deltaYaw;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function registerNPCInteractableMeshes(root, data) {
  if (!root || !data) return;

  root.traverse((child) => {
    if (!child.isMesh) return;

    const colorAttr =
      child.material && child.material.color
        ? child.material.color.getHex()
        : data.baseColor ?? 0xffffff;

    registerInteractable(child, {
      ...data,
      baseColor: colorAttr,
    });
  });
}

function createNPCMesh(appearance) {
  const variant = appearance.variant || 'walker';

  if (variant === 'critter') {
    return createCritterMesh(appearance);
  }
  if (variant === 'chicken') {
    return createChickenMesh(appearance);
  }
  if (variant === 'goat') {
    return createGoatMesh(appearance);
  }
  if (variant === 'cow') {
    return createCowMesh(appearance);
  }
  if (variant === 'horse') {
    return createHorseMesh(appearance);
  }

  return createWalkerMesh(appearance);
}

const walkerBodyGeo = new THREE.CylinderGeometry(0.28, 0.33, 1.1, 8);
const walkerHeadGeo = new THREE.SphereGeometry(0.24, 10, 10);
const walkerCapGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8);

const critterBodyGeo = new THREE.BoxGeometry(0.65, 0.35, 0.4);
const critterHeadGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
const critterEarGeo = new THREE.BoxGeometry(0.08, 0.16, 0.08);
const chickenBodyGeo = new THREE.SphereGeometry(0.25, 16, 16);
const chickenHeadGeo = new THREE.SphereGeometry(0.15, 12, 12);
const chickenBeakGeo = new THREE.ConeGeometry(0.06, 0.14, 8);
const chickenLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6);
const goatBodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.35);
const goatHeadGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
const goatHornGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6);
const cowBodyGeo = new THREE.BoxGeometry(1.0, 0.5, 0.45);
const cowHeadGeo = new THREE.BoxGeometry(0.35, 0.3, 0.35);
const cowHornGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6);
const horseBodyGeo = new THREE.BoxGeometry(1.1, 0.45, 0.4);
const horseNeckGeo = new THREE.BoxGeometry(0.25, 0.5, 0.3);
const horseHeadGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
const simpleLegGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);

function createWalkerMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0xffd9a3;
  const accentColor = appearance.accentColor ?? 0x3c2a1e;
  const headColor = appearance.headColor ?? 0xfff2db;

  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const headMat = new THREE.MeshLambertMaterial({ color: headColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

  const body = new THREE.Mesh(walkerBodyGeo, bodyMat);
  body.position.y = 0.55; // base sits on ground
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(walkerHeadGeo, headMat);
  head.position.y = 1.2;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  const cap = new THREE.Mesh(walkerCapGeo, accentMat);
  cap.position.y = 1.38;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  return group;
}

function createCritterMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0xf7f1dc;
  const accentColor = appearance.accentColor ?? 0xc87d32;

  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

  const body = new THREE.Mesh(critterBodyGeo, bodyMat);
  body.position.y = 0.175; // base sits on ground
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(critterHeadGeo, bodyMat);
  head.position.set(0.28, 0.35, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  const leftEar = new THREE.Mesh(critterEarGeo, accentMat);
  leftEar.position.set(0.34, 0.6, 0.12);
  leftEar.castShadow = true;
  leftEar.receiveShadow = true;
  group.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.z = -0.12;
  group.add(rightEar);

  const tail = new THREE.Mesh(critterEarGeo, accentMat);
  tail.scale.set(1.2, 0.8, 1);
  tail.position.set(-0.34, 0.32, 0);
  tail.castShadow = true;
  tail.receiveShadow = true;
  group.add(tail);

  return group;
}

function createChickenMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0xfff1dc;
  const accentColor = appearance.accentColor ?? 0xf1b24a;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const beakMat = new THREE.MeshLambertMaterial({ color: 0xf29b2c });

  const body = new THREE.Mesh(chickenBodyGeo, bodyMat);
  body.position.y = 0.28;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(chickenHeadGeo, bodyMat);
  head.position.set(0.15, 0.52, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  const beak = new THREE.Mesh(chickenBeakGeo, beakMat);
  beak.position.set(0.27, 0.5, 0);
  beak.rotation.z = Math.PI / 2;
  beak.castShadow = true;
  group.add(beak);

  const crest = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.15, 6),
    accentMat
  );
  crest.position.set(0.15, 0.65, 0);
  group.add(crest);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.3), bodyMat);
  leftWing.position.set(-0.02, 0.32, 0.16);
  group.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.z = -0.16;
  group.add(rightWing);

  const leg1 = new THREE.Mesh(chickenLegGeo, accentMat);
  leg1.position.set(0.05, 0.12, 0.07);
  group.add(leg1);

  const leg2 = leg1.clone();
  leg2.position.z = -0.07;
  group.add(leg2);

  return group;
}

function createGoatMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0xece3d1;
  const accentColor = appearance.accentColor ?? 0x8b5a2b;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

  const body = new THREE.Mesh(goatBodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(goatHeadGeo, bodyMat);
  head.position.set(0.45, 0.5, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  const horn = new THREE.Mesh(goatHornGeo, accentMat);
  horn.rotation.z = Math.PI / 3;
  horn.position.set(0.45, 0.65, 0.12);
  group.add(horn);

  const horn2 = horn.clone();
  horn2.position.z = -0.12;
  horn2.rotation.z = -Math.PI / 3;
  group.add(horn2);

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), accentMat);
  beard.position.set(0.56, 0.4, 0);
  group.add(beard);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(simpleLegGeo, accentMat);
    leg.scale.set(0.5, 0.45, 0.5);
    leg.position.set(i < 2 ? 0.25 : -0.25, 0.22, i % 2 === 0 ? 0.12 : -0.12);
    group.add(leg);
  }

  return group;
}

function createCowMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0xffffff;
  const accentColor = appearance.accentColor ?? 0x2c2c2c;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

  const body = new THREE.Mesh(cowBodyGeo, bodyMat);
  body.position.y = 0.4;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(cowHeadGeo, bodyMat);
  head.position.set(0.6, 0.55, 0);
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.18, 0.25),
    new THREE.MeshLambertMaterial({ color: 0xf0b6a0 })
  );
  snout.position.set(0.75, 0.45, 0);
  group.add(snout);

  const horn = new THREE.Mesh(cowHornGeo, accentMat);
  horn.rotation.z = Math.PI / 4;
  horn.position.set(0.55, 0.65, 0.18);
  group.add(horn);

  const hornB = horn.clone();
  hornB.position.z = -0.18;
  hornB.rotation.z = -Math.PI / 4;
  group.add(hornB);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(simpleLegGeo, accentMat);
    leg.scale.set(0.55, 0.55, 0.55);
    leg.position.set(i < 2 ? 0.35 : -0.35, 0.25, i % 2 === 0 ? 0.15 : -0.15);
    group.add(leg);
  }

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
    accentMat
  );
  tail.position.set(-0.55, 0.6, 0);
  tail.rotation.z = Math.PI / 6;
  group.add(tail);

  return group;
}

function createHorseMesh(appearance) {
  const bodyColor = appearance.primaryColor ?? 0x8c5b37;
  const accentColor = appearance.accentColor ?? 0xf4d2a0;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });

  const body = new THREE.Mesh(horseBodyGeo, bodyMat);
  body.position.y = 0.45;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(horseNeckGeo, bodyMat);
  neck.position.set(0.55, 0.65, 0);
  neck.rotation.z = -0.25;
  group.add(neck);

  const head = new THREE.Mesh(horseHeadGeo, bodyMat);
  head.position.set(0.8, 0.7, 0);
  group.add(head);

  const mane = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.5, 0.08),
    accentMat
  );
  mane.position.set(0.4, 0.8, 0);
  group.add(mane);

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
    accentMat
  );
  tail.position.set(-0.55, 0.65, 0);
  tail.rotation.z = Math.PI / 8;
  group.add(tail);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(simpleLegGeo, accentMat);
    leg.position.set(i < 2 ? 0.4 : -0.4, 0.25, i % 2 === 0 ? 0.14 : -0.14);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  }

  return group;
}
