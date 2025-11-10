import { THREE } from '../core/three.js';
import { addStaticBoxCollider } from './collisions.js';
import { registerInteractable } from './interactables.js';
import { setVendorTeleportData } from './vendorTeleport.js';
import {
  TOWN_CENTER,
  TOWN_HALF_EXTENT,
  TOWN_SIGN_POSITION,
} from './travel.js';

const COBBLE_COLOR = 0x8d8d8d;
const ROAD_COLOR = 0x1d1d1d;
const OUTER_GRASS_COLOR = 0x5f9c42;
const VENDOR_CONFIGS = [
  {
    id: 'wheat',
    name: 'Wheat Vendor',
    color: 0xf4e3a1,
    height: 5.6,
    floorColor: 0xf0e3c2,
    wallColor: 0xfef5da,
  },
  {
    id: 'corn',
    name: 'Corn Vendor',
    color: 0xc6dd67,
    height: 6.1,
    floorColor: 0xdde8b6,
    wallColor: 0xf6f8df,
  },
  {
    id: 'potato',
    name: 'Potato Vendor',
    color: 0xb38358,
    height: 5.9,
    floorColor: 0xd6b38b,
    wallColor: 0xf2dfc7,
  },
  {
    id: 'carrot',
    name: 'Carrot Vendor',
    color: 0xf08632,
    height: 6.4,
    floorColor: 0xf7c38e,
    wallColor: 0xffecd7,
  },
  {
    id: 'tomato',
    name: 'Tomato Vendor',
    color: 0xd7463c,
    height: 6.0,
    floorColor: 0xf4a7a0,
    wallColor: 0xffe1de,
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin Vendor',
    color: 0xc7652d,
    height: 6.8,
    floorColor: 0xf7b482,
    wallColor: 0xffe2cc,
  },
  {
    id: 'animal',
    name: 'Animal Vendor',
    color: 0xe9e5dc,
    height: 5.8,
    floorColor: 0xdfdfdf,
    wallColor: 0xffffff,
  },
  {
    id: 'decoration',
    name: 'Decoration Vendor',
    color: 0x5a9ccf,
    height: 6.3,
    floorColor: 0xaad0ef,
    wallColor: 0xe7f4ff,
  },
];
const VENDOR_ROOF_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x4c3826 });
const VENDOR_DOOR_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x2f2215 });
const VENDOR_DOOR_ACCENT = new THREE.MeshLambertMaterial({ color: 0xded2c1 });
const vendorLabelMaterials = new Map();
export const vendorInteriorNPCData = [];

export function createTown(scene) {
  createBase(scene);
  createOuterEnvironment(scene);
  addBoundaries(scene);
  addOutboundRoad(scene);
  addVendorBuildings(scene);
  addReturnSign(scene);
}

function createBase(scene) {
  const size = TOWN_HALF_EXTENT * 2;
  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ color: COBBLE_COLOR })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.set(TOWN_CENTER.x, 0, TOWN_CENTER.z);
  base.receiveShadow = true;
  scene.add(base);
}

function createOuterEnvironment(scene) {
  const outer = new THREE.Mesh(
    new THREE.CircleGeometry(220, 48),
    new THREE.MeshLambertMaterial({ color: OUTER_GRASS_COLOR })
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.set(TOWN_CENTER.x, -0.03, TOWN_CENTER.z);
  outer.receiveShadow = true;
  scene.add(outer);

  addTownHorizonGradient(scene);
  addTownHills(scene);
  addTownTrees(scene);
}

function addTownHills(scene) {
  const geo = new THREE.SphereGeometry(14, 16, 12);
  const mat = new THREE.MeshLambertMaterial({ color: 0x6c8f4a });
  const hills = [
    { x: TOWN_CENTER.x + 80, z: 60 },
    { x: TOWN_CENTER.x - 60, z: -75 },
    { x: TOWN_CENTER.x + 30, z: -95 },
  ];

  for (const cfg of hills) {
    const hill = new THREE.Mesh(geo, mat);
    hill.position.set(cfg.x, -4, cfg.z);
    hill.scale.set(2.6, 0.9, 2.3);
    hill.receiveShadow = true;
    scene.add(hill);
  }
}

function addTownHorizonGradient(scene) {
  const innerRadius = TOWN_HALF_EXTENT + 150;
  const outerRadius = innerRadius + 320;
  const segments = 96;

  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1);
  const colors = [];
  const position = geometry.attributes.position;

  const horizonColor = new THREE.Color(0xffe8b0);
  const skyColor = new THREE.Color(0x77c8ff);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const radius = Math.sqrt(x * x + y * y);
    const t = THREE.MathUtils.clamp((radius - innerRadius) / (outerRadius - innerRadius), 0, 1);
    const color = horizonColor.clone().lerp(skyColor, t);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(TOWN_CENTER.x, 0.15, TOWN_CENTER.z);
  ring.renderOrder = -3;
  scene.add(ring);
}

