import type { AuthorsService } from "@/services/interfaces/authors.service";
import type { PageResponse } from "@/services/interfaces/papers.service";
import type { Author, AuthorSpotlight, AuthorSpotlightEntry } from "@/types/domain";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { MOCK_TRENDING_AUTHORS } from "@/mocks/data/authors";
import { mockDelay } from "@/services/utils";

export class MockAuthorsService implements AuthorsService {
  async list(params: { page: number; size: number; q?: string; topicId?: string; sort?: "papers" | "citations" | "hIndex" }): Promise<PageResponse<Author>> {
    await mockDelay();
    const q = params.q?.trim().toLowerCase();
    let filtered = q
      ? MOCK_TRENDING_AUTHORS.filter((a) => a.name.toLowerCase().includes(q))
      : MOCK_TRENDING_AUTHORS;
    
    const sort = params.sort || "citations";
    if (sort === "papers") {
      filtered = filtered.filter((a) => a.papers > 0);
      filtered = [...filtered].sort((a, b) => b.papers - a.papers);
    } else if (sort === "hIndex") {
      filtered = [...filtered].sort((a, b) => b.hIndex - a.hIndex);
    } else {
      filtered = [...filtered].sort((a, b) => b.citations - a.citations);
    }
    
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

  async getSpotlight(): Promise<AuthorSpotlight> {
    await mockDelay();
    const sortedByPapers = [...MOCK_TRENDING_AUTHORS].sort((a, b) => b.papers - a.papers);
    const sortedByCitations = [...MOCK_TRENDING_AUTHORS].sort((a, b) => b.citations - a.citations);
    const sortedByHIndex = [...MOCK_TRENDING_AUTHORS].sort((a, b) => b.hIndex - a.hIndex);

    const mapMock = (a?: Author): AuthorSpotlightEntry | null => {
      if (!a) return null;
      return {
        id: a.id,
        name: a.name,
        affiliation: a.affiliation,
        papers: a.papers,
        citations: a.citations,
        hIndex: a.hIndex,
      };
    };

    return {
      mostPapers: mapMock(sortedByPapers[0]),
      mostCitations: mapMock(sortedByCitations[0]),
      mostHIndex: mapMock(sortedByHIndex[0]),
    };
  }
}
