// src/utils/barcodeLookup.js
// Barcode/QR -> product-info -> vitrin inject
// - Free-first
// - Paid fallback only if needed
// - 15 min cache

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
  // Accept "1.234,56" and "1234.56" etc.
  const raw = s.replace(/[^0-9.,]/g, "");
  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  let normalized = raw;

  if (lastDot !== -1 && lastComma !== -1) {
    // both exist: decide decimal separator by which appears last
    if (lastComma > lastDot) {
      // comma decimal, dot thousands
      normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // dot decimal, comma thousands
      normalized = raw.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // only comma
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
      const price = Number.isFinite(priceNum) ? priceNum : Number.isFinite(finalNum) ? finalNum : null;
      const finalPrice = Number.isFinite(finalNum) ? finalNum : Number.isFinite(priceNum) ? priceNum : null;

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

  // simple dedupe
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

async function callProductInfo(qr, locale, allowPaid) {
  const backend = API_BASE || "";
  const url = `${backend}/api/product-info/product?force=0&diag=0&allowPaid=${allowPaid ? 1 : 0}&paid=${allowPaid ? 1 : 0}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr, locale }),
  });
  const json = await res.json().catch(() => null);
  return { res, json };
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

    // Stage 2: paid fallback (only if user allowed)
    if (allowPaidSecondStage) {
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
        return { status: "success_paid", query: payload.query, itemsLen: items.length, paidUsed: true };
      }
    }

    const qHuman = String(product?.title || product?.name || qr).trim() || qr;
    dispatchResults("empty", qHuman, [], source);
    return { status: "empty", query: qHuman, itemsLen: 0, paidUsed: false };
  } catch (err) {
    const message = String(err?.message || "ERROR");
    dispatchResults("error", qr, [], source, message);
    return { status: "error", query: qr, itemsLen: 0, error: message };
  }
}
