import type { SearchHistoryEntry } from "@/types/domain";

export interface SearchHistoryService {
  recordSearch(query: string, searchType: "papers" | "authors" | "keywords"): Promise<void>;
  getRecentSearches(): Promise<SearchHistoryEntry[]>;
}
