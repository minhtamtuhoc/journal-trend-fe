import { apiClient } from "@/api/client";
import type { Paper, PaperSource } from "@/types/domain";
import type { PapersService, PageResponse, GraphPaperNode } from "@/services/interfaces/papers.service";

interface BackendPaperDetail {
  id: number;
  title: string;
  abstractText: string;
  publicationDate: string | null;
  citationCount: number;
  doi: string;
  sourceUrl: string;
  pdfUrl: string;
  openAccess: boolean;
  journal: string;
  journalId: number | null;
  primarySource: string;
  status: string;
  createdAt: string;
  keywords: Array<{ keywordId: number; term: string; domain: string; trendScore: number }>;
  authors: Array<{ id: number; name: string; affiliation: string; authorPosition?: string }>;
}

interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function toPaperDomainModel(p: BackendPaperDetail): Paper {
  const year = p.publicationDate ? new Date(p.publicationDate).getFullYear() : new Date().getFullYear();
  const keywords = p.keywords
    ? p.keywords.map((k) => ({ id: String(k.keywordId), name: k.term, trendScore: k.trendScore }))
    : [];
  const category = keywords.length > 0 ? keywords[0].name : "General";

  const currentYear = new Date().getFullYear();
  const diff = Math.max(1.0, (currentYear - year + 1.0) * 1.5);
  const impactFactor = Number((p.citationCount / diff).toFixed(3));

  return {
    id: String(p.id),
    title: p.title,
    authors: p.authors ? p.authors.map((a) => a.name) : [],
    authorRefs: p.authors
      ? p.authors.map((a) => ({ id: String(a.id), name: a.name, authorPosition: a.authorPosition as any }))
      : [],
    journal: p.journal || "Unknown Journal",
    journalId: p.journalId ? String(p.journalId) : null,
    year,
    citations: p.citationCount,
    trendScore: p.keywords ? Math.max(0, ...p.keywords.map((k) => k.trendScore || 0)) : 0,
    keywords,
    category,
    impactFactor,
    doi: p.doi || "",
    abstract: p.abstractText || "",
    source: (p.primarySource === "OPENALEX" ? "OpenAlex" : p.primarySource === "SEMANTIC_SCHOLAR" ? "Semantic Scholar" : "CrossRef") as PaperSource,
    openAccess: p.openAccess,
  };
}

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

  async search(params: {
    q?: string;
    searchType?: "papers" | "authors" | "keywords";
    topicId?: number;
    page: number;
    size: number;
    sort?: string;
    fromYear?: number;
    toYear?: number;
    category?: string;
    minCitations?: number;
  }): Promise<PageResponse<Paper>> {
    const res = await apiClient.get<BackendApiResponse<PageResponse<BackendPaperDetail>>>("/v1/papers", {
      params: {
        q: params.q || undefined,
        searchType: params.searchType || undefined,
        topicId: params.topicId,
        page: params.page,
        size: params.size,
        sort: params.sort,
        fromYear: params.fromYear,
        toYear: params.toYear,
        category: params.category && params.category !== "all" ? params.category : undefined,
        minCitations: params.minCitations,
      },
    });
    const pageData = res.data;
    return {
      content: pageData.content.map(toPaperDomainModel),
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      first: pageData.first,
      last: pageData.last,
    };
  }

  async getAvailableYears(): Promise<number[]> {
    const res = await apiClient.get<BackendApiResponse<number[]>>("/v1/papers/years");
    return res.data;
  }

  getReferences(id: string, limit = 50) {
    return apiClient.get<GraphPaperNode[]>(`/papers/${id}/references`, {
      params: { limit }
    });
  }

  getCitations(
    id: string,
    params: { sort?: string; yearFrom?: number; yearTo?: number; limit?: number }
  ) {
    return apiClient.get<GraphPaperNode[]>(`/papers/${id}/citations`, {
      params: {
        sort: params.sort,
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
        limit: params.limit,
      }
    });
  }

  async getByIds(ids: string[]): Promise<Paper[]> {
    if (ids.length === 0) return [];
    const res = await apiClient.get<BackendApiResponse<BackendPaperDetail[]>>("/v1/papers/bulk", {
      params: { ids: ids.join(",") }
    });
    return res.data.map(toPaperDomainModel);
  }
}
