import { apiConfig } from "@/api/config";

export function mockDelay(extraMs = 0): Promise<void> {
  const ms = apiConfig.mockDelayMs + extraMs;
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}
