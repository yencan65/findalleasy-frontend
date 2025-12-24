// =====================================================
//  IMPORTS DURSUN DİYORSAN → SİLMEDE KORUYORUM
//  AMA PATH'LERİ PUBLIC KULLANIMINA ÇEVİRDİM
// =====================================================

// SVG (public üzerinden erişilir)
const serpapiSvg = "/provider-icons/serpapi.svg";
const googleplacesSvg = "/provider-icons/google.svg";
const googleSvg = "/provider-icons/google.svg";
const googlemapsSvg = "/provider-icons/google.svg";
const openstreetmapSvg = "/provider-icons/openstreetmap.svg";
const osmSvg = "/provider-icons/openstreetmap.svg";
const bookingSvg = "/provider-icons/booking.svg";
const skyscannerSvg = "/provider-icons/skyscanner.svg";
const trendyolSvg = "/provider-icons/trendyol.png";
const hepsiburadaSvg = "/provider-icons/hepsiburada.png";

// PNG
const hepsiburada = "/provider-icons/hepsiburada.png";
const offPng = "/provider-icons/openfoodfacts.png";
const gpPng = "/provider-icons/googlemaps.png";

// 3. blok PNG ikonları
const trendyolPng = "/provider-icons/trendyol.png";
const googlePng = "/provider-icons/google.png";
const osmPng = "/provider-icons/osm.png";
const bookingPng = "/provider-icons/booking.png";
const skyscannerPng = "/provider-icons/skyscanner.png";
const serpapiPng = "/provider-icons/serpapi.png";


// =====================================================
// 1. ORİJİNAL FONKSİYON — SİLİNMEDİ
// =====================================================
export function getProviderIcon(provider = "") {
  if (!provider) return null;

  const p = provider.toLowerCase();

  const map = {
    serpapi: serpapiSvg,
    googleplaces: googleplacesSvg,
    google: googleSvg,
    googlemaps: googlemapsSvg,
    openstreetmap: openstreetmapSvg,
    osm: openstreetmapSvg,
    openfoodfacts: offPng,
    booking: bookingSvg,
    skyscanner: skyscannerSvg,
    trendyol: trendyolSvg,
    hepsiburada: hepsiburadaSvg,
  };

  return map[p] || null;
}


// =====================================================
// EK PNG UZANTILARI — SİLİNMEDİ
// =====================================================
const ICON_EXTENSIONS = {
  googleplaces_png: gpPng,
};


// =====================================================
// 2. FONKSİYON — SİLİNMEDİ
// =====================================================
export function getProviderIcon2(provider) {
  if (!provider) return null;

  const p = provider.toLowerCase();

  const map = {
    serpapi: serpapiSvg,
    googleplaces: googleplacesSvg,
    google: googleSvg,
    googlemaps: googlemapsSvg,
    openstreetmap: openstreetmapSvg,
    osm: osmSvg,
    openfoodfacts: offPng,
    booking: bookingSvg,
    skyscanner: skyscannerSvg,
    trendyol: trendyolSvg,
    hepsiburada: hepsiburadaSvg,
    googleplaces_png: ICON_EXTENSIONS.googleplaces_png,
  };

  map["hepsiburada"] = hepsiburada;

  if (map[p + "_png"]) return map[p + "_png"];
  return map[p] || null;
}


// =====================================================
// 3. BLOK — PNG MAP — SİLİNMEDİ
// =====================================================
const mapThird = {
  trendyol: trendyolPng,
  googleplaces: googlePng,
  openstreetmap: osmPng,
  booking: bookingPng,
  skyscanner: skyscannerPng,
  serpapi: serpapiPng,
};

export function getProviderIcon3(providerName = "") {
  const key = providerName.toLowerCase();
  return mapThird[key] || null;
}



// =====================================================
// 🔥 FINAL FONKSİYON — BİZ BUNU KULLANACAĞIZ
// =====================================================
export function getProviderIconFinal(provider = "") {
  if (!provider) return null;
  const p = provider.toLowerCase();

  const merged = {
    serpapi: serpapiSvg,
    googleplaces: googleplacesSvg,
    google: googleSvg,
    googlemaps: googlemapsSvg,
    openstreetmap: openstreetmapSvg,
    osm: osmSvg,
    booking: bookingSvg,
    skyscanner: skyscannerSvg,
    trendyol: trendyolSvg,
    hepsiburada: hepsiburadaSvg,
    openfoodfacts: offPng,

    // PNG alternatifler
    hepsiburada_png_alt: hepsiburada,
    trendyol_png_alt: trendyolPng,

    googleplaces_png: ICON_EXTENSIONS.googleplaces_png,

    ...mapThird,

    googleplacesdetails: googlePng,
  };

  if (merged[p + "_png"]) return merged[p + "_png"];
  if (merged[p + "_png_alt"]) return merged[p + "_png_alt"];
  return merged[p] || null;
}


export default getProviderIconFinal;
