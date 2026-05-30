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
    byTopic: (topicId: string) => ["papers", "byTopic", topicId] as const,
  },
  topics: {
    detail: (id: string) => ["topics", "detail", id] as const,
  },
  authors: {
    featured: ["authors", "featured"] as const,
    detail: (id: string) => ["authors", "detail", id] as const,
    papers: (id: string) => ["authors", "papers", id] as const,
  },
  notifications: {
    all: ["notifications", "list"] as const,
  },
  admin: {
    overview: ["admin", "overview"] as const,
    sources: ["admin", "sources"] as const,
  },
  follows: {
    topics: ["follows", "topics"] as const,
    journals: ["follows", "journals"] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
} as const;
