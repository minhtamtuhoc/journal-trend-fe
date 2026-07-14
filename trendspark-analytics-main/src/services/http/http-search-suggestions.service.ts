import { apiClient } from "@/api/client";
import type { SearchSuggestionsService } from "@/services/interfaces/search-suggestions.service";
import type { SearchSuggestion } from "@/types/domain";

type SearchSuggestionDto = {
  type: "PAPERS" | "AUTHORS" | "KEYWORDS";
  id: string;
  label: string;
  subtitle: string | null;
};

interface BackendApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export class HttpSearchSuggestionsService implements SearchSuggestionsService {
  async getSuggestions(q: string, limit?: number): Promise<SearchSuggestion[]> {
    const res = await apiClient.get<BackendApiResponse<SearchSuggestionDto[]>>("/v1/search/suggestions", {
      params: { q, limit },
    });
    if (!res || !res.data) return [];
    return res.data.map((r) => ({
      type: r.type.toLowerCase() as SearchSuggestion["type"],
      id: r.id,
      label: r.label,
      subtitle: r.subtitle ?? "",
    }));
  }
}
