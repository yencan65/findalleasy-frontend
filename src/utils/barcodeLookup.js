// src/utils/barcodeLookup.js
// Barcode/QR free-first pipeline:
// 1) Backend product-info (official/affiliate + free sources) with allowPaid=false
// 2) If empty, retry once with allowPaid=true (paid fallback as last resort)
// 3) Inject results directly into Vitrin via event (no runUnifiedSearch, no AI cost)

import { API_BASE, withTimeout } from "./api";

const TTL_MS = 15 * 60 * 1000;

const cacheKey = (locale, qr) => `fae.barcodeCache:${String(locale || "tr").toLowerCase()}:${qr}`;

function getCache(locale, qr) {
  try {
    const raw = window?.localStorage?.getItem(cacheKey(locale, qr));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.payload || null;
  } catch {
    return null;
  }
}

function setCache(locale, qr, payload) {
  try {
    window?.localStorage?.setItem(cacheKey(locale, qr), JSON.stringify({ ts: Date.now(), payload }));
  } catch {}
}

function injectVitrine(payload) {
  try {
    window.dispatchEvent(new CustomEvent("fae.vitrine.inject", { detail: payload }));
  } catch {}
}

function isValidPrice(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function normalizeItems(product, offers) {
  const title = String(product?.title || product?.name || "").trim();
  const img = product?.image || product?.imageUrl || "";
  const currency = product?.currency || "TRY";

  return (offers || [])
    .map((o) => {
      const price =
        typeof o?.finalPrice === "number"
          ? o.finalPrice
          : typeof o?.price === "number"
          ? o.price
          : null;

      return {
        ...o,
        title: String(o?.title || title || "").trim() || undefined,
        image: o?.image || img || undefined,
        currency: o?.currency || currency || undefined,
        price: price ?? o?.price,
        finalPrice: price ?? o?.finalPrice,
      };
    })
    .filter((x) => isValidPrice(x?.price) || isValidPrice(x?.finalPrice));
}

async function fetchProductInfo(qr, locale, allowPaid) {
  const base = API_BASE || "";
  const url = `${base}/api/product-info/product?force=0&diag=0&paid=${allowPaid ? 1 : 0}`;

  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
    }),
    12000
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export async function barcodeLookupAndInject(qrRaw, opts = {}) {
  const qr = String(qrRaw || "").trim().replace(/\s+/g, "");
  const locale = String(opts?.locale || "tr").toLowerCase();
  const source = String(opts?.source || "barcode");
  if (!qr) return { ok: false, query: "", items: [] };

  // cache
  const cached = getCache(locale, qr);
  if (cached) {
    injectVitrine(cached);
    return { ok: true, ...cached, fromCache: true };
  }

  // Pass 1: free-first
  let data = null;
  try {
    data = await fetchProductInfo(qr, locale, false);
  } catch (e) {
    // don't fail yet; we'll try paid fallback once
    data = null;
  }

  // Extract
  let product = data?.product || {};
  let offers = [...(product?.offersTrusted || []), ...(product?.offersOther || []), ...(product?.offers || [])];
  let items = normalizeItems(product, offers);

  // Pass 2: paid fallback only if empty
  if (!items.length) {
    try {
      const data2 = await fetchProductInfo(qr, locale, true);
      product = data2?.product || product || {};
      offers = [...(product?.offersTrusted || []), ...(product?.offersOther || []), ...(product?.offers || [])];
      items = normalizeItems(product, offers);
    } catch (e) {
      // keep empty
    }
  }

  const query = String(product?.title || product?.name || qr).trim() || qr;
  const payload = {
    query,
    items,
    source,
    product,
    ok: true,
    meta: { barcode: qr },
  };

  // cache + inject
  setCache(locale, qr, payload);
  injectVitrine(payload);

  // Also emit results event for TTS/toast listeners (optional)
  try {
    window.dispatchEvent(
      new CustomEvent("fae.vitrine.results", {
        detail: {
          query,
          items,
          status: items.length ? "success" : "empty",
          source,
          injected: true,
          meta: { barcode: qr, product },
        },
      })
    );
  } catch {}

  return { ok: true, ...payload, fromCache: false };
}
