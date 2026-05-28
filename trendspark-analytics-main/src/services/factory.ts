import { apiConfig } from "@/api/config";
import type { AdminService } from "@/services/interfaces/admin.service";
import type { AnalyticsService } from "@/services/interfaces/analytics.service";
import type { AuthService } from "@/services/interfaces/auth.service";
import type { CollectionsService } from "@/services/interfaces/collections.service";
import type { NotificationsService } from "@/services/interfaces/notifications.service";
import type { PapersService } from "@/services/interfaces/papers.service";
import { MockAdminService } from "@/services/mock/mock-admin.service";
import { MockAnalyticsService } from "@/services/mock/mock-analytics.service";
import { MockAuthService } from "@/services/mock/mock-auth.service";
import { MockCollectionsService } from "@/services/mock/mock-collections.service";
import { MockNotificationsService } from "@/services/mock/mock-notifications.service";
import { MockPapersService } from "@/services/mock/mock-papers.service";
import { HttpAdminService } from "@/services/http/http-admin.service";
import { HttpAnalyticsService } from "@/services/http/http-analytics.service";
import { HttpAuthService } from "@/services/http/http-auth.service";
import { HttpCollectionsService } from "@/services/http/http-collections.service";
import { HttpNotificationsService } from "@/services/http/http-notifications.service";
import { HttpPapersService } from "@/services/http/http-papers.service";

export type AppServices = {
  analytics: AnalyticsService;
  papers: PapersService;
  notifications: NotificationsService;
  admin: AdminService;
  auth: AuthService;
  collections: CollectionsService;
};

function createMockServices(): AppServices {
  return {
    analytics: new MockAnalyticsService(),
    papers: new MockPapersService(),
    notifications: new MockNotificationsService(),
    admin: new MockAdminService(),
    auth: new MockAuthService(),
    collections: new MockCollectionsService(),
  };
}

function createHttpServices(): AppServices {
  return {
    analytics: new HttpAnalyticsService(),
    papers: new HttpPapersService(),
    notifications: new HttpNotificationsService(),
    admin: new HttpAdminService(),
    auth: new HttpAuthService(),
    collections: new HttpCollectionsService(),
  };
}

let services: AppServices | null = null;

export function getServices(): AppServices {
  if (!services) {
    services = apiConfig.useMock ? createMockServices() : createHttpServices();
  }
  return services;
}

/** Reset singleton (useful in tests when toggling mock mode). */
export function resetServices(): void {
  services = null;
}
