import { useLanguage } from "../../i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-(--line) py-9 text-(--muted)">
      <div className="mx-auto w-full max-w-295 px-5 text-sm">
        © {new Date().getFullYear()} VeriFlow. {t("footer.text")}
      </div>
    </footer>
  );
}