function getVendorLabelMaterial(cfg) {
  if (vendorLabelMaterials.has(cfg.id)) {
    return vendorLabelMaterials.get(cfg.id);
  }

  let material;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(cfg.color);
    const labelColor = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.3);
    ctx.fillStyle = '#' + labelColor.getHexString();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

    ctx.fillStyle = '#0c0c0c';
    ctx.font = 'bold 50px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.name.toUpperCase(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  } else {
    material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
  }
  vendorLabelMaterials.set(cfg.id, material);
  return material;
}

function addTownTrees(scene) {
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.35, 3.2, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7b4a1d });
  const leavesGeo = new THREE.ConeGeometry(1.5, 3.3, 8);
  const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2f7a3c });

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 90 + (i % 3) * 10;
    const x = TOWN_CENTER.x + Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.6, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, 3.1, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    scene.add(leaves);
  }
}

function addBoundaries(scene) {
  const height = 2.5;
  const thickness = 0.5;
  const width = TOWN_HALF_EXTENT * 2;
  const invisibleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const walls = [
    { x: TOWN_CENTER.x, z: TOWN_CENTER.z + TOWN_HALF_EXTENT + thickness, sx: width, sz: thickness },
    { x: TOWN_CENTER.x, z: TOWN_CENTER.z - TOWN_HALF_EXTENT - thickness, sx: width, sz: thickness },
    { x: TOWN_CENTER.x + TOWN_HALF_EXTENT + thickness, z: TOWN_CENTER.z, sx: thickness, sz: width },
    { x: TOWN_CENTER.x - TOWN_HALF_EXTENT - thickness, z: TOWN_CENTER.z, sx: thickness, sz: width },
  ];

  for (const cfg of walls) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.sx, height, cfg.sz),
      invisibleMat
    );
    wall.position.set(cfg.x, height / 2, cfg.z);
    wall.visible = false;
    scene.add(wall);
    addStaticBoxCollider(wall, 0.5);
  }
}

function addOutboundRoad(scene) {
  const nearStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 5),
    new THREE.MeshLambertMaterial({ color: ROAD_COLOR })
  );
  nearStrip.rotation.x = -Math.PI / 2;
  nearStrip.position.set(TOWN_CENTER.x - 20, 0.015, TOWN_CENTER.z);
  nearStrip.receiveShadow = true;
  scene.add(nearStrip);

  const farStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 5),
    new THREE.MeshLambertMaterial({ color: ROAD_COLOR })
  );
  farStrip.rotation.x = -Math.PI / 2;
  farStrip.position.set(TOWN_CENTER.x - 260, 0.012, TOWN_CENTER.z);
  farStrip.receiveShadow = true;
  scene.add(farStrip);

  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 8),
    new THREE.MeshLambertMaterial({ color: ROAD_COLOR })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(TOWN_SIGN_POSITION.x + 2, 0.018, TOWN_SIGN_POSITION.z);
  pad.receiveShadow = true;
  scene.add(pad);
}

