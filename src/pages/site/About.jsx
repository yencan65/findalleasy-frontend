import React from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";

function TR() {
  return (
    <div>
      <h1>Hakkımızda</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        <strong>FindAllEasy</strong>, ürün ve hizmetleri tek yerde keşfetmen, fiyatları/şartları
        karşılaştırman ve satın alma için ilgili sağlayıcıya yönlenmen için tasarlanmış bir
        karşılaştırma & keşif platformudur.
      </p>

      <h2>Ne yapıyoruz?</h2>
      <ul>
        <li>Arama sorgunu analiz eder, ilgili kategoriye uygun sonuçları listeleriz.</li>
        <li>Fiyat/uygunluk gibi sinyalleri bir araya getirir, seçenekleri yan yana sunarız.</li>
        <li>
          Satın alma adımı için seni <strong>üçüncü taraf sağlayıcının</strong> sayfasına yönlendiririz.
        </li>
      </ul>

      <h2>Ne yapmıyoruz?</h2>
      <ul>
        <li>Ödeme almıyoruz; satın alma işlemi FindAllEasy üzerinde tamamlanmaz.</li>
        <li>Kullanıcıyı yanıltan “sahte sonuç / sahte fiyat” üretmeyiz.</li>
        <li>İncentivized trafik (cashback/puan/ödül karşılığı satın alma) şu an yoktur.</li>
      </ul>

      <h2>Affiliate (komisyon) nasıl çalışır?</h2>
      <p>
        Bazı yönlendirmelerde bir affiliate link kullanılabilir. Bu, senin için ekstra bir ücret
        oluşturmaz. Eğer satın alma gerçekleşirse, ilgili sağlayıcı/affiliate network bize komisyon
        ödeyebilir. Detaylar için: <a href="/affiliate-disclosure">Affiliate Açıklaması</a>
      </p>

<h2>İletişim</h2>
      <p>
        Bize ulaş: <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

function EN() {
  return (
    <div>
      <h1>About</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>

      <p>
        <strong>FindAllEasy</strong> is a comparison & discovery platform that helps you find products
        and services, compare offers, and then redirects you to a third‑party provider to complete
        the purchase.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>We analyze your query and list relevant product/service options.</li>
        <li>We compare offers using signals such as price and availability.</li>
        <li>
          Purchases are completed on the <strong>third‑party provider</strong> website or app.
        </li>
      </ul>

      <h2>What we don’t do</h2>
      <ul>
        <li>We do not process payments on FindAllEasy.</li>
        <li>We do not generate fake listings or fake prices.</li>
        <li>No incentivized traffic (cashback/rewards) is offered at this stage.</li>
      </ul>

      <h2>Affiliate (commission) disclosure</h2>
      <p>
        Some outbound links may be affiliate links. This does not increase your price. If a
        purchase happens, we may earn a commission from the provider or affiliate network.
        See: <a href="/affiliate-disclosure">Affiliate Disclosure</a>
      </p>

<h2>Contact</h2>
      <p>
        <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

export default function About() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
