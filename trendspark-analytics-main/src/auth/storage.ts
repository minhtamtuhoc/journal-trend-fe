import type { AuthSession, User } from "@/auth/types";

const USER_KEY = "helix.user";
const ACCESS_TOKEN_KEY = "helix.access_token";
const LEGACY_TOKEN_KEY = "helix.token";
const REFRESH_TOKEN_KEY = "helix.refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export const authStorage = {
  getUser(): User | null {
    if (!isBrowser()) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      token = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
      }
    }
    return token;
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getSession(): AuthSession | null {
    const user = this.getUser();
    const accessToken = this.getAccessToken();
    if (!user || !accessToken) return null;
    const refreshToken = this.getRefreshToken() || "";
    return { user, accessToken, refreshToken };
  },

  setSession(session: AuthSession | null): void {
    if (!isBrowser()) return;
    if (session) {
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      if (session.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
      }
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  clearSession(): void {
    this.setSession(null);
  },
};
