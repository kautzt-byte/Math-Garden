import { THREE } from '../core/three.js';
import { addStaticBoxCollider } from './collisions.js';
import { registerInteractable } from './interactables.js';

export function createHouse(scene) {
  const group = new THREE.Group();

  // Main body of the house
  const bodyWidth = 5;
  const bodyHeight = 3;
  const bodyDepth = 5;

  const houseCenterX = 0;
  const houseCenterZ = -12;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
    new THREE.MeshLambertMaterial({ color: 0xffe4a3 }) // warm beige
  );
  body.position.set(houseCenterX, bodyHeight / 2, houseCenterZ);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof: square pyramid (Cone with 4 segments)
  const roofHeight = 2.5;
  const roofRadius = 4.2;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(roofRadius, roofHeight, 4),
    new THREE.MeshLambertMaterial({ color: 0xb03030 }) // red roof
  );

  const roofY =
    body.position.y + bodyHeight / 2 + roofHeight / 2;

  roof.position.set(houseCenterX, roofY, houseCenterZ);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // OUTSIDE DOOR (on the front of the house)
  const doorWidth = 1.2;
  const doorHeight = 1.8;

  const outsideDoor = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, 0.2),
    new THREE.MeshLambertMaterial({
      color: 0x654321,
      side: THREE.DoubleSide,
    })
  );

  const frontZ = houseCenterZ + bodyDepth / 2;

  outsideDoor.position.set(houseCenterX, doorHeight / 2, frontZ + 0.01);
  outsideDoor.userData.baseColor = 0x654321;
  outsideDoor.castShadow = true;
  outsideDoor.receiveShadow = true;
  group.add(outsideDoor);

  registerInteractable(outsideDoor, {
    type: 'door_outside',
    baseColor: 0x654321,
  });

  scene.add(group);

  // OUTSIDE collider
  addStaticBoxCollider(body, 0.2, { interior: false });

  // Create the interior room
  createHouseInterior(scene, houseCenterX, houseCenterZ);
}

function createHouseInterior(scene, centerX, centerZ) {
  const group = new THREE.Group();

  const roomWidth = 4.4;
  const roomDepth = 4.4;
  const roomHeight = 2.6;
  const wallThickness = 0.2;

  const roomCenterX = centerX;
  const roomCenterZ = centerZ;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshLambertMaterial({ color: 0xd2b48c })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(roomCenterX, 0.05, roomCenterZ);
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(roomCenterX, roomHeight, roomCenterZ);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0xfff2dc });

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
    wallMat
  );
  backWall.position.set(
    roomCenterX,
    roomHeight / 2,
    roomCenterZ - roomDepth / 2
  );
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);
  addStaticBoxCollider(backWall, 0.18, { interior: true });

  // Front wall
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness),
    wallMat
  );
  frontWall.position.set(
    roomCenterX,
    roomHeight / 2,
    roomCenterZ + roomDepth / 2
  );
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);
  addStaticBoxCollider(frontWall, 0.18, { interior: true });

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
    wallMat
  );
  leftWall.position.set(
    roomCenterX - roomWidth / 2,
    roomHeight / 2,
    roomCenterZ
  );
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);
  addStaticBoxCollider(leftWall, 0.18, { interior: true });

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth),
    wallMat
  );
  rightWall.position.set(
    roomCenterX + roomWidth / 2,
    roomHeight / 2,
    roomCenterZ
  );
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);
  addStaticBoxCollider(rightWall, 0.18, { interior: true });

  // Inside door
  const doorWidth = 1.2;
  const doorHeight = 1.8;

  const insideDoor = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, 0.2),
    new THREE.MeshLambertMaterial({
      color: 0x654321,
      side: THREE.DoubleSide,
    })
  );

  const doorwallThickness = 0.2;
  const innerFaceZ = roomCenterZ + roomDepth / 2 - wallThickness / 2;
  const doorZ = innerFaceZ - 0.01;

  insideDoor.position.set(roomCenterX, doorHeight / 2, doorZ);
  insideDoor.userData.baseColor = 0x654321;
  insideDoor.castShadow = true;
  insideDoor.receiveShadow = true;
  group.add(insideDoor);

  registerInteractable(insideDoor, {
    type: 'door_inside',
    baseColor: 0x654321,
  });

  addStaticBoxCollider(insideDoor, 0.12, { interior: true });

  // Bed
  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.5, 1.2),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  bed.position.set(roomCenterX - 1.1, 0.25, roomCenterZ - 1.1);
  bed.userData.baseColor = 0xffffff;
  bed.castShadow = true;
  bed.receiveShadow = true;
  group.add(bed);

  registerInteractable(bed, {
    type: 'bed',
    baseColor: 0xffffff,
  });

  scene.add(group);
}
