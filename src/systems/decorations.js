import { THREE } from '../core/three.js';
import { scene } from '../core/main.js';
import { registerInteractable } from '../world/interactables.js';

export const DECORATION_TYPES = {
  medium_rock: {
    id: 'medium_rock',
    displayName: 'Medium Rock',
    tokenId: 'decor_rock',
    tokenLabel: 'Medium Rock Token',
    tokenPrice: 100,
    variant: 'mediumRock',
  },
  small_rock: {
    id: 'small_rock',
    displayName: 'Small Rock',
    tokenId: 'decor_small_rock',
    tokenLabel: 'Small Rock Token',
    tokenPrice: 100,
    variant: 'smallRock',
  },
  large_rock_cluster: {
    id: 'large_rock_cluster',
    displayName: 'Large Rock Cluster',
    tokenId: 'decor_large_rock_cluster',
    tokenLabel: 'Rock Cluster Token',
    tokenPrice: 100,
    variant: 'rockCluster',
  },
  bush: {
    id: 'bush',
    displayName: 'Bush',
    tokenId: 'decor_bush',
    tokenLabel: 'Bush Token',
    tokenPrice: 100,
    variant: 'bush',
  },
  flower_patch: {
    id: 'flower_patch',
    displayName: 'Flower Patch (Mixed Colors)',
    tokenId: 'decor_flower_patch',
    tokenLabel: 'Flower Patch Token',
    tokenPrice: 100,
    variant: 'flowerPatch',
  },
  tree_stump: {
    id: 'tree_stump',
    displayName: 'Tree Stump',
    tokenId: 'decor_tree_stump',
    tokenLabel: 'Tree Stump Token',
    tokenPrice: 100,
    variant: 'treeStump',
  },
  small_tree: {
    id: 'small_tree',
    displayName: 'Small Tree',
    tokenId: 'decor_small_tree',
    tokenLabel: 'Small Tree Token',
    tokenPrice: 100,
    variant: 'smallTree',
  },
  planter_box: {
    id: 'planter_box',
    displayName: 'Wooden Planter Box',
    tokenId: 'decor_planter_box',
    tokenLabel: 'Planter Box Token',
    tokenPrice: 100,
    variant: 'planterBox',
  },
  fence_segment: {
    id: 'fence_segment',
    displayName: 'Fence Segment',
    tokenId: 'decor_fence_segment',
    tokenLabel: 'Fence Segment Token',
    tokenPrice: 100,
    variant: 'fenceSegment',
  },
  scarecrow: {
    id: 'scarecrow',
    displayName: 'Scarecrow',
    tokenId: 'decor_scarecrow',
    tokenLabel: 'Scarecrow Token',
    tokenPrice: 100,
    variant: 'scarecrow',
  },
  hay_bale_stack: {
    id: 'hay_bale_stack',
    displayName: 'Hay Bale Stack',
    tokenId: 'decor_hay_bale_stack',
    tokenLabel: 'Hay Bale Token',
    tokenPrice: 100,
    variant: 'hayBale',
  },
  wooden_bench: {
    id: 'wooden_bench',
    displayName: 'Wooden Bench',
    tokenId: 'decor_wooden_bench',
    tokenLabel: 'Bench Token',
    tokenPrice: 100,
    variant: 'bench',
  },
  wooden_table: {
    id: 'wooden_table',
    displayName: 'Wooden Table',
    tokenId: 'decor_wooden_table',
    tokenLabel: 'Table Token',
    tokenPrice: 100,
    variant: 'table',
  },
  stool: {
    id: 'stool',
    displayName: 'Stool',
    tokenId: 'decor_stool',
    tokenLabel: 'Stool Token',
    tokenPrice: 100,
    variant: 'stool',
  },
  crate: {
    id: 'crate',
    displayName: 'Crate',
    tokenId: 'decor_crate',
    tokenLabel: 'Crate Token',
    tokenPrice: 100,
    variant: 'crate',
  },
  barrel: {
    id: 'barrel',
    displayName: 'Barrel',
    tokenId: 'decor_barrel',
    tokenLabel: 'Barrel Token',
    tokenPrice: 100,
    variant: 'barrel',
  },
  lantern_post: {
    id: 'lantern_post',
    displayName: 'Lantern Post',
    tokenId: 'decor_lantern_post',
    tokenLabel: 'Lantern Post Token',
    tokenPrice: 100,
    variant: 'lanternPost',
  },
  mailbox: {
    id: 'mailbox',
    displayName: 'Mailbox',
    tokenId: 'decor_mailbox',
    tokenLabel: 'Mailbox Token',
    tokenPrice: 100,
    variant: 'mailbox',
  },
  signboard: {
    id: 'signboard',
    displayName: 'Signboard',
    tokenId: 'decor_signboard',
    tokenLabel: 'Signboard Token',
    tokenPrice: 100,
    variant: 'signboard',
  },
  wheelbarrow: {
    id: 'wheelbarrow',
    displayName: 'Wheelbarrow',
    tokenId: 'decor_wheelbarrow',
    tokenLabel: 'Wheelbarrow Token',
    tokenPrice: 100,
    variant: 'wheelbarrow',
  },
  wood_pile: {
    id: 'wood_pile',
    displayName: 'Wood Pile',
    tokenId: 'decor_wood_pile',
    tokenLabel: 'Wood Pile Token',
    tokenPrice: 100,
    variant: 'woodPile',
  },
  campfire: {
    id: 'campfire',
    displayName: 'Campfire',
    tokenId: 'decor_campfire',
    tokenLabel: 'Campfire Token',
    tokenPrice: 100,
    variant: 'campfire',
  },
  torch_post: {
    id: 'torch_post',
    displayName: 'Torch Post',
    tokenId: 'decor_torch_post',
    tokenLabel: 'Torch Post Token',
    tokenPrice: 100,
    variant: 'torchPost',
  },
  stone_lamp: {
    id: 'stone_lamp',
    displayName: 'Stone Lamp',
    tokenId: 'decor_stone_lamp',
    tokenLabel: 'Stone Lamp Token',
    tokenPrice: 100,
    variant: 'stoneLamp',
  },
  lantern_stand: {
    id: 'lantern_stand',
    displayName: 'Lantern Stand',
    tokenId: 'decor_lantern_stand',
    tokenLabel: 'Lantern Stand Token',
    tokenPrice: 100,
    variant: 'lanternStand',
  },
  fire_pit: {
    id: 'fire_pit',
    displayName: 'Fire Pit',
    tokenId: 'decor_fire_pit',
    tokenLabel: 'Fire Pit Token',
    tokenPrice: 100,
    variant: 'firePit',
  },
  small_shed: {
    id: 'small_shed',
    displayName: 'Small Shed (Decor Only)',
    tokenId: 'decor_small_shed',
    tokenLabel: 'Small Shed Token',
    tokenPrice: 100,
    variant: 'shed',
  },
  windmill: {
    id: 'windmill',
    displayName: 'Windmill',
    tokenId: 'decor_windmill',
    tokenLabel: 'Windmill Token',
    tokenPrice: 100,
    variant: 'windmill',
  },
  wooden_archway: {
    id: 'wooden_archway',
    displayName: 'Wooden Archway',
    tokenId: 'decor_wooden_archway',
    tokenLabel: 'Archway Token',
    tokenPrice: 100,
    variant: 'archway',
  },
  well: {
    id: 'well',
    displayName: 'Well',
    tokenId: 'decor_well',
    tokenLabel: 'Well Token',
    tokenPrice: 100,
    variant: 'well',
  },
  stone_path_tile: {
    id: 'stone_path_tile',
    displayName: 'Stone Path Tile',
    tokenId: 'decor_stone_path_tile',
    tokenLabel: 'Stone Path Token',
    tokenPrice: 100,
    variant: 'stonePath',
  },
};

