import type { AnalyticsService, AnalyticsSnapshot } from "@/services/interfaces/analytics.service";
import { mockAnalyticsSnapshot } from "@/hooks/data/query-options";
import { mockDelay } from "@/services/utils";

export class MockAnalyticsService implements AnalyticsService {
  async getSnapshot(): Promise<AnalyticsSnapshot> {
    await mockDelay();
    return mockAnalyticsSnapshot;
  }
}
