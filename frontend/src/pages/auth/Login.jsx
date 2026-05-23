import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n";
import { login } from "../../services/authService";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await login({
        email: formValues.email,
        password: formValues.password,
      });
      const payload = response?.data?.data;
      await setAuth(payload);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Unable to login right now",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-md">
      <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full bg-[var(--mint)] shadow-[0_0_18px_var(--mint)]" />
          {t("auth.login.badge")}
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-[var(--text)]">
          {t("auth.login.title")}
        </h1>

        <p className="mt-3 text-[var(--muted)]">{t("auth.login.subtitle")}</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("auth.login.email")}
            </label>

            <input
              type="email"
              placeholder="hello@veriflow.ai"
              value={formValues.email}
              onChange={handleChange("email")}
              className="h-13 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 text-[var(--text)] outline-none transition focus:border-[#2563EB]"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-[var(--text)]">
                {t("auth.login.password")}
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formValues.password}
                onChange={handleChange("password")}
                className="h-13 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 pr-14 text-[var(--text)] outline-none transition focus:border-[#2563EB]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm text-[var(--muted)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-2xl px-5 py-3 font-bold text-white transition hover:scale-[1.01]"
            style={{ background: "var(--grad)" }}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Loading...
              </span>
            ) : (
              t("auth.login.button")
            )}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 text-center text-sm text-red-500">
            {errorMessage}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/signup"
            className="font-bold text-[#06B6D4] hover:underline"
          >
            {t("auth.login.signupLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