const decorations = [];
let nextDecorationId = 1;

export function getDecorationSelectionEntries(inv = {}) {
  const entries = [];
  for (const type of Object.values(DECORATION_TYPES)) {
    if ((inv[type.tokenId] || 0) > 0) {
      entries.push({ kind: 'decoration', id: type.id });
    }
  }
  return entries;
}

export function getDecorationSelectionLabel(typeId) {
  const type = DECORATION_TYPES[typeId];
  if (!type) return 'Decoration';
  return type.tokenLabel || `${type.displayName} Token`;
}

export function placeDecoration(typeId, tile, game) {
  const type = DECORATION_TYPES[typeId];
  if (!type) {
    return { success: false, reason: 'unknown_type' };
  }
  if (!tile || !tile.mesh || !tile.mesh.position) {
    return { success: false, reason: 'invalid_tile' };
  }

  const invKey = type.tokenId;
  const count = game.inventory[invKey] || 0;
  if (count <= 0) {
    return { success: false, reason: 'no_tokens', name: type.displayName };
  }

  const worldPos = tile.mesh.position.clone();
  worldPos.y = 0;

  const decorationId = `deco_${type.id}_${nextDecorationId++}`;
  const mesh = createDecorationMesh(type);
  mesh.position.set(worldPos.x, 0, worldPos.z);

  registerDecorationInteractables(mesh, type, decorationId);
  scene.add(mesh);

  decorations.push({
    id: decorationId,
    mesh,
    typeId: type.id,
  });
  syncNextDecorationIdFrom(decorationId);

  game.inventory[invKey] = count - 1;

  return { success: true, name: type.displayName };
}

