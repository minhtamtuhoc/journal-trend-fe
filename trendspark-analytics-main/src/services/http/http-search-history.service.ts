import { apiClient } from "@/api/client";
import type { SearchHistoryService } from "@/services/interfaces/search-history.service";
import type { SearchHistoryEntry } from "@/types/domain";

type SearchHistoryDto = {
  query: string;
  searchType: "PAPERS" | "AUTHORS" | "KEYWORDS";
};

interface BackendApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export class HttpSearchHistoryService implements SearchHistoryService {
  recordSearch(query: string, searchType: "papers" | "authors" | "keywords"): Promise<void> {
    return apiClient.post<void>("/v1/search-history", {
      query,
      searchType: searchType.toUpperCase(),
    });
  }

  async getRecentSearches(): Promise<SearchHistoryEntry[]> {
    const res = await apiClient.get<BackendApiResponse<SearchHistoryDto[]>>("/v1/search-history/recent");
    if (!res || !res.data) return [];
    return res.data.map((r) => ({
      query: r.query,
      searchType: r.searchType.toLowerCase() as SearchHistoryEntry["searchType"],
    }));
  }
}
