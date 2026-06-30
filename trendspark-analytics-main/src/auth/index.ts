export { AuthProvider, useAuth } from "@/auth/AuthProvider";
export type { User, UserRole, AuthSession, LoginCredentials, RegisterCredentials, RegisterRole, RegisterRequest } from "@/auth/types";
export { authStorage } from "@/auth/storage";
export { normalizeRole, normalizeUser, isAdminUser, isSuperAdminUser, isStudentUser } from "@/auth/roles";
