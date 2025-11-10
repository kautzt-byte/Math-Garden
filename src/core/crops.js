import {
  getAnimalSelectionEntries,
  getAnimalSelectionLabel,
} from '../systems/animals.js';
import {
  getDecorationSelectionEntries,
  getDecorationSelectionLabel,
} from '../systems/decorations.js';

// Central definition of crop types, prices, growth, etc.
function buildCrop({
  id,
  name,
  daysToHarvest,
  seedPrice,
  sellPrice,
}) {
  return {
    id,
    displayName: name,
    seedId: `seed_${id}`,
    cropId: `crop_${id}`,
    daysToHarvest,
    growToGrowing: Math.max(1, daysToHarvest - 1),
    growToReady: daysToHarvest,
    seedPrice,
    sellPrice,
  };
}

export const CROP_TYPES = {
  wheat: buildCrop({
    id: 'wheat',
    name: 'Wheat',
    daysToHarvest: 2,
    seedPrice: 2,
    sellPrice: 4,
  }),
  corn: buildCrop({
    id: 'corn',
    name: 'Corn',
    daysToHarvest: 4,
    seedPrice: 3,
    sellPrice: 6,
  }),
  potato: buildCrop({
    id: 'potato',
    name: 'Potato',
    daysToHarvest: 5,
    seedPrice: 4,
    sellPrice: 7,
  }),
  carrot: buildCrop({
    id: 'carrot',
    name: 'Carrot',
    daysToHarvest: 7,
    seedPrice: 5,
    sellPrice: 9,
  }),
  tomato: buildCrop({
    id: 'tomato',
    name: 'Tomato',
    daysToHarvest: 9,
    seedPrice: 6,
    sellPrice: 11,
  }),
  pumpkin: buildCrop({
    id: 'pumpkin',
    name: 'Pumpkin',
    daysToHarvest: 12,
    seedPrice: 8,
    sellPrice: 14,
  }),
};

// ---- Inventory helpers ----

export function getTotalSeedCount(inv = {}) {
  let total = 0;
  for (const def of Object.values(CROP_TYPES)) {
    total += inv[def.seedId] || 0;
  }
  return total;
}

export function getTotalCropCount(inv = {}) {
  let total = 0;
  for (const def of Object.values(CROP_TYPES)) {
    total += inv[def.cropId] || 0;
  }
  return total;
}

// Old "auto-pick" behavior: first crop type you have seeds for
export function pickSeedToPlant(inv = {}) {
  for (const def of Object.values(CROP_TYPES)) {
    if ((inv[def.seedId] || 0) > 0) {
      return def.id; // 'wheat', 'carrot', ...
    }
  }
  return null;
}

// ---- Seed / animal selection state (for the 0-key cycling) ----

let currentSelection = null; // null = no specific selection ("hand only")

export function getCurrentSeedType() {
  return currentSelection;
}

export function cycleSeedSelection(inv = {}) {
  const available = buildAvailableSelections(inv);

  if (available.length === 0) {
    currentSelection = null;
    return null;
  }

  if (!currentSelection) {
    currentSelection = available[0];
    return currentSelection;
  }

  const idx = available.findIndex((entry) =>
    selectionsMatch(entry, currentSelection)
  );

  if (idx === -1 || idx === available.length - 1) {
    currentSelection = null;
  } else {
    currentSelection = available[idx + 1];
  }

  return currentSelection;
}

function buildAvailableSelections(inv) {
  const cropEntries = Object.values(CROP_TYPES)
    .filter((def) => (inv[def.seedId] || 0) > 0)
    .map((def) => ({ kind: 'crop', id: def.id }));

  const animalEntries = getAnimalSelectionEntries(inv);
  const decorationEntries = getDecorationSelectionEntries(inv);
  return [...cropEntries, ...animalEntries, ...decorationEntries];
}

function selectionsMatch(a, b) {
  if (!a || !b) return false;
  return a.kind === b.kind && a.id === b.id;
}

export function getCurrentSeedLabel() {
  if (!currentSelection) return 'None';
  if (currentSelection.kind === 'animal') {
    return getAnimalSelectionLabel(currentSelection.id);
  }
  if (currentSelection.kind === 'decoration') {
    return getDecorationSelectionLabel(currentSelection.id);
  }
  const def = CROP_TYPES[currentSelection.id];
  return def ? def.displayName : 'None';
}
