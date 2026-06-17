import type { Paper } from "@/types/domain";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PapersService {
  list(): Promise<Paper[]>;
  getById(id: string): Promise<Paper | null>;
  listByCategory(category: string, excludeId?: string, limit?: number): Promise<Paper[]>;
  listByTopic(topicId: string, limit?: number): Promise<Paper[]>;
  search(params: {
    q?: string;
    page: number;
    size: number;
    sort?: string;
    fromYear?: number;
    toYear?: number;
    category?: string;
    minCitations?: number;
  }): Promise<PageResponse<Paper>>;
  getAvailableYears(): Promise<number[]>;
}
