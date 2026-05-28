import { apiClient } from "@/api/client";
import type { Collection } from "@/types/domain";
import type {
  CollectionsService,
  CreateCollectionInput,
  RemovePaperFromCollectionInput,
  SavePaperToCollectionsInput,
  UpdateCollectionInput,
} from "@/services/interfaces/collections.service";

export class HttpCollectionsService implements CollectionsService {
  list() {
    return apiClient.get<Collection[]>("/collections");
  }

  getById(id: string) {
    return apiClient.get<Collection | null>(`/collections/${id}`);
  }

  create(input: CreateCollectionInput) {
    return apiClient.post<Collection>("/collections", input);
  }

  update(id: string, input: UpdateCollectionInput) {
    return apiClient.put<Collection>(`/collections/${id}`, input);
  }

  delete(id: string) {
    return apiClient.delete<{ id: string }>(`/collections/${id}`);
  }

  savePaperToCollections(input: SavePaperToCollectionsInput) {
    return apiClient.post<Collection[]>("/collections/save", input);
  }

  removePaperFromCollection(input: RemovePaperFromCollectionInput) {
    return apiClient.post<Collection>("/collections/remove", input);
  }
}

