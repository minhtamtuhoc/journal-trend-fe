import type { AuthorsService } from "@/services/interfaces/authors.service";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { MOCK_TRENDING_AUTHORS } from "@/mocks/data/authors";
import { mockDelay } from "@/services/utils";

export class MockAuthorsService implements AuthorsService {
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
