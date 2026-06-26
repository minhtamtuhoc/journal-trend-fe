import type { AuthorsService } from "@/services/interfaces/authors.service";
import type { PageResponse } from "@/services/interfaces/papers.service";
import type { Author } from "@/types/domain";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { MOCK_TRENDING_AUTHORS } from "@/mocks/data/authors";
import { mockDelay } from "@/services/utils";

export class MockAuthorsService implements AuthorsService {
  async list(params: { page: number; size: number; q?: string; topicId?: string }): Promise<PageResponse<Author>> {
    await mockDelay();
    const q = params.q?.trim().toLowerCase();
    const filtered = q
      ? MOCK_TRENDING_AUTHORS.filter((a) => a.name.toLowerCase().includes(q))
      : MOCK_TRENDING_AUTHORS;
    
    const page = params.page ?? 0;
    const size = params.size ?? 24;
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }

  async listFeatured(limit = 24) {
    await mockDelay();
    return MOCK_TRENDING_AUTHORS.slice(0, limit);
  }

  async getById(id: string) {
    await mockDelay();
    const author = MOCK_TRENDING_AUTHORS.find((a) => a.id === id) ?? MOCK_TRENDING_AUTHORS[0];
    return { ...author, openAlexId: null, source: "Mock" };
  }

  async listPapers(_authorId: string) {
    await mockDelay();
    return MOCK_PAPERS.slice(0, 4);
  }
}
