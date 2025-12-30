import React from "react";
import { useTranslation } from "react-i18next";
export default function Contact() {
  const { i18n } = useTranslation();
  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const lang = (langRaw.split("-")[0] || "tr").toLowerCase();

  const TR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">İletişim</h1>

      <p className="text-white/80 mb-3">
        Her türlü geri bildirim, iş birliği veya destek talebi için bize e‑posta
        gönderebilirsiniz.
      </p>

      <div className="text-white/70 text-sm mb-6">
        E‑posta:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>

      <p className="text-white/70 text-sm">
        Not: FindAllEasy bir karşılaştırma/yönlendirme platformudur; satış, ödeme ve
        iade süreçleri ilgili platformda yürütülür.
      </p>
    </>
  );

  const EN = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Contact</h1>

      <p className="text-white/80 mb-3">
        For feedback, partnership requests, or support, you can reach us via email.
      </p>

      <div className="text-white/70 text-sm mb-6">
        Email:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>

      <p className="text-white/70 text-sm">
        Note: FindAllEasy is a comparison/redirection platform. Sales, payments, and
        refund processes are handled by the provider you are redirected to.
      </p>
    </>
  );

  const FR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Contact</h1>

      <p className="text-white/80 mb-3">
        Pour toute remarque, demande de partenariat ou besoin d&apos;aide, vous pouvez
        nous contacter par e‑mail.
      </p>

      <div className="text-white/70 text-sm mb-6">
        E‑mail :{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>

      <p className="text-white/70 text-sm">
        Remarque : FindAllEasy est une plateforme de comparaison et de redirection.
        Les ventes, paiements et remboursements sont gérés par le fournisseur vers
        lequel vous êtes redirigé.
      </p>
    </>
  );

  const RU = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">Контакты</h1>

      <p className="text-white/80 mb-3">
        Для обратной связи, запросов о партнёрстве или поддержки напишите нам на почту.
      </p>

      <div className="text-white/70 text-sm mb-6">
        Email:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>

      <p className="text-white/70 text-sm">
        Примечание: FindAllEasy — платформа сравнения и перенаправления. Продажи, оплата и
        возвраты обрабатываются на сайте поставщика, на который вы переходите.
      </p>
    </>
  );

  const AR = (
    <>
      <h1 className="text-2xl font-bold mb-4 text-[#d4af37]">التواصل</h1>

      <p className="text-white/80 mb-3">
        لأي ملاحظات أو طلبات شراكة أو دعم، يمكنك التواصل معنا عبر البريد الإلكتروني.
      </p>

      <div className="text-white/70 text-sm mb-6">
        البريد الإلكتروني:{" "}
        <a className="text-[#d4af37] underline" href="mailto:findalleasy@gmail.com">
          findalleasy@gmail.com
        </a>
      </div>

      <p className="text-white/70 text-sm">
        ملاحظة: FindAllEasy منصة مقارنة وتحويل. تتم عمليات البيع والدفع والاسترجاع لدى المزوّد
        الذي يتم تحويلك إليه.
      </p>
    </>
  );

  const CONTENT = lang === "en" ? EN : lang === "fr" ? FR : lang === "ru" ? RU : lang === "ar" ? AR : TR;

  return CONTENT;
}
