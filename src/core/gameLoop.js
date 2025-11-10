import { THREE } from './three.js';
import { renderer, scene, camera } from './main.js';
import { handleMovement, updateLook } from './input.js';
import { updateHUD } from './ui.js';
import { updateRaycast } from './raycast.js';
import { updateNPCSystem } from '../systems/npcAI.js';

const clock = new THREE.Clock();

export function startGameLoop() {
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    handleMovement();
    updateLook();
    updateNPCSystem(delta);
    updateRaycast();      // dY`^ cast ray from camera each frame
    renderer.render(scene, camera);
    updateHUD();
  }
  animate();
}
