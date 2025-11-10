import { THREE } from '../core/three.js';

export const plots = [];

const STATE_COLORS = {
  empty:   0x8b4513, // brown soil
  planted: 0x704020, // darker soil
  growing: 0x228b22, // green sprout
  ready:   0x32cd32  // bright green
};

export function createPlots(scene) {
  const size = 1;
  const spacing = 1.3;

  const rows = 2;
  const cols = 3;
  const startX = -(cols - 1) * spacing / 2;
  const startZ = 2.5; // a little in front of the player

  let index = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Slightly taller block so it's easy to hit with the ray
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.4, size),
        new THREE.MeshLambertMaterial({ color: STATE_COLORS.empty })
      );

      mesh.position.set(
        startX + col * spacing,
        0.2, // half height
        startZ + row * spacing
      );

      mesh.userData.plotIndex = index;
      mesh.userData.baseColor = STATE_COLORS.empty;

      scene.add(mesh);

      const plot = {
        mesh,
        state: 'empty',
        plantedDay: null
      };

      plots.push(plot);

      index++;
    }
  }
}

// Change a plot's state and update its color
export function setPlotState(plot, state) {
  plot.state = state;
  const color = STATE_COLORS[state];
  plot.mesh.material.color.set(color);
  plot.mesh.userData.baseColor = color;
}

// Get a plot by index (from raycast)
export function getPlotByIndex(index) {
  return plots[index];
}

// Advance all crops when a new day starts
export function advanceCropsForNewDay(currentDay) {
  plots.forEach((plot) => {
    if (plot.state === 'planted' || plot.state === 'growing') {
      if (plot.plantedDay == null) return;

      const daysSincePlant = currentDay - plot.plantedDay;

      // Example growth curve:
      // day of planting: 'planted'
      // next day: 'growing'
      // day after that (2+ days since plant): 'ready'
      if (daysSincePlant >= 2 && plot.state !== 'ready') {
        setPlotState(plot, 'ready');
      } else if (daysSincePlant >= 1 && plot.state === 'planted') {
        setPlotState(plot, 'growing');
      }
    }
  });
}

