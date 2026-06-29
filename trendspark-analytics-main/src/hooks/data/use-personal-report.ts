import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import type { PersonalReportResponse } from "@/types/report";

export function usePersonalReport() {
  return useQuery({
    queryKey: ["reports", "personal"] as const,
    queryFn: () => apiClient.get<PersonalReportResponse>("/reports/personal"),
    enabled: isBrowser,
    retry: 1,
  });
}
