import { THREE } from './three.js';
import { camera, game, advanceDay, scheduleAutosave } from './main.js';
import {
  tiles,
  getTileByIndex,
  setTileType,
  updateDirtTileVisual,
} from '../world/terrain.js';
import { interactables } from '../world/interactables.js';
import {
  showMessage,
  updateInventoryUI,
  openMarketUI,
  openMathCheck,
} from './ui.js';
import { teleportPlayer } from '../entities/player.js';
import { getCurrentTool } from './tools.js';
import {
  CROP_TYPES,
  pickSeedToPlant,
  getCurrentSeedType,
} from './crops.js';
import {
  placeAnimalToken,
  handleAnimalInteract,
  getAnimalVendorListings,
  ANIMAL_PRODUCT_ID,
  ANIMAL_PRODUCT_NAME,
} from '../systems/animals.js';
import {
  placeDecoration,
  handleDecorationPickup,
  getDecorationVendorListings,
  rotateDecoration,
} from '../systems/decorations.js';
import {
  playInteractionSound,
  playTileChangeSound,
  playPlantSound,
  playHarvestSound,
} from '../systems/sound.js';
import {
  TOWN_SPAWN_POSITION,
  FARM_GATE_RETURN_POSITION,
} from '../world/travel.js';
import { getVendorTeleportData } from '../world/vendorTeleport.js';

const raycaster = new THREE.Raycaster();

// Center of screen (crosshair)
const centerNDC = new THREE.Vector2(0, 0);

// Teleport targets for outside ↔ inside
const OUTSIDE_DOOR_POS = new THREE.Vector3(0, 1.6, -7.5);
const OUTSIDE_YAW = 0;
const INSIDE_DOOR_POS = new THREE.Vector3(0, 1.6, -10.5);
const INSIDE_YAW = Math.PI;

let currentHit = null;
let currentTileIndex = null;
let currentInteractable = null;
let lastHighlighted = null;

export function updateRaycast() {
  raycaster.setFromCamera(centerNDC, camera);

  const tileMeshes = tiles.map((t) => t.mesh);
  const objects = [...tileMeshes, ...interactables];

  const intersects = raycaster.intersectObjects(objects, false);

  if (!intersects.length) {
    if (lastHighlighted) {
      resetHighlight(lastHighlighted);
      lastHighlighted = null;
    }
    currentHit = null;
    currentTileIndex = null;
    currentInteractable = null;
    return;
  }

  const hit = intersects[0];
  const obj = hit.object;

  currentHit = hit;
  currentTileIndex =
    typeof obj.userData.tileIndex === 'number' ? obj.userData.tileIndex : null;
  currentInteractable = obj.userData.interactable ? obj : null;

  if (lastHighlighted && lastHighlighted !== obj) {
    resetHighlight(lastHighlighted);
  }

  if (obj && obj.material && obj.material.color && obj.userData.baseColor) {
    const base = new THREE.Color(obj.userData.baseColor);
    const highlight = base.clone().offsetHSL(0, 0, 0.12);
    obj.material.color.copy(highlight);
  }

  lastHighlighted = obj;
}

function resetHighlight(obj) {
  if (obj && obj.material && obj.material.color && obj.userData.baseColor) {
    obj.material.color.set(obj.userData.baseColor);
  }
}

