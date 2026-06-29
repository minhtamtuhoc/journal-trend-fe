import type { PapersService, PageResponse } from "@/services/interfaces/papers.service";
import type { Paper } from "@/types/domain";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { mockDelay } from "@/services/utils";

export class MockPapersService implements PapersService {
  async list() {
    await mockDelay();
    return [...MOCK_PAPERS];
  }

  async getById(id: string) {
    await mockDelay();
    return MOCK_PAPERS.find((p) => p.id === id) ?? null;
  }

  async listByCategory(category: string, excludeId?: string, limit = 4) {
    await mockDelay();
    return MOCK_PAPERS.filter((p) => p.category === category && p.id !== excludeId).slice(0, limit);
  }

  async listByTopic(_topicId: string, limit = 50) {
    await mockDelay();
    return MOCK_PAPERS.slice(0, limit);
  }

  async search(params: {
    q?: string;
    searchType?: "papers" | "authors" | "keywords";
    page: number;
    size: number;
    sort?: string;
    fromYear?: number;
    toYear?: number;
    category?: string;
    minCitations?: number;
  }): Promise<PageResponse<Paper>> {
    await mockDelay();
    let results = [...MOCK_PAPERS];

    if (params.q) {
      const q = params.q.toLowerCase();
      if (params.searchType === "papers") {
        results = results.filter((p) => p.title.toLowerCase().includes(q));
      } else if (params.searchType === "authors") {
        results = results.filter((p) => p.authors.some((a) => a.toLowerCase().includes(q)));
      } else if (params.searchType === "keywords") {
        results = results.filter((p) => p.keywords.some((k) => k.name.toLowerCase() === q));
      } else {
        results = results.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.authors.some((a) => a.toLowerCase().includes(q)) ||
            p.keywords.some((k) => k.name.toLowerCase().includes(q)) ||
            p.doi.toLowerCase().includes(q)
        );
      }
    }

    if (params.category && params.category !== "all") {
      results = results.filter((p) => p.category === params.category);
    }

    if (params.fromYear) {
      results = results.filter((p) => p.year >= params.fromYear!);
    }

    if (params.toYear) {
      results = results.filter((p) => p.year <= params.toYear!);
    }

    if (params.minCitations !== undefined) {
      results = results.filter((p) => p.citations >= (params.minCitations ?? 0));
    }
    // Sorting
    if (params.sort) {
      const [field, order] = params.sort.split(",");
      const desc = order === "desc";
      results.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (field === "citationCount") {
          valA = a.citations;
          valB = b.citations;
        } else if (field === "trendScore") {
          valA = a.trendScore;
          valB = b.trendScore;
        } else if (field === "publicationDate") {
          valA = a.year;
          valB = b.year;
        }
        return desc ? valB - valA : valA - valB;
      });
    }

    const totalElements = results.length;
    const totalPages = Math.ceil(totalElements / params.size);
    const start = params.page * params.size;
    const content = results.slice(start, start + params.size);

    return {
      content,
      page: params.page,
      size: params.size,
      totalElements,
      totalPages,
      first: params.page === 0,
      last: params.page >= totalPages - 1,
    };
  }

  async getAvailableYears(): Promise<number[]> {
    await mockDelay();
    const years = new Set(MOCK_PAPERS.map(p => p.year));
    return Array.from(years).sort((a, b) => b - a);
  }
}
