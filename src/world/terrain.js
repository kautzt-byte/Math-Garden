import { THREE } from '../core/three.js';
import { CROP_TYPES } from '../core/crops.js';
import { registerInteractable } from './interactables.js';
import { FARM_GATE_POSITION } from './travel.js';

export const GROUND_SIZE = 40;   // size of the main farm square
export const TILE_SIZE = 2;      // size of one tile (2x2 units)

export const tiles = [];         // flat list of all tiles

// Base colors for tile types
const TILE_COLORS = {
  grass: 0x3b8c2a, // green
  dirt:  0x8b5a2b, // base brown (empty dirt)
  path:  0xc2b280, // tan
};

// Visual colors for dirt by state
const DIRT_STATE_COLORS = {
  empty:   0x8b5a2b, // base brown
  planted: 0x5f3a1e, // darker tilled soil
  growing: 0x55311a, // deepest brown while crop develops
  ready:   0x8b5a2b, // revert to base brown once crop is ready
};

// Keep a reference to the scene so we can attach/detach crop meshes
let terrainScene = null;

// Shared geometries/materials for crops (reused across tiles)
let wheatStemGeo = null;
let wheatHeadGeo = null;
let wheatStemMat = null;
let wheatHeadMat = null;

let carrotRootGeo = null;
let carrotLeavesGeo = null;
let carrotRootMat = null;
let carrotLeavesMat = null;

const FARM_GATE_CLEAR_Z = 1.6;
const FARM_GATE_ROAD_COLOR = 0x1d1d1d;

let cornStalkGeo = null;
let cornLeafGeo = null;
let cornCobGeo = null;
let cornStalkMat = null;
let cornLeafMat = null;
let cornCobMat = null;

let tomatoStemGeo = null;
let tomatoLeafGeo = null;
let tomatoFruitGeo = null;
let tomatoStemMat = null;
let tomatoLeafMat = null;
let tomatoFruitMat = null;

let potatoBodyGeo = null;
let potatoSproutGeo = null;
let potatoBodyMat = null;
let potatoSproutMat = null;

let pumpkinBodyGeo = null;
let pumpkinStemGeo = null;
let pumpkinBodyMat = null;
let pumpkinStemMat = null;

export function createTerrain(scene) {
  terrainScene = scene;
  tiles.length = 0; // clear if re-created

  const half = GROUND_SIZE / 2;
  const tilesPerSide = GROUND_SIZE / TILE_SIZE;

  // Re-use geometry for all tiles (materials are per-tile)
  const tileGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);

  // Create a grid of tiles, all starting as grass
  for (let row = 0; row < tilesPerSide; row++) {
    for (let col = 0; col < tilesPerSide; col++) {
      const material = new THREE.MeshLambertMaterial({
        color: TILE_COLORS.grass,
      });

      const mesh = new THREE.Mesh(tileGeometry, material);
      mesh.rotation.x = -Math.PI / 2; // lay flat
      mesh.receiveShadow = true;      // ground receives shadows

      // Center the grid on (0, 0), tiles spaced by TILE_SIZE
      const x = -half + TILE_SIZE / 2 + col * TILE_SIZE;
      const z = -half + TILE_SIZE / 2 + row * TILE_SIZE;

      mesh.position.set(x, 0, z);

      const tileIndex = tiles.length;
      mesh.userData.tileIndex = tileIndex;
      mesh.userData.baseColor = TILE_COLORS.grass;

      const tile = {
        mesh,
        row,
        col,
        type: 'grass',
        plantedDay: null,
        state: 'empty',   // 'empty' | 'planted' | 'growing' | 'ready'
        cropType: null,   // 'wheat' | 'corn' | 'potato' | 'carrot' | 'tomato' | 'pumpkin' | null
        cropMesh: null,   // THREE.Group for the crop mesh (if present)
      };

      tiles.push(tile);
      scene.add(mesh);
    }
  }

  // -------- FENCES AROUND THE FARM --------
  const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
  const fenceHeight = 1.4;
  const step = 2;

  // Front & back fences
  for (let x = -half; x <= half; x += step) {
    addFencePost(scene, fenceMaterial, x, -half, fenceHeight);
    addFencePost(scene, fenceMaterial, x, half, fenceHeight);
  }

  // Left & right fences
  for (let z = -half; z <= half; z += step) {
    addFencePost(scene, fenceMaterial, -half, z, fenceHeight);
    if (!shouldSkipGatePost(half, z)) {
      addFencePost(scene, fenceMaterial, half, z, fenceHeight);
    }
  }

  // -------- SURROUNDING LOW-DETAIL GROUND --------
  // Big circle of grass around the farm so it looks like the world continues.
  const outerRadius = 200; // much larger than the 40x40 farm
  const outerGeometry = new THREE.CircleGeometry(outerRadius, 48);
  const outerMaterial = new THREE.MeshLambertMaterial({
    color: 0x6fae55, // slightly different green to suggest distance
  });

  const outerGround = new THREE.Mesh(outerGeometry, outerMaterial);
  outerGround.rotation.x = -Math.PI / 2; // lay flat
  outerGround.position.set(0, -0.02, 0); // just below tiles to avoid z-fighting
  outerGround.receiveShadow = true;
  scene.add(outerGround);

  // Add distant hills & trees on the horizon
  addDistantHorizonFeatures(scene);

  addFarmGate(scene);
  addFarmRoad(scene);
}

