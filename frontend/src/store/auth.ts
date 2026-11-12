import { create } from "zustand";
import type { User } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken: (token) => {
    localStorage.setItem("fm_token", token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem("fm_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  // Call once on app startup to restore session from localStorage
  hydrate: () => {
    const token = localStorage.getItem("fm_token");
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
