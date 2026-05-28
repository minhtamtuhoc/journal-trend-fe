export const queryKeys = {
  collections: {
    all: ["collections", "list"] as const,
    detail: (id: string) => ["collections", "detail", id] as const,
  },
  analytics: {
    snapshot: ["analytics", "snapshot"] as const,
  },
  papers: {
    all: ["papers", "list"] as const,
    detail: (id: string) => ["papers", "detail", id] as const,
    related: (id: string, category: string) => ["papers", "related", id, category] as const,
  },
  notifications: {
    all: ["notifications", "list"] as const,
  },
  admin: {
    overview: ["admin", "overview"] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
} as const;
