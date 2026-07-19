import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import type { ForecastDetail, ForecastListItem } from "@/types/forecast";

// Danh sách top N — cache 1 giờ (kết quả thay đổi không thường xuyên)
export function useForecastList(limit = 10, months = 6) {
  return useQuery({
    queryKey: ["forecast", "list", limit, months],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ForecastListItem[] }>("/v1/trends/forecast", {
        params: { limit, months },
      });
      return res.data;
    },
    enabled: isBrowser,
    staleTime: 1000 * 60 * 60,
  });
}

// Chi tiết 1 keyword
export function useForecastDetail(keywordId: number | null, months = 6) {
  return useQuery({
    queryKey: ["forecast", "detail", keywordId, months],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ForecastDetail }>(`/v1/trends/forecast/${keywordId}`, {
        params: { months },
      });
      return res.data;
    },
    enabled: isBrowser && keywordId !== null,
    staleTime: 1000 * 60 * 60,
  });
}

// Chạy lại job (nút Run Forecast) — invalidate cache để bảng tự refresh
export function useRunForecast() {
  const queryClient = useQueryClient();
  return useMutation<ForecastListItem[], unknown, { limit: number; months: number }>({
    mutationFn: async ({ limit, months }) => {
      const res = await apiClient.post<{ data: ForecastListItem[] }>(
        `/v1/trends/forecast/run?limit=${limit}&months=${months}`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });
}

