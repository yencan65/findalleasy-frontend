// src/utils/barcodeLookup.js
// Barcode/QR -> product-info -> vitrin inject
// Goals:
// - Fast: hard timeout (no "sonsuz arama")
// - Credit-safe: paid fallback only if explicitly enabled
// - No junk: if we can't resolve offers, show ONLY merchant search links (fallback cards)
// - 15 min cache for successful offer payloads

import { API_BASE } from "./api";

export const isLikelyBarcode = (s) => {
  const v = String(s || "").trim().replace(/\s+/g, "");
  return /^[0-9]{8,18}$/.test(v);
};

const TTL_MS = 15 * 60 * 1000;

function cacheKey(locale, qr) {
  const loc = String(locale || "tr").toLowerCase();
  return `fae.barcodeCache:${loc}:${qr}`;
}

function getCache(locale, qr) {
  try {
    const raw = window?.localStorage?.getItem?.(cacheKey(locale, qr));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.payload || null;
  } catch {
    return null;
  }
}

function setCache(locale, qr, payload) {
  try {
    window?.localStorage?.setItem?.(
      cacheKey(locale, qr),
      JSON.stringify({ ts: Date.now(), payload })
    );
  } catch {}
}

function dispatchInject(payload) {
  try {
    window.dispatchEvent(new CustomEvent("fae.vitrine.inject", { detail: payload }));
  } catch {}
}

function dispatchResults(status, query, items, source, error) {
  try {
    window.dispatchEvent(
      new CustomEvent("fae.vitrine.results", {
        detail: {
          status,
          query,
          items: Array.isArray(items) ? items : [],
          source: source || "barcode",
          ...(error ? { error } : {}),
        },
      })
    );
  } catch {}
}

function toNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "").trim();
  if (!s) return NaN;
  const raw = s.replace(/[^0-9.,]/g, "");
  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  let normalized = raw;

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    normalized = raw.replace(/,/g, ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeItems(qr, product) {
  const offers = [
    ...(Array.isArray(product?.offersTrusted) ? product.offersTrusted : []),
    ...(Array.isArray(product?.offersOther) ? product.offersOther : []),
  ];

  const titleBase =
    String(product?.title || product?.name || product?.qrCode || qr || "").trim() || qr;

  const items = offers
    .map((o) => {
      const priceRaw = o?.finalPrice ?? o?.price;
      const priceNum = toNumber(priceRaw);
      const finalNum = toNumber(o?.price ?? o?.finalPrice);
      const price = Number.isFinite(priceNum)
        ? priceNum
        : Number.isFinite(finalNum)
        ? finalNum
        : null;
      const finalPrice = Number.isFinite(finalNum)
        ? finalNum
        : Number.isFinite(priceNum)
        ? priceNum
        : null;

      return {
        ...o,
        title: String(o?.title || titleBase).trim() || titleBase,
        image: o?.image || product?.image,
        price,
        finalPrice,
        currency: o?.currency || product?.currency || "TRY",
      };
    })
    .filter((x) => typeof x.price === "number" && x.price > 0);

  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = [
      String(it?.provider || it?.providerKey || it?.merchant || "").toLowerCase(),
      String(it?.url || it?.affiliateUrl || it?.deeplink || ""),
      String(it?.price || ""),
    ].join("|");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function allowPaidEnv() {
  try {
    const v = String(import.meta?.env?.VITE_FAE_ALLOW_PAID_FALLBACK ?? "").trim();
    return v === "1";
  } catch {
    return false;
  }
}

function buildSearchLinks(q) {
  const query = String(q || "").trim();
  if (!query) return [];
  const enc = encodeURIComponent(query);
  const links = [
    { merchant: "hepsiburada", url: `https://www.hepsiburada.com/ara?q=${enc}` },
    { merchant: "trendyol", url: `https://www.trendyol.com/sr?q=${enc}` },
    { merchant: "n11", url: `https://www.n11.com/arama?q=${enc}` },
    { merchant: "akakce", url: `https://www.akakce.com/arama/?q=${enc}` },
    { merchant: "cimri", url: `https://www.cimri.com/arama?q=${enc}` },
    { merchant: "amazon", url: `https://www.amazon.com.tr/s?k=${enc}` },
    { merchant: "google", url: `https://www.google.com/search?q=${enc}` },
  ];
  return links;
}

function saveFallbackLinks(q, items) {
  try {
    if (!q || !Array.isArray(items) || !items.length) {
      window?.localStorage?.removeItem?.("faeFallbackLinks");
      return;
    }
    window?.localStorage?.setItem?.("faeFallbackLinks", JSON.stringify({ q, items }));
  } catch {}
}

function buildFallbackItems(product, q) {
  const img = product?.image || "";
  const links = Array.isArray(product?.searchLinks) && product.searchLinks.length
    ? product.searchLinks
    : buildSearchLinks(q);

  const items = (links || [])
    .map((sl, idx) => {
      const merchant = String(sl?.merchant || "").trim() || `market_${idx}`;
      const url = String(sl?.url || "").trim();
      if (!url) return null;
      return {
        title: `${merchant.toUpperCase()} - ${q}`,
        merchant,
        url,
        image: img,
        provider: "link",
        providerKey: `link_${merchant}`,
        providerFamily: "link",
        currency: "TRY",
        price: null,
        finalPrice: null,
        rank: Math.max(1, 60 - idx),
        confidence: "low",
        isFallbackLink: true,
      };
    })
    .filter(Boolean);

  return items;
}

async function fetchJsonWithTimeout(url, { method = "POST", headers = {}, body, timeoutMs = 9000 } = {}) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const to = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller?.signal,
    });
    const json = await res.json().catch(() => null);
    return { res, json };
  } finally {
    if (to) clearTimeout(to);
  }
}

