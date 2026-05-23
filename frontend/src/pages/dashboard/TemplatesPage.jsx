import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLanguage from "../../i18n/useLanguage";
import useTemplate from "../../hooks/useTemplate";
import Loader from "../../components/common/Loader";
import { ASSET_BASE_URL } from "../../utils/constants";

const resolveAssetUrl = (value) => {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${ASSET_BASE_URL}${value}`;
};

export default function TemplatesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { templates, isLoading, error, fetchTemplates } = useTemplate();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--text)] md:text-4xl">
          {t("templates.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {t("templates.subtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
            <Loader label={t("templates.loading") || "Loading templates..."} />
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            {t("templates.emptyState")}
          </div>
        )}

        {!isLoading &&
          templates.map((template) => (
            <article
              key={template._id}
              className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_60px_rgba(7,17,43,0.06)]"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[var(--surface-2)]">
                <img
                  src={
                    template?.previewImage
                      ? resolveAssetUrl(template.previewImage)
                      : "/assets/templates/id-card-template.png"
                  }
                  alt={template.title}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--text)]">
                  {template.title}
                </h2>
                <p className="mt-2 text-[var(--muted)]">
                  {template.description || "-"}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/create-document", {
                      state: {
                        selectedTemplateId: template._id,
                        selectedTemplateName: template.title,
                      },
                    })
                  }
                  className="mt-5 w-full rounded-full px-5 py-3.5 font-bold text-white transition hover:scale-[1.01]"
                  style={{ background: "var(--grad)" }}
                >
                  {t("templates.useButton")}
                </button>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
