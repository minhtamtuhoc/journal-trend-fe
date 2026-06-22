import { apiClient } from "@/api/client";
import type { UserAdminResponse } from "@/types/domain";
import type { SuperAdminService, Role } from "@/services/interfaces/super-admin.service";

interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export class HttpSuperAdminService implements SuperAdminService {
  async grantAdmin(userId: string | number): Promise<unknown> {
    const res = await apiClient.post<BackendApiResponse<unknown>>(`/v1/super-admin/users/${userId}/grant-admin`);
    return res.data;
  }

  async revokeAdmin(userId: string | number): Promise<unknown> {
    const res = await apiClient.post<BackendApiResponse<unknown>>(`/v1/super-admin/users/${userId}/revoke-admin`);
    return res.data;
  }

  async updateUserRole(userId: string | number, role: Role): Promise<unknown> {
    const res = await apiClient.put<BackendApiResponse<unknown>>(`/v1/super-admin/users/${userId}/role`, { role });
    return res.data;
  }

  async listAdmins(): Promise<UserAdminResponse[]> {
    const res = await apiClient.get<BackendApiResponse<UserAdminResponse[]>>("/v1/super-admin/admins");
    return res.data;
  }
}
