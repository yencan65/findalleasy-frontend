import React from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";

function TR() {
  return (
    <div>
      <h1>Gizlilik Politikası</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        FindAllEasy, kullanıcıların ürün ve hizmetleri keşfetmesine, fiyatları karşılaştırmasına ve
        ilgili sağlayıcılara (merchant / servis sağlayıcı) yönlendirilmesine yardımcı olan bir
        karşılaştırma ve keşif platformudur. Satın alma işlemi FindAllEasy üzerinde değil, ilgili
        üçüncü taraf sağlayıcının web sitesi veya uygulaması üzerinde gerçekleşir.
      </p>

      <h2>1) Hangi verileri topluyoruz?</h2>
      <ul>
        <li>
          <strong>Hesap bilgileri:</strong> kayıt/giriş sırasında e‑posta, ad/soyad gibi bilgiler
          (şifreler şifrelenmiş/hashed şekilde saklanır).
        </li>
        <li>
          <strong>Kullanım verileri:</strong> arama sorguları, görüntülenen içerikler, tıklama
          olayları, oturum bilgileri ve teknik loglar.
        </li>
        <li>
          <strong>Cihaz/teknik veriler:</strong> tarayıcı türü, yaklaşık konum (ülke/şehir
          seviyesinde), dil tercihleri, hata kayıtları.
        </li>
        <li>
          <strong>Affiliate/attribution verileri:</strong> bir sağlayıcıya yönlendirme sırasında
          üretilen clickId gibi takip parametreleri; varsa sipariş numarası/orderId ve dönüşüm
          (conversion) durumu.
        </li>
        <li>
          <strong>Çerezler ve yerel depolama:</strong> tercihleri (dil, bölge), oturum ve güvenlik
          amaçlı verileri saklayabiliriz.
        </li>
      </ul>

      <h2>2) Verileri ne amaçla kullanıyoruz?</h2>
      <ul>
        <li>Hizmeti sunmak, aramaları çalıştırmak ve sonuçları kişiselleştirmek.</li>
        <li>Güvenlik, dolandırıcılık önleme ve sistem bütünlüğünü korumak.</li>
        <li>Hata ayıklama, performans izleme ve ürün geliştirme.</li>
        <li>
          Affiliate yönlendirmelerinde tıklama→satış eşlemesini (attribution) sağlamak ve
          komisyon raporlamasını doğrulamak.
        </li>
      </ul>

      <h2>3) Verileri kimlerle paylaşabiliriz?</h2>
      <ul>
        <li>
          <strong>Üçüncü taraf sağlayıcılar:</strong> kullanıcıyı yönlendirdiğimiz merchant/servis
          sağlayıcılar (bu sağlayıcıların kendi gizlilik politikaları geçerlidir).
        </li>
        <li>
          <strong>Affiliate network’leri:</strong> tıklama ve dönüşüm takibi için gerekli olan
          parametreler (ör. click reference / subId).
        </li>
        <li>
          <strong>Altyapı sağlayıcıları:</strong> barındırma, CDN, güvenlik, e‑posta veya log/telemetri
          servisleri.
        </li>
        <li>
          <strong>Hukuki gereklilikler:</strong> kanuni yükümlülükler kapsamında, yetkili kurumlarla.
        </li>
      </ul>

      <h2>4) Saklama süreleri</h2>
      <p>
        Verileri, hizmetin sunulması, güvenlik ve muhasebe/uzlaşım ihtiyaçları için gerekli olan süre
        boyunca saklarız. Affiliate dönüşümleri ve tıklama kayıtları, olası itiraz/uzlaşım süreçleri
        için belirli bir süre tutulabilir.
      </p>

      <h2>5) Haklarınız</h2>
      <p>
        Yürürlükteki mevzuat (ör. KVKK/GDPR kapsamı) çerçevesinde; verilerinize erişim, düzeltme,
        silme, itiraz ve benzeri haklarınız olabilir. Taleplerinizi aşağıdaki iletişim kanalından
        iletebilirsiniz.
      </p>

      <h2>6) Güvenlik</h2>
      <p>
        Verilerin güvenliği için teknik ve organizasyonel önlemler uygularız. Buna rağmen, internet
        üzerinden yapılan hiçbir aktarım %100 güvenli olduğunu garanti edemez.
      </p>

      <h2>7) İletişim</h2>
      <p>
        Gizlilik ile ilgili talepler için: <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

function EN() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>
      <p>
        FindAllEasy is a comparison & discovery platform that helps users find products and services
        and redirects them to third‑party providers to complete purchases. Purchases are not
        completed on FindAllEasy.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account information (e.g., email, name). Passwords are stored hashed.</li>
        <li>Usage data (searches, clicks, technical logs).</li>
        <li>Device/technical info (browser, language, diagnostics).</li>
        <li>Affiliate attribution data (clickId/subId, orderId, conversion status).</li>
        <li>Cookies/local storage for preferences and security.</li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Provide and improve the service, personalization, security and fraud prevention.</li>
        <li>Measure performance and troubleshoot issues.</li>
        <li>Support click→conversion attribution and reconciliation for affiliate commissions.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We may share limited data with third‑party providers you choose to visit, affiliate networks
        for attribution, infrastructure vendors, and authorities where required by law.
      </p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
