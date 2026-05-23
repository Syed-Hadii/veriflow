import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

const getFromStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    getFromStorage("veriflow-theme", "light"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("veriflow-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
