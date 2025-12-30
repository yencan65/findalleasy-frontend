import React from "react";
import { useTranslation } from "react-i18next";
export default function About() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Hakkımızda</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy, farklı platformlardaki ürün ve hizmetleri tek yerde
        bulmanıza yardımcı olan, yapay zekâ destekli bir arama ve karşılaştırma
        platformudur.
      </p>

      <p className="text-white/80 mb-3">
        Amacımız: aradığınız şeyi hızlıca bulmanız, seçenekleri tek ekranda
        görmeniz ve tıklayıp ilgili platformda işleminizi tamamlamanız.
      </p>

      <p className="text-white/80 mb-3">
        FindAllEasy bir satıcı değildir. Satın alma işlemleri, yönlendirildiğiniz
        platformda gerçekleşir. Biz, fiyat ve seçenekleri karşılaştırmanıza
        yardımcı oluruz.
      </p>

      <p className="text-white/80 mb-3">
        Bazı yönlendirmeler affiliate (ortaklık) bağlantıları içerebilir. Bu
        bağlantılar üzerinden yapılan alışverişlerde platformlardan komisyon
        alabiliriz. Bu durum, kullanıcıya ek maliyet oluşturmaz.
      </p>

      <p className="text-white/80 mb-6">
        Şu anda ödül/cashback/kupon gibi finansal teşvikler sunmuyoruz.
      </p>

      <div className="text-white/70 text-sm">
        İletişim:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">About Us</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy is an AI-powered search and comparison platform that helps you
        discover products and services across different providers in one place.
      </p>

      <p className="text-white/80 mb-3">
        Our goal is simple: find what you need fast, compare options on a single
        screen, and complete the purchase on the provider&apos;s website.
      </p>

      <p className="text-white/80 mb-3">
        FindAllEasy is not a seller. Purchases happen on the website you are
        redirected to. We help you compare prices and options.
      </p>

      <p className="text-white/80 mb-3">
        Some outbound links may be affiliate links. If you buy through these links,
        we may earn a commission from the provider. This does not add any extra
        cost to you.
      </p>

      <p className="text-white/80 mb-6">
        We currently do not offer financial incentives such as rewards, cashback, or coupons.
      </p>

      <div className="text-white/70 text-sm">
        Contact:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">À propos</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy est une plateforme de recherche et de comparaison, alimentée par
        l&apos;IA, qui vous aide à trouver des produits et des services sur différents
        sites au même endroit.
      </p>

      <p className="text-white/80 mb-3">
        Notre objectif est simple : trouver rapidement ce que vous cherchez, comparer
        les options sur un seul écran, puis finaliser votre achat sur le site du
        fournisseur.
      </p>

      <p className="text-white/80 mb-3">
        FindAllEasy n&apos;est pas un vendeur. Les achats ont lieu sur le site vers
        lequel vous êtes redirigé. Nous vous aidons à comparer les prix et les
        alternatives.
      </p>

      <p className="text-white/80 mb-3">
        Certains liens sortants peuvent être des liens d&apos;affiliation. Si vous
        achetez via ces liens, nous pouvons percevoir une commission de la part du
        fournisseur. Cela ne vous coûte rien de plus.
      </p>

      <p className="text-white/80 mb-6">
        Pour le moment, nous ne proposons pas d&apos;incitations financières (récompenses,
        cashback ou coupons).
      </p>

      <div className="text-white/70 text-sm">
        Contact :{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">О нас</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy — это платформа поиска и сравнения, усиленная ИИ, которая помогает
        находить товары и услуги у разных поставщиков в одном месте.
      </p>

      <p className="text-white/80 mb-3">
        Наша цель проста: быстро найти нужное, сравнить варианты на одном экране и
        завершить покупку на сайте выбранного поставщика.
      </p>

      <p className="text-white/80 mb-3">
        FindAllEasy не является продавцом. Покупка происходит на сайте, на который вы
        переходите по ссылке. Мы помогаем сравнивать цены и варианты.
      </p>

      <p className="text-white/80 mb-3">
        Некоторые ссылки могут быть партнёрскими (affiliate). Если вы покупаете по такой
        ссылке, мы можем получить комиссию от поставщика. Для вас это не приводит к
        дополнительным затратам.
      </p>

      <p className="text-white/80 mb-6">
        Сейчас мы не предоставляем финансовые стимулы, такие как награды, кэшбэк или купоны.
      </p>

      <div className="text-white/70 text-sm">
        Контакты:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">من نحن</h1>

      <p className="text-white/80 mb-3">
        FindAllEasy هي منصة بحث ومقارنة مدعومة بالذكاء الاصطناعي تساعدك على اكتشاف المنتجات
        والخدمات من مزوّدين مختلفين في مكان واحد.
      </p>

      <p className="text-white/80 mb-3">
        هدفنا بسيط: العثور على ما تحتاجه بسرعة، مقارنة الخيارات على شاشة واحدة، ثم إكمال
        الشراء على موقع المزوّد.
      </p>

      <p className="text-white/80 mb-3">
        FindAllEasy ليست جهة بيع. تتم عمليات الشراء على الموقع الذي يتم تحويلك إليه. نحن
        نساعدك فقط على مقارنة الأسعار والخيارات.
      </p>

      <p className="text-white/80 mb-3">
        قد تحتوي بعض الروابط الخارجية على روابط شراكة (Affiliate). عند الشراء عبر هذه الروابط
        قد نحصل على عمولة من المزوّد، دون أي تكلفة إضافية عليك.
      </p>

      <p className="text-white/80 mb-6">
        حاليًا لا نقدم حوافز مالية مثل المكافآت أو الكاش باك أو القسائم.
      </p>

      <div className="text-white/70 text-sm">
        للتواصل:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return CONTENT;
}
