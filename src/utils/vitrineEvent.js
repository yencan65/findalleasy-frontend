// src/utils/vitrineEvent.js

export function triggerVitrineSearch(query) {
  if (!query || !query.trim()) return;
  window.dispatchEvent(new CustomEvent("vitrine-search", { detail: { query } }));
}