// -------- helpers --------

function addFencePost(scene, material, x, z, height) {
  const postGeo = new THREE.BoxGeometry(0.2, height, 0.2);
  const post = new THREE.Mesh(postGeo, material);
  post.position.set(x, height / 2, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);
}

function shouldSkipGatePost(x, z) {
  if (Math.abs(x - FARM_GATE_POSITION.x) > 0.3) {
    return false;
  }
  return Math.abs(z - FARM_GATE_POSITION.z) < FARM_GATE_CLEAR_Z;
}

// Simple distant hills + tree silhouettes so the world feels larger
function addDistantHorizonFeatures(scene) {
  // ----- HILLS -----
  const hillMaterial = new THREE.MeshLambertMaterial({ color: 0x6c8f4a });
  const hillGeometry = new THREE.SphereGeometry(12, 16, 12);

  const hills = [
    { x: -70, z: 40,  sx: 3.0, sy: 1.0, sz: 2.2 },
    { x:  65, z: -55, sx: 2.5, sy: 0.9, sz: 2.0 },
    { x:   0, z:  95, sx: 3.2, sy: 1.1, sz: 3.0 },
  ];

  for (const cfg of hills) {
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(cfg.x, -3, cfg.z); // sunk a bit into the ground
    hill.scale.set(cfg.sx, cfg.sy, cfg.sz);
    hill.receiveShadow = true;
    scene.add(hill);
  }

  // ----- TREES -----
  const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.3, 3, 6);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });

  const leavesGeometry = new THREE.ConeGeometry(1.4, 3.2, 8);
  const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x2f6f3b });

  function addTreeRing(radius, count, verticalOffset = 0) {
    for (let i = 0; i < count; i++) {
      const stagger = radius * 0.03;
      let rotationOffset = 0;
      if (radius > 80) {
        rotationOffset = Math.PI / 2; // outer ring
      } else if (radius > 60) {
        rotationOffset = Math.PI / 3; // inner ring
      }
      let angle = (i / count) * Math.PI * 2 + stagger + rotationOffset;
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;

      const ROAD_CLEAR_Z = FARM_GATE_CLEAR_Z + 1.2;
      const ROAD_START_X = FARM_GATE_POSITION.x + 4;
      let attempts = 0;
      while (
        attempts < 4 &&
        x > ROAD_START_X &&
        Math.abs(z - FARM_GATE_POSITION.z) < ROAD_CLEAR_Z
      ) {
        angle += Math.PI / 6;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        attempts++;
      }

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, verticalOffset + 1.5, z); // 1.5 = half trunk height
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);

      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.set(x, verticalOffset + 1.5 + 1.6, z);
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      scene.add(leaves);
    }
  }

  // Two rings of trees (you can tweak counts)
  addTreeRing(70, 24, 0);
  addTreeRing(105, 30, 0);
}

