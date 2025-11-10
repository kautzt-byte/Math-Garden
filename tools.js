let currentTool = 'none'; // 'none' | 'hoe' | 'shovel' | 'rake'

export function setCurrentTool(id) {
  if (!['none', 'hoe', 'shovel', 'rake'].includes(id)) {
    id = 'none';
  }
  currentTool = id;
  console.log('Tool set to:', currentTool);
}

export function getCurrentTool() {
  return currentTool;
}

export function getCurrentToolLabel() {
  switch (currentTool) {
    case 'hoe':
      return 'Hoe (Dirt)';
    case 'shovel':
      return 'Shovel (Path)';
    case 'rake':
      return 'Rake (Grass)';
    default:
      return 'None';
  }
}
