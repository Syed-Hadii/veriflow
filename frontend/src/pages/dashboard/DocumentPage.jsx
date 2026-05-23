import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, Download, Eye, Loader2, Upload } from "lucide-react";
import useLanguage from "../../i18n/useLanguage";
import useAuth from "../../hooks/useAuth";
import useTemplate from "../../hooks/useTemplate";
import {
  createDocument,
  downloadDocument,
} from "../../services/documentService";
import { ASSET_BASE_URL } from "../../utils/constants";
import Loader from "../../components/common/Loader";

const collectTemplateElements = (template) => {
  if (!template) return [];

  const pages = [];
  if (template.single) pages.push(template.single);
  if (template.front) pages.push(template.front);
  if (template.back) pages.push(template.back);

  const byKey = new Map();
  pages.forEach((page) => {
    const elements = page?.elements || [];
    elements.forEach((element) => {
      if (!element?.key || byKey.has(element.key)) return;
      byKey.set(element.key, element);
    });
  });

  return Array.from(byKey.values());
};

const getDefaultValue = (element) => {
  if (element?.defaultValue !== undefined && element?.defaultValue !== null) {
    return element.defaultValue;
  }

  if (["image", "signature"].includes(element?.type)) return "";
  return "";
};

const resolveAssetUrl = (value) => {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${ASSET_BASE_URL}${value}`;
};

const shouldShowInForm = (element) => {
  return element?.showInForm !== false;
};

const classifyElement = (element) => {
  if (!element || !shouldShowInForm(element)) return "details";

  const key = String(element.key || "").toLowerCase();
  const label = String(element.label || "").toLowerCase();
  const combined = `${key} ${label}`;

  if (["image", "signature"].includes(element.type)) return "media";

  if (
    [
      "name",
      "email",
      "phone",
      "address",
      "dob",
      "birth",
      "gender",
      "nationality",
      "citizenship",
      "personal",
      "pob",
      "authority",
      "expiry",
      "issue",
    ].some((token) => combined.includes(token))
  ) {
    return "personal";
  }

  return "details";
};

const buildSteps = (elements) => {
  const buckets = {
    personal: [],
    details: [],
    media: [],
  };

  elements.filter(shouldShowInForm).forEach((element) => {
    const bucket = classifyElement(element);
    buckets[bucket].push(element);
  });

  const steps = [];

  if (buckets.personal.length) {
    steps.push({
      key: "personal",
      title: "createDocument.steps.personal.title",
      subtitle: "createDocument.steps.personal.subtitle",
      elements: buckets.personal,
    });
  }

  if (buckets.details.length) {
    steps.push({
      key: "details",
      title: "createDocument.steps.details.title",
      subtitle: "createDocument.steps.details.subtitle",
      elements: buckets.details,
    });
  }

  if (buckets.media.length) {
    steps.push({
      key: "media",
      title: "createDocument.steps.media.title",
      subtitle: "createDocument.steps.media.subtitle",
      elements: buckets.media,
    });
  }

  steps.push({
    key: "review",
    title: "createDocument.steps.review.title",
    subtitle: "createDocument.steps.review.subtitle",
    elements: [],
  });

  return steps;
};

export default function DocumentPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const { token } = useAuth();
  const {
    templates,
    template,
    isLoading,
    error,
    fetchTemplateById,
    fetchTemplates,
  } = useTemplate();

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    location.state?.selectedTemplateId || "",
  );
  const [selectedTemplateName, setSelectedTemplateName] = useState(
    location.state?.selectedTemplateName || "",
  );

  const [formData, setFormData] = useState({});
  const [createdDocId, setCreatedDocId] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const elements = useMemo(() => collectTemplateElements(template), [template]);

  const steps = useMemo(() => buildSteps(elements), [elements]);
  const activeStep = steps[currentStep] || steps[0];
  const visibleActiveElements =
    activeStep?.elements?.filter(shouldShowInForm) || [];

  useEffect(() => {
    if (!selectedTemplateId) {
      fetchTemplates();
      return;
    }

    fetchTemplateById(selectedTemplateId);
  }, [selectedTemplateId, fetchTemplateById, fetchTemplates]);

  useEffect(() => {
    if (!elements.length) return;

    const initial = {};

    elements.filter(shouldShowInForm).forEach((element) => {
      initial[element.key] = getDefaultValue(element);
    });

    setFormData(initial);
  }, [elements]);

  useEffect(() => {
    if (template?.title && selectedTemplateId && !selectedTemplateName) {
      setSelectedTemplateName(template.title);
    }
  }, [template, selectedTemplateId, selectedTemplateName]);

  useEffect(() => {
    setCreatedDocId("");
    setLocalError("");
  }, [selectedTemplateId]);

  useEffect(() => {
    setCurrentStep(0);
  }, [steps.length, selectedTemplateId]);

  const updateValue = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setCreatedDocId("");
  };

  const handleTemplateSelect = (selected) => {
    if (!selected?._id) return;
    setSelectedTemplateId(selected._id);
    setSelectedTemplateName(selected.title || "");
    setCreatedDocId("");
    setCurrentStep(0);
  };

  const handleFile = (key, file) => {
    if (!file) {
      updateValue(key, "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateValue(key, reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!selectedTemplateId || saving) return;

    if (!token) {
      setLocalError("Please sign in to create a document.");
      return;
    }

    setSaving(true);
    setLocalError("");

    try {
      const payload = {
        template: selectedTemplateId,
        title:
          selectedTemplateName || template?.title || `Document ${Date.now()}`,
        layoutMode: template?.layoutMode || "single",
        data: formData,
        fieldValues: [],
      };

      const response = await createDocument(payload, token);
      const docId = response?.data?.data?._id;

      if (!docId) {
        throw new Error("Failed to create document");
      }

      setCreatedDocId(docId);
    } catch (err) {
      setLocalError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerDownload = async (format, { preview = false } = {}) => {
    if (!createdDocId || downloadLoading) return;
    if (!token) {
      setLocalError("Please sign in to download.");
      return;
    }
    setDownloadLoading(true);
    setLocalError("");

    try {
      const response = await downloadDocument(createdDocId, format, token);
      const blobType =
        response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: blobType });
      const url = URL.createObjectURL(blob);

      if (preview) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = url;
        const safeName = selectedTemplateName || template?.title || "document";
        link.download = `${safeName}.${format}`;
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setLocalError(err?.response?.data?.message || err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const displayTemplateName =
    selectedTemplateName ||
    template?.title ||
    t("createDocument.noTemplateSelected");
  const showTemplatePicker = !selectedTemplateId;

  if (showTemplatePicker) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--text)] md:text-4xl">
            {t("createDocument.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            {t("createDocument.subtitle")}
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(7,17,43,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#2563EB]">
                {t("createDocument.selectTemplate")}
              </p>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">
                {t("createDocument.chooseTemplateToStart")}
              </h2>
            </div>
            <div className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)]">
              {t("createDocument.stepCount", { current: 1, total: 1 })}
            </div>
          </div>

          {isLoading && (
            <div className="mt-6">
              <Loader
                label={t("templates.loading") || "Loading templates..."}
              />
            </div>
          )}

          {!isLoading && error && (
            <p className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </p>
          )}

          {!isLoading && templates.length === 0 && (
            <p className="mt-6 text-sm text-[var(--muted)]">
              {t("templates.emptyState")}
            </p>
          )}

          {!isLoading && templates.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => handleTemplateSelect(item)}
                  className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] text-left transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(7,17,43,0.12)]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-[var(--surface)]">
                    <img
                      src={
                        item?.previewImage
                          ? resolveAssetUrl(item.previewImage)
                          : "/assets/templates/id-card-template.png"
                      }
                      alt={item.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-lg font-bold text-[var(--text)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.description || t("templates.cardDescription")}
                    </p>
                    <span className="mt-3 inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
                      {t("templates.selectButton")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--text)] md:text-4xl">
            {t("createDocument.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            {t("createDocument.subtitle")}
          </p>
        </div>

        <div className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
          {t("createDocument.selectedTemplate")}:{" "}
          <span className="text-[#2563EB]">{displayTemplateName}</span>
        </div>
      </div>

      <Stepper steps={steps} currentStep={currentStep} t={t} />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#2563EB]">
                  {t("createDocument.selectedTemplate")}
                </p>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--text)]">
                  {displayTemplateName}
                </h2>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {activeStep?.subtitle}
                </p>
              </div>
              <div className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
                Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
              </div>
            </div>

            {isLoading && (
              <div className="mt-6">
                <Loader
                  label={t("createDocument.loading") || "Loading template..."}
                />
              </div>
            )}

            {!isLoading && error && (
              <p className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                {error}
              </p>
            )}

            {!isLoading && elements.length === 0 && (
              <p className="mt-6 text-sm text-[var(--muted)]">
                {t("createDocument.noTemplateSelected")}
              </p>
            )}

            {!isLoading && elements.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#2563EB]">
                      {t(activeStep?.title)}
                    </p>
                  </div>
                </div>

                {visibleActiveElements.length ? (
                  visibleActiveElements.map((element) => (
                    <DynamicField
                      key={element.key}
                      element={element}
                      t={t}
                      value={formData[element.key]}
                      onChange={(value) => updateValue(element.key, value)}
                      onFile={(file) => handleFile(element.key, file)}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-5 text-sm text-[var(--muted)]">
                    {t(activeStep?.subtitle)}
                  </div>
                )}
              </div>
            )}

            {localError && (
              <p className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                {localError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("createDocument.back")}
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) =>
                      Math.min(prev + 1, steps.length - 1),
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.01]"
                  style={{ background: "var(--grad)" }}
                >
                  {t("createDocument.next")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!selectedTemplateId || saving}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "var(--grad)" }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t("createDocument.creating")}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {t("createDocument.createButton")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {saving && !createdDocId && (
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <Loader
                label={
                  t("createDocument.processing") || "Processing document..."
                }
              />
            </div>
          )}

          {createdDocId && (
            <div className="rounded-[28px] border border-[#cce8d6] bg-[#f4fff7] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
                  <Check size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#166534]">
                    {t("createDocument.createdSuccess")}
                  </p>
                  <p className="text-sm text-[#15803d]/80">
                    {t("createDocument.createdSubtitle")}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => triggerDownload("preview", { preview: true })}
                  disabled={downloadLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={16} />
                  {t("createDocument.previewTitle")}
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload("pdf")}
                  disabled={downloadLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={16} />
                  {t("createDocument.downloadPdf")}
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload("png")}
                  disabled={downloadLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={16} />
                  {t("createDocument.downloadPng")}
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload("jpg")}
                  disabled={downloadLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={16} />
                  {t("createDocument.downloadJpeg")}
                </button>
              </div>
            </div>
          )}

          <Stepper steps={steps} currentStep={currentStep} compact t={t} />
        </div>

        <div className="space-y-4">
          <div className="sticky top-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(7,17,43,0.06)]">
            <div className="mb-4">
              <h3 className="text-xl font-black tracking-[-0.04em] text-[var(--text)]">
                {t("createDocument.previewTitle")}
              </h3>
              <p className="text-sm text-[var(--muted)]">
                {t("createDocument.previewSubtitle")}
              </p>
            </div>

            <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
              {isLoading ? (
                <Loader label={t("createDocument.loading") || "Loading..."} />
              ) : template?.demoImage || template?.previewImage ? (
                <img
                  src={resolveAssetUrl(
                    template?.demoImage || template?.previewImage,
                  )}
                  alt={template?.title || "Template demo"}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  {t("createDocument.previewSubtitle")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DynamicField({ element, value, onChange, onFile, t }) {
  const label = element?.label || element?.key;
  const placeholder = element?.placeholder || "";

  if (element?.showInForm === false) return null;

  if (["image", "signature"].includes(element?.type)) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
          {label}
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm font-semibold text-[var(--text)]">
          <Upload size={18} />
          <span>{placeholder || t("createDocument.uploadImage")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        </label>
        {value && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {t("createDocument.imageAdded")}
          </p>
        )}
      </div>
    );
  }

  if (element?.type === "textarea") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
          {label}
        </label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 text-[var(--text)] outline-none transition focus:border-[#2563EB]"
        />
      </div>
    );
  }

  const inputType =
    element?.type === "date"
      ? "date"
      : element?.type === "email"
        ? "email"
        : element?.type === "number"
          ? "number"
          : "text";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
        {label}
      </label>
      <input
        type={inputType}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 text-[var(--text)] outline-none transition focus:border-[#2563EB]"
      />
    </div>
  );
}

function Stepper({ steps, currentStep, compact = false, t }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 overflow-x-auto ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div
            key={step.key}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 font-semibold ${
              isActive
                ? "border-[#2563EB] bg-[#eaf2ff] text-[#1d4ed8]"
                : isComplete
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            <div
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${
                isActive
                  ? "bg-[#2563EB] text-white"
                  : isComplete
                    ? "bg-[#22c55e] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              {isComplete ? <Check size={14} /> : index + 1}
            </div>
            <span className="whitespace-nowrap text-xs font-semibold">
              {step.title.startsWith("createDocument.")
                ? t(step.title)
                : step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
