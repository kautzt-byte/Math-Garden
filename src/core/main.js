import { THREE } from './three.js';
import { setupRenderer } from './renderer.js';
import { startGameLoop } from './gameLoop.js';
import { setupInput } from './input.js';
import { setupUI, updateHUD, updateInventoryUI } from './ui.js';

import { createTerrain, advanceTilesForNewDay, serializeTerrain, hydrateTerrain } from '../world/terrain.js';
import { createHouse } from '../world/house.js';
import { createMarket } from '../world/market.js';
import { createPlayer } from '../entities/player.js';
import { createTown, vendorInteriorNPCData } from '../world/town.js';
import { TOWN_CENTER } from '../world/travel.js';
import { initNPCSystem, spawnNPC } from '../systems/npcAI.js';
import { CROP_TYPES } from './crops.js';
import {
  loadSaveData,
  saveGame,
} from '../systems/save.js';
import {
  serializeAnimals,
  hydrateAnimals,
} from '../systems/animals.js';
import {
  serializeDecorations,
  hydrateDecorations,
} from '../systems/decorations.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd4ff);

// Optional: soft fog for depth
scene.fog = new THREE.Fog(0x8fd4ff, 60, 140);

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

export const renderer = setupRenderer();
export const EDUCATION_MODE = true;
const TOWN_SHADOW_EXTENT_X = Math.max(80, TOWN_CENTER.x + 120);
const TOWN_LIGHT_TARGET = new THREE.Vector3(TOWN_CENTER.x, 0, 0);

export const game = {
  day: 1,
  money: 0,
  crops: [],
  isInsideHouse: false,
  currentRegion: 'farm',
  inventory: {
    seed_wheat: 1,
    seed_carrot: 0,
    seed_corn: 0,
    seed_tomato: 0,
    seed_potato: 0,
    seed_pumpkin: 0,
    crop_wheat: 0,
    crop_carrot: 0,
    crop_corn: 0,
    crop_tomato: 0,
    crop_potato: 0,
    crop_pumpkin: 0,
    token_rabbit: 0,
    token_chicken: 0,
    token_goat: 0,
    token_cow: 0,
    token_horse: 0,
    decor_medium_rock: 0,
    animal_product: 0,
  },
};

const AUTOSAVE_DELAY_MS = 1200;
let autosaveTimer = null;

const FARM_CRITTER_BOUNDS = Object.freeze({
  minX: -14,
  maxX: -2,
  minZ: 2,
  maxZ: 12,
});

const TOWN_STROLLER_BOUNDS = Object.freeze({
  minX: TOWN_CENTER.x - 18,
  maxX: TOWN_CENTER.x + 10,
  minZ: -12,
  maxZ: 12,
});

const TOWN_PLAZA_BOUNDS = Object.freeze({
  minX: TOWN_CENTER.x - 10,
  maxX: TOWN_CENTER.x + 6,
  minZ: -8,
  maxZ: 4,
});

// Shared day-advance function (used by N key and by bed)
export function advanceDay() {
  game.day += 1;
  console.log(`--- Advancing to Day ${game.day} ---`);
  advanceTilesForNewDay(game.day);
  updateHUD();
  scheduleAutosave('day_advance');
}

function applySaveData(snapshot) {
  if (!snapshot) return;
  const gameData = snapshot.game;
  if (gameData) {
    if (typeof gameData.day === 'number') game.day = gameData.day;
    if (typeof gameData.money === 'number') game.money = gameData.money;
    if (typeof gameData.isInsideHouse === 'boolean') {
      game.isInsideHouse = gameData.isInsideHouse;
    }
    if (typeof gameData.currentRegion === 'string') {
      game.currentRegion = gameData.currentRegion;
    }
    if (gameData.inventory && typeof gameData.inventory === 'object') {
      const savedInv = gameData.inventory;
      Object.keys(game.inventory).forEach((key) => {
        game.inventory[key] = savedInv[key] ?? 0;
      });
      Object.keys(savedInv).forEach((key) => {
        if (!(key in game.inventory)) {
          game.inventory[key] = savedInv[key];
        }
      });
    }
  }

  if (Array.isArray(snapshot.tiles)) {
    hydrateTerrain(snapshot.tiles);
  }
  if (Array.isArray(snapshot.animals)) {
    hydrateAnimals(snapshot.animals, game);
  }
  if (Array.isArray(snapshot.decorations)) {
    hydrateDecorations(snapshot.decorations);
  }
}

export function serializeGameState() {
  return {
    version: 1,
    timestamp: Date.now(),
    game: {
      day: game.day,
      money: game.money,
      isInsideHouse: game.isInsideHouse,
      currentRegion: game.currentRegion,
      inventory: { ...game.inventory },
    },
    tiles: serializeTerrain(),
    animals: serializeAnimals(),
    decorations: serializeDecorations(),
  };
}

export function saveCurrentGame(reason = 'manual') {
  const payload = serializeGameState();
  const ok = saveGame(payload);
  if (!ok) {
    console.warn('[SAVE] Failed to write game state');
    return false;
  }
  console.log(`[SAVE] Saved game (${reason}).`);
  return true;
}

