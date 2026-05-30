import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { queryKeys } from "@/services";
import type { TopicDetail } from "@/types/domain";

export function useTopic(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => apiClient.get<TopicDetail>(`/topics/${topicId}`),
    enabled: isBrowser && Boolean(topicId),
    ...mockQueryDefaults,
  });
}
