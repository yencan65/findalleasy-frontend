import React from "react";
import NeuralStrip from "./NeuralStrip";

// Mobile-only decorative frame that places two calm neural strips
// above and below whatever you wrap (used for Vitrin).

export default function NeuralVitrinFrame({ children, className = "" }) {
  return (
    <div className={`w-full ${className}`}>
      <div className="md:hidden w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-0">
        <div className="h-20 mb-2 rounded-2xl overflow-hidden">
          <NeuralStrip className="opacity-100" />
        </div>
      </div>

      {children}

      <div className="md:hidden w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-0">
        <div className="h-20 mt-2 rounded-2xl overflow-hidden">
          <NeuralStrip className="opacity-100" />
        </div>
      </div>
    </div>
  );
}