export function scheduleAutosave(reason = 'auto') {
  if (autosaveTimer) return;
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    saveCurrentGame(reason);
  }, AUTOSAVE_DELAY_MS);
}

function createSkyDome(scene) {
  const radius = 140;
  const widthSegments = 32;
  const heightSegments = 24;

  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  // Softer daylight tones
  const topColor = new THREE.Color(0x77c8ff);    // lighter sky blue
  const horizonColor = new THREE.Color(0xffe8b0); // pale warm yellow-peach

  const positions = geometry.attributes.position;
  const vertexCount = positions.count;
  const colors = [];

  for (let i = 0; i < vertexCount; i++) {
    const y = positions.getY(i);
    let t;
    if (y <= 0) {
      t = 0;
    } else {
      t = y / radius;
      if (t > 1) t = 1;
    }

    // gentler blend curve
    t = Math.pow(t, 0.9);

    const color = horizonColor.clone().lerp(topColor, t);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const sky = new THREE.Mesh(geometry, material);
  sky.position.set(0, 0, 0);
  scene.add(sky);
}

function init() {
  document.body.appendChild(renderer.domElement);

    // Sky dome (gradient sky)
  createSkyDome(scene);

  // Lighting

  // Soft sky/ground light (blue from above, warm from below)
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4b3b2a, 0.55);
  scene.add(hemiLight);

  // Main "sun" light for shadows / highlights
  const sunLight = new THREE.DirectionalLight(0xfff7e0, 0.9);
  sunLight.position.set(30, 40, 10);
  sunLight.castShadow = true;

  // Tune shadow camera (area where shadows are calculated)
  const leftExtent = -50;
  const rightExtent = TOWN_SHADOW_EXTENT_X;
  const depthExtent = 110;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 260;
  sunLight.shadow.camera.left = leftExtent;
  sunLight.shadow.camera.right = rightExtent;
  sunLight.shadow.camera.top = depthExtent;
  sunLight.shadow.camera.bottom = -depthExtent;

  sunLight.shadow.mapSize.set(1536, 1024);
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  const townSun = new THREE.DirectionalLight(0xffefcc, 0.8);
  townSun.position.set(TOWN_CENTER.x + 30, 45, 12);
  townSun.castShadow = true;
  townSun.target.position.copy(TOWN_LIGHT_TARGET);
  scene.add(townSun.target);

  const townSpan = 120;
  townSun.shadow.camera.near = 10;
  townSun.shadow.camera.far = 220;
  townSun.shadow.camera.left = -townSpan;
  townSun.shadow.camera.right = townSpan;
  townSun.shadow.camera.top = townSpan;
  townSun.shadow.camera.bottom = -townSpan;
  townSun.shadow.mapSize.set(1024, 1024);
  townSun.shadow.bias = -0.00025;
  scene.add(townSun);

  // Visible sun disc in the sky (full-bright)
  const sunGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff7c0 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.copy(sunLight.position).setLength(80);
  scene.add(sunMesh);

  const townSunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd38b })
  );
  townSunMesh.position.copy(
    townSun.position.clone().sub(townSun.target.position)
  ).setLength(80);
  townSunMesh.position.add(townSun.target.position);
  scene.add(townSunMesh);

  const existingSave = loadSaveData();

  // World
  createTerrain(scene);
  createHouse(scene);
  createMarket(scene);
  createTown(scene);
  seedNPCs();
  if (existingSave) {
    applySaveData(existingSave);
  }

  // Player
  createPlayer(scene, camera);

  // Input + UI
  setupInput(renderer.domElement);
  setupUI();

  startGameLoop();
  updateInventoryUI();
  updateHUD();

  if (!existingSave) {
    saveCurrentGame('initial_boot');
  }
}

function seedNPCs() {
  initNPCSystem(scene);

  spawnNPC({
    id: 'town_stroller_a',
    region: 'town',
    appearance: {
      primaryColor: 0xffd8a0,
      accentColor: 0x3f2a14,
      headColor: 0xfff5e2,
    },
    position: { x: TOWN_CENTER.x - 8, y: 0, z: 2 },
    movementBounds: TOWN_STROLLER_BOUNDS,
    wanderRadius: 6,
    speed: 1.2,
    collisionRadius: 0.35,
  });

  vendorInteriorNPCData.forEach((vendorMeta) => {
    if (!vendorMeta.position) return;
    const pos = vendorMeta.position;
    const cropId =
      vendorMeta.vendorId && CROP_TYPES[vendorMeta.vendorId]
        ? vendorMeta.vendorId
        : null;

    spawnNPC({
      id: `vendor_${vendorMeta.vendorId}`,
      region: 'town',
      appearance: vendorMeta.appearance,
      position: { x: pos.x, y: pos.y, z: pos.z },
      movementBounds: vendorMeta.bounds,
      wanderRadius: 1.1,
      speed: 0.7,
      turnSpeed: Math.PI,
      collisionRadius: 0.32,
      useInteriorColliders: true,
      idleRange: [2.2, 4],
      moveRange: [1.4, 2.6],
      initialYaw: vendorMeta.yaw,
      interactable: {
        type: 'vendor_npc',
        vendorId: vendorMeta.vendorId,
        vendorName: vendorMeta.name,
        cropId,
      },
    });
  });
}

init();
