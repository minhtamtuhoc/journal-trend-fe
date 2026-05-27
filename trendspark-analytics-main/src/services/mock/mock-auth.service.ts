import type { AuthService } from "@/services/interfaces/auth.service";
import type { AuthSession, RegisterCredentials, User, UserRole } from "@/auth/types";
import { authStorage } from "@/auth/storage";

const AUTH_DELAY_MS = 500;

function roleFromEmail(email: string): UserRole {
  return email.startsWith("admin") ? "Admin" : "User";
}

function buildSession(user: User): AuthSession {
  return {
    user,
    accessToken: `mock_${btoa(user.email)}`,
  };
}

export class MockAuthService implements AuthService {
  async login({ email }: { email: string; password: string }): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, AUTH_DELAY_MS));
    const session = buildSession({
      name: email.split("@")[0] || "Researcher",
      email,
      role: roleFromEmail(email),
    });
    authStorage.setSession(session);
    return session;
  }

  async register({ name, email }: RegisterCredentials): Promise<AuthSession> {
    await new Promise((r) => setTimeout(r, AUTH_DELAY_MS));
    const session = buildSession({ name, email, role: roleFromEmail(email) });
    authStorage.setSession(session);
    return session;
  }

  async logout(): Promise<void> {
    authStorage.setSession(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const session = authStorage.getSession();
    if (session) return session;

    const legacyUser = authStorage.getUser();
    if (legacyUser) {
      const migrated = buildSession(legacyUser);
      authStorage.setSession(migrated);
      return migrated;
    }

    return null;
  }
}
