import React from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";

function TR() {
  return (
    <div>
      <h1>Çerez Politikası</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        FindAllEasy, hizmeti düzgün çalıştırmak, tercihlerinizi hatırlamak ve güvenliği artırmak
        için çerezler ve benzeri teknolojiler (localStorage vb.) kullanabilir.
      </p>

      <h2>1) Hangi tür çerezler kullanılır?</h2>
      <ul>
        <li>
          <strong>Zorunlu:</strong> oturum yönetimi, güvenlik ve temel site fonksiyonları.
        </li>
        <li>
          <strong>Tercih:</strong> dil/bölge gibi seçimlerinizi hatırlamak.
        </li>
        <li>
          <strong>Analitik/performans (opsiyonel):</strong> hata ayıklama, performans ölçümü.
        </li>
        <li>
          <strong>Affiliate takip (bağlantı parametreleri):</strong> üçüncü taraf sağlayıcıya
          yönlendirmelerde clickId/subId gibi parametreler ile attribution sağlanabilir.
        </li>
      </ul>

      <h2>2) Üçüncü taraf çerezleri</h2>
      <p>
        FindAllEasy’den bir satıcı/servis sağlayıcı sitesine geçtiğinizde, o üçüncü tarafın kendi
        çerez politikası geçerli olur. Satın alma işlemi üçüncü taraf sitede gerçekleşir.
      </p>

      <h2>3) Çerezleri nasıl yönetebilirsin?</h2>
      <ul>
        <li>Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsin.</li>
        <li>
          Bazı çerezleri engellemek, oturum/güvenlik gibi özelliklerin çalışmasını etkileyebilir.
        </li>
      </ul>

      <h2>4) İletişim</h2>
      <p>
        Çerezler hakkında: <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

function EN() {
  return (
    <div>
      <h1>Cookie Policy</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>
      <p>
        FindAllEasy may use cookies and similar technologies (such as localStorage) to operate the
        service, remember preferences, and improve security.
      </p>
      <h2>Types</h2>
      <ul>
        <li>Strictly necessary (session, security, core functionality)</li>
        <li>Preferences (language/region)</li>
        <li>Analytics/performance (optional diagnostics)</li>
        <li>Affiliate attribution (clickId/subId parameters on outbound links)</li>
      </ul>
      <h2>Manage cookies</h2>
      <p>You can delete or block cookies using your browser settings. Blocking may affect features.</p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:findalleasy@gmail.com">findalleasy@gmail.com</a>
      </p>
    </div>
  );
}

export default function CookiePolicy() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
