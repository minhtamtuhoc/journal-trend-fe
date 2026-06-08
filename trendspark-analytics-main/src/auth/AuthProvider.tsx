import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getServices } from "@/services";
import { authStorage } from "@/auth/storage";
import type { LoginCredentials, RegisterCredentials, User } from "@/auth/types";
import { normalizeUser } from "@/auth/roles";
import { useQueryClient } from "@tanstack/react-query";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authStorage.getAccessToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const session = await getServices().auth.getSession();
        if (!cancelled) {
          const raw = session?.user ?? authStorage.getUser();
          setUser(raw ? normalizeUser(raw) : null);
        }
      } catch {
        if (!cancelled) {
          authStorage.setSession(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const credentials: LoginCredentials = { email, password };
    const session = await getServices().auth.login(credentials);
    setUser(normalizeUser(session.user));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const credentials: RegisterCredentials = { name, email, password };
    await getServices().auth.register(credentials);
  }, []);

  const logout = useCallback(() => {
    void getServices().auth.logout();
    setUser(null);
    qc.clear();
    localStorage.removeItem("helix_followed_authors");
    window.dispatchEvent(new Event("helix-saved-items-changed"));
  }, [qc]);

  const updateProfile = useCallback(async (fullName: string) => {
    const session = await getServices().auth.updateProfile(fullName);
    setUser(normalizeUser(session.user));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, updateProfile }),
    [user, isLoading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
