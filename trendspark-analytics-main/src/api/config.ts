/**
 * API configuration. Toggle mock mode via VITE_USE_MOCK=false when wiring a real backend.
 */
export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api",
  useMock: false,
  mockDelayMs: 0,
} as const;

