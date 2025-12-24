// src/components/context/LanguageContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../../i18n";

const LanguageContext = createContext({ lang: "tr", setLang: () => {} });

export const useLanguage = () => useContext(LanguageContext);

function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || i18n.language || "tr");

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);

    // RTL/LTR kontrolü (Arapça için)
    const html = document.documentElement;
    if (lang.startsWith("ar")) {
      html.setAttribute("dir", "rtl");
      html.classList.add("rtl");
    } else {
      html.setAttribute("dir", "ltr");
      html.classList.remove("rtl");
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
