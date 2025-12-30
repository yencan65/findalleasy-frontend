import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsOfUse() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Kullanım Şartları</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy, ürün ve hizmetleri farklı sağlayıcılardan bulmanıza ve karşılaştırmanıza yardımcı olan bir
        arama/yönlendirme platformudur. FindAllEasy bir satıcı değildir.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Yönlendirme ve satın alma</h2>
      <p className="text-white/80 mb-3">
        Satın alma, ödeme, teslimat, iade ve müşteri hizmetleri süreçleri; yönlendirildiğiniz sağlayıcı tarafından yürütülür.
        FindAllEasy bu süreçlerin tarafı değildir.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Bilgi doğruluğu</h2>
      <p className="text-white/80 mb-3">
        Fiyatlar, stok durumu ve kampanyalar sağlayıcılar tarafından değiştirilebilir. FindAllEasy, mümkün olan en güncel
        veriyi göstermek için çaba gösterir; ancak tüm bilgilerin hatasız ve anlık olacağını garanti etmez.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Affiliate (ortaklık) bağlantıları</h2>
      <p className="text-white/80 mb-3">
        Bazı bağlantılar affiliate bağlantısı olabilir. Bu bağlantılar üzerinden yapılan alışverişlerde komisyon alabiliriz.
        Bu durum size ek maliyet doğurmaz.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Kabul edilebilir kullanım</h2>
      <p className="text-white/80 mb-3">
        Siteyi kötüye kullanmak, sistemleri zorlamak, otomatik istekler ile hizmeti aksatmak, güvenlik açıklarını
        sömürmek ve üçüncü taraf haklarını ihlal etmek yasaktır.
      </p>

      <p className="text-white/70 text-sm mt-8">
        İletişim:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Terms of Use</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy is a search/redirection platform that helps you discover and compare offers across providers.
        FindAllEasy is not a seller.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Outbound links and purchases</h2>
      <p className="text-white/80 mb-3">
        Purchases, payments, delivery, refunds and customer support are handled by the provider you are redirected to.
        FindAllEasy is not a party to those transactions.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Information accuracy</h2>
      <p className="text-white/80 mb-3">
        Prices, availability and promotions may change on the provider side. We work to show up-to-date information,
        but we do not guarantee that all information is error-free or real-time.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Affiliate links</h2>
      <p className="text-white/80 mb-3">
        Some outbound links may be affiliate links. If you purchase through such links, we may earn a commission.
        This does not add extra cost to you.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-[#d4af37]">Acceptable use</h2>
      <p className="text-white/80 mb-3">
        Misuse is prohibited: abusive automation, attempts to disrupt the service, exploitation of vulnerabilities,
        or infringement of third-party rights.
      </p>

      <p className="text-white/70 text-sm mt-8">
        Contact:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </p>
    </>
  );

  // Keep other languages concise but present
  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Conditions d&apos;utilisation</h1>
      <p className="text-white/80 mb-3">
        FindAllEasy est une plateforme de recherche et de redirection (pas un vendeur). Les achats sont effectués sur le
        site du fournisseur.
      </p>
      <p className="text-white/80 mb-3">
        Certaines liens peuvent être affiliés. Une commission peut être perçue sans coût supplémentaire pour vous.
      </p>
      <p className="text-white/70 text-sm mt-8">
        Contact :{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Условия использования</h1>
      <p className="text-white/80 mb-3">
        FindAllEasy — платформа поиска и перенаправления (не продавец). Покупка происходит на сайте поставщика.
      </p>
      <p className="text-white/80 mb-3">
        Некоторые ссылки могут быть партнёрскими. Мы можем получать комиссию без доп. затрат для вас.
      </p>
      <p className="text-white/70 text-sm mt-8">
        Контакты:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">شروط الاستخدام</h1>
      <p className="text-white/80 mb-3">
        FindAllEasy منصة بحث وتحويل وليست جهة بيع. تتم عمليات الشراء على موقع المزوّد.
      </p>
      <p className="text-white/80 mb-3">
        قد تكون بعض الروابط روابط شراكة (Affiliate) وقد نحصل على عمولة دون تكلفة إضافية عليك.
      </p>
      <p className="text-white/70 text-sm mt-8">
        للتواصل:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </p>
    </>
  );

  const CONTENT =
    lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return CONTENT;
}
