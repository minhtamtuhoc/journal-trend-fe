import { apiClient } from "@/api/client";
import type { Author, AuthorProfile, Paper, AuthorSpotlight, AuthorSpotlightEntry } from "@/types/domain";
import type { AuthorsService } from "@/services/interfaces/authors.service";
import type { PageResponse } from "@/services/interfaces/papers.service";

type AuthorDto = {
  id: number;
  name: string;
  affiliation?: string | null;
  citationCount: number;
  papers?: number | null;
  hIndex?: number | null;
};

type SpotlightDto = {
  mostPapers: AuthorDto | null;
  mostCitations: AuthorDto | null;
  mostHIndex: AuthorDto | null;
};

interface BackendApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

function mapEntry(dto: AuthorDto | null): AuthorSpotlightEntry | null {
  if (!dto) return null;
  return {
    id: String(dto.id),
    name: dto.name,
    affiliation: dto.affiliation ?? "",
    papers: dto.papers ?? 0,
    citations: dto.citationCount,
    hIndex: dto.hIndex ?? (dto as any).HIndex ?? (dto as any).hindex ?? 0,
  };
}

export class HttpAuthorsService implements AuthorsService {
  list(params: { page: number; size: number; q?: string; topicId?: string; sort?: string }) {
    return apiClient.get<PageResponse<Author>>("/authors", { params });
  }

  listFeatured(limit = 24) {
    return apiClient.get<Author[]>("/authors/featured", { params: { limit } });
  }

  getById(id: string) {
    return apiClient.get<AuthorProfile>(`/authors/${id}`);
  }

  listPapers(authorId: string) {
    return apiClient.get<Paper[]>(`/authors/${authorId}/papers`);
  }

  async getSpotlight(): Promise<AuthorSpotlight> {
    const res = await apiClient.get<BackendApiResponse<SpotlightDto>>("/v1/authors/spotlight");
    if (!res || !res.data) {
      return {
        mostPapers: null,
        mostCitations: null,
        mostHIndex: null,
      };
    }
    const dto = res.data;
    return {
      mostPapers: mapEntry(dto.mostPapers),
      mostCitations: mapEntry(dto.mostCitations),
      mostHIndex: mapEntry(dto.mostHIndex),
    };
  }
}