function addFarmGate(scene) {
  const gateWidth = FARM_GATE_CLEAR_Z * 2.2;
  const gateHeight = 1.6;
  const gateThickness = 0.28;
  const gateMaterial = new THREE.MeshLambertMaterial({ color: 0xb9824f });

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(gateThickness, gateHeight, gateWidth),
    gateMaterial
  );
  gate.position.set(
    FARM_GATE_POSITION.x + gateThickness / 2,
    gateHeight / 2,
    FARM_GATE_POSITION.z
  );
  gate.castShadow = true;
  gate.receiveShadow = true;

  registerInteractable(gate, {
    type: 'gate_to_town',
    baseColor: 0xb9824f,
  });

  scene.add(gate);

  const postGeo = new THREE.BoxGeometry(0.25, gateHeight + 0.4, 0.25);
  const postMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });

  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(
    FARM_GATE_POSITION.x,
    (gateHeight + 0.4) / 2,
    FARM_GATE_POSITION.z - FARM_GATE_CLEAR_Z
  );
  leftPost.castShadow = true;
  leftPost.receiveShadow = true;

  const rightPost = leftPost.clone();
  rightPost.position.z = FARM_GATE_POSITION.z + FARM_GATE_CLEAR_Z;

  scene.add(leftPost);
  scene.add(rightPost);
}

function addFarmRoad(scene) {
  const roadStartX = FARM_GATE_POSITION.x + 0.6;
  const outerStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(160, FARM_GATE_CLEAR_Z * 2.6),
    new THREE.MeshLambertMaterial({ color: FARM_GATE_ROAD_COLOR })
  );
  outerStrip.rotation.x = -Math.PI / 2;
  outerStrip.position.set(roadStartX + 80, 0.02, FARM_GATE_POSITION.z);
  outerStrip.receiveShadow = true;
  scene.add(outerStrip);
}

export function getTileByIndex(index) {
  if (index < 0 || index >= tiles.length) return null;
  return tiles[index];
}

// Internal: update the tile's material color & baseColor based on type/state
function updateTileVisual(tile) {
  let colorHex;

  if (tile.type === 'dirt') {
    // For dirt tiles, color depends on growth state
    const state = tile.state || 'empty';
    colorHex = DIRT_STATE_COLORS[state] || DIRT_STATE_COLORS.empty;
  } else {
    // Grass / path use base palette
    colorHex = TILE_COLORS[tile.type] || TILE_COLORS.grass;
  }

  tile.mesh.material.color.set(colorHex);
  tile.mesh.userData.baseColor = colorHex;
}

// Create or update the crop mesh for this tile based on its state & cropType
function updateCropMeshForTile(tile) {
  if (!terrainScene) return;

  const shouldHaveCrop =
    tile.type === 'dirt' &&
    tile.state !== 'empty' &&
    tile.cropType;

  if (!shouldHaveCrop) {
    // Remove crop mesh if present
    if (tile.cropMesh) {
      terrainScene.remove(tile.cropMesh);
      tile.cropMesh = null;
    }
    return;
  }

  // Ensure we have a crop mesh
  let mesh = tile.cropMesh;
  if (!mesh) {
    mesh = createCropMeshForTile(tile);
    if (!mesh) return;
    tile.cropMesh = mesh;
    terrainScene.add(mesh);
  }

  // Scale the crop based on growth state (short → tall)
  let scaleY = 0.4;
  if (tile.state === 'planted') {
    scaleY = 0.4;
  } else if (tile.state === 'growing') {
    scaleY = 0.7;
  } else if (tile.state === 'ready') {
    scaleY = 1.0;
  }

  // Slightly different base size per crop type
  let baseScale = 0.9;
  if (tile.cropType === 'carrot') {
    baseScale = 0.8;
  } else if (tile.cropType === 'corn') {
    baseScale = 1.05;
  } else if (tile.cropType === 'tomato') {
    baseScale = 0.85;
  } else if (tile.cropType === 'potato') {
    baseScale = 0.75;
  } else if (tile.cropType === 'pumpkin') {
    baseScale = 1.2;
  }

  mesh.scale.set(baseScale, scaleY, baseScale);

  // Center on tile
  mesh.position.x = tile.mesh.position.x;
  mesh.position.z = tile.mesh.position.z;
}

