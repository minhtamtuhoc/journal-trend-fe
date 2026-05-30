import type { User, UserRole } from "@/auth/types";

/** Map backend / legacy role strings to Helix UI roles. */
export function normalizeRole(role: string | undefined | null): UserRole {
  const r = (role ?? "").trim().toUpperCase();
  if (
    r === "ADMIN" ||
    r === "SUPER_ADMIN" ||
    r === "ROLE_ADMIN" ||
    r === "ROLE_SUPER_ADMIN"
  ) {
    return "Admin";
  }
  return "User";
}

export function isAdminUser(user: Pick<User, "role"> | null | undefined): boolean {
  return normalizeRole(user?.role) === "Admin";
}

export function normalizeUser(user: User): User {
  return { ...user, role: normalizeRole(user.role) };
}
