import type { SearchSuggestionsService } from "@/services/interfaces/search-suggestions.service";
import type { SearchSuggestion } from "@/types/domain";

export class MockSearchSuggestionsService implements SearchSuggestionsService {
  async getSuggestions(q: string, limit: number = 8): Promise<SearchSuggestion[]> {
    const term = q.toLowerCase();
    const suggestions: SearchSuggestion[] = [
      { type: "keywords", id: "kw1", label: `${q} in Machine Learning`, subtitle: "Computer Science" },
      { type: "papers", id: "p1", label: `Deep Learning applications for ${q}`, subtitle: "IEEE Access (2025)" },
      { type: "authors", id: "a1", label: `Dr. Faisal ${q}`, subtitle: "Stanford University" },
      { type: "keywords", id: "kw2", label: `${q} intelligence`, subtitle: "Decision Sciences" },
      { type: "papers", id: "p2", label: `A survey on ${q} techniques`, subtitle: "ACM Computing Surveys (2024)" },
      { type: "authors", id: "a2", label: `Sarah ${q} Connor`, subtitle: "MIT" },
    ];
    return suggestions
      .filter((s) => s.label.toLowerCase().includes(term) || s.subtitle.toLowerCase().includes(term))
      .slice(0, limit);
  }
}