export function handleDecorationPickup(decorationId, game) {
  const index = decorations.findIndex((entry) => entry.id === decorationId);
  if (index === -1) {
    return { success: false, reason: 'missing' };
  }

  const entry = decorations[index];
  const type = DECORATION_TYPES[entry.typeId];
  if (!type) {
    return { success: false, reason: 'missing_type' };
  }

  if (entry.mesh && entry.mesh.parent) {
    entry.mesh.parent.remove(entry.mesh);
  }
  if (entry.mesh) {
    entry.mesh.visible = false;
    entry.mesh.userData.interactable = false;
  }

  decorations.splice(index, 1);

  const invKey = type.tokenId;
  game.inventory[invKey] = (game.inventory[invKey] || 0) + 1;

  return { success: true, name: type.displayName };
}

export function rotateDecoration(decorationId) {
  const entry = decorations.find((decor) => decor.id === decorationId);
  if (!entry || !entry.mesh) return false;
  entry.mesh.rotation.y += Math.PI / 2;
  return true;
}

export function getDecorationVendorListings() {
  return Object.values(DECORATION_TYPES).map((type) => ({
    typeId: type.id,
    tokenId: type.tokenId,
    tokenName: type.tokenLabel,
    tokenPrice: type.tokenPrice,
  }));
}

export function serializeDecorations() {
  return decorations.map((entry) => ({
    id: entry.id,
    typeId: entry.typeId,
    position: {
      x: entry.mesh.position.x,
      y: entry.mesh.position.y,
      z: entry.mesh.position.z,
    },
    rotationY: entry.mesh.rotation.y,
  }));
}

export function hydrateDecorations(data = []) {
  clearDecorations();
  data.forEach((item) => {
    const type = DECORATION_TYPES[item.typeId];
    if (!type || !item.position) return;
    const id = item.id || `deco_${type.id}_${nextDecorationId++}`;
    const mesh = createDecorationMesh(type);
    mesh.position.set(
      item.position.x ?? 0,
      item.position.y ?? 0,
      item.position.z ?? 0
    );
    if (typeof item.rotationY === 'number') {
      mesh.rotation.y = item.rotationY;
    }
    registerDecorationInteractables(mesh, type, id);
    scene.add(mesh);
    decorations.push({
      id,
      typeId: type.id,
      mesh,
    });
    syncNextDecorationIdFrom(id);
  });
}

