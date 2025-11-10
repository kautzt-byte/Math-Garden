const vendorTeleportMap = new Map();

export function setVendorTeleportData(vendorId, data) {
  vendorTeleportMap.set(vendorId, data);
}

export function getVendorTeleportData(vendorId) {
  return vendorTeleportMap.get(vendorId);
}
