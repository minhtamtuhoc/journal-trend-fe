import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import type { PersonalReportResponse } from "@/types/report";

export function usePersonalReport(filterBy: string = "ALL", months: number = 3) {
  return useQuery({
    queryKey: ["reports", "personal", filterBy, months] as const,
    queryFn: () => apiClient.get<PersonalReportResponse>(`/reports/personal?filterBy=${filterBy}&months=${months}`),
    placeholderData: keepPreviousData,
    enabled: isBrowser,
    retry: 1,
  });
}

