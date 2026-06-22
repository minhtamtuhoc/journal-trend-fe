import type { UserAdminResponse } from "@/types/domain";

export type Role = "STUDENT" | "LECTURER" | "RESEARCHER" | "ADMIN" | "SUPER_ADMIN";

export interface SuperAdminService {
  grantAdmin(userId: string | number): Promise<unknown>;
  revokeAdmin(userId: string | number): Promise<unknown>;
  updateUserRole(userId: string | number, role: Role): Promise<unknown>;
  listAdmins(): Promise<UserAdminResponse[]>;
}