// Build a new crop mesh for this tile, based on tile.cropType
function createCropMeshForTile(tile) {
  if (!terrainScene) return null;
  const type = tile.cropType;

  const group = new THREE.Group();

  if (type === 'wheat') {
    if (!wheatStemGeo) {
      wheatStemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6);
      wheatHeadGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
      wheatStemMat = new THREE.MeshLambertMaterial({ color: 0xd9c76c }); // stalk
      wheatHeadMat = new THREE.MeshLambertMaterial({ color: 0xf1e28a }); // head
    }

    // Main stem
    const stem = new THREE.Mesh(wheatStemGeo, wheatStemMat);
    stem.position.y = 0.45;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    // Head
    const head = new THREE.Mesh(wheatHeadGeo, wheatHeadMat);
    head.position.y = 0.9;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // A couple of extra side stalks for fullness
    const side1 = stem.clone();
    side1.position.y = 0.4;
    side1.position.x = 0.08;
    side1.rotation.z = 0.2;
    group.add(side1);

    const side2 = stem.clone();
    side2.position.y = 0.4;
    side2.position.x = -0.08;
    side2.rotation.z = -0.2;
    group.add(side2);

  } else if (type === 'corn') {
    if (!cornStalkGeo) {
      cornStalkGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6);
      cornLeafGeo = new THREE.BoxGeometry(0.05, 0.35, 0.2);
      cornCobGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
      cornStalkMat = new THREE.MeshLambertMaterial({ color: 0x3d8c2a });    // main stalk
      cornLeafMat = new THREE.MeshLambertMaterial({ color: 0x23661c });     // darker leaves
      cornCobMat = new THREE.MeshLambertMaterial({ color: 0xf3d35a });      // yellow cob
    }

    const stalk = new THREE.Mesh(cornStalkGeo, cornStalkMat);
    stalk.position.y = 0.6;
    stalk.castShadow = true;
    stalk.receiveShadow = true;
    group.add(stalk);

    const cob = new THREE.Mesh(cornCobGeo, cornCobMat);
    cob.position.y = 1.05;
    cob.castShadow = true;
    cob.receiveShadow = true;
    group.add(cob);

    const leafLeft = new THREE.Mesh(cornLeafGeo, cornLeafMat);
    leafLeft.position.set(-0.12, 0.55, 0);
    leafLeft.rotation.z = 0.8;
    leafLeft.castShadow = true;
    leafLeft.receiveShadow = true;
    group.add(leafLeft);

    const leafRight = leafLeft.clone();
    leafRight.position.x = 0.12;
    leafRight.rotation.z = -0.8;
    group.add(leafRight);

    const topLeaf = leafLeft.clone();
    topLeaf.scale.set(0.8, 0.8, 0.8);
    topLeaf.position.set(0, 0.95, 0.05);
    topLeaf.rotation.x = 0.5;
    group.add(topLeaf);
  } else if (type === 'potato') {
    if (!potatoBodyGeo) {
      potatoBodyGeo = new THREE.SphereGeometry(0.28, 10, 10);
      potatoSproutGeo = new THREE.ConeGeometry(0.05, 0.25, 5);
      potatoBodyMat = new THREE.MeshLambertMaterial({ color: 0xcb9857 });
      potatoSproutMat = new THREE.MeshLambertMaterial({ color: 0x3e6b2a });
    }

    const tuber = new THREE.Mesh(potatoBodyGeo, potatoBodyMat);
    tuber.position.y = 0.2;
    tuber.scale.set(1.2, 0.8, 1.0);
    tuber.castShadow = true;
    tuber.receiveShadow = true;
    group.add(tuber);

    const tuber2 = tuber.clone();
    tuber2.position.x = 0.18;
    tuber2.scale.set(0.9, 0.7, 0.8);
    group.add(tuber2);

    const tuber3 = tuber.clone();
    tuber3.position.x = -0.16;
    tuber3.scale.set(0.8, 0.65, 0.85);
    group.add(tuber3);

    const sprout = new THREE.Mesh(potatoSproutGeo, potatoSproutMat);
    sprout.position.set(0, 0.5, 0);
    sprout.castShadow = true;
    sprout.receiveShadow = true;
    group.add(sprout);

    const sprout2 = sprout.clone();
    sprout2.position.x = 0.12;
    sprout2.rotation.z = -0.4;
    group.add(sprout2);
  } else if (type === 'carrot') {
    if (!carrotRootGeo) {
      carrotRootGeo = new THREE.ConeGeometry(0.22, 0.6, 7);
      carrotLeavesGeo = new THREE.ConeGeometry(0.32, 0.5, 7);
      carrotRootMat = new THREE.MeshLambertMaterial({ color: 0xff7b2a });   // orange
      carrotLeavesMat = new THREE.MeshLambertMaterial({ color: 0x2f8f4b }); // green
    }

    // Root
    const root = new THREE.Mesh(carrotRootGeo, carrotRootMat);
    root.position.y = 0.25;
    root.rotation.x = Math.PI; // tip downward
    root.castShadow = true;
    root.receiveShadow = true;
    group.add(root);

    // Leaves
    const leaves = new THREE.Mesh(carrotLeavesGeo, carrotLeavesMat);
    leaves.position.y = 0.6;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    group.add(leaves);

    // Small extra leaf tufts around
    const leaves2 = leaves.clone();
    leaves2.scale.set(0.7, 0.7, 0.7);
    leaves2.position.x = 0.12;
    group.add(leaves2);

    const leaves3 = leaves.clone();
    leaves3.scale.set(0.6, 0.6, 0.6);
    leaves3.position.x = -0.12;
    group.add(leaves3);
  } else if (type === 'tomato') {
    if (!tomatoStemGeo) {
      tomatoStemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6);
      tomatoLeafGeo = new THREE.BoxGeometry(0.05, 0.3, 0.18);
      tomatoFruitGeo = new THREE.SphereGeometry(0.12, 8, 8);
      tomatoStemMat = new THREE.MeshLambertMaterial({ color: 0x2b6b25 });
      tomatoLeafMat = new THREE.MeshLambertMaterial({ color: 0x3b8c3a });
      tomatoFruitMat = new THREE.MeshLambertMaterial({ color: 0xc62828 });
    }

    const stem = new THREE.Mesh(tomatoStemGeo, tomatoStemMat);
    stem.position.y = 0.45;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    const leafLeft = new THREE.Mesh(tomatoLeafGeo, tomatoLeafMat);
    leafLeft.position.set(-0.1, 0.5, 0);
    leafLeft.rotation.z = 0.7;
    leafLeft.castShadow = true;
    leafLeft.receiveShadow = true;
    group.add(leafLeft);

    const leafRight = leafLeft.clone();
    leafRight.position.x = 0.1;
    leafRight.rotation.z = -0.7;
    group.add(leafRight);

    const leafBack = leafLeft.clone();
    leafBack.position.set(0, 0.58, -0.1);
    leafBack.rotation.x = 0.7;
    group.add(leafBack);

    const fruit = new THREE.Mesh(tomatoFruitGeo, tomatoFruitMat);
    fruit.position.y = 0.65;
    fruit.castShadow = true;
    fruit.receiveShadow = true;
    group.add(fruit);

    const fruit2 = fruit.clone();
    fruit2.position.x = 0.15;
    fruit2.position.y = 0.55;
    fruit2.scale.set(0.85, 0.85, 0.85);
    group.add(fruit2);

    const fruit3 = fruit.clone();
    fruit3.position.x = -0.12;
    fruit3.position.y = 0.55;
    fruit3.scale.set(0.9, 0.9, 0.9);
    group.add(fruit3);
  } else if (type === 'pumpkin') {
    if (!pumpkinBodyGeo) {
      pumpkinBodyGeo = new THREE.SphereGeometry(0.45, 14, 12);
      pumpkinStemGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5);
      pumpkinBodyMat = new THREE.MeshLambertMaterial({ color: 0xff8a1c });
      pumpkinStemMat = new THREE.MeshLambertMaterial({ color: 0x3e5c25 });
    }

    const body = new THREE.Mesh(pumpkinBodyGeo, pumpkinBodyMat);
    body.position.y = 0.45;
    body.scale.set(1.2, 0.8, 1.2);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const stem = new THREE.Mesh(pumpkinStemGeo, pumpkinStemMat);
    stem.position.set(0.05, 0.85, 0);
    stem.rotation.z = -0.3;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    const rib = body.clone();
    rib.scale.set(1.05, 0.85, 0.7);
    rib.material = pumpkinBodyMat;
    rib.position.x = 0;
    group.add(rib);
  } else {
    return null;
  }

  // Start roughly centered at ground level; updateCropMeshForTile will
  // position x/z and scale it.
  group.position.set(tile.mesh.position.x, 0, tile.mesh.position.z);

  return group;
}

