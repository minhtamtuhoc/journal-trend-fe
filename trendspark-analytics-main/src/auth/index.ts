export { AuthProvider, useAuth } from "@/auth/AuthProvider";
export type { User, UserRole, AuthSession, LoginCredentials, RegisterCredentials } from "@/auth/types";
export { authStorage } from "@/auth/storage";
export { normalizeRole, normalizeUser, isAdminUser } from "@/auth/roles";
