import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import type { PersonalReportResponse } from "@/types/report";

export function usePersonalReport(filterBy: string = "ALL") {
  return useQuery({
    queryKey: ["reports", "personal", filterBy] as const,
    queryFn: () => apiClient.get<PersonalReportResponse>(`/reports/personal?filterBy=${filterBy}`),
    enabled: isBrowser,
    retry: 1,
  });
}
