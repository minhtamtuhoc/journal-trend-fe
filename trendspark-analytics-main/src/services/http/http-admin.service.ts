import { apiClient } from "@/api/client";
import type { AdminOverview, AdminService } from "@/services/interfaces/admin.service";

export class HttpAdminService implements AdminService {
  getOverview() {
    return apiClient.get<AdminOverview>("/admin/overview");
  }
}
