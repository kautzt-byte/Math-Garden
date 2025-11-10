// Shared coordinates and region data for farm <-> town travel.
// Keep FARM_HALF_EXTENT in sync with GROUND_SIZE / 2 from terrain.js.

export const FARM_HALF_EXTENT = 20;

export const FARM_GATE_POSITION = Object.freeze({
  x: FARM_HALF_EXTENT,
  y: 0,
  z: 0,
});

// Where the player stands after returning from town (slightly inside the fence).
export const FARM_GATE_RETURN_POSITION = Object.freeze({
  x: FARM_HALF_EXTENT - 2.5,
  y: 1.6,
  z: 0,
});

// Place the town far along +X so it's never visible from the farm.
export const TOWN_CENTER = Object.freeze({
  x: 2400,
  y: 0,
  z: 0,
});

export const TOWN_HALF_EXTENT = 35;

export const TOWN_SPAWN_POSITION = Object.freeze({
  x: TOWN_CENTER.x - 20,
  y: 1.6,
  z: 0,
});

export const TOWN_SIGN_POSITION = Object.freeze({
  x: TOWN_CENTER.x - 25,
  y: 0,
  z: 0,
});

export const REGION_BOUNDS = {
  farm: {
    minX: -FARM_HALF_EXTENT,
    maxX: FARM_HALF_EXTENT,
    minZ: -FARM_HALF_EXTENT,
    maxZ: FARM_HALF_EXTENT,
  },
  town: {
    minX: TOWN_CENTER.x - TOWN_HALF_EXTENT,
    maxX: TOWN_CENTER.x + TOWN_HALF_EXTENT,
    minZ: -TOWN_HALF_EXTENT,
    maxZ: TOWN_HALF_EXTENT,
  },
};

export function getRegionBounds(regionId) {
  return REGION_BOUNDS[regionId] || null;
}
