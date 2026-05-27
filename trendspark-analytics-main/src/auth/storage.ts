import type { AuthSession, User } from "@/auth/types";

const USER_KEY = "helix.user";
const TOKEN_KEY = "helix.token";

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
    return localStorage.getItem(TOKEN_KEY);
  },

  getSession(): AuthSession | null {
    const user = this.getUser();
    const accessToken = this.getAccessToken();
    if (!user || !accessToken) return null;
    return { user, accessToken };
  },

  setSession(session: AuthSession | null): void {
    if (!isBrowser()) return;
    if (session) {
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      localStorage.setItem(TOKEN_KEY, session.accessToken);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};
