import type { PapersService } from "@/services/interfaces/papers.service";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { mockDelay } from "@/services/utils";

export class MockPapersService implements PapersService {
  async list() {
    await mockDelay();
    return [...MOCK_PAPERS];
  }

  async getById(id: string) {
    await mockDelay();
    return MOCK_PAPERS.find((p) => p.id === id) ?? null;
  }

  async listByCategory(category: string, excludeId?: string, limit = 4) {
    await mockDelay();
    return MOCK_PAPERS.filter((p) => p.category === category && p.id !== excludeId).slice(0, limit);
  }

  async listByTopic(_topicId: string, limit = 50) {
    await mockDelay();
    return MOCK_PAPERS.slice(0, limit);
  }
}
