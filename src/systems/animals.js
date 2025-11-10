import { spawnNPC } from './npcAI.js';
import { getRegionBounds } from '../world/travel.js';

export const ANIMAL_PRODUCT_ID = 'animal_product';
export const ANIMAL_PRODUCT_NAME = 'Animal Product';

export const ANIMAL_TYPES = {
  rabbit: {
    id: 'rabbit',
    displayName: 'Rabbit',
    tokenId: 'token_rabbit',
    tokenLabel: 'Rabbit Token',
    tokenPrice: 50,
    roamRadius: 2.4,
    wanderRadius: 2.4,
    speed: 0.85,
    collisionRadius: 0.26,
    idleRange: [2.2, 4],
    moveRange: [1.4, 2.4],
    appearance: {
      variant: 'critter',
      primaryColor: 0xf4f0dd,
      accentColor: 0xd88932,
    },
  },
  chicken: {
    id: 'chicken',
    displayName: 'Chicken',
    tokenId: 'token_chicken',
    tokenLabel: 'Chicken Token',
    tokenPrice: 75,
    roamRadius: 2.2,
    wanderRadius: 2.2,
    speed: 0.9,
    collisionRadius: 0.24,
    idleRange: [2, 4],
    moveRange: [1.2, 2.3],
    appearance: {
      variant: 'chicken',
      primaryColor: 0xfff3d6,
      accentColor: 0xf6b041,
    },
  },
  goat: {
    id: 'goat',
    displayName: 'Goat',
    tokenId: 'token_goat',
    tokenLabel: 'Goat Token',
    tokenPrice: 100,
    roamRadius: 2.6,
    wanderRadius: 2.6,
    speed: 0.85,
    collisionRadius: 0.32,
    idleRange: [2.2, 4.4],
    moveRange: [1.4, 2.6],
    appearance: {
      variant: 'goat',
      primaryColor: 0xece3d1,
      accentColor: 0x8b5a2b,
    },
  },
  cow: {
    id: 'cow',
    displayName: 'Cow',
    tokenId: 'token_cow',
    tokenLabel: 'Cow Token',
    tokenPrice: 200,
    roamRadius: 3,
    wanderRadius: 3,
    speed: 0.8,
    collisionRadius: 0.38,
    idleRange: [2.2, 4.8],
    moveRange: [1.4, 2.7],
    appearance: {
      variant: 'cow',
      primaryColor: 0xffffff,
      accentColor: 0x333333,
    },
  },
  horse: {
    id: 'horse',
    displayName: 'Horse',
    tokenId: 'token_horse',
    tokenLabel: 'Horse Token',
    tokenPrice: 300,
    roamRadius: 3.4,
    wanderRadius: 3.4,
    speed: 1.1,
    collisionRadius: 0.4,
    idleRange: [2.5, 4.6],
    moveRange: [1.6, 2.8],
    appearance: {
      variant: 'horse',
      primaryColor: 0x8c5b37,
      accentColor: 0xf4d2a0,
    },
  },
};

const animals = [];
let nextAnimalId = 1;

export function getAnimalSelectionEntries(inv = {}) {
  const entries = [];
  for (const type of Object.values(ANIMAL_TYPES)) {
    if ((inv[type.tokenId] || 0) > 0) {
      entries.push({ kind: 'animal', id: type.id });
    }
  }
  return entries;
}

export function getAnimalSelectionLabel(typeId) {
  const type = ANIMAL_TYPES[typeId];
  if (!type) return 'Animal Token';
  return type.tokenLabel || `${type.displayName} Token`;
}

export function placeAnimalToken(typeId, tile, game) {
  const type = ANIMAL_TYPES[typeId];
  if (!type) {
    return { success: false, reason: 'unknown_type' };
  }
  if (!tile || !tile.mesh || !tile.mesh.position) {
    return { success: false, reason: 'invalid_tile' };
  }

  const invKey = type.tokenId;
  const currentCount = game.inventory[invKey] || 0;
  if (currentCount <= 0) {
    return { success: false, reason: 'no_tokens', name: type.displayName };
  }

  const worldPos = tile.mesh.position.clone();
  worldPos.y = 0;

  const animalId = `animal_${type.id}_${nextAnimalId++}`;
  const roam = type.roamRadius ?? 2;
  const regionBounds = getRegionBounds(game.currentRegion);
  const movementBounds = buildClampedBounds(worldPos, roam, type, regionBounds);

  const npc = spawnNPC({
    id: animalId,
    region: game.currentRegion,
    appearance: type.appearance,
    position: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
    movementBounds,
    wanderRadius: type.wanderRadius ?? roam,
    speed: type.speed ?? 0.9,
    collisionRadius: type.collisionRadius ?? 0.25,
    useInteriorColliders: false,
    idleRange: type.idleRange ?? [2, 4],
    moveRange: type.moveRange ?? [1.4, 2.5],
    initialYaw: Math.random() * Math.PI * 2,
    interactable: {
      type: 'animal',
      animalId,
      animalName: type.displayName,
    },
  });

  if (!npc) {
    return { success: false, reason: 'spawn_failed' };
  }

  game.inventory[invKey] = currentCount - 1;

  animals.push({
    id: animalId,
    typeId: type.id,
    npc,
    nextHarvestDay: game.day + 2,
    region: game.currentRegion,
    spawnPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
  });
  syncNextAnimalIdFrom(animalId);

  return {
    success: true,
    name: type.displayName,
  };
}

