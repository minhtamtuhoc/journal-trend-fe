import { apiClient } from "@/api/client";
import type { AuthService } from "@/services/interfaces/auth.service";
import type { AuthSession, LoginCredentials, RegisterCredentials, RegisterRequest } from "@/auth/types";
import { authStorage } from "@/auth/storage";
import { normalizeUser } from "@/auth/roles";

export class HttpAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>("/auth/login", credentials);
    const normalized = { ...session, user: normalizeUser(session.user) };
    authStorage.setSession(normalized);
    return normalized;
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    const payload: RegisterRequest = {
      fullName: credentials.name,
      email: credentials.email,
      password: credentials.password,
      role: credentials.role,
    };
    console.log("REQUEST PAYLOAD", payload);
    await apiClient.post("/v1/auth/register", payload);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      authStorage.setSession(null);
    }
  }

  async updateProfile(fullName: string): Promise<AuthSession> {
    const session = await apiClient.put<AuthSession>("/auth/profile", { name: fullName });
    const cached = authStorage.getSession();
    // refreshToken is intentionally preserved because /auth/me and /auth/profile do not rotate tokens
    const normalized = {
      ...session,
      user: normalizeUser(session.user),
      refreshToken: session.refreshToken || cached?.refreshToken || "",
    };
    authStorage.setSession(normalized);
    return normalized;
  }

  async getSession(): Promise<AuthSession | null> {
    const cached = authStorage.getSession();
    if (!cached) return null;
    try {
      const session = await apiClient.get<AuthSession>("/auth/me");
      // refreshToken is intentionally preserved because /auth/me and /auth/profile do not rotate tokens
      const normalized = {
        ...session,
        user: normalizeUser(session.user),
        refreshToken: session.refreshToken || cached.refreshToken || "",
      };
      authStorage.setSession(normalized);
      return normalized;
    } catch {
      authStorage.setSession(null);
      return null;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, newPassword });
  }
}

