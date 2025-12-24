import React from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";

function TR() {
  return (
    <div>
      <h1>Affiliate (Ortaklık) Açıklaması</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        FindAllEasy bir ürün/hizmet <strong>satıcısı</strong> değildir. Biz, farklı platformlardaki
        teklifleri bulmanıza ve karşılaştırmanıza yardımcı olur, satın alma işlemi için sizi ilgili
        satıcı/servis sağlayıcıya yönlendiririz.
      </p>

      <h2>Komisyon (affiliate gelir) nasıl çalışır?</h2>
      <p>
        Bazı bağlantılarımız bir affiliate/ortaklık takip bağlantısı olabilir. Bu, ilgili üçüncü
        taraf sağlayıcıdan satın alma yapmanız durumunda FindAllEasy’nin komisyon kazanabileceği
        anlamına gelir.
      </p>

      <h2>Size bir maliyeti var mı?</h2>
      <p>
        Hayır. Affiliate komisyonları genellikle satıcı/affiliate network tarafından ödenir ve
        kullanıcı için ekstra bir ücret oluşturmaz.
      </p>

      <h2>Sıralama ve tarafsızlık</h2>
      <p>
        Amacımız, kullanıcıya <strong>en avantajlı</strong> ve <strong>en güvenilir</strong> seçenekleri
        sunmaktır. Sonuçların sıralanmasında fiyat, güven sinyalleri, kullanıcı deneyimi ve benzeri
        sinyaller kullanılabilir. Bazı sağlayıcılarla ortaklık ilişkimiz olması, otomatik olarak
        onları “en üstte” göstereceğimiz anlamına gelmez.
      </p>

      <h2>Üçüncü taraf siteler</h2>
      <p>
        FindAllEasy’den yönlendirildiğiniz siteler üçüncü taraflara aittir. Satın alma, iade,
        teslimat ve müşteri hizmetleri süreçleri ilgili sağlayıcının politikalarına tabidir.
      </p>

      <h2>İletişim</h2>
      <p>
        Bu açıklama hakkında sorularınız için: <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

function EN() {
  return (
    <div>
      <h1>Affiliate Disclosure</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>

      <p>
        FindAllEasy is not a seller. We help you discover and compare offers and redirect you to
        third‑party providers to complete purchases.
      </p>

      <h2>How commissions work</h2>
      <p>
        Some links may be affiliate links. This means FindAllEasy may earn a commission if you
        make a qualifying purchase on a third‑party provider.
      </p>

      <h2>Does it cost you extra?</h2>
      <p>No. Commissions are typically paid by the merchant/affiliate network and do not add fees.</p>

      <h2>Ranking & neutrality</h2>
      <p>
        We aim to surface the most advantageous and trustworthy options. Rankings may use signals
        like price and trust indicators. An affiliate relationship does not automatically mean a
        provider will be placed at the top.
      </p>

      <h2>Third‑party sites</h2>
      <p>
        Purchases, returns, shipping and customer service are handled by the third‑party provider
        under their own policies.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

export default function AffiliateDisclosure() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
