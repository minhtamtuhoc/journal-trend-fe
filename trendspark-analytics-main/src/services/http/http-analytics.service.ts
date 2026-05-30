import { apiClient } from "@/api/client";
import { normalizeAnalyticsSnapshot } from "@/lib/normalize-analytics";
import type { AnalyticsService, AnalyticsSnapshot } from "@/services/interfaces/analytics.service";

export class HttpAnalyticsService implements AnalyticsService {
  async getSnapshot() {
    const raw = await apiClient.get<AnalyticsSnapshot>("/analytics/snapshot");
    return normalizeAnalyticsSnapshot(raw);
  }
}
