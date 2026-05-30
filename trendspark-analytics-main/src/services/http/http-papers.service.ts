import { apiClient } from "@/api/client";
import type { Paper } from "@/types/domain";
import type { PapersService } from "@/services/interfaces/papers.service";

export class HttpPapersService implements PapersService {
  list() {
    return apiClient.get<Paper[]>("/papers");
  }

  getById(id: string) {
    return apiClient.get<Paper | null>(`/papers/${id}`);
  }

  listByCategory(category: string, excludeId?: string, limit = 4) {
    return apiClient.get<Paper[]>("/papers", {
      params: { category, excludeId, limit },
    });
  }

  listByTopic(topicId: string, limit = 50) {
    return apiClient.get<Paper[]>(`/topics/${topicId}/papers`, { params: { limit } });
  }
}
