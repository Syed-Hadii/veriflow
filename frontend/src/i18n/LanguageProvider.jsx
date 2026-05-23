import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./languageContext";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

const dictionaries = { en, ru };

const getFromStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
};

const resolvePath = (obj, path) =>
  path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() =>
    getFromStorage("veriflow-lang", "en"),
  );

  useEffect(() => {
    localStorage.setItem("veriflow-lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (key) => resolvePath(dictionaries[language], key) ?? key;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
