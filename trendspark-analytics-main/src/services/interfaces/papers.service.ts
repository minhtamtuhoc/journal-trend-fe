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

export interface GraphPaperNode {
  openAlexId: string;
  title: string;
  year: number;
  doi: string;
  citations: number | null;
  localPaperId: string | null;
  existsLocally: boolean;
}

export interface PapersService {
  list(): Promise<Paper[]>;
  getById(id: string): Promise<Paper | null>;
  listByCategory(category: string, excludeId?: string, limit?: number): Promise<Paper[]>;
  listByTopic(topicId: string, limit?: number): Promise<Paper[]>;
  search(params: {
    q?: string;
    searchType?: "papers" | "authors" | "keywords";
    topicId?: number;
    page: number;
    size: number;
    sort?: string;
    fromYear?: number;
    toYear?: number;
    month?: number;
    category?: string;
    minCitations?: number;
  }): Promise<PageResponse<Paper>>;
  getAvailableYears(): Promise<number[]>;
  getReferences(id: string, limit?: number): Promise<GraphPaperNode[]>;
  getCitations(
    id: string,
    params: { sort?: string; yearFrom?: number; yearTo?: number; limit?: number }
  ): Promise<GraphPaperNode[]>;
  getByIds(ids: string[]): Promise<Paper[]>;
}
