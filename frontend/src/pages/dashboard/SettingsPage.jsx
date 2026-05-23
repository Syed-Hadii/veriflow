import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useLanguage from "../../i18n/useLanguage";
import { updateProfile } from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";

export default function SettingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, token, setAuth, clearAuth, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
    if (errors.currentPassword)
      setErrors((prev) => ({ ...prev, currentPassword: "" }));
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }));
    if (confirmPassword && e.target.value !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (newPassword !== e.target.value) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name (if provided)
    if (name && name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    // Validate password update
    if (newPassword) {
      if (!currentPassword) {
        newErrors.currentPassword =
          "Current password is required to update password";
      }
      if (newPassword.length < 6) {
        newErrors.newPassword =
          "New password must be at least 6 characters long";
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if any changes to submit
    const hasNameChange = name.trim() !== (user?.name || "");
    const hasPasswordChange = !!newPassword;

    if (!hasNameChange && !hasPasswordChange) {
      toast.info("No changes to update", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting", {
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {};

      if (hasNameChange) {
        payload.name = name.trim();
      }

      if (hasPasswordChange) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await updateProfile(token, payload);

      if (response?.data?.success) {
        const updatedUser = response.data.data;

        // Update auth store with new user data
        await setAuth({
          token: token,
          ...updatedUser,
        });

        // Show success toast
        toast.success("Profile updated successfully!", {
          position: "top-right",
          duration: 3000,
        });

        // Reset password fields only
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage, {
        position: "top-right",
        duration: 4000,
      });

      // Handle specific error cases
      if (error?.response?.status === 401) {
        if (errorMessage.toLowerCase().includes("password")) {
          setErrors((prev) => ({
            ...prev,
            currentPassword: "Current password is incorrect",
          }));
        } else {
          clearAuth();
          navigate("/login");
          toast.error("Session expired. Please login again.", {
            position: "top-right",
            duration: 4000,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    setName(user?.name || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowPassword(false);
    toast.info("Changes discarded", {
      position: "top-right",
      duration: 2000,
    });
  };

  if (isLoading && !user) {
    return (
      <section className="space-y-6">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
          <Loader label={t("settings.loading") || "Loading settings..."} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.05em] text-[var(--text)] md:text-4xl">
          {t("settings.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(7,17,43,0.06)] md:p-8">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {/* Username Field */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("settings.username")}
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className={`w-full rounded-2xl border ${
                errors.name ? "border-red-500" : "border-[var(--line)]"
              } bg-[var(--surface-2)] px-4 py-3.5 text-[var(--text)] outline-none transition focus:border-[#2563EB]`}
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email Field (Read Only) */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("settings.email")}
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3.5 text-[var(--muted)] outline-none"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Email cannot be changed
            </p>
          </div>

          {/* Current Password Field */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("settings.currentPassword") || "Current Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={handleCurrentPasswordChange}
                placeholder="Enter current password to change password"
                className={`w-full rounded-2xl border ${
                  errors.currentPassword
                    ? "border-red-500"
                    : "border-[var(--line)]"
                } bg-[var(--surface-2)] px-4 py-3.5 pr-24 text-[var(--text)] outline-none transition focus:border-[#2563EB]`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-white/70"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("settings.newPassword") || "New Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="Enter new password (min. 6 characters)"
                className={`w-full rounded-2xl border ${
                  errors.newPassword ? "border-red-500" : "border-[var(--line)]"
                } bg-[var(--surface-2)] px-4 py-3.5 pr-24 text-[var(--text)] outline-none transition focus:border-[#2563EB]`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-white/70"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
            )}
            {newPassword && !errors.newPassword && (
              <p className="mt-1 text-xs text-green-500">
                ✓ Password strength:{" "}
                {newPassword.length >= 6 ? "Good" : "Too short"}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">
              {t("settings.confirmPassword") || "Confirm New Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your new password"
                className={`w-full rounded-2xl border ${
                  errors.confirmPassword
                    ? "border-red-500"
                    : "border-[var(--line)]"
                } bg-[var(--surface-2)] px-4 py-3.5 text-[var(--text)] outline-none transition focus:border-[#2563EB]`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-white/70"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative rounded-full px-5 py-3.5 font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: "var(--grad)" }}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("settings.saving") || "Saving..."}
                </span>
              ) : (
                t("settings.save") || "Save Changes"
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 font-bold text-[var(--text)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {t("settings.cancel") || "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