// Change tile type (grass/dirt/path). If leaving dirt with a crop, forbid change.
// Returns true if the tile type actually changed, false if blocked.
export function setTileType(tile, type) {
  if (!tile) return false;
  if (!TILE_COLORS[type]) type = 'grass';

  // If there's a crop present on a dirt tile, don't allow type changes away from dirt
  if (tile.type === 'dirt' && tile.state !== 'empty' && type !== 'dirt') {
    return false;
  }

  // Already that type? still update visuals & crop mesh to be safe
  if (tile.type === type) {
    updateTileVisual(tile);
    updateCropMeshForTile(tile);
    return true;
  }

  tile.type = type;

  if (type !== 'dirt') {
    // Clear any crop info when changing away from dirt
    tile.state = 'empty';
    tile.plantedDay = null;
    tile.cropType = null;
  } else {
    // New dirt tile starts as empty
    tile.state = 'empty';
    tile.plantedDay = null;
    tile.cropType = null;
  }

  updateTileVisual(tile);
  updateCropMeshForTile(tile);
  return true;
}

// Called from planting/harvesting code when dirt tile state changes
export function updateDirtTileVisual(tile) {
  if (!tile || tile.type !== 'dirt') return;
  updateTileVisual(tile);
  updateCropMeshForTile(tile);
}

