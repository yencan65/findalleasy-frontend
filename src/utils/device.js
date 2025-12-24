export function getDeviceId() {
  let deviceId = localStorage.getItem("fae_device_id");

  if (!deviceId) {
    // Modern browser → randomUUID
    if (window.crypto && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      // Fallback — güçlü rastgele üretici
      deviceId = "dev-" + Math.random().toString(36).substring(2) + Date.now();
    }

    localStorage.setItem("fae_device_id", deviceId);
  }

  return deviceId;
}
