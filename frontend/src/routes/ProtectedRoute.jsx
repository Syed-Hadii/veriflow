import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute() {
  const location = useLocation();
  const {
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    hydrate,
    verifySession,
  } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      hydrate();
    }
  }, [hydrate, isInitialized]);

  useEffect(() => {
    if (isInitialized && token) {
      verifySession();
    }
  }, [isInitialized, token, verifySession]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
