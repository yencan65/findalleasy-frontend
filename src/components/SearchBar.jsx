import { useEffect, useRef } from "react";
import { Mic, Camera, QrCode, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  onVoiceSearch,
  onCameraSearch,
  onQRSearch,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus?.(), 50);
  }, []);

  const handleSearch = () => {
    const trimmed = String(query || "").trim();
    if (!trimmed) return;
    onSearch?.(trimmed);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const placeholder = t("searchPlaceholder", {
    defaultValue: "Elektroniği keşfet...",
  });

  const ariaSearch = t("search", { defaultValue: "Ara" });

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ✅ Desktop / Tablet (UNCHANGED) */}
      <div className="hidden sm:flex justify-center gap-3 items-center">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-[260px] bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-base outline-none focus:border-yellow-400"
        />

        <button
          onClick={onVoiceSearch}
          className="bg-black/40 border border-yellow-500/40 rounded-lg px-4 py-3 text-yellow-300 hover:bg-yellow-500/10 transition"
          title={t("voiceSearch", { defaultValue: "Sesli arama" })}
        >
          <Mic />
        </button>

        <button
          onClick={onCameraSearch}
          className="bg-black/40 border border-yellow-500/40 rounded-lg px-4 py-3 text-yellow-300 hover:bg-yellow-500/10 transition"
          title={t("cameraSearch", { defaultValue: "Kamera ile ara" })}
        >
          <Camera />
        </button>

        <button
          onClick={onQRSearch}
          className="bg-black/40 border border-yellow-500/40 rounded-lg px-4 py-3 text-yellow-300 hover:bg-yellow-500/10 transition"
          title={t("qrSearch", { defaultValue: "QR ile ara" })}
        >
          <QrCode />
        </button>

        <button
          onClick={handleSearch}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
        >
          <Search size={20} /> {ariaSearch}
        </button>
      </div>

      {/* ✅ Mobile (ONLY) */}
      <div className="sm:hidden flex flex-col gap-3 items-center">
        <div className="relative w-full">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 pr-14 text-white text-base outline-none focus:border-yellow-400"
          />

          {/* Ara butonu input içinde */}
          <button
            type="button"
            onClick={handleSearch}
            aria-label={ariaSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-yellow-500 text-black flex items-center justify-center shadow hover:bg-yellow-400 transition"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Ses/Kamera/QR: Ara butonunun eski satırında */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onVoiceSearch}
            className="bg-black/40 border border-yellow-500/40 rounded-lg h-11 w-11 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/10 transition"
            title={t("voiceSearch", { defaultValue: "Sesli arama" })}
          >
            <Mic size={18} />
          </button>

          <button
            onClick={onCameraSearch}
            className="bg-black/40 border border-yellow-500/40 rounded-lg h-11 w-11 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/10 transition"
            title={t("cameraSearch", { defaultValue: "Kamera ile ara" })}
          >
            <Camera size={18} />
          </button>

          <button
            onClick={onQRSearch}
            className="bg-black/40 border border-yellow-500/40 rounded-lg h-11 w-11 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/10 transition"
            title={t("qrSearch", { defaultValue: "QR ile ara" })}
          >
            <QrCode size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
