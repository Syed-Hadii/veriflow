import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserCircle2,
} from "lucide-react";
import useTheme from "../../theme/useTheme";
import useLanguage from "../../i18n/useLanguage";
import useAuth from "../../hooks/useAuth";

export default function Topbar() {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { clearAuth } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 px-5 py-4 backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none"
          >
            <option value="en">{t("lang.en")}</option>
            <option value="ru">{t("lang.ru")}</option>
          </select>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] shadow-lg transition hover:scale-[1.02]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}

            <span className="hidden sm:block">
              {isDark ? t("theme.light") : t("theme.dark")}
            </span>
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-lg transition hover:scale-[1.02]"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <UserCircle2 size={18} />
              <span className="hidden sm:block">
                {t("dashboard.topbar.profile")}
              </span>
              <ChevronDown size={16} />
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_60px_rgba(7,17,43,0.14)]">
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
                >
                  <Settings size={16} />
                  {t("dashboard.topbar.settings")}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    clearAuth();
                    navigate("/login");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#ef4444] transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  {t("dashboard.topbar.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
