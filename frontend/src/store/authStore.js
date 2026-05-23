import { create } from "zustand";
import {
  readSecureItem,
  writeSecureItem,
  clearSecureItem,
} from "../utils/secureStorage";
import { getMe } from "../services/authService";

const STORAGE_KEY = "veriflow_auth";

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  hydrate: async () => {
    set({ isLoading: true });
    const stored = await readSecureItem(STORAGE_KEY);

    if (stored?.token && stored?.user) {
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
      return;
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
    });
  },
  setAuth: async (payload) => {
    const user = normalizeUser(payload);
    if (!payload?.token || !user) return;

    set({
      user,
      token: payload.token,
      isAuthenticated: true,
    });

    await writeSecureItem(STORAGE_KEY, {
      token: payload.token,
      user,
    });
  },
  clearAuth: () => {
    clearSecureItem(STORAGE_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
    });
  },
  verifySession: async () => {
    const { token } = get();
    if (!token) {
      get().clearAuth();
      return false;
    }

    set({ isLoading: true });

    try {
      const response = await getMe(token);
      const user = normalizeUser(response?.data?.data);
      if (!user) throw new Error("Invalid session");

      set({ user, isAuthenticated: true, isLoading: false });
      await writeSecureItem(STORAGE_KEY, { token, user });
      return true;
    } catch (error) {
      get().clearAuth();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
