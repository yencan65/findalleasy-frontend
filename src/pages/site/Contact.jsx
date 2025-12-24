import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const UPDATED_AT = "24 Aralık 2025";
const CONTACT_EMAIL = "findalleasy@gmail.com";

function mailto(subject, body) {
  const s = encodeURIComponent(subject || "");
  const b = encodeURIComponent(body || "");
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${s}&body=${b}`;
}

function TR() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const canSend = useMemo(() => {
    const m = String(message || "").trim();
    return m.length >= 10;
  }, [message]);

  function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    const subject = `FindAllEasy İletişim — ${String(name || "").trim() || "Mesaj"}`;
    const body = [
      `Ad: ${String(name || "").trim()}`,
      `E-posta: ${String(email || "").trim()}`,
      "---",
      String(message || "").trim(),
    ].join("\n");
    mailto(subject, body);
  }

  return (
    <div>
      <h1>İletişim</h1>
      <p className="muted">Son güncelleme: {UPDATED_AT}</p>

      <p>
        Bizimle en hızlı şekilde e‑posta ile iletişime geçebilirsin: {" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>Kısa mesaj gönder</h2>

<form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">Ad (opsiyonel)</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adın"
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">E‑posta (opsiyonel)</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ornek.com"
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">Mesaj</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ne hakkında yazmak istiyorsun? (En az 10 karakter)"
            rows={5}
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <button
          type="submit"
          disabled={!canSend}
          className={`inline-flex items-center justify-center px-5 py-3 rounded-full border transition-all \
            ${
              canSend
                ? "border-[#d4af37]/60 text-black bg-[#d4af37] hover:brightness-110"
                : "border-[#d4af37]/20 text-[#d4af37]/50 bg-black/20 cursor-not-allowed"
            }`}
        >
          E‑posta uygulamamda gönder
        </button>

        <p className="muted">
          Affiliate/komisyon soruların için ayrıca <a href="/affiliate-disclosure">Affiliate Açıklaması</a>
          sayfasına bak.
        </p>
      </form>
    </div>
  );
}

function EN() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const canSend = useMemo(() => {
    const m = String(message || "").trim();
    return m.length >= 10;
  }, [message]);

  function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    const subject = `FindAllEasy Contact — ${String(name || "").trim() || "Message"}`;
    const body = [
      `Name: ${String(name || "").trim()}`,
      `Email: ${String(email || "").trim()}`,
      "---",
      String(message || "").trim(),
    ].join("\n");
    mailto(subject, body);
  }

  return (
    <div>
      <h1>Contact</h1>
      <p className="muted">Last updated: {UPDATED_AT}</p>

      <p>
        The fastest way to reach us is email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>Send a quick message</h2>

<form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">Name (optional)</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">Email (optional)</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <label className="block">
          <div className="text-sm text-[#d4af37]/80 mb-1">Message</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What would you like to tell us? (min 10 chars)"
            rows={5}
            className="w-full rounded-2xl bg-black/30 border border-[#d4af37]/20 px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
          />
        </label>

        <button
          type="submit"
          disabled={!canSend}
          className={`inline-flex items-center justify-center px-5 py-3 rounded-full border transition-all \
            ${
              canSend
                ? "border-[#d4af37]/60 text-black bg-[#d4af37] hover:brightness-110"
                : "border-[#d4af37]/20 text-[#d4af37]/50 bg-black/20 cursor-not-allowed"
            }`}
        >
          Send via email app
        </button>

        <p className="muted">
          For affiliate/commission questions, see <a href="/affiliate-disclosure">Affiliate Disclosure</a>.
        </p>
      </form>
    </div>
  );
}

export default function Contact() {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "tr").toLowerCase();
  return lang.startsWith("en") ? <EN /> : <TR />;
}
