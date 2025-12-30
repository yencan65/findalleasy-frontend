import React from "react";
import { useTranslation } from "react-i18next";
export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const UPDATED_AT_TR = "24 Aralık 2025";
  const UPDATED_AT_EN = "Dec 24, 2025";

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Gizlilik Politikası</h1>
      <p className="text-white/70 text-sm mb-5">Son güncelleme: {UPDATED_AT_TR}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy, kullanıcı gizliliğine saygı duyar. Bu sayfa, hangi verileri
        topladığımızı ve nasıl kullandığımızı özetler.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Toplanan Veriler</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Arama sorguları ve etkileşim verileri (ör. tıklamalar).</li>
        <li>Teknik veriler (IP, tarayıcı türü, cihaz bilgisi, hata logları).</li>
        <li>İsteğe bağlı hesap verileri (e‑posta, kullanıcı adı).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Verilerin Kullanımı</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Hizmeti sağlamak ve iyileştirmek.</li>
        <li>Dolandırıcılık/istismar tespiti ve güvenlik.</li>
        <li>Destek taleplerini yanıtlamak.</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Paylaşım</h2>
      <p className="text-white/80 mb-3">
        Verileri üçüncü taraflara satmayız. Yalnızca hizmeti işletmek için gerekli
        durumlarda (ör. barındırma, analitik) sınırlı paylaşım yapılabilir.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">İletişim</h2>
      <p className="text-white/80">
        Sorularınız için{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>{" "}
        adresine yazabilirsiniz.
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Privacy Policy</h1>
      <p className="text-white/70 text-sm mb-5">Last updated: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy respects your privacy. This page summarizes what data we collect and how we use it.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Data We Collect</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Search queries and interaction data (e.g., clicks).</li>
        <li>Technical data (IP address, browser type, device info, error logs).</li>
        <li>Optional account data (email, username).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">How We Use Data</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>To provide and improve the service.</li>
        <li>Security, abuse, and fraud prevention.</li>
        <li>To respond to support requests.</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Sharing</h2>
      <p className="text-white/80 mb-3">
        We do not sell personal data. Limited sharing may occur only when necessary to operate the service
        (e.g., hosting, analytics).
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Contact</h2>
      <p className="text-white/80">
        For questions, email{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Politique de confidentialité</h1>
      <p className="text-white/70 text-sm mb-5">Dernière mise à jour : {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy respecte votre vie privée. Cette page résume les données que nous collectons et la façon
        dont nous les utilisons.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Données collectées</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Requêtes de recherche et données d&apos;interaction (ex. clics).</li>
        <li>Données techniques (adresse IP, type de navigateur, infos appareil, journaux d&apos;erreurs).</li>
        <li>Données de compte facultatives (e‑mail, nom d&apos;utilisateur).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Utilisation des données</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Fournir et améliorer le service.</li>
        <li>Sécurité, prévention des abus et de la fraude.</li>
        <li>Répondre aux demandes d&apos;assistance.</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Partage</h2>
      <p className="text-white/80 mb-3">
        Nous ne vendons pas de données personnelles. Un partage limité peut avoir lieu uniquement lorsque cela
        est nécessaire au fonctionnement du service (hébergement, analytique, etc.).
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Contact</h2>
      <p className="text-white/80">
        Pour toute question :{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Политика конфиденциальности</h1>
      <p className="text-white/70 text-sm mb-5">Последнее обновление: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy уважает вашу конфиденциальность. Здесь кратко описано, какие данные мы собираем и как
        используем.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Какие данные мы собираем</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Поисковые запросы и данные взаимодействий (например, клики).</li>
        <li>Технические данные (IP‑адрес, тип браузера, информация об устройстве, журналы ошибок).</li>
        <li>Необязательные данные аккаунта (email, имя пользователя).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Как мы используем данные</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>Для предоставления и улучшения сервиса.</li>
        <li>Безопасность и предотвращение злоупотреблений/мошенничества.</li>
        <li>Для ответа на запросы поддержки.</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Передача данных</h2>
      <p className="text-white/80 mb-3">
        Мы не продаём персональные данные. Ограниченная передача возможна только при необходимости для работы
        сервиса (хостинг, аналитика и т.п.).
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">Контакты</h2>
      <p className="text-white/80">
        Вопросы можно отправить на{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">سياسة الخصوصية</h1>
      <p className="text-white/70 text-sm mb-5">آخر تحديث: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        يحترم FindAllEasy خصوصيتك. تلخص هذه الصفحة البيانات التي نجمعها وكيفية استخدامها.
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">البيانات التي نجمعها</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>استعلامات البحث وبيانات التفاعل (مثل النقرات).</li>
        <li>بيانات تقنية (عنوان IP، نوع المتصفح، معلومات الجهاز، سجلات الأخطاء).</li>
        <li>بيانات حساب اختيارية (البريد الإلكتروني، اسم المستخدم).</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">استخدام البيانات</h2>
      <ul className="list-disc pl-5 text-white/80 space-y-2">
        <li>لتقديم الخدمة وتحسينها.</li>
        <li>للأمان ومنع الاحتيال وإساءة الاستخدام.</li>
        <li>للرد على طلبات الدعم.</li>
      </ul>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">المشاركة</h2>
      <p className="text-white/80 mb-3">
        نحن لا نبيع البيانات الشخصية. قد تتم مشاركة محدودة فقط عند الحاجة لتشغيل الخدمة (مثل الاستضافة أو التحليلات).
      </p>

      <h2 className="text-lg font-semibold text-white mt-6 mb-2">التواصل</h2>
      <p className="text-white/80">
        للاستفسارات، راسلنا على{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return CONTENT;
}
