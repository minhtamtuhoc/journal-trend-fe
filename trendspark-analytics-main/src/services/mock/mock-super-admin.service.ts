import type { SuperAdminService, Role } from "@/services/interfaces/super-admin.service";
import type { UserAdminResponse } from "@/types/domain";
import { mockDelay } from "@/services/utils";
import { MOCK_USERS } from "./mock-admin.service";

export class MockSuperAdminService implements SuperAdminService {
  async grantAdmin(userId: string | number): Promise<unknown> {
    await mockDelay(150);
    const user = MOCK_USERS.find(u => String(u.id) === String(userId));
    if (user) {
      user.role = "ADMIN";
    }
    return { status: "SUCCESS" };
  }

  async revokeAdmin(userId: string | number): Promise<unknown> {
    await mockDelay(150);
    const user = MOCK_USERS.find(u => String(u.id) === String(userId));
    if (user) {
      user.role = "STUDENT";
    }
    return { status: "SUCCESS" };
  }

  async updateUserRole(userId: string | number, role: Role): Promise<unknown> {
    await mockDelay(150);
    const user = MOCK_USERS.find(u => String(u.id) === String(userId));
    if (user) {
      user.role = role;
    }
    return { status: "SUCCESS" };
  }

  async listAdmins(): Promise<UserAdminResponse[]> {
    await mockDelay(150);
    return MOCK_USERS.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
  }
}
