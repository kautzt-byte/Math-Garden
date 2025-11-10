import { THREE } from '../core/three.js';
import { addStaticBoxCollider } from './collisions.js';
import { registerInteractable } from './interactables.js';

export function createMarket(scene) {
  const group = new THREE.Group();

  // Counter table
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.5, 1.5),
    new THREE.MeshLambertMaterial({ color: 0xffb347 })
  );
  counter.position.set(-10, 0.75, -6);
  counter.userData.baseColor = 0xffb347;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.3, 2),
    new THREE.MeshLambertMaterial({ color: 0xd2691e })
  );
  roof.position.set(-10, 2.2, -6);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Front posts
  const postGeo = new THREE.BoxGeometry(0.15, 2, 0.15);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

  const p1 = new THREE.Mesh(postGeo, postMat);
  p1.position.set(-8, 1, -5);
  p1.castShadow = true;
  p1.receiveShadow = true;
  group.add(p1);

  const p2 = p1.clone();
  p2.position.set(-12, 1, -5);
  group.add(p2);

  scene.add(group);

  // Collider for the market stall
  addStaticBoxCollider(group, 0.2, { interior: false });

  registerInteractable(counter, {
    type: 'market',
    baseColor: 0xffb347,
  });
}
