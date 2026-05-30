import { apiClient } from "@/api/client";
import type { Author, AuthorProfile, Paper } from "@/types/domain";
import type { AuthorsService } from "@/services/interfaces/authors.service";

export class HttpAuthorsService implements AuthorsService {
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
