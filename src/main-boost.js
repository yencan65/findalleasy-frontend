// src/main-boost.js
import { bootUIEnhancers } from './boosters/uiEnhancers.js';

document.addEventListener('DOMContentLoaded', () => {
  // i18n değişikliği (mevcut i18n hook'unuza ateşler)
  window.addEventListener('i18n:change', (e)=>{
    const code = e.detail?.code;
    if (!code) return;
    if (window.__i18n?.changeLanguage) window.__i18n.changeLanguage(code);
  });

  bootUIEnhancers();
});
