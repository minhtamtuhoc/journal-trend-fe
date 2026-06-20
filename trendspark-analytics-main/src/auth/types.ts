export type UserRole = "User" | "Admin";

export type User = {
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  user: User;
  accessToken: string;
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

