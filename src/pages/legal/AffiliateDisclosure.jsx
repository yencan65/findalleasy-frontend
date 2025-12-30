import React from "react";
import { useTranslation } from "react-i18next";
export default function AffiliateDisclosure() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const UPDATED_AT_TR = "24 Aralık 2025";
  const UPDATED_AT_EN = "Dec 24, 2025";

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Affiliate Açıklaması</h1>
      <p className="text-white/70 text-sm mb-5">Son güncelleme: {UPDATED_AT_TR}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy bir karşılaştırma ve yönlendirme platformudur. Bazı bağlantılarımız
        affiliate (ortaklık) bağlantıları olabilir.
      </p>

      <p className="text-white/80 mb-3">
        Bu bağlantılar üzerinden ilgili platformda alışveriş yapmanız halinde, platform
        tarafından komisyon kazanabiliriz. Bu durum, ürün/hizmet fiyatını sizin için
        artırmaz.
      </p>

      <p className="text-white/80">
        Şeffaflık bizim için önemlidir. Sorularınız için{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>{" "}
        adresine yazabilirsiniz.
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Affiliate Disclosure</h1>
      <p className="text-white/70 text-sm mb-5">Last updated: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy is a comparison and redirection platform. Some links may be affiliate links.
      </p>

      <p className="text-white/80 mb-3">
        If you make a purchase on the provider&apos;s website through these links, we may earn a commission.
        This does not increase the price for you.
      </p>

      <p className="text-white/80">
        Transparency matters to us. For questions, email{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Déclaration d&apos;affiliation</h1>
      <p className="text-white/70 text-sm mb-5">Dernière mise à jour : {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy est une plateforme de comparaison et de redirection. Certains liens peuvent être des liens
        d&apos;affiliation.
      </p>

      <p className="text-white/80 mb-3">
        Si vous effectuez un achat sur le site du fournisseur via ces liens, nous pouvons percevoir une commission.
        Cela n&apos;augmente pas le prix pour vous.
      </p>

      <p className="text-white/80">
        La transparence est importante pour nous. Questions :{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">Партнёрское раскрытие</h1>
      <p className="text-white/70 text-sm mb-5">Последнее обновление: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy — платформа сравнения и перенаправления. Некоторые ссылки могут быть партнёрскими (affiliate).
      </p>

      <p className="text-white/80 mb-3">
        Если вы совершаете покупку на сайте поставщика через такие ссылки, мы можем получить комиссию. Для вас цена не
        увеличивается.
      </p>

      <p className="text-white/80">
        Прозрачность важна для нас. Вопросы:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-3 text-[#d4af37]">إفصاح الروابط التابعة</h1>
      <p className="text-white/70 text-sm mb-5">آخر تحديث: {UPDATED_AT_EN}</p>

      <p className="text-white/80 mb-3">
        FindAllEasy منصة مقارنة وتحويل. قد تكون بعض الروابط روابط شراكة (Affiliate).
      </p>

      <p className="text-white/80 mb-3">
        عند الشراء على موقع المزوّد عبر هذه الروابط قد نحصل على عمولة. هذا لا يزيد السعر عليك.
      </p>

      <p className="text-white/80">
        الشفافية مهمة لنا. للاستفسارات:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
        .
      </p>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return (
    <LegalShell
      badgeText={
        lang === "tr"
          ? "Affiliate"
          : lang === "en"
          ? "Affiliate"
          : lang === "fr"
          ? "Affiliation"
          : lang === "ru"
          ? "Affiliate"
          : "أفلييت"
      }
    >
      {CONTENT}
    </LegalShell>
  );
}
