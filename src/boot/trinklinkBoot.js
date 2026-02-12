// src/boot/trinklinkBoot.js
// ReklamAction TrinkLink loader (optional)
// Set VITE_TRINKLINK_SRC to the script URL from TrinkLink panel.

export function trinklinkBoot() {
  try {
    const src = import.meta?.env?.VITE_TRINKLINK_SRC;
    if (!src) return;

    // Avoid double-inject
    if (document.querySelector('script[data-fae-trinklink="1"]')) return;

    const s = document.createElement("script");
    s.src = String(src);
    s.async = true;
    s.defer = true;
    s.setAttribute("data-fae-trinklink", "1");
    document.body.appendChild(s);
  } catch {
    // noop
  }
}
