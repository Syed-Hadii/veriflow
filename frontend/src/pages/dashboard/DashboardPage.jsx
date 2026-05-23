import { Link } from "react-router-dom";
import {
  FileStack,
  FilePlus2,
  History,
  Settings,
  ArrowRight,
} from "lucide-react";
import useLanguage from "../../i18n/useLanguage";
import useAuth from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const username = user?.name || "User";

  if (isLoading && !user) {
    return (
      <section className="space-y-6">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
          <Loader label={t("dashboard.loading") || "Loading dashboard..."} />
        </div>
      </section>
    );
  }

  const cards = [
    {
      to: "/templates",
      icon: FileStack,
      title: t("dashboard.cards.templates.title"),
      desc: t("dashboard.cards.templates.desc"),
    },
    {
      to: "/create-document",
      icon: FilePlus2,
      title: t("dashboard.cards.createDocument.title"),
      desc: t("dashboard.cards.createDocument.desc"),
    },
    // {
    //   to: "/history",
    //   icon: History,
    //   title: t("dashboard.cards.history.title"),
    //   desc: t("dashboard.cards.history.desc"),
    // },
    {
      to: "/settings",
      icon: Settings,
      title: t("dashboard.cards.settings.title"),
      desc: t("dashboard.cards.settings.desc"),
    },
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-[30px] border border-[var(--line)] bg-[linear-gradient(135deg,var(--navy),#09245d_58%,#065f73)] p-8 text-white shadow-[var(--shadow)] md:p-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/90">
          <span className="h-2 w-2 rounded-full bg-[var(--mint)] shadow-[0_0_18px_var(--mint)]" />
          {t("dashboard.welcomeBadge")}
        </span>

        <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] md:text-5xl">
          {t("dashboard.welcomeTitle")}{" "}
          <span className="bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#22D3EE] bg-clip-text text-transparent">
            {username}
          </span>
        </h1>

        <p className="mt-3 max-w-2xl text-[#c9d7f4]">
          {t("dashboard.welcomeSubtitle")}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.to}
              to={card.to}
              className="group rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(7,17,43,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(7,17,43,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf2ff]">
                  <Icon className="text-[#2563EB]" size={22} />
                </span>
                <ArrowRight
                  className="text-[var(--muted)] transition group-hover:translate-x-1"
                  size={18}
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-[var(--text)]">
                {card.title}
              </h2>

              <p className="mt-2 text-[var(--muted)]">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
