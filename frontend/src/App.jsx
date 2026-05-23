import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TemplatesPage from "./pages/dashboard/TemplatesPage";
import DocumentPage from "./pages/dashboard/DocumentPage";
import HistoryPage from "./pages/dashboard/HistoryPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/create-document" element={<DocumentPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
