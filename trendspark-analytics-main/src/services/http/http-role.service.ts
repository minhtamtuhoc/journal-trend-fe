import { apiClient } from "@/api/client";
import type { PageResponse } from "@/services/interfaces/papers.service";
import type {
  RoleUpgradeRequestResponse,
  RoleChangeLogResponse,
  RoleUpgradeRequestCreateRequest,
  RoleRequestApproveRequest,
  RoleRequestRejectRequest,
  RoleRequestStatus,
} from "@/types/role-request";

interface BackendApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

function unwrapResponse<T>(res: T | BackendApiResponse<T>): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as BackendApiResponse<T>).data;
  }
  return res as T;
}

export class HttpRoleService {
  /**
   * Nộp đơn xin đổi role (dành cho User).
   */
  async submitRoleRequest(data: RoleUpgradeRequestCreateRequest): Promise<RoleUpgradeRequestResponse> {
    const res = await apiClient.post<BackendApiResponse<RoleUpgradeRequestResponse>>("/v1/users/me/role-request", data);
    return unwrapResponse(res);
  }

  /**
   * Lấy đơn xin đổi role đang PENDING của user hiện tại (trả về null nếu không có).
   */
  async getMyRoleRequest(): Promise<RoleUpgradeRequestResponse | null> {
    const res = await apiClient.get<BackendApiResponse<RoleUpgradeRequestResponse | null>>("/v1/users/me/role-request");
    return unwrapResponse(res);
  }

  /**
   * Admin xem danh sách đơn xin đổi role (mặc định PENDING, hỗ trợ lọc theo status).
   */
  async listRoleRequests(
    status: RoleRequestStatus = "PENDING",
    page = 0,
    size = 20
  ): Promise<PageResponse<RoleUpgradeRequestResponse>> {
    const res = await apiClient.get<BackendApiResponse<PageResponse<RoleUpgradeRequestResponse>>>("/v1/admin/role-requests", {
      params: { status, page, size },
    });
    return unwrapResponse(res);
  }

  /**
   * Admin duyệt đơn xin đổi role.
   */
  async approveRoleRequest(
    requestId: number,
    body?: RoleRequestApproveRequest
  ): Promise<RoleUpgradeRequestResponse> {
    const res = await apiClient.post<BackendApiResponse<RoleUpgradeRequestResponse>>(
      `/v1/admin/role-requests/${requestId}/approve`,
      body
    );
    return unwrapResponse(res);
  }

  /**
   * Admin từ chối đơn xin đổi role kèm lý do chọn từ dropdown 5 Enum cố định.
   */
  async rejectRoleRequest(
    requestId: number,
    body: RoleRequestRejectRequest
  ): Promise<RoleUpgradeRequestResponse> {
    const res = await apiClient.post<BackendApiResponse<RoleUpgradeRequestResponse>>(
      `/v1/admin/role-requests/${requestId}/reject`,
      body
    );
    return unwrapResponse(res);
  }

  /**
   * Nhật ký các lần đổi role thành công (Role Logs) phục vụ kiểm toán.
   */
  async listRoleLogs(
    targetUserId?: number,
    page = 0,
    size = 20
  ): Promise<PageResponse<RoleChangeLogResponse>> {
    const res = await apiClient.get<BackendApiResponse<PageResponse<RoleChangeLogResponse>>>("/v1/admin/role-logs", {
      params: { targetUserId, page, size },
    });
    return unwrapResponse(res);
  }
}

export const roleService = new HttpRoleService();
