import React from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";

function TR() {
  return (
    <div>
      <h1>Nasıl Çalışır?</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        FindAllEasy, farklı sağlayıcılardaki (merchant / servis sağlayıcı) seçenekleri tek arayüzde
        karşılaştırmanı sağlar. Satın alma işlemi FindAllEasy üzerinde değil, ilgili sağlayıcının
        kendi sitesinde/uygulamasında tamamlanır.
      </p>

      <h2>1) Ara</h2>
      <p>
        Ürün veya hizmeti yaz (ör. "iPhone 15", "otel bodrum", "araç kiralama"). Sistem, sorguyu
        yorumlar ve uygun kategoriye göre sonuç toplamaya çalışır.
      </p>

      <h2>2) Karşılaştır</h2>
      <p>
        Sonuçlar; fiyat, başlık, sağlayıcı ve ilgili detaylarla listelenir. Amacımız seçim yapmanı
        hızlandırmak ve gereksiz sekme/araştırma yükünü azaltmaktır.
      </p>

      <h2>3) Yönlen & Satın Al</h2>
      <p>
        Beğendiğin seçeneğe tıkladığında ilgili sağlayıcının sayfasına yönlenirsin. Ödeme, teslimat,
        iade ve müşteri hizmetleri süreçleri o sağlayıcının politikalarına tabidir.
      </p>

      <h2>Affiliate (komisyon) notu</h2>
      <p>
        Bazı yönlendirmelerde affiliate link kullanılabilir. Bu senin ödediğin fiyatı artırmaz.
        Satın alma gerçekleşirse, sağlayıcı/affiliate network bize komisyon ödeyebilir.
        Detaylar: <a href="/affiliate-disclosure">Affiliate Açıklaması</a>
      </p>

      <h2>İletişim</h2>
      <p>
        Sorun mu var, geri bildirim mi? Yaz: <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

function EN() {
  return (
    <div>
      <h1>How it works</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>

      <p>
        FindAllEasy helps you compare offers from multiple providers (merchants / service providers)
        in one place. Purchases are not completed on FindAllEasy; you complete the transaction on
        the provider’s website or app.
      </p>

      <h2>1) Search</h2>
      <p>
        Type what you’re looking for (e.g., "iPhone 15", "hotel bodrum", "car rental"). We interpret
        the query and try to fetch relevant results.
      </p>

      <h2>2) Compare</h2>
      <p>
        We list options with key details such as price, title, and provider. The goal is to reduce
        tab‑hopping and make decisions faster.
      </p>

      <h2>3) Click out & Purchase</h2>
      <p>
        When you click a result, you’re redirected to the provider. Payment, delivery, refunds and
        customer support are handled by that provider.
      </p>

      <h2>Affiliate note</h2>
      <p>
        Some outbound links may be affiliate links. This does not increase your price. If a purchase
        happens, we may earn a commission. See: <a href="/affiliate-disclosure">Affiliate Disclosure</a>
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

export default function HowItWorks() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