// Called when you left-click with the pointer locked
export function handleInteract() {
  const tool = getCurrentTool();

  // 1) Tool mode: edit tile type
  if (tool !== 'none' && currentTileIndex != null) {
    const tile = getTileByIndex(currentTileIndex);
    if (!tile) return;

    let success = false;
    if (tool === 'hoe') {
      success = setTileType(tile, 'dirt');
      if (!success) {
        showMessage("Can't change this tile while a crop is here.", 1500);
      } else {
        showMessage('Hoed tile -> dirt.', 800);
        playTileChangeSound();
        scheduleAutosave('tile_change');
      }
    } else if (tool === 'shovel') {
      success = setTileType(tile, 'path');
      if (!success) {
        showMessage("Can't change this tile while a crop is here.", 1500);
      } else {
        showMessage('Shoveled tile -> path.', 800);
        playTileChangeSound();
        scheduleAutosave('tile_change');
      }
    } else if (tool === 'rake') {
      success = setTileType(tile, 'grass');
      if (!success) {
        showMessage("Can't change this tile while a crop is here.", 1500);
      } else {
        showMessage('Raked tile -> grass.', 800);
        playTileChangeSound();
        scheduleAutosave('tile_change');
      }
    }
    return;
  }

  // 2) Farming / animal placement on tiles (no tool selected)
  if (tool === 'none' && currentTileIndex != null) {
    const tile = getTileByIndex(currentTileIndex);
    if (!tile) return;

    const selection = getCurrentSeedType();
    if (selection && selection.kind === 'animal') {
      const result = placeAnimalToken(selection.id, tile, game);
      if (!result.success) {
        if (result.reason === 'no_tokens') {
          showMessage(`No ${result.name || 'animal'} tokens left.`, 1500);
        } else if (result.reason === 'cooldown') {
          showMessage('Animal token not ready.', 1200);
        } else {
          showMessage('Could not place animal here.', 1200);
        }
      } else {
        showMessage(`Placed ${result.name}.`, 1400);
        updateInventoryUI();
        updateHUD();
        scheduleAutosave('place_animal');
      }
      return;
    }

    if (selection && selection.kind === 'decoration') {
      const result = placeDecoration(selection.id, tile, game);
      if (!result.success) {
        if (result.reason === 'no_tokens') {
          showMessage(`No ${result.name || 'decoration'} tokens left.`, 1500);
        } else {
          showMessage('Could not place decoration here.', 1200);
        }
      } else {
        showMessage(`Placed ${result.name}.`, 1400);
        updateInventoryUI();
        updateHUD();
        scheduleAutosave('place_decoration');
      }
      return;
    }

    if (tile.type !== 'dirt') {
      showMessage('You can only farm on dirt tiles.', 1000);
      return;
    }

    if (tile.state === 'empty') {
      // Selection might explicitly target a crop; otherwise fall back to auto
      let cropType =
        selection && selection.kind === 'crop' ? selection.id : null;

      if (cropType) {
        const def = CROP_TYPES[cropType];
        if (!def) return;

        const count = game.inventory[def.seedId] || 0;
        if (count <= 0) {
          // Selected seed type is out of stock
          console.log(`No ${def.displayName} seeds left.`);
          showMessage(`No ${def.displayName} seeds left.`, 1500);
          return;
        }

        game.inventory[def.seedId] = count - 1;
        tile.plantedDay = game.day;
        tile.state = 'planted';
        tile.cropType = cropType;
        updateDirtTileVisual(tile);

        console.log(
          `Planted ${def.displayName} on tile ${currentTileIndex} on Day ${game.day} (seed -1)`
        );
        showMessage(`Planted ${def.displayName} (Day ${game.day}).`);
        playPlantSound();
        updateInventoryUI();
        scheduleAutosave('plant');
      } else {
        // No specific seed selected -> fall back to auto-pick
        cropType = pickSeedToPlant(game.inventory);
        if (!cropType) {
          console.log('Tried to plant, but no seeds.');
          showMessage('You have no seeds to plant.', 1500);
          return;
        }

        const def = CROP_TYPES[cropType];
        if (!def) return;

        game.inventory[def.seedId] =
          (game.inventory[def.seedId] || 0) - 1;

        tile.plantedDay = game.day;
        tile.state = 'planted';
        tile.cropType = cropType;
        updateDirtTileVisual(tile);

        console.log(
          `Planted ${def.displayName} on tile ${currentTileIndex} on Day ${game.day} (seed -1, auto)`
        );
        showMessage(`Planted ${def.displayName} (Day ${game.day}).`);
        playPlantSound();
        updateInventoryUI();
        scheduleAutosave('plant');
      }
    } else if (tile.state === 'planted' || tile.state === 'growing') {
      console.log(
        `Tile ${currentTileIndex} is not ready yet (state: ${tile.state})`
      );
      showMessage('Not ready yet...', 1000);
    } else if (tile.state === 'ready') {
      const cropType = tile.cropType;
      const def = cropType ? CROP_TYPES[cropType] : null;

      tile.state = 'empty';
      tile.plantedDay = null;
      tile.cropType = null;
      updateDirtTileVisual(tile);

      if (def) {
        const id = def.cropId;
        game.inventory[id] = (game.inventory[id] || 0) + 1;

        console.log(
          `Harvested ${def.displayName} on tile ${currentTileIndex} on Day ${game.day} (+1 ${def.displayName})`
        );
        showMessage(`Harvested ${def.displayName}! +1`, 1500);
        playHarvestSound();
        scheduleAutosave('harvest');
      } else {
        showMessage('Harvested crop.', 1200);
        playHarvestSound();
        scheduleAutosave('harvest');
      }

      updateInventoryUI();
    }

    return;
  }

  // 3) Bed / doors / market / other interactables
  if (currentInteractable) {
    const type = currentInteractable.userData.type;

    if (type === 'bed') {
      playInteractionSound(true);
      openMathCheck(() => {
        advanceDay();
        showMessage(`You slept. Now it's Day ${game.day}.`, 2000);
      });
    } else if (type === 'door_outside') {
      playInteractionSound(true);
      teleportPlayer(
        INSIDE_DOOR_POS.x,
        INSIDE_DOOR_POS.y,
        INSIDE_DOOR_POS.z,
        INSIDE_YAW
      );
      game.isInsideHouse = true;
      showMessage('You step inside the house.', 1500);
    } else if (type === 'door_inside') {
      playInteractionSound(true);
      teleportPlayer(
        OUTSIDE_DOOR_POS.x,
        OUTSIDE_DOOR_POS.y,
        OUTSIDE_DOOR_POS.z,
        OUTSIDE_YAW
      );
      game.isInsideHouse = false;
      showMessage('You step outside.', 1500);
    } else if (type === 'market') {
      playInteractionSound(true);
      openMarketUI();
      showMessage('Opened market.', 1200);
    } else if (type === 'vendor_npc') {
      const vendorName = currentInteractable.userData.vendorName || 'Vendor';
      const cropId = currentInteractable.userData.cropId;
      const vendorId = currentInteractable.userData.vendorId;

      if (vendorId === 'animal') {
        const animals = getAnimalVendorListings();
        if (!animals.length) {
          playInteractionSound(false);
          showMessage('No animals for sale right now.', 1400);
          return;
        }
        playInteractionSound(true);
        const wheatVendorPrice = (CROP_TYPES.wheat?.sellPrice || 0) + 2;
        openMarketUI({
          mode: 'tokens',
          vendorName,
          tokenOptions: {
            entries: animals,
            sellItem: {
              id: ANIMAL_PRODUCT_ID,
              name: ANIMAL_PRODUCT_NAME,
              price: wheatVendorPrice,
            },
          },
        });
        showMessage(`Trading with ${vendorName}.`, 1400);
        return;
      }
      if (vendorId === 'decoration') {
        const decorations = getDecorationVendorListings();
        if (!decorations.length) {
          playInteractionSound(false);
          showMessage('No decorations for sale right now.', 1400);
          return;
        }
        playInteractionSound(true);
        openMarketUI({
          mode: 'tokens',
          vendorName,
          tokenOptions: {
            entries: decorations,
          },
        });
        showMessage(`Browsing ${vendorName}.`, 1400);
        return;
      }

      if (cropId && CROP_TYPES[cropId]) {
        playInteractionSound(true);
        openMarketUI({
          cropId,
          lockToCrop: true,
          vendorName,
          priceAdjustments: { buy: -1, sell: 2 },
        });
        showMessage(`Trading with ${vendorName}.`, 1400);
      } else {
        playInteractionSound(false);
        showMessage(`${vendorName} is not selling crops yet.`, 1400);
      }
    } else if (type === 'gate_to_town') {
      playInteractionSound(true);
      teleportPlayer(
        TOWN_SPAWN_POSITION.x,
        TOWN_SPAWN_POSITION.y,
        TOWN_SPAWN_POSITION.z,
        -Math.PI / 2
      );
      game.isInsideHouse = false;
      game.currentRegion = 'town';
      showMessage('You follow the road toward town.', 1800);
    } else if (type === 'town_return_sign') {
      playInteractionSound(true);
      teleportPlayer(
        FARM_GATE_RETURN_POSITION.x,
        FARM_GATE_RETURN_POSITION.y,
        FARM_GATE_RETURN_POSITION.z,
        Math.PI / 2
      );
      game.isInsideHouse = false;
      game.currentRegion = 'farm';
      showMessage('Back at the farm gate.', 1600);
    } else if (type === 'vendor_door_outside') {
      playInteractionSound(true);
      const vendorId = currentInteractable.userData.vendorId;
      const vendorData = getVendorTeleportData(vendorId);
      if (!vendorData) return;
      teleportPlayer(
        vendorData.insidePosition.x,
        vendorData.insidePosition.y,
        vendorData.insidePosition.z,
        vendorData.insideYaw
      );
      game.isInsideHouse = true;
      game.currentRegion = 'town';
      showMessage(`Entered ${vendorData.name}.`, 1500);
    } else if (type === 'vendor_door_inside') {
      playInteractionSound(true);
      const vendorId = currentInteractable.userData.vendorId;
      const vendorData = getVendorTeleportData(vendorId);
      if (!vendorData) return;
      teleportPlayer(
        vendorData.outsidePosition.x,
        vendorData.outsidePosition.y,
        vendorData.outsidePosition.z,
        vendorData.outsideYaw
      );
      game.isInsideHouse = false;
      game.currentRegion = 'town';
      showMessage(`Back outside ${vendorData.name}.`, 1400);
    } else if (type === 'animal') {
      const animalId = currentInteractable.userData.animalId;
      const result = handleAnimalInteract(animalId, game);
      if (result.success) {
        playInteractionSound(true);
        showMessage(`Collected ${result.productName}!`, 1600);
        updateInventoryUI();
        updateHUD();
        scheduleAutosave('animal_collect');
      } else if (result && result.reason === 'cooldown') {
        playInteractionSound(false);
        const wait = result.remainingDays || 1;
        showMessage(
          `${result.name || 'Animal'} needs ${wait} more day(s).`,
          1400
        );
      } else {
        playInteractionSound(false);
        showMessage('Animal is resting.', 1000);
      }
    } else if (type === 'decoration') {
      const decorationId = currentInteractable.userData.decorationId;
      const result = handleDecorationPickup(decorationId, game);
      if (result.success) {
        playInteractionSound(true);
        showMessage(`Picked up ${result.name}.`, 1400);
        updateInventoryUI();
        updateHUD();
        scheduleAutosave('pickup_decoration');
      } else {
        playInteractionSound(false);
        showMessage('Decoration not available.', 1000);
      }
    } else {
      playInteractionSound(false);
      showMessage('Nothing special here.', 1000);
    }
    return;
  }

  // 4) Nothing at all
  console.log('Clicked, but no tile or interactable under crosshair.');
  playInteractionSound(false);
  showMessage('Nothing to interact with.');
}

export function getCurrentHit() {
  return currentHit;
}

export function tryRotateDecoration() {
  if (!currentInteractable) return false;
  if (currentInteractable.userData.type !== 'decoration') return false;

  const decorationId = currentInteractable.userData.decorationId;
  if (!decorationId) return false;

  const rotated = rotateDecoration(decorationId);
  if (rotated) {
    const name = currentInteractable.userData.decorationName || 'Decoration';
    showMessage(`Rotated ${name}.`, 800);
    playInteractionSound(true);
  }
  return rotated;
}












