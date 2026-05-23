import { Moon, Sun } from "lucide-react";
import useTheme from "../../theme/useTheme";
import useLanguage from "../../i18n/useLanguage";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-[min(1180px,calc(100%-40px))] items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <img
            src="/assets/logo/veriflow-mark.svg"
            alt="VeriFlow"
            className="w-11"
          />

          <span className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">
            VeriFlow
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="nav-link">
            {t("nav.features")}
          </a>

          <a href="#workflow" className="nav-link">
            {t("nav.workflow")}
          </a>

          <a href="#demo" className="nav-link">
            {t("nav.demo")}
          </a>

          <a href="#brand" className="nav-link">
            {t("nav.brand")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none"
          >
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 font-semibold text-[var(--text)] shadow-lg transition hover:scale-[1.02]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}

            <span className="hidden sm:block">
              {isDark ? t("theme.light") : t("theme.dark")}
            </span>
          </button>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#22D3EE] px-5 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          >
            <span className="hidden sm:block">{t("nav.auth")}</span>

            <span className="sm:hidden">
              {language === "ru" ? "Вход" : "Login"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
