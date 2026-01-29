// src/utils/localVision.js
// Local (no-key) vision helper using Transformers.js.
// Goal: turn an image into a clean product search query WITHOUT sending the image to any API.
//
// Notes:
// - First run will download the model once and cache it in the browser.
// - We intentionally keep this conservative: if confidence is low, caller should fall back to OCR / backend.

import { pipeline, env } from "@huggingface/transformers";

// Prefer remote models (Hugging Face Hub) + browser cache. No keys needed for public models.
try {
  // These env flags exist in Transformers.js; if they change, try/catch keeps us safe.
  env.allowRemoteModels = true;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
} catch {}

let _clip = null;

// A practical, e-commerce oriented label set (EN → we later map to TR-friendly queries).
const CANDIDATE_LABELS_EN = [
  "smartphone",
  "mobile phone",
  "laptop",
  "tablet",
  "desktop computer",
  "monitor",
  "keyboard",
  "mouse",
  "printer",
  "headphones",
  "earbuds",
  "speaker",
  "smartwatch",
  "camera",
  "television",
  "router",
  "power bank",

  "refrigerator",
  "washing machine",
  "dishwasher",
  "vacuum cleaner",
  "air conditioner",
  "heater",
  "microwave",
  "oven",
  "blender",
  "coffee machine",
  "kettle",
  "toaster",
  "iron",

  "shoes",
  "sneakers",
  "boots",
  "jacket",
  "t-shirt",
  "jeans",
  "dress",
  "handbag",
  "backpack",
  "wallet",

  "perfume",
  "shampoo",
  "soap",
  "toothpaste",
  "diapers",

  "chocolate",
  "biscuits",
  "snack",
  "energy drink",
  "water",
  "cola",
];

// Quick mapping to search-friendly Turkish queries.
// (We keep it short on purpose — backend already does enrichment/fallback searches.)
const EN2TR = {
  "smartphone": "telefon",
  "mobile phone": "telefon",
  "laptop": "laptop",
  "tablet": "tablet",
  "desktop computer": "masaüstü bilgisayar",
  "monitor": "monitör",
  "keyboard": "klavye",
  "mouse": "mouse",
  "printer": "yazıcı",
  "headphones": "kulaklık",
  "earbuds": "bluetooth kulaklık",
  "speaker": "hoparlör",
  "smartwatch": "akıllı saat",
  "camera": "kamera",
  "television": "televizyon",
  "router": "modem router",
  "power bank": "powerbank",

  "refrigerator": "buzdolabı",
  "washing machine": "çamaşır makinesi",
  "dishwasher": "bulaşık makinesi",
  "vacuum cleaner": "elektrikli süpürge",
  "air conditioner": "klima",
  "heater": "ısıtıcı",
  "microwave": "mikrodalga",
  "oven": "fırın",
  "blender": "blender",
  "coffee machine": "kahve makinesi",
  "kettle": "su ısıtıcı kettle",
  "toaster": "tost makinesi",
  "iron": "ütü",

  "shoes": "ayakkabı",
  "sneakers": "spor ayakkabı",
  "boots": "bot",
  "jacket": "ceket",
  "t-shirt": "tişört",
  "jeans": "kot pantolon",
  "dress": "elbise",
  "handbag": "çanta",
  "backpack": "sırt çantası",
  "wallet": "cüzdan",

  "perfume": "parfüm",
  "shampoo": "şampuan",
  "soap": "sabun",
  "toothpaste": "diş macunu",
  "diapers": "bebek bezi",

  "chocolate": "çikolata",
  "biscuits": "bisküvi",
  "snack": "atıştırmalık",
  "energy drink": "enerji içeceği",
  "water": "su",
  "cola": "kola",
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

async function fileToImageData(file, maxSide = 512) {
  // We resize aggressively to keep inference fast.
  const bmp = await createImageBitmap(file);
  const w = bmp.width;
  const h = bmp.height;

  const scale = clamp(maxSide / Math.max(w, h), 0.25, 1);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  // OffscreenCanvas if available, otherwise fallback to normal canvas.
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(tw, th)
      : Object.assign(document.createElement("canvas"), { width: tw, height: th });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, tw, th);
  return ctx.getImageData(0, 0, tw, th);
}

async function getClip(progress_callback = null) {
  if (_clip) return _clip;
  _clip = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
    progress_callback,
  });
  return _clip;
}

/**
 * Analyze an image file locally and return a conservative query.
 * @returns {Promise<{query:string, confidence:number, label:string, source:string}|null>}
 */
export async function analyzeImageLocal(file, { locale = "tr", onProgress } = {}) {
  try {
    if (!file) return null;

    const imageData = await fileToImageData(file, 512);
    const clip = await getClip(onProgress);

    // In Transformers.js, the classifier can be called with (image, candidate_labels, options).
    const out = await clip(imageData, CANDIDATE_LABELS_EN, { multi_label: false });

    const label = out?.labels?.[0] || "";
    const score = Number(out?.scores?.[0] ?? 0);

    if (!label) return null;

    // Conservative: if score too low, don't pretend.
    const confidence = Number.isFinite(score) ? score : 0;
    if (confidence < 0.55) {
      return { query: "", confidence, label, source: "local-clip" };
    }

    const tr = EN2TR[label] || label;
    // For TR marketplace titles, Turkish query generally performs better.
    const query = String(tr || "").trim();

    return { query, confidence, label, source: "local-clip" };
  } catch (err) {
    console.warn("analyzeImageLocal error:", err);
    return null;
  }
}
