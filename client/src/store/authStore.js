import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      lspProfile: null,
      setAuth: (payload) => set(payload),
      logout: () => set({ token: null, user: null, lspProfile: null }),
    }),
    { name: "cargoshare-auth" }
  )
);
