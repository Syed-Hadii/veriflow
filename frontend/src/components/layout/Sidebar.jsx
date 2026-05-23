import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileStack,
  FilePlus2,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import useLanguage from "../../i18n/useLanguage";
import useAuth from "../../hooks/useAuth";

export default function Sidebar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { clearAuth } = useAuth();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const links = [
    {
      to: "/dashboard",
      label: t("dashboard.sidebar.dashboard"),
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/templates",
      label: t("dashboard.sidebar.templates"),
      icon: FileStack,
    },
    {
      to: "/create-document",
      label: t("dashboard.sidebar.createDocument"),
      icon: FilePlus2,
    },
    // { to: "/history", label: t("dashboard.sidebar.history"), icon: History },
    { to: "/settings", label: t("dashboard.sidebar.settings"), icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col px-4 py-5 lg:px-5">
      <div className="mb-16 flex items-center gap-3 px-6">
        <img
          src="/assets/logo/veriflow-mark.svg"
          alt="VeriFlow"
          className="w-11"
        />
        <span className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">
          VeriFlow
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <nav className="space-y-2">
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-[22px] px-4 py-4 text-[15px] font-bold transition-all duration-200",
                    "hover:-translate-y-0.5 hover:translate-x-1 hover:bg-[var(--surface)]/90 hover:shadow-[0_12px_30px_rgba(7,17,43,0.08)]",
                    isActive
                      ? "bg-[var(--surface)] text-[var(--text)] shadow-[0_12px_30px_rgba(7,17,43,0.08)]"
                      : "text-[var(--muted)]",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "grid h-9 w-9 place-items-center rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-[var(--surface-2)]"
                          : "bg-[var(--surface-2)]/80",
                      ].join(" ")}
                    >
                      <Icon
                        size={18}
                        className={
                          isActive ? "text-[#2563EB]" : "text-[#2a9df4]"
                        }
                      />
                    </span>
                    <span className="tracking-[-0.02em]">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--line)] pt-5">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-[22px] px-4 py-4 text-[15px] font-bold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:translate-x-1 hover:bg-red-500/10"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 transition-all duration-200">
              <LogOut size={18} />
            </span>

            <span className="tracking-[-0.02em]">
              {t("dashboard.sidebar.logout")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
