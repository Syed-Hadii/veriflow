import { useLanguage } from "../../i18n";

const featureIcons = [
  "/assets/icons/verification.svg",
  "/assets/icons/ai-brain.svg",
  "/assets/icons/flow.svg",
  "/assets/icons/security.svg",
  "/assets/icons/api.svg",
  "/assets/icons/analytics.svg",
];

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: featureIcons[0],
      title: t("features.items.verification.title"),
      desc: t("features.items.verification.desc"),
    },
    {
      icon: featureIcons[1],
      title: t("features.items.decision.title"),
      desc: t("features.items.decision.desc"),
    },
    {
      icon: featureIcons[2],
      title: t("features.items.flow.title"),
      desc: t("features.items.flow.desc"),
    },
    {
      icon: featureIcons[3],
      title: t("features.items.security.title"),
      desc: t("features.items.security.desc"),
    },
    {
      icon: featureIcons[4],
      title: t("features.items.api.title"),
      desc: t("features.items.api.desc"),
    },
    {
      icon: featureIcons[5],
      title: t("features.items.analytics.title"),
      desc: t("features.items.analytics.desc"),
    },
  ];

  const steps = [
    {
      num: "1",
      title: t("workflow.steps.step1.title"),
      desc: t("workflow.steps.step1.desc"),
    },
    {
      num: "2",
      title: t("workflow.steps.step2.title"),
      desc: t("workflow.steps.step2.desc"),
    },
    {
      num: "3",
      title: t("workflow.steps.step3.title"),
      desc: t("workflow.steps.step3.desc"),
    },
    {
      num: "4",
      title: t("workflow.steps.step4.title"),
      desc: t("workflow.steps.step4.desc"),
    },
  ];

  return (
    <>
      <section className="py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] font-bold text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--mint)] shadow-[0_0_24px_var(--mint)]" />
              {t("hero.badge")}
            </span>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.07em] md:text-7xl lg:text-[82px]">
              {t("hero.title1")}{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#22D3EE] bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg text-[var(--muted)] md:text-xl">
              {t("hero.description")}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_90%,transparent),var(--surface-2))] p-6 shadow-[var(--shadow)]">
            <div className="absolute inset-x-[-20%] bottom-[-30%] h-64 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_65%)]" />

            <div className="relative grid min-h-[270px] place-items-center rounded-[24px] bg-[var(--navy)] p-8">
              <img
                src="/assets/logo/veriflow-mark.svg"
                alt="VeriFlow logo lockup"
                className="w-full max-w-[420px]"
              /> 
            </div>

            <div className="relative mt-4 grid gap-3 md:grid-cols-3">
              <StatCard value="98%" label={t("stats.accuracy")} />
              <StatCard value="4×" label={t("stats.faster")} />
              <StatCard value="24/7" label={t("stats.monitoring")} />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1180px] px-5">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-3xl font-black tracking-[-0.055em] md:text-5xl">
              {t("features.title")}
            </h2>

            <p className="max-w-2xl text-[var(--muted)]">
              {t("features.description")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(7,17,43,0.06)]"
              >
                <img src={item.icon} alt="" className="h-14 w-14" />

                <h3 className="mt-5 text-[22px] font-bold tracking-[-0.03em]">
                  {item.title}
                </h3>

                <p className="mt-2 text-[var(--muted)]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1180px] px-5">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-3xl font-black tracking-[-0.055em] md:text-5xl">
              {t("workflow.title")}
            </h2>

            <p className="max-w-2xl text-[var(--muted)]">
              {t("workflow.description")}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-6"
              >
                {index !== steps.length - 1 && (
                  <div className="absolute right-[-16px] top-1/2 hidden h-[2px] w-4 bg-[var(--cyan)] lg:block" />
                )}

                <div
                  className="grid h-11 w-11 place-items-center rounded-[14px] text-white"
                  style={{ background: "var(--grad)" }}
                >
                  <span className="font-black">{step.num}</span>
                </div>

                <h3 className="mt-4 text-xl font-bold tracking-[-0.03em]">
                  {step.title}
                </h3>

                <p className="mt-2 text-[var(--muted)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[1180px] px-5">
          <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,var(--navy),#09245d_58%,#065f73)] p-8 text-white md:p-12">
            <div className="absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full bg-[rgba(34,211,238,0.18)]" />

            <h2 className="relative text-4xl font-black tracking-[-0.05em] md:text-[44px]">
              {t("cta.title")}
            </h2>

            <p className="relative mt-4 max-w-2xl text-[#c9d7f4]">
              {t("cta.description")}
            </p>

            <a
              href="#top"
              className="relative mt-7 inline-flex rounded-full px-5 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
              style={{ background: "var(--grad)" }}
            >
              {t("cta.button")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <b className="block text-[28px] tracking-[-0.04em]">{value}</b>

      <span className="text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-bold transition ${
        active
          ? "bg-[var(--surface)] text-[var(--text)]"
          : "text-[var(--muted)]"
      }`}
    >
      <img src={icon} alt="" className="h-6 w-6" />

      <span>{label}</span>
    </div>
  );
}

function MetricCard({ value, label }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-2)] p-4">
      <strong className="block text-[26px] tracking-[-0.04em]">{value}</strong>

      <span className="text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}

function Swatch({ color, code, label }) {
  return (
    <div className="w-[104px]">
      <div
        className="h-[70px] rounded-[18px] border border-[var(--line)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        style={{ background: color }}
      />

      <b className="mt-2 block text-xs">{code}</b>

      <span className="text-xs text-[var(--muted)]">{label}</span>
    </div>
  );
}
