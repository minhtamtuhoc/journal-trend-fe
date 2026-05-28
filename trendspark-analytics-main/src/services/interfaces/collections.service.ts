import type { Collection } from "@/types/domain";

export type CreateCollectionInput = {
  name: string;
};

export type UpdateCollectionInput = {
  name: string;
};

export type SavePaperToCollectionsInput = {
  paperId: string;
  collectionIds: string[];
};

export interface CollectionsService {
  list(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | null>;
  create(input: CreateCollectionInput): Promise<Collection>;
  update(id: string, input: UpdateCollectionInput): Promise<Collection>;
  delete(id: string): Promise<{ id: string }>;

  /** Adds a paper to one or more collections (idempotent per collection). */
  savePaperToCollections(input: SavePaperToCollectionsInput): Promise<Collection[]>;
}