function clearDecorations() {
  decorations.forEach((entry) => {
    if (entry.mesh && entry.mesh.parent) {
      entry.mesh.parent.remove(entry.mesh);
    }
  });
  decorations.length = 0;
  nextDecorationId = 1;
}

function createDecorationMesh(type) {
  const builders = {
    mediumRock: () => buildRock(type, 0.6, 0x8c8c8c),
    smallRock: () => buildRock(type, 0.4, 0x777777),
    rockCluster: () => buildRockCluster(),
    bush: () => buildBush(),
    flowerPatch: () => buildFlowerPatch(),
    treeStump: () => buildTreeStump(),
    smallTree: () => buildSmallTree(),
    planterBox: () => buildPlanterBox(),
    fenceSegment: () => buildFenceSegment(),
    scarecrow: () => buildScarecrow(),
    hayBale: () => buildHayBaleStack(),
    bench: () => buildBench(),
    table: () => buildTable(),
    stool: () => buildStool(),
    crate: () => buildCrate(),
    barrel: () => buildBarrel(),
    lanternPost: () => buildLanternPost(),
    mailbox: () => buildMailbox(),
    signboard: () => buildSignboard(),
    wheelbarrow: () => buildWheelbarrow(),
    woodPile: () => buildWoodPile(),
    campfire: () => buildCampfire(),
    torchPost: () => buildTorchPost(),
    stoneLamp: () => buildStoneLamp(),
    lanternStand: () => buildLanternStand(),
    firePit: () => buildFirePit(),
    shed: () => buildSmallShed(),
    windmill: () => buildWindmill(),
    archway: () => buildArchway(),
    well: () => buildWell(),
    stonePath: () => buildStonePath(),
  };

  const builder = builders[type.variant] || builders.mediumRock;
  const mesh = builder();
  alignToGround(mesh);
  return mesh;
}

function alignToGround(mesh) {
  const bbox = new THREE.Box3().setFromObject(mesh);
  const minY = bbox.min.y;
  if (!isFinite(minY)) return;
  mesh.position.y -= minY;
}

function registerDecorationInteractables(root, type, decorationId) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const baseColor =
      child.material && child.material.color
        ? child.material.color.getHex()
        : type.defaultColor || 0xffffff;
    registerInteractable(child, {
      type: 'decoration',
      decorationId,
      decorationName: type.displayName,
      baseColor,
    });
  });
}

function syncNextDecorationIdFrom(id) {
  const match = /_(\d+)$/.exec(id);
  if (!match) return;
  const num = parseInt(match[1], 10);
  if (!Number.isNaN(num) && num >= nextDecorationId) {
    nextDecorationId = num + 1;
  }
}

function buildRock(type, radius, color) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const material = new THREE.MeshLambertMaterial({
    color: color || 0x8c8c8c,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = radius * 0.6;
  return mesh;
}

function buildRockCluster() {
  const group = new THREE.Group();
  const colors = [0x8c8c8c, 0x7b7b7b, 0x999999];
  const scales = [0.5, 0.35, 0.3];
  const offsets = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.35, 0, -0.15),
    new THREE.Vector3(-0.3, 0, 0.2),
  ];
  for (let i = 0; i < 3; i++) {
    const rock = buildRock({}, scales[i], colors[i]);
    rock.position.add(offsets[i]);
    group.add(rock);
  }
  return group;
}

function buildBush() {
  const group = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({ color: 0x4c8f3a });
  const main = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 12),
    material
  );
  main.position.y = 0.35;
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  const side = main.clone();
  side.scale.set(0.8, 0.8, 0.8);
  side.position.set(0.25, 0.28, 0);
  group.add(side);

  const side2 = main.clone();
  side2.scale.set(0.7, 0.7, 0.7);
  side2.position.set(-0.2, 0.26, -0.2);
  group.add(side2);
  return group;
}

