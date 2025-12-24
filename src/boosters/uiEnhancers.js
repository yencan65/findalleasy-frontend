// src/boosters/uiEnhancers.js
// Mevcut DOM'a dokunmadan davranış ekler

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export function initSonoAIBubble() {
  const bubble = $('#sono-ai-bubble');
  const panel  = $('#sono-ai-panel');

  if (!bubble || !panel) return;

  // dışarı tıkla → kapat
  document.addEventListener('mousedown', (e) => {
    if (!panel.classList.contains('open')) return;
    if (!panel.contains(e.target) && !bubble.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  // jest/mimik (hover + typing simülasyonu)
  bubble.addEventListener('mouseenter', () => bubble.classList.add('ai-awake'));
  bubble.addEventListener('mouseleave', () => bubble.classList.remove('ai-awake'));
}

export function wireSearchToShowcase() {
  const input  = $('#search-input');
  const button = $('#search-button');
  if (!input || !button) return;

  const fire = async () => {
    const q = input.value?.trim();
    if (!q) return;
    window.dispatchEvent(new CustomEvent('ai:search', { detail: { q }}));
  };

  button.addEventListener('click', fire);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') fire(); });

  // Sono AI önerileri → vitrine
  window.addEventListener('ai:suggest', (e) => {
    const data = e.detail?.cards || [];
    window.dispatchEvent(new CustomEvent('vitrin:update', { detail: { cards: data }}));
  });
}

export function initLanguageScroller() {
  // Mevcut dil butonunuzun içine müdahale etmeden altına kaydırılabilir mini panel ekler
  const host = document.querySelector('[data-lang-host]');
  if (!host || host.dataset.enhanced) return;
  host.dataset.enhanced = '1';

  const panel = document.createElement('div');
  panel.setAttribute('id','lang-scroll-panel');
  panel.className = 'fixed top-14 right-4 z-[9999] hidden';
  panel.innerHTML = `
    <div class="max-h-60 w-40 overflow-y-auto rounded-md border border-[#d4af37]/40 bg-black/80 backdrop-blur-md">
      ${[
        {code:'TR', flag:'tr', lab:'T'}, {code:'EN', flag:'gb', lab:'E'}, {code:'DE', flag:'de', lab:'D'},
        {code:'FR', flag:'fr', lab:'F'}, {code:'ES', flag:'es', lab:'S'}, {code:'AR', flag:'sa', lab:'A'}
      ].map(x=>`
        <button data-lang="${x.code}" class="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/5">
          <span class="text-[12px]">${x.lab}</span>
          <img src="/flags/${x.flag}.svg" class="w-4 h-4" />
          <span class="uppercase ml-auto opacity-80">${x.code}</span>
        </button>
      `).join('')}
    </div>`;
  document.body.appendChild(panel);

  // Sağ üstteki mevcut dil butonuna veri-özelliği ekliyiz (HTML’de zaten var) → sadece click dinleriz
  host.addEventListener('click', () => panel.classList.toggle('hidden'));

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    const code = btn.dataset.lang.toLowerCase();
    localStorage.setItem('lang', code);
    window.dispatchEvent(new CustomEvent('i18n:change', { detail: { code }}));
    panel.classList.add('hidden');
  });

  // Kaçış/dışarı tıkla
  document.addEventListener('mousedown', (e) => {
    if (!panel.contains(e.target) && !host.contains(e.target)) panel.classList.add('hidden');
  });
}

export function initVitrinReactivity() {
  // Vitrin kartlarını güncelle (mevcut grid’e dokunmadan)
  const render = (cards=[]) => {
    const evt = new CustomEvent('vitrin:render-request', { detail: { cards }});
    window.dispatchEvent(evt);
  };

  // Enter/Arama veya AI sonuçları → vitrin güncelle
  window.addEventListener('vitrin:update', (e)=> render(e.detail?.cards||[]));
}

// Hepsini tek tuş
export function bootUIEnhancers(){
  initSonoAIBubble();
  wireSearchToShowcase();
  initLanguageScroller();
  initVitrinReactivity();
}
