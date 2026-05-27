import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getServices } from "@/services";
import { authStorage } from "@/auth/storage";
import type { LoginCredentials, RegisterCredentials, User } from "@/auth/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getServices().auth.getSession();
      if (!cancelled) {
        setUser(session?.user ?? authStorage.getUser());
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const credentials: LoginCredentials = { email, password };
    const session = await getServices().auth.login(credentials);
    setUser(session.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const credentials: RegisterCredentials = { name, email, password };
    const session = await getServices().auth.register(credentials);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    void getServices().auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
