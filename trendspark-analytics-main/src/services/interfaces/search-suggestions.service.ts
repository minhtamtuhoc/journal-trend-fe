import type { SearchSuggestion } from "@/types/domain";

export interface SearchSuggestionsService {
  getSuggestions(q: string, limit?: number): Promise<SearchSuggestion[]>;
}
