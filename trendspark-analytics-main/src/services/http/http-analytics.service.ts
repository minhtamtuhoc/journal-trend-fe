import { apiClient } from "@/api/client";
import type { AnalyticsService, AnalyticsSnapshot } from "@/services/interfaces/analytics.service";

export class HttpAnalyticsService implements AnalyticsService {
  getSnapshot() {
    return apiClient.get<AnalyticsSnapshot>("/analytics/snapshot");
  }
}