function buildFlowerPatch() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12),
    new THREE.MeshLambertMaterial({ color: 0x5a7f32 })
  );
  base.receiveShadow = true;
  base.position.y = 0.02;
  group.add(base);

  const colors = [0xff8bb3, 0xffd85a, 0x88d8ff, 0xffffff];
  for (let i = 0; i < 6; i++) {
    const flower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6),
      new THREE.MeshLambertMaterial({ color: 0x4d8d35 })
    );
    flower.position.set(
      (Math.random() - 0.5) * 0.6,
      0.08,
      (Math.random() - 0.5) * 0.6
    );
    group.add(flower);

    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshLambertMaterial({
        color: colors[i % colors.length],
      })
    );
    bloom.position.copy(flower.position);
    bloom.position.y += 0.12;
    group.add(bloom);
  }
  return group;
}

function buildTreeStump() {
  const group = new THREE.Group();
  const bark = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const top = new THREE.MeshLambertMaterial({ color: 0xc89b6c });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.4, 10),
    bark
  );
  trunk.position.y = 0.2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const rings = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.05, 10),
    top
  );
  rings.position.y = 0.42;
  group.add(rings);

  return group;
}

function buildSmallTree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  trunk.position.y = 0.4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.9, 12),
    new THREE.MeshLambertMaterial({ color: 0x3f7f3b })
  );
  foliage.position.y = 1.1;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  group.add(foliage);

  return group;
}

function buildPlanterBox() {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.3, 0.5),
    new THREE.MeshLambertMaterial({ color: 0x9c6b3c })
  );
  box.position.y = 0.15;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.12, 0.42),
    new THREE.MeshLambertMaterial({ color: 0x4c2f1f })
  );
  soil.position.y = 0.28;
  group.add(soil);

  for (let i = 0; i < 4; i++) {
    const sprout = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x5dac4a })
    );
    sprout.position.set(-0.3 + i * 0.2, 0.4, (i % 2 === 0 ? 0.1 : -0.1));
    group.add(sprout);
  }
  return group;
}

function buildFenceSegment() {
  const group = new THREE.Group();
  const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  for (let i = -1; i <= 1; i++) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6),
      postMaterial
    );
    post.position.set(i * 0.4, 0.4, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }

  const railMaterial = new THREE.MeshLambertMaterial({ color: 0xb67d47 });
  for (let j = 0; j < 2; j++) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.08, 0.12),
      railMaterial
    );
    rail.position.set(0, 0.55 - j * 0.25, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
  }

  return group;
}

function buildScarecrow() {
  const group = new THREE.Group();
  const postMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf4c973 });
  const hatMat = new THREE.MeshLambertMaterial({ color: 0x3f2a20 });

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6),
    postMat
  );
  post.position.y = 0.7;
  group.add(post);

  const arms = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.08),
    postMat
  );
  arms.position.y = 0.95;
  group.add(arms);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.2),
    bodyMat
  );
  body.position.y = 0.7;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 10),
    new THREE.MeshLambertMaterial({ color: 0xffe5c9 })
  );
  head.position.y = 1.1;
  group.add(head);

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.18, 8),
    hatMat
  );
  hat.position.y = 1.22;
  group.add(hat);

  return group;
}

function buildHayBaleStack() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xf4c851 });
  for (let i = 0; i < 3; i++) {
    const bale = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 0.35),
      mat
    );
    bale.position.set(i === 1 ? 0 : (i === 0 ? -0.35 : 0.35), 0.15 + (i === 2 ? 0.2 : 0), i === 2 ? 0 : (i === 1 ? 0.2 : -0.2));
    bale.castShadow = true;
    bale.receiveShadow = true;
    group.add(bale);
  }
  return group;
}

function buildBench() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x9a653b });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.35), wood);
  seat.position.y = 0.45;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.05), wood);
  back.position.set(0, 0.65, -0.15);
  group.add(back);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), wood);
    leg.position.set(i < 2 ? -0.4 : 0.4, 0.23, i % 2 === 0 ? 0.13 : -0.13);
    group.add(leg);
  }
  return group;
}

