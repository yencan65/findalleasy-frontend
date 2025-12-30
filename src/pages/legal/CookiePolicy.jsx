import React from "react";
import { useTranslation } from "react-i18next";
export default function CookiePolicy() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const UPDATED_AT_TR = "24 Aralık 2025";
  const UPDATED_AT_EN = "Dec 24, 2025";

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Çerez Politikası</h1>
      <p className="text-white/70 text-sm mb-5">Son güncelleme: {UPDATED_AT_TR}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy, kullanıcı deneyimini geliştirmek ve bazı temel işlevleri sağlamak
        için çerezler (cookies) kullanabilir.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Kullandığımız Çerez Türleri</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Gerekli çerezler: Oturum ve temel güvenlik için.</li>
        <li>Tercih çerezleri: Dil gibi tercihleri hatırlamak için.</li>
        <li>Analitik: Hizmeti iyileştirmek için anonim kullanım ölçümleri (varsa).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Kontrol</h2>
      <p className="text-white/80">
        Çerezleri tarayıcı ayarlarınızdan yönetebilir veya silebilirsiniz. Bazı çerezleri
        devre dışı bırakmak, sitenin belirli özelliklerini etkileyebilir.
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Cookie Policy</h1>
      <p className="text-white/70 text-sm mb-5">Last updated: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy may use cookies to improve user experience and provide certain core functions.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Types of Cookies We Use</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Essential cookies: session and basic security.</li>
        <li>Preference cookies: remembering settings such as language.</li>
        <li>Analytics: anonymous usage metrics to improve the service (if enabled).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Control</h2>
      <p className="text-white/80">
        You can manage or delete cookies in your browser settings. Disabling some cookies may affect certain features.
      </p>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Politique relative aux cookies</h1>
      <p className="text-white/70 text-sm mb-5">Dernière mise à jour : {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy peut utiliser des cookies afin d&apos;améliorer l&apos;expérience utilisateur et d&apos;assurer
        certaines fonctions essentielles.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Types de cookies utilisés</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Cookies essentiels : session et sécurité de base.</li>
        <li>Cookies de préférence : mémoriser des réglages comme la langue.</li>
        <li>Analytique : mesures anonymes d&apos;usage pour améliorer le service (si activé).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Contrôle</h2>
      <p className="text-white/80">
        Vous pouvez gérer ou supprimer les cookies via les paramètres de votre navigateur. La désactivation de certains
        cookies peut affecter certaines fonctionnalités.
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Политика использования файлов cookie</h1>
      <p className="text-white/70 text-sm mb-5">Последнее обновление: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy может использовать cookie-файлы для улучшения пользовательского опыта и обеспечения базовых функций.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Какие cookie мы используем</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Необходимые cookie: сессия и базовая безопасность.</li>
        <li>Cookie предпочтений: запоминание настроек, например языка.</li>
        <li>Аналитика: анонимные метрики использования для улучшения сервиса (если включено).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Управление</h2>
      <p className="text-white/80">
        Вы можете управлять или удалять cookie в настройках браузера. Отключение некоторых cookie может повлиять на
        отдельные функции сайта.
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">سياسة ملفات تعريف الارتباط</h1>
      <p className="text-white/70 text-sm mb-5">آخر تحديث: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        قد يستخدم FindAllEasy ملفات تعريف الارتباط لتحسين تجربة المستخدم وتوفير بعض الوظائف الأساسية.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">أنواع ملفات تعريف الارتباط التي نستخدمها</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>ملفات ضرورية: للجلسة والأمان الأساسي.</li>
        <li>ملفات تفضيلات: لتذكر الإعدادات مثل اللغة.</li>
        <li>تحليلات: مقاييس استخدام مجهولة لتحسين الخدمة (إن كانت مفعلة).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">التحكم</h2>
      <p className="text-white/80">
        يمكنك إدارة ملفات تعريف الارتباط أو حذفها من إعدادات المتصفح. قد يؤدي تعطيل بعض الملفات إلى التأثير على بعض
        الميزات.
      </p>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return (
    <LegalShell
      badgeText={
        lang === "tr"
          ? "Çerezler"
          : lang === "en"
          ? "Cookies"
          : lang === "fr"
          ? "Cookies"
          : lang === "ru"
          ? "Cookie"
          : "الكوكيز"
      }
    >
      {CONTENT}
    </LegalShell>
  );
}
