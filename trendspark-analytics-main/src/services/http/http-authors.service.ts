import { apiClient } from "@/api/client";
import type { Author, AuthorProfile, Paper } from "@/types/domain";
import type { AuthorsService } from "@/services/interfaces/authors.service";
import type { PageResponse } from "@/services/interfaces/papers.service";

export class HttpAuthorsService implements AuthorsService {
  list(params: { page: number; size: number; q?: string; topicId?: string }) {
    return apiClient.get<PageResponse<Author>>("/authors", { params });
  }

  listFeatured(limit = 24) {
    return apiClient.get<Author[]>("/authors/featured", { params: { limit } });
  }

  getById(id: string) {
    return apiClient.get<AuthorProfile>(`/authors/${id}`);
  }

  listPapers(authorId: string, limit = 50) {
    return apiClient.get<Paper[]>(`/authors/${authorId}/papers`, { params: { limit } });
  }
}
