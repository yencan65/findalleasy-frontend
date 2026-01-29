// src/utils/localVision.js
// Local (no-key) vision helper.
// We DO NOT ship heavy Transformers deps via npm (keeps npm ci fast/stable on Render/Pages).
// Instead we lazy-load a browser ESM build from CDN at runtime.
// If CDN import fails, caller should fall back to OCR/backend.

let _clip = null;
let _modPromise = null;

// Two CDNs for redundancy.
const TRANSFORMERS_CDNS = [
  // jsDelivr ESM wrapper
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm',
  // esm.sh ESM build
  'https://esm.sh/@xenova/transformers@2.17.2',
];

async function loadTransformersModule() {
  if (_modPromise) return _modPromise;
  _modPromise = (async () => {
    let lastErr = null;
    for (const url of TRANSFORMERS_CDNS) {
      try {
        // Prevent Vite from trying to pre-bundle a remote URL.
        const mod = await import(/* @vite-ignore */ url);
        // Best-effort config (doesn't crash if API changes)
        try {
          if (mod?.env) {
            mod.env.allowRemoteModels = true;
            mod.env.allowLocalModels = false;
            mod.env.useBrowserCache = true;
          }
        } catch {}
        return mod;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Failed to load transformers module');
  })();
  return _modPromise;
}

// A practical, e-commerce oriented label set (EN → we later map to TR-friendly queries).
const CANDIDATE_LABELS_EN = [
  'smartphone',
  'mobile phone',
  'laptop',
  'tablet',
  'desktop computer',
  'monitor',
  'keyboard',
  'mouse',
  'printer',
  'headphones',
  'earbuds',
  'speaker',
  'smartwatch',
  'camera',
  'television',
  'router',
  'power bank',

  'refrigerator',
  'washing machine',
  'dishwasher',
  'vacuum cleaner',
  'air conditioner',
  'heater',
  'microwave',
  'oven',
  'blender',
  'coffee machine',
  'kettle',
  'toaster',
  'iron',

  'shoes',
  'sneakers',
  'boots',
  'jacket',
  't-shirt',
  'jeans',
  'dress',
  'handbag',
  'backpack',
  'wallet',

  'perfume',
  'shampoo',
  'soap',
  'toothpaste',
  'diapers',

  'chocolate',
  'biscuits',
  'snack',
  'energy drink',
  'water',
  'cola',
];

// Mapping to search-friendly Turkish queries.
const EN2TR = {
  smartphone: 'telefon',
  'mobile phone': 'telefon',
  laptop: 'laptop',
  tablet: 'tablet',
  'desktop computer': 'masaüstü bilgisayar',
  monitor: 'monitör',
  keyboard: 'klavye',
  mouse: 'mouse',
  printer: 'yazıcı',
  headphones: 'kulaklık',
  earbuds: 'bluetooth kulaklık',
  speaker: 'hoparlör',
  smartwatch: 'akıllı saat',
  camera: 'kamera',
  television: 'televizyon',
  router: 'modem router',
  'power bank': 'powerbank',

  refrigerator: 'buzdolabı',
  'washing machine': 'çamaşır makinesi',
  dishwasher: 'bulaşık makinesi',
  'vacuum cleaner': 'elektrikli süpürge',
  'air conditioner': 'klima',
  heater: 'ısıtıcı',
  microwave: 'mikrodalga',
  oven: 'fırın',
  blender: 'blender',
  'coffee machine': 'kahve makinesi',
  kettle: 'su ısıtıcı kettle',
  toaster: 'tost makinesi',
  iron: 'ütü',

  shoes: 'ayakkabı',
  sneakers: 'spor ayakkabı',
  boots: 'bot',
  jacket: 'ceket',
  't-shirt': 'tişört',
  jeans: 'kot pantolon',
  dress: 'elbise',
  handbag: 'çanta',
  backpack: 'sırt çantası',
  wallet: 'cüzdan',

  perfume: 'parfüm',
  shampoo: 'şampuan',
  soap: 'sabun',
  toothpaste: 'diş macunu',
  diapers: 'bebek bezi',

  chocolate: 'çikolata',
  biscuits: 'bisküvi',
  snack: 'atıştırmalık',
  'energy drink': 'enerji içeceği',
  water: 'su',
  cola: 'kola',
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

async function fileToImageData(file, maxSide = 512) {
  const bmp = await createImageBitmap(file);
  const w = bmp.width;
  const h = bmp.height;

  const scale = clamp(maxSide / Math.max(w, h), 0.25, 1);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(tw, th)
      : Object.assign(document.createElement('canvas'), { width: tw, height: th });

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, tw, th);
  return ctx.getImageData(0, 0, tw, th);
}

async function getClip(progress_callback = null) {
  if (_clip) return _clip;
  const mod = await loadTransformersModule();
  if (!mod?.pipeline) throw new Error('transformers pipeline export not found');

  _clip = await mod.pipeline(
    'zero-shot-image-classification',
    'Xenova/clip-vit-base-patch32',
    { progress_callback }
  );
  return _clip;
}

/**
 * Analyze an image file locally and return a conservative query.
 * @returns {Promise<{query:string, confidence:number, label:string, source:string}|null>}
 */
export async function analyzeImageLocal(file, { locale = 'tr', onProgress } = {}) {
  try {
    if (!file) return null;

    const imageData = await fileToImageData(file, 512);
    const clip = await getClip(onProgress);

    const out = await clip(imageData, CANDIDATE_LABELS_EN, { multi_label: false });

    const label = out?.labels?.[0] || '';
    const score = Number(out?.scores?.[0] ?? 0);

    if (!label) return null;

    const confidence = Number.isFinite(score) ? score : 0;
    // Conservative threshold: below this, we refuse to produce a query.
    if (confidence < 0.55) {
      return { query: '', confidence, label, source: 'local-clip' };
    }

    const tr = EN2TR[label] || label;
    const query = String(tr || '').trim();

    return { query, confidence, label, source: 'local-clip' };
  } catch (err) {
    console.warn('analyzeImageLocal error:', err);
    return null;
  }
}
