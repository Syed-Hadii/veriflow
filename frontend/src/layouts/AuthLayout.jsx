import { Link, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useTheme from "../theme/useTheme";
import useLanguage from "../i18n/useLanguage";

export default function AuthLayout() {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-[min(1180px,calc(100%-40px))] items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/assets/logo/veriflow-mark.svg"
              alt="VeriFlow"
              className="w-11"
            />
            <span className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">
              VeriFlow
            </span>
          </Link>

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
              className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text)] shadow-lg transition hover:scale-[1.02]"
            >
              <span className="hidden sm:block">
                {isDark ? t("theme.light") : t("theme.dark")}
              </span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#22D3EE] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:block">Back to website</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.18),transparent_32%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

        <Outlet />
      </main>
    </div>
  );
}