function buildTable() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x815029 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), wood);
  top.position.y = 0.5;
  group.add(top);

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), wood);
    leg.position.set(i < 2 ? -0.3 : 0.3, 0.25, i % 2 === 0 ? -0.3 : 0.3);
    group.add(leg);
  }
  return group;
}

function buildStool() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x9a6c3a });
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8), wood);
  seat.position.y = 0.45;
  group.add(seat);

  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), wood);
    const angle = (Math.PI * 2 * i) / 3;
    leg.position.set(Math.cos(angle) * 0.15, 0.2, Math.sin(angle) * 0.15);
    group.add(leg);
  }
  return group;
}

function buildCrate() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8c592d });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), wood);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  return group;
}

function buildBarrel() {
  const group = new THREE.Group();
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.6, 10),
    new THREE.MeshLambertMaterial({ color: 0x84502b })
  );
  barrel.position.y = 0.3;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  group.add(barrel);

  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.015, 6, 16),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  hoop.position.y = 0.4;
  hoop.rotation.x = Math.PI / 2;
  group.add(hoop);

  const hoop2 = hoop.clone();
  hoop2.position.y = 0.2;
  group.add(hoop2);

  return group;
}

function buildLanternPost() {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 1.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x3d2a18 })
  );
  post.position.y = 0.6;
  group.add(post);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.07, 0.07),
    post.material
  );
  arm.position.set(0.25, 1.05, 0);
  group.add(arm);

  const lantern = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.2, 6),
    new THREE.MeshLambertMaterial({ color: 0xffe28c })
  );
  lantern.position.set(0.45, 0.95, 0);
  lantern.castShadow = true;
  group.add(lantern);

  return group;
}

function buildMailbox() {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.9, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  post.position.y = 0.45;
  group.add(post);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.25),
    new THREE.MeshLambertMaterial({ color: 0xd33b3b })
  );
  box.position.set(0, 0.8, 0);
  group.add(box);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.15, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xfff060 })
  );
  flag.position.set(0.18, 0.85, 0);
  group.add(flag);

  return group;
}

function buildSignboard() {
  const group = new THREE.Group();
  const postMat = new THREE.MeshLambertMaterial({ color: 0x7b4e2a });
  for (let i = -1; i <= 1; i += 2) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8),
      postMat
    );
    post.position.set(i * 0.35, 0.45, 0);
    group.add(post);
  }
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.45, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xe2b97c })
  );
  board.position.y = 0.75;
  group.add(board);
  return group;
}

function buildWheelbarrow() {
  const group = new THREE.Group();
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.2, 0.35),
    new THREE.MeshLambertMaterial({ color: 0xc1522c })
  );
  tray.position.y = 0.35;
  tray.rotation.x = -0.1;
  group.add(tray);

  const handles = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.05, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x5a3920 })
  );
  handles.position.set(0.2, 0.4, -0.15);
  group.add(handles);

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 8, 16),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(-0.25, 0.2, 0);
  group.add(wheel);

  return group;
}

function buildWoodPile() {
  const group = new THREE.Group();
  const logMat = new THREE.MeshLambertMaterial({ color: 0x9c6b3c });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8),
      logMat
    );
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0.1 + (i % 2) * 0.12, -0.15 + (i >= 2 ? 0.15 : 0));
    group.add(log);
  }
  return group;
}

function buildCampfire() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12),
    new THREE.MeshLambertMaterial({ color: 0x4b3621 })
  );
  base.position.y = 0.02;
  group.add(base);

  const logMat = new THREE.MeshLambertMaterial({ color: 0x7a421f });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6),
      logMat
    );
    log.rotation.y = (Math.PI / 2) * i;
    log.position.y = 0.15;
    group.add(log);
  }

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.35, 8),
    new THREE.MeshLambertMaterial({ color: 0xffa23c })
  );
  flame.position.y = 0.4;
  group.add(flame);

  return group;
}

