export const interactables = [];

export function registerInteractable(mesh, data = {}) {
  mesh.userData.interactable = true;
  Object.assign(mesh.userData, data);
  interactables.push(mesh);
}
