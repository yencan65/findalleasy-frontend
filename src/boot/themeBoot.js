// src/boot/themeBoot.js
// Theme selection moved out of index.html (CSP-friendly; no inline JS).
export function themeBoot() {
  function applyTheme() {
    const h = new Date().getHours();
    let theme = "day";
    if (h >= 20 || h < 6) theme = "night";
    else if (h >= 17) theme = "evening";
    document.documentElement.setAttribute("data-fae-theme", theme);
  }

  applyTheme();
  setInterval(applyTheme, 10 * 60 * 1000);
}