function addVendorBuildings(scene) {
  vendorInteriorNPCData.length = 0;
  const xOffsets = [-26, -9, 9, 26];
  const zOffsets = [13.5, -13.5];
  VENDOR_CONFIGS.forEach((cfg, index) => {
    const row = index < 4 ? 0 : 1;
    const facing = row === 0 ? -1 : 1;
    const x = TOWN_CENTER.x + xOffsets[index % xOffsets.length];
    const z = TOWN_CENTER.z + zOffsets[row];
    const houseInfo = createVendorHouse(scene, cfg, x, z, facing);
    const interiorInfo = createVendorInterior(scene, cfg, houseInfo);
    setVendorTeleportData(cfg.id, {
      name: cfg.name,
      outsidePosition: houseInfo.outsidePosition,
      outsideYaw: houseInfo.outsideYaw,
      insidePosition: interiorInfo.insidePosition,
      insideYaw: interiorInfo.insideYaw,
    });
    vendorInteriorNPCData.push({
      vendorId: cfg.id,
      name: cfg.name,
      position: interiorInfo.npcPosition,
      yaw: interiorInfo.npcYaw,
      bounds: interiorInfo.bounds,
      appearance: {
        primaryColor: cfg.color,
        accentColor: 0x2f2215,
        headColor: 0xfff4e2,
      },
    });
  });
}

function createVendorHouse(scene, cfg, worldX, worldZ, facingDir) {
  const width = 9.5;
  const depth = 7.6;
  const height = cfg.height;

  const group = new THREE.Group();
  group.position.set(worldX, 0, worldZ);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color: cfg.color })
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.45, depth + 0.3),
    VENDOR_DOOR_ACCENT
  );
  trim.position.y = 0.3;
  trim.castShadow = false;
  trim.receiveShadow = false;
  group.add(trim);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.8, 0.55, depth + 0.8),
    VENDOR_ROOF_MATERIAL
  );
  roof.position.y = height + 0.25;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.4, 0.3),
    VENDOR_DOOR_MATERIAL
  );
  door.position.y = 1.2;
  door.position.z = facingDir * (depth / 2 + 0.02);
  door.castShadow = true;
  door.receiveShadow = true;
  group.add(door);

  registerInteractable(door, {
    type: 'vendor_door_outside',
    baseColor: 0x2f2215,
    vendorId: cfg.id,
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.8),
    getVendorLabelMaterial(cfg)
  );
  const signOffset = depth / 2 + 0.08;
  sign.position.set(0, 3.6, facingDir * signOffset);
  sign.rotation.y = facingDir === 1 ? 0 : Math.PI;
  sign.renderOrder = 1;
  group.add(sign);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.25, 1.2),
    VENDOR_DOOR_ACCENT
  );
  awning.position.set(0, 2.0, door.position.z + facingDir * 0.4);
  awning.castShadow = true;
  awning.receiveShadow = true;
  group.add(awning);

  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.4),
    new THREE.MeshLambertMaterial({ color: 0xbfbab0 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.01, door.position.z + facingDir * 0.9);
  pad.receiveShadow = true;
  group.add(pad);

  scene.add(group);
  group.updateMatrixWorld(true);

  const doorWorld = new THREE.Vector3();
  door.getWorldPosition(doorWorld);
  const forward = new THREE.Vector3(0, 0, facingDir).normalize();
  const outsidePosition = doorWorld.clone().add(forward.clone().multiplyScalar(1.1));
  outsidePosition.y = 1.6;
  const outsideYaw = Math.atan2(forward.x, forward.z);

  addStaticBoxCollider(body, 0.6);

  return {
    cfg,
    worldX,
    worldZ,
    facingDir,
    width,
    depth,
    outsidePosition,
    outsideYaw,
  };
}

