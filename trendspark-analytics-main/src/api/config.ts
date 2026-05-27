/**
 * API configuration. Toggle mock mode via VITE_USE_MOCK=false when wiring a real backend.
 */
export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api",
  useMock: (import.meta.env.VITE_USE_MOCK as string | undefined) !== "false",
  mockDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 0),
} as const;
