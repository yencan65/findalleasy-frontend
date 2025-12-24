// src/components/QRCodeCanvas.jsx
import React from "react";
import { QRCodeCanvas as QRCode } from "qrcode.react";

export default function QRCodeCanvas({ value, size = 180 }) {
  if (!value) {
    console.warn("⚠️ QRCodeCanvas: value boş geldi!");
    return (
      <div className="text-[#d4af37] text-center p-4">
        QR kod verisi bulunamadı
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-6">
      <div className="p-4 rounded-2xl border-2 border-[#d4af37]/80 shadow-[0_0_25px_rgba(212,175,55,0.5)] bg-black/50 backdrop-blur-sm">
        <QRCode
          value={value}
          size={size}
          bgColor="#000000"
          fgColor="#d4af37"
          level="H"
          includeMargin={true}
        />
        <p className="mt-3 text-center text-sm text-[#d4af37]/90 font-semibold tracking-wide">
          Taratarak giriş yap
        </p>
      </div>
    </div>
  );
}
