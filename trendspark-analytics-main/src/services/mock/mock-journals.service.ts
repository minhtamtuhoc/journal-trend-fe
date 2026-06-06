import type { JournalsService } from "@/services/interfaces/journals.service";
import type { Journal } from "@/types/brief";
import { mockDelay } from "@/services/utils";

const MOCK_JOURNALS: Journal[] = [
  { id: "1", name: "Journal of Cryptology", publisher: "Springer", issn: "0933-0798", domain: "Computer Science", impactFactor: 5.2 },
  { id: "2", name: "Nature Communications", publisher: "Nature Publishing Group", issn: "2041-1723", domain: "Science", impactFactor: 17.7 },
  { id: "3", name: "IEEE Transactions on Neural Networks", publisher: "IEEE", issn: "1045-9227", domain: "Computer Science", impactFactor: 14.3 },
  { id: "4", name: "Cell", publisher: "Cell Press", issn: "0092-8674", domain: "Bio-Tech", impactFactor: 66.8 },
  { id: "5", name: "Nature Energy", publisher: "Nature Publishing Group", issn: "2058-7546", domain: "Materials", impactFactor: 56.7 },
  { id: "6", name: "Science", publisher: "AAAS", issn: "0036-8075", domain: "Science", impactFactor: 56.9 },
  { id: "7", name: "Nature Climate Change", publisher: "Nature Publishing Group", issn: "1758-678X", domain: "Climate", impactFactor: 29.6 },
  { id: "8", name: "IEEE Transactions on Visualization", publisher: "IEEE", issn: "1077-2626", domain: "Computer Science", impactFactor: 5.6 },
];

export class MockJournalsService implements JournalsService {
  async search(q?: string, limit = 24) {
    await mockDelay(100);
    let list = [...MOCK_JOURNALS];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((j) => j.name.toLowerCase().includes(needle) || (j.domain && j.domain.toLowerCase().includes(needle)));
    }
    return list.slice(0, limit);
  }

  async getById(id: string) {
    await mockDelay(100);
    return MOCK_JOURNALS.find((j) => j.id === id) ?? null;
  }
}
