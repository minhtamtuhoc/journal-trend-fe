import type { Paper } from "@/types/domain";

export interface PapersService {
  list(): Promise<Paper[]>;
  getById(id: string): Promise<Paper | null>;
  listByCategory(category: string, excludeId?: string, limit?: number): Promise<Paper[]>;
  listByTopic(topicId: string, limit?: number): Promise<Paper[]>;
}
