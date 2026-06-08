import { apiClient } from "@/api/client";
import type { AuthService } from "@/services/interfaces/auth.service";
import type { AuthSession, LoginCredentials, RegisterCredentials } from "@/auth/types";
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
    await apiClient.post("/auth/register", credentials);
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
    const normalized = { ...session, user: normalizeUser(session.user) };
    authStorage.setSession(normalized);
    return normalized;
  }

  async getSession(): Promise<AuthSession | null> {
    const cached = authStorage.getSession();
    if (!cached) return null;
    try {
      const session = await apiClient.get<AuthSession>("/auth/me");
      return { ...session, user: normalizeUser(session.user) };
    } catch {
      authStorage.setSession(null);
      return null;
    }
  }
}
