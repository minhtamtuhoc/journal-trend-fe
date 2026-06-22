import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSuperAdminUser, useAuth } from "@/auth";
import { getServices, queryKeys } from "@/services";
import { isBrowser } from "@/hooks/data/client-only";
import type { Role } from "@/services/interfaces/super-admin.service";

export function useListAdmins() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.superAdmin.admins,
    queryFn: () => getServices().superAdmin.listAdmins(),
    enabled: isBrowser && isSuperAdminUser(user),
    retry: 1,
  });
}

export function useSearchUsers(q?: string, page = 0, size = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.superAdmin.users(q, page, size),
    queryFn: () => getServices().admin.searchUsers(q, page, size),
    enabled: isBrowser && isSuperAdminUser(user),
    retry: 1,
  });
}

export function useGrantAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string | number) => getServices().superAdmin.grantAdmin(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.admins });
      void qc.invalidateQueries({ queryKey: ["superAdmin", "users"] });
    },
  });
}

export function useRevokeAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string | number) => getServices().superAdmin.revokeAdmin(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.admins });
      void qc.invalidateQueries({ queryKey: ["superAdmin", "users"] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string | number; role: Role }) =>
      getServices().superAdmin.updateUserRole(userId, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.admins });
      void qc.invalidateQueries({ queryKey: ["superAdmin", "users"] });
    },
  });
}
