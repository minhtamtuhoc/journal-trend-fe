export const queryKeys = {
  collections: {
    all: ["collections", "list"] as const,
    detail: (id: string) => ["collections", "detail", id] as const,
  },
  analytics: {
    snapshot: ["analytics", "snapshot"] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
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
    list: (params: Record<string, any>) => ["authors", "list", params] as const,
    featured: ["authors", "featured"] as const,
    detail: (id: string) => ["authors", "detail", id] as const,
    papers: (id: string) => ["authors", "papers", id] as const,
    spotlight: ["authors", "spotlight"] as const,
  },
  notifications: {
    all: ["notifications", "list"] as const,
  },
  admin: {
    overview: ["admin", "overview"] as const,
    sources: ["admin", "sources"] as const,
    anomalies: ["admin", "anomalies"] as const,
    demoStats: ["admin", "demoStats"] as const,
  },
  follows: {
    topics: ["follows", "topics"] as const,
    journals: ["follows", "journals"] as const,
    authors: ["follows", "authors"] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
  },
  superAdmin: {
    admins: ["superAdmin", "admins"] as const,
    users: (q?: string, page?: number, size?: number) => ["superAdmin", "users", { q, page, size }] as const,
  },
  searchHistory: {
    recent: ["searchHistory", "recent"] as const,
  },
} as const;

