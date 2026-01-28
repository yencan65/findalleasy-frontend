// src/i18n.js
// Çok dilli i18n yapılandırması – temiz ve tam sürüm (NO DUPLICATE KEYS)

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { API_BASE } from "./utils/api";

const resources = {
  // ======================== TURKISH ========================
  tr: {
    translation: {
      "yazman yeterli,": "Yazman yeterli,",
      gerisini: "gerisini",
      "halleder.": "halleder.",

      username: "Kullanıcı",
      Puan: "Puan",

      loading: "Yükleniyor…",
      cameraSearch: "Kamera ile ara",
      sloganFull: "Yazman yeterli, gerisini Sono halleder.",

      site: {
        about: "Hakkımızda",
        how: "Nasıl Çalışır?",
        contact: "İletişim"
      },

      // ✅ TEK legal objesi (birleştirildi)
      legal: {
        badge: "Legal",
        home: "← Ana sayfa",
        updatedAt: "Güncelleme",
        privacy: "Gizlilik",
        cookies: "Çerezler",
        affiliate: "Affiliate Açıklaması",
        terms: "Kullanım Şartları"
      },

      fillAllFields: "Lütfen tüm alanları doldurun.",
      networkError: "Ağ hatası. Lütfen tekrar deneyin.",
      processFailed: "İşlem başarısız.",
      emailRequired: "E-posta gerekli.",
      resetCodeSent: "Doğrulama kodu gönderildi.",
      missingFields: "Lütfen tüm alanları doldurun.",
      updateFailed: "Güncelleme başarısız.",
      passwordUpdated: "Şifre başarıyla güncellendi.",

      voiceSearch: "Sesli arama",
      visualSearch: "Görsel arama",
      qrSearch: "QR ile arama",

      badges: {
        title: "Rozetler",
        silver: "Gümüş",
        gold: "Altın",
        platinum: "Platin",
        progress: "İlerleme",
        earnMore:
          "Daha fazla kazanmak için alışveriş yap veya arkadaş davet et."
      },

      ph: {
        searchProduct: "Ürün veya hizmet ara",
        findHotel: "Otel bul...",
        compareFlight: "Uçak biletini kıyasla...",
        exploreElectronics: "Elektroniği keşfet...",
        findCarRental: "Araç kiralama fırsatlarını bul..."
      },

      placeholder: {
        hotel: "Otel ara...",
        car: "Araç kirala...",
        food: "Yemek siparişi ver...",
        tour: "Tur bul...",
        insurance: "Sigorta karşılaştır...",
        estate: "Gayrimenkul keşfet...",
        electronic: "Elektronik ürünleri karşılaştır..."
      },

      search: {
        voice: "Sesli arama",
        camera: "Kamera ile ara",
        qr: "QR ile ara",
        search: "Ara",
        searching: "Arama yapılıyor…",
        searchError: "Arama başarısız. Lütfen tekrar dene.",
        badQuery: "Arama metni hatalı. Lütfen tekrar dene.",
        imageAnalyzing: "Görsel analiz ediliyor…",
        imageDetected: "Görüntüden anladığım: {{query}}",
        // ✅ Kamera onay barı (App.jsx ile uyumlu)
        imageDetectedPrefix: "Görüntüden anladığım:",
        imageWeakGuess: "Emin olamadım, ama şöyle görünüyor:",
        confirmQuestion: "Bu aramayı yapmak istiyor musunuz?",
        confirmSearch: "Ara",
        editQuery: "Düzenle",
        searchNow: "Ara",
        edit: "Düzenle",
        cancel: "İptal",
        cameraError: "Görsel analizi başarısız. Lütfen tekrar dene.",
        voiceNotSupported: "Tarayıcın ses tanımayı desteklemiyor!",
        voiceStarted: "Sesli arama başladı — şimdi konuşabilirsin.",
        voiceHeardPrefix: "Sesli komuttan anladığım:",
        voiceConfirmQuestion: "Bunu mu arayayım?",
        voiceConfirmToast: "Duydum — aramam için onay ver.",
        voiceDone: "Tamam — arıyorum.",
        voiceStopped: "Sesli arama durduruldu.",
        voiceError: "Sesli arama hatası."
      },

      // ✅ TEK qrScanner (TR)
      qrScanner: {
        noCameraTitle: "Kamera Erişilemiyor",
        noCameraBody: "Kamera bulunamadı veya erişim izni verilmedi.",
        retry: "Yeniden Dene",
        lastRead: "Son okunan:",
        torchTurnOn: "🔦 Fener Aç",
        torchTurnOff: "🔦 Fener Kapat",
        help: "QR veya barkodu kare içine hizalayın. Algıladığında otomatik arama tetiklenir.",
        starting: "Kamera açılıyor…",
        scanning: "Taranıyor…",
        detected: "Kod algılandı.",
        analyzing: "Kod analiz ediliyor…",
        startingSearch: "Arama başlatılıyor…",
        closing: "Kapatılıyor",
        countdown: "{{count}}sn",
        httpsRequired: "Kamerayı kullanmak için güvenli bağlantı (HTTPS) gerekli.",
        videoNotFound: "Video elementi bulunamadı.",
        cameraDenied: "Kamera erişimi reddedildi: {{msg}}",
        torchNotSupported: "Bu cihazda fener desteği yok.",
        torchError: "Fener kontrol edilemedi"
      },

      smartGreeting: {
        hello: "Merhaba {{name}}",
        t1: "Bölgende en çok tıklanan fırsatları gösteriyorum",
        t2: "En güvenilir satıcıdan en uygun fiyat",
        t3: "Tek tıkla karşılaştır, zamandan kazan",
        t4: "İstersen başka ülkelere de bakabilirsin",
        trigger1: "Bölgende en çok tıklanan fırsatları gösteriyorum",
        trigger2: "En güvenilir satıcıdan en uygun fiyat",
        trigger3: "Tek tıkla karşılaştır, zamandan kazan",
        trigger4: "İstersen başka ülkelere de bakabilirsin"
      },

      slogan: {
        full: "Yazman yeterli, gerisini 😊 halleder."
      },

      greeting: {
        morning: "Günaydın ☀️",
        afternoon: "İyi günler 🙂",
        evening: "İyi akşamlar 🌙",
        night: "İyi geceler 😴"
      },

      trigger: {
        writeSono: "Yazman yeterli, Sono bulsun.",
        discoverDeals: "En iyi fırsatları keşfet.",
        youTypeIFind: "Sen yaz, ben bulayım.",
        readyToSave: "Zaman ve para kazanmaya hazır mısın?",
        aiWithYou: "Yapay zeka her adımda yanında.",
        customShowcase: "Kişisel vitrinini hazırlıyorum..."
      },

      header: {
        chooseLanguage: "Dil Seç",
        wallet: "Cüzdan"
      },

      auth: {
        login: "Giriş Yap",
        logout: "Çıkış Yap",
        register: "Kayıt Ol",
        forgotPassword: "Şifremi unuttum",

        email: "E-posta",
        emailRequired: "E-posta gerekli.",
        password: "Şifre",
        nameSurname: "Ad Soyad",
        inviteCode: "Davet Kodu",
        newPassword: "Yeni Şifre",
        enterResetCode: "Doğrulama Kodunu Gir",
        saveNewPassword: "Yeni Şifreyi Kaydet",
        sendResetCode: "Kod Gönder",

        loading: "Yükleniyor…",

        loginFailed: "Giriş başarısız.",
        registerFailed: "Kayıt başarısız.",
        registerSuccess: "Kayıt başarılı, şimdi giriş yapabilirsiniz.",
        activationMailSent: "Kayıt başarılı! Aktivasyon kodu gönderildi.",
        activateTitle: "Hesabını Aktifleştir",
        activationInfoEmail: "adresine gönderilen aktivasyon kodunu gir.",
        activationInfoNoEmail: "Lütfen aktivasyon e-posta adresini gir.",
        activationCode: "Aktivasyon Kodu",
        activateAccount: "Hesabı Aktifleştir",
        activationCodeRequired: "Aktivasyon kodu gerekli.",
        activationFailed: "Aktivasyon başarısız.",
        activationSuccess: "Hesabınız başarıyla aktifleştirildi!",
        resendCode: "Kodu yeniden gönder",
        resendFailed: "E-posta gönderilemedi.",
        resendSuccess: "Aktivasyon e-postası tekrar gönderildi."
      },

      showcase: {
        best: "En uygun & güvenilir",
        preparing: "Öneriler hazırlanıyor...",
        aiCumulative: "SonoAI Önerileri",
        personalizing: "Kişiselleştiriliyor…",
        others: "Diğerleri",
        noResults: "Henüz sonuç bulunamadı."
,
        emptyInfoLine: "Bu site, aradığın ürün veya hizmeti hızlıca bulup fiyatları karşılaştırır.",
        emptyBenefitsTitle: "Sana faydası:",
        benefitTimeTitle: "Zaman kazandırır",
        benefitTimeDesc: "Tek tek site gezmeden sonuçları tek yerde görürsün.",
        benefitMoneyTitle: "Para kazandırır",
        benefitMoneyDesc: "En uygun/ekonomik seçenekleri öne çıkarır, gereksiz pahalıya kaçmanı engeller.",
        benefitPeaceTitle: "Kafa rahatlatır",
        benefitPeaceDesc: "Alakasız “çer çöp” sonuçları ayıklayıp daha güvenilir kaynaklara öncelik verir."
      },,

      common: {
        loading: "Yükleniyor…",
        noImage: "Görsel yok",
        noPrice: "Fiyat satıcıda",
        summaryFallback: "Özet bilgi yok"
      },

      actions: {
        goToReservation: "Tıkla",
        close: "Kapat",
        clear: "Temizle"
      },

      footerFull: {
        left: "Yapay zeka destekli global fiyat karşılaştırma asistanın.",
        mid: "Zaman ve paradan tasarruf için parmak şıklatman yeter,",
        right: "gerisini O halleder."
      },

      ai: {
        sono: "Sono AI",
        listen: "Dinle",
        send: "Gönder",
        placeholder: "Mesaj yaz...",
        chooseModeTitle: "Mod seç: Ürün/Hizmet Ara veya Soru Sor/Bilgi Al",
        chooseModeSubtitle: "Seçtiğin moda göre Sono ya vitrine arama yapar ya da bilgi verir.",
        chooseModeFirst: "Önce bir mod seç: Ürün/Hizmet Ara veya Soru Sor/Bilgi Al.",
        chooseModeToast: "Devam etmek için mod seç.",
        chooseModePlaceholder: "Önce mod seç…",
        modeSearch: "Ürün/Hizmet Ara",
        modeChat: "Soru Sor / Bilgi Al",
        modeActiveSearch: "Mod: Ürün/Hizmet Arama",
        modeActiveChat: "Mod: Bilgi / Sohbet",
        changeMode: "Mod değiştir",
        modeSetSearch: "Tamam — ürün/hizmet arama modundayım. Ne arıyoruz?",
        modeSetChat: "Tamam — bilgi modu aktif. Sor bakalım.",
        modeReset: "Mod seçimini sıfırladım.",
        voiceConfirmQuestionChat: "Bunu göndereyim mi?",
        voiceConfirmToastChat: "Duydum — göndermem için onay ver.",
        placeholderSearch: "Ürün veya hizmet ara…",
        placeholderChat: "Soru sor / bilgi al…",
        listening: "Dinleniyorum…",
        voiceHeardPrefix: "Sesli komuttan anladığım:",
        voiceConfirmQuestion: "Bunu mu arayayım?",
        voiceConfirmToast: "Duydum — aramam için onay ver.",
        voiceDone: "Tamam. Arıyorum…",
        searching: "Arıyorum…",
        searchError: "Arama sırasında bir hata oldu.",
        analyzing: "Analiz ediliyor...",
        hello: "Merhaba, ben Sono. Ürün/hizmet arayabilir veya herhangi bir konuda soru sorabilirsin.",
        helloChoose: "Merhaba, ben Sono. Ne yapmak istersin? Ürün/Hizmet Ara veya Soru Sor / Bilgi Al.",
        sources: "Kaynaklar",
        confidence: "Güven",
        lowConfidence: "Eminlik düşük",
        prepping: "Yanıt hazırlıyorum...",
        ready: "Hazır.",
        chatReady: "Cevap hazır.",
        thanks: "Rica ederim 🌸",
        talk: "Konuş",
        error: "Bir hata oluştu.",
        noAnswer: "Şu an cevap alamadım.",
        noSpeech: "Tarayıcın ses tanımayı desteklemiyor!",
        thanksReply: "Rica ederim, her zaman buradayım."
      },

      net: {
        offlineTitle: "İnternet bağlantınız yok",
        offlineDesc: "Bağlantı gelene kadar bu uyarı kapanmaz. İnternet gelince otomatik devam eder.",
        onlineTitle: "İnternet bağlantınız geldi",
        onlineDesc: "Devam edebilirsiniz.",
      },

      vitrine: {
        resultsReady: "Sonuçlar vitrinde hazır. Teşekkürler.",
        noResults: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin.",
        resultsError: "Arama sırasında hata oluştu. Lütfen tekrar deneyin.",
      },


      wallet: {
        statusNote: "Bu panel şu an yalnızca davet linki ve geçmiş içindir.",
        title: "Cüzdanım",
        howTo: "Nasıl kazanırım?",
        invite: "Davet et",
        inviteCopied: "Davet linkin kopyalandı: ",
        inviteReady: "Davet linkin hazır: ",
        enterAmount: "Kupon Tutarı (₺):",
        couponCreated: "Kupon oluşturuldu: ",
        expires: "son:",
        locked: "İlk siparişten sonra açılır.",
        copied: "Kopyalandı.",
        ready: "Hazır.",
        rule: "İlk alışveriş + davet = kazanç.",
        createCoupon: "Kupon Oluştur",
        useCoupon: "Kuponu Kullan",
        couponAmount: "Kupon Tutarı",
        tree: "Davet Ağacı",
        noBadges: "Henüz rozet yok.",
        lockedText: "İlk alışverişten sonra cüzdan açılır.",
        unlockedText: "Cüzdan indirimi açık.",
        useDiscount: "İndirimi Kullan",
        discountApplied: "İndirim uygulandı.",
        myBadges: "Rozetlerim",
        errorGeneric: "Bir hata oluştu.",
        noBalance: "Bakiye yok.",
        needLogin: "Cüzdanı görmek için lütfen giriş yap.",
        mustLoginInvite: "Davet oluşturmak için giriş yapmalısın.",
        mustLoginCoupon: "Kupon oluşturmak için giriş yapmalısın.",
        mustLoginRedeem: "İndirim kullanmak için giriş yapmalısın.",

        enterCoupon: "Lütfen bir kupon kodu gir.",
        couponInvalid: "Kupon geçersiz veya kullanılamaz.",
        couponAppliedCashback:
          "Kupon uygulandı (önizleme). Ödül/cashback şu an aktif değildir.",
        couponError: "Kupon doğrulanırken bir hata oluştu.",
        relatedOrder: "İlişkili sipariş:",
        inviteError: "Davet linki oluşturulamadı.",
        noRewardsForCoupon: "Bu işlem için kullanılabilir bir bakiye yok.",
        couponTooHigh: "Girilen tutar çok yüksek.",
        redeemError: "İndirim uygulanamadı.",
        infoAria: "Cüzdan hakkında bilgi",

        infoTitle: "Bu cüzdan nasıl çalışır?",
        infoWallet:
          "Bu ekran cüzdan altyapısının önizlemesidir. Şu an ödül/cashback/kupon dağıtımı yoktur; para çekimi (IBAN) de yoktur.",
        infoCoupon:
          "Cüzdan özellikleri ileride açılabilir. Şimdilik bu panel bilgilendirme ve davet linki içindir.",
        infoDiscount:
          "Şu an yalnızca en iyi fiyatı bulma ve yönlendirme altyapısını test ediyoruz. Cüzdan/ödüllendirme aktif olduğunda burada net şekilde duyurulacaktır.",
        infoReferral:
          "Davet altyapısı hazır; ileride aktif olursa davet kazanımları bu ekranda görünecektir.",

        walletTabs: {
          wallet: "Cüzdan",
          actions: "Hareketler",
          orders: "Siparişler"
        },

        historyTitle: "Cüzdan Hareketleri",
        historyEmpty: "Henüz kayıtlı bir cüzdan hareketin yok.",
        historyUnavailable:
          "Hareket geçmişi henüz hazır değil veya kayıt bulunamadı.",
        historyError: "Hareket geçmişi yüklenirken bir hata oluştu.",
        mustLoginHistory:
          "Cüzdan hareketlerini görmek için giriş yapmalısın.",
        txOrderRef: "Sipariş:",
        txUnknownDate: "Tarih yok",

        txType: {
          deposit: "Yükleme",
          reward: "Ödül",
          cashback: "Cashback",
          coupon: "Kupon",
          order: "Sipariş",
          referral: "Davet Ödülü",
          withdraw: "Çekim"
        },

        shareWithFriends: "Linki Paylaş",

        share: {
          whatsapp: "WhatsApp",
          telegram: "Telegram",
          x: "X",
          facebook: "Facebook",
          instagram: "Instagram"
        },

        motto:
          "<span style='color:#FFD700;'>Not:</span> Ödül, cashback ve kupon şu an aktif değil. Şimdilik en iyi fiyatı bulup yönlendirme altyapısını test ediyoruz."
      },

      orders: {
        title: "Siparişlerim",
        empty: "Henüz sistem üzerinden takip edilen bir siparişin yok.",
        mustLogin: "Siparişlerini görmek için giriş yapmalısın.",
        status: {
          pending: "Bekliyor",
          paid: "Ödendi",
          shipped: "Kargolandı",
          completed: "Tamamlandı",
          canceled: "İptal edildi",

        }
      }
    }
  },

  // ======================== ENGLISH ========================
  en: {
    translation: {
      "yazman yeterli,": "Just type,",
      gerisini: "I'll handle",
      "halleder.": "the rest.",

      username: "User",
      Puan: "Points",

      loading: "Loading…",
      cameraSearch: "Search with camera",
      sloganFull: "Just type — Sono will handle the rest.",

      site: {
        about: "About",
        how: "How it works",
        contact: "Contact"
      },

      // ✅ merged legal
      legal: {
        badge: "Legal",
        home: "← Home",
        updatedAt: "Updated",
        privacy: "Privacy",
        cookies: "Cookies",
        affiliate: "Affiliate Disclosure",
        terms: "Terms of Use"
      },

      fillAllFields: "Please fill all fields.",
      networkError: "Network error. Please try again.",
      processFailed: "Process failed.",
      emailRequired: "Email required.",
      resetCodeSent: "Verification code sent.",
      missingFields: "Please fill all fields.",
      updateFailed: "Update failed.",
      passwordUpdated: "Password updated successfully.",

      voiceSearch: "Voice search",
      visualSearch: "Visual search",
      qrSearch: "Search by QR",

      badges: {
        title: "Badges",
        silver: "Silver",
        gold: "Gold",
        platinum: "Platinum",
        progress: "Progress",
        earnMore: "Shop or invite friends to earn more."
      },

      ph: {
        searchProduct: "Search for a product or service",
        findHotel: "Find hotels...",
        compareFlight: "Compare flights...",
        exploreElectronics: "Explore electronics...",
        findCarRental: "Find car rentals..."
      },

      placeholder: {
        hotel: "Search hotels...",
        car: "Find car rentals...",
        food: "Order food...",
        tour: "Find tours...",
        insurance: "Compare insurance...",
        estate: "Explore real estate...",
        electronic: "Compare electronics..."
      },

      search: {
        voice: "Voice search",
        camera: "Search with camera",
        qr: "Search with QR",
        search: "Search",
        voiceNotSupported: "Your browser does not support speech recognition!",
        voiceStarted: "Voice search started — you can speak now.",
        voiceHeardPrefix: "I heard:",
        voiceConfirmQuestion: "Search for this?",
        voiceConfirmToast: "Heard you — confirm to search.",
        voiceDone: "Got it — searching.",
        voiceStopped: "Voice search stopped.",
        voiceError: "Voice search error.",
        searching: "Searching…",
        searchError: "Search failed. Please try again.",
        badQuery: "Invalid search text. Please try again.",
        imageAnalyzing: "Analyzing image…",
        imageDetected: "From the image, I think: {{query}}",
        // ✅ Camera confirm bar (App.jsx)
        imageDetectedPrefix: "From the image, I understood:",
        imageWeakGuess: "Not 100% sure, but it looks like:",
        confirmQuestion: "Do you want to perform this search?",
        confirmSearch: "Search",
        editQuery: "Edit",
        searchNow: "Search",
        edit: "Edit",
        cancel: "Cancel",
        cameraError: "Image analysis failed. Please try again."
      },

      // ✅ qrScanner (EN)
      qrScanner: {
        noCameraTitle: "Camera unavailable",
        noCameraBody: "No camera found or permission was not granted.",
        retry: "Try again",
        lastRead: "Last scanned:",
        torchTurnOn: "🔦 Turn on flash",
        torchTurnOff: "🔦 Turn off flash",
        help: "Align the QR code or barcode inside the square. Search will trigger automatically when detected.",
        starting: "Opening camera…",
        scanning: "Scanning…",
        detected: "Code detected.",
        analyzing: "Analyzing code…",
        startingSearch: "Starting search…",
        closing: "Closing",
        countdown: "{{count}}s",
        httpsRequired: "A secure connection (HTTPS) is required to use the camera.",
        videoNotFound: "Video element not found.",
        cameraDenied: "Camera access denied: {{msg}}",
        torchNotSupported: "Flash is not supported on this device.",
        torchError: "Flash could not be controlled"
      },

      smartGreeting: {
        hello: "Hello {{name}}",
        t1: "Showing top clicked deals in your area",
        t2: "Best price from the most reliable seller",
        t3: "Compare instantly, save time",
        t4: "You can also check other countries",
        trigger1: "Showing top clicked deals in your area",
        trigger2: "Best price from the most reliable seller",
        trigger3: "Compare instantly, save time",
        trigger4: "You can also check other countries"
      },

      slogan: {
        full: "Just type, I’ll handle the rest 😊."
      },

      greeting: {
        morning: "Good morning ☀️",
        afternoon: "Good afternoon 🙂",
        evening: "Good evening 🌙",
        night: "Good night 😴"
      },

      trigger: {
        writeSono: "Just type, Sono finds it.",
        discoverDeals: "Discover best deals.",
        youTypeIFind: "You type, I find.",
        readyToSave: "Ready to save time and money?",
        aiWithYou: "AI is with you.",
        customShowcase: "Preparing your personalized showcase..."
      },

      header: {
        chooseLanguage: "Choose Language",
        wallet: "Wallet"
      },

      auth: {
        login: "Sign In",
        logout: "Sign Out",
        register: "Register",
        forgotPassword: "Forgot Password",

        email: "Email",
        emailRequired: "Email is required.",
        password: "Password",
        nameSurname: "Full Name",
        inviteCode: "Referral Code",
        newPassword: "New Password",
        enterResetCode: "Enter Verification Code",
        saveNewPassword: "Save New Password",
        sendResetCode: "Send Code",

        loading: "Loading…",

        loginFailed: "Login failed.",
        registerFailed: "Registration failed.",
        registerSuccess: "Registration successful, you may now sign in.",
        activationMailSent: "Activation code sent to your email.",
        activateTitle: "Activate Your Account",
        activationInfoEmail: "enter the code sent to this address.",
        activationInfoNoEmail: "Please enter your email to get a code.",
        activationCode: "Activation Code",
        activateAccount: "Activate Account",
        activationCodeRequired: "Activation code is required.",
        activationFailed: "Activation failed.",
        activationSuccess: "Your account has been activated!",
        resendCode: "Resend Code",
        resendFailed: "Could not resend activation code.",
        resendSuccess: "Activation code resent."
      },

      showcase: {
        best: "Best & Reliable",
        preparing: "Preparing suggestions...",
        aiCumulative: "SonoAI Suggestions",
        personalizing: "Personalizing…",
        others: "Others",
        noResults: "No results yet."
,
        emptyInfoLine: "This site helps you quickly find the product or service you’re looking for and compare prices.",
        emptyBenefitsTitle: "Benefits for you:",
        benefitTimeTitle: "Saves time",
        benefitTimeDesc: "See results in one place instead of browsing site by site.",
        benefitMoneyTitle: "Saves money",
        benefitMoneyDesc: "Highlights budget-friendly options so you don’t overpay.",
        benefitPeaceTitle: "Peace of mind",
        benefitPeaceDesc: "Filters out irrelevant junk and prioritizes more reliable sources."
      },,

      common: {
        loading: "Loading…",
        noImage: "No image",
        noPrice: "Price at seller",
        summaryFallback: "No summary"
      },

      actions: {
        goToReservation: "Click",
        close: "Close",
        clear: "Clear"
      },

      footerFull: {
        left: "AI-powered global price comparison assistant.",
        mid: "Snap your fingers to save time and money,",
        right: "it handles the rest."
      },

      ai: {
        sono: "Sono AI",
        listen: "Listen",
        send: "Send",
        placeholder: "Type a message...",
        chooseModeTitle: "Choose a mode: Search or Ask",
        chooseModeSubtitle: "In Search mode I trigger the showcase search; in Ask mode I answer with reliable info.",
        chooseModeFirst: "Choose a mode first: Search or Ask.",
        chooseModeToast: "Choose a mode to continue.",
        chooseModePlaceholder: "Choose a mode first…",
        modeSearch: "Search products/services",
        modeChat: "Ask / Get info",
        modeActiveSearch: "Mode: Search",
        modeActiveChat: "Mode: Ask / Chat",
        changeMode: "Change mode",
        modeSetSearch: "Okay — Search mode is on. What are we looking for?",
        modeSetChat: "Okay — Ask mode is on. What do you want to know?",
        modeReset: "Mode selection reset.",
        voiceConfirmQuestionChat: "Send this?",
        voiceConfirmToastChat: "Heard you — confirm to send.",
        placeholderSearch: "Search a product or service…",
        placeholderChat: "Ask a question…",
        listening: "Listening…",
        voiceHeardPrefix: "I heard:",
        voiceConfirmQuestion: "Search for this?",
        voiceConfirmToast: "Heard you — confirm to search.",
        voiceDone: "Okay. Searching…",
        searching: "Searching…",
        searchError: "Search error.",
        analyzing: "Analyzing, preparing showcase...",
        hello: "Hi, I'm Sono. Search for a product/service or ask any question — I’ll help fast.",
        helloChoose: "Hi, I'm Sono. Choose what you want: Search products/services or Ask / Get info.",
        sources: "Sources",
        confidence: "Confidence",
        lowConfidence: "Low confidence",
        prepping: "Preparing an answer...",
        ready: "Ready. You may check it on the showcase.",
        chatReady: "Answer is ready.",
        thanks: "You're welcome 🌸",
        talk: "Talk",
        error: "Something went wrong.",
        noAnswer: "I couldn't get an answer right now.",
        noSpeech: "Your browser does not support speech recognition!",
        thanksReply: "You're welcome, always here for you."
      },

      net: {
        offlineTitle: "No internet connection",
        offlineDesc: "This alert stays until you’re back online. We’ll resume automatically.",
        onlineTitle: "Back online",
        onlineDesc: "You can continue.",
      },

      vitrine: {
        resultsReady: "Results are ready in the showcase. Thank you.",
        noResults: "Sorry, no results found. Try something else.",
        resultsError: "An error occurred during the search. Please try again.",
      },


      wallet: {
        statusNote:
          "This panel is currently only for your invite link and history.",
        title: "My Wallet",
        howTo: "How do I earn?",
        invite: "Invite",
        inviteCopied: "Your invite link was copied: ",
        inviteReady: "Your invite link is ready: ",
        enterAmount: "Coupon Amount (₺):",
        couponCreated: "Coupon created: ",
        expires: "exp:",
        locked: "Unlocks after your first order.",
        copied: "Copied.",
        ready: "Ready.",
        rule: "First purchase + referral = earnings.",
        createCoupon: "Create Coupon",
        useCoupon: "Redeem Coupon",
        couponAmount: "Coupon Amount",
        tree: "Referral Tree",
        noBadges: "No badges yet.",
        lockedText: "Wallet unlocks after your first order.",
        unlockedText: "Wallet discount active.",
        useDiscount: "Use Discount",
        discountApplied: "Discount applied.",
        myBadges: "My Badges",
        errorGeneric: "An error occurred.",
        noBalance: "No balance.",
        needLogin: "Please sign in to view your wallet.",
        mustLoginInvite: "You must sign in to create an invite.",
        mustLoginCoupon: "You must sign in to create a coupon.",
        mustLoginRedeem: "You must sign in to use a discount.",

        enterCoupon: "Please enter a coupon code.",
        couponInvalid: "Coupon is invalid or cannot be used.",
        couponAppliedCashback:
          "Coupon applied (preview). Rewards/cashback are not active yet.",
        couponError: "An error occurred while validating the coupon.",
        relatedOrder: "Related order:",
        inviteError: "Could not create the invite link.",
        noRewardsForCoupon: "No available balance for this action.",
        couponTooHigh: "The amount is too high.",
        redeemError: "Discount could not be applied.",
        infoAria: "Wallet info",

        infoTitle: "How does this wallet work?",
        infoWallet:
          "This wallet screen is a preview. Rewards/cashback/coupons are not active yet, and there is no cash withdrawal (IBAN).",
        infoCoupon:
          "Wallet features may open later. For now, this panel is for info and your invite link.",
        infoDiscount:
          "Right now we’re only testing the best-price search and click-out flow. When wallet/rewards go live, details will be published here.",
        infoReferral:
          "Invites are ready; if rewards become active later, referral earnings will appear here.",

        walletTabs: {
          wallet: "Wallet",
          actions: "Transactions",
          orders: "Orders"
        },

        historyTitle: "Wallet Transactions",
        historyEmpty: "You have no recorded wallet transactions.",
        historyUnavailable: "History not ready or no records.",
        historyError: "Error loading wallet history.",
        mustLoginHistory: "You must sign in to view wallet history.",
        txOrderRef: "Order:",
        txUnknownDate: "No date",

        txType: {
          deposit: "Deposit",
          reward: "Reward",
          cashback: "Cashback",
          coupon: "Coupon",
          order: "Order",
          referral: "Referral Reward",
          withdraw: "Withdrawal"
        },

        shareWithFriends: "Share the Link",

        share: {
          whatsapp: "WhatsApp",
          telegram: "Telegram",
          x: "X",
          facebook: "Facebook",
          instagram: "Instagram"
        },

        motto:
          "<span style='color:#FFD700;'>Note:</span> Rewards, cashback and coupons are not active yet. For now, find the best price and test the routing."
      },

      orders: {
        title: "My Orders",
        empty: "You currently have no tracked orders.",
        mustLogin: "Sign in to view your orders.",
        status: {
          pending: "Pending",
          paid: "Paid",
          shipped: "Shipped",
          completed: "Completed",
          canceled: "Canceled",

        }
      }
    }
  },

  // ======================== FRENCH ========================
  fr: {
    translation: {
      "yazman yeterli,": "Tape simplement,",
      gerisini: "je m'occupe du",
      "halleder.": "reste.",

      username: "Utilisateur",
      Puan: "Points",

      loading: "Chargement…",
      cameraSearch: "Rechercher avec la caméra",
      sloganFull: "Tapez simplement — Sono s’occupe du reste.",

      site: {
        about: "À propos",
        how: "Comment ça marche ?",
        contact: "Contact"
      },

      // ✅ merged legal
      legal: {
        badge: "Légal",
        home: "← Accueil",
        updatedAt: "Mise à jour",
        privacy: "Confidentialité",
        cookies: "Cookies",
        affiliate: "Mention d’affiliation",
        terms: "Conditions d’utilisation"
      },

      fillAllFields: "Veuillez remplir tous les champs.",
      networkError: "Erreur réseau. Veuillez réessayer.",
      processFailed: "Le processus a échoué.",
      emailRequired: "E-mail requis.",
      resetCodeSent: "Code envoyé.",
      missingFields: "Veuillez remplir tous les champs.",
      updateFailed: "La mise à jour a échoué.",
      passwordUpdated: "Mot de passe mis à jour.",

      voiceSearch: "Recherche vocale",
      visualSearch: "Recherche visuelle",
      qrSearch: "Recherche par QR",

      badges: {
        title: "Badges",
        silver: "Argent",
        gold: "Or",
        platinum: "Platine",
        progress: "Progression",
        earnMore:
          "Achetez ou invitez des amis pour gagner davantage de récompenses."
      },

      ph: {
        searchProduct: "Rechercher un produit ou un service",
        findHotel: "Rechercher des hôtels...",
        compareFlight: "Comparer les vols...",
        exploreElectronics: "Explorer l'électronique...",
        findCarRental: "Trouver une voiture..."
      },

      placeholder: {
        hotel: "Rechercher des hôtels...",
        car: "Trouver une voiture...",
        food: "Commander à manger...",
        tour: "Trouver une excursion...",
        insurance: "Comparer des assurances...",
        estate: "Explorer l'immobilier...",
        electronic: "Comparer l’électronique..."
      },

      search: {
        voice: "Recherche vocale",
        camera: "Recherche par caméra",
        qr: "Recherche par QR",
        search: "Rechercher",
        voiceNotSupported:
          "Votre navigateur ne supporte pas la reconnaissance vocale.",
        voiceStarted: "La recherche vocale a démarré — vous pouvez parler.",
        voiceHeardPrefix: "J’ai compris :",
        voiceConfirmQuestion: "Lancer la recherche ?",
        voiceConfirmToast: "J’ai compris — confirme pour rechercher.",
        voiceDone: "Compris — je recherche.",
        voiceStopped: "Recherche vocale arrêtée.",
        voiceError: "Erreur de recherche vocale.",
        searching: "Recherche…",
        searchError: "La recherche a échoué. Réessayez.",
        badQuery: "Texte de recherche invalide. Réessayez.",
        imageAnalyzing: "Analyse de l'image…",
        imageDetected: "D'après l'image : {{query}}",
        // ✅ Barre de confirmation caméra (App.jsx)
        imageDetectedPrefix: "D'après l'image, j'ai compris :",
        imageWeakGuess: "Pas sûr à 100 %, mais on dirait :",
        confirmQuestion: "Voulez-vous lancer cette recherche ?",
        confirmSearch: "Rechercher",
        editQuery: "Modifier",
        searchNow: "Rechercher",
        edit: "Modifier",
        cancel: "Annuler",
        cameraError: "Analyse d'image échouée. Réessayez."
      },

      // ✅ qrScanner (FR)
      qrScanner: {
        noCameraTitle: "Caméra indisponible",
        noCameraBody:
          "Aucune caméra trouvée ou l’autorisation n’a pas été accordée.",
        retry: "Réessayer",
        lastRead: "Dernier scan :",
        torchTurnOn: "🔦 Allumer le flash",
        torchTurnOff: "🔦 Éteindre le flash",
        help: "Alignez le QR code ou le code-barres dans le cadre. La recherche se lancera automatiquement dès qu’il est détecté.",
        starting: "Ouverture de la caméra…",
        scanning: "Scan en cours…",
        detected: "Code détecté.",
        analyzing: "Analyse du code…",
        startingSearch: "Recherche en cours…",
        closing: "Fermeture",
        countdown: "{{count}}s",
        httpsRequired:
          "Une connexion sécurisée (HTTPS) est requise pour utiliser la caméra.",
        videoNotFound: "Élément vidéo introuvable.",
        cameraDenied: "Accès à la caméra refusé : {{msg}}",
        torchNotSupported:
          "Le flash n’est pas pris en charge sur cet appareil.",
        torchError: "Impossible de contrôler le flash"
      },

      smartGreeting: {
        hello: "Bonjour {{name}}",
        t1: "Je montre les offres populaires dans ta région",
        t2: "Meilleur prix du vendeur le plus fiable",
        t3: "Compare en un clic, gagne du temps",
        t4: "Tu peux aussi regarder d'autres pays",
        trigger1: "Je montre les offres populaires dans ta région",
        trigger2: "Meilleur prix du vendeur le plus fiable",
        trigger3: "Compare en un clic, gagne du temps",
        trigger4: "Tu peux aussi regarder d'autres pays"
      },

      slogan: {
        full: "Tape simplement, je m'occupe du reste 😊."
      },

      greeting: {
        morning: "Bonjour ☀️",
        afternoon: "Bon après-midi 🙂",
        evening: "Bonsoir 🌙",
        night: "Bonne nuit 😴"
      },

      trigger: {
        writeSono: "Écris et Sono trouve.",
        discoverDeals: "Découvre les meilleures offres.",
        youTypeIFind: "Tu écris, je trouve.",
        readyToSave: "Prêt à économiser ?",
        aiWithYou: "L’IA est avec toi.",
        customShowcase: "Je prépare ta vitrine personnalisée..."
      },

      header: {
        chooseLanguage: "Choisir la langue",
        wallet: "Portefeuille"
      },

      auth: {
        login: "Connexion",
        logout: "Déconnexion",
        register: "Créer un compte",
        forgotPassword: "Mot de passe oublié",

        email: "E-mail",
        emailRequired: "E-mail requis.",
        password: "Mot de passe",
        nameSurname: "Nom & Prénom",
        inviteCode: "Code d’invitation",
        newPassword: "Nouveau mot de passe",
        enterResetCode: "Entrez le code",
        saveNewPassword: "Enregistrer le mot de passe",
        sendResetCode: "Envoyer le code",

        loading: "Chargement…",

        loginFailed: "Échec de connexion.",
        registerFailed: "Échec de l’inscription.",
        registerSuccess:
          "Inscription réussie, vous pouvez maintenant vous connecter.",
        activationMailSent:
          "Inscription réussie ! Un code d’activation a été envoyé.",
        activateTitle: "Activer le compte",
        activationInfoEmail: "veuillez saisir le code reçu à cette adresse.",
        activationInfoNoEmail:
          "Veuillez entrer votre e-mail pour recevoir un code.",
        activationCode: "Code d’activation",
        activateAccount: "Activer le compte",
        activationCodeRequired: "Le code d’activation est requis.",
        activationFailed: "Activation échouée.",
        activationSuccess: "Votre compte a été activé !",
        resendCode: "Renvoyer le code",
        resendFailed: "Impossible de renvoyer l’e-mail.",
        resendSuccess: "E-mail renvoyé."
      },

      showcase: {
        best: "Le plus fiable & avantageux",
        preparing: "Préparation…",
        aiCumulative: "Suggestions SonoAI",
        personalizing: "Personnalisation…",
        others: "Autres",
        noResults: "Aucun résultat."
,
        emptyInfoLine: "Ce site t’aide à trouver rapidement le produit ou le service que tu cherches et à comparer les prix.",
        emptyBenefitsTitle: "Tes avantages :",
        benefitTimeTitle: "Gagne du temps",
        benefitTimeDesc: "Tu vois les résultats au même endroit, sans visiter chaque site.",
        benefitMoneyTitle: "Économise de l’argent",
        benefitMoneyDesc: "Met en avant les options les plus économiques pour éviter de payer trop cher.",
        benefitPeaceTitle: "Tranquillité d’esprit",
        benefitPeaceDesc: "Filtre le contenu hors sujet et privilégie des sources plus fiables."
      },,

      common: {
        loading: "Chargement…",
        noImage: "Aucune image",
        noPrice: "Prix chez le vendeur",
        summaryFallback: "Pas de résumé"
      },

      actions: {
        goToReservation: "Cliquez",
        close: "Fermer",
        clear: "Effacer"
      },

      footerFull: {
        left: "Assistant IA global de comparaison de prix.",
        mid: "Claque les doigts pour gagner du temps,",
        right: "je m'occupe du reste."
      },

      ai: {
        sono: "Sono AI",
        listen: "Écouter",
        send: "Envoyer",
        placeholder: "Écrire un message...",
        chooseModeTitle: "Choisis un mode : Rechercher ou Poser une question",
        chooseModeSubtitle: "En mode Recherche, je lance la vitrine ; en mode Question, je réponds avec des infos fiables.",
        chooseModeFirst: "Choisis d'abord un mode : Recherche ou Question.",
        chooseModeToast: "Choisis un mode pour continuer.",
        chooseModePlaceholder: "Choisis un mode…",
        modeSearch: "Rechercher produit/service",
        modeChat: "Question / Info",
        modeActiveSearch: "Mode : Recherche",
        modeActiveChat: "Mode : Info / Chat",
        changeMode: "Changer de mode",
        modeSetSearch: "D’accord — mode Recherche activé. On cherche quoi ?",
        modeSetChat: "D’accord — mode Info activé. Pose ta question.",
        modeReset: "Sélection de mode réinitialisée.",
        voiceConfirmQuestionChat: "Envoyer ça ?",
        voiceConfirmToastChat: "J’ai compris — confirme pour envoyer.",
        placeholderSearch: "Rechercher un produit ou un service…",
        placeholderChat: "Pose une question…",
        listening: "J'écoute…",
        voiceHeardPrefix: "J’ai compris :",
        voiceConfirmQuestion: "Lancer la recherche ?",
        voiceConfirmToast: "J’ai compris — confirme pour rechercher.",
        voiceDone: "D’accord. Je cherche…",
        searching: "Je cherche…",
        searchError: "Erreur de recherche.",
        analyzing: "Analyse…",
        hello: "Bonjour, je suis Sono. Cherchez un produit/service ou posez une question — je vous aide vite.",
        helloChoose: "Bonjour, je suis Sono. Que voulez-vous faire ? Rechercher un produit/service ou poser une question.",
        sources: "Sources",
        confidence: "Confiance",
        lowConfidence: "Confiance faible",
        prepping: "Je prépare la réponse...",
        ready: "C’est prêt.",
        chatReady: "Réponse prête.",
        thanks: "Avec plaisir 🌸",
        talk: "Parler",
        error: "Une erreur s'est produite.",
        noAnswer: "Je n'ai pas pu obtenir de réponse pour le moment.",
        noSpeech:
          "Votre navigateur ne supporte pas la reconnaissance vocale.",
        thanksReply: "Avec plaisir, je suis toujours là."
      },

      net: {
        offlineTitle: "Pas de connexion Internet",
        offlineDesc: "Cette alerte reste affichée jusqu’au retour en ligne. Reprise automatique ensuite.",
        onlineTitle: "Connexion rétablie",
        onlineDesc: "Vous pouvez continuer.",
      },

      vitrine: {
        resultsReady: "Les résultats sont prêts dans la vitrine. Merci.",
        noResults: "Désolé, aucun résultat. Essayez autre chose.",
        resultsError: "Une erreur est survenue pendant la recherche. Réessayez.",
      },


      wallet: {
        statusNote:
          "Ce panneau est actuellement uniquement destiné à votre lien d'invitation et à l'historique.",
        title: "Mon portefeuille",
        howTo: "Comment gagner ?",
        invite: "Inviter",
        inviteCopied: "Lien copié : ",
        inviteReady: "Lien prêt : ",
        enterAmount: "Montant du coupon (₺):",
        couponCreated: "Coupon créé : ",
        expires: "exp :",
        locked: "S’active après votre première commande.",
        copied: "Copié.",
        ready: "Prêt.",
        rule: "Premier achat + invitation = gains.",
        createCoupon: "Créer un coupon",
        useCoupon: "Utiliser le coupon",
        couponAmount: "Montant du coupon",
        tree: "Arbre d'invitations",
        noBadges: "Aucun badge.",
        lockedText: "Le portefeuille s’active après la première commande.",
        unlockedText: "Réduction activée.",
        useDiscount: "Utiliser la réduction",
        discountApplied: "Réduction appliquée.",
        myBadges: "Mes badges",
        errorGeneric: "Erreur.",
        noBalance: "Aucun solde.",
        needLogin: "Veuillez vous connecter pour voir le portefeuille.",
        mustLoginInvite: "Connexion requise pour créer une invitation.",
        mustLoginCoupon: "Connexion requise pour créer un coupon.",
        mustLoginRedeem:
          "Connexion requise pour utiliser une réduction.",

        enterCoupon: "Veuillez saisir un code coupon.",
        couponInvalid: "Coupon invalide ou inutilisable.",
        couponAppliedCashback:
          "Coupon appliqué (aperçu). Les récompenses/cashback ne sont pas encore actifs.",
        couponError: "Erreur lors de la vérification du coupon.",
        relatedOrder: "Commande associée :",
        inviteError: "Impossible de créer le lien d'invitation.",
        noRewardsForCoupon: "Aucun solde disponible pour cette action.",
        couponTooHigh: "Le montant est trop élevé.",
        redeemError: "Impossible d'appliquer la réduction.",
        infoAria: "Infos du portefeuille",

        infoTitle: "Comment fonctionne le portefeuille ?",
        infoWallet:
          "Cet écran de portefeuille est un aperçu. La distribution de cashback/coupons n’est pas encore active et il n’y a pas de retrait (IBAN).",
        infoCoupon:
          "La création/utilisation de coupons (et la conversion des récompenses) sera activée après validation.",
        infoDiscount:
          "Pour l’instant, nous testons seulement la recherche du meilleur prix et la redirection. Quand les récompenses seront actives, les règles seront publiées ici.",
        infoReferral:
          "Le système d’invitation est prêt ; lorsque les récompenses seront activées, les gains apparaîtront ici.",

        walletTabs: {
          wallet: "Portefeuille",
          actions: "Mouvements",
          orders: "Commandes"
        },

        historyTitle: "Historique du portefeuille",
        historyEmpty: "Aucun mouvement enregistré.",
        historyUnavailable: "Historique indisponible ou aucun enregistrement.",
        historyError: "Erreur lors du chargement de l’historique.",
        mustLoginHistory: "Veuillez vous connecter pour voir l’historique.",
        txOrderRef: "Commande :",
        txUnknownDate: "Aucune date",

        txType: {
          deposit: "Dépôt",
          reward: "Récompense",
          cashback: "Cashback",
          coupon: "Coupon",
          order: "Commande",
          referral: "Récompense d’invitation",
          withdraw: "Retrait"
        },

        shareWithFriends: "Partager le lien",

        share: {
          whatsapp: "WhatsApp",
          telegram: "Telegram",
          x: "X",
          facebook: "Facebook",
          instagram: "Instagram"
        },

        motto:
          "<span style='color:#FFD700;'>Bientôt :</span> récompenses/coupons/parrainage. Pour l’instant, trouve le meilleur prix et teste la redirection."
      },

      orders: {
        title: "Mes commandes",
        empty: "Aucune commande suivie pour le moment.",
        mustLogin: "Veuillez vous connecter pour voir vos commandes.",
        status: {
          pending: "En attente",
          paid: "Payé",
          shipped: "Expédié",
          completed: "Terminé",
          canceled: "Annulé",

        }
      }
    }
  },

  // ======================== RUSSIAN ========================
  ru: {
    translation: {
      "yazman yeterli,": "Просто напиши,",
      gerisini: "остальное",
      "halleder.": "я сделаю.",

      username: "Пользователь",
      Puan: "Баллы",

      loading: "Загрузка…",
      cameraSearch: "Поиск по камере",
      sloganFull: "Просто напишите — остальное сделает Sono.",

      site: {
        about: "О нас",
        how: "Как это работает?",
        contact: "Контакты"
      },

      // ✅ merged legal
      legal: {
        badge: "Правовые",
        home: "← На главную",
        updatedAt: "Обновлено",
        privacy: "Конфиденциальность",
        cookies: "Файлы cookie",
        affiliate: "Affiliate-раскрытие",
        terms: "Условия использования"
      },

      fillAllFields: "Заполните все поля.",
      networkError: "Ошибка сети. Попробуйте ещё раз.",
      processFailed: "Процесс завершился с ошибкой.",
      emailRequired: "Требуется e-mail.",
      resetCodeSent: "Код отправлен.",
      missingFields: "Заполните все поля.",
      updateFailed: "Ошибка обновления.",
      passwordUpdated: "Пароль обновлён.",

      voiceSearch: "Голосовой поиск",
      visualSearch: "Визуальный поиск",
      qrSearch: "Поиск по QR",

      badges: {
        title: "Значки",
        silver: "Серебро",
        gold: "Золото",
        platinum: "Платина",
        progress: "Прогресс",
        earnMore:
          "Покупайте или приглашайте друзей, чтобы заработать больше."
      },

      ph: {
        searchProduct: "Искать товар или услугу",
        findHotel: "Искать отели...",
        compareFlight: "Сравнить авиабилеты...",
        exploreElectronics: "Исследовать электронику...",
        findCarRental: "Найти аренду авто..."
      },

      placeholder: {
        hotel: "Искать отели...",
        car: "Найти аренду авто...",
        food: "Заказать еду...",
        tour: "Найти туры...",
        insurance: "Сравнить страховки...",
        estate: "Исследовать недвижимость...",
        electronic: "Сравнить электронику..."
      },

      search: {
        voice: "Голосовой поиск",
        camera: "Поиск по камере",
        qr: "Поиск по QR",
        search: "Искать",
        voiceNotSupported:
          "Браузер не поддерживает распознавание речи.",
        voiceStarted: "Голосовой поиск начался — говорите.",
        voiceHeardPrefix: "Я услышала:",
        voiceConfirmQuestion: "Искать это?",
        voiceConfirmToast: "Услышала — подтверди, чтобы искать.",
        voiceDone: "Понял — ищу.",
        voiceStopped: "Голосовой поиск остановлен.",
        voiceError: "Ошибка голосового поиска.",
        searching: "Идёт поиск…",
        searchError: "Поиск не удался. Попробуйте ещё раз.",
        badQuery: "Некорректный запрос. Попробуйте ещё раз.",
        imageAnalyzing: "Анализ изображения…",
        imageDetected: "По изображению похоже на: {{query}}",
        // ✅ Панель подтверждения камеры (App.jsx)
        imageDetectedPrefix: "По изображению я понял:",
        imageWeakGuess: "Не уверен, но похоже на:",
        confirmQuestion: "Вы хотите выполнить этот поиск?",
        confirmSearch: "Искать",
        editQuery: "Редактировать",
        searchNow: "Поиск",
        edit: "Редактировать",
        cancel: "Отмена",
        cameraError: "Анализ изображения не удался. Попробуйте ещё раз."
      },

      // ✅ qrScanner (RU)
      qrScanner: {
        noCameraTitle: "Камера недоступна",
        noCameraBody: "Камера не найдена или доступ к ней не разрешён.",
        retry: "Повторить",
        lastRead: "Последнее сканирование:",
        torchTurnOn: "🔦 Включить фонарик",
        torchTurnOff: "🔦 Выключить фонарик",
        help: "Поместите QR-код или штрих-код в рамку. По обнаружении поиск запустится автоматически.",
        starting: "Открываю камеру…",
        scanning: "Сканирование…",
        detected: "Код обнаружен.",
        analyzing: "Анализ кода…",
        startingSearch: "Запускаю поиск…",
        closing: "Закрываю…",
        countdown: "{{count}}с",
        httpsRequired:
          "Для использования камеры требуется защищённое соединение (HTTPS).",
        videoNotFound: "Элемент видео не найден.",
        cameraDenied: "Доступ к камере запрещён: {{msg}}",
        torchNotSupported: "Фонарик не поддерживается на этом устройстве.",
        torchError: "Не удалось управлять фонариком"
      },

      smartGreeting: {
        hello: "Привет {{name}}",
        t1: "Показываю топ-предложения в твоём регионе",
        t2: "Лучшая цена от проверенного продавца",
        t3: "Сравнивай быстро — экономь время",
        t4: "Можно посмотреть другие страны",
        trigger1: "Показываю топ-предложения в твоём регионе",
        trigger2: "Лучшая цена от проверенного продавца",
        trigger3: "Сравнивай быстро — экономь время",
        trigger4: "Можно посмотреть другие страны"
      },

      slogan: {
        full: "Просто напиши, остальное я 😊 сделаю."
      },

      greeting: {
        morning: "Доброе утро ☀️",
        afternoon: "Добрый день 🙂",
        evening: "Добрый вечер 🌙",
        night: "Спокойной ночи 😴"
      },

      trigger: {
        writeSono: "Пиши, а Sono найдёт.",
        discoverDeals: "Открой лучшие предложения.",
        youTypeIFind: "Ты пишешь — я нахожу.",
        readyToSave: "Готов экономить?",
        aiWithYou: "ИИ рядом.",
        customShowcase: "Готовлю твою витрину..."
      },

      header: {
        chooseLanguage: "Выбор языка",
        wallet: "Кошелёк"
      },

      auth: {
        login: "Войти",
        logout: "Выйти",
        register: "Регистрация",
        forgotPassword: "Забыли пароль?",

        email: "E-mail",
        emailRequired: "Требуется email.",
        password: "Пароль",
        nameSurname: "Имя и фамилия",
        inviteCode: "Код приглашения",
        newPassword: "Новый пароль",
        enterResetCode: "Введите код",
        saveNewPassword: "Сохранить пароль",
        sendResetCode: "Отправить код",

        loading: "Загрузка…",

        loginFailed: "Ошибка входа.",
        registerFailed: "Ошибка регистрации.",
        registerSuccess: "Регистрация успешна, теперь войдите.",
        activationMailSent: "Регистрация успешна! Код активации отправлен.",
        activateTitle: "Активировать аккаунт",
        activationInfoEmail: "введите код, отправленный на этот адрес.",
        activationInfoNoEmail: "Введите e-mail, чтобы получить код.",
        activationCode: "Код активации",
        activateAccount: "Активировать аккаунт",
        activationCodeRequired: "Нужен код активации.",
        activationFailed: "Активация не удалась, проверьте код.",
        activationSuccess: "Ваш аккаунт успешно активирован!",
        resendCode: "Отправить код снова",
        resendFailed: "Не удалось отправить письмо.",
        resendSuccess: "Письмо отправлено снова."
      },

      showcase: {
        best: "Лучшее & надёжное",
        preparing: "Готовлю...",
        aiCumulative: "Рекомендации SonoAI",
        personalizing: "Персонализация…",
        others: "Другие",
        noResults: "Нет результатов."
,
        emptyInfoLine: "Этот сайт помогает быстро найти нужный товар или услугу и сравнить цены.",
        emptyBenefitsTitle: "Твоя выгода:",
        benefitTimeTitle: "Экономит время",
        benefitTimeDesc: "Результаты в одном месте — без обхода множества сайтов.",
        benefitMoneyTitle: "Экономит деньги",
        benefitMoneyDesc: "Выдвигает бюджетные варианты, чтобы не переплачивать.",
        benefitPeaceTitle: "Спокойствие",
        benefitPeaceDesc: "Отсекает нерелевантный мусор и отдаёт приоритет более надёжным источникам."
      },,

      common: {
        loading: "Загрузка…",
        noImage: "Нет изображения",
        noPrice: "Цена у продавца",
        summaryFallback: "Нет описания"
      },

      actions: {
        goToReservation: "Нажать",
        close: "Закрыть",
        clear: "Очистить"
      },

      footerFull: {
        left: "Глобальный помощник сравнения цен.",
        mid: "Щёлкни пальцами, чтобы экономить,",
        right: "остальное я сделаю."
      },

      ai: {
        sono: "Sono AI",
        listen: "Слушать",
        send: "Отправить",
        placeholder: "Введите сообщение...",
        chooseModeTitle: "Выбери режим: Поиск или Вопрос",
        chooseModeSubtitle: "В режиме Поиск я запускаю витрину; в режиме Вопрос — отвечаю надёжной информацией.",
        chooseModeFirst: "Сначала выбери режим: Поиск или Вопрос.",
        chooseModeToast: "Выбери режим, чтобы продолжить.",
        chooseModePlaceholder: "Сначала выбери режим…",
        modeSearch: "Поиск товара/услуги",
        modeChat: "Вопрос / Информация",
        modeActiveSearch: "Режим: Поиск",
        modeActiveChat: "Режим: Вопрос / Чат",
        changeMode: "Сменить режим",
        modeSetSearch: "Ок — режим Поиск включён. Что ищем?",
        modeSetChat: "Ок — режим Вопрос включён. Что хочешь узнать?",
        modeReset: "Режим сброшен.",
        voiceConfirmQuestionChat: "Отправить это?",
        voiceConfirmToastChat: "Я услышал(а) — подтверди отправку.",
        placeholderSearch: "Ищи товар или услугу…",
        placeholderChat: "Задай вопрос…",
        listening: "Слушаю…",
        voiceHeardPrefix: "Я услышала:",
        voiceConfirmQuestion: "Искать это?",
        voiceConfirmToast: "Услышала — подтверди, чтобы искать.",
        voiceDone: "Понял. Ищу…",
        searching: "Ищу…",
        searchError: "Ошибка поиска.",
        analyzing: "Анализ…",
        hello: "Привет, я Sono. Ищите товар/услугу или задайте вопрос — помогу быстро.",
        helloChoose: "Привет, я Sono. Что вы хотите сделать? Найти товар/услугу или задать вопрос.",
        sources: "Источники",
        confidence: "Уверенность",
        lowConfidence: "Низкая уверенность",
        prepping: "Готовлю ответ...",
        ready: "Готово.",
        chatReady: "Ответ готов.",
        thanks: "Пожалуйста 🌸",
        talk: "Говорить",
        error: "Произошла ошибка.",
        noAnswer: "Сейчас не удалось получить ответ.",
        noSpeech: "Браузер не поддерживает распознавание речи.",
        thanksReply: "Пожалуйста, я всегда рядом."
      },

      net: {
        offlineTitle: "Нет подключения к интернету",
        offlineDesc: "Это уведомление не исчезнет, пока связь не вернётся. Продолжим автоматически.",
        onlineTitle: "Соединение восстановлено",
        onlineDesc: "Можно продолжить.",
      },

      vitrine: {
        resultsReady: "Результаты готовы на витрине. Спасибо.",
        noResults: "Извините, ничего не найдено. Попробуйте ещё раз.",
        resultsError: "Во время поиска произошла ошибка. Попробуйте снова.",
      },


      wallet: {
        statusNote:
          "Этот раздел сейчас предназначен только для ссылки приглашения и истории.",
        title: "Кошелёк",
        howTo: "Как заработать?",
        invite: "Пригласить",
        inviteCopied: "Ссылка скопирована: ",
        inviteReady: "Ссылка готова: ",
        enterAmount: "Сумма купона (₽):",
        couponCreated: "Купон создан: ",
        expires: "до:",
        locked: "Откроется после первого заказа.",
        copied: "Скопировано.",
        ready: "Готово.",
        rule: "Первая покупка + приглашение = доход.",
        createCoupon: "Создать купон",
        useCoupon: "Использовать купон",
        couponAmount: "Сумма купона",
        tree: "Дерево приглашений",
        noBadges: "Нет значков.",
        lockedText: "Кошелёк активируется после первой покупки.",
        unlockedText: "Скидка активна.",
        useDiscount: "Использовать скидку",
        discountApplied: "Скидка применена.",
        myBadges: "Мои значки",
        errorGeneric: "Ошибка.",
        noBalance: "Нет баланса.",
        needLogin: "Войдите, чтобы увидеть кошелёк.",
        mustLoginInvite: "Войдите, чтобы создать приглашение.",
        mustLoginCoupon: "Войдите, чтобы создать купон.",
        mustLoginRedeem: "Войдите, чтобы использовать скидку.",

        enterCoupon: "Введите код купона.",
        couponInvalid: "Купон недействителен или недоступен.",
        couponAppliedCashback:
          "Купон применён (предпросмотр). Награды/кэшбэк пока не активны.",
        couponError: "Ошибка при проверке купона.",
        relatedOrder: "Связанный заказ:",
        inviteError: "Не удалось создать ссылку приглашения.",
        noRewardsForCoupon: "Нет доступного баланса для этого действия.",
        couponTooHigh: "Сумма слишком большая.",
        redeemError: "Не удалось применить скидку.",
        infoAria: "Информация о кошельке",

        infoTitle: "Как работает кошелёк?",
        infoWallet:
          "Этот экран кошелька — предварительный просмотр. Начисление cashback/купонов пока не активно, вывода денег (IBAN) нет.",
        infoCoupon:
          "Создание/использование купонов (и конвертация наград) будет доступно после завершения проверок.",
        infoDiscount:
          "Сейчас мы тестируем только поиск лучшей цены и переходы. Когда награды будут включены, правила появятся здесь.",
        infoReferral:
          "Реферальная система готова; после включения наград доходы от приглашений будут отображаться здесь.",

        walletTabs: {
          wallet: "Кошелёк",
          actions: "Операции",
          orders: "Заказы"
        },

        historyTitle: "История кошелька",
        historyEmpty: "Нет записанных операций.",
        historyUnavailable: "История недоступна или пуста.",
        historyError: "Ошибка при загрузке истории.",
        mustLoginHistory: "Войдите, чтобы увидеть историю.",
        txOrderRef: "Заказ:",
        txUnknownDate: "Нет даты",

        txType: {
          deposit: "Пополнение",
          reward: "Награда",
          cashback: "Кэшбэк",
          coupon: "Купон",
          order: "Заказ",
          referral: "Приглашение",
          withdraw: "Снятие"
        },

        shareWithFriends: "Поделиться ссылкой",

        share: {
          whatsapp: "WhatsApp",
          telegram: "Telegram",
          x: "X",
          facebook: "Facebook",
          instagram: "Instagram"
        },

        motto:
          "<span style='color:#FFD700;'>Скоро:</span> награды/купоны/рефералы. Пока — ищи лучшую цену и тестируй переходы."
      },

      orders: {
        title: "Мои заказы",
        empty: "Нет заказов для отслеживания.",
        mustLogin: "Войдите, чтобы увидеть заказы.",
        status: {
          pending: "Ожидает",
          paid: "Оплачено",
          shipped: "Отправлено",
          completed: "Завершено",
          canceled: "Отменено",

        }
      }
    }
  },

  // ======================== ARABIC ========================
  ar: {
    translation: {
      "yazman yeterli,": "اكتب فقط،",
      gerisini: "وسأتولى",
      "halleder.": "الباقي.",

      username: "المستخدم",
      Puan: "النقاط",

      loading: "جارٍ التحميل…",
      cameraSearch: "بحث بالكاميرا",
      sloganFull: "اكتب فقط — وسيتكفّل Sono بالباقي.",

      site: {
        about: "من نحن",
        how: "كيف يعمل؟",
        contact: "تواصل معنا"
      },

      // ✅ merged legal
      legal: {
        badge: "قانوني",
        home: "← الرئيسية",
        updatedAt: "تم التحديث",
        privacy: "الخصوصية",
        cookies: "ملفات تعريف الارتباط",
        affiliate: "إفصاح الإحالة",
        terms: "شروط الاستخدام"
      },

      fillAllFields: "يرجى تعبئة جميع الحقول.",
      networkError: "حدث خطأ في الشبكة. حاول مرة أخرى.",
      processFailed: "فشلت العملية.",
      emailRequired: "البريد الإلكتروني مطلوب.",
      resetCodeSent: "تم إرسال رمز التحقق.",
      missingFields: "يرجى تعبئة جميع الحقول.",
      updateFailed: "فشل التحديث.",
      passwordUpdated: "تم تحديث كلمة المرور بنجاح.",

      voiceSearch: "بحث صوتي",
      visualSearch: "بحث بصري",
      qrSearch: "بحث عبر QR",

      badges: {
        title: "الشارات",
        silver: "فضي",
        gold: "ذهبي",
        platinum: "بلاتيني",
        progress: "التقدم",
        earnMore: "تسوّق أو ادعُ أصدقاءك لكسب المزيد."
      },

      ph: {
        searchProduct: "ابحث عن منتج أو خدمة",
        findHotel: "ابحث عن الفنادق...",
        compareFlight: "قارن الرحلات...",
        exploreElectronics: "استكشف الإلكترونيات...",
        findCarRental: "ابحث عن تأجير السيارات..."
      },

      placeholder: {
        hotel: "ابحث عن الفنادق...",
        car: "ابحث عن تأجير السيارات...",
        food: "اطلب الطعام...",
        tour: "ابحث عن الجولات...",
        insurance: "قارن التأمين...",
        estate: "استكشف العقارات...",
        electronic: "قارن الإلكترونيات..."
      },

      search: {
        voice: "بحث صوتي",
        camera: "بحث بالكاميرا",
        qr: "بحث عبر QR",
        search: "بحث",
        voiceNotSupported: "المتصفح لا يدعم التعرف على الصوت.",
        voiceStarted: "بدأ البحث الصوتي — يمكنك التحدث الآن.",
        voiceHeardPrefix: "سمعت:",
        voiceConfirmQuestion: "هل أبحث عن هذا؟",
        voiceConfirmToast: "سمعتك — أكّد لأبحث.",
        voiceDone: "تم — جارٍ البحث.",
        voiceStopped: "تم إيقاف البحث الصوتي.",
        voiceError: "حدث خطأ في البحث الصوتي.",
        searching: "جارٍ البحث…",
        searchError: "فشل البحث. حاول مرة أخرى.",
        badQuery: "نص بحث غير صالح. حاول مرة أخرى.",
        imageAnalyzing: "جارٍ تحليل الصورة…",
        imageDetected: "من الصورة أظن: {{query}}",
        // ✅ شريط تأكيد الكاميرا (App.jsx)
        imageDetectedPrefix: "مما فهمته من الصورة:",
        imageWeakGuess: "لست متأكدًا تمامًا، لكن يبدو أنه:",
        confirmQuestion: "هل تريد إجراء هذا البحث؟",
        confirmSearch: "بحث",
        editQuery: "تعديل",
        searchNow: "ابحث",
        edit: "تعديل",
        cancel: "إلغاء",
        cameraError: "فشل تحليل الصورة. حاول مرة أخرى."
      },

      // ✅ qrScanner (AR)
      qrScanner: {
        noCameraTitle: "الكاميرا غير متاحة",
        noCameraBody: "لم يتم العثور على كاميرا أو لم يتم منح الإذن.",
        retry: "أعد المحاولة",
        lastRead: "آخر مسح:",
        torchTurnOn: "🔦 تشغيل الفلاش",
        torchTurnOff: "🔦 إيقاف الفلاش",
        help: "ضع رمز QR أو الباركود داخل الإطار. سيتم تشغيل البحث تلقائيًا عند اكتشافه.",
        starting: "جارٍ فتح الكاميرا…",
        scanning: "جارٍ المسح…",
        detected: "تم اكتشاف الرمز.",
        analyzing: "جارٍ تحليل الرمز…",
        startingSearch: "جارٍ بدء البحث…",
        closing: "جارٍ الإغلاق",
        countdown: "{{count}}ث",
        httpsRequired: "يلزم اتصال آمن (HTTPS) لاستخدام الكاميرا.",
        videoNotFound: "تعذّر العثور على عنصر الفيديو.",
        cameraDenied: "تم رفض الوصول إلى الكاميرا: {{msg}}",
        torchNotSupported: "الفلاش غير مدعوم على هذا الجهاز.",
        torchError: "تعذّر التحكم في الفلاش"
      },

      smartGreeting: {
        hello: "مرحبًا {{name}}",
        t1: "أعرض أشهر العروض في منطقتك",
        t2: "أفضل سعر من أكثر البائعين موثوقية",
        t3: "قارن فورًا ووفر الوقت",
        t4: "يمكنك أيضًا استكشاف دول أخرى",
        trigger1: "أعرض أشهر العروض في منطقتك",
        trigger2: "أفضل سعر من أكثر البائعين موثوقية",
        trigger3: "قارن فورًا ووفر الوقت",
        trigger4: "يمكنك أيضًا استكشاف دول أخرى"
      },

      slogan: {
        full: "اكتب فقط، وسأتولى الباقي 😊."
      },

      greeting: {
        morning: "صباح الخير ☀️",
        afternoon: "مساء الخير 🙂",
        evening: "مساء الخير 🌙",
        night: "تصبح على خير 😴"
      },

      trigger: {
        writeSono: "اكتب فقط وسونو سيجد.",
        discoverDeals: "اكتشف أفضل العروض.",
        youTypeIFind: "أنت تكتب وأنا أجد.",
        readyToSave: "جاهز لتوفير الوقت والمال؟",
        aiWithYou: "الذكاء الاصطناعي معك.",
        customShowcase: "أُحضّر واجهتك المخصصة..."
      },

      header: {
        chooseLanguage: "اختر اللغة",
        wallet: "المحفظة"
      },

      auth: {
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        register: "إنشاء حساب",
        forgotPassword: "نسيت كلمة المرور",

        email: "البريد الإلكتروني",
        emailRequired: "البريد الإلكتروني مطلوب.",
        password: "كلمة المرور",
        nameSurname: "الاسم الكامل",
        inviteCode: "رمز الدعوة",
        newPassword: "كلمة مرور جديدة",
        enterResetCode: "أدخل رمز التحقق",
        saveNewPassword: "حفظ كلمة المرور",
        sendResetCode: "إرسال الرمز",

        loading: "جارٍ التحميل…",

        loginFailed: "فشل تسجيل الدخول.",
        registerFailed: "فشل التسجيل.",
        registerSuccess: "تم التسجيل بنجاح، يمكنك الآن تسجيل الدخول.",
        activationMailSent:
          "تم إنشاء الحساب! تم إرسال رمز التفعيل إلى بريدك الإلكتروني.",
        activateTitle: "تفعيل الحساب",
        activationInfoEmail:
          "يرجى إدخال رمز التفعيل المرسل إلى هذا البريد.",
        activationInfoNoEmail:
          "يرجى إدخال بريدك الإلكتروني لاستلام رمز التفعيل.",
        activationCode: "رمز التفعيل",
        activateAccount: "تفعيل الحساب",
        activationCodeRequired: "رمز التفعيل مطلوب.",
        activationFailed: "فشل التفعيل، يرجى التحقق من الرمز.",
        activationSuccess: "تم تفعيل حسابك بنجاح!",
        resendCode: "إعادة إرسال الرمز",
        resendFailed: "تعذّر إرسال الرسالة.",
        resendSuccess: "تم إرسال الرسالة مرة أخرى."
      },

      showcase: {
        best: "الأفضل & الأكثر موثوقية",
        preparing: "يتم التحضير...",
        aiCumulative: "اقتراحات SonoAI",
        personalizing: "جارٍ التخصيص…",
        others: "آخرون",
        noResults: "لا توجد نتائج."
,
        emptyInfoLine: "يساعدك هذا الموقع على العثور بسرعة على المنتج أو الخدمة التي تبحث عنها ومقارنة الأسعار.",
        emptyBenefitsTitle: "الفائدة لك:",
        benefitTimeTitle: "يوفر الوقت",
        benefitTimeDesc: "ترى النتائج في مكان واحد بدلًا من زيارة مواقع متعددة.",
        benefitMoneyTitle: "يوفر المال",
        benefitMoneyDesc: "يبرز الخيارات الاقتصادية حتى لا تدفع أكثر من اللازم.",
        benefitPeaceTitle: "راحة البال",
        benefitPeaceDesc: "يصفّي النتائج غير ذات الصلة ويعطي أولوية للمصادر الأكثر موثوقية."
      },,

      common: {
        loading: "جارٍ التحميل…",
        noImage: "لا توجد صورة",
        noPrice: "السعر عند البائع",
        summaryFallback: "لا توجد خلاصة"
      },

      actions: {
        goToReservation: "اضغط",
        close: "إغلاق",
        clear: "مسح"
      },

      footerFull: {
        left: "مساعد مقارنة الأسعار العالمي.",
        mid: "اضغط بإصبعك لتوفير الوقت والمال،",
        right: "وسأتولى الباقي."
      },

      ai: {
        sono: "Sono AI",
        listen: "استمع",
        send: "إرسال",
        placeholder: "اكتب رسالة...",
        chooseModeTitle: "اختر وضعًا: بحث أو سؤال",
        chooseModeSubtitle: "في وضع البحث أطلق البحث في الواجهة؛ وفي وضع السؤال أجيب بمعلومات موثوقة.",
        chooseModeFirst: "اختر وضعًا أولًا: بحث أو سؤال.",
        chooseModeToast: "اختر وضعًا للمتابعة.",
        chooseModePlaceholder: "اختر وضعًا أولًا…",
        modeSearch: "ابحث عن منتج/خدمة",
        modeChat: "اسأل / معلومات",
        modeActiveSearch: "الوضع: بحث",
        modeActiveChat: "الوضع: معلومات / دردشة",
        changeMode: "تغيير الوضع",
        modeSetSearch: "حسنًا — وضع البحث مُفعّل. ماذا نبحث؟",
        modeSetChat: "حسنًا — وضع المعلومات مُفعّل. اسألني.",
        modeReset: "تمت إعادة تعيين الوضع.",
        voiceConfirmQuestionChat: "أأرسل هذا؟",
        voiceConfirmToastChat: "سمعتك — أكد الإرسال.",
        placeholderSearch: "ابحث عن منتج أو خدمة…",
        placeholderChat: "اسأل سؤالًا…",
        listening: "أستمع…",
        voiceHeardPrefix: "سمعت:",
        voiceConfirmQuestion: "هل أبحث عن هذا؟",
        voiceConfirmToast: "سمعتك — أكّد لأبحث.",
        voiceDone: "حسنًا. جارٍ البحث…",
        searching: "جارٍ البحث…",
        searchError: "خطأ في البحث.",
        analyzing: "جارٍ التحليل…",
        hello: "مرحبًا، أنا Sono. ابحث عن منتج/خدمة أو اسأل أي سؤال — سأساعدك بسرعة.",
        helloChoose: "مرحبًا، أنا Sono. ماذا تريد أن تفعل؟ ابحث عن منتج/خدمة أو اطرح سؤالًا.",
        sources: "المصادر",
        confidence: "درجة الثقة",
        lowConfidence: "ثقة منخفضة",
        prepping: "أحضّر الإجابة...",
        ready: "جاهز.",
        chatReady: "الإجابة جاهزة.",
        thanks: "على الرحب والسعة 🌸",
        talk: "تحدث",
        error: "حدث خطأ.",
        noAnswer: "تعذّر الحصول على إجابة الآن.",
        noSpeech: "المتصفح لا يدعم التعرف على الصوت.",
        thanksReply: "على الرحب والسعة، أنا دائمًا هنا."
      },

      net: {
        offlineTitle: "لا يوجد اتصال بالإنترنت",
        offlineDesc: "سيبقى هذا التنبيه حتى عودة الاتصال. سنستأنف تلقائيًا بعد ذلك.",
        onlineTitle: "عاد الاتصال بالإنترنت",
        onlineDesc: "يمكنك المتابعة.",
      },

      vitrine: {
        resultsReady: "النتائج جاهزة في الواجهة. شكرًا لك.",
        noResults: "عذرًا، لم يتم العثور على نتائج. جرّب شيئًا آخر.",
        resultsError: "حدث خطأ أثناء البحث. حاول مرة أخرى.",
      },


      wallet: {
        statusNote: "هذا القسم مخصص حاليًا فقط لرابط الدعوة والسجل.",
        title: "محفظتي",
        howTo: "كيف أكسب؟",
        invite: "دعوة",
        inviteCopied: "تم نسخ رابط الدعوة: ",
        inviteReady: "رابط الدعوة جاهز: ",
        enterAmount: "قيمة القسيمة (₺):",
        couponCreated: "تم إنشاء القسيمة: ",
        expires: "حتى:",
        locked: "تُفتح بعد أول طلب مكتمل.",
        copied: "تم النسخ.",
        ready: "جاهز.",
        rule: "أول عملية شراء + دعوة = أرباح.",
        createCoupon: "إنشاء قسيمة",
        useCoupon: "استخدام القسيمة",
        couponAmount: "قيمة القسيمة",
        tree: "شجرة الدعوات",
        noBadges: "لا توجد شارات.",
        lockedText: "تُفتح المحفظة بعد أول عملية شراء.",
        unlockedText: "الخصم مفعل.",
        useDiscount: "استخدم الخصم",
        discountApplied: "تم تطبيق الخصم.",
        myBadges: "شاراتي",
        errorGeneric: "حدث خطأ.",
        noBalance: "لا يوجد رصيد.",
        needLogin: "يرجى تسجيل الدخول لرؤية محفظتك.",
        mustLoginInvite: "يجب تسجيل الدخول لإنشاء الدعوة.",
        mustLoginCoupon: "يجب تسجيل الدخول لإنشاء قسيمة.",
        mustLoginRedeem: "يجب تسجيل الدخول لاستخدام الخصم.",

        enterCoupon: "يرجى إدخال رمز القسيمة.",
        couponInvalid: "القسيمة غير صالحة أو لا يمكن استخدامها.",
        couponAppliedCashback:
          "تم تطبيق القسيمة (معاينة). المكافآت/الكاش باك غير مفعّلة بعد.",
        couponError: "حدث خطأ أثناء التحقق من القسيمة.",
        relatedOrder: "الطلب المرتبط:",
        inviteError: "تعذر إنشاء رابط الدعوة.",
        noRewardsForCoupon: "لا يوجد رصيد متاح لهذا الإجراء.",
        couponTooHigh: "المبلغ كبير جدًا.",
        redeemError: "تعذر تطبيق الخصم.",
        infoAria: "معلومات المحفظة",

        infoTitle: "كيف تعمل هذه المحفظة؟",
        infoWallet:
          "هذه شاشة محفظة تجريبية. توزيع الكاشباك/القسائم غير مفعّل بعد، ولا يوجد سحب أموال (IBAN).",
        infoCoupon:
          "إنشاء/استخدام القسائم (وتحويل المكافآت) سيتاح بعد اكتمال الموافقات.",
        infoDiscount:
          "حالياً نختبر فقط البحث عن أفضل سعر وعملية التحويل. عند تفعيل المكافآت سيتم نشر القواعد هنا.",
        infoReferral:
          "نظام الدعوات جاهز؛ عند تفعيل المكافآت ستظهر أرباح الإحالات هنا.",

        walletTabs: {
          wallet: "المحفظة",
          actions: "العمليات",
          orders: "الطلبات"
        },

        historyTitle: "سجل المحفظة",
        historyEmpty: "لا توجد عمليات مسجلة.",
        historyUnavailable: "السجل غير متاح أو فارغ.",
        historyError: "حدث خطأ أثناء تحميل السجل.",
        mustLoginHistory: "يجب تسجيل الدخول لرؤية سجل المحفظة.",
        txOrderRef: "طلب:",
        txUnknownDate: "لا يوجد تاريخ",

        txType: {
          deposit: "إيداع",
          reward: "مكافأة",
          cashback: "استرداد",
          coupon: "قسيمة",
          order: "طلب",
          referral: "دعوة",
          withdraw: "سحب"
        },

        shareWithFriends: "مشاركة الرابط",

        share: {
          whatsapp: "WhatsApp",
          telegram: "Telegram",
          x: "X",
          facebook: "Facebook",
          instagram: "Instagram"
        },

        motto:
          "<span style='color:#FFD700;'>ملاحظة:</span> المكافآت والكاش باك والقسائم غير مفعّلة بعد. حالياً اعثر على أفضل سعر واختبر التحويل."
      },

      orders: {
        title: "طلباتي",
        empty: "لا توجد طلبات حالياً.",
        mustLogin: "يجب تسجيل الدخول لرؤية طلباتك.",
        status: {
          pending: "قيد الانتظار",
          paid: "مدفوع",
          shipped: "تم الشحن",
          completed: "مكتمل",
          canceled: "أُلغي",

        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "tr",
    detection: {
      order: ["querystring", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"]
    },
    interpolation: { escapeValue: false }
  });

export default i18n;

// EMAIL FİLTRE – kullanıcı adı e-posta ise gizle
export function sanitizeName(name) {
  if (!name) return "";
  const s = String(name).trim();
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  return isEmail ? "" : s;
}

// Backend çeviri servisi varsa fallback
export async function aiTranslate(text, targetLang) {
  try {
    const res = await fetch((API_BASE || "") + "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang })
    });
    const json = await res.json();
    return json && json.ok && json.translated ? json.translated : text;
  } catch {
    return text;
  }
}