async function callProductInfo(qr, locale, allowPaid) {
  const backend = API_BASE || "";
  const apiKey = (import.meta?.env?.VITE_API_KEY && String(import.meta.env.VITE_API_KEY).trim()) || "";
  const strictFreeQ = allowPaid ? "" : "&strictFree=hard&purgeWeak=1";
  const url = `${backend}/api/product-info/product?diag=0&force=0&paid=${allowPaid ? 1 : 0}&preferAffiliate=1&paidLastResort=1${strictFreeQ}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
    ...(!allowPaid ? { "x-fae-skip-paid": "1" } : {}),
  };

  const timeoutMs = (() => {
    const n = Number(import.meta?.env?.VITE_FAE_BARCODE_TIMEOUT_MS || 9000);
    return Number.isFinite(n) ? Math.max(2500, Math.min(20000, n)) : 9000;
  })();

  return fetchJsonWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ qr, locale }),
    timeoutMs,
  });
}

// Main: lookup barcode and dispatch either inject (success) or results (empty/error)
export async function barcodeLookupFlow(
  qrRaw,
  { locale = "tr", allowPaidSecondStage = true, source = "barcode" } = {}
) {
  const qr = String(qrRaw || "").trim().replace(/\s+/g, "");
  const loc = String(locale || "tr").toLowerCase();

  if (!isLikelyBarcode(qr)) {
    dispatchResults("empty", qr || "", [], source);
    return { status: "invalid", query: qr || "", itemsLen: 0 };
  }

  const cached = getCache(loc, qr);
  if (cached) {
    dispatchInject(cached);
    return {
      status: "cached",
      query: String(cached?.query || qr),
      itemsLen: Array.isArray(cached?.items) ? cached.items.length : 0,
      cached: true,
      paidUsed: false,
    };
  }

  const paidAllowed = Boolean(allowPaidSecondStage) && allowPaidEnv();

  // Stage 1: free-first
  try {
    const s1 = await callProductInfo(qr, loc, false);
    if (!s1.res.ok || s1.json?.ok === false) {
      throw new Error(String(s1.json?.error || `HTTP_${s1.res.status}`));
    }

    let product = s1.json?.product || {};
    let items = normalizeItems(qr, product);

    if (items.length) {
      const payload = {
        query: product?.title || product?.name || qr,
        items,
        source,
        product,
        ok: true,
      };
      setCache(loc, qr, payload);
      dispatchInject(payload);
      return { status: "success", query: payload.query, itemsLen: items.length, paidUsed: false };
    }

    // Stage 2: paid fallback (only if explicitly enabled)
    if (paidAllowed) {
      const s2 = await callProductInfo(qr, loc, true);
      if (!s2.res.ok || s2.json?.ok === false) {
        throw new Error(String(s2.json?.error || `HTTP_${s2.res.status}`));
      }
      product = s2.json?.product || product || {};
      items = normalizeItems(qr, product);

      if (items.length) {
        const payload = {
          query: product?.title || product?.name || qr,
          items,
          source,
          product,
          ok: true,
        };
        setCache(loc, qr, payload);
        dispatchInject(payload);
        return {
          status: "success_paid",
          query: payload.query,
          itemsLen: items.length,
          paidUsed: true,
        };
      }
    }

    // Nothing priced/resolved -> fallback merchant links (NO junk products)
    const qHuman = String(product?.title || product?.name || qr).trim() || qr;
    const fallbackItems = buildFallbackItems(product, qHuman);
    if (fallbackItems.length) {
      saveFallbackLinks(qHuman, fallbackItems);
      dispatchInject({
        query: qHuman,
        items: fallbackItems,
        source: `${source}-fallback`,
        product,
        ok: true,
      });
      return { status: "fallback_links", query: qHuman, itemsLen: fallbackItems.length, paidUsed: false };
    }

    dispatchResults("empty", qHuman, [], source);
    return { status: "empty", query: qHuman, itemsLen: 0, paidUsed: false };
  } catch (err) {
    const message = String(err?.name === "AbortError" ? "TIMEOUT" : err?.message || "ERROR");
    dispatchResults("error", qr, [], source, message);
    return { status: "error", query: qr, itemsLen: 0, error: message };
  }
}
