import useLanguage from "../../i18n/useLanguage";

export default function HistoryPage() {
  const { t } = useLanguage();

  const rows = [
    {
      id: "DOC-1024",
      template: "ID Card Template",
      status: "Completed",
      date: "2026-05-17",
      format: "PDF",
    },
    {
      id: "DOC-1025",
      template: "Employee Badge",
      status: "Completed",
      date: "2026-05-16",
      format: "PNG",
    },
    {
      id: "DOC-1026",
      template: "Visitor Pass",
      status: "In Review",
      date: "2026-05-15",
      format: "JPG",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--text)] md:text-4xl">
          {t("history.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {t("history.subtitle")}
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_60px_rgba(7,17,43,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--surface-2)]">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-[var(--text)]">
                  {t("history.table.id")}
                </th>
                <th className="px-6 py-4 text-sm font-bold text-[var(--text)]">
                  {t("history.table.template")}
                </th>
                <th className="px-6 py-4 text-sm font-bold text-[var(--text)]">
                  {t("history.table.status")}
                </th>
                <th className="px-6 py-4 text-sm font-bold text-[var(--text)]">
                  {t("history.table.date")}
                </th>
                <th className="px-6 py-4 text-sm font-bold text-[var(--text)]">
                  {t("history.table.format")}
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--text)]">
                    {row.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {row.template}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    <span className="inline-flex rounded-full bg-[#eaf2ff] px-3 py-1 text-xs font-bold text-[#2563EB]">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {row.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {row.format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}