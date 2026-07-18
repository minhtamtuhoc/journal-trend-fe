import type { AuthSession, LoginCredentials, RegisterCredentials } from "@/auth/types";

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(data: RegisterCredentials): Promise<void>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  updateProfile(fullName: string): Promise<AuthSession>;
  updateNotificationPreferences(prefs: {
    notifyKeywords: boolean;
    notifyAuthors: boolean;
    notifyJournals: boolean;
    notifyEmail: boolean;
  }): Promise<AuthSession>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}
