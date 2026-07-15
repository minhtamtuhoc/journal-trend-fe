/**
 * API configuration. Toggle mock mode via VITE_USE_MOCK=false when wiring a real backend.
 */
export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api",
  useMock: false,
  mockDelayMs: 0,
} as const;

