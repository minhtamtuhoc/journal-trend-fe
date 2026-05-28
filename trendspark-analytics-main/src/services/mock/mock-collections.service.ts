import type { CollectionsService, CreateCollectionInput, UpdateCollectionInput } from "@/services/interfaces/collections.service";
import { MOCK_COLLECTIONS } from "@/mocks/data/collections";
import type { Collection } from "@/types/domain";
import { mockDelay } from "@/services/utils";

let db: Collection[] = [...MOCK_COLLECTIONS];
let nextId = db.length + 1;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export class MockCollectionsService implements CollectionsService {
  async list() {
    await mockDelay(150);
    return [...db].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  async getById(id: string) {
    await mockDelay(100);
    return db.find((c) => c.id === id) ?? null;
  }

  async create(input: CreateCollectionInput) {
    await mockDelay(250);
    const name = normalizeName(input.name);
    if (!name) throw new Error("Collection name is required");
    if (db.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("A collection with this name already exists");
    }

    const created: Collection = {
      id: `col_${nextId++}`,
      name,
      paperIds: [],
      updatedAt: nowIso(),
    };

    db = [created, ...db];
    return created;
  }

  async update(id: string, input: UpdateCollectionInput) {
    await mockDelay(250);
    const idx = db.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Collection not found");

    const name = normalizeName(input.name);
    if (!name) throw new Error("Collection name is required");
    if (db.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("A collection with this name already exists");
    }

    const updated: Collection = { ...db[idx], name, updatedAt: nowIso() };
    db = db.map((c) => (c.id === id ? updated : c));
    return updated;
  }

  async delete(id: string) {
    await mockDelay(250);
    const exists = db.some((c) => c.id === id);
    if (!exists) throw new Error("Collection not found");
    db = db.filter((c) => c.id !== id);
    return { id };
  }
}