function buildTorchPost() {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8),
    new THREE.MeshLambertMaterial({ color: 0x6a3a1a })
  );
  post.position.y = 0.55;
  group.add(post);

  const bowl = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  bowl.position.y = 1.1;
  bowl.rotation.x = Math.PI;
  group.add(bowl);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xffc34a })
  );
  flame.position.y = 1.15;
  group.add(flame);

  return group;
}

function buildStoneLamp() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
  );
  base.position.y = 0.1;
  group.add(base);

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0x9b9b9b })
  );
  column.position.y = 0.55;
  group.add(column);

  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshLambertMaterial({ color: 0xfff6d0 })
  );
  light.position.y = 0.9;
  group.add(light);

  return group;
}

function buildLanternStand() {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1, 8),
    new THREE.MeshLambertMaterial({ color: 0x3c2b20 })
  );
  stand.position.y = 0.5;
  group.add(stand);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.02, 10, 16, Math.PI),
    stand.material
  );
  hook.position.y = 0.9;
  hook.rotation.z = Math.PI;
  group.add(hook);

  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.25, 0.18),
    new THREE.MeshLambertMaterial({ color: 0xf0d78a })
  );
  lantern.position.set(0, 0.7, 0.15);
  group.add(lantern);

  return group;
}

function buildFirePit() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 0.2, 12, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x6d6d6d })
  );
  ring.position.y = 0.1;
  ring.castShadow = true;
  group.add(ring);

  const coals = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12),
    new THREE.MeshLambertMaterial({ color: 0x2e1a1a })
  );
  coals.position.y = 0.05;
  group.add(coals);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.4, 8),
    new THREE.MeshLambertMaterial({ color: 0xff9c38 })
  );
  flame.position.y = 0.5;
  group.add(flame);

  return group;
}

function buildSmallShed() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 0.9),
    new THREE.MeshLambertMaterial({ color: 0xb85c39 })
  );
  body.position.y = 0.45;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 0.4, 4),
    new THREE.MeshLambertMaterial({ color: 0x4a2f1b })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.95;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.5, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x7a3f1d })
  );
  door.position.set(0, 0.3, 0.48);
  group.add(door);

  return group;
}

function buildWindmill() {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8),
    new THREE.MeshLambertMaterial({ color: 0xd8c2a3 })
  );
  tower.position.y = 0.6;
  group.add(tower);

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.25, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
  );
  cap.position.y = 1.25;
  group.add(cap);

  const bladesGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xf4f1e4 })
    );
    blade.position.x = 0.35;
    blade.rotation.z = Math.PI / 12;
    const holder = new THREE.Group();
    holder.rotation.z = (Math.PI / 2) * i;
    holder.add(blade);
    bladesGroup.add(holder);
  }
  bladesGroup.position.y = 1.1;
  bladesGroup.position.z = 0.35;
  group.add(bladesGroup);

  return group;
}

function buildArchway() {
  const group = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x7b4e2a });
  for (let i = -1; i <= 1; i += 2) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8),
      wood
    );
    pillar.position.set(i * 0.45, 0.7, 0);
    group.add(pillar);
  }

  const cross = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.12, 0.25),
    wood
  );
  cross.position.y = 1.3;
  group.add(cross);

  return group;
}

function buildWell() {
  const group = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 0.5, 12, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x7d7d7d })
  );
  wall.position.y = 0.25;
  group.add(wall);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12),
    new THREE.MeshLambertMaterial({ color: 0x3f6fd1 })
  );
  water.position.y = 0.05;
  group.add(water);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 0.4, 6),
    new THREE.MeshLambertMaterial({ color: 0x5f3620 })
  );
  roof.position.y = 1.1;
  group.add(roof);

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.08),
    roof.material
  );
  beam.position.y = 0.85;
  group.add(beam);

  return group;
}

function buildStonePath() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.05, 0.9),
    new THREE.MeshLambertMaterial({ color: 0x9d9d9d })
  );
  mesh.receiveShadow = true;
  mesh.position.y = 0.02;
  return mesh;
}
