// src/i18n.js
// Çok dilli i18n yapılandırması – temiz ve tam sürüm

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  tr: {
    translation: {
      "yazman yeterli,": "Yazman yeterli,",
      gerisini: "gerisini",
      "halleder.": "halleder.",

      username: "Kullanıcı",
      Puan: "Puan",

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
        searchProduct: "Ürün ara...",
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
        voiceNotSupported: "Tarayıcın ses tanımayı desteklemiyor!"
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
      },

      common: {
        loading: "Yükleniyor…"
      },

      actions: {
        goToReservation: "Tıkla",
        close: "Kapat"
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
        analyzing: "Analiz ediliyor...",
        hello: "Hoş geldiniz, ben Sono.",
        prepping: "Hazırlıyorum...",
        ready: "Hazır.",
        thanks: "Rica ederim 🌸",
        talk: "Konuş",
        error: "Bir hata oluştu.",
        noSpeech: "Tarayıcın ses tanımayı desteklemiyor!",
        thanksReply: "Rica ederim, her zaman buradayım."
      },

      wallet: {
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

        infoTitle: "Bu cüzdan nasıl çalışır?",
        infoWallet:
          "Bu ekran cüzdan altyapısının önizlemesidir. Cashback/kupon dağıtımı şu an aktif değildir ve para çekimi (IBAN) yoktur.",
        infoCoupon:
          "Kupon oluşturma/harcama özelliği (ve ödül dönüşümü) onaylar tamamlandıktan sonra açılacaktır.",
        infoDiscount:
          "Şu an yalnızca en iyi fiyatı bulma ve yönlendirme altyapısını test ediyoruz. Ödül/kupon kuralları aktif olduğunda burada net şekilde yayınlanacaktır.",
        infoReferral:
          "Davet altyapısı hazır; ödüllendirme aktif olduğunda davet kazanımları bu ekranda görünecektir.",

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

        motto:
          "<span style='color:#FFD700;'>Yakında:</span> ödül/kupon/davet sistemi. Şimdilik en iyi fiyatı bul ve yönlendirme altyapısını test et."
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
          canceled: "İptal edildi"
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
        searchProduct: "Search products...",
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
        voiceNotSupported: "Your browser does not support speech recognition!"
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
      },

      common: {
        loading: "Loading…"
      },

      actions: {
        goToReservation: "Click",
        close: "Close"
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
        analyzing: "Analyzing, preparing showcase...",
        hello: "Hello, I am Sono.",
        prepping: "Preparing it for you...",
        ready: "Ready. You may check it on the showcase.",
        thanks: "You're welcome 🌸",
        talk: "Talk",
        error: "Something went wrong.",
        noSpeech: "Your browser does not support speech recognition!",
        thanksReply: "You're welcome, always here for you."
      },

      wallet: {
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

        infoTitle: "How does this wallet work?",
        infoWallet:
          "This wallet screen is a preview. Cashback/coupon distribution is not active yet, and there is no cash withdrawal (IBAN).",
        infoCoupon:
          "Coupon creation/spending (and reward conversion) will open after approvals are completed.",
        infoDiscount:
          "Right now we’re only testing the best-price search and click-out flow. When rewards go live, the rules will be published here.",
        infoReferral: "Invites are ready; once rewards are enabled, referral earnings will appear here.",

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

        motto:
          "<span style='color:#FFD700;'>Coming soon:</span> rewards/coupons/referrals. For now, find the best price and test the routing."
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
          canceled: "Canceled"
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
        searchProduct: "Rechercher des produits...",
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
          "Votre navigateur ne supporte pas la reconnaissance vocale."
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
        activationInfoEmail:
          "veuillez saisir le code reçu à cette adresse.",
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
      },

      common: {
        loading: "Chargement…"
      },

      actions: {
        goToReservation: "Cliquez",
        close: "Fermer"
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
        analyzing: "Analyse…",
        hello: "Bienvenue, je suis Sono.",
        prepping: "Sono prépare cela pour vous...",
        ready: "C’est prêt.",
        thanks: "Avec plaisir 🌸",
        talk: "Parler",
        error: "Une erreur s'est produite.",
        noSpeech:
          "Votre navigateur ne supporte pas la reconnaissance vocale.",
        thanksReply: "Avec plaisir, je suis toujours là."
      },

      wallet: {
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
        needLogin:
          "Veuillez vous connecter pour voir le portefeuille.",
        mustLoginInvite:
          "Connexion requise pour créer une invitation.",
        mustLoginCoupon:
          "Connexion requise pour créer un coupon.",
        mustLoginRedeem:
          "Connexion requise pour utiliser une réduction.",

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
        historyUnavailable:
          "Historique indisponible ou aucun enregistrement.",
        historyError:
          "Erreur lors du chargement de l’historique.",
        mustLoginHistory:
          "Veuillez vous connecter pour voir l’historique.",
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

        motto:
          "<span style='color:#FFD700;'>Bientôt :</span> récompenses/coupons/parrainage. Pour l’instant, trouve le meilleur prix et teste la redirection."
      },

      orders: {
        title: "Mes commandes",
        empty: "Aucune commande suivie pour le moment.",
        mustLogin:
          "Veuillez vous connecter pour voir vos commandes.",
        status: {
          pending: "En attente",
          paid: "Payé",
          shipped: "Expédié",
          completed: "Terminé",
          canceled: "Annulé"
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
        searchProduct: "Искать товары...",
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
          "Браузер не поддерживает распознавание речи."
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
        registerSuccess:
          "Регистрация успешна, теперь войдите.",
        activationMailSent:
          "Регистрация успешна! Код активации отправлен.",
        activateTitle: "Активировать аккаунт",
        activationInfoEmail:
          "введите код, отправленный на этот адрес.",
        activationInfoNoEmail:
          "Введите e-mail, чтобы получить код.",
        activationCode: "Код активации",
        activateAccount: "Активировать аккаунт",
        activationCodeRequired: "Нужен код активации.",
        activationFailed:
          "Активация не удалась, проверьте код.",
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
      },

      common: {
        loading: "Загрузка…"
      },

      actions: {
        goToReservation: "Нажать",
        close: "Закрыть"
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
        analyzing: "Анализ…",
        hello: "Добро пожаловать, я Sono.",
        prepping: "Готовлю для вас...",
        ready: "Готово.",
        thanks: "Пожалуйста 🌸",
        talk: "Говорить",
        error: "Произошла ошибка.",
        noSpeech:
          "Браузер не поддерживает распознавание речи.",
        thanksReply: "Пожалуйста, я всегда рядом."
      },

      wallet: {
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
        mustLoginInvite:
          "Войдите, чтобы создать приглашение.",
        mustLoginCoupon:
          "Войдите, чтобы создать купон.",
        mustLoginRedeem:
          "Войдите, чтобы использовать скидку.",

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
        historyUnavailable:
          "История недоступна или пуста.",
        historyError: "Ошибка при загрузке истории.",
        mustLoginHistory:
          "Войдите, чтобы увидеть историю.",
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
          canceled: "Отменено"
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
        searchProduct: "ابحث عن المنتجات...",
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
        voiceNotSupported: "المتصفح لا يدعم التعرف على الصوت."
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
        registerSuccess:
          "تم التسجيل بنجاح، يمكنك الآن تسجيل الدخول.",
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
      },

      common: {
        loading: "جارٍ التحميل…"
      },

      actions: {
        goToReservation: "اضغط",
        close: "إغلاق"
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
        analyzing: "جارٍ التحليل…",
        hello: "مرحبًا، أنا Sono.",
        prepping: "أحضّر لك النتائج...",
        ready: "جاهز.",
        thanks: "على الرحب والسعة 🌸",
        talk: "تحدث",
        error: "حدث خطأ.",
        noSpeech: "المتصفح لا يدعم التعرف على الصوت.",
        thanksReply: "على الرحب والسعة، أنا دائمًا هنا."
      },

      wallet: {
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
        needLogin:
          "يرجى تسجيل الدخول لرؤية محفظتك.",
        mustLoginInvite:
          "يجب تسجيل الدخول لإنشاء الدعوة.",
        mustLoginCoupon:
          "يجب تسجيل الدخول لإنشاء قسيمة.",
        mustLoginRedeem:
          "يجب تسجيل الدخول لاستخدام الخصم.",

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
        historyUnavailable:
          "السجل غير متاح أو فارغ.",
        historyError:
          "حدث خطأ أثناء تحميل السجل.",
        mustLoginHistory:
          "يجب تسجيل الدخول لرؤية سجل المحفظة.",
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

        motto:
          "<span style='color:#FFD700;'>قريباً:</span> المكافآت/القسائم/الإحالات. حالياً اعثر على أفضل سعر واختبر التحويل."
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
          canceled: "أُلغي"
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
    const res = await fetch(
      (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080") +
        "/api/translate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang })
      }
    );
    const json = await res.json();
    return json && json.ok && json.translated ? json.translated : text;
  } catch {
    return text;
  }
}
