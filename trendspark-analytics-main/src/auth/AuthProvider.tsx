import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getServices } from "@/services";
import { authStorage } from "@/auth/storage";
import type { LoginCredentials, RegisterCredentials, RegisterRole, User } from "@/auth/types";
import { normalizeUser } from "@/auth/roles";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { recordActivity, getIdleMs, clearActivity, IDLE_TIMEOUT_MS } from "@/auth/idle-timer";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: RegisterRole) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string) => Promise<void>;
  updateNotificationPreferences: (prefs: {
    notifyKeywords: boolean;
    notifyAuthors: boolean;
    notifyJournals: boolean;
    notifyEmail: boolean;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const cached = authStorage.getUser();
    return cached ? normalizeUser(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authStorage.getAccessToken()) {
        setIsLoading(false);
        setInitializing(false);
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
          setInitializing(false);
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
    qc.clear();
    setUser(normalizeUser(session.user));
  }, [qc]);

    const register = useCallback(async (name: string, email: string, password: string, role: RegisterRole) => {
    const credentials: RegisterCredentials = { name, email, password, role };
    await getServices().auth.register(credentials);
  }, []);

  const logout = useCallback(() => {
    clearActivity();
    void getServices().auth.logout();
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    if (!user) return;

    recordActivity(); // reset mốc ngay khi bắt đầu theo dõi (login/reload)

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    let throttleTimer: number | null = null;
    const onActivity = () => {
      // throttle: chỉ ghi localStorage tối đa 1 lần / 5 giây, tránh ghi quá dày khi user di chuột liên tục
      if (throttleTimer) return;
      throttleTimer = window.setTimeout(() => { throttleTimer = null; }, 5000);
      recordActivity();
    };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const checkInterval = window.setInterval(() => {
      if (getIdleMs() >= IDLE_TIMEOUT_MS) {
        clearActivity();
        logout();
        toast.info("Bạn đã bị đăng xuất do không hoạt động trong 30 phút");
      }
    }, 15_000); // check mỗi 15 giây là đủ, không cần chính xác tới từng giây

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(checkInterval);
      if (throttleTimer) window.clearTimeout(throttleTimer);
    };
  }, [user, logout]);

  const updateProfile = useCallback(async (fullName: string) => {
    const session = await getServices().auth.updateProfile(fullName);
    setUser(normalizeUser(session.user));
  }, []);

  const updateNotificationPreferences = useCallback(async (prefs: {
    notifyKeywords: boolean;
    notifyAuthors: boolean;
    notifyJournals: boolean;
    notifyEmail: boolean;
  }) => {
    const session = await getServices().auth.updateNotificationPreferences(prefs);
    setUser(normalizeUser(session.user));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await getServices().auth.changePassword(currentPassword, newPassword);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      initializing,
      login,
      register,
      logout,
      updateProfile,
      updateNotificationPreferences,
      changePassword,
    }),
    [user, isLoading, initializing, login, register, logout, updateProfile, updateNotificationPreferences, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
