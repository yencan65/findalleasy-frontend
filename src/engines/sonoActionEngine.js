// src/engines/sonoActionEngine.js
// ------------------------------------------------------------
// SONO ACTION ENGINE – H E R K Ü L  S12.2
// ------------------------------------------------------------
// AIAssistant → “action intent” yakalar → burası yönetir.
// Hiçbir mevcut işlevi bozmaz, sadece güçlendirir.
//
// Desteklenen komutlar (TR + EN mix):
// - dili / dil değiştir / english mode / speak english...
// - şehir değiştir → __FIE_CITY__ güncellenir (81 il destekli, temel seviye)
// - region → TR / GLOBAL (Türkiye / global fiyat optimizasyonu)
// - qr / qr aç / barkod → QRScanner tetiklenir
// - tema → dark / light / tema değiştir
// ------------------------------------------------------------

// Global init kilidi (StrictMode / çoklu çağrı koruması)
let _sonoActionInited = false;

export function initSonoActionEngine() {
  if (typeof window === "undefined") return;

  // Eğer daha önce init edildiyse tekrar etme
  if (_sonoActionInited || window.__SONO_ACTION_INITED__) {
    return;
  }
  _sonoActionInited = true;
  window.__SONO_ACTION_INITED__ = true;

  window.addEventListener("fie:action", (e) => {
    const raw = String(e.detail?.raw || "").toLowerCase();
    const locale = e.detail?.locale || "tr";
    const ctx = e.detail?.context || "";

    // ------------------------------
    // DİL DEĞİŞTİRME
    // ------------------------------
    // Eski davranış korunuyor, üzerine güçlendirilmiş desenler ekleniyor
    if (
      raw.includes("dili") ||
      raw.includes("dil değiştir") ||
      raw.includes("dil degistir") ||
      raw.includes("speak ") ||
      raw.includes("language") ||
      raw.includes("english mode") ||
      raw.includes("ingilizce konuş") ||
      raw.includes("ingilizce konus")
    ) {
      // Hedef dil tespit
      if (raw.includes("ing") || raw.includes("english")) changeLang("en");
      else if (raw.includes("rus") || raw.includes("ru") || raw.includes("russian")) changeLang("ru");
      else if (raw.includes("fran") || raw.includes("fr") || raw.includes("french")) changeLang("fr");
      else if (raw.includes("arap") || raw.includes("ar") || raw.includes("arabic")) changeLang("ar");
      else if (raw.includes("türkçe") || raw.includes("turkce") || raw.includes("tr")) changeLang("tr");
      else changeLang("tr");
    }

    // ------------------------------
    // ŞEHİR DEĞİŞTİRME
    // ------------------------------
    if (raw.includes("şehir") || raw.includes("sehir") || raw.includes("city")) {
      const city = extractCityName(raw);
      if (city) {
        window.__FIE_CITY__ = city;
        try {
          localStorage.setItem("city", city);
        } catch {}
        toast(`${city} için içerikler optimize edildi.`);
      } else {
        // Şehir çıkmazsa bile sessiz kalmak yerine hafif bilgi
        toast("Şehri algılayamadım, lütfen 'İzmir için otel bak' gibi söyleyin.");
      }
    }

    // ------------------------------
    // REGION (TR / GLOBAL)
    // ------------------------------
    // Global algısı
    if (
      raw.includes("global") ||
      raw.includes("dünya") ||
      raw.includes("dunya") ||
      raw.includes("yurtdışı") ||
      raw.includes("yurtdisi") ||
      raw.includes("world")
    ) {
      try {
        localStorage.setItem("region", "GLOBAL");
      } catch {}
      toast("Global fiyat optimizasyonu aktif.");
    }

    // Türkiye algısı
    if (
      raw.includes("türkiye") ||
      raw.includes("turkiye") ||
      raw.includes("tr ") ||
      raw.endsWith(" tr") ||
      raw.includes("sadece türkiye") ||
      raw.includes("sadece turkiye")
    ) {
      try {
        localStorage.setItem("region", "TR");
      } catch {}
      toast("Türkiye fiyat optimizasyonu aktif.");
    }

    // ------------------------------
    // QR SCANNER
    // ------------------------------
    if (
      raw.includes("qr") ||
      raw.includes("barkod") ||
      raw.includes("barcode") ||
      raw.includes("kod oku") ||
      raw.includes("qr aç") ||
      raw.includes("qr ac")
    ) {
      try {
        window.dispatchEvent(new CustomEvent("fie:qr.open"));
        toast("QR tarayıcı açılıyor.");
      } catch (err) {
        console.warn("QR open event error:", err);
      }
    }

    // ------------------------------
    // TEMA (Dark / Light / Toggle)
    // ------------------------------
    // Koyu / dark
    if (
      raw.includes("koyu") ||
      raw.includes("dark") ||
      raw.includes("gece modu") ||
      raw.includes("gece modu aç") ||
      raw.includes("gece modu ac")
    ) {
      try {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } catch {}
      toast("Koyu tema açıldı.");
    }

    // Açık / light
    if (
      raw.includes("açık tema") ||
      raw.includes("acik tema") ||
      raw.includes("light") ||
      raw.includes("gündüz modu") ||
      raw.includes("gunduz modu")
    ) {
      try {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } catch {}
      toast("Açık tema açıldı.");
    }

    // Toggle (tema değiştir)
    if (
      raw.includes("tema değiştir") ||
      raw.includes("tema degistir") ||
      raw.includes("switch theme") ||
      raw.includes("tema değiş") ||
      raw.includes("tema degis")
    ) {
      try {
        const root = document.documentElement;
        const isDark = root.classList.contains("dark");
        if (isDark) {
          root.classList.remove("dark");
          localStorage.setItem("theme", "light");
          toast("Açık tema açıldı.");
        } else {
          root.classList.add("dark");
          localStorage.setItem("theme", "dark");
          toast("Koyu tema açıldı.");
        }
      } catch {
        // tema toggle patlarsa en azından sessizce geç
      }
    }
  });
}

