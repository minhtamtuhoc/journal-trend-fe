import type { SearchHistoryService } from "@/services/interfaces/search-history.service";
import type { SearchHistoryEntry } from "@/types/domain";

const LOCAL_STORAGE_KEY = "mock_search_history";

export class MockSearchHistoryService implements SearchHistoryService {
  private getHistory(): SearchHistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  async recordSearch(query: string, searchType: "papers" | "authors" | "keywords") {
    let history = this.getHistory();
    history = [
      { query, searchType },
      ...history.filter((h) => !(h.query.toLowerCase() === query.toLowerCase() && h.searchType === searchType)),
    ].slice(0, 10);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    }
  }

  async getRecentSearches(): Promise<SearchHistoryEntry[]> {
    return this.getHistory();
  }
}