export function handleAnimalInteract(animalId, game) {
  const animal = animals.find((entry) => entry.id === animalId);
  if (!animal) {
    return { success: false, reason: 'missing' };
  }

  const type = ANIMAL_TYPES[animal.typeId];
  if (!type) {
    return { success: false, reason: 'missing_type' };
  }

  if (game.day < animal.nextHarvestDay) {
    const remaining = animal.nextHarvestDay - game.day;
    return {
      success: false,
      reason: 'cooldown',
      remainingDays: remaining,
      name: type.displayName,
    };
  }

  game.inventory[ANIMAL_PRODUCT_ID] =
    (game.inventory[ANIMAL_PRODUCT_ID] || 0) + 1;
  animal.nextHarvestDay = game.day + 2;

  return {
    success: true,
    productId: ANIMAL_PRODUCT_ID,
    productName: ANIMAL_PRODUCT_NAME,
    name: type.displayName,
  };
}

export function getAnimalVendorListings() {
  return Object.values(ANIMAL_TYPES).map((type) => ({
    typeId: type.id,
    tokenId: type.tokenId,
    tokenName: type.tokenLabel,
    tokenPrice: type.tokenPrice,
  }));
}

export function serializeAnimals() {
  return animals.map((animal) => ({
    id: animal.id,
    typeId: animal.typeId,
    region: animal.region,
    position: animal.spawnPosition,
    nextHarvestDay: animal.nextHarvestDay,
  }));
}

export function hydrateAnimals(data = [], game) {
  clearAnimals();
  data.forEach((entry) => {
    const type = ANIMAL_TYPES[entry.typeId];
    if (!type || !entry.position) return;
    spawnAnimalFromSave(type, entry, game);
  });
}

function spawnAnimalFromSave(type, entry, game) {
  const region = entry.region || 'farm';
  const pos = {
    x: entry.position.x ?? 0,
    y: entry.position.y ?? 0,
    z: entry.position.z ?? 0,
  };
  const roam = type.roamRadius ?? 2;
  const regionBounds = getRegionBounds(region);
  const movementBounds = buildClampedBounds(pos, roam, type, regionBounds);
  const newId = entry.id || `animal_${type.id}_${nextAnimalId++}`;

  const npc = spawnNPC({
    id: newId,
    region,
    appearance: type.appearance,
    position: pos,
    movementBounds,
    wanderRadius: type.wanderRadius ?? roam,
    speed: type.speed ?? 0.9,
    collisionRadius: type.collisionRadius ?? 0.25,
    useInteriorColliders: false,
    idleRange: type.idleRange ?? [2, 4],
    moveRange: type.moveRange ?? [1.4, 2.5],
    initialYaw: Math.random() * Math.PI * 2,
    interactable: {
      type: 'animal',
      animalId: newId,
      animalName: type.displayName,
    },
  });

  if (!npc) return;

  animals.push({
    id: newId,
    typeId: type.id,
    npc,
    nextHarvestDay:
      typeof entry.nextHarvestDay === 'number'
        ? entry.nextHarvestDay
        : game.day + 2,
    region,
    spawnPosition: { ...pos },
  });
  syncNextAnimalIdFrom(newId);
}

function clearAnimals() {
  for (const entry of animals) {
    if (entry.npc && entry.npc.object3D && entry.npc.object3D.parent) {
      entry.npc.object3D.parent.remove(entry.npc.object3D);
    }
  }
  animals.length = 0;
  nextAnimalId = 1;
}

function syncNextAnimalIdFrom(id) {
  const match = /_(\d+)$/.exec(id);
  if (!match) return;
  const num = parseInt(match[1], 10);
  if (!Number.isNaN(num) && num >= nextAnimalId) {
    nextAnimalId = num + 1;
  }
}

function buildClampedBounds(center, radius, type, regionBounds) {
  const base = {
    minX: center.x - radius,
    maxX: center.x + radius,
    minZ: center.z - radius,
    maxZ: center.z + radius,
  };

  if (!regionBounds) return base;

  const margin = (type.collisionRadius ?? 0.3) * 1.2;

  base.minX = Math.max(base.minX, regionBounds.minX + margin);
  base.maxX = Math.min(base.maxX, regionBounds.maxX - margin);
  base.minZ = Math.max(base.minZ, regionBounds.minZ + margin);
  base.maxZ = Math.min(base.maxZ, regionBounds.maxZ - margin);

  if (base.minX > base.maxX) {
    const clampedX = clamp(center.x, regionBounds.minX + margin, regionBounds.maxX - margin);
    base.minX = base.maxX = clampedX;
  }

  if (base.minZ > base.maxZ) {
    const clampedZ = clamp(center.z, regionBounds.minZ + margin, regionBounds.maxZ - margin);
    base.minZ = base.maxZ = clampedZ;
  }

  return base;
}

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
