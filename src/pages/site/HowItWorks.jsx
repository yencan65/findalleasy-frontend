import React from "react";
import { useTranslation } from "react-i18next";
export default function HowItWorks() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Nasıl Çalışır?</h1>

      <ol className="list-decimal pl-5 space-y-3 text-white/80">
        <li>
          Aradığınız ürün veya hizmeti yazın (isterseniz ses veya kamera ile de arama
          başlatabilirsiniz).
        </li>
        <li>
          FindAllEasy, ilgili kaynaklardan sonuçları toplar ve tek ekranda listeler.
        </li>
        <li>
          Beğendiğiniz seçeneğe tıklayın; detayları ve satın alma işlemini ilgili
          platformda tamamlarsınız.
        </li>
      </ol>

      <p className="text-white/70 text-sm mt-6">
        Not: Fiyatlar ve stok durumu, yönlendirildiğiniz platformda değişebilir.
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">How It Works</h1>

      <ol className="list-decimal pl-5 space-y-3 text-white/80">
        <li>
          Type what you&apos;re looking for (you can also start a search with voice or
          camera).
        </li>
        <li>
          FindAllEasy gathers results from relevant sources and lists them on one screen.
        </li>
        <li>
          Click an option you like; you&apos;ll view details and complete the purchase on
          the provider&apos;s website.
        </li>
      </ol>

      <p className="text-white/70 text-sm mt-6">
        Note: Prices and availability may change on the provider&apos;s website.
      </p>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Comment ça marche</h1>

      <ol className="list-decimal pl-5 space-y-3 text-white/80">
        <li>
          Saisissez le produit ou le service recherché (vous pouvez aussi lancer une
          recherche par la voix ou la caméra).
        </li>
        <li>
          FindAllEasy collecte les résultats auprès des sources pertinentes et les affiche
          sur un seul écran.
        </li>
        <li>
          Cliquez sur l&apos;option qui vous convient ; vous consultez les détails et
          finalisez l&apos;achat sur le site du fournisseur.
        </li>
      </ol>

      <p className="text-white/70 text-sm mt-6">
        Remarque : Les prix et la disponibilité peuvent changer sur le site du fournisseur.
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Как это работает</h1>

      <ol className="list-decimal pl-5 space-y-3 text-white/80">
        <li>
          Введите запрос (при желании можно начать поиск голосом или с помощью камеры).
        </li>
        <li>
          FindAllEasy собирает результаты из подходящих источников и показывает их на одном экране.
        </li>
        <li>
          Нажмите на понравившийся вариант — детали и покупку вы завершаете на сайте поставщика.
        </li>
      </ol>

      <p className="text-white/70 text-sm mt-6">
        Примечание: цены и наличие могут измениться на сайте поставщика.
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">كيف يعمل</h1>

      <ol className="list-decimal pl-5 space-y-3 text-white/80">
        <li>
          اكتب ما تبحث عنه (ويمكنك أيضًا بدء البحث بالصوت أو بالكاميرا).
        </li>
        <li>
          يقوم FindAllEasy بجمع النتائج من المصادر المناسبة وعرضها على شاشة واحدة.
        </li>
        <li>
          اضغط على الخيار الذي يناسبك؛ ستعرض التفاصيل وتكمل الشراء على موقع المزوّد.
        </li>
      </ol>

      <p className="text-white/70 text-sm mt-6">
        ملاحظة: قد تتغير الأسعار والتوفر على موقع المزوّد.
      </p>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return CONTENT;
}
