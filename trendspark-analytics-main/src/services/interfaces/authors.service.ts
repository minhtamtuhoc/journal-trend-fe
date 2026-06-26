import type { Author, AuthorProfile, Paper } from "@/types/domain";
import type { PageResponse } from "./papers.service";

export interface AuthorsService {
  list(params: { page: number; size: number; q?: string; topicId?: string }): Promise<PageResponse<Author>>;
  listFeatured(limit?: number): Promise<Author[]>;
  getById(id: string): Promise<AuthorProfile | null>;
  listPapers(authorId: string, limit?: number): Promise<Paper[]>;
}