function createVendorInterior(scene, cfg, houseInfo) {
  const roomWidth = houseInfo.width - 1.4;
  const roomDepth = houseInfo.depth - 0.8;
  const roomHeight = 3.2;
  const wallThickness = 0.35;

  const group = new THREE.Group();
  group.position.set(houseInfo.worldX, 0, houseInfo.worldZ);
  group.rotation.y = houseInfo.facingDir === 1 ? 0 : Math.PI;

  const colliders = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshLambertMaterial({ color: cfg.floorColor })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.05, 0);
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshLambertMaterial({ color: 0xf8f8f8 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, roomHeight, 0);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const wallMat = new THREE.MeshLambertMaterial({ color: cfg.wallColor });

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
    wallMat
  );
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);
  colliders.push({ mesh: backWall, padding: 0.2, opts: { interior: true } });

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
    wallMat
  );
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);
  colliders.push({ mesh: leftWall, padding: 0.2, opts: { interior: true } });

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
    wallMat
  );
  rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);
  colliders.push({ mesh: rightWall, padding: 0.2, opts: { interior: true } });

  const doorWidth = 1.8;
  const doorHeight = 2.3;
  const doorway = new THREE.Group();
  doorway.position.z = roomDepth / 2;
  group.add(doorway);

  const doorWallWidth = (roomWidth - doorWidth) / 2 - 0.25;
  const doorSideMat = wallMat;

  const leftSide = new THREE.Mesh(
    new THREE.BoxGeometry(doorWallWidth, roomHeight, wallThickness),
    doorSideMat
  );
  leftSide.position.set(-(doorWidth / 2) - doorWallWidth / 2, roomHeight / 2, 0);
  leftSide.castShadow = true;
  leftSide.receiveShadow = true;
  doorway.add(leftSide);
  colliders.push({ mesh: leftSide, padding: 0.18, opts: { interior: true } });

  const rightSide = leftSide.clone();
  rightSide.position.x = (doorWidth / 2) + doorWallWidth / 2;
  doorway.add(rightSide);
  colliders.push({ mesh: rightSide, padding: 0.18, opts: { interior: true } });

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, roomHeight - doorHeight, wallThickness),
    doorSideMat
  );
  head.position.set(0, doorHeight + (roomHeight - doorHeight) / 2, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  doorway.add(head);
  colliders.push({ mesh: head, padding: 0.12, opts: { interior: true } });

  const insideDoor = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, 0.25),
    VENDOR_DOOR_MATERIAL
  );
  insideDoor.position.set(0, doorHeight / 2, -wallThickness / 2);
  insideDoor.castShadow = true;
  insideDoor.receiveShadow = true;
  doorway.add(insideDoor);

  registerInteractable(insideDoor, {
    type: 'vendor_door_inside',
    baseColor: 0x2f2215,
    vendorId: cfg.id,
  });

  colliders.push({ mesh: insideDoor, padding: 0.1, opts: { interior: true } });

  const accentBeam = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.15, 0.5),
    new THREE.MeshLambertMaterial({ color: 0xb7a58f })
  );
  accentBeam.position.set(0, roomHeight - 0.2, 0);
  accentBeam.castShadow = true;
  accentBeam.receiveShadow = true;
  group.add(accentBeam);

  scene.add(group);
  group.updateMatrixWorld(true);

  colliders.forEach((entry) => {
    addStaticBoxCollider(entry.mesh, entry.padding, entry.opts);
  });

  const doorWorld = new THREE.Vector3();
  insideDoor.getWorldPosition(doorWorld);
  const insideDir = new THREE.Vector3(0, 0, -1).applyQuaternion(group.quaternion).normalize();
  const insidePosition = doorWorld.clone().add(insideDir.clone().multiplyScalar(1.2));
  insidePosition.y = 1.6;
  const insideYaw = Math.atan2(insideDir.x, insideDir.z);

  const vendorLocal = new THREE.Vector3(0, 0, -roomDepth / 2 + 1.4);
  const npcWorld = vendorLocal.clone();
  group.localToWorld(npcWorld);
  npcWorld.y = 0;
  const npcYaw = Math.atan2(-insideDir.x, -insideDir.z);

  const margin = 0.8;
  const bounds = {
    minX: houseInfo.worldX - roomWidth / 2 + margin,
    maxX: houseInfo.worldX + roomWidth / 2 - margin,
    minZ: houseInfo.worldZ - roomDepth / 2 + margin,
    maxZ: houseInfo.worldZ + roomDepth / 2 - margin,
  };

  const npcPosition = { x: npcWorld.x, y: npcWorld.y, z: npcWorld.z };

  return { insidePosition, insideYaw, npcPosition, npcYaw, bounds };
}

function addReturnSign(scene) {
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 2.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  post.position.set(TOWN_SIGN_POSITION.x, 1.1, TOWN_SIGN_POSITION.z);
  post.castShadow = true;
  post.receiveShadow = true;

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.9, 0.2),
    new THREE.MeshLambertMaterial({ color: 0xc4873c })
  );
  board.position.set(0, 0.9, 0);
  board.castShadow = true;
  board.receiveShadow = true;
  post.add(board);

  registerInteractable(board, {
    type: 'town_return_sign',
    baseColor: 0xc4873c,
  });

  scene.add(post);
}
