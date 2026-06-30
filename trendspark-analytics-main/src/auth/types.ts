export type UserRole = "User" | "Admin" | "SuperAdmin";

export type User = {
  name: string;
  email: string;
  role: UserRole;
  rawRole?: string; // giá trị gốc từ backend: STUDENT | LECTURER | RESEARCHER | ADMIN | SUPER_ADMIN
};

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterRole = "STUDENT" | "LECTURER" | "RESEARCHER";

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: RegisterRole;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: RegisterRole;
}

