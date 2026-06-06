import type { Journal } from "@/types/brief";

export interface JournalsService {
  search(q?: string, limit?: number): Promise<Journal[]>;
  getById(id: string): Promise<Journal | null>;
}
