import type { User, UserRole } from "@/auth/types";

/** Map backend / legacy role strings to Helix UI roles. */
export function normalizeRole(role: string | undefined | null): UserRole {
  const r = (role ?? "").trim().toUpperCase();
  if (
    r === "SUPER_ADMIN" ||
    r === "ROLE_SUPER_ADMIN" ||
    r === "SUPERADMIN" ||
    r === "ROLESUPERADMIN"
  ) {
    return "SuperAdmin";
  }
  if (r === "ADMIN" || r === "ROLE_ADMIN") {
    return "Admin";
  }
  return "User";
}

export function isAdminUser(user: Pick<User, "role"> | null | undefined): boolean {
  const role = normalizeRole(user?.role);
  return role === "Admin" || role === "SuperAdmin";
}

export function isSuperAdminUser(user: Pick<User, "role"> | null | undefined): boolean {
  return normalizeRole(user?.role) === "SuperAdmin";
}

export function normalizeUser(user: User): User {
  return { ...user, role: normalizeRole(user.role) };
}
