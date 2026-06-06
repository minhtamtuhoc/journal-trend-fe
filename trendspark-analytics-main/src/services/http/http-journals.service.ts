import { apiClient } from "@/api/client";
import type { JournalsService } from "@/services/interfaces/journals.service";
import type { Journal } from "@/types/brief";

type HelixJournalDto = {
  id: string;
  name: string;
  publisher?: string | null;
  issn?: string | null;
  domain?: string | null;
  impactFactor?: number;
};

export class HttpJournalsService implements JournalsService {
  search(q?: string, limit = 24) {
    return apiClient.get<HelixJournalDto[]>("/journals", { params: { q, limit } }).then((rows) =>
      rows.map((r) => ({
        ...r,
        id: String(r.id),
      }))
    );
  }

  getById(id: string) {
    return apiClient.get<HelixJournalDto | null>(`/journals/${id}`).then((r) => {
      if (!r) return null;
      return {
        ...r,
        id: String(r.id),
      };
    });
  }
}
