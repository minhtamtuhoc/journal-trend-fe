import { apiClient } from "@/api/client";
import type { AuthService } from "@/services/interfaces/auth.service";
import type { AuthSession, LoginCredentials, RegisterCredentials } from "@/auth/types";
import { authStorage } from "@/auth/storage";

export class HttpAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>("/auth/login", credentials);
    authStorage.setSession(session);
    return session;
  }

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const session = await apiClient.post<AuthSession>("/auth/register", credentials);
    authStorage.setSession(session);
    return session;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      authStorage.setSession(null);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const cached = authStorage.getSession();
    if (!cached) return null;
    try {
      return await apiClient.get<AuthSession>("/auth/me");
    } catch {
      authStorage.setSession(null);
      return null;
    }
  }
}