// Advance growth stages for all dirt tiles based on current day
export function advanceTilesForNewDay(currentDay) {
  for (const tile of tiles) {
    if (tile.type !== 'dirt') continue;
    if (tile.state === 'empty' || tile.plantedDay == null) continue;

    const cropType = tile.cropType;
    if (!cropType) continue;

    const def = CROP_TYPES[cropType];
    if (!def) continue;

    const daysSince = currentDay - tile.plantedDay;
    const growToGrowing = def.growToGrowing ?? 1;
    const growToReady = def.growToReady ?? 2;

    if (tile.state === 'planted' && daysSince >= growToGrowing) {
      tile.state = 'growing';
      updateDirtTileVisual(tile);
    } else if (tile.state === 'growing' && daysSince >= growToReady) {
      tile.state = 'ready';
      updateDirtTileVisual(tile);
    }
  }
}

export function serializeTerrain() {
  return tiles.map((tile) => ({
    type: tile.type,
    state: tile.state,
    cropType: tile.cropType,
    plantedDay: tile.plantedDay,
  }));
}

export function hydrateTerrain(serializedTiles = []) {
  if (!Array.isArray(serializedTiles) || !serializedTiles.length) return;

  tiles.forEach((tile, index) => {
    const saved = serializedTiles[index];
    if (!saved) return;
    tile.type = saved.type || tile.type || 'grass';
    tile.state = saved.state || 'empty';
    tile.cropType = saved.cropType || null;
    tile.plantedDay =
      typeof saved.plantedDay === 'number' ? saved.plantedDay : null;
    updateTileVisual(tile);
    updateCropMeshForTile(tile);
  });
}
