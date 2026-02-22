import React, { createContext, useContext, useEffect, useState } from "react";
import { loadLanguage, setLanguage, getLanguage } from "@/i18n";

type Lang = "en" | "si";

type Ctx = {
  lang: Lang;
  version: number;               // ✅ add this
  changeLang: (l: Lang) => Promise<void>;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(getLanguage());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    loadLanguage().then(() => {
      setLang(getLanguage());
      setVersion((v) => v + 1);
    });
  }, []);

  const changeLang = async (l: Lang) => {
    await setLanguage(l);
    setLang(l);
    setVersion((v) => v + 1);   // ✅ force re-render consumers
  };

  return (
    <LanguageContext.Provider value={{ lang, version, changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}