// ------------------------------------------------------------
// Yardımcılar
// ------------------------------------------------------------

let _i18nInstance = null;

function changeLang(code) {
  try {
    if (typeof window === "undefined") return;

    // i18next dinamik import – 1 kere yüklenip cache'lenir
    const load = _i18nInstance
      ? Promise.resolve(_i18nInstance)
      : import("i18next").then((mod) => {
          _i18nInstance = mod.default;
          return _i18nInstance;
        });

    load
      .then((i18n) => {
        i18n.changeLanguage(code);
        try {
          localStorage.setItem("lang", code);
        } catch {}
        toast(`Dil ${code.toUpperCase()} olarak ayarlandı.`);
      })
      .catch(() => {
        // i18next import patlarsa bile siteyi bozma
      });
  } catch {
    // tamamen sessiz fail, UI kırılmaz
  }
}

// Temel Türkçe il listesi + kısa İngilizce destek için naive eşleşme
const CITY_LIST = [
  "adana","adiyaman","afyon","afyonkarahisar","agri","aksaray","amasya","ankara",
  "antalya","ardahan","artvin","aydin","balikesir","bartin","batman","bayburt",
  "bilecik","bingol","bitlis","bolu","burdur","bursa","canakkale","çanakkale",
  "cankiri","çankırı","corum","çorum","denizli","diyarbakir","diyarbakır",
  "duzce","düzce","edirne","elazig","elazığ","erzincan","erzurum","eskisehir",
  "eskişehir","gaziantep","giresun","gumushane","gümüşhane","hakkari","hatay",
  "igdir","ığdır","isparta","istanbul","izmir","k.maras","kahramanmaras",
  "kahramanmaraş","karabuk","karabük","karaman","kars","kastamonu","kayseri",
  "kilis","kirikkale","kırıkkale","kirklareli","kırklareli","kirsehir",
  "kırşehir","kocaeli","konya","kutahya","kütahya","malatya","manisa","mardin",
  "mersin","icel","içel","mugla","muğla","mus","muş","nevsehir","nevşehir",
  "nigde","niğde","ordu","osmaniye","rize","sakarya","samsun","siirt","sinop",
  "sivas","sanliurfa","şanlıurfa","sirnak","şırnak","tekirdag","tekirdağ",
  "tokat","trabzon","tunceli","usak","uşak","van","yalova","yozgat","zonguldak",

  // İngilizce / turist telaffuzları (naif)
  "istanbul ","izmir ","ankara ","antalya ","bursa ","kayseri ","antalya ",
];

function extractCityName(text) {
  const low = text.toLowerCase();

  // Özel case: "X için ... bak" kalıbını yakala
  const forMatch = low.match(/([a-zçğıöşüİĞÖŞÜ\s]+)\siçin/);
  if (forMatch && forMatch[1]) {
    const rawCity = forMatch[1].trim();
    const city = CITY_LIST.find((c) => low.includes(c));
    if (city) return capitalizeCity(city);
    if (rawCity.length <= 20) return capitalizeCity(rawCity);
  }

  // Genel: listeden geçen ilk şehir
  for (const c of CITY_LIST) {
    if (low.includes(c)) return capitalizeCity(c);
  }

  return null;
}

function capitalizeCity(t) {
  if (!t) return "";
  const trimmed = t.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function toast(msg) {
  try {
    if (typeof window === "undefined") return;

    // Önce custom toast event
    window.dispatchEvent(new CustomEvent("fie:toast", { detail: msg }));
  } catch {
    try {
      // UI tarafında listener yoksa son çare: alert
      alert(msg);
    } catch {
      console.warn("Toast:", msg);
    }
  }
}
