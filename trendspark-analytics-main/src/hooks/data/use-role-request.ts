import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, isAdminUser } from "@/auth";
import { queryKeys } from "@/services";
import { roleService } from "@/services/http/http-role.service";
import { isBrowser } from "@/hooks/data/client-only";
import type {
  RoleUpgradeRequestCreateRequest,
  RoleRequestApproveRequest,
  RoleRequestRejectRequest,
  RoleRequestStatus,
} from "@/types/role-request";

export function useMyRoleRequest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.roleRequest.me,
    queryFn: () => roleService.getMyRoleRequest(),
    enabled: isBrowser && Boolean(user),
    retry: 1,
  });
}

export function useSubmitRoleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoleUpgradeRequestCreateRequest) => roleService.submitRoleRequest(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.roleRequest.me });
    },
  });
}

export function useAdminRoleRequests(status: RoleRequestStatus = "PENDING", page = 0, size = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.roleRequest.list(status, page, size),
    queryFn: () => roleService.listRoleRequests(status, page, size),
    enabled: isBrowser && isAdminUser(user),
    retry: 1,
  });
}

export function useApproveRoleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: number; body?: RoleRequestApproveRequest }) =>
      roleService.approveRoleRequest(requestId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["roleRequest"] });
    },
  });
}

export function useRejectRoleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: number; body: RoleRequestRejectRequest }) =>
      roleService.rejectRoleRequest(requestId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["roleRequest"] });
    },
  });
}

export function useRoleLogs(targetUserId?: number, page = 0, size = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.roleRequest.logs(targetUserId, page, size),
    queryFn: () => roleService.listRoleLogs(targetUserId, page, size),
    enabled: isBrowser && isAdminUser(user),
    retry: 1,
  });
}
