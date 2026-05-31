import type { Author, AuthorProfile, Paper } from "@/types/domain";

export interface AuthorsService {
  listFeatured(limit?: number): Promise<Author[]>;
  getById(id: string): Promise<AuthorProfile | null>;
  listPapers(authorId: string, limit?: number): Promise<Paper[]>;
}